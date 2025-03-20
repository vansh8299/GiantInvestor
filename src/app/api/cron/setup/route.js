import { startCronJobs, getNextRunTimes } from "@/services/cronService";

// Initialize cron jobs
let initialized = false;

export async function GET() {
  try {
    if (!initialized) {
      const success = startCronJobs();
      initialized = success;
      console.log("Cron jobs initialized via API route, success:", success);
    }

    // Get next scheduled run times for debugging
    const nextRunTimes = getNextRunTimes();

    return new Response(
      JSON.stringify({
        success: true,
        message: "Cron jobs status",
        status: initialized ? "running" : "not running",
        nextRuns: {
          marketOpen: nextRunTimes.marketOpen,
          marketClose: nextRunTimes.marketClose,
        },
        serverTime: new Date().toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error handling cron setup request:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Failed to handle cron setup request",
        error: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
