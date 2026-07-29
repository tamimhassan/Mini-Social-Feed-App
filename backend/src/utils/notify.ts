import { admin, isInitialized } from "../config/firebase";

export interface SendPushNotificationArgs {
  token: string | null | undefined;
  title: string;
  body: string;
  data?: Record<string, string | number>;
}

/**
 * Sends an FCM push notification to a single device token.
 * Silently no-ops (with a log) if Firebase isn't configured or the user has no token,
 * so notification delivery never blocks or breaks the core like/comment API response.
 */
async function sendPushNotification({ token, title, body, data = {} }: SendPushNotificationArgs): Promise<void> {
  if (!token) return;
  if (!isInitialized()) {
    console.log(`[notify] Skipped (Firebase not configured): "${title}" - "${body}"`);
    return;
  }

  try {
    await admin.messaging().send({
      token,
      notification: { title, body },
      data: Object.fromEntries(
        // FCM data payloads must be string -> string
        Object.entries(data).map(([k, v]) => [k, String(v)])
      ),
    });
  } catch (err) {
    // Common cause: stale/invalid token (app uninstalled, token rotated). Log and move on.
    console.error(`[notify] Failed to send push notification: ${(err as Error).message}`);
  }
}

export { sendPushNotification };
