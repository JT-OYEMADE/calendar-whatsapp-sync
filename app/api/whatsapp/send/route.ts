import { NextRequest, NextResponse } from "next/server";
import { sendCustomReminder } from "@/lib/whatsapp-meta";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, message } = body;

    if (!title || !message) {
      return NextResponse.json(
        { error: "Title and message are required" },
        { status: 400 }
      );
    }

    console.log(`Sending custom message: ${title}`);
    const results = await sendCustomReminder(title, message);

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success);

    return NextResponse.json({
      success: successful > 0,
      message: `Message sent to ${successful} recipients`,
      total: results.length,
      successful,
      failed: failed.length,
      details: results,
    });
  } catch (error) {
    console.error("WhatsApp send error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Send failed",
      },
      { status: 500 }
    );
  }
}
