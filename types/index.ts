// types/index.ts

export interface TeamMember {
  name: string;
  phone: string;
  birthday: string; // YYYY-MM-DD format
  subUnit: string;
  role?: string;
}

export interface ChurchEvent {
  id: string;
  type: "birthday" | "monthly_design" | "meeting" | "roster" | "custom";
  title: string;
  description?: string;
  date: string; // ISO 8601 format
  reminderDays: number[]; // [7, 3, 1, 0] - days before to send
  assignedTo?: string[];
  recurring?: {
    frequency: "daily" | "weekly" | "monthly" | "yearly";
    interval: number;
  };
  metadata?: Record<string, any>;
}

export interface Reminder {
  eventId: string;
  eventTitle: string;
  eventDate: string;
  reminderDate: string;
  sent: boolean;
  messageTemplate: string;
  recipients: string[];
}

export interface WhatsAppMessage {
  to: string; // phone number with country code
  body: string;
  mediaUrl?: string;
}

export interface WhatsAppResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  details?: any;
}

export type EventType = ChurchEvent["type"];

export interface CalendarEvent {
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  recurrence?: string[];
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: "email" | "popup";
      minutes: number;
    }>;
  };
  colorId?: string;
}

export interface BirthdayData {
  name: string;
  birthday: string;
  phone?: string;
  subUnit?: string;
}

export interface UploadResult {
  success: boolean;
  total: number;
  successful: number;
  failed: number;
  failedItems?: Array<{
    name: string;
    error: any;
  }>;
  message?: string;
}

export interface ProcessedEvent {
  id: string;
  title: string;
  type: EventType;
  date: Date;
  processed: boolean;
  error?: string;
  remindersSent?: number;
}
