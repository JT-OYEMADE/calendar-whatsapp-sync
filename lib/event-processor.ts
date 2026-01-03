// lib/event-processor.ts

import {
  differenceInDays,
  differenceInHours,
  parseISO,
  format,
} from "date-fns";
import { ProcessedEvent, EventType } from "@/types";
import { getUpcomingEvents } from "./google-calendar";
import {
  sendBirthdayReminder,
  sendMeetingReminder,
  sendMonthlyDesignReminder,
  sendRosterReminder,
} from "./whatsapp-meta";

function detectEventType(summary: string, description?: string): EventType {
  const lowerSummary = summary.toLowerCase();
  const lowerDesc = (description || "").toLowerCase();

  if (lowerSummary.includes("birthday") || lowerSummary.includes("🎂")) {
    return "birthday";
  }
  if (lowerSummary.includes("new month") || lowerSummary.includes("🎨")) {
    return "monthly_design";
  }
  if (lowerSummary.includes("meeting") || lowerSummary.includes("📅")) {
    return "meeting";
  }
  if (
    lowerSummary.includes("roster") ||
    lowerDesc.includes("roster") ||
    lowerSummary.includes("📋")
  ) {
    return "roster";
  }

  return "custom";
}

function extractNameFromBirthdayTitle(title: string): string {
  // "🎂 John Doe's Birthday" -> "John Doe"
  return title
    .replace(/🎂/g, "")
    .replace(/birthday/gi, "")
    .replace(/'/g, "")
    .replace(/s\s*$/gi, "")
    .trim();
}

function extractMonthFromDesignTitle(title: string): string {
  // "🎨 Happy New Month Design - January" -> "January"
  const match = title.match(/(?:design\s*-?\s*)(\w+)/i);
  return match ? match[1] : format(new Date(), "MMMM yyyy");
}

interface ReminderTracker {
  [eventId: string]: {
    lastSent: string; // ISO date string
    remindersSent: number[];
  };
}

// In-memory tracker (in production, use a database)
const reminderTracker: ReminderTracker = {};

function shouldSendReminder(
  eventId: string,
  daysUntil: number,
  allowedDays: number[]
): boolean {
  // Check if this is an allowed reminder day
  if (!allowedDays.includes(daysUntil)) {
    return false;
  }

  // Check if we've already sent this specific reminder
  const tracker = reminderTracker[eventId];
  if (tracker && tracker.remindersSent.includes(daysUntil)) {
    return false;
  }

  return true;
}

function markReminderSent(eventId: string, daysUntil: number) {
  if (!reminderTracker[eventId]) {
    reminderTracker[eventId] = {
      lastSent: new Date().toISOString(),
      remindersSent: [],
    };
  }

  reminderTracker[eventId].remindersSent.push(daysUntil);
  reminderTracker[eventId].lastSent = new Date().toISOString();
}

export async function processUpcomingEvents() {
  try {
    const events = await getUpcomingEvents(30); // Check 30 days ahead
    const now = new Date();
    const results: ProcessedEvent[] = [];
    let totalRemindersSent = 0;

    console.log(`Processing ${events.length} upcoming events...`);

    for (const event of events) {
      if (!event.summary || !event.id) continue;

      // Get event date
      const eventDate = event.start?.dateTime
        ? parseISO(event.start.dateTime)
        : event.start?.date
          ? parseISO(event.start.date)
          : null;

      if (!eventDate) continue;

      const type = detectEventType(event.summary, event.description || "");
      const daysUntil = differenceInDays(eventDate, now);
      const hoursUntil = differenceInHours(eventDate, now);

      let reminderSent = false;
      let errorMessage: string | undefined;

      try {
        switch (type) {
          case "birthday": {
            // Send reminders at 7, 3, 1, and 0 days before
            const allowedDays = [7, 3, 1, 0];
            if (shouldSendReminder(event.id, daysUntil, allowedDays)) {
              const name = extractNameFromBirthdayTitle(event.summary);
              const dateStr = format(eventDate, "MMMM d, yyyy");

              console.log(
                `Sending birthday reminder for ${name} (${daysUntil} days)`
              );
              const results = await sendBirthdayReminder(
                name,
                dateStr,
                daysUntil
              );

              const successCount = results.filter((r) => r.success).length;
              if (successCount > 0) {
                markReminderSent(event.id, daysUntil);
                reminderSent = true;
                totalRemindersSent += successCount;
              }
            }
            break;
          }

          case "monthly_design": {
            // Send reminders at 3, 1, and 0 days before
            const allowedDays = [3, 1, 0];
            if (shouldSendReminder(event.id, daysUntil, allowedDays)) {
              const monthName = extractMonthFromDesignTitle(event.summary);

              console.log(
                `Sending monthly design reminder for ${monthName} (${daysUntil} days)`
              );
              const results = await sendMonthlyDesignReminder(
                monthName,
                daysUntil
              );

              const successCount = results.filter((r) => r.success).length;
              if (successCount > 0) {
                markReminderSent(event.id, daysUntil);
                reminderSent = true;
                totalRemindersSent += successCount;
              }
            }
            break;
          }

          case "meeting": {
            // Send reminders at 24 hours and 1 hour before
            if (hoursUntil > 0 && hoursUntil <= 24) {
              // Check if we should send (24h or 1h marks)
              const shouldSend24h = hoursUntil >= 23 && hoursUntil <= 25;
              const shouldSend1h = hoursUntil >= 0.5 && hoursUntil <= 1.5;

              const reminderKey = shouldSend24h ? 1 : shouldSend1h ? 0 : -1;

              if (
                reminderKey >= 0 &&
                shouldSendReminder(event.id, reminderKey, [0, 1])
              ) {
                console.log(
                  `Sending meeting reminder for ${
                    event.summary
                  } (${hoursUntil.toFixed(1)}h)`
                );
                const results = await sendMeetingReminder(
                  event.summary,
                  eventDate.toISOString(),
                  hoursUntil
                );

                const successCount = results.filter((r) => r.success).length;
                if (successCount > 0) {
                  markReminderSent(event.id, reminderKey);
                  reminderSent = true;
                  totalRemindersSent += successCount;
                }
              }
            }
            break;
          }

          case "roster": {
            // Send reminder 3 days before
            const allowedDays = [3];
            if (shouldSendReminder(event.id, daysUntil, allowedDays)) {
              const dateStr = format(eventDate, "MMMM d, yyyy");

              console.log(
                `Sending roster reminder for ${event.summary} (${daysUntil} days)`
              );
              const results = await sendRosterReminder(
                event.summary,
                dateStr,
                daysUntil
              );

              const successCount = results.filter((r) => r.success).length;
              if (successCount > 0) {
                markReminderSent(event.id, daysUntil);
                reminderSent = true;
                totalRemindersSent += successCount;
              }
            }
            break;
          }
        }
      } catch (error) {
        console.error(`Error processing event ${event.summary}:`, error);
        errorMessage = error instanceof Error ? error.message : "Unknown error";
      }

      results.push({
        id: event.id,
        title: event.summary,
        type,
        date: eventDate,
        processed: reminderSent,
        error: errorMessage,
        remindersSent: reminderSent ? 1 : 0,
      });
    }

    console.log(`✅ Processing complete: ${totalRemindersSent} reminders sent`);

    return {
      success: true,
      processed: results.filter((r) => r.processed).length,
      total: results.length,
      totalRemindersSent,
      results,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error processing events:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    };
  }
}

export function getReminderStats() {
  const stats = {
    totalEvents: Object.keys(reminderTracker).length,
    totalReminders: 0,
    eventBreakdown: {} as Record<string, number>,
  };

  for (const eventId in reminderTracker) {
    const count = reminderTracker[eventId].remindersSent.length;
    stats.totalReminders += count;
  }

  return stats;
}
