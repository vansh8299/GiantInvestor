import { CronJob } from "cron";
import { createClient } from "@supabase/supabase-js";
import { db } from "@/lib/prisma"; // Add Prisma import for database access

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

// Helper function to create a delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Function to send notification
const sendNotification = async (title, message, type = "info", userId = null) => {
  try {
    const supabase = getSupabaseAdmin();

    // Determine which channel to use based on whether userId is provided
    const channel = userId 
      ? `notifications-${userId}` 
      : "notifications-general";

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
      user_id: userId, // User-specific or general notification
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
      `Notification sent: ${title} to ${userId || 'general'} at ${new Date().toLocaleTimeString()}`
    );
    return true;
  } catch (error) {
    console.error("Error in sendNotification:", error);
    return false;
  }
};

// Calculate and send profit/loss notifications to all users
// Updated sendProfitLossNotifications function
const sendProfitLossNotifications = async () => {
  try {
    console.log("Starting to calculate profit/loss for all users");
    
    // Get all users who have stocks
    const usersWithStocks = await db.user.findMany({
      where: {
        stocks: {
          some: {} // Any user who has at least one stock
        }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        stocks: {
          select: {
            id: true,
            symbol: true,
            quantity: true,
            purchasePrice: true,
            currentPrice: true
          }
        }
      }
    });
    
    console.log(`Found ${usersWithStocks.length} users with stocks to notify`);
    
    // Process each user
    for (const user of usersWithStocks) {
      let totalProfitLoss = 0;
      let stockSummary = [];
      
      // Calculate profit/loss for each stock
      for (const stock of user.stocks) {
        let latestPrice = stock.currentPrice;
        
        try {
          // First try daily data - IMPORTANT: Use the correct API endpoint
          const apiUrl = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${stock.symbol}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`;
          
          console.log(`Fetching daily data for ${stock.symbol} from: ${apiUrl}`);
          
          const dailyRes = await fetch(apiUrl);
          if (!dailyRes.ok) {
            throw new Error(`API request failed with status ${dailyRes.status}`);
          }
          
          const dailyData = await dailyRes.json();
          
          // Debug: Log the API response
          console.log(`API response for ${stock.symbol}:`, JSON.stringify(dailyData, null, 2));
          
          if (!dailyData["Time Series (Daily)"]) {
            throw new Error("No time series data in response");
          }
          
          const timeSeriesDaily = dailyData["Time Series (Daily)"];
          const dates = Object.keys(timeSeriesDaily).sort().reverse(); // Get dates in descending order
          
          if (dates.length > 0) {
            const latestDate = dates[0]; // Get the most recent date
            latestPrice = parseFloat(timeSeriesDaily[latestDate]["5. adjusted close"]);
            console.log(`Latest price for ${stock.symbol} on ${latestDate}: ${latestPrice}`);
          }
        } catch (e) {
          console.error(`Error fetching daily data for ${stock.symbol}:`, e);
          
          // If daily fails, try weekly as fallback
          try {
            const weeklyApiUrl = `https://www.alphavantage.co/query?function=TIME_SERIES_WEEKLY_ADJUSTED&symbol=${stock.symbol}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`;
            console.log(`Falling back to weekly data for ${stock.symbol}`);
            
            const weeklyRes = await fetch(weeklyApiUrl);
            if (!weeklyRes.ok) {
              throw new Error(`Weekly API request failed with status ${weeklyRes.status}`);
            }
            
            const weeklyData = await weeklyRes.json();
            
            if (!weeklyData["Weekly Adjusted Time Series"]) {
              throw new Error("No weekly time series data in response");
            }
            
            const timeSeriesWeekly = weeklyData["Weekly Adjusted Time Series"];
            const weeklyDates = Object.keys(timeSeriesWeekly).sort().reverse();
            
            if (weeklyDates.length > 0) {
              const latestWeeklyDate = weeklyDates[0];
              latestPrice = parseFloat(timeSeriesWeekly[latestWeeklyDate]["5. adjusted close"]);
              console.log(`Weekly fallback price for ${stock.symbol} on ${latestWeeklyDate}: ${latestPrice}`);
            }
          } catch (weeklyError) {
            console.error(`Error fetching weekly data for ${stock.symbol}:`, weeklyError);
            // If both fail, we'll use the currentPrice from the database
            console.log(`Using current price from database for ${stock.symbol}: ${latestPrice}`);
          }
        }
        
        // Calculate with the latest price
        const stockProfitLoss = (latestPrice - stock.purchasePrice) * stock.quantity;
        totalProfitLoss += stockProfitLoss;
      
        // Add to summary for detailed notification
        stockSummary.push({
          symbol: stock.symbol,
          quantity: stock.quantity,
          profitLoss: stockProfitLoss,
          latestPrice: latestPrice
        });
        
        // Update the currentPrice in database if it changed
        if (latestPrice !== stock.currentPrice) {
          await db.stock.update({
            where: { id: stock.id },
            data: { currentPrice: latestPrice }
          });
          console.log(`Updated price for ${stock.symbol} to ${latestPrice}`);
        }
      }
      
      // Create notification message
      const isProfitable = totalProfitLoss >= 0;
      const notificationType = isProfitable ? "success" : "warning";
      const profitLossFormatted = Math.abs(totalProfitLoss).toFixed(2);
      
      const title = isProfitable 
        ? `Daily Profit: $${profitLossFormatted}`
        : `Daily Loss: $${profitLossFormatted}`;
        
      const message = isProfitable
        ? `Today you made a profit of $${profitLossFormatted} across all your stocks.`
        : `Today you have a loss of $${profitLossFormatted} across all your stocks.`;
      
      // Store in database and send notification
      await db.notification.create({
        data: {
          userId: user.id,
          title: title,
          message: message,
          type: notificationType,
          metadata: JSON.stringify({
            totalProfitLoss: totalProfitLoss,
            stocks: stockSummary
          }),
          read: false
        }
      });
      
      // Send via Supabase
      await sendNotification(
        title,
        message,
        notificationType,
        user.id
      );
      
      console.log(`Sent profit/loss notification to user ${user.id}: ${totalProfitLoss >= 0 ? 'Profit' : 'Loss'} of $${profitLossFormatted}`);
    }
    
    return true;
  } catch (error) {
    console.error("Error sending profit/loss notifications:", error);
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
      
      // Send general market close notification
      const success = await sendNotification(
        "Market Close",
        "The market has now closed for the day at 3:30 PM.",
        "market"
      );

      if (success) {
        console.log("Market close notification sent successfully");
        
        // Wait for 2 seconds before sending profit/loss notifications
        console.log("Waiting 2 seconds before sending profit/loss notifications...");
        await delay(2000); // 2 second delay
        
        // After delay, send individual profit/loss notifications
        console.log("Now sending individual profit/loss notifications to users");
        const profitLossSuccess = await sendProfitLossNotifications();
        
        if (profitLossSuccess) {
          console.log("Profit/loss notifications sent successfully to all users");
        } else {
          console.error("Failed to send profit/loss notifications to some users");
        }
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
  } else if (type === "close") {
    // First send the market close notification
    const success = await sendNotification(
      "Market Close",
      "The market has now closed for the day at 3:30 PM.",
      "market"
    );
    
    if (success) {
      // Wait for 2 seconds before sending profit/loss notifications
      console.log("Waiting 2 seconds before sending profit/loss notifications...");
      await delay(2000); // 2 second delay
      
      // Then send profit/loss notifications
      return await sendProfitLossNotifications();
    }
    return success;
  } else if (type === "profit-loss-only") {
    // For testing profit/loss notifications without market close
    return await sendProfitLossNotifications();
  }
};