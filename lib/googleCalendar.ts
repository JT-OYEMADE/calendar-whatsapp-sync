import { google } from "googleapis";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function getCalendarClient() {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    throw new Error("Not authenticated. Please sign in again.");
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );

  oauth2Client.setCredentials({
    access_token: session.accessToken as string,
    refresh_token: session.refreshToken as string,
  });

  return google.calendar({ version: "v3", auth: oauth2Client });
}

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: string;
      minutes: number;
    }>;
  };
}

export async function getUpcomingEvents(daysAhead: number = 7) {
  const calendar = await getCalendarClient();
  const calendarId = process.env.GOOGLE_CALENDAR_ID;

  const now = new Date();
  const future = new Date();
  future.setDate(future.getDate() + daysAhead);

  const response = await calendar.events.list({
    calendarId,
    timeMin: now.toISOString(),
    timeMax: future.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
  });

  return response.data.items || [];
}

export async function getTodayEvents() {
  const calendar = await getCalendarClient();
  const calendarId = process.env.GOOGLE_CALENDAR_ID;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const response = await calendar.events.list({
    calendarId,
    timeMin: startOfDay.toISOString(),
    timeMax: endOfDay.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
  });

  return response.data.items || [];
}

export async function createEvent(event: Partial<CalendarEvent>) {
  const calendar = await getCalendarClient();
  const calendarId = process.env.GOOGLE_CALENDAR_ID;

  const response = await calendar.events.insert({
    calendarId,
    requestBody: event as any,
  });

  return response.data;
}

export async function createBirthdayEvent(name: string, birthDate: Date) {
  const month = birthDate.getMonth() + 1;
  const day = birthDate.getDate();

  const event = {
    summary: `🎂 ${name}'s Birthday`,
    description: `Birthday celebration for ${name}`,
    start: {
      date: `2025-${String(month).padStart(2, "0")}-${String(day).padStart(
        2,
        "0",
      )}`,
    },
    end: {
      date: `2025-${String(month).padStart(2, "0")}-${String(day).padStart(
        2,
        "0",
      )}`,
    },
    recurrence: ["RRULE:FREQ=YEARLY"],
    reminders: {
      useDefault: false,
      overrides: [
        { method: "popup", minutes: 24 * 60 },
        { method: "popup", minutes: 60 },
      ],
    },
  };

  return createEvent(event);
}

export async function createNewMonthEvents(year: number) {
  const calendar = await getCalendarClient();
  const calendarId = process.env.GOOGLE_CALENDAR_ID;

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const events = [];

  for (let i = 0; i < 12; i++) {
    const event = {
      summary: `🎊 Happy New Month - ${months[i]}`,
      description: "New month celebration and goals",
      start: {
        date: `${year}-${String(i + 1).padStart(2, "0")}-01`,
      },
      end: {
        date: `${year}-${String(i + 1).padStart(2, "0")}-01`,
      },
      reminders: {
        useDefault: false,
        overrides: [{ method: "popup", minutes: 0 }],
      },
    };

    const created = await calendar.events.insert({
      calendarId,
      requestBody: event,
    });

    events.push(created.data);
  }

  return events;
}
