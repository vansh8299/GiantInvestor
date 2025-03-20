import { CronJob } from "cron";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const getSupabaseAdmin = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase environment variables not set");
  }

  return createClient(supabaseUrl, supabaseServiceKey);
};

// Store job instances to allow dynamic updates
let marketOpenJob = null;
let marketCloseJob = null;
let debugJob = null;

// Function to send notification
const sendNotification = async (title, message, type = "info") => {
  try {
    const supabase = getSupabaseAdmin();

    // Broadcast to general channel
    const channel = "notifications-general";

    // Send notification via Supabase Realtime
    const { error } = await supabase.channel(channel).send({
      type: "broadcast",
      event: "notification",
      payload: {
        title,
        message,
        data: {
          type,
          timestamp: new Date().toISOString(),
        },
      },
    });

    if (error) {
      console.error(`Failed to send notification: ${error.message}`);
      return false;
    }

    // Save the notification to database
    const { error: dbError } = await supabase.from("notifications").insert({
      user_id: null, // General notification
      title,
      message,
      data: {
        type,
        timestamp: new Date().toISOString(),
      },
      read: false,
    });

    if (dbError) {
      console.error("Error saving notification to database:", dbError);
    }

    console.log(
      `Notification sent: ${title} at ${new Date().toLocaleTimeString()}`
    );
    return true;
  } catch (error) {
    console.error("Error in sendNotification:", error);
    return false;
  }
};

// Create cron jobs with specified configurations
const createCronJobs = () => {
  // Market open notification job - runs every weekday at exactly 9:15 AM (IST)
  marketOpenJob = new CronJob(
    "15 9 * * 1-5", // Minute Hour Day Month DayOfWeek
    async function () {
      console.log(
        "Market open job triggered at:",
        new Date().toLocaleTimeString()
      );
      const success = await sendNotification(
        "Market Open",
        "The market has now opened for trading at 9:15 AM.",
        "market"
      );

      if (success) {
        console.log("Market open notification sent successfully");
      } else {
        console.error("Failed to send market open notification");
      }
    },
    null,
    false, // Don't start automatically
    "Asia/Kolkata", // IST timezone
    false
  );

  // Market close notification job - runs every weekday at exactly 3:30 PM (IST)
  marketCloseJob = new CronJob(
    "30 15 * * 1-5", // Minute Hour Day Month DayOfWeek
    async function () {
      console.log(
        "Market close job triggered at:",
        new Date().toLocaleTimeString()
      );
      const success = await sendNotification(
        "Market Close",
        "The market has now closed for the day at 3:30 PM.",
        "market"
      );

      if (success) {
        console.log("Market close notification sent successfully");
      } else {
        console.error("Failed to send market close notification");
      }
    },
    null,
    false, // Don't start automatically
    "Asia/Kolkata", // IST timezone
    false
  );


};

// Function to update cron schedule
export const updateCronSchedule = (jobType, newSchedule) => {
  try {
    let job = null;
    
    // Stop the existing job
    if (jobType === "open") {
      if (marketOpenJob) marketOpenJob.stop();
      
      // Create new job with updated schedule
      marketOpenJob = new CronJob(
        newSchedule, // New cron schedule
        marketOpenJob._callbacks[0], // Reuse existing callback
        null,
        true, // Start immediately
        "Asia/Kolkata"
      );
      job = marketOpenJob;
    } else if (jobType === "close") {
      if (marketCloseJob) marketCloseJob.stop();
      
      // Create new job with updated schedule
      marketCloseJob = new CronJob(
        newSchedule, // New cron schedule
        marketCloseJob._callbacks[0], // Reuse existing callback
        null,
        true, // Start immediately
        "Asia/Kolkata"
      );
      job = marketCloseJob;
    } else {
      throw new Error("Invalid job type");
    }
    
    console.log(`Updated ${jobType} job schedule to: ${newSchedule}`);
    console.log(`Next run time: ${job.nextDates()}`);
    
    return true;
  } catch (error) {
    console.error(`Error updating cron schedule for ${jobType}:`, error);
    return false;
  }
};

// Export jobs so they can be started elsewhere
export const startCronJobs = () => {
  try {
    // First, create the cron jobs if they don't exist
    if (!marketOpenJob || !marketCloseJob || !debugJob) {
      createCronJobs();
    }

    // Now start each job if it's not already running
    if (marketOpenJob && !marketOpenJob.running) {
      marketOpenJob.start();
      console.log(
        `Market open notification job started - next run: ${marketOpenJob.nextDates()}`
      );
    }

    if (marketCloseJob && !marketCloseJob.running) {
      marketCloseJob.start();
      console.log(
        `Market close notification job started - next run: ${marketCloseJob.nextDates()}`
      );
    }

    if (debugJob && process.env.NODE_ENV === "development" && !debugJob.running) {
      debugJob.start();
      console.log(
        "Debug notification job started - will trigger every minute in development"
      );
    }

    return true;
  } catch (error) {
    console.error("Error starting cron jobs:", error);
    return false;
  }
};

export const stopCronJobs = () => {
  try {
    if (marketOpenJob) marketOpenJob.stop();
    if (marketCloseJob) marketCloseJob.stop();
    if (debugJob) debugJob.stop();
    console.log("All cron jobs stopped");
    return true;
  } catch (error) {
    console.error("Error stopping cron jobs:", error);
    return false;
  }
};

// Function to get next scheduled run times (useful for debugging)
export const getNextRunTimes = () => {
  return {
    marketOpen: marketOpenJob ? marketOpenJob.nextDates() : null,
    marketClose: marketCloseJob ? marketCloseJob.nextDates() : null,
    debug: debugJob ? debugJob.nextDates() : null,
  };
};

// Function to manually trigger a notification for testing
export const triggerMarketNotification = async (type) => {
  if (type === "open") {
    return await sendNotification(
      "Market Open",
      "The market has now opened for trading at 9:15 AM.",
      "market"
    );
  } else {
    return await sendNotification(
      "Market Close",
      "The market has now closed for the day at 3:30 PM.",
      "market"
    );
  }
};