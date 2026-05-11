export type Source =
  | "Website"
  | "Google_Ads"
  | "Yelp"
  | "Referrals"
  | "Meta_Ads"
  | "ManyChat_(IG)"
  | "Other"
  | "NA";

export const ALL_SOURCES: Source[] = [
  "Website",
  "Google_Ads",
  "Yelp",
  "Referrals",
  "Meta_Ads",
  "ManyChat_(IG)",
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
