import { signOut, getSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "./ui/button";
import { Bell, Send } from "lucide-react";
import cookies from 'js-cookie';
import { useEffect, useState } from "react";
import SearchDropdown from "./SearchDropdown";
import { createClient } from '@supabase/supabase-js';

const Header = () => {
  const [token, setToken] = useState(null);
  const [googletoken, setGoogleToken] = useState(null);
  const [session, setSession] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [supabaseClient, setSupabaseClient] = useState(null);
  const [userId, setUserId] = useState(null)
  const [subscriptionStatus, setSubscriptionStatus] = useState(false);
  
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
    
    // Initialize Supabase only in browser environment
    if (typeof window !== 'undefined') {
      initializeSupabase();
    }
  }, []);
  const fetchUserData = async () => {
    try {
      const response = await fetch('/actions/getuser');
      if (response.ok) {
        const data = await response.json();
        if (data.user && data.user.id) {
          setUserId(data.user.id);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };
  const initializeSupabase = async () => {
    try {
      // Initialize Supabase client
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        console.error('Supabase environment variables not set');
        return;
      }
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      setSupabaseClient(supabase);
      
      // Set up push notification permission
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        console.log('Notification permission status:', permission);
        
        if (permission === 'granted') {
          console.log('Notification permission granted.');
          
          // Set up Supabase realtime subscription for notifications
          setupRealtimeSubscription(supabase);
        } else {
          console.log('Notification permission denied.');
        }
      }
    } catch (error) {
      console.error('Error initializing Supabase:', error);
    }
  };
  
  const setupRealtimeSubscription = (supabase) => {
    if (!supabase) return;
    
    try {
      // Get the user ID from token or session
   
      
      // Subscribe to a channel for notifications
      const channel = supabase
        .channel(`notifications-${userId || 'general'}`)
        .on('broadcast', { event: 'notification' }, (payload) => {
          console.log('Notification received:', payload);
          const newNotification = {
            id: Date.now().toString(),
            title: payload.payload.title,
            body: payload.payload.message,
            timestamp: new Date().toISOString(),
            read: false,
            data: payload.payload.data || {}
          };
          
          setNotifications(prev => [newNotification, ...prev]);
        })
        .subscribe(status => {
          console.log('Subscription status:', status);
          setSubscriptionStatus(status === 'SUBSCRIBED');
        });
      
      return () => {
        channel.unsubscribe();
      };
    } catch (error) {
      console.error('Error setting up realtime subscription:', error);
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
      body: "This is a local test notification.",
      timestamp: new Date().toISOString(),
      read: false,
      data: { type: "test" }
    };
    
    setNotifications(prev => [newNotification, ...prev]);
  };
  
  // Function to trigger a test notification via the API
  const triggerTestNotification = async () => {
    if (!supabaseClient || !subscriptionStatus) {
      createLocalTestNotification();
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Get userId from session or token
      
      
      // Call our API endpoint
      const response = await fetch('/api/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          title: 'Giant Investor Update',
          message: 'This is a test notification from Giant Investor.',
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
                  {isLoading ? 'Sending...' : subscriptionStatus ? 'Test Notification' : 'Local Notification'}
                </span>
              </Button>
              
              {/* Subscription Status - for debugging */}
              {!subscriptionStatus && (
                <div className="text-xs text-red-500">
                  Not subscribed
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