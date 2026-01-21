import * as XLSX from "xlsx";
import { createBirthdayEvent } from "./googleCalendar";

interface BirthdayRow {
  name: string;
  date: Date;
}

// Read birthdays from Excel file
export function readBirthdaysFromExcel(filePath: string): BirthdayRow[] {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Convert to JSON
  const data = XLSX.utils.sheet_to_json(worksheet, { raw: false });

  const birthdays: BirthdayRow[] = [];

  data.forEach((row: any) => {
    // Assuming columns are "Name" and "Birthday" or "Date"
    // Adjust these based on your Excel structure
    const name = row.Name || row.name;
    const dateStr = row.Birthday || row.Date || row.birthday || row.date;

    if (name && dateStr) {
      let birthDate: Date;

      // Try parsing different date formats
      if (typeof dateStr === "string") {
        // Handle formats like "DD/MM/YYYY", "MM/DD/YYYY", etc.
        birthDate = new Date(dateStr);
      } else if (typeof dateStr === "number") {
        // Excel serial date number
        birthDate = XLSX.SSF.parse_date_code(dateStr);
      } else {
        birthDate = new Date(dateStr);
      }

      if (!isNaN(birthDate.getTime())) {
        birthdays.push({ name, date: birthDate });
      }
    }
  });

  return birthdays;
}

// Import all birthdays to Google Calendar
export async function importBirthdaysToCalendar(filePath: string) {
  const birthdays = readBirthdaysFromExcel(filePath);
  const results = [];

  for (const birthday of birthdays) {
    try {
      const event = await createBirthdayEvent(birthday.name, birthday.date);
      results.push({
        success: true,
        name: birthday.name,
        event,
      });
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

// Alternative: Read from CSV
export function readBirthdaysFromCSV(csvContent: string): BirthdayRow[] {
  const lines = csvContent.trim().split("\n");
  const birthdays: BirthdayRow[] = [];

  console.log("CSV Content:", csvContent);
  console.log("Total lines:", lines.length);

  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    console.log(`Processing line ${i}:`, line);

    // Split by comma
    const parts = line.split(",").map((s) => s.trim());
    console.log("Parts:", parts);

    if (parts.length < 2) {
      console.log("Skipping line - not enough parts");
      continue;
    }

    const name = parts[0];
    const dateStr = parts[1];

    if (!name || !dateStr) {
      console.log("Skipping line - missing name or date");
      continue;
    }

    console.log(`Parsing: name="${name}", date="${dateStr}"`);

    // Parse date (expecting YYYY-MM-DD format)
    const birthDate = new Date(dateStr);

    if (isNaN(birthDate.getTime())) {
      console.log(`Invalid date: ${dateStr}`);
      continue;
    }

    console.log(`Valid birthday found: ${name} - ${birthDate.toISOString()}`);
    birthdays.push({ name, date: birthDate });
  }

  console.log(`Total valid birthdays found: ${birthdays.length}`);
  return birthdays;
}
