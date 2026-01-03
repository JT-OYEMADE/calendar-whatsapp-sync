// app/api/upload/birthdays/route.ts

import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { bulkCreateBirthdays } from "@/lib/google-calendar";
import { BirthdayData } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate file type
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith(".xlsx") && !fileName.endsWith(".xls")) {
      return NextResponse.json(
        { error: "Please upload an Excel file (.xlsx or .xls)" },
        { status: 400 }
      );
    }

    // Read Excel file
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data: any[] = XLSX.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      return NextResponse.json(
        { error: "Excel file is empty" },
        { status: 400 }
      );
    }

    // Parse birthdays
    const birthdays: BirthdayData[] = data
      .map((row: any) => {
        // Handle different possible column names (case-insensitive)
        const name =
          row.Name ||
          row.name ||
          row.NAME ||
          row["Full Name"] ||
          row.fullName ||
          row.FULLNAME ||
          row["Member Name"] ||
          row.memberName;

        let birthday =
          row.Birthday ||
          row.birthday ||
          row.BIRTHDAY ||
          row.DOB ||
          row.dob ||
          row["Date of Birth"] ||
          row.dateOfBirth ||
          row.DateOfBirth;

        const phone =
          row.Phone ||
          row.phone ||
          row.PHONE ||
          row["Phone Number"] ||
          row.phoneNumber ||
          "";

        const subUnit =
          row.SubUnit ||
          row.subUnit ||
          row.SUBUNIT ||
          row.Unit ||
          row.unit ||
          row.Department ||
          row.department ||
          "";

        // Handle Excel date serial numbers
        if (typeof birthday === "number") {
          const date = XLSX.SSF.parse_date_code(birthday);
          birthday = `${date.y}-${String(date.m).padStart(2, "0")}-${String(
            date.d
          ).padStart(2, "0")}`;
        }

        // Handle various date formats and normalize to YYYY-MM-DD
        if (birthday && typeof birthday === "string") {
          try {
            const dateObj = new Date(birthday);
            if (!isNaN(dateObj.getTime())) {
              const year = dateObj.getFullYear();
              const month = String(dateObj.getMonth() + 1).padStart(2, "0");
              const day = String(dateObj.getDate()).padStart(2, "0");
              birthday = `${year}-${month}-${day}`;
            }
          } catch (e) {
            console.error("Error parsing date:", birthday);
          }
        } else if (birthday instanceof Date) {
          const year = birthday.getFullYear();
          const month = String(birthday.getMonth() + 1).padStart(2, "0");
          const day = String(birthday.getDate()).padStart(2, "0");
          birthday = `${year}-${month}-${day}`;
        }

        return {
          name: name?.toString().trim() || "Unknown",
          birthday: birthday || "",
          phone: phone?.toString().trim() || "",
          subUnit: subUnit?.toString().trim() || "",
        };
      })
      .filter((b) => {
        // Filter out invalid entries
        if (!b.name || b.name === "Unknown") return false;
        if (!b.birthday) return false;

        // Validate date format
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        return dateRegex.test(b.birthday);
      });

    if (birthdays.length === 0) {
      return NextResponse.json(
        {
          error:
            'No valid birthdays found. Please ensure your Excel has "Name" and "Birthday" columns with valid dates.',
          hint: "Expected format - Name: text, Birthday: date (any format)",
        },
        { status: 400 }
      );
    }

    console.log(`Processing ${birthdays.length} birthdays...`);

    // Create calendar events
    const results = await bulkCreateBirthdays(birthdays);

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success);

    return NextResponse.json({
      success: true,
      message: `Successfully created ${successful} birthday events out of ${birthdays.length}`,
      total: birthdays.length,
      successful,
      failed: failed.length,
      failedItems: failed.map((f) => ({
        name: f.name,
        error: typeof f.error === "string" ? f.error : "Unknown error",
      })),
      preview: birthdays.slice(0, 5).map((b) => ({
        name: b.name,
        birthday: b.birthday,
      })),
    });
  } catch (error) {
    console.error("Error uploading birthdays:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Upload failed",
        details: "Check server logs for more information",
      },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
