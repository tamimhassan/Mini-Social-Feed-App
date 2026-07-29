import { admin, isInitialized } from '../config/firebase';

export interface SendPushNotificationArgs {
  token: string | null | undefined;
  title: string;
  body: string;
  data?: Record<string, string | number>;
}

async function sendPushNotification({
  token,
  title,
  body,
  data = {},
}: SendPushNotificationArgs): Promise<void> {
  if (!token) return;
  if (!isInitialized()) {
    console.log(
      `[notify] Skipped (Firebase not configured): "${title}" - "${body}"`,
    );
    return;
  }

  try {
    await admin.messaging().send({
      token,
      notification: { title, body },
      data: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)]),
      ),
    });
  } catch (err) {
    console.error(
      `[notify] Failed to send push notification: ${(err as Error).message}`,
    );
  }
}

export { sendPushNotification };
