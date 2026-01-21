import cron from "node-cron";

// Setup cron jobs for automatic notifications
export function setupCronJobs() {
  // Run every day at 8:00 AM
  cron.schedule("0 8 * * *", async () => {
    console.log("Running daily notification check...");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/check`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${process.env.API_SECRET_KEY}`,
          },
        }
      );

      const result = await response.json();
      console.log("Notification check result:", result);
    } catch (error) {
      console.error("Cron job error:", error);
    }
  });

  console.log("Cron jobs scheduled successfully");
}

// For serverless environments like Vercel, you'll need to use a different approach
// See the alternative approach in the documentation below
