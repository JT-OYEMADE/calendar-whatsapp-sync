import { NextRequest, NextResponse } from "next/server";
import { createEvent, createNewMonthEvents } from "@/lib/googleCalendar";

// Create custom events
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;

    if (type === "new-month-year") {
      // Create all monthly events for the year
      const { year } = data;
      const events = await createNewMonthEvents(
        year || new Date().getFullYear()
      );

      return NextResponse.json({
        success: true,
        message: `Created ${events.length} monthly events`,
        events: events.map((e) => ({ id: e.id, summary: e.summary })),
      });
    }

    if (type === "custom") {
      // Create a custom event
      const {
        summary,
        description,
        startDate,
        endDate,
        startTime,
        endTime,
        reminder,
      } = data;

      let start, end;

      if (startTime) {
        // Event with specific time
        start = { dateTime: `${startDate}T${startTime}:00` };
        end = { dateTime: `${endDate}T${endTime}:00` };
      } else {
        // All-day event
        start = { date: startDate };
        end = { date: endDate };
      }

      const event = {
        summary,
        description,
        start,
        end,
        reminders: {
          useDefault: false,
          overrides: [{ method: "popup", minutes: reminder || 60 }],
        },
      };

      const created = await createEvent(event);

      return NextResponse.json({
        success: true,
        event: created,
      });
    }

    if (type === "meeting") {
      // Create meeting event
      const { title, description, date, time, duration } = data;

      const startDateTime = new Date(`${date}T${time}`);
      const endDateTime = new Date(
        startDateTime.getTime() + (duration || 60) * 60000
      );

      const event = {
        summary: `📅 Meeting: ${title}`,
        description,
        start: { dateTime: startDateTime.toISOString() },
        end: { dateTime: endDateTime.toISOString() },
        reminders: {
          useDefault: false,
          overrides: [
            { method: "popup", minutes: 30 },
            { method: "popup", minutes: 1440 }, // 1 day before
          ],
        },
      };

      const created = await createEvent(event);

      return NextResponse.json({
        success: true,
        event: created,
      });
    }

    if (type === "roster-reminder") {
      // Create roster creation reminder
      const { eventName, eventDate, reminderDaysBefore } = data;

      const eventDateObj = new Date(eventDate);
      const reminderDate = new Date(eventDateObj);
      reminderDate.setDate(reminderDate.getDate() - (reminderDaysBefore || 7));

      const event = {
        summary: `📋 Create Roster: ${eventName}`,
        description: `Reminder to create duty roster for ${eventName} on ${eventDate}`,
        start: { date: reminderDate.toISOString().split("T")[0] },
        end: { date: reminderDate.toISOString().split("T")[0] },
        reminders: {
          useDefault: false,
          overrides: [{ method: "popup", minutes: 0 }],
        },
      };

      const created = await createEvent(event);

      return NextResponse.json({
        success: true,
        event: created,
      });
    }

    return NextResponse.json({ error: "Invalid event type" }, { status: 400 });
  } catch (error) {
    console.error("Event creation error:", error);
    return NextResponse.json(
      {
        error: "Failed to create event",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
