// app/api/cron/check-reminders/route.ts

import { NextRequest, NextResponse } from "next/server";
import { processUpcomingEvents, getReminderStats } from "@/lib/event-processor";

export async function GET(request: NextRequest) {
  // Verify cron secret for security
  const authHeader = request.headers.get("authorization");
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

  if (authHeader !== expectedAuth) {
    console.warn("Unauthorized cron attempt");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("🔄 Starting scheduled reminder check...");
    const result = await processUpcomingEvents();
    const stats = getReminderStats();

    console.log("✅ Reminder check completed successfully");

    return NextResponse.json({
      // success: true,
      // timestamp: new Date().toISOString(),
      ...result,
      stats,
    });
  } catch (error) {
    console.error("❌ Cron job error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Also allow POST for manual triggers from dashboard
export async function POST(request: NextRequest) {
  return GET(request);
}
