// pages/api/send-notification.js
import { initializeApp, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

// Initialize Firebase Admin if it hasn't been initialized yet
let app;
try {
  app = getApp();
// eslint-disable-next-line @typescript-eslint/no-unused-vars
} catch (error) {
  const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}'
  );

  app = initializeApp({
    credential: cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { token, title, body, data = {} } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'FCM token is required' });
    }

    // Message payload
    const message = {
      notification: {
        title: title || 'New Notification',
        body: body || 'You have a new notification',
      },
      data: {
        ...data,
        timestamp: new Date().toISOString(),
      },
      token: token,
    };

    // Send the message
    const messaging = getMessaging(app);
    const response = await messaging.send(message);

    return res.status(200).json({ 
      success: true, 
      messageId: response,
      message: 'Notification sent successfully'
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to send notification',
      error: error.message 
    });
  }
}