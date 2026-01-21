import { NextRequest, NextResponse } from "next/server";
import {
  sendWhatsAppMessage,
  formatBirthdayMessage,
  formatNewMonthMessage,
  formatEventReminder,
  formatMeetingReminder,
} from "@/lib/whatsapp";
import { getPublicTodayEvents } from "@/lib/google-calendar";

// This endpoint checks for today's events and sends notifications
export async function GET(request: NextRequest) {
  try {
    // Security check - verify API secret (required for GET/cron)
    const authHeader = request.headers.get("authorization");
    const expectedAuth = `Bearer ${process.env.API_SECRET_KEY}`;

    if (authHeader !== expectedAuth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get today's events using API key (no auth required)
    const events = await getPublicTodayEvents();

    if (!events || events.length === 0) {
      return NextResponse.json({
        message: "No events for today",
        count: 0,
      });
    }

    const notifications = [];

    for (const event of events) {
      const summary = event.summary || "";
      const description = event.description || "";

      let message = "";

      // Determine event type and format message
      if (summary.includes("Birthday") || summary.includes("🎂")) {
        const name = summary.replace(/🎂|Birthday|'s/gi, "").trim();
        message = formatBirthdayMessage(name);
      } else if (summary.includes("New Month") || summary.includes("🎊")) {
        const month =
          summary.split("-")[1]?.trim() ||
          new Date().toLocaleString("default", { month: "long" });
        message = formatNewMonthMessage(month);
      } else if (summary.toLowerCase().includes("meeting")) {
        const time = event.start?.dateTime
          ? new Date(event.start.dateTime).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "TBD";
        message = formatMeetingReminder(summary, time);
      } else {
        const date = event.start?.dateTime
          ? new Date(event.start.dateTime).toLocaleDateString()
          : new Date(event.start?.date || "").toLocaleDateString();
        message = formatEventReminder(summary, date, description);
      }

      // Send WhatsApp notification
      try {
        await sendWhatsAppMessage(message);
        notifications.push({
          event: summary,
          status: "sent",
          message,
        });
      } catch (error) {
        notifications.push({
          event: summary,
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }

      // Small delay between messages to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    return NextResponse.json({
      success: true,
      count: events.length,
      notifications,
    });
  } catch (error) {
    console.error("Notification check error:", error);
    return NextResponse.json(
      {
        error: "Failed to check notifications",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// Manual trigger endpoint (for testing - no auth required)
export async function POST(request: NextRequest) {
  // Skip auth check for manual testing from dashboard
  try {
    const events = await getPublicTodayEvents();

    if (!events || events.length === 0) {
      return NextResponse.json({
        message: "No events for today",
        count: 0,
      });
    }

    const notifications = [];

    for (const event of events) {
      const summary = event.summary || "";
      const description = event.description || "";

      let message = "";

      if (summary.includes("Birthday") || summary.includes("🎂")) {
        const name = summary.replace(/🎂|Birthday|'s/gi, "").trim();
        message = formatBirthdayMessage(name);
      } else if (summary.includes("New Month") || summary.includes("🎊")) {
        const month =
          summary.split("-")[1]?.trim() ||
          new Date().toLocaleString("default", { month: "long" });
        message = formatNewMonthMessage(month);
      } else if (summary.toLowerCase().includes("meeting")) {
        const time = event.start?.dateTime
          ? new Date(event.start.dateTime).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "TBD";
        message = formatMeetingReminder(summary, time);
      } else {
        const date = event.start?.dateTime
          ? new Date(event.start.dateTime).toLocaleDateString()
          : new Date(event.start?.date || "").toLocaleDateString();
        message = formatEventReminder(summary, date, description);
      }

      try {
        await sendWhatsAppMessage(message);
        notifications.push({
          event: summary,
          status: "sent",
          message,
        });
      } catch (error) {
        notifications.push({
          event: summary,
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    return NextResponse.json({
      success: true,
      count: events.length,
      notifications,
    });
  } catch (error) {
    console.error("Notification check error:", error);
    return NextResponse.json(
      {
        error: "Failed to check notifications",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
