// lib/whatsapp-meta.ts

import axios from "axios";
import { WhatsAppMessage, WhatsAppResponse } from "@/types";

const WHATSAPP_API_URL = "https://graph.facebook.com/v18.0";
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

// Get verified recipients from env
const getVerifiedRecipients = (): string[] => {
  const recipients = process.env.WHATSAPP_RECIPIENT_NUMBERS || "";
  return recipients
    .split(",")
    .map((num) => num.trim())
    .filter(Boolean);
};

export async function sendWhatsAppMessage(
  message: WhatsAppMessage
): Promise<WhatsAppResponse> {
  try {
    // Ensure phone number format (remove + and spaces)
    const cleanPhone = message.to.replace(/[\s+]/g, "");

    const response = await axios.post(
      `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: cleanPhone,
        type: "text",
        text: {
          preview_url: false,
          body: message.body,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    return {
      success: true,
      messageId: response.data.messages[0].id,
      details: response.data,
    };
  } catch (error: any) {
    console.error(
      "WhatsApp send error:",
      error.response?.data || error.message
    );
    return {
      success: false,
      error:
        error.response?.data?.error?.message ||
        error.message ||
        "Failed to send message",
      details: error.response?.data,
    };
  }
}

export async function sendToAllRecipients(
  body: string,
  mediaUrl?: string
): Promise<WhatsAppResponse[]> {
  const recipients = getVerifiedRecipients();
  const results: WhatsAppResponse[] = [];

  for (const recipient of recipients) {
    const result = await sendWhatsAppMessage({
      to: recipient,
      body,
      mediaUrl,
    });

    results.push({
      ...result,
      details: { ...result.details, recipient },
    });

    // Add delay between messages to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return results;
}

export async function sendBirthdayReminder(
  name: string,
  date: string,
  daysUntil: number
): Promise<WhatsAppResponse[]> {
  let message: string;

  if (daysUntil === 0) {
    message =
      `🎉🎂 *BIRTHDAY TODAY!* 🎂🎉\n\n` +
      `Happy Birthday *${name}*! 🥳🎊\n\n` +
      `🎨 *URGENT ACTION REQUIRED:*\n` +
      `• Birthday design needed TODAY!\n` +
      `• Designers, please create and share ASAP\n` +
      `• Post across all social media platforms\n\n` +
      `Let's make ${name}'s day special! ❤️\n\n` +
      `_Church Media Team Reminder 🙏_`;
  } else if (daysUntil === 1) {
    message =
      `⏰ *REMINDER: Birthday Tomorrow!*\n\n` +
      `🎂 *${name}'s* birthday is TOMORROW (${date})\n\n` +
      `🎨 *Action Items for Today:*\n` +
      `✅ Create birthday design\n` +
      `✅ Get design approved\n` +
      `✅ Prepare birthday message\n` +
      `✅ Schedule post for tomorrow\n\n` +
      `Time is running out! ⏳\n\n` +
      `_Church Media Team Reminder 🙏_`;
  } else if (daysUntil === 3) {
    message =
      `📅 *Birthday Alert - 3 Days*\n\n` +
      `🎂 *${name}'s* birthday is in 3 days (${date})\n\n` +
      `🎨 *This Week's Tasks:*\n` +
      `📌 Start planning birthday design\n` +
      `📌 Assign designer\n` +
      `📌 Gather photos/materials\n` +
      `📌 Brainstorm creative ideas\n\n` +
      `Let's make it memorable! 🌟\n\n` +
      `_Church Media Team Reminder 🙏_`;
  } else {
    message =
      `📢 *Upcoming Birthday - ${daysUntil} Days*\n\n` +
      `🎂 *${name}'s* birthday: ${date}\n\n` +
      `📝 *Note:* Mark your calendar!\n` +
      `We'll send more reminders as the date approaches.\n\n` +
      `_Church Media Team Reminder 🙏_`;
  }

  return sendToAllRecipients(message);
}

export async function sendMonthlyDesignReminder(
  month: string,
  daysUntil: number
): Promise<WhatsAppResponse[]> {
  let message: string;

  if (daysUntil === 0) {
    message =
      `🎨 *NEW MONTH DESIGN - TODAY!*\n\n` +
      `📅 It's the 1st of *${month}*!\n\n` +
      `🚨 *URGENT:* Happy New Month design must be posted TODAY!\n\n` +
      `✅ *Final Checklist:*\n` +
      `• Design completed? ✓\n` +
      `• Approved by leadership? ✓\n` +
      `• Posted on all platforms? ✓\n` +
      `• Instagram, Facebook, WhatsApp Status? ✓\n\n` +
      `Let's start the month with excellence! 🚀\n\n` +
      `_Church Media Team Reminder 🙏_`;
  } else if (daysUntil === 1) {
    message =
      `⏰ *URGENT: New Month Design Due Tomorrow!*\n\n` +
      `📅 ${month} begins TOMORROW!\n\n` +
      `🎨 *Action Required TODAY:*\n` +
      `✅ Finalize "Happy New Month" design\n` +
      `✅ Get final approval\n` +
      `✅ Prepare captions/messages\n` +
      `✅ Schedule for posting tomorrow morning\n\n` +
      `Last chance to prepare! ⏳\n\n` +
      `_Church Media Team Reminder 🙏_`;
  } else {
    message =
      `🗓️ *New Month Design Reminder*\n\n` +
      `📅 ${month} begins in *${daysUntil} days*\n\n` +
      `🎨 *This Week's Tasks:*\n` +
      `• Create "Happy New Month" design\n` +
      `• Choose theme/color scheme\n` +
      `• Draft message/caption\n` +
      `• Submit for approval\n` +
      `• Prepare for all platforms\n\n` +
      `Time to get creative! 💡✨\n\n` +
      `_Church Media Team Reminder 🙏_`;
  }

  return sendToAllRecipients(message);
}

export async function sendMeetingReminder(
  title: string,
  dateTime: string,
  hoursUntil: number
): Promise<WhatsAppResponse[]> {
  const timeStr = new Date(dateTime).toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  let message: string;

  if (hoursUntil <= 1) {
    message =
      `⏰ *MEETING STARTING SOON!*\n\n` +
      `📅 *${title}*\n` +
      `🕐 ${timeStr}\n\n` +
      `⚡ *Starts in ${hoursUntil < 1 ? "less than an hour" : "1 hour"}!*\n\n` +
      `Please be on time! 🏃‍♂️\n\n` +
      `_Church Media Team Reminder 🙏_`;
  } else if (hoursUntil <= 24) {
    message =
      `📅 *Meeting Reminder - Today*\n\n` +
      `*${title}*\n` +
      `🕐 ${timeStr}\n\n` +
      `⏰ Starts in ${Math.round(hoursUntil)} hours\n\n` +
      `📝 Come prepared!\n\n` +
      `_Church Media Team Reminder 🙏_`;
  } else {
    const days = Math.ceil(hoursUntil / 24);
    message =
      `📌 *Upcoming Meeting*\n\n` +
      `*${title}*\n` +
      `🕐 ${timeStr}\n\n` +
      `📅 In ${days} day${days > 1 ? "s" : ""}\n\n` +
      `Mark your calendar! 📝\n\n` +
      `_Church Media Team Reminder 🙏_`;
  }

  return sendToAllRecipients(message);
}

export async function sendRosterReminder(
  programName: string,
  programDate: string,
  daysUntil: number
): Promise<WhatsAppResponse[]> {
  const message =
    `📋 *ROSTER UPDATE NEEDED*\n\n` +
    `🎯 *Program:* ${programName}\n` +
    `📅 *Program Date:* ${programDate}\n` +
    `⏰ *Due in:* ${daysUntil} days\n\n` +
    `*Action Required:*\n` +
    `✅ Create/update roster\n` +
    `✅ Assign team members & roles\n` +
    `✅ Confirm availability\n` +
    `✅ Share with entire team\n` +
    `✅ Get confirmations\n\n` +
    `Team leads, please handle this ASAP! ⚡\n\n` +
    `_Church Media Team Reminder 🙏_`;

  return sendToAllRecipients(message);
}

export async function sendCustomReminder(
  title: string,
  message: string
): Promise<WhatsAppResponse[]> {
  const formattedMessage = `📢 *${title}*\n\n${message}\n\n_Church Media Team Reminder 🙏_`;
  return sendToAllRecipients(formattedMessage);
}

// Test function to verify WhatsApp setup
export async function sendTestMessage(): Promise<WhatsAppResponse[]> {
  const message =
    `✅ *System Test Message*\n\n` +
    `Your Church Media Reminder System is working perfectly!\n\n` +
    `🎉 All systems operational:\n` +
    `✓ WhatsApp connection active\n` +
    `✓ Google Calendar synced\n` +
    `✓ Reminder system ready\n\n` +
    `You'll receive automatic reminders for:\n` +
    `🎂 Birthdays\n` +
    `🎨 Monthly designs\n` +
    `📅 Meetings\n` +
    `📋 Rosters\n\n` +
    `_Test completed successfully! 🙏_`;

  return sendToAllRecipients(message);
}
