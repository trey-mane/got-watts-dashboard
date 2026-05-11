import { getAllSourcesData } from "@/lib/google-sheets";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { TrendsLeadsChart } from "@/components/charts/TrendsLeadsChart";
import { TrendsRevenueChart } from "@/components/charts/TrendsRevenueChart";
import { StatCard } from "@/components/ui/StatCard";
import { formatCurrency, formatNumber } from "@/lib/utils";

export const revalidate = 300;

export default async function TrendsPage() {
  const allData = await getAllSourcesData();

  // Collect all unique periods
  const periodSet = new Set<string>();
  Object.values(allData).forEach((rows) => {
    rows.forEach((r) => {
      if (r.period) periodSet.add(r.period);
    });
  });

  const monthOrder = [
    "Jan","Feb","Mar","Apr","May","Jun",
    "Jul","Aug","Sep","Oct","Nov","Dec",
  ];
  const parseP = (p: string) => {
    const parts = p.split(" ");
    const month = monthOrder.indexOf(parts[0]);
    const year  = parseInt(parts[1] ?? "0");
    return year * 12 + month;
  };

  const periods = Array.from(periodSet).sort((a, b) => parseP(a) - parseP(b));

  const activeSources = Object.entries(allData)
    .filter(([, rows]) =>
      rows.some((r) => r.leads > 0 || r.contractValue > 0 || r.grossSales > 0)
    )
    .map(([s]) => s);

  // Leads chart data — by source
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

  // Revenue chart data — show contract value vs install revenue as totals (not per-source)
  // This makes the leading vs lagging split crystal clear
  const revenueData = periods.map((period) => {
    let contractValueTotal = 0;
    let installRevenueTotal = 0;
    activeSources.forEach((source) => {
      const row = allData[source]?.find((r) => r.period === period);
      contractValueTotal  += row?.contractValue ?? 0;
      installRevenueTotal += row?.grossSales    ?? 0;
    });
    return {
      period,
      "Contract Value":  contractValueTotal,
      "Install Revenue": installRevenueTotal,
    };
  });

  // All-time aggregate totals
  const allRows = Object.values(allData).flat();
  const totalLeadsAllTime         = allRows.reduce((s, r) => s + r.leads, 0);
  const totalContractValueAllTime = allRows.reduce((s, r) => s + r.contractValue, 0);
  const totalInstallRevenueAllTime= allRows.reduce((s, r) => s + r.grossSales, 0);

  return (
    <div>
      <SectionHeader
        title="Trends"
        subtitle="Combined monthly performance across all lead sources"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Leads (All Time)"
          value={formatNumber(totalLeadsAllTime)}
        />
        <StatCard
          label="Contract Value (All Time)"
          value={formatCurrency(totalContractValueAllTime)}
          sub="Signed bookings"
          highlight
        />
        <StatCard
          label="Install Revenue (All Time)"
          value={formatCurrency(totalInstallRevenueAllTime)}
          sub="Recognized on completion"
          highlight
        />
        <StatCard
          label="Months Tracked"
          value={periods.length.toString()}
          sub="Unique periods with data"
        />
      </div>

      <div className="flex flex-col gap-6">
        {/* ── Leads by source ── */}
        {leadsData.length > 0 ? (
          <TrendsLeadsChart
            data={leadsData}
            sources={["Total", ...activeSources]}
          />
        ) : (
          <div className="bg-surface-card border border-surface-border rounded-2xl p-12 text-center">
            <p className="text-text-muted text-sm">No lead data available yet.</p>
          </div>
        )}

        {/* ── Contract Value vs Install Revenue ── */}
        {revenueData.length > 0 ? (
          <TrendsRevenueChart data={revenueData} />
        ) : (
          <div className="bg-surface-card border border-surface-border rounded-2xl p-12 text-center">
            <p className="text-text-muted text-sm">No revenue data available yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
