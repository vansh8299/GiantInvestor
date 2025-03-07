// src/app/api/send/route.js
import { initializeApp, cert, getApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

// Initialize Firebase Admin if it hasn't been initialized yet
let app;
try {
  app = getApp();
// eslint-disable-next-line @typescript-eslint/no-unused-vars
} catch (error) {
  console.log('Initializing Firebase Admin SDK...');

  if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    console.error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set.');
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is required');
  }

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  } catch (error) {
    console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', error);
    throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT_KEY');
  }

  app = initializeApp({
    credential: cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

// Named export for POST method
export async function POST(req) {
  try {
    const { token, title, body, data = {} } = await req.json();

    if (!token) {
      return new Response(JSON.stringify({ message: 'FCM token is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
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

    return new Response(
      JSON.stringify({
        success: true,
        messageId: response,
        message: 'Notification sent successfully',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error sending notification:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to send notification',
        error: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}