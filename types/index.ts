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
  closed: number;
  closeRate: number;
  adSpend: number;
  cpl: number;
  cac: number;
  roas: number;
  grossSales: number;
}

/** One row from the Dashboard summary tab */
export interface DashboardRow {
  source: string;
  leads: number;
  closed: number;
  closeRate: number;
  adSpend: number;
  cpl: number;
  cplMonthAvg: number;
  cplLast90: number;
  cac: number;
  cacMonthAvg: number;
  cacLast90: number;
  roas: number;
  grossSales: number;
}

export interface OverviewStats {
  totalLeads: number;
  totalClosed: number;
  overallCloseRate: number;
  totalAdSpend: number;
  totalRevenue: number;
  blendedCAC: number;
  blendedROAS: number;
  paidCAC: number;
  paidROAS: number;
  bySource: DashboardRow[];
}
