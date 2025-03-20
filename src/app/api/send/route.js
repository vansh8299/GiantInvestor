import { createClient } from "@supabase/supabase-js";
import { startCronJobs } from "@/services/cronService";

// Initialize Supabase client
const getSupabaseAdmin = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase environment variables not set");
  }

  return createClient(supabaseUrl, supabaseServiceKey);
};

// Initialize cron jobs when server starts
let cronInitialized = false;

function initCronJobs() {
  if (!cronInitialized && typeof process !== "undefined") {
    startCronJobs();
    cronInitialized = true;
    console.log("Cron jobs initialized");
  }
}

// Named export for POST method
export async function POST(req) {
  try {
    // Start cron jobs if not already started
    initCronJobs();

    const { userId, title, message, data = {} } = await req.json();

    // Get Supabase admin client
    const supabase = getSupabaseAdmin();

    // Channel to broadcast to
    const channel = userId
      ? `notifications-${userId}`
      : "notifications-general";

    // Send notification via Supabase Realtime
    const { error } = await supabase.channel(channel).send({
      type: "broadcast",
      event: "notification",
      payload: {
        title: title || "New Notification",
        message: message || "You have a new notification",
        data: {
          ...data,
          timestamp: new Date().toISOString(),
        },
      },
    });

    if (error) {
      throw new Error(`Failed to send notification: ${error.message}`);
    }

    // Optionally, also save the notification to a Supabase table
    const { error: dbError } = await supabase.from("notifications").insert({
      user_id: userId || null,
      title: title || "New Notification",
      message: message || "You have a new notification",
      data: {
        ...data,
        timestamp: new Date().toISOString(),
      },
      read: false,
    });

    if (dbError) {
      console.error("Error saving notification to database:", dbError);
      // Continue anyway, as the broadcast probably worked
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Notification sent successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error sending notification:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Failed to send notification",
        error: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
