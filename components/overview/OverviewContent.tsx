"use client";

import { useState, useMemo } from "react";
import { SourceRow, ALL_SOURCES, SOURCE_LABELS, Source } from "@/types";
import { StatCard } from "@/components/ui/StatCard";
import { Collapsible } from "@/components/ui/Collapsible";
import { LeadsBySourceChart } from "@/components/charts/LeadsBySourceChart";
import { RevenueBySourceChart } from "@/components/charts/RevenueBySourceChart";
import {
  formatCurrency,
  formatPercent,
  formatNumber,
  formatROAS,
} from "@/lib/utils";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MONTH_MAP: Record<string, number> = {
  jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11,
};

function getYear(period: string): number | null {
  const full = period.match(/\b(20\d{2})\b/);
  if (full) return parseInt(full[1]);
  const short = period.match(/'(\d{2})\b/);
  if (short) return 2000 + parseInt(short[1]);
  return null;
}

function parsePeriodDate(period: string): Date | null {
  const m = period.match(/([a-z]{3})[a-z]*[\s,'\-]+(\d{2,4})/i);
  if (!m) return null;
  const month = MONTH_MAP[m[1].toLowerCase()];
  if (month === undefined) return null;
  let year = parseInt(m[2]);
  if (year < 100) year += 2000;
  return new Date(year, month, 1);
}

const PAID_KEYS: Source[] = ["Google_Ads", "Yelp", "Meta_Ads"];

function computeMetrics(
  allData: Record<string, SourceRow[]>,
  cutoff: Date
) {
  const allRows = Object.values(allData)
    .flat()
    .filter((r) => { const d = parsePeriodDate(r.period); return d !== null && d >= cutoff; });
  const paidRows = PAID_KEYS.flatMap((k) => allData[k] ?? []).filter(
    (r) => { const d = parsePeriodDate(r.period); return d !== null && d >= cutoff; }
  );
  const totalAdSpend = allRows.reduce((s, r) => s + r.adSpend, 0);
  const totalClosed  = allRows.reduce((s, r) => s + r.closed, 0);
  const paidAdSpend  = paidRows.reduce((s, r) => s + r.adSpend, 0);
  const paidClosed   = paidRows.reduce((s, r) => s + r.closed, 0);
  const paidRevenue  = paidRows.reduce((s, r) => s + r.grossSales, 0);
  return {
    blendedCAC:    totalClosed  > 0 ? totalAdSpend / totalClosed  : 0,
    paidCAC:       paidClosed   > 0 ? paidAdSpend  / paidClosed   : 0,
    paidROAS:      paidAdSpend  > 0 ? paidRevenue  / paidAdSpend  : 0,
    adSpend:       paidAdSpend,
    closed:        totalClosed,
    contractValue: allRows.reduce((s, r) => s + r.contractValue, 0),
  };
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  allData: Record<string, SourceRow[]>;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function OverviewContent({ allData }: Props) {
  const [show2025, setShow2025] = useState(false);

  // Year-filtered source rows
  const filteredData = useMemo<Record<string, SourceRow[]>>(() => {
    if (show2025) return allData;
    const out: Record<string, SourceRow[]> = {};
    for (const [key, rows] of Object.entries(allData)) {
      out[key] = rows.filter((r) => {
        const yr = getYear(r.period);
        return yr === null || yr >= 2026;
      });
    }
    return out;
  }, [allData, show2025]);

  // ── All-up aggregates from filtered data ──
  const allFilteredRows = useMemo(
    () => Object.values(filteredData).flat(),
    [filteredData]
  );

  const totalLeads         = allFilteredRows.reduce((s, r) => s + r.leads, 0);
  const totalClosed        = allFilteredRows.reduce((s, r) => s + r.closed, 0);
  const totalInstalls      = allFilteredRows.reduce((s, r) => s + r.installs, 0);
  const totalAdSpend       = allFilteredRows.reduce((s, r) => s + r.adSpend, 0);
  const totalContractValue = allFilteredRows.reduce((s, r) => s + r.contractValue, 0);
  const totalRevenue       = allFilteredRows.reduce((s, r) => s + r.grossSales, 0);
  const overallCloseRate   = totalLeads > 0 ? (totalClosed / totalLeads) * 100 : 0;

  const blendedROAS = totalAdSpend > 0 ? totalRevenue / totalAdSpend : 0;
  const blendedCAC  = totalClosed  > 0 ? totalAdSpend / totalClosed  : 0;

  const paidRows    = PAID_KEYS.flatMap((k) => filteredData[k] ?? []);
  const paidAdSpend = paidRows.reduce((s, r) => s + r.adSpend, 0);
  const paidClosed  = paidRows.reduce((s, r) => s + r.closed, 0);
  const paidRevenue = paidRows.reduce((s, r) => s + r.grossSales, 0);
  const paidCAC     = paidClosed  > 0 ? paidAdSpend / paidClosed  : 0;
  const paidROAS    = paidAdSpend > 0 ? paidRevenue / paidAdSpend : 0;

  // ── 30 / 90-day windows (always use full allData, not year-filtered) ──
  const now = new Date();
  const cutoff30 = new Date(now.getFullYear(), now.getMonth(), 1);
  const cutoff90 = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  const metrics30 = computeMetrics(allData, cutoff30);
  const metrics90 = computeMetrics(allData, cutoff90);

  // ── Per-source table rows ──
  const sourceTableRows = useMemo(() =>
    ALL_SOURCES.map((src) => {
      const rows = filteredData[src] ?? [];
      const leads         = rows.reduce((s, r) => s + r.leads, 0);
      const closed        = rows.reduce((s, r) => s + r.closed, 0);
      const installs      = rows.reduce((s, r) => s + r.installs, 0);
      const adSpend       = rows.reduce((s, r) => s + r.adSpend, 0);
      const contractValue = rows.reduce((s, r) => s + r.contractValue, 0);
      const grossSales    = rows.reduce((s, r) => s + r.grossSales, 0);
      const closeRate     = leads   > 0 ? (closed / leads) * 100 : 0;
      const cac           = closed  > 0 ? adSpend / closed  : 0;
      const roas          = adSpend > 0 ? grossSales / adSpend : 0;
      return { src, label: SOURCE_LABELS[src], leads, closed, installs, adSpend, contractValue, grossSales, closeRate, cac, roas };
    }).filter((r) => r.leads > 0 || r.contractValue > 0 || r.installs > 0),
    [filteredData]
  );

  // Chart data — reshape for existing chart components
  const bySourceForCharts = sourceTableRows.map((r) => ({
    source: r.label,
    leads: r.leads,
    closed: r.closed,
    installs: r.installs,
    adSpend: r.adSpend,
    contractValue: r.contractValue,
    grossSales: r.grossSales,
    closeRate: r.closeRate,
    cac: r.cac,
    roas: r.roas,
    cpl: 0,
    cplMonthAvg: 0,
    cplLast90: 0,
    cacMonthAvg: 0,
    cacLast90: 0,
  })) as import("@/types").DashboardRow[];

  // ── Check if 2025 data exists at all ──
  const has2025 = Object.values(allData)
    .flat()
    .some((r) => getYear(r.period) === 2025);

  return (
    <>
      {/* ── Year toggle ── */}
      {has2025 && (
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
                : "text-text-muted border-surface-border hover:text-text-secondary"
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
        Pipeline — Contracts &amp; Bookings
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Leads" value={formatNumber(totalLeads)} />
        <StatCard
          label="Contracts Signed"
          value={formatNumber(totalClosed)}
          sub="Bookings (leading indicator)"
          highlight
        />
        <StatCard
          label="Projects Installed"
          value={totalInstalls > 0 ? formatNumber(totalInstalls) : "—"}
          sub="Revenue recognized (lagging)"
        />
        <StatCard
          label="Close Rate"
          value={formatPercent(overallCloseRate)}
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
          value={formatCurrency(totalContractValue)}
          sub="Signed bookings total"
          highlight
        />
        <StatCard
          label="Install Revenue"
          value={formatCurrency(totalRevenue)}
          sub="Recognized on installation"
          highlight
        />
        <StatCard label="Total Ad Spend" value={formatCurrency(totalAdSpend)} />
        <StatCard
          label="Blended ROAS"
          value={blendedROAS > 0 ? formatROAS(blendedROAS) : "—"}
          sub="All channels · incl. referrals"
        />
      </div>

      {/* ── Paid channel efficiency ── */}
      <p className="text-text-muted text-[10px] uppercase tracking-widest font-sans mb-3">
        Paid Channels — Google Ads · Yelp · Meta
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <StatCard
          label="Blended CAC"
          value={blendedCAC > 0 ? formatCurrency(blendedCAC) : "—"}
          sub="All channels · selected period"
        />
        <StatCard
          label="Paid CAC"
          value={paidCAC > 0 ? formatCurrency(paidCAC) : "—"}
          sub="Paid only · selected period"
          highlight
        />
        <StatCard
          label="Paid ROAS"
          value={paidROAS > 0 ? formatROAS(paidROAS) : "—"}
          sub="Paid only · selected period"
          highlight
        />
      </div>

      <Collapsible label="Last 30 Days" accentOpacity="40">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <StatCard label="Blended CAC" value={metrics30.blendedCAC > 0 ? formatCurrency(metrics30.blendedCAC) : "—"} sub="All channels" />
          <StatCard label="Paid CAC"    value={metrics30.paidCAC    > 0 ? formatCurrency(metrics30.paidCAC)    : "—"} sub="Paid only" highlight />
          <StatCard label="Paid ROAS"   value={metrics30.paidROAS   > 0 ? formatROAS(metrics30.paidROAS)       : "—"} sub="Paid only" highlight />
          <StatCard label="Contracts Signed" value={metrics30.closed > 0 ? formatNumber(metrics30.closed) : "—"} sub={`${formatCurrency(metrics30.adSpend)} ad spend`} />
        </div>
      </Collapsible>

      <Collapsible label="Last 90 Days" accentOpacity="20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Blended CAC" value={metrics90.blendedCAC > 0 ? formatCurrency(metrics90.blendedCAC) : "—"} sub="All channels" />
          <StatCard label="Paid CAC"    value={metrics90.paidCAC    > 0 ? formatCurrency(metrics90.paidCAC)    : "—"} sub="Paid only" highlight />
          <StatCard label="Paid ROAS"   value={metrics90.paidROAS   > 0 ? formatROAS(metrics90.paidROAS)       : "—"} sub="Paid only" highlight />
          <StatCard label="Contracts Signed" value={metrics90.closed > 0 ? formatNumber(metrics90.closed) : "—"} sub={`${formatCurrency(metrics90.adSpend)} ad spend`} />
        </div>
      </Collapsible>

      {/* ── Source breakdown table ── */}
      <div className="mb-8">
        <p className="text-text-primary text-sm font-medium mb-4">Source Breakdown</p>
        <div className="bg-surface-card border border-surface-border rounded-2xl overflow-x-auto">
          <table className="w-full text-sm font-sans">
            <thead>
              <tr className="border-b border-surface-border">
                {["Source","Leads","Contracts","Installs","Close Rate","Ad Spend","CAC","ROAS","Contract Value","Install Revenue"].map((h) => (
                  <th key={h} className="text-left text-text-muted text-xs uppercase tracking-widest px-4 py-3 font-normal whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sourceTableRows.map((row, i) => (
                <tr key={i} className="border-b border-surface-border/50 last:border-0 hover:bg-surface-muted/40 transition-colors">
                  <td className="px-4 py-3 text-text-primary font-medium whitespace-nowrap">{row.label}</td>
                  <td className="px-4 py-3 text-text-secondary">{formatNumber(row.leads)}</td>
                  <td className="px-4 py-3 text-text-secondary">{formatNumber(row.closed)}</td>
                  <td className="px-4 py-3 text-text-secondary">{row.installs > 0 ? formatNumber(row.installs) : "—"}</td>
                  <td className="px-4 py-3 text-text-secondary">{row.closeRate > 0 ? formatPercent(row.closeRate) : "—"}</td>
                  <td className="px-4 py-3 text-text-secondary">{row.adSpend > 0 ? formatCurrency(row.adSpend) : "—"}</td>
                  <td className="px-4 py-3 text-text-secondary">{row.cac > 0 ? formatCurrency(row.cac) : "—"}</td>
                  <td className="px-4 py-3 text-text-secondary">{row.roas > 0 ? formatROAS(row.roas) : "—"}</td>
                  <td className="px-4 py-3 text-brand font-medium">{row.contractValue > 0 ? formatCurrency(row.contractValue) : "—"}</td>
                  <td className="px-4 py-3 text-text-secondary">{row.grossSales > 0 ? formatCurrency(row.grossSales) : "—"}</td>
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
        <LeadsBySourceChart data={bySourceForCharts} />
        <RevenueBySourceChart data={bySourceForCharts} />
      </div>
    </>
  );
}
