import { NextResponse } from "next/server";
import { sendTestMessage } from "@/lib/whatsapp-meta";

export async function POST() {
  try {
    console.log("Sending WhatsApp test message...");
    const result = await sendTestMessage();

    return NextResponse.json({
      success: result.success,
      message: result.success
        ? "Test message sent to group successfully!"
        : "Failed to send test message",
      details: result,
    });
  } catch (error) {
    console.error("WhatsApp test error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Test failed",
      },
      { status: 500 }
    );
  }
}

// import { NextResponse } from "next/server";
// import { sendTestMessage } from "@/lib/whatsapp-meta";

// export async function POST() {
//   try {
//     console.log("Sending WhatsApp test message...");
//     const results = await sendTestMessage();

//     const successful = results.filter((r) => r.success).length;
//     const failed = results.filter((r) => !r.success);

//     return NextResponse.json({
//       success: successful > 0,
//       message: `Test message sent to ${successful} recipients`,
//       total: results.length,
//       successful,
//       failed: failed.length,
//       details: results,
//     });
//   } catch (error) {
//     console.error("WhatsApp test error:", error);
//     return NextResponse.json(
//       {
//         success: false,
//         error: error instanceof Error ? error.message : "Test failed",
//       },
//       { status: 500 }
//     );
//   }
// }
