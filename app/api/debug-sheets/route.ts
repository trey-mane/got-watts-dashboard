import { google } from "googleapis";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

    const auth = new google.auth.JWT(
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      undefined,
      privateKey,
      ["https://www.googleapis.com/auth/spreadsheets.readonly"]
    );

    const sheets = google.sheets({ version: "v4", auth });

    const res = await sheets.spreadsheets.get({
      spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
    });

    const sheetNames = res.data.sheets?.map((s) => s.properties?.title);

    return NextResponse.json({
      ok: true,
      title: res.data.properties?.title,
      sheets: sheetNames,
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    });
  } catch (err: unknown) {
    const error = err as { message?: string; code?: number; status?: string };
    return NextResponse.json(
      {
        ok: false,
        message: error.message,
        code: error.code,
        status: error.status,
        email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        keyLoaded: !!process.env.GOOGLE_PRIVATE_KEY,
      },
      { status: 500 }
    );
  }
}
