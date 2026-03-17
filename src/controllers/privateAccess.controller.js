import { query } from "../config/db.js";
import { HttpError } from "../utils/httpError.js";
import { notifyUser } from "../services/notification.service.js";

export const createRequest = async (req, res) => {
  const { profileId, message } = req.body;
  const { rows: profileRows } = await query("SELECT id, user_id FROM profiles WHERE id = $1 LIMIT 1", [profileId]);
  const profile = profileRows[0];
  if (!profile) throw new HttpError(404, "Profile not found");
  if (profile.user_id === req.user.userId) throw new HttpError(400, "Cannot request your own profile");
  
  // 10 Requests per month limit (Only counts user-initiated requests)
  const { rows: monthCount } = await query(
    `
      SELECT COUNT(*)::int AS total 
      FROM photo_access_requests 
      WHERE requester_id = $1 
      AND is_reciprocal = false
      AND created_at >= date_trunc('month', now())
    `,
    [req.user.userId]
  );

  if (monthCount[0].total >= 10) {
    throw new HttpError(403, "Monthly request limit reached (10 requests per month)");
  }

  const { rows: existing } = await query(
    `
      SELECT * FROM photo_access_requests
      WHERE requester_id = $1 AND profile_id = $2
      LIMIT 1
    `,
    [req.user.userId, profileId]
  );
  if (existing[0]) {
    return res.json({
      success: true,
      message: "Request already exists",
      data: existing[0],
    });
  }

  const { rows } = await query(
    `
      INSERT INTO photo_access_requests (requester_id, profile_id, status)
      VALUES ($1, $2, 'pending')
      RETURNING *
    `,
    [req.user.userId, profileId]
  );

  // Send Notification (Fire and forget to avoid blocking the response)
  const getRequesterNameAndNotify = async () => {
    try {
      const { rows: requesterRows } = await query("SELECT full_name FROM profiles WHERE user_id = $1 LIMIT 1", [req.user.userId]);
      const requesterName = requesterRows[0]?.full_name || "Someone";
      
      await notifyUser({
        userId: profile.user_id,
        type: "photo_access_request",
        title: "New Photo Access Request",
        message: `${requesterName} has requested access to view your private photos and family details.`,
        targetId: rows[0].id,
        targetType: "photo_access_request",
        data: { requestId: rows[0].id }
      });
    } catch (err) {
      console.error("[NotificationError]", err);
    }
  };

  getRequesterNameAndNotify();

  return res.status(201).json({
    success: true,
    message: "Request sent",
    data: rows[0],
  });
};

export const listIncoming = async (req, res) => {
  const { rows } = await query(
    `
      SELECT
        r.*,
        p.profile_id AS target_profile_code,
        (
          SELECT row_to_json(rp.*)
          FROM (
            SELECT
              id, user_id, profile_id, full_name, city, state, photo_url, gender
            FROM profiles
            WHERE user_id = r.requester_id
          ) rp
        ) AS requester_profile
      FROM photo_access_requests r
      JOIN profiles p ON p.id = r.profile_id
      WHERE p.user_id = $1
      ORDER BY r.created_at DESC
    `,
    [req.user.userId]
  );

  return res.json({ success: true, message: "Incoming requests", data: rows });
};

export const listSent = async (req, res) => {
  const { rows } = await query(
    `
      SELECT
        r.*,
        p.profile_id AS target_profile_code,
        (
          SELECT row_to_json(tp.*)
          FROM (
            SELECT
              id, user_id, profile_id, full_name, city, state, photo_url, gender,
              DATE_PART('year', AGE(date_of_birth))::int AS age_years
            FROM profiles
            WHERE id = r.profile_id
          ) tp
        ) AS target_profile
      FROM photo_access_requests r
      JOIN profiles p ON p.id = r.profile_id
      WHERE r.requester_id = $1
      ORDER BY r.created_at DESC
    `,
    [req.user.userId]
  );

  return res.json({ success: true, message: "Sent requests", data: rows });
};

export const updateRequest = async (req, res) => {
  const { requestId } = req.params;
  const { action } = req.body;
  const status = action === "approve" ? "approved" : "rejected";

  const { rows } = await query(
    `
      SELECT r.*, p.user_id AS owner_user_id
      FROM photo_access_requests r
      JOIN profiles p ON p.id = r.profile_id
      WHERE r.id = $1
      LIMIT 1
    `,
    [requestId]
  );
  const request = rows[0];
  if (!request) throw new HttpError(404, "Request not found");
  if (request.owner_user_id !== req.user.userId) throw new HttpError(403, "Not allowed");

  const updated = await query(
    `
      UPDATE photo_access_requests
      SET status = $1, updated_at = now()
      WHERE id = $2
      RETURNING *
    `,
    [status, requestId]
  );

  const result = updated.rows[0];

  // MUTUAL ACCESS ENFORCEMENT:
  // If User 2 approves User 1, we also want User 1's details to be unlocked for User 2.
  // The easiest way is to ensure a reciprocal 'approved' request exists.
  if (status === "approved") {
    // 1. Find User 2's profile ID (the one who is currently approving)
    const { rows: ownerProfile } = await query("SELECT id FROM profiles WHERE user_id = $1 LIMIT 1", [req.user.userId]);
    const ownerProfileId = ownerProfile[0]?.id;
    
    // 2. Find User 1's user ID (the requester)
    const requesterUserId = request.requester_id;

    if (ownerProfileId && requesterUserId) {
      // Create/Update reciprocal record: (Owner Profile -> Requester User)
      // Actually, the table stores (Requester User -> Target Profile)
      // So we want a record where: Requester = current User (User 2), Target Profile = User 1's Profile.
      
      const { rows: requesterProfile } = await query("SELECT id FROM profiles WHERE user_id = $1 LIMIT 1", [requesterUserId]);
      const requesterProfileId = requesterProfile[0]?.id;

      if (requesterProfileId) {
        await query(
          `
            INSERT INTO photo_access_requests (requester_id, profile_id, status, is_reciprocal, updated_at)
            VALUES ($1, $2, 'approved', true, now())
            ON CONFLICT (requester_id, profile_id) 
            DO UPDATE SET status = 'approved', updated_at = now()
          `,
          [req.user.userId, requesterProfileId]
        );
      }
    }

    // Send Notification to requester
    const notifyRequester = async () => {
      try {
        const { rows: ownerRows } = await query("SELECT full_name FROM profiles WHERE user_id = $1 LIMIT 1", [req.user.userId]);
        const ownerName = ownerRows[0]?.full_name || "A member";
        
        await notifyUser({
          userId: request.requester_id,
          type: "photo_access_approved",
          title: "Access Request Approved",
          message: `${ownerName} has approved your request. You can now view their private photos and family details.`,
          targetId: requestId,
          targetType: "photo_access_request",
          data: { requestId: requestId }
        });
      } catch (err) {
        console.error("[NotificationApprovalError]", err);
      }
    };
    notifyRequester();
  }

  // Optional: Fetch the newest requester profile to return in response as before
  if (status === "approved") {
    const { rows: requesterProfileData } = await query(
      `
        SELECT
          p.*,
          row_to_json(si.*) AS spiritual_info,
          row_to_json(ec.*) AS education_career,
          row_to_json(fd.*) AS family_details,
          row_to_json(pp.*) AS partner_preferences
        FROM profiles p
        LEFT JOIN spiritual_info si ON si.user_id = p.user_id
        LEFT JOIN education_career ec ON ec.user_id = p.user_id
        LEFT JOIN family_details fd ON fd.user_id = p.user_id
        LEFT JOIN partner_preferences pp ON pp.user_id = p.user_id
        WHERE p.user_id = $1
        LIMIT 1
      `,
      [request.requester_id]
    );
    result.requester_profile = requesterProfileData[0] || null;
  }

  return res.json({ success: true, message: "Request updated", data: result });
};

