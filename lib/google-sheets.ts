import { google } from "googleapis";
import { DashboardRow, OverviewStats, Source, SourceRow } from "@/types";

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID!;

function getAuth() {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const jwt = new google.auth.JWT(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    undefined,
    privateKey,
    ["https://www.googleapis.com/auth/spreadsheets.readonly"]
  );
  return jwt;
}

function parseNum(val: string | undefined): number {
  if (!val) return 0;
  const cleaned = val.replace(/[$,%]/g, "").trim();
  return parseFloat(cleaned) || 0;
}

function parsePercent(val: string | undefined): number {
  if (!val) return 0;
  const cleaned = val.replace(/%/g, "").trim();
  return parseFloat(cleaned) || 0;
}

/** Fetch and parse the Dashboard summary tab */
export async function getDashboardData(): Promise<OverviewStats> {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "📊 Dashboard!A2:M100",
  });

  const rows = res.data.values ?? [];

  // Words that indicate a summary/total row or a junk instructional row — exclude these
  const EXCLUDED_SOURCES = /^total$|^grand|^sum$|enter data|yellow|calculate|^period$|^month$|^source$|all sources/i;

  const allParsed: DashboardRow[] = rows
    .filter((r) => r[0] && r[0].toString().trim() !== "")
    .map((r) => ({
      source: r[0]?.toString().trim() ?? "",
      leads: parseNum(r[1]),
      closed: parseNum(r[2]),
      closeRate: parsePercent(r[3]),
      adSpend: parseNum(r[4]),
      cpl: parseNum(r[5]),
      cplMonthAvg: parseNum(r[6]),
      cplLast90: parseNum(r[7]),
      cac: parseNum(r[8]),
      cacMonthAvg: parseNum(r[9]),
      cacLast90: parseNum(r[10]),
      roas: parseNum(r[11]),
      grossSales: parseNum(r[12]),
    }));

  // Separate the totals row (if present) from individual source rows
  const totalRow = allParsed.find((r) => /total/i.test(r.source));
  const bySource = allParsed.filter((r) => !EXCLUDED_SOURCES.test(r.source));

  // Prefer the spreadsheet's own Total row; fall back to summing source rows
  const totalLeads = totalRow?.leads ?? bySource.reduce((s, r) => s + r.leads, 0);
  const totalClosed = totalRow?.closed ?? bySource.reduce((s, r) => s + r.closed, 0);
  const totalAdSpend = totalRow?.adSpend ?? bySource.reduce((s, r) => s + r.adSpend, 0);
  const totalRevenue = totalRow?.grossSales ?? bySource.reduce((s, r) => s + r.grossSales, 0);
  const overallCloseRate =
    totalLeads > 0 ? (totalClosed / totalLeads) * 100 : 0;
  const blendedCAC = totalClosed > 0 ? totalAdSpend / totalClosed : 0;
  const blendedROAS = totalAdSpend > 0 ? totalRevenue / totalAdSpend : 0;

  // Paid-only metrics: channels that actually have ad spend
  const PAID_SOURCES = /google_ads|yelp|meta_ads/i;
  const paidRows = bySource.filter((r) => PAID_SOURCES.test(r.source));
  const paidAdSpend = paidRows.reduce((s, r) => s + r.adSpend, 0);
  const paidClosed = paidRows.reduce((s, r) => s + r.closed, 0);
  const paidRevenue = paidRows.reduce((s, r) => s + r.grossSales, 0);
  const paidCAC = paidClosed > 0 ? paidAdSpend / paidClosed : 0;
  const paidROAS = paidAdSpend > 0 ? paidRevenue / paidAdSpend : 0;

  return {
    totalLeads,
    totalClosed,
    overallCloseRate,
    totalAdSpend,
    totalRevenue,
    blendedCAC,
    blendedROAS,
    paidCAC,
    paidROAS,
    bySource,
  };
}

/** Fetch and parse a source detail tab */
export async function getSourceData(source: Source): Promise<SourceRow[]> {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${source}!A2:I200`,
  });

  // Only keep rows where the period looks like a real month entry (e.g. "Jan 2025", "February 2025")
  const MONTH_NAMES = /jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/i;
  const JUNK_ROW = /enter data|yellow|calculate|period.?month|^period$|^month$|^total$|^grand/i;

  const rows = res.data.values ?? [];
  return rows
    .filter((r) => {
      const cell = r[0]?.toString().trim() ?? "";
      return cell !== "" && !JUNK_ROW.test(cell) && MONTH_NAMES.test(cell);
    })
    .map((r) => ({
      period: r[0]?.toString().trim() ?? "",
      leads: parseNum(r[1]),
      closed: parseNum(r[2]),
      closeRate: parsePercent(r[3]),
      adSpend: parseNum(r[4]),
      cpl: parseNum(r[5]),
      cac: parseNum(r[6]),
      roas: parseNum(r[7]),
      grossSales: parseNum(r[8]),
    }));
}

/** Fetch all source tabs for the Trends page */
export async function getAllSourcesData(): Promise<
  Record<string, SourceRow[]>
> {
  const sources: Source[] = [
    "Website",
    "Google_Ads",
    "Yelp",
    "Referrals",
    "Meta_Ads",
    "ManyChat_(IG)",
    "Other",
    "NA",
  ];

  const results = await Promise.allSettled(
    sources.map((s) => getSourceData(s))
  );

  const out: Record<string, SourceRow[]> = {};
  sources.forEach((s, i) => {
    const r = results[i];
    out[s] = r.status === "fulfilled" ? r.value : [];
  });
  return out;
}
