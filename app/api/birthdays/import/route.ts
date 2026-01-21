import { NextRequest, NextResponse } from "next/server";
import { readBirthdaysFromCSV } from "@/lib/importBirthdays";
import { createBirthdayEvent } from "@/lib/googleCalendar";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Import birthdays from uploaded file
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Not authenticated. Please sign in." },
        { status: 401 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const fileType = file.name.split(".").pop()?.toLowerCase();

    if (fileType === "csv") {
      // Handle CSV
      const text = await file.text();
      const birthdays = readBirthdaysFromCSV(text);

      if (birthdays.length === 0) {
        return NextResponse.json({
          success: false,
          error:
            "No valid birthdays found in CSV. Make sure format is: Name,Birthday (YYYY-MM-DD)",
        });
      }

      const results = [];
      for (const birthday of birthdays) {
        try {
          const event = await createBirthdayEvent(birthday.name, birthday.date);
          results.push({
            success: true,
            name: birthday.name,
            date: birthday.date.toLocaleDateString(),
          });
        } catch (error) {
          console.error(
            `Failed to import birthday for ${birthday.name}:`,
            error,
          );
          results.push({
            success: false,
            name: birthday.name,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      return NextResponse.json({
        success: true,
        imported: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
        results,
      });
    } else if (fileType === "xlsx" || fileType === "xls") {
      // For Excel files, save to temp location and process
      // Note: In production, use a proper file upload service
      return NextResponse.json(
        {
          error:
            "Excel import requires server-side file storage. Please convert to CSV or use the manual entry API.",
        },
        { status: 400 },
      );
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload CSV or Excel file." },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      {
        error: "Failed to import birthdays",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// Manual birthday entry
export async function PUT(request: NextRequest) {
  try {
    const { birthdays } = await request.json();

    if (!Array.isArray(birthdays)) {
      return NextResponse.json(
        { error: "Invalid data format. Expected array of birthdays." },
        { status: 400 },
      );
    }

    const results = [];

    for (const entry of birthdays) {
      const { name, date } = entry;

      if (!name || !date) {
        results.push({
          success: false,
          name,
          error: "Missing name or date",
        });
        continue;
      }

      try {
        const birthDate = new Date(date);
        const event = await createBirthdayEvent(name, birthDate);
        results.push({
          success: true,
          name,
          date: birthDate.toLocaleDateString(),
        });
      } catch (error) {
        results.push({
          success: false,
          name,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      success: true,
      imported: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    });
  } catch (error) {
    console.error("Manual entry error:", error);
    return NextResponse.json(
      {
        error: "Failed to add birthdays",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
