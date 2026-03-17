import { query } from "../config/db.js";

const getSortSql = (sortBy) => {
  if (sortBy === "age_asc") return "age_years ASC NULLS LAST";
  if (sortBy === "age_desc") return "age_years DESC NULLS LAST";
  return "p.created_at DESC";
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

export const listProfiles = async (req, res) => {
  const { q, caste, state, city, education, ageMin, ageMax, page, limit, sortBy } = req.query;
  const where = ["p.user_id <> $1"];
  const params = [req.user?.userId || "00000000-0000-0000-0000-000000000000"];

  if (q) {
    params.push(`%${q}%`);
    where.push(`(p.full_name ILIKE $${params.length} OR p.profile_id ILIKE $${params.length} OR p.city ILIKE $${params.length})`);
  }
  if (caste) {
    params.push(caste);
    where.push(`p.caste = $${params.length}`);
  }
  if (state) {
    params.push(state);
    where.push(`p.state = $${params.length}`);
  }
  if (city) {
    params.push(city);
    where.push(`p.city = $${params.length}`);
  }
  if (education) {
    params.push(education);
    where.push(`ec.highest_education ILIKE $${params.length}`);
  }
  if (ageMin) {
    params.push(ageMin);
    where.push(`DATE_PART('year', AGE(p.date_of_birth)) >= $${params.length}`);
  }
  if (ageMax) {
    params.push(ageMax);
    where.push(`DATE_PART('year', AGE(p.date_of_birth)) <= $${params.length}`);
  }

  params.push(limit);
  const limitIdx = params.length;
  params.push((page - 1) * limit);
  const offsetIdx = params.length;

  const sql = `
    SELECT
      p.id, p.user_id, p.profile_id, p.full_name, p.gender,
      p.city, p.state, p.caste, p.photo_url, p.photo_locked,
      p.is_verified, p.is_premium,
      ec.highest_education, ec.occupation,
      DATE_PART('year', AGE(p.date_of_birth))::int AS age_years
    FROM profiles p
    LEFT JOIN education_career ec ON ec.user_id = p.user_id
    WHERE ${where.join(" AND ")}
    ORDER BY ${getSortSql(sortBy)}
    LIMIT $${limitIdx}
    OFFSET $${offsetIdx}
  `;
  const { rows } = await query(sql, params);

  const items = [];
  for (const row of rows) {
    const canSeePhoto =
      !row.photo_locked || (req.user?.userId ? await hasApprovedAccess(req.user.userId, row.id) : false);
    items.push({
      ...row,
      photo_url: row.photo_url, // Always show photo
      photo_locked: !canSeePhoto, // Keep flag for UI indicators
    });
  }

  const countParams = params.slice(0, params.length - 2);
  const countSql = `
    SELECT COUNT(*)::int AS total
    FROM profiles p
    LEFT JOIN education_career ec ON ec.user_id = p.user_id
    WHERE ${where.join(" AND ")}
  `;
  const countResult = await query(countSql, countParams);

  return res.json({
    success: true,
    message: "Profiles fetched",
    data: items,
    meta: {
      page,
      limit,
      total: countResult.rows[0].total,
      totalPages: Math.ceil(countResult.rows[0].total / limit),
    },
  });
};

export const filterMeta = async (_req, res) => {
  const [castes, states, educations] = await Promise.all([
    query("SELECT DISTINCT caste FROM profiles WHERE caste IS NOT NULL AND caste <> '' ORDER BY caste"),
    query("SELECT DISTINCT state FROM profiles WHERE state IS NOT NULL AND state <> '' ORDER BY state"),
    query(
      "SELECT DISTINCT highest_education FROM education_career WHERE highest_education IS NOT NULL AND highest_education <> '' ORDER BY highest_education"
    ),
  ]);

  return res.json({
    success: true,
    message: "Filter metadata fetched",
    data: {
      castes: castes.rows.map((r) => r.caste),
      states: states.rows.map((r) => r.state),
      educations: educations.rows.map((r) => r.highest_education),
    },
  });
};

