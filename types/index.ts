export type Source =
  | "Website"
  | "Google_Ads"
  | "Yelp"
  | "Referrals"
  | "Meta_Ads"
  | "ManyChat_(IG)"
  | "Self_Gen"
  | "Other"
  | "NA";

export const ALL_SOURCES: Source[] = [
  "Website",
  "Google_Ads",
  "Yelp",
  "Referrals",
  "Meta_Ads",
  "ManyChat_(IG)",
  "Self_Gen",
  "Other",
  "NA",
];

export const SOURCE_LABELS: Record<Source, string> = {
  Website: "Website",
  Google_Ads: "Google Ads",
  Yelp: "Yelp",
  Referrals: "Referrals",
  Meta_Ads: "Meta Ads",
  "ManyChat_(IG)": "ManyChat (IG)",
  Self_Gen: "Self-Gen",
  Other: "Other",
  NA: "N/A",
};

/** One row from a source detail tab (e.g. Website, Google_Ads) */
export interface SourceRow {
  period: string;
  leads: number;
  closed: number;       // contracts signed (count)
  closeRate: number;
  installs: number;     // projects installed (count) — NEW
  adSpend: number;
  cpl: number;
  cac: number;
  roas: number;
  contractValue: number; // closed contract value $ — NEW (bookings)
  grossSales: number;    // install revenue $ (previously just "Gross Sales")
}

/** One row from the Dashboard summary tab */
export interface DashboardRow {
  source: string;
  leads: number;
  closed: number;       // contracts signed (count)
  installs: number;     // projects installed (count) — NEW
  closeRate: number;
  adSpend: number;
  cpl: number;
  cplMonthAvg: number;
  cplLast90: number;
  cac: number;
  cacMonthAvg: number;
  cacLast90: number;
  roas: number;
  contractValue: number; // closed contract value $ — NEW (bookings)
  grossSales: number;    // install revenue $
}

// ─── Social Media ─────────────────────────────────────────────────────────────

export type SocialPlatform = "Instagram" | "Facebook" | "YouTube";

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  "Instagram",
  "Facebook",
  "YouTube",
];

/** One row from the 📱 Social Stats tab */
export interface SocialStatRow {
  platform: SocialPlatform;
  period: string;          // e.g. "Jun 2025" or "Week of Jun 2 2025"
  periodType: "Monthly" | "Weekly";
  views: number;
  postsPublished: number;
  newFollowers: number;
  totalFollowers: number;
}

/** One row from the 📱 Social Videos tab */
export interface SocialVideoRow {
  platform: SocialPlatform;
  datePosted: string;      // e.g. "Jun 2 2025"
  title: string;
  url: string;
  views: number;
  likes: number;
  comments: number;
  type: string;            // Reel / Post / Short / Video / Story
  topPerformer: boolean;   // "Yes" / "No" in sheet
  notes: string;
}

// ─── Overview Stats ───────────────────────────────────────────────────────────

export interface OverviewStats {
  totalLeads: number;
  totalClosed: number;       // contracts signed
  totalInstalls: number;     // projects installed — NEW
  overallCloseRate: number;
  totalAdSpend: number;
  totalContractValue: number; // bookings total — NEW
  totalRevenue: number;       // install revenue total
  blendedCAC: number;
  blendedROAS: number;
  paidCAC: number;
  paidROAS: number;
  bySource: DashboardRow[];
}
