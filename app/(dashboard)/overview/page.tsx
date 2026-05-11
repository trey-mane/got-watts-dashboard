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

export const revalidate = 300;

export default async function OverviewPage() {
  const stats = await getDashboardData();

  return (
    <div>
      <SectionHeader
        title="Overview"
        subtitle="Performance across every lead source since Jan '25"
      />

      {/* ── Pipeline (bookings) ── */}
      <p className="text-text-muted text-[10px] uppercase tracking-widest font-sans mb-3">
        Pipeline — Contracts &amp; Bookings
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Leads" value={formatNumber(stats.totalLeads)} />
        <StatCard
          label="Contracts Signed"
          value={formatNumber(stats.totalClosed)}
          sub="Bookings (leading indicator)"
          highlight
        />
        <StatCard
          label="Projects Installed"
          value={formatNumber(stats.totalInstalls)}
          sub="Revenue recognized (lagging)"
        />
        <StatCard
          label="Close Rate"
          value={formatPercent(stats.overallCloseRate)}
          highlight
        />
      </div>

      {/* ── Revenue ── */}
      <p className="text-text-muted text-[10px] uppercase tracking-widest font-sans mb-3">
        Revenue
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Contract Value"
          value={formatCurrency(stats.totalContractValue)}
          sub="Signed bookings total"
          highlight
        />
        <StatCard
          label="Install Revenue"
          value={formatCurrency(stats.totalRevenue)}
          sub="Recognized on installation"
          highlight
        />
        <StatCard label="Total Ad Spend" value={formatCurrency(stats.totalAdSpend)} />
        <StatCard
          label="Blended ROAS"
          value={stats.blendedROAS > 0 ? formatROAS(stats.blendedROAS) : "—"}
          sub="All channels · incl. referrals"
        />
      </div>

      {/* ── Paid channel efficiency ── */}
      <p className="text-text-muted text-[10px] uppercase tracking-widest font-sans mb-3">
        Paid Channels — Google Ads · Yelp · Meta
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Blended CAC"
          value={stats.blendedCAC > 0 ? formatCurrency(stats.blendedCAC) : "—"}
          sub="All channels"
        />
        <StatCard
          label="Paid CAC"
          value={stats.paidCAC > 0 ? formatCurrency(stats.paidCAC) : "—"}
          sub="Paid only"
          highlight
        />
        <StatCard
          label="Paid ROAS"
          value={stats.paidROAS > 0 ? formatROAS(stats.paidROAS) : "—"}
          sub="Paid only"
          highlight
        />
      </div>

      {/* ── Source breakdown table ── */}
      <div className="mb-8">
        <p className="text-text-primary text-sm font-medium mb-4">Source Breakdown</p>
        <div className="bg-surface-card border border-surface-border rounded-2xl overflow-x-auto">
          <table className="w-full text-sm font-sans">
            <thead>
              <tr className="border-b border-surface-border">
                {[
                  "Source",
                  "Leads",
                  "Contracts",
                  "Installs",
                  "Close Rate",
                  "Ad Spend",
                  "CAC",
                  "ROAS",
                  "Contract Value",
                  "Install Revenue",
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
                  <td className="px-4 py-3 text-text-secondary">
                    {row.installs > 0 ? formatNumber(row.installs) : "—"}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {row.closeRate > 0 ? formatPercent(row.closeRate) : "—"}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {row.adSpend > 0 ? formatCurrency(row.adSpend) : "—"}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {row.cac > 0 ? formatCurrency(row.cac) : "—"}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {row.roas > 0 ? formatROAS(row.roas) : "—"}
                  </td>
                  <td className="px-4 py-3 text-brand font-medium">
                    {row.contractValue > 0 ? formatCurrency(row.contractValue) : "—"}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {row.grossSales > 0 ? formatCurrency(row.grossSales) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-text-muted text-[10px] mt-2 font-sans">
          Contract Value = bookings (signed deals) · Install Revenue = cash recognized when job is completed
        </p>
      </div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LeadsBySourceChart data={stats.bySource} />
        <RevenueBySourceChart data={stats.bySource} />
      </div>
    </div>
  );
}
