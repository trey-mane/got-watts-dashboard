import { getDashboardData } from "@/lib/google-sheets";
import { StatCard } from "@/components/ui/StatCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { LeadsBySourceChart } from "@/components/charts/LeadsBySourceChart";
import { RevenueBySourceChart } from "@/components/charts/RevenueBySourceChart";
import {
  formatCurrency,
  formatPercent,
  formatNumber,
  formatROAS,
} from "@/lib/utils";

export const revalidate = 300; // revalidate every 5 minutes

export default async function OverviewPage() {
  const stats = await getDashboardData();

  return (
    <div>
      <SectionHeader
        title="Overview"
        subtitle="All-time performance across every lead source"
      />

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Leads"
          value={formatNumber(stats.totalLeads)}
        />
        <StatCard
          label="Total Closed"
          value={formatNumber(stats.totalClosed)}
        />
        <StatCard
          label="Close Rate"
          value={formatPercent(stats.overallCloseRate)}
          highlight
        />
        <StatCard
          label="Total Ad Spend"
          value={formatCurrency(stats.totalAdSpend)}
        />
        <StatCard
          label="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          highlight
        />
        <StatCard
          label="Blended CAC"
          value={stats.blendedCAC > 0 ? formatCurrency(stats.blendedCAC) : "—"}
          sub="All channels · incl. referrals"
        />
        <StatCard
          label="Blended ROAS"
          value={stats.blendedROAS > 0 ? formatROAS(stats.blendedROAS) : "—"}
          sub="All channels · incl. referrals"
        />
        <StatCard
          label="Paid CAC"
          value={stats.paidCAC > 0 ? formatCurrency(stats.paidCAC) : "—"}
          sub="Google Ads · Yelp · Meta only"
          highlight
        />
        <StatCard
          label="Paid ROAS"
          value={stats.paidROAS > 0 ? formatROAS(stats.paidROAS) : "—"}
          sub="Google Ads · Yelp · Meta only"
          highlight
        />
      </div>

      {/* Source breakdown table */}
      <div className="mb-8">
        <p className="text-text-primary text-sm font-medium mb-4">Source Breakdown</p>
        <div className="bg-surface-card border border-surface-border rounded-2xl overflow-x-auto">
          <table className="w-full text-sm font-sans">
            <thead>
              <tr className="border-b border-surface-border">
                {[
                  "Source",
                  "Leads",
                  "Closed",
                  "Close Rate",
                  "Ad Spend",
                  "CPL",
                  "CAC",
                  "ROAS",
                  "Gross Sales",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left text-text-muted text-xs uppercase tracking-widest px-4 py-3 font-normal whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.bySource.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-surface-border/50 last:border-0 hover:bg-surface-muted/40 transition-colors"
                >
                  <td className="px-4 py-3 text-text-primary font-medium whitespace-nowrap">
                    {row.source.replace(/_/g, " ")}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{formatNumber(row.leads)}</td>
                  <td className="px-4 py-3 text-text-secondary">{formatNumber(row.closed)}</td>
                  <td className="px-4 py-3 text-text-secondary">{row.closeRate > 0 ? formatPercent(row.closeRate) : "—"}</td>
                  <td className="px-4 py-3 text-text-secondary">{row.adSpend > 0 ? formatCurrency(row.adSpend) : "—"}</td>
                  <td className="px-4 py-3 text-text-secondary">{row.cpl > 0 ? formatCurrency(row.cpl) : "—"}</td>
                  <td className="px-4 py-3 text-text-secondary">{row.cac > 0 ? formatCurrency(row.cac) : "—"}</td>
                  <td className="px-4 py-3 text-text-secondary">{row.roas > 0 ? formatROAS(row.roas) : "—"}</td>
                  <td className="px-4 py-3 text-brand font-medium">{row.grossSales > 0 ? formatCurrency(row.grossSales) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LeadsBySourceChart data={stats.bySource} />
        <RevenueBySourceChart data={stats.bySource} />
      </div>
    </div>
  );
}
