import { getAllSourcesData } from "@/lib/google-sheets";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { TrendsLeadsChart } from "@/components/charts/TrendsLeadsChart";
import { TrendsRevenueChart } from "@/components/charts/TrendsRevenueChart";
import { StatCard } from "@/components/ui/StatCard";
import { formatCurrency, formatNumber } from "@/lib/utils";

export const revalidate = 300;

export default async function TrendsPage() {
  const allData = await getAllSourcesData();

  // Collect all unique periods across all sources
  const periodSet = new Set<string>();
  Object.values(allData).forEach((rows) => {
    rows.forEach((r) => {
      if (r.period) periodSet.add(r.period);
    });
  });

  // Sort periods chronologically (assumes "Jan 2025", "Feb 2025" etc. or similar)
  const periods = Array.from(periodSet).sort((a, b) => {
    const monthOrder = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const parseP = (p: string) => {
      const parts = p.split(" ");
      const month = monthOrder.indexOf(parts[0]);
      const year = parseInt(parts[1] ?? "0");
      return year * 12 + month;
    };
    return parseP(a) - parseP(b);
  });

  // Build chart data: one entry per period with each source as a key
  const activeSources = Object.entries(allData)
    .filter(([, rows]) => rows.some((r) => r.leads > 0 || r.grossSales > 0))
    .map(([s]) => s);

  const leadsData = periods.map((period) => {
    const entry: { period: string; [key: string]: string | number } = { period };
    let periodTotal = 0;
    activeSources.forEach((source) => {
      const row = allData[source]?.find((r) => r.period === period);
      const val = row?.leads ?? 0;
      entry[source] = val;
      periodTotal += val;
    });
    entry["Total"] = periodTotal;
    return entry;
  });

  const revenueData = periods.map((period) => {
    const entry: { period: string; [key: string]: string | number } = { period };
    let periodTotal = 0;
    activeSources.forEach((source) => {
      const row = allData[source]?.find((r) => r.period === period);
      const val = row?.grossSales ?? 0;
      entry[source] = val;
      periodTotal += val;
    });
    entry["Total"] = periodTotal;
    return entry;
  });

  // Aggregate totals per period for summary cards
  const totalLeadsAllTime = Object.values(allData)
    .flat()
    .reduce((s, r) => s + r.leads, 0);
  const totalRevenueAllTime = Object.values(allData)
    .flat()
    .reduce((s, r) => s + r.grossSales, 0);

  return (
    <div>
      <SectionHeader
        title="Trends"
        subtitle="Combined monthly performance across all lead sources"
      />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Total Leads (All Time)"
          value={formatNumber(totalLeadsAllTime)}
        />
        <StatCard
          label="Total Revenue (All Time)"
          value={formatCurrency(totalRevenueAllTime)}
          highlight
        />
        <StatCard
          label="Months Tracked"
          value={periods.length.toString()}
          sub="Unique periods with data"
        />
      </div>

      <div className="flex flex-col gap-6">
        {leadsData.length > 0 ? (
          <TrendsLeadsChart data={leadsData} sources={["Total", ...activeSources]} />
        ) : (
          <div className="bg-surface-card border border-surface-border rounded-2xl p-12 text-center">
            <p className="text-text-muted text-sm">No lead data available yet.</p>
          </div>
        )}

        {revenueData.length > 0 ? (
          <TrendsRevenueChart data={revenueData} sources={["Total", ...activeSources]} />
        ) : (
          <div className="bg-surface-card border border-surface-border rounded-2xl p-12 text-center">
            <p className="text-text-muted text-sm">No revenue data available yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
