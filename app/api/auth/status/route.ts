// app/api/auth/status/route.ts
import { NextResponse } from "next/server";
import { existsSync } from "fs";
import { join } from "path";

export async function GET() {
  const tokensPath = join(process.cwd(), "tokens.json");
  const isAuthenticated = existsSync(tokensPath);

  return NextResponse.json({
    authenticated: isAuthenticated,
    message: isAuthenticated
      ? "Google Calendar connected"
      : "Not authenticated. Please connect Google Calendar.",
  });
}
