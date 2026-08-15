"use client";

import { useState, useMemo } from "react";
import { SourceRow, Source } from "@/types";
import { StatCard } from "@/components/ui/StatCard";
import { LeadsLineChart } from "@/components/charts/LeadsLineChart";
import { RevenueLineChart } from "@/components/charts/RevenueLineChart";
import {
  formatCurrency,
  formatPercent,
  formatNumber,
  formatROAS,
} from "@/lib/utils";

// ─── Constants ────────────────────────────────────────────────────────────────

const LTGP = 11626.90;
const LOG_MAX = Math.log(41);
const PAID_SOURCES = new Set<Source>(["Meta_Ads", "Google_Ads", "Yelp"]);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getYear(period: string): number | null {
  const full = period.match(/\b(20\d{2})\b/);
  if (full) return parseInt(full[1]);
  const short = period.match(/'(\d{2})\b/);
  if (short) return 2000 + parseInt(short[1]);
  return null;
}

function gaugePos(ratio: number): string {
  return Math.min(95, (Math.log(ratio + 1) / LOG_MAX) * 100).toFixed(1) + "%";
}

function formatRatio(r: number): string {
  return (r >= 10 ? Math.round(r) : r.toFixed(1)) + ":1";
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  allRows: SourceRow[];
  label: string;
  source: Source;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function SourceDashboard({ allRows, label, source }: Props) {
  const [show2025, setShow2025] = useState(false);
  const isPaid = PAID_SOURCES.has(source);

  const rows = useMemo(
    () =>
      show2025
        ? allRows
        : allRows.filter((r) => {
            const yr = getYear(r.period);
            return yr === null || yr >= 2026;
          }),
    [allRows, show2025]
  );

  const isEmpty =
    allRows.length === 0 ||
    allRows.every(
      (r) => r.leads === 0 && r.grossSales === 0 && r.contractValue === 0
    );

  // ── Aggregates ──
  const totalLeads         = rows.reduce((s, r) => s + r.leads, 0);
  const totalClosed        = rows.reduce((s, r) => s + r.closed, 0);
  const totalAdSpend       = rows.reduce((s, r) => s + r.adSpend, 0);
  const totalContractValue = rows.reduce((s, r) => s + r.contractValue, 0);
  const totalRevenue       = rows.reduce((s, r) => s + r.grossSales, 0);
  const overallCloseRate   = totalLeads > 0 ? (totalClosed / totalLeads) * 100 : 0;

  // Derived totals (not averages of monthly averages)
  const cpl  = totalLeads > 0 && totalAdSpend > 0 ? totalAdSpend / totalLeads : 0;
  const cac  = totalClosed > 0 && totalAdSpend > 0 ? totalAdSpend / totalClosed : 0;
  const roas = totalAdSpend > 0 && totalRevenue > 0 ? totalRevenue / totalAdSpend : 0;
  const ltgpCacRatio = cac > 0 ? LTGP / cac : 0;

  // ── Year context label ──
  const years = Array.from(new Set(allRows.map((r) => getYear(r.period)).filter(Boolean))) as number[];
  const hasBothYears = years.includes(2025) && years.includes(2026);

  return (
    <>
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-12 h-12 rounded-full bg-surface-muted border border-surface-border flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="8" stroke="#999" strokeWidth="1.5" />
              <path d="M10 6v4M10 14h.01" stroke="#999" strokeWidth="1.5" strokeLinecap="round" />
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
          {/* ── Year toggle ── */}
          {hasBothYears && (
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <span className="text-text-primary text-xs font-sans font-medium">2026</span>
                <span className="text-text-muted text-xs font-sans">
                  {show2025 ? "· 2025 included" : "only"}
                </span>
              </div>
              <button
                onClick={() => setShow2025((v) => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans border transition-colors ${
                  show2025
                    ? "bg-brand/10 text-brand border-brand/30"
                    : "text-text-muted border-surface-border hover:text-text-secondary hover:border-surface-border/80"
                }`}
              >
                {show2025 ? (
                  <>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2.5 2.5L8 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    2025 included
                  </>
                ) : (
                  <>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M5 2v6M2 5h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                    </svg>
                    Include 2025
                  </>
                )}
              </button>
            </div>
          )}

          {/* ── Pipeline ── */}
          <p className="text-text-muted text-[10px] uppercase tracking-widest font-sans mb-3">Pipeline</p>
          <div className={`grid gap-4 mb-6 ${isPaid ? "grid-cols-2 md:grid-cols-4" : "grid-cols-2 md:grid-cols-3"}`}>
            <StatCard label="Total Leads" value={formatNumber(totalLeads)} />
            <StatCard
              label="Contracts Signed"
              value={formatNumber(totalClosed)}
              sub="Bookings (leading)"
              highlight
            />
            <StatCard
              label="Close Rate"
              value={overallCloseRate > 0 ? formatPercent(overallCloseRate) : "—"}
              highlight
            />
            {isPaid && (
              <StatCard
                label="Ad Spend"
                value={totalAdSpend > 0 ? formatCurrency(totalAdSpend) : "—"}
              />
            )}
          </div>

          {/* ── Revenue ── */}
          <p className="text-text-muted text-[10px] uppercase tracking-widest font-sans mb-3">Revenue</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <StatCard
              label="Contract Value"
              value={totalContractValue > 0 ? formatCurrency(totalContractValue) : "—"}
              sub="Signed bookings total"
              highlight
            />
          </div>

          {/* ── Efficiency (paid only) ── */}
          {isPaid && (
            <>
              <p className="text-text-muted text-[10px] uppercase tracking-widest font-sans mb-3">Efficiency</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                <StatCard
                  label="CPL"
                  value={cpl > 0 ? formatCurrency(Math.round(cpl)) : "—"}
                  sub="Cost per lead"
                />
                <StatCard
                  label="CAC"
                  value={cac > 0 ? formatCurrency(Math.round(cac)) : "—"}
                  sub="Cost to acquire a client"
                />
                <StatCard
                  label="ROAS"
                  value={roas > 0 ? formatROAS(roas) : "—"}
                  sub="Return on ad spend"
                  highlight
                />
              </div>

              {/* ── LTGP:CAC Gauge ── */}
              <div className="bg-surface-card border border-surface-border rounded-2xl p-5 mb-8">
                <div className="flex items-baseline gap-3 mb-1">
                  <p className="text-text-secondary text-xs font-medium font-sans">LTGP : CAC</p>
                  <p className="text-text-muted text-[11px] font-sans">$11,626.90 lifetime gross profit per customer</p>
                </div>
                <p className="text-3xl font-bold text-brand tabular-nums mb-4 leading-none">
                  {ltgpCacRatio > 0 ? formatRatio(ltgpCacRatio) : "—"}
                </p>
                {ltgpCacRatio > 0 && (
                  <>
                    <div className="relative h-[5px] flex rounded-full overflow-visible mb-5">
                      <div className="h-[5px] rounded-l-full bg-red-500"   style={{ width: "18.6%" }} />
                      <div className="h-[5px] bg-yellow-500"               style={{ width: "18.7%" }} />
                      <div className="h-[5px] rounded-r-full flex-1 bg-green-500" />
                      <div
                        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full border-2 border-surface-card transition-all duration-500"
                        style={{ left: gaugePos(ltgpCacRatio), background: "#EA6B2A" }}
                      />
                    </div>
                    <div className="flex gap-4 flex-wrap">
                      {[
                        { color: "#ef4444", label: "< 1:1 — losing money" },
                        { color: "#eab308", label: "1–3:1 — won't scale" },
                        { color: "#22c55e", label: "3:1+ — takes off" },
                      ].map((l) => (
                        <div key={l.label} className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: l.color }} />
                          <span className="text-text-muted text-[11px] font-sans">{l.label}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </>
          )}

          {/* ── Charts ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <LeadsLineChart data={rows} />
            <RevenueLineChart data={rows} />
          </div>

          {/* ── Monthly table ── */}
          <div>
            <p className="text-text-primary text-sm font-medium mb-4">Monthly Data</p>
            <div className="bg-surface-card border border-surface-border rounded-2xl overflow-x-auto">
              <table className="w-full text-sm font-sans">
                <thead>
                  <tr className="border-b border-surface-border">
                    {[
                      "Period",
                      "Leads",
                      "Contracts",
                      "Close Rate",
                      ...(isPaid ? ["Ad Spend", "CPL", "CAC", "ROAS"] : []),
                      "Contract Value",
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
                  {rows.map((row, i) => {
                    const yr = getYear(row.period);
                    const is2025 = yr === 2025;
                    return (
                      <tr
                        key={i}
                        className={`border-b border-surface-border/50 last:border-0 transition-colors ${
                          is2025
                            ? "opacity-60 hover:opacity-80"
                            : "hover:bg-surface-muted/40"
                        }`}
                      >
                        <td className="px-4 py-3 text-text-primary font-medium whitespace-nowrap">
                          {row.period}
                          {is2025 && (
                            <span className="ml-1.5 text-[9px] text-text-muted uppercase tracking-widest">
                              &apos;25
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-text-secondary">{formatNumber(row.leads)}</td>
                        <td className="px-4 py-3 text-text-secondary">{formatNumber(row.closed)}</td>
                        <td className="px-4 py-3 text-text-secondary">
                          {row.closeRate > 0 ? formatPercent(row.closeRate) : "—"}
                        </td>
                        {isPaid && (
                          <>
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
                          </>
                        )}
                        <td className="px-4 py-3 text-brand font-medium">
                          {row.contractValue > 0 ? formatCurrency(row.contractValue) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-text-muted text-[10px] mt-2 font-sans">
              Contract Value = value of deals signed that month
            </p>
          </div>
        </>
      )}
    </>
  );
}
