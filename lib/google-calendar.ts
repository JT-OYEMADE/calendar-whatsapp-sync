// Google Calendar access using API Key (for automated/public access)
import { google } from "googleapis";

export function getPublicCalendarClient() {
  const calendar = google.calendar({
    version: "v3",
    auth: process.env.GOOGLE_API_KEY,
  });

  return calendar;
}

export async function getPublicTodayEvents() {
  const calendar = getPublicCalendarClient();
  const calendarId = process.env.GOOGLE_CALENDAR_ID;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  try {
    const response = await calendar.events.list({
      calendarId,
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
    });

    return response.data.items || [];
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    throw error;
  }
}

export async function getPublicUpcomingEvents(daysAhead: number = 7) {
  const calendar = getPublicCalendarClient();
  const calendarId = process.env.GOOGLE_CALENDAR_ID;

  const now = new Date();
  const future = new Date();
  future.setDate(future.getDate() + daysAhead);

  try {
    const response = await calendar.events.list({
      calendarId,
      timeMin: now.toISOString(),
      timeMax: future.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
    });

    return response.data.items || [];
  } catch (error) {
    console.error("Error fetching upcoming events:", error);
    throw error;
  }
}
