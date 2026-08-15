"use client";

import { useState, useMemo } from "react";
import { SourceRow, Source } from "@/types";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";

// ─── Constants ────────────────────────────────────────────────────────────────

const LTGP = 11626.90;
const LOG_MAX = Math.log(41);

// Paid sources only — CPL, CAC, and the gauge are paid-media metrics
const PAID_SOURCES = new Set<Source>(["Meta_Ads", "Google_Ads", "Yelp"]);

type Period = "mtd" | "m2" | "m3" | "m6" | "ytd";

const PERIOD_LABELS: Record<Period, string> = {
  mtd: "MTD",
  m2:  "Last 2 months",
  m3:  "Last 3 months",
  m6:  "Last 6 months",
  ytd: "YTD",
};

const SOURCE_CONFIG: Partial<Record<string, { label: string; color: string }>> = {
  Google_Ads:      { label: "Google Ads", color: "#4285F4" },
  Meta_Ads:        { label: "Meta Ads",   color: "#1877F2" },
  "ManyChat_(IG)": { label: "ManyChat",   color: "#E1306C" },
  Yelp:            { label: "Yelp",       color: "#D32323" },
  Referrals:       { label: "Referrals",  color: "#34d399" },
  Website:         { label: "Website",    color: "#8b5cf6" },
  Other:           { label: "Other",      color: "#6b7280" },
  NA:              { label: "N/A",        color: "#4b4b4b" },
};

const CHANNEL_KEYS: { key: Source; label: string; color: string }[] = [
  { key: "Meta_Ads",   label: "Meta",   color: "#1877F2" },
  { key: "Google_Ads", label: "Google", color: "#4285F4" },
  { key: "Yelp",       label: "Yelp",   color: "#D32323" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MONTH_MAP: Record<string, number> = {
  jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11,
};

function parsePeriodDate(period: string): Date | null {
  const m = period.match(/([a-z]{3})[a-z]*[\s,'\-]+(\d{2,4})/i);
  if (!m) return null;
  const month = MONTH_MAP[m[1].toLowerCase()];
  if (month === undefined) return null;
  let year = parseInt(m[2]);
  if (year < 100) year += 2000;
  return new Date(year, month, 1);
}

// Returns the earliest Date a row must fall on or after to be included
function cutoffFor(period: Period): Date {
  const now = new Date();
  const yr  = now.getFullYear();
  const mo  = now.getMonth(); // 0-indexed
  switch (period) {
    case "mtd": return new Date(yr, mo, 1);
    case "m2":  return new Date(yr, mo - 1, 1);
    case "m3":  return new Date(yr, mo - 2, 1);
    case "m6":  return new Date(yr, mo - 5, 1);
    case "ytd": return new Date(yr, 0, 1);
  }
}

function filterByPeriod(rows: SourceRow[], period: Period): SourceRow[] {
  const cutoff = cutoffFor(period);
  return rows.filter((r) => {
    const d = parsePeriodDate(r.period);
    return d !== null && d >= cutoff;
  });
}

function gaugePos(ratio: number): string {
  return Math.min(95, (Math.log(ratio + 1) / LOG_MAX) * 100).toFixed(1) + "%";
}

function formatRatio(r: number): string {
  return (r >= 10 ? Math.round(r) : r.toFixed(1)) + ":1";
}

function fmtCompact(n: number): string {
  if (n >= 1_000_000) return "$" + (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000)     return "$" + (n / 1_000).toFixed(1) + "K";
  return "$" + n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Stat({ label, value, sub, accent, dim }: {
  label: string; value: string; sub?: string; accent?: boolean; dim?: boolean
}) {
  return (
    <div className={`bg-surface-card border border-surface-border rounded-2xl px-4 py-4 ${dim ? "opacity-50" : ""}`}>
      <p className="text-text-muted text-[10px] uppercase tracking-widest font-sans mb-2">{label}</p>
      <p className={`text-2xl font-bold font-sans tabular-nums leading-none ${accent ? "text-brand" : "text-text-primary"}`}>
        {value}
      </p>
      {sub && <p className="text-text-muted text-[11px] font-sans mt-1.5">{sub}</p>}
    </div>
  );
}

function ChannelCard({ label, color, rows }: { label: string; color: string; rows: SourceRow[] }) {
  const leads     = rows.reduce((s, r) => s + r.leads, 0);
  const contracts = rows.reduce((s, r) => s + r.closed, 0);
  const spend     = rows.reduce((s, r) => s + r.adSpend, 0);
  const closeRate = leads > 0 ? (contracts / leads) * 100 : 0;
  const cpl       = leads > 0 && spend > 0 ? spend / leads : 0;
  const cac       = contracts > 0 && spend > 0 ? spend / contracts : 0;
  const ratio     = cac > 0 ? LTGP / cac : 0;

  const row = (lbl: string, val: string, bright = false) => (
    <div className="flex items-baseline justify-between py-1.5 border-b border-surface-border/50 last:border-0">
      <span className="text-text-muted text-[11px] font-sans">{lbl}</span>
      <span className={`text-[12px] font-medium font-sans tabular-nums ${bright ? "text-brand" : "text-text-secondary"}`}>{val}</span>
    </div>
  );

  return (
    <div className="bg-surface-card border border-surface-border rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
        <p className="text-text-primary text-sm font-medium font-sans">{label}</p>
      </div>
      {row("Leads", leads > 0 ? formatNumber(leads) : "—")}
      {row("Contracts signed", contracts > 0 ? formatNumber(contracts) : "—")}
      {row("Close rate", closeRate > 0 ? formatPercent(closeRate) : "—")}
      {row("Ad spend", spend > 0 ? fmtCompact(spend) : "—")}
      {row("CPL", cpl > 0 ? formatCurrency(Math.round(cpl)) : "—")}
      {row("CAC", cac > 0 ? formatCurrency(Math.round(cac)) : "—")}
      {row("LTGP : CAC", ratio > 0 ? formatRatio(ratio) : "—", true)}

      {/* Mini gauge */}
      <div className="mt-3 pt-3 border-t border-surface-border/50">
        {ratio > 0 ? (
          <>
            <div className="relative h-[3px] flex rounded-full overflow-visible mb-2">
              <div className="h-[3px] rounded-l-full bg-red-500"  style={{ width: "18.6%" }} />
              <div className="h-[3px] bg-yellow-500"              style={{ width: "18.7%" }} />
              <div className="h-[3px] rounded-r-full flex-1 bg-green-500" />
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full border-2 border-surface-card transition-all duration-500"
                style={{ left: gaugePos(ratio), background: "#EA6B2A" }}
              />
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted text-[9px] font-sans">1:1</span>
              <span className="text-text-muted text-[9px] font-sans">3:1</span>
              <span className="text-text-muted text-[9px] font-sans">takes off</span>
            </div>
          </>
        ) : (
          <div className="h-[3px] rounded-full bg-surface-border/40" />
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  allData: Record<string, SourceRow[]>;
}

export function MarketingDashboard({ allData }: Props) {
  const [period, setPeriod] = useState<Period>("mtd");

  // Filter every source by the selected period
  const filtered = useMemo<Record<string, SourceRow[]>>(() => {
    const out: Record<string, SourceRow[]> = {};
    for (const [k, rows] of Object.entries(allData)) {
      out[k] = filterByPeriod(rows, period);
    }
    return out;
  }, [allData, period]);

  // All sources combined — for pipeline / revenue totals
  const allRows  = useMemo(() => Object.values(filtered).flat(), [filtered]);

  // Paid sources only — for CPL, CAC, and the efficiency gauge
  const paidRows = useMemo(
    () => CHANNEL_KEYS.flatMap((ch) => filtered[ch.key] ?? []),
    [filtered]
  );

  // ── All-source totals (pipeline health) ──
  const totalLeads     = allRows.reduce((s, r) => s + r.leads, 0);
  const totalContracts = allRows.reduce((s, r) => s + r.closed, 0);
  const closeRate      = totalLeads > 0 ? (totalContracts / totalLeads) * 100 : 0;
  const totalContractValue = allRows.reduce((s, r) => s + r.contractValue, 0);

  // ── Paid-only totals (cost metrics) ──
  const paidAdSpend   = paidRows.reduce((s, r) => s + r.adSpend, 0);
  const paidLeads     = paidRows.reduce((s, r) => s + r.leads, 0);
  const paidContracts = paidRows.reduce((s, r) => s + r.closed, 0);

  const cpl          = paidLeads > 0 && paidAdSpend > 0 ? paidAdSpend / paidLeads : 0;
  const cac          = paidContracts > 0 && paidAdSpend > 0 ? paidAdSpend / paidContracts : 0;
  const cacLtgpRatio = cac > 0 ? LTGP / cac : 0;

  // ── Source breakdown for bar chart ──
  const sourceLeads = useMemo(() =>
    Object.entries(filtered)
      .map(([key, rows]) => ({
        key,
        label: SOURCE_CONFIG[key]?.label ?? key,
        color: SOURCE_CONFIG[key]?.color ?? "#666",
        leads: rows.reduce((s, r) => s + r.leads, 0),
      }))
      .filter((s) => s.leads > 0)
      .sort((a, b) => b.leads - a.leads),
    [filtered]
  );
  const maxLeads = sourceLeads[0]?.leads ?? 1;

  return (
    <div>
      {/* ── Period tabs ── */}
      <div className="flex flex-wrap gap-2 mb-8">
        {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-1.5 rounded-lg text-xs font-sans border transition-colors ${
              period === p
                ? "bg-brand/10 text-brand border-brand/30 font-medium"
                : "text-text-muted border-surface-border hover:text-text-secondary"
            }`}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      {/* ── Revenue ── */}
      <p className="text-text-muted text-[10px] uppercase tracking-widest font-sans mb-3">Revenue</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-surface-card border border-surface-border rounded-2xl px-5 py-5">
          <p className="text-text-muted text-[10px] uppercase tracking-widest font-sans mb-2">Contract value</p>
          <p className="text-4xl font-bold text-brand tabular-nums leading-none">
            {totalContractValue > 0 ? fmtCompact(totalContractValue) : "—"}
          </p>
          <p className="text-text-muted text-[11px] font-sans mt-2">Signed deals · committed revenue</p>
        </div>
        <div className="bg-surface-card border border-surface-border rounded-2xl px-5 py-5">
          <p className="text-text-muted text-[10px] uppercase tracking-widest font-sans mb-2">Paid ad spend</p>
          <p className="text-4xl font-bold text-text-primary tabular-nums leading-none">
            {paidAdSpend > 0 ? fmtCompact(paidAdSpend) : "—"}
          </p>
          <p className="text-text-muted text-[11px] font-sans mt-2">Meta · Google · Yelp</p>
        </div>
      </div>

      {/* ── Pipeline ── */}
      <p className="text-text-muted text-[10px] uppercase tracking-widest font-sans mb-3">Pipeline</p>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Stat label="Total leads" value={totalLeads > 0 ? formatNumber(totalLeads) : "—"} />
        <Stat label="Contracts signed" value={totalContracts > 0 ? formatNumber(totalContracts) : "—"} sub="All sources" accent />
        <Stat label="Close rate" value={closeRate > 0 ? formatPercent(closeRate) : "—"} accent />
      </div>

      {/* ── Source breakdown ── */}
      {sourceLeads.length > 0 && (
        <div className="bg-surface-card border border-surface-border rounded-2xl p-5 mb-8">
          <p className="text-text-primary text-xs font-medium font-sans mb-4">Leads by source</p>
          <div className="flex flex-col gap-3">
            {sourceLeads.map((s) => (
              <div key={s.key} className="grid items-center gap-3" style={{ gridTemplateColumns: "90px 1fr 32px" }}>
                <span className="text-text-secondary text-xs font-sans truncate">{s.label}</span>
                <div className="h-[3px] rounded-full bg-surface-border overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${(s.leads / maxLeads) * 100}%`, background: s.color }}
                  />
                </div>
                <span className="text-text-muted text-[11px] font-sans text-right tabular-nums">{s.leads}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Optimization signals (paid-only) ── */}
      <div className="flex items-baseline gap-2 mb-3">
        <p className="text-text-muted text-[10px] uppercase tracking-widest font-sans">Optimization signals</p>
        <p className="text-text-muted text-[10px] font-sans">· paid channels only</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
        <Stat
          label="Paid CPL"
          value={cpl > 0 ? formatCurrency(Math.round(cpl)) : "—"}
          sub="Paid ad spend ÷ paid leads"
        />
        <Stat
          label="Paid CAC"
          value={cac > 0 ? formatCurrency(Math.round(cac)) : "—"}
          sub="Paid ad spend ÷ paid contracts"
        />
        <Stat
          label="Close rate"
          value={closeRate > 0 ? formatPercent(closeRate) : "—"}
          sub="All sources"
          accent
        />
      </div>

      {/* ── LTGP:CAC Gauge ── */}
      <div className="bg-surface-card border border-surface-border rounded-2xl p-5 mb-4">
        <div className="flex items-baseline gap-3 mb-1">
          <p className="text-text-secondary text-xs font-medium font-sans">Paid LTGP : CAC</p>
          <p className="text-text-muted text-[11px] font-sans">$11,626.90 lifetime gross profit per customer</p>
        </div>
        <p className="text-3xl font-bold text-brand tabular-nums mb-4 leading-none">
          {cacLtgpRatio > 0 ? formatRatio(cacLtgpRatio) : "—"}
        </p>
        {cacLtgpRatio > 0 && (
          <>
            {/* Log scale: 1:1 @ 18.6%, 3:1 @ 37.3% */}
            <div className="relative h-[5px] flex rounded-full overflow-visible mb-5">
              <div className="h-[5px] rounded-l-full bg-red-500"   style={{ width: "18.6%" }} />
              <div className="h-[5px] bg-yellow-500"               style={{ width: "18.7%" }} />
              <div className="h-[5px] rounded-r-full flex-1 bg-green-500" />
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full border-2 border-[#0F0F0F] transition-all duration-500"
                style={{ left: gaugePos(cacLtgpRatio), background: "#EA6B2A" }}
              />
            </div>
            <div className="flex gap-4 flex-wrap">
              {[
                { color: "#ef4444", label: "< 1:1 — losing money" },
                { color: "#eab308", label: "1–3:1 — won’t scale" },
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

      {/* ── Placeholder signals ── */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {["Speed to lead avg", "Show rate"].map((label) => (
          <div key={label} className="bg-surface-card border border-dashed border-surface-border rounded-2xl px-4 py-4 opacity-40">
            <p className="text-text-muted text-[10px] uppercase tracking-widest font-sans mb-2">{label}</p>
            <p className="text-text-muted text-sm font-sans">Track in sheet →</p>
          </div>
        ))}
      </div>

      {/* ── Paid channels ── */}
      <p className="text-text-muted text-[10px] uppercase tracking-widest font-sans mb-3">Paid channels</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {CHANNEL_KEYS.map((ch) => (
          <ChannelCard
            key={ch.key}
            label={ch.label}
            color={ch.color}
            rows={filtered[ch.key] ?? []}
          />
        ))}
      </div>
    </div>
  );
}
