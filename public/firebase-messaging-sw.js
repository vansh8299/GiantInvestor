// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize Firebase
firebase.initializeApp({
  apiKey: "AIzaSyCoycjPgmQfkkCt2kJQO38TfG07aZ9av9c",
  authDomain: "giant-investor-f8460.firebaseapp.com",
  projectId: "giant-investor-f8460",
  storageBucket: "giant-investor-f8460.firebasestorage.app",
  messagingSenderId: "252270256359",
  appId: "1:252270256359:web:b14ae66eb95ca4998d0242",
});



const messaging = firebase.messaging();

// Log service worker activation
// eslint-disable-next-line @typescript-eslint/no-unused-vars
self.addEventListener('activate', event => {
  console.log('Firebase messaging service worker activated');
});

// Background message handler
messaging.onBackgroundMessage(function(payload) {
  console.log('Background message received:', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: payload.data
  };
  
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Notification click handler
self.addEventListener('notificationclick', function(event) {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    })
    .then(function(clientList) {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

console.log('Firebase messaging service worker loaded');