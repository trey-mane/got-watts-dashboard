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

    const meta = await sheets.spreadsheets.get({
      spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
    });

    const sheetNames = meta.data.sheets?.map((s) => s.properties?.title);

    // Fetch first 5 rows of Dashboard tab (row 1 = headers, rows 2-5 = data)
    const dashRes = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
      range: "📊 Dashboard!A1:Z10",
    });

    // Fetch first 5 rows of one source tab
    const srcRes = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
      range: "Google_Ads!A1:Z10",
    });

    return NextResponse.json({
      ok: true,
      title: meta.data.properties?.title,
      sheets: sheetNames,
      dashboardRows: dashRes.data.values,
      googleAdsRows: srcRes.data.values,
    });
  } catch (err: unknown) {
    const error = err as { message?: string; code?: number; status?: string };
    return NextResponse.json(
      {
        ok: false,
        message: error.message,
        code: error.code,
        status: error.status,
      },
      { status: 500 }
    );
  }
}
