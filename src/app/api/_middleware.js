import { startCronJobs } from "@/services/cronService";

// Initialize cron jobs when server starts
let cronInitialized = false;

export function middleware(request) {
  // Initialize cron jobs if not already initialized
  if (!cronInitialized && typeof process !== "undefined") {
    console.log("Initializing cron jobs from middleware");
    cronInitialized = startCronJobs();
  }

  // Continue with the request
  return request;
}
