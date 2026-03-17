import { query } from "../config/db.js";

const createProfileId = () => `HPM-${Math.floor(100000 + Math.random() * 900000)}`;

const insertIfMissingByUser = async (tableName, userId) => {
  await query(
    `
      INSERT INTO ${tableName} (user_id)
      SELECT $1
      WHERE NOT EXISTS (
        SELECT 1 FROM ${tableName} WHERE user_id = $1
      )
    `,
    [userId]
  );
};

export const ensureUserProfileBundle = async (userId) => {
  const existing = await query("SELECT id FROM profiles WHERE user_id = $1 LIMIT 1", [userId]);
  if (!existing.rows[0]) {
    let inserted = false;
    for (let i = 0; i < 5 && !inserted; i += 1) {
      const generatedProfileId = createProfileId();
      const profileIdExists = await query("SELECT 1 FROM profiles WHERE profile_id = $1 LIMIT 1", [generatedProfileId]);
      if (profileIdExists.rows[0]) continue;
      const result = await query(
        `
          INSERT INTO profiles (user_id, profile_id, full_name)
          SELECT $1, $2, ''
          WHERE NOT EXISTS (
            SELECT 1 FROM profiles WHERE user_id = $1
          )
          RETURNING id
        `,
        [userId, generatedProfileId]
      );
      inserted = Boolean(result.rows[0]) || Boolean((await query("SELECT id FROM profiles WHERE user_id = $1 LIMIT 1", [userId])).rows[0]);
    }
    if (!inserted) {
      throw new Error("Failed to create profile after retries");
    }
  }

  await insertIfMissingByUser("spiritual_info", userId);
  await insertIfMissingByUser("education_career", userId);
  await insertIfMissingByUser("family_details", userId);
  await insertIfMissingByUser("partner_preferences", userId);
  await query(
    `
      INSERT INTO memberships (user_id, activated_at, expires_at, days_remaining, is_active, is_premium)
      SELECT $1, now(), now() + interval '5 years', 1825, true, false
      WHERE NOT EXISTS (
        SELECT 1 FROM memberships WHERE user_id = $1
      )
    `,
    [userId]
  );
};
