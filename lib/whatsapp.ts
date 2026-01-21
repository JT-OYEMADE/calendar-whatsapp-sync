// WhatsApp Business Cloud API integration

export async function sendWhatsAppMessage(message: string) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const groupId = process.env.WHATSAPP_GROUP_ID;

  const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: groupId,
      type: "text",
      text: {
        preview_url: false,
        body: message,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`WhatsApp API Error: ${error}`);
  }

  return response.json();
}

// Format different types of notifications
export function formatBirthdayMessage(name: string): string {
  return `🎉🎂 BIRTHDAY REMINDER 🎂🎉

Happy Birthday to ${name}! 🎊

Media Team, let's create a special birthday design for ${name} today!

📌 Action Items:
• Design lead: Create birthday graphics
• Post by: End of day
• Platform: All social media channels

Let's make ${name}'s day special! 🌟`;
}

export function formatNewMonthMessage(month: string): string {
  return `🎊✨ HAPPY NEW MONTH! ✨🎊

Welcome to ${month}! 

Media Team Tasks:
📌 Create "Happy New Month" design
📌 Schedule posts across all platforms
📌 Update monthly content calendar

Let's start this month strong! 💪`;
}

export function formatMeetingReminder(title: string, time: string): string {
  return `📅 MEETING REMINDER

${title}

🕐 Time: ${time}
📍 Don't forget to join!

See you there! 👋`;
}

export function formatEventReminder(
  title: string,
  date: string,
  description?: string
): string {
  return `📢 EVENT REMINDER

${title}

📅 Date: ${date}
${description ? `\n📝 Details: ${description}` : ""}

Media Team, please ensure all materials are ready!`;
}

export function formatRosterReminder(
  eventName: string,
  daysUntil: number
): string {
  return `⚠️ ROSTER REMINDER

Upcoming Event: ${eventName}
⏰ ${daysUntil} days away

📋 Action Required:
• Create duty roster for the event
• Assign team members to tasks
• Share roster with the team

Please finalize the roster ASAP!`;
}
