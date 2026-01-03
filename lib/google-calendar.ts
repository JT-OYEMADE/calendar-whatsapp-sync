// lib/google-calendar.ts

import { google } from "googleapis";
import { CalendarEvent, BirthdayData } from "@/types";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Load tokens from file if they exist
const tokensPath = join(process.cwd(), "tokens.json");

if (existsSync(tokensPath)) {
  try {
    const tokens = JSON.parse(readFileSync(tokensPath, "utf-8"));
    oauth2Client.setCredentials(tokens);
  } catch (error) {
    console.error("Error loading tokens:", error);
  }
}

export function setTokens(newTokens: any) {
  oauth2Client.setCredentials(newTokens);
  // Save tokens to file
  try {
    writeFileSync(tokensPath, JSON.stringify(newTokens, null, 2));
  } catch (error) {
    console.error("Error saving tokens:", error);
  }
}

export function getAuthUrl() {
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/calendar"],
    prompt: "consent",
  });
}

export async function getTokensFromCode(code: string) {
  const { tokens } = await oauth2Client.getToken(code);
  setTokens(tokens);
  return tokens;
}

const calendar = google.calendar({ version: "v3", auth: oauth2Client });
const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";

export async function createEvent(event: CalendarEvent) {
  try {
    const response = await calendar.events.insert({
      calendarId,
      requestBody: event,
    });
    return response.data;
  } catch (error) {
    console.error("Error creating event:", error);
    throw error;
  }
}

export async function createBirthdayEvent(data: BirthdayData) {
  const { name, birthday } = data;

  // Parse birthday to ensure correct format
  const [year, month, day] = birthday.split("-");
  const currentYear = new Date().getFullYear();
  const birthdayThisYear = `${currentYear}-${month}-${day}`;

  const event: CalendarEvent = {
    summary: `🎂 ${name}'s Birthday`,
    description: `Birthday celebration for ${name}!\n\n🎨 Action Items:\n- Create birthday design\n- Post on social media\n- Send wishes\n\nRemember to make it special! 🎉`,
    start: {
      date: birthdayThisYear,
      timeZone: "Africa/Lagos",
    },
    end: {
      date: birthdayThisYear,
      timeZone: "Africa/Lagos",
    },
    recurrence: ["RRULE:FREQ=YEARLY"],
    reminders: {
      useDefault: false,
      overrides: [
        { method: "email", minutes: 10080 }, // 7 days
        { method: "popup", minutes: 4320 }, // 3 days
        { method: "popup", minutes: 1440 }, // 1 day
        { method: "popup", minutes: 60 }, // 1 hour
      ],
    },
    colorId: "11", // Red color for birthdays
  };

  return createEvent(event);
}

export async function createMonthlyDesignEvent(month: number, year: number) {
  const monthStr = String(month).padStart(2, "0");
  const firstDay = `${year}-${monthStr}-01`;

  const monthNames = [
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

  const event: CalendarEvent = {
    summary: `🎨 Happy New Month Design - ${monthNames[month - 1]}`,
    description: `Create and post "Happy New Month" design for ${
      monthNames[month - 1]
    } ${year}\n\n✅ Tasks:\n- Design creation\n- Team approval\n- Schedule posting\n- Post across all platforms\n\nDeadline: ${
      monthNames[month - 1]
    } 1st`,
    start: {
      date: firstDay,
      timeZone: "Africa/Lagos",
    },
    end: {
      date: firstDay,
      timeZone: "Africa/Lagos",
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: "popup", minutes: 4320 }, // 3 days
        { method: "popup", minutes: 1440 }, // 1 day
        { method: "popup", minutes: 360 }, // 6 hours
      ],
    },
    colorId: "9", // Blue color for designs
  };

  return createEvent(event);
}

export async function createMeetingEvent(
  title: string,
  dateTime: string,
  duration: number = 60,
  description?: string
) {
  const startTime = new Date(dateTime);
  const endTime = new Date(startTime.getTime() + duration * 60000);

  const event: CalendarEvent = {
    summary: `📅 ${title}`,
    description: description || "Church Media Team meeting",
    start: {
      dateTime: startTime.toISOString(),
      timeZone: "Africa/Lagos",
    },
    end: {
      dateTime: endTime.toISOString(),
      timeZone: "Africa/Lagos",
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: "popup", minutes: 1440 }, // 1 day
        { method: "popup", minutes: 60 }, // 1 hour
        { method: "popup", minutes: 15 }, // 15 minutes
      ],
    },
    colorId: "10", // Green color for meetings
  };

  return createEvent(event);
}

export async function createRosterEvent(
  programName: string,
  programDate: string,
  dueDate: string
) {
  const event: CalendarEvent = {
    summary: `📋 Roster Due: ${programName}`,
    description: `Create and finalize roster for ${programName}\n\nProgram Date: ${programDate}\n\n✅ Action Items:\n- Assign team members\n- Confirm availability\n- Share roster with team\n- Get confirmations\n\nDeadline: ${dueDate}`,
    start: {
      date: dueDate,
      timeZone: "Africa/Lagos",
    },
    end: {
      date: dueDate,
      timeZone: "Africa/Lagos",
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: "popup", minutes: 4320 }, // 3 days
        { method: "popup", minutes: 1440 }, // 1 day
      ],
    },
    colorId: "5", // Yellow color for tasks
  };

  return createEvent(event);
}

export async function getUpcomingEvents(daysAhead: number = 30) {
  try {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + daysAhead);

    const response = await calendar.events.list({
      calendarId,
      timeMin: now.toISOString(),
      timeMax: futureDate.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 250,
    });

    return response.data.items || [];
  } catch (error) {
    console.error("Error fetching events:", error);
    throw error;
  }
}

export async function bulkCreateBirthdays(birthdays: BirthdayData[]) {
  const results = [];

  for (const birthday of birthdays) {
    try {
      const event = await createBirthdayEvent(birthday);
      results.push({
        success: true,
        name: birthday.name,
        event,
        eventId: event.id,
      });

      // Add small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      results.push({
        success: false,
        name: birthday.name,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return results;
}

export async function createYearlyMonthlyDesigns(year: number) {
  const results = [];

  for (let month = 1; month <= 12; month++) {
    try {
      const event = await createMonthlyDesignEvent(month, year);
      results.push({
        success: true,
        month,
        event,
        eventId: event.id,
      });

      // Add small delay
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      results.push({
        success: false,
        month,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return results;
}

export async function deleteEvent(eventId: string) {
  try {
    await calendar.events.delete({
      calendarId,
      eventId,
    });
    return { success: true };
  } catch (error) {
    console.error("Error deleting event:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
