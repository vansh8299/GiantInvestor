import { signOut, getSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "./ui/button";
import { Bell, Send } from "lucide-react";
import cookies from 'js-cookie';
import { useEffect, useState } from "react";
import SearchDropdown from "./SearchDropdown";
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";

const Header = () => {
  const [token, setToken] = useState(null);
  const [googletoken, setGoogleToken] = useState(null);
  const [session, setSession] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [fcmToken, setFcmToken] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fcmSupported, setFcmSupported] = useState(true);
  
  // Firebase configuration - replace with your actual config
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
  };
  
  useEffect(() => {
    const checkAuth = async () => {
      // Check regular token
      const tokenFromCookies = cookies.get('token');
      setToken(tokenFromCookies);

      // Check Next.js session
      const nextAuthToken = cookies.get('next-auth.session-token');
      setGoogleToken(nextAuthToken);

      // Get Next.js session
      const sessionData = await getSession();
      setSession(sessionData);
    };

    checkAuth();
    
    // Initialize Firebase only in browser environment
    if (typeof window !== 'undefined') {
      initializeFirebaseMessaging();
    }
  }, []);
  
  const initializeFirebaseMessaging = async () => {
    try {
      // First check if FCM is supported in this browser
      const isFCMSupported = await isSupported();
      if (!isFCMSupported) {
        console.log('Firebase Cloud Messaging is not supported in this browser');
        setFcmSupported(false);
        return;
      }
      
      // Check if service worker is registered
      if (!('serviceWorker' in navigator)) {
        console.log('Service workers are not supported in this browser');
        setFcmSupported(false);
        return;
      }
      
      // Initialize Firebase
      const app = initializeApp(firebaseConfig);
      const messaging = getMessaging(app);
      
      // Check if the service worker exists and is registered
      try {
        navigator.serviceWorker.ready.then((registration) => {
          console.log('Service worker is ready:', registration);
        });
      } catch (error) {
        console.error('Service worker registration error:', error);
      }
      
      // Register service worker if not already registered
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        let swRegistered = false;
        for (const registration of registrations) {
          if (registration.scope.includes(window.location.origin)) {
            swRegistered = true;
            break;
          }
        }
        
        if (!swRegistered) {
          navigator.serviceWorker.register('/firebase-messaging-sw.js')
            .then(registration => {
              console.log('Service Worker registered with scope:', registration.scope);
            })
            .catch(err => {
              console.error('Service Worker registration failed:', err);
            });
        }
      });
      
      // Request permission and get FCM token
      try {
        const permission = await Notification.requestPermission();
        console.log('Notification permission status:', permission);
        
        if (permission === 'granted') {
          console.log('Notification permission granted.');
          
          // Get FCM token with explicit service worker registration
          navigator.serviceWorker.ready.then(async (registration) => {
            try {
              console.log('Getting FCM token with service worker:', registration);
              const currentToken = await getToken(messaging, {
                vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
                serviceWorkerRegistration: registration
              });
              
              if (currentToken) {
                console.log('FCM Token obtained:', currentToken);
                setFcmToken(currentToken);
                
                // Here you would typically send this token to your server
                if (token || googletoken || session) {
                  // saveTokenToServer(currentToken);
                }
              } else {
                console.log('No FCM token received.');
              }
            } catch (tokenError) {
              console.error('Error getting FCM token:', tokenError);
            }
          });
          
          // Set up message handler
          onMessage(messaging, (payload) => {
            console.log('Message received:', payload);
            const newNotification = {
              id: Date.now().toString(),
              title: payload.notification.title,
              body: payload.notification.body,
              timestamp: new Date().toISOString(),
              read: false,
              data: payload.data
            };
            
            setNotifications(prev => [newNotification, ...prev]);
          });
        } else {
          console.log('Notification permission denied.');
        }
      } catch (permError) {
        console.error('Error requesting permission:', permError);
      }
    } catch (error) {
      console.error('Error initializing Firebase:', error);
    }
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };
  
  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? {...notif, read: true} : notif
      )
    );
  };
  
  const clearAllNotifications = () => {
    setNotifications([]);
  };
  
  // Function to create a local test notification
  const createLocalTestNotification = () => {
    const newNotification = {
      id: Date.now().toString(),
      title: "Local Test Notification",
      body: "This is a local test notification since FCM isn't available.",
      timestamp: new Date().toISOString(),
      read: false,
      data: { type: "test" }
    };
    
    setNotifications(prev => [newNotification, ...prev]);
  };
  
  // Function to trigger a test notification via the API
  const triggerTestNotification = async () => {
    if (!fcmSupported) {
      createLocalTestNotification();
      return;
    }
    
    if (!fcmToken) {
      console.error('FCM token not available');
      // Add local notification about missing token
      setNotifications(prev => [{
        id: Date.now().toString(),
        title: "FCM Token Not Available",
        body: "Please ensure notifications are enabled in your browser and refresh the page.",
        timestamp: new Date().toISOString(),
        read: false,
        data: { type: "error" }
      }, ...prev]);
      
      // Try to re-initialize Firebase
      initializeFirebaseMessaging();
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Call our API endpoint
      const response = await fetch('/api/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: fcmToken,
          title: 'Giant Investor Update',
          body: 'This is a test notification from Giant Investor.',
          data: {
            type: 'test',
            url: '/dashboard'
          }
        }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        console.log('Notification sent successfully:', result);
        
        // Add a local notification to confirm
        setNotifications(prev => [{
          id: Date.now().toString(),
          title: "Success",
          body: "Test notification sent successfully!",
          timestamp: new Date().toISOString(),
          read: false,
          data: { type: "success" }
        }, ...prev]);
      } else {
        console.error('Failed to send notification:', result);
        
        // Add error notification
        setNotifications(prev => [{
          id: Date.now().toString(),
          title: "Error",
          body: `Failed to send notification: ${result.message}`,
          timestamp: new Date().toISOString(),
          read: false,
          data: { type: "error" }
        }, ...prev]);
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      
      // Add error notification
      setNotifications(prev => [{
        id: Date.now().toString(),
        title: "Error",
        body: `Error sending notification: ${error.message}`,
        timestamp: new Date().toISOString(),
        read: false,
        data: { type: "error" }
      }, ...prev]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <nav className="fixed top-0 w-full bg-white border-b border-gray-200 z-10">
      <div className="flex items-center justify-between px-4 py-3">
        <Link href="/">
          <div className="text-2xl font-bold text-green-600">Giant Investor</div>
        </Link>
        <SearchDropdown />
        <div className="flex items-center gap-4">
          {(token || googletoken || session) ? (
            <>
              {/* Test notification button */}
              <Button 
                onClick={triggerTestNotification} 
                className="bg-blue-600 px-3 py-2 flex items-center gap-1"
                disabled={isLoading}
              >
                <Send size={16} />
                <span className="text-sm">
                  {isLoading ? 'Sending...' : fcmSupported ? 'Test Notification' : 'Local Notification'}
                </span>
              </Button>
              
              {/* FCM Status - for debugging */}
              {!fcmSupported && (
                <div className="text-xs text-red-500">
                  FCM not supported
                </div>
              )}
              
              {/* Notification bell */}
              <div className="relative">
                <Button 
                  onClick={toggleNotifications} 
                  className="bg-green-600 p-2 h-10 w-10 flex items-center justify-center relative"
                >
                  <Bell size={20} />
                  {notifications.length > 0 && (
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {notifications.filter(n => !n.read).length}
                    </div>
                  )}
                </Button>
                
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-md shadow-lg z-20 max-h-96 overflow-y-auto">
                    <div className="p-3 border-b border-gray-200 flex justify-between items-center">
                      <h3 className="text-lg font-medium">Notifications</h3>
                      {notifications.length > 0 && (
                        <Button 
                          onClick={clearAllNotifications} 
                          className="text-xs text-gray-500 hover:text-gray-700 p-1 h-auto"
                          variant="ghost"
                        >
                          Clear all
                        </Button>
                      )}
                    </div>
                    
                    <div className="divide-y divide-gray-200">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-sm text-gray-500 text-center">
                          No notifications yet
                        </div>
                      ) : (
                        notifications.map(notification => (
                          <div 
                            key={notification.id} 
                            className={`p-3 hover:bg-gray-50 cursor-pointer ${
                              notification.read ? 'bg-white' : 
                              notification.data?.type === 'error' ? 'bg-red-50' :
                              notification.data?.type === 'success' ? 'bg-green-50' :
                              'bg-blue-50'
                            }`}
                            onClick={() => markAsRead(notification.id)}
                          >
                            <div className="font-medium text-sm">{notification.title}</div>
                            <div className="text-sm text-gray-600 mt-1">{notification.body}</div>
                            <div className="text-xs text-gray-400 mt-1">
                              {new Date(notification.timestamp).toLocaleTimeString()} · {new Date(notification.timestamp).toLocaleDateString()}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/pages/login">
                <Button className="bg-green-600">Sign In</Button>
              </Link>
              <Link href="/pages/signup">
                <Button className="bg-green-600">Sign Up</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Header;