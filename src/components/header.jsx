import { signOut, getSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "./ui/button";
import { Bell, Send, Clock, Calendar } from "lucide-react";
import cookies from "js-cookie";
import { useEffect, useState } from "react";
import SearchDropdown from "./SearchDropdown";
import { createClient } from "@supabase/supabase-js";

const Header = () => {
  const [token, setToken] = useState(null);
  const [googletoken, setGoogleToken] = useState(null);
  const [session, setSession] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showScheduleSettings, setShowScheduleSettings] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [supabaseClient, setSupabaseClient] = useState(null);
  const [userId, setUserId] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState(false);
  const [marketStatus, setMarketStatus] = useState("closed"); // 'open' or 'closed'
  const [nextMarketOpen, setNextMarketOpen] = useState(null);
  const [nextMarketClose, setNextMarketClose] = useState(null);
  const [openHour, setOpenHour] = useState("9");
  const [openMinute, setOpenMinute] = useState("15");
  const [closeHour, setCloseHour] = useState("15");
  const [closeMinute, setCloseMinute] = useState("30");
  const [updateMessage, setUpdateMessage] = useState("");

  useEffect(() => {
    const checkAuth = async () => {
      // Check regular token
      const tokenFromCookies = cookies.get("token");
      setToken(tokenFromCookies);

      // Check Next.js session
      const nextAuthToken = cookies.get("next-auth.session-token");
      setGoogleToken(nextAuthToken);

      // Get Next.js session
      const sessionData = await getSession();
      setSession(sessionData);
    };

    checkAuth();

    // Initialize Supabase only in browser environment
    if (typeof window !== "undefined") {
      initializeSupabase();
      fetchUserData();
      checkMarketStatus();
      fetchCronStatus();

      // Initialize cron jobs on app start
      initializeCronJobs();
    }

    // Set up interval to check market status
    const marketStatusInterval = setInterval(checkMarketStatus, 60000); // Check every minute

    return () => {
      clearInterval(marketStatusInterval);
    };
  }, []);
// Add this useEffect to fetch notifications whenever userId changes
useEffect(() => {
  if (userId) {
    fetchNotifications();
  }
}, [userId]);
  // Fetch persistent notifications from the database
  const fetchNotifications = async () => {
    if (!userId) return;
    
    try {
      const response = await fetch("/api/notifications");
      if (response.ok) {
        const data = await response.json();
        // Transform the data to match our notification format
        const formattedNotifications = data.notifications.map(notification => ({
          id: notification.id,
          title: notification.title,
          body: notification.message,
          timestamp: notification.createdAt,
          read: notification.read,
          data: notification.metadata ? JSON.parse(notification.metadata) : {}
        }));
        
        setNotifications(formattedNotifications);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };
  
  // Mark a notification as read in the database
  const markNotificationAsRead = async (id) => {
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: "PUT",
      });
      
      // Update the local state
      markAsRead(id);
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };
  
  // Clear all notifications in the database
  const clearAllNotificationsInDB = async () => {
    try {
      await fetch("/api/notifications/clear", {
        method: "DELETE",
      });
      
      // Update the local state
      clearAllNotifications();
    } catch (error) {
      console.error("Error clearing notifications:", error);
    }
  };

  // Fetch cron job status
  const fetchCronStatus = async () => {
    try {
      const response = await fetch("/api/cron/setup");
      if (response.ok) {
        const data = await response.json();
        if (data.nextRuns) {
          setNextMarketOpen(data.nextRuns.marketOpen);
          setNextMarketClose(data.nextRuns.marketClose);
        }
      }
    } catch (error) {
      console.error("Error fetching cron status:", error);
    }
  };

  // Initialize cron jobs
  const initializeCronJobs = async () => {
    try {
      const response = await fetch("/api/cron/setup");
      if (response.ok) {
        console.log("Cron jobs initialized successfully");
        const data = await response.json();
        if (data.nextRuns) {
          setNextMarketOpen(data.nextRuns.marketOpen);
          setNextMarketClose(data.nextRuns.marketClose);
        }
      } else {
        console.error("Failed to initialize cron jobs");
      }
    } catch (error) {
      console.error("Error initializing cron jobs:", error);
    }
  };

  // Update cron schedule
  const updateSchedule = async (type) => {
    setIsLoading(true);
    try {
      let schedule;
      if (type === "open") {
        schedule = `${openMinute} ${openHour} * * 1-5`;
      } else {
        schedule = `${closeMinute} ${closeHour} * * 1-5`;
      }
      
      const response = await fetch("/api/cron/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobType: type,
          schedule
        }),
      });
      
      const data = await response.json();
      if (response.ok) {
        setUpdateMessage(`${type === "open" ? "Open" : "Close"} schedule updated successfully!`);
        if (type === "open") {
          setNextMarketOpen(data.nextRun);
        } else {
          setNextMarketClose(data.nextRun);
        }
        
        // Clear message after 3 seconds
        setTimeout(() => setUpdateMessage(""), 3000);
      } else {
        console.error("Failed to update schedule:", data.message);
        setUpdateMessage(`Failed to update ${type} schedule`);
      }
    } catch (error) {
      console.error(`Error updating ${type} schedule:`, error);
      setUpdateMessage(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if market is open or closed
  const checkMarketStatus = () => {
    const now = new Date();
    const day = now.getDay();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentTime = hours * 60 + minutes;

    // Check if it's a weekday (1-5 is Monday to Friday)
    if (day >= 1 && day <= 5) {
      // Market hours: 9:15 AM to 3:30 PM (IST)
      const marketOpenTime = parseInt(openHour) * 60 + parseInt(openMinute);
      const marketCloseTime = parseInt(closeHour) * 60 + parseInt(closeMinute);

      if (currentTime >= marketOpenTime && currentTime < marketCloseTime) {
        setMarketStatus("open");
      } else {
        setMarketStatus("closed");
      }
    } else {
      // Weekend - market is closed
      setMarketStatus("closed");
    }
  };

  const fetchUserData = async () => {
    try {
      const response = await fetch("/actions/getuser");
      if (response.ok) {
        const data = await response.json();
        if (data.user && data.user.id) {
          setUserId(data.user.id);
          // Fetch notifications after we have the user ID
          fetchNotifications();
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const initializeSupabase = async () => {
    try {
      // Initialize Supabase client
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        console.error("Supabase environment variables not set");
        return;
      }

      const supabase = createClient(supabaseUrl, supabaseKey);
      setSupabaseClient(supabase);

      // Set up Supabase realtime subscription for notifications
      setupRealtimeSubscription(supabase);

      // Set up push notification permission
      if ("Notification" in window) {
        const permission = await Notification.requestPermission();
        console.log("Notification permission status:", permission);
      }
    } catch (error) {
      console.error("Error initializing Supabase:", error);
    }
  };
// Add this useEffect to properly set up subscriptions when userId changes
useEffect(() => {
  if (userId && supabaseClient) {
    // Clean up any existing subscriptions
    const cleanup = setupRealtimeSubscription(supabaseClient);
    
    // Return cleanup function
    return () => {
      if (cleanup) cleanup();
    };
  }
}, [userId, supabaseClient]);
  const setupRealtimeSubscription = (supabase) => {
    if (!supabase || !userId) return () => {};
  
    let userChannel;
    let generalChannel;
  
    try {
      // Subscribe to user-specific channel
      userChannel = supabase
        .channel(`notifications-${userId}`)
        .on("broadcast", { event: "notification" }, handleNotification)
        .subscribe();
  
      // Subscribe to general notifications channel
      generalChannel = supabase
        .channel("notifications-general")
        .on("broadcast", { event: "notification" }, handleNotification)
        .subscribe((status) => {
          console.log("General channel subscription status:", status);
          setSubscriptionStatus(status === "SUBSCRIBED");
        });
  
    } catch (error) {
      console.error("Error setting up realtime subscription:", error);
    }
  
    // Return cleanup function
    return () => {
      if (userChannel) userChannel.unsubscribe();
      if (generalChannel) generalChannel.unsubscribe();
    };
  };
  const handleNotification = (payload) => {
    console.log("Full notification payload:", payload);
    
    // Check if this notification is intended for the current user
    if (payload.payload.data?.userId && payload.payload.data.userId !== userId) {
      console.log("Notification not for this user, skipping");
      return;
    }
  
    const newNotification = {
      id: payload.payload.data?.id || Date.now().toString(),
      title: payload.payload.title,
      body: payload.payload.message,
      timestamp: payload.payload.data?.timestamp || new Date().toISOString(),
      read: false,
      data: payload.payload.data || {},
    };
  
    setNotifications((prev) => [newNotification, ...prev]);
  
    // Show browser notification if supported
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(newNotification.title, {
        body: newNotification.body,
        icon: "/favicon.ico",
      });
    }
    
    // Optional: Immediately mark as read if desired
    if (newNotification.id) {
      markNotificationAsRead(newNotification.id);
    }
  };
  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    if (showScheduleSettings) setShowScheduleSettings(false);
    
    // Fetch fresh notifications when opening the panel
    if (!showNotifications) {
      fetchNotifications();
    }
  };

  const toggleScheduleSettings = () => {
    setShowScheduleSettings(!showScheduleSettings);
    if (showNotifications) setShowNotifications(false);
  };

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif))
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Generate time options
  const generateTimeOptions = (start, end) => {
    const options = [];
    for (let i = start; i <= end; i++) {
      options.push(
        <option key={i} value={i.toString().padStart(2, "0")}>
          {i.toString().padStart(2, "0")}
        </option>
      );
    }
    return options;
  };

  return (
    <nav className="fixed top-0 w-full bg-white border-b border-gray-200 z-10">
      <div className="flex items-center justify-between px-4 py-3">
        <Link href="/">
          <div className="text-2xl font-bold text-green-600">
            Giant Investor
          </div>
        </Link>
        <SearchDropdown />
        <div className="flex items-center gap-4">
          {token || googletoken || session ? (
            <>
              {/* Market Status */}
              <div
                className={`flex items-center gap-1 text-sm px-2 py-1 rounded cursor-pointer ${
                  marketStatus === "open"
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
                onClick={toggleScheduleSettings}
              >
                <Clock size={16} />
                <span>Market {marketStatus}</span>
              </div>

              {/* Notification bell */}
              <div className="relative">
                <Button
                  onClick={toggleNotifications}
                  className="bg-green-600 p-2 h-10 w-10 flex items-center justify-center relative"
                >
                  <Bell size={20} />
                  {notifications.length > 0 && (
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {notifications.filter((n) => !n.read).length}
                    </div>
                  )}
                </Button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-md shadow-lg z-20 max-h-96 overflow-y-auto">
                    <div className="p-3 border-b border-gray-200 flex justify-between items-center">
                      <h3 className="text-lg font-medium">Notifications</h3>
                      <div className="flex gap-2">
                        {notifications.length > 0 && (
                          <Button
                            onClick={clearAllNotificationsInDB}
                            className="text-xs text-gray-500 hover:text-gray-700 p-1 h-auto"
                            variant="ghost"
                          >
                            Clear
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="divide-y divide-gray-200">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-sm text-gray-500 text-center">
                          No notifications yet
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-3 hover:bg-gray-50 cursor-pointer ${
                              notification.read
                                ? "bg-white"
                                : notification.data?.type === "error"
                                ? "bg-red-50"
                                : notification.data?.type === "success"
                                ? "bg-green-50"
                                : notification.data?.type === "market"
                                ? "bg-blue-50"
                                : "bg-blue-50"
                            }`}
                            onClick={() => markNotificationAsRead(notification.id)}
                          >
                            <div className="font-medium text-sm">
                              {notification.title}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              {notification.body}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              {new Date(
                                notification.timestamp
                              ).toLocaleTimeString()}{" "}
                              ·{" "}
                              {new Date(
                                notification.timestamp
                              ).toLocaleDateString()}
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