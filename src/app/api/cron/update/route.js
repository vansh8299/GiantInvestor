import { updateCronSchedule, getNextRunTimes } from "@/services/cronService";

export async function POST(req) {
  try {
    const { jobType, schedule } = await req.json();
    
    if (!jobType || !schedule) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "jobType and schedule are required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    
    // Update the cron schedule
    const success = updateCronSchedule(jobType, schedule);
    
    if (!success) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Failed to update cron schedule",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    
    // Get updated run times
    const nextRunTimes = getNextRunTimes();
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `${jobType} job schedule updated successfully`,
        nextRun: jobType === "open" ? nextRunTimes.marketOpen : nextRunTimes.marketClose,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error updating cron schedule:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Failed to update cron schedule",
        error: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}