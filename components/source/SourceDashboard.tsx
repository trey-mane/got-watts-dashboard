"use client";

import { useState, useMemo } from "react";
import { SourceRow } from "@/types";
import { StatCard } from "@/components/ui/StatCard";
import { LeadsLineChart } from "@/components/charts/LeadsLineChart";
import { RevenueLineChart } from "@/components/charts/RevenueLineChart";
import {
  formatCurrency,
  formatPercent,
  formatNumber,
  formatROAS,
} from "@/lib/utils";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getYear(period: string): number | null {
  const full = period.match(/\b(20\d{2})\b/);
  if (full) return parseInt(full[1]);
  const short = period.match(/'(\d{2})\b/);
  if (short) return 2000 + parseInt(short[1]);
  return null;
}

function computeAvg(arr: number[]): number {
  const nonZero = arr.filter((v) => v > 0);
  if (!nonZero.length) return 0;
  return nonZero.reduce((s, v) => s + v, 0) / nonZero.length;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  allRows: SourceRow[];
  label: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function SourceDashboard({ allRows, label }: Props) {
  const [show2025, setShow2025] = useState(false);

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
  const totalInstalls      = rows.reduce((s, r) => s + r.installs, 0);
  const totalAdSpend       = rows.reduce((s, r) => s + r.adSpend, 0);
  const totalContractValue = rows.reduce((s, r) => s + r.contractValue, 0);
  const totalRevenue       = rows.reduce((s, r) => s + r.grossSales, 0);
  const overallCloseRate   = totalLeads > 0 ? (totalClosed / totalLeads) * 100 : 0;

  // CPL — avg of sheet values, fall back to derived if blank
  const avgCPL = computeAvg(rows.map((r) => r.cpl)) ||
    (totalLeads > 0 && totalAdSpend > 0 ? totalAdSpend / totalLeads : 0);

  // CAC — compute from raw totals (more accurate than avg of monthly averages;
  // also avoids showing "—" when sheet formula cells have #DIV/0! errors)
  const avgCAC = totalClosed > 0 && totalAdSpend > 0
    ? totalAdSpend / totalClosed
    : computeAvg(rows.map((r) => r.cac));

  // ROAS — same approach
  const avgROAS = totalAdSpend > 0 && totalRevenue > 0
    ? totalRevenue / totalAdSpend
    : computeAvg(rows.map((r) => r.roas));

  // Last-90-day window = last 3 monthly rows
  const last3 = rows.slice(-3);
  const l3AdSpend = last3.reduce((s, r) => s + r.adSpend, 0);
  const l3Closed  = last3.reduce((s, r) => s + r.closed, 0);
  const l3Leads   = last3.reduce((s, r) => s + r.leads, 0);

  const cplLast90 = l3Leads   > 0 && l3AdSpend > 0 ? l3AdSpend / l3Leads  : computeAvg(last3.map((r) => r.cpl));
  const cacLast90 = l3Closed  > 0 && l3AdSpend > 0 ? l3AdSpend / l3Closed : computeAvg(last3.map((r) => r.cac));

  // ── Year context label ──
  const years = [...new Set(allRows.map((r) => getYear(r.period)).filter(Boolean))] as number[];
  const hasBothYears = years.includes(2025) && years.includes(2026);

  return (
    <>
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-12 h-12 rounded-full bg-surface-muted border border-surface-border flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="8" stroke="#666" strokeWidth="1.5" />
              <path d="M10 6v4M10 14h.01" stroke="#666" strokeWidth="1.5" strokeLinecap="round" />
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
                <span className="text-text-primary text-xs font-sans font-medium">
                  2026
                </span>
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

          {/* ── Revenue ── */}
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

          {/* ── Efficiency ── */}
          <p className="text-text-muted text-[10px] uppercase tracking-widest font-sans mb-3">
            Efficiency
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
            <StatCard
              label="Avg CPL"
              value={avgCPL > 0 ? formatCurrency(avgCPL) : "—"}
              sub="Cost per lead"
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
            <p className="text-text-primary text-sm font-medium mb-4">Monthly Data</p>
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
                              '25
                            </span>
                          )}
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
                          {row.cpl > 0 ? formatCurrency(row.cpl) : "—"}
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
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-text-muted text-[10px] mt-2 font-sans">
              Contract Value = value of deals signed that month · Install Revenue = value of jobs completed that month
            </p>
          </div>
        </>
      )}
    </>
  );
}
