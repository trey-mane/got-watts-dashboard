import { notFound } from "next/navigation";
import { getSourceData } from "@/lib/google-sheets";
import { ALL_SOURCES, SOURCE_LABELS, Source } from "@/types";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatCard } from "@/components/ui/StatCard";
import { LeadsLineChart } from "@/components/charts/LeadsLineChart";
import { RevenueLineChart } from "@/components/charts/RevenueLineChart";
import { SourceNav } from "@/components/ui/SourceNav";
import {
  formatCurrency,
  formatPercent,
  formatNumber,
  formatROAS,
} from "@/lib/utils";

export const revalidate = 300;

interface PageProps {
  params: { source: string };
}

function computeAvg(arr: number[]): number {
  const nonZero = arr.filter((v) => v > 0);
  if (!nonZero.length) return 0;
  return nonZero.reduce((s, v) => s + v, 0) / nonZero.length;
}

export default async function SourcePage({ params }: PageProps) {
  const source = decodeURIComponent(params.source) as Source;

  if (!ALL_SOURCES.includes(source)) notFound();

  const rows = await getSourceData(source);
  const label = SOURCE_LABELS[source];

  const isEmpty =
    rows.length === 0 ||
    rows.every(
      (r) => r.leads === 0 && r.grossSales === 0 && r.contractValue === 0
    );

  const totalLeads         = rows.reduce((s, r) => s + r.leads, 0);
  const totalClosed        = rows.reduce((s, r) => s + r.closed, 0);
  const totalInstalls      = rows.reduce((s, r) => s + r.installs, 0);
  const totalAdSpend       = rows.reduce((s, r) => s + r.adSpend, 0);
  const totalContractValue = rows.reduce((s, r) => s + r.contractValue, 0);
  const totalRevenue       = rows.reduce((s, r) => s + r.grossSales, 0);
  const overallCloseRate   = totalLeads > 0 ? (totalClosed / totalLeads) * 100 : 0;

  const avgCPL  = computeAvg(rows.map((r) => r.cpl));
  const avgCAC  = computeAvg(rows.map((r) => r.cac));
  const avgROAS = computeAvg(rows.map((r) => r.roas));

  const last3      = rows.slice(-3);
  const cplLast90  = computeAvg(last3.map((r) => r.cpl));
  const cacLast90  = computeAvg(last3.map((r) => r.cac));

  return (
    <div>
      <SourceNav current={source} />
      <SectionHeader title={label} subtitle="Monthly performance breakdown" />

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-12 h-12 rounded-full bg-surface-muted border border-surface-border flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="8" stroke="#666" strokeWidth="1.5" />
              <path
                d="M10 6v4M10 14h.01"
                stroke="#666"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-text-secondary font-medium text-sm">
              Inactive — not yet tracking
            </p>
            <p className="text-text-muted text-xs mt-1">
              No data has been recorded for {label} yet.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* ── Pipeline cards ── */}
          <p className="text-text-muted text-[10px] uppercase tracking-widest font-sans mb-3">
            Pipeline
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
            <StatCard label="Total Leads" value={formatNumber(totalLeads)} />
            <StatCard
              label="Contracts Signed"
              value={formatNumber(totalClosed)}
              sub="Bookings (leading)"
              highlight
            />
            <StatCard
              label="Projects Installed"
              value={totalInstalls > 0 ? formatNumber(totalInstalls) : "—"}
              sub="Recognized (lagging)"
            />
            <StatCard
              label="Close Rate"
              value={overallCloseRate > 0 ? formatPercent(overallCloseRate) : "—"}
              highlight
            />
            <StatCard
              label="Total Ad Spend"
              value={totalAdSpend > 0 ? formatCurrency(totalAdSpend) : "—"}
            />
          </div>

          {/* ── Revenue cards ── */}
          <p className="text-text-muted text-[10px] uppercase tracking-widest font-sans mb-3">
            Revenue
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
            <StatCard
              label="Contract Value"
              value={totalContractValue > 0 ? formatCurrency(totalContractValue) : "—"}
              sub="Signed bookings total"
              highlight
            />
            <StatCard
              label="Install Revenue"
              value={totalRevenue > 0 ? formatCurrency(totalRevenue) : "—"}
              sub="Recognized on completion"
              highlight
            />
          </div>

          {/* ── Efficiency cards ── */}
          <p className="text-text-muted text-[10px] uppercase tracking-widest font-sans mb-3">
            Efficiency
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
            <StatCard
              label="Avg CPL"
              value={avgCPL > 0 ? formatCurrency(avgCPL) : "—"}
              sub="All-time monthly avg"
            />
            <StatCard
              label="CPL Last 90 Days"
              value={cplLast90 > 0 ? formatCurrency(cplLast90) : "—"}
              sub="~last 3 months"
            />
            <StatCard
              label="Avg CAC"
              value={avgCAC > 0 ? formatCurrency(avgCAC) : "—"}
              sub="Cost to acquire a client"
            />
            <StatCard
              label="CAC Last 90 Days"
              value={cacLast90 > 0 ? formatCurrency(cacLast90) : "—"}
              sub="~last 3 months"
            />
            <StatCard
              label="Avg ROAS"
              value={avgROAS > 0 ? formatROAS(avgROAS) : "—"}
              sub="Return on ad spend"
              highlight
            />
          </div>

          {/* ── Charts ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <LeadsLineChart data={rows} />
            <RevenueLineChart data={rows} />
          </div>

          {/* ── Monthly table ── */}
          <div>
            <p className="text-text-primary text-sm font-medium mb-4">
              Monthly Data
            </p>
            <div className="bg-surface-card border border-surface-border rounded-2xl overflow-x-auto">
              <table className="w-full text-sm font-sans">
                <thead>
                  <tr className="border-b border-surface-border">
                    {[
                      "Period",
                      "Leads",
                      "Contracts",
                      "Installs",
                      "Close Rate",
                      "Ad Spend",
                      "CPL",
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
                  {rows.map((row, i) => (
                    <tr
                      key={i}
                      className="border-b border-surface-border/50 last:border-0 hover:bg-surface-muted/40 transition-colors"
                    >
                      <td className="px-4 py-3 text-text-primary font-medium whitespace-nowrap">
                        {row.period}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {formatNumber(row.leads)}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {formatNumber(row.closed)}
                      </td>
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
                        {row.cpl > 0 ? formatCurrency(row.cpl) : "—"}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {row.cac > 0 ? formatCurrency(row.cac) : "—"}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {row.roas > 0 ? formatROAS(row.roas) : "—"}
                      </td>
                      <td className="px-4 py-3 text-brand font-medium">
                        {row.contractValue > 0
                          ? formatCurrency(row.contractValue)
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {row.grossSales > 0
                          ? formatCurrency(row.grossSales)
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-text-muted text-[10px] mt-2 font-sans">
              Contract Value = value of deals signed that month ·
              Install Revenue = value of jobs completed (installed) that month
            </p>
          </div>
        </>
      )}
    </div>
  );
}
