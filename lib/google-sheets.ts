import { google } from "googleapis";
import {
  DashboardRow,
  OverviewStats,
  Source,
  SourceRow,
  SocialPlatform,
  SocialStatRow,
  SocialVideoRow,
} from "@/types";

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
  const cleaned = val.replace(/[$,%x]/g, "").trim();
  // Treat placeholder dashes and formula errors as 0
  if (/^[-–—]+$/.test(cleaned) || cleaned === "#VALUE!" || cleaned === "") return 0;
  return parseFloat(cleaned) || 0;
}

function parsePercent(val: string | undefined): number {
  if (!val) return 0;
  const cleaned = val.replace(/%/g, "").trim();
  if (/^[-–—]+$/.test(cleaned) || cleaned === "") return 0;
  return parseFloat(cleaned) || 0;
}

// ─── Dashboard summary tab ────────────────────────────────────────────────────
//
// Header row (row 5 in sheet, A1:O notation):
//   A         B      C       D        E           F         G    H                  I                    J    K                  L                J     N                      O
//   Source  Leads  Closed  Installs  Close Rate  Ad Spend  CPL  CPL (Month Avg)  CPL (Last 90 Days)  CAC  CAC (Month Avg)  CAC (Last 90)  ROAS  Closed Contract Value  Gross Sales
//   [0]     [1]    [2]     [3]       [4]         [5]       [6]  [7]              [8]                 [9]  [10]             [11]           [12]  [13]                   [14]
//
export async function getDashboardData(): Promise<OverviewStats> {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "📊 Dashboard!A2:O100",
  });

  const rows = res.data.values ?? [];

  const EXCLUDED_SOURCES =
    /^total$|^grand|^sum$|enter data|yellow|calculate|^period$|^month$|^source$|all sources/i;

  const allParsed: DashboardRow[] = rows
    .filter((r) => r[0] && r[0].toString().trim() !== "")
    .map((r) => ({
      source:       r[0]?.toString().trim() ?? "",
      leads:        parseNum(r[1]),
      closed:       parseNum(r[2]),
      installs:     parseNum(r[3]),   // projects installed count — NEW
      closeRate:    parsePercent(r[4]),
      adSpend:      parseNum(r[5]),
      cpl:          parseNum(r[6]),
      cplMonthAvg:  parseNum(r[7]),
      cplLast90:    parseNum(r[8]),
      cac:          parseNum(r[9]),
      cacMonthAvg:  parseNum(r[10]),
      cacLast90:    parseNum(r[11]),
      roas:         parseNum(r[12]),
      contractValue: parseNum(r[13]), // closed contract value $ — NEW
      grossSales:   parseNum(r[14]), // install revenue $
    }));

  const totalRow = allParsed.find((r) => /^totals?$/i.test(r.source));
  const bySource = allParsed.filter((r) => !EXCLUDED_SOURCES.test(r.source));

  const totalLeads         = totalRow?.leads         ?? bySource.reduce((s, r) => s + r.leads, 0);
  const totalClosed        = totalRow?.closed        ?? bySource.reduce((s, r) => s + r.closed, 0);
  const totalInstalls      = totalRow?.installs      ?? bySource.reduce((s, r) => s + r.installs, 0);
  const totalAdSpend       = totalRow?.adSpend       ?? bySource.reduce((s, r) => s + r.adSpend, 0);
  const totalContractValue = totalRow?.contractValue ?? bySource.reduce((s, r) => s + r.contractValue, 0);
  const totalRevenue       = totalRow?.grossSales    ?? bySource.reduce((s, r) => s + r.grossSales, 0);

  const overallCloseRate = totalLeads > 0 ? (totalClosed / totalLeads) * 100 : 0;
  const blendedCAC  = totalClosed > 0  ? totalAdSpend / totalClosed  : 0;
  const blendedROAS = totalAdSpend > 0 ? totalRevenue / totalAdSpend : 0;

  // Paid-only metrics (channels with ad spend)
  const PAID_SOURCES = /google.?ads|yelp|meta.?ads/i;
  const paidRows    = bySource.filter((r) => PAID_SOURCES.test(r.source));
  const paidAdSpend = paidRows.reduce((s, r) => s + r.adSpend, 0);
  const paidClosed  = paidRows.reduce((s, r) => s + r.closed, 0);
  const paidRevenue = paidRows.reduce((s, r) => s + r.grossSales, 0);
  const paidCAC     = paidClosed  > 0 ? paidAdSpend / paidClosed  : 0;
  const paidROAS    = paidAdSpend > 0 ? paidRevenue / paidAdSpend : 0;

  return {
    totalLeads,
    totalClosed,
    totalInstalls,
    overallCloseRate,
    totalAdSpend,
    totalContractValue,
    totalRevenue,
    blendedCAC,
    blendedROAS,
    paidCAC,
    paidROAS,
    bySource,
  };
}

// ─── Source detail tabs ───────────────────────────────────────────────────────
//
// Header row (row 5 in each sheet):
//   A               B      C       D           E                  F           G      H      I     J                      K
//   Period/Month  Leads  Closed  Close Rate  Projects Installed  Ad Spend($)  CPL($)  CAC($)  ROAS  Closed Contract Value  Gross Sales ($)
//   [0]           [1]    [2]     [3]         [4]                [5]          [6]     [7]     [8]   [9]                   [10]
//
export async function getSourceData(source: Source): Promise<SourceRow[]> {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${source}!A2:K200`,
  });

  const MONTH_NAMES =
    /jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/i;
  const JUNK_ROW =
    /enter data|yellow|calculate|period.?month|^period$|^month$|^total$|^grand/i;

  const rows = res.data.values ?? [];
  return rows
    .filter((r) => {
      const cell = r[0]?.toString().trim() ?? "";
      return cell !== "" && !JUNK_ROW.test(cell) && MONTH_NAMES.test(cell);
    })
    .map((r) => ({
      period:        r[0]?.toString().trim() ?? "",
      leads:         parseNum(r[1]),
      closed:        parseNum(r[2]),   // contracts signed count
      closeRate:     parsePercent(r[3]),
      installs:      parseNum(r[4]),   // projects installed count — NEW
      adSpend:       parseNum(r[5]),
      cpl:           parseNum(r[6]),
      cac:           parseNum(r[7]),
      roas:          parseNum(r[8]),
      contractValue: parseNum(r[9]),   // closed contract value $ — NEW
      grossSales:    parseNum(r[10]),  // install revenue $
    }))
    // Exclude future-placeholder rows (no leads AND no contract value AND no installs)
    .filter((r) => r.leads > 0 || r.contractValue > 0 || r.installs > 0 || r.grossSales > 0);
}

// ─── Social Media tabs ────────────────────────────────────────────────────────
//
// Tab: "📱 Social Stats"
//   A          B        C            D      E                 F              G
//   Platform  Period  Period Type  Views  Posts Published  New Followers  Total Followers
//   [0]       [1]     [2]          [3]    [4]              [5]            [6]
//
// Tab: "📱 Social Videos"
//   A          B             C      D    E      F      G         H     I               J
//   Platform  Date Posted  Title  URL  Views  Likes  Comments  Type  Top Performer  Notes
//   [0]       [1]          [2]    [3]  [4]    [5]    [6]       [7]   [8]            [9]
//

const VALID_PLATFORMS = /^(Instagram|Facebook|YouTube)$/i;

function normalizePlatform(val: string): SocialPlatform | null {
  const v = val.trim();
  if (/instagram/i.test(v)) return "Instagram";
  if (/facebook/i.test(v)) return "Facebook";
  if (/youtube/i.test(v)) return "YouTube";
  return null;
}

export async function getSocialStats(): Promise<SocialStatRow[]> {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "📱 Social Stats!A2:G300",
    });
    const rows = res.data.values ?? [];
    return rows
      .filter((r) => {
        const platform = r[0]?.toString().trim() ?? "";
        return VALID_PLATFORMS.test(platform) && r[1];
      })
      .map((r) => {
        const periodType = r[2]?.toString().trim();
        return {
          platform:      normalizePlatform(r[0])!,
          period:        r[1]?.toString().trim() ?? "",
          periodType:    (periodType === "Weekly" ? "Weekly" : "Monthly") as "Monthly" | "Weekly",
          views:         parseNum(r[3]),
          postsPublished:parseNum(r[4]),
          newFollowers:  parseNum(r[5]),
          totalFollowers:parseNum(r[6]),
        };
      });
  } catch {
    return [];
  }
}

export async function getSocialVideos(): Promise<SocialVideoRow[]> {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "📱 Social Videos!A2:J500",
    });
    const rows = res.data.values ?? [];
    return rows
      .filter((r) => {
        const platform = r[0]?.toString().trim() ?? "";
        return VALID_PLATFORMS.test(platform) && r[2]; // must have a title
      })
      .map((r) => ({
        platform:    normalizePlatform(r[0])!,
        datePosted:  r[1]?.toString().trim() ?? "",
        title:       r[2]?.toString().trim() ?? "",
        url:         r[3]?.toString().trim() ?? "",
        views:       parseNum(r[4]),
        likes:       parseNum(r[5]),
        comments:    parseNum(r[6]),
        type:        r[7]?.toString().trim() ?? "",
        topPerformer:/yes|true|1|y/i.test(r[8]?.toString().trim() ?? ""),
        notes:       r[9]?.toString().trim() ?? "",
      }));
  } catch {
    return [];
  }
}

/** Fetch all source tabs for the Trends page */
export async function getAllSourcesData(): Promise<Record<string, SourceRow[]>> {
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
