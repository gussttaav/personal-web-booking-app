import { google } from "googleapis";

const SHEET_ID = process.env.GOOGLE_SHEET_ID!;

// Columns in Google Sheet:
// A: email | B: name | C: credits | D: pack_purchased | E: last_updated

async function getSheets() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });
  return sheets;
}

export async function getCredits(email: string): Promise<{ credits: number; name: string } | null> {
  const sheets = await getSheets();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "Alumnos!A2:E",
  });

  const rows = res.data.values || [];
  const row = rows.find((r) => r[0]?.toLowerCase() === email.toLowerCase());

  if (!row) return null;

  return {
    credits: parseInt(row[2] || "0", 10),
    name: row[1] || "",
  };
}

export async function addOrUpdateStudent(
  email: string,
  name: string,
  creditsToAdd: number,
  packLabel: string
): Promise<void> {
  const sheets = await getSheets();

  // Find existing row
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "Alumnos!A2:E",
  });

  const rows = res.data.values || [];
  const rowIndex = rows.findIndex((r) => r[0]?.toLowerCase() === email.toLowerCase());

  const now = new Date().toISOString();

  if (rowIndex >= 0) {
    // Update existing: increment credits
    const currentCredits = parseInt(rows[rowIndex][2] || "0", 10);
    const newCredits = currentCredits + creditsToAdd;
    const sheetRow = rowIndex + 2; // +2 because data starts at row 2

    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `Alumnos!A${sheetRow}:E${sheetRow}`,
      valueInputOption: "RAW",
      requestBody: {
        values: [[email, name, newCredits, packLabel, now]],
      },
    });
  } else {
    // Append new student
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: "Alumnos!A2",
      valueInputOption: "RAW",
      requestBody: {
        values: [[email, name, creditsToAdd, packLabel, now]],
      },
    });
  }
}

export async function decrementCredit(email: string): Promise<{ ok: boolean; remaining: number }> {
  const sheets = await getSheets();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "Alumnos!A2:E",
  });

  const rows = res.data.values || [];
  const rowIndex = rows.findIndex((r) => r[0]?.toLowerCase() === email.toLowerCase());

  if (rowIndex < 0) return { ok: false, remaining: 0 };

  const currentCredits = parseInt(rows[rowIndex][2] || "0", 10);
  if (currentCredits <= 0) return { ok: false, remaining: 0 };

  const newCredits = currentCredits - 1;
  const sheetRow = rowIndex + 2;
  const now = new Date().toISOString();

  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `Alumnos!A${sheetRow}:E${sheetRow}`,
    valueInputOption: "RAW",
    requestBody: {
      values: [[rows[rowIndex][0], rows[rowIndex][1], newCredits, rows[rowIndex][3], now]],
    },
  });

  return { ok: true, remaining: newCredits };
}
