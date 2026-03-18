import { query } from "../config/db.js";
import { HttpError } from "../utils/httpError.js";
import { buildUpdateSet } from "../utils/sql.js";
import { ensureUserProfileBundle } from "../services/profileBootstrap.service.js";
import { deletePhotoObject, saveLocalPhoto } from "../services/storage.service.js";
import { getStorageConfig } from "../config/storage.js";

const recalcCompleteness = async (userId) => {
  const { rows } = await query(
    `
      SELECT
        p.full_name, p.gender, p.date_of_birth, p.height, p.marital_status, p.city, p.state,
        si.karya_karta, si.pradesh,
        ec.highest_education, ec.occupation,
        fd.father_name, fd.mother_name
      FROM profiles p
      LEFT JOIN spiritual_info si ON si.user_id = p.user_id
      LEFT JOIN education_career ec ON ec.user_id = p.user_id
      LEFT JOIN family_details fd ON fd.user_id = p.user_id
      WHERE p.user_id = $1
    `,
    [userId]
  );
  if (!rows[0]) return;
  const row = rows[0];
  const fields = [
    "full_name",
    "gender",
    "date_of_birth",
    "height",
    "marital_status",
    "city",
    "state",
    "karya_karta",
    "pradesh",
    "highest_education",
    "occupation",
    "father_name",
    "mother_name",
  ];
  const filled = fields.filter((k) => row[k] !== null && row[k] !== "").length;
  const completeness = Math.round((filled / fields.length) * 100);
  await query("UPDATE profiles SET profile_completeness = $1, updated_at = now() WHERE user_id = $2", [
    completeness,
    userId,
  ]);
};

const getMyCompositeProfile = async (userId) => {
  const { rows } = await query(
    `
      SELECT
        p.*,
        u.mobile,
        u.email,
        row_to_json(si.*) AS spiritual_info,
        row_to_json(ec.*) AS education_career,
        row_to_json(fd.*) AS family_details,
        row_to_json(pp.*) AS partner_preferences,
        row_to_json(m.*) AS membership
      FROM profiles p
      LEFT JOIN users u ON u.id = p.user_id
      LEFT JOIN spiritual_info si ON si.user_id = p.user_id
      LEFT JOIN education_career ec ON ec.user_id = p.user_id
      LEFT JOIN family_details fd ON fd.user_id = p.user_id
      LEFT JOIN partner_preferences pp ON pp.user_id = p.user_id
      LEFT JOIN memberships m ON m.user_id = p.user_id
      WHERE p.user_id = $1
      LIMIT 1
    `,
    [userId]
  );
  return rows[0] || null;
};

const hasApprovedAccess = async (viewerUserId, targetProfileId) => {
  if (!viewerUserId) return false;
  const { rows } = await query(
    `
      SELECT 1 FROM photo_access_requests
      WHERE (requester_id = $1 AND profile_id = $2 AND status = 'approved')
         OR (
           requester_id = (SELECT user_id FROM profiles WHERE id = $2)
           AND profile_id = (SELECT id FROM profiles WHERE user_id = $1)
           AND status = 'approved'
         )
      LIMIT 1
    `,
    [viewerUserId, targetProfileId]
  );
  return Boolean(rows[0]);
};

export const getMe = async (req, res) => {
  await ensureUserProfileBundle(req.user.userId);
  const data = await getMyCompositeProfile(req.user.userId);
  if (!data) throw new HttpError(404, "Profile not found");
  return res.json({ success: true, message: "Profile fetched", data });
};

export const updateBasic = async (req, res) => {
  await ensureUserProfileBundle(req.user.userId);
  const { setSql, values, hasUpdates } = buildUpdateSet(req.body);
  if (!hasUpdates) return res.json({ success: true, message: "No changes applied" });
  const sql = `UPDATE profiles SET ${setSql}, updated_at = now() WHERE user_id = $${
    values.length + 1
  } RETURNING *`;
  const { rows } = await query(sql, [...values, req.user.userId]);
  if (!rows[0]) throw new HttpError(404, "Profile not found");
  await recalcCompleteness(req.user.userId);
  return res.json({ success: true, message: "Basic profile updated", data: rows[0] });
};

export const updateSpiritual = async (req, res) => {
  await ensureUserProfileBundle(req.user.userId);
  const { setSql, values, hasUpdates } = buildUpdateSet(req.body);
  if (!hasUpdates) return res.json({ success: true, message: "No changes applied" });
  const sql = `UPDATE spiritual_info SET ${setSql} WHERE user_id = $${values.length + 1} RETURNING *`;
  const { rows } = await query(sql, [...values, req.user.userId]);
  if (!rows[0]) throw new HttpError(404, "Spiritual info not found");
  await recalcCompleteness(req.user.userId);
  return res.json({ success: true, message: "Spiritual info updated", data: rows[0] });
};

export const updateEducationCareer = async (req, res) => {
  await ensureUserProfileBundle(req.user.userId);
  const { setSql, values, hasUpdates } = buildUpdateSet(req.body);
  if (!hasUpdates) return res.json({ success: true, message: "No changes applied" });
  const sql = `UPDATE education_career SET ${setSql} WHERE user_id = $${values.length + 1} RETURNING *`;
  const { rows } = await query(sql, [...values, req.user.userId]);
  if (!rows[0]) throw new HttpError(404, "Education/Career info not found");
  await recalcCompleteness(req.user.userId);
  return res.json({ success: true, message: "Education/Career updated", data: rows[0] });
};

export const updateFamily = async (req, res) => {
  await ensureUserProfileBundle(req.user.userId);
  const { setSql, values, hasUpdates } = buildUpdateSet(req.body);
  if (!hasUpdates) return res.json({ success: true, message: "No changes applied" });
  const sql = `UPDATE family_details SET ${setSql} WHERE user_id = $${values.length + 1} RETURNING *`;
  const { rows } = await query(sql, [...values, req.user.userId]);
  if (!rows[0]) throw new HttpError(404, "Family details not found");
  await recalcCompleteness(req.user.userId);
  return res.json({ success: true, message: "Family details updated", data: rows[0] });
};

export const updatePartnerPreferences = async (req, res) => {
  await ensureUserProfileBundle(req.user.userId);
  const { setSql, values, hasUpdates } = buildUpdateSet(req.body);
  if (!hasUpdates) return res.json({ success: true, message: "No changes applied" });
  const sql = `UPDATE partner_preferences SET ${setSql} WHERE user_id = $${
    values.length + 1
  } RETURNING *`;
  const { rows } = await query(sql, [...values, req.user.userId]);
  if (!rows[0]) throw new HttpError(404, "Partner preferences not found");
  return res.json({ success: true, message: "Partner preferences updated", data: rows[0] });
};

export const updatePrivacy = async (req, res) => {
  await ensureUserProfileBundle(req.user.userId);
  const { photo_locked, family_locked } = req.body;
  if (photo_locked !== undefined) {
    await query("UPDATE profiles SET photo_locked = $1, updated_at = now() WHERE user_id = $2", [
      photo_locked,
      req.user.userId,
    ]);
  }
  if (family_locked !== undefined) {
    await query("UPDATE family_details SET is_locked = $1 WHERE user_id = $2", [family_locked, req.user.userId]);
  }
  const data = await getMyCompositeProfile(req.user.userId);
  return res.json({ success: true, message: "Privacy updated", data });
};

export const getProfileById = async (req, res) => {
  const { profileId } = req.params;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    profileId
  );
  const { rows } = await query(
    `
      SELECT
        p.*,
        u.mobile,
        u.email,
        p.user_id AS profile_owner_user_id,
        row_to_json(si.*) AS spiritual_info,
        row_to_json(ec.*) AS education_career,
        row_to_json(fd.*) AS family_details,
        row_to_json(pp.*) AS partner_preferences,
        COALESCE(
          (SELECT json_agg(ph.*) FROM (
             SELECT id, file_url, visibility, is_primary, sort_order 
             FROM profile_photos 
             WHERE user_id = p.user_id 
             ORDER BY is_primary DESC, sort_order ASC
          ) ph),
          '[]'
        ) AS profile_photos
      FROM profiles p
      LEFT JOIN users u ON u.id = p.user_id
      LEFT JOIN spiritual_info si ON si.user_id = p.user_id
      LEFT JOIN education_career ec ON ec.user_id = p.user_id
      LEFT JOIN family_details fd ON fd.user_id = p.user_id
      LEFT JOIN partner_preferences pp ON pp.user_id = p.user_id
      WHERE ${isUuid ? "p.id = $1" : "p.profile_id = $1"}
      LIMIT 1
    `,
    [profileId]
  );
  const profile = rows[0];
  if (!profile) throw new HttpError(404, "Profile not found");

  const isOwner = req.user?.userId && req.user.userId === profile.profile_owner_user_id;

  // Check for approved access (including mutual)
  const approvedAccess = await hasApprovedAccess(req.user?.userId, profile.id);

  // Stricter privacy: Default to locked (true) if null/undefined
  const isPhotoLocked = profile.photo_locked !== false;
  const photoApproved = isOwner || !isPhotoLocked || approvedAccess;

  if (!photoApproved) {
    // profile.photo_url = null; // Don't nullify primary photo
    // profile.profile_photos = []; // Don't empty all photos, let visibility handle it
  }

  // Handle individual photo visibility within profile_photos array
  if (!isOwner && !approvedAccess) {
     profile.profile_photos = (profile.profile_photos || []).filter(ph => ph.visibility === 'public' || ph.is_primary);
  }

  // Stricter privacy: Default to locked (true) if null/undefined
  const isFamilyLocked = profile.family_details?.is_locked !== false;
  const canSeeFamily = isOwner || !isFamilyLocked || approvedAccess;

  if (!canSeeFamily && profile.family_details) {
    profile.family_details = {
      message: "Family details locked. Access requires approval.",
    };
  }

  return res.json({ success: true, message: "Profile fetched", data: profile });
};

const syncPrimaryPhotoToProfile = async (userId) => {
  const { rows } = await query(
    `
      SELECT file_url
      FROM profile_photos
      WHERE user_id = $1
      ORDER BY is_primary DESC, created_at DESC
      LIMIT 1
    `,
    [userId]
  );
  await query("UPDATE profiles SET photo_url = $1, updated_at = now() WHERE user_id = $2", [
    rows[0]?.file_url || null,
    userId,
  ]);
};

export const uploadLocalPhoto = async (req, res) => {
  const storageConfig = getStorageConfig();
  if (storageConfig.provider !== "local") {
    throw new HttpError(400, "Local upload endpoint is available only when STORAGE_PROVIDER=local");
  }
  await ensureUserProfileBundle(req.user.userId);
  const { fileName, fileBase64, visibility, is_primary } = req.body;
  const cleanBase64 = fileBase64.includes(",") ? fileBase64.split(",").pop() : fileBase64;
  const fileBuffer = Buffer.from(cleanBase64, "base64");
  if (!fileBuffer.length) throw new HttpError(400, "Invalid base64 image content");
  if (fileBuffer.length > 8 * 1024 * 1024) throw new HttpError(400, "Image size exceeds 8 MB limit");

  const saved = await saveLocalPhoto({
    userId: req.user.userId,
    fileName,
    fileBuffer,
  });

  if (is_primary) {
    await query("UPDATE profile_photos SET is_primary = false WHERE user_id = $1", [req.user.userId]);
  }
  const { rows } = await query(
    `
      INSERT INTO profile_photos (user_id, storage_key, file_url, visibility, is_primary)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `,
    [req.user.userId, saved.storageKey, saved.fileUrl, visibility, is_primary]
  );
  if (is_primary) {
    await syncPrimaryPhotoToProfile(req.user.userId);
  }
  return res.status(201).json({
    success: true,
    message: "Photo uploaded to local storage",
    data: rows[0],
  });
};

export const listMyPhotos = async (req, res) => {
  const { rows } = await query(
    `
      SELECT id, storage_key, file_url, visibility, is_primary, sort_order, created_at
      FROM profile_photos
      WHERE user_id = $1
      ORDER BY is_primary DESC, sort_order ASC, created_at DESC
    `,
    [req.user.userId]
  );
  return res.json({ success: true, message: "Photos fetched", data: rows });
};

export const deleteMyPhoto = async (req, res) => {
  const { photoId } = req.params;
  const { rows } = await query(
    `
      DELETE FROM profile_photos
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `,
    [photoId, req.user.userId]
  );
  if (!rows[0]) throw new HttpError(404, "Photo not found");
  await deletePhotoObject({ storageKey: rows[0].storage_key });
  if (rows[0].is_primary) {
    await syncPrimaryPhotoToProfile(req.user.userId);
  }
  return res.json({ success: true, message: "Photo deleted" });
};

export const setPrimaryPhoto = async (req, res) => {
  const { photoId } = req.params;
  const exists = await query("SELECT id FROM profile_photos WHERE id = $1 AND user_id = $2 LIMIT 1", [
    photoId,
    req.user.userId,
  ]);
  if (!exists.rows[0]) throw new HttpError(404, "Photo not found");
  await query("UPDATE profile_photos SET is_primary = false WHERE user_id = $1", [req.user.userId]);
  const { rows } = await query(
    `
      UPDATE profile_photos
      SET is_primary = true, updated_at = now()
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `,
    [photoId, req.user.userId]
  );
  await syncPrimaryPhotoToProfile(req.user.userId);
  return res.json({ success: true, message: "Primary photo updated", data: rows[0] });
};
