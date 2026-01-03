// app/api/calendar/sync/route.ts

import { NextRequest, NextResponse } from "next/server";
import {
  createYearlyMonthlyDesigns,
  createMeetingEvent,
  createRosterEvent,
  createEvent,
} from "@/lib/google-calendar";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    if (!action) {
      return NextResponse.json(
        { error: "Action is required" },
        { status: 400 }
      );
    }

    switch (action) {
      case "create_monthly_designs": {
        const year = data?.year || new Date().getFullYear();
        console.log(`Creating monthly design events for ${year}...`);

        const monthResults = await createYearlyMonthlyDesigns(year);
        const successful = monthResults.filter((r) => r.success).length;

        return NextResponse.json({
          success: true,
          message: `Created ${successful} monthly design events for ${year}`,
          results: monthResults,
          year,
        });
      }

      case "create_meeting": {
        if (!data?.title || !data?.dateTime) {
          return NextResponse.json(
            { error: "Title and dateTime are required" },
            { status: 400 }
          );
        }

        const meeting = await createMeetingEvent(
          data.title,
          data.dateTime,
          data.duration || 60,
          data.description
        );

        return NextResponse.json({
          success: true,
          message: "Meeting created successfully",
          event: meeting,
        });
      }

      case "create_roster_event": {
        if (!data?.programName || !data?.programDate || !data?.dueDate) {
          return NextResponse.json(
            { error: "Program name, program date, and due date are required" },
            { status: 400 }
          );
        }

        const rosterEvent = await createRosterEvent(
          data.programName,
          data.programDate,
          data.dueDate
        );

        return NextResponse.json({
          success: true,
          message: "Roster event created successfully",
          event: rosterEvent,
        });
      }

      case "create_custom_event": {
        if (!data?.title || (!data?.date && !data?.dateTime)) {
          return NextResponse.json(
            { error: "Title and date/dateTime are required" },
            { status: 400 }
          );
        }

        const customEvent = await createEvent({
          summary: data.title,
          description: data.description || "",
          start: data.allDay
            ? { date: data.date, timeZone: "Africa/Lagos" }
            : { dateTime: data.dateTime, timeZone: "Africa/Lagos" },
          end: data.allDay
            ? { date: data.date, timeZone: "Africa/Lagos" }
            : {
                dateTime: data.endDateTime || data.dateTime,
                timeZone: "Africa/Lagos",
              },
          reminders: {
            useDefault: false,
            overrides: data.reminders || [{ method: "popup", minutes: 1440 }],
          },
          colorId: data.colorId || "7",
        });

        return NextResponse.json({
          success: true,
          message: "Custom event created successfully",
          event: customEvent,
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Calendar sync error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Sync failed",
        details: "Check server logs for more information",
      },
      { status: 500 }
    );
  }
}
