import admin from "firebase-admin";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { query } from "../config/db.js";

// Initialize Firebase Admin SDK
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

try {
  const serviceAccount = JSON.parse(
    readFileSync(join(__dirname, "../../firebase-service-account.json"), "utf8")
  );

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log("[NotificationService] Firebase Admin SDK initialized successfully.");
} catch (error) {
  console.error("[NotificationService] Failed to initialize Firebase Admin SDK:", error.message);
}

/**
 * Send a push notification to a specific user via FCM.
 */
export const sendPushNotification = async ({ userId, title, message, data = {} }) => {
  try {
    const { rows } = await query("SELECT fcm_token FROM users WHERE id = $1 LIMIT 1", [userId]);
    const fcmToken = rows[0]?.fcm_token;

    if (!fcmToken) {
      console.log(`[NotificationService] No FCM token for user ${userId}. Skipping push.`);
      return false;
    }

    // Convert all data values to strings as required by FCM
    const stringData = {};
    Object.keys(data).forEach(key => {
      stringData[key] = String(data[key]);
    });

    const payload = {
      token: fcmToken,
      notification: {
        title: title,
        body: message,
      },
      data: stringData,
      android: {
        priority: "high",
        notification: {
          channelId: "hp_notifications", // Matches Flutter configuration
          icon: "ic_launcher",
          priority: "high",
        }
      }
    };

    const response = await admin.messaging().send(payload);
    console.log(`[NotificationService] Push sent to ${userId}. FCM Response:`, response);

    return true;
  } catch (error) {
    console.error("[NotificationService] Error sending push:", error);
    return false;
  }
};

/**
 * Save an in-app notification record.
 */
export const createInAppNotification = async ({ userId, type, title, message, targetId = null, targetType = null }) => {
  try {
    const { rows } = await query(
      `
        INSERT INTO notifications (user_id, type, title, message, target_id, target_type)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `,
      [userId, type, title, message, targetId, targetType]
    );
    return rows[0];
  } catch (error) {
    console.error("[NotificationService] Error creating in-app notification:", error);
    return null;
  }
};

/**
 * Helper to send both push and in-app notification.
 */
export const notifyUser = async ({ userId, type, title, message, targetId = null, targetType = null, data = {} }) => {
  // Create in-app record
  await createInAppNotification({ userId, type, title, message, targetId, targetType });
  
  // Send actual push
  await sendPushNotification({ 
    userId, 
    title, 
    message, 
    data: { ...data, type } 
  });
};
