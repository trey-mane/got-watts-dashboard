"use client";

import { useState, useMemo, useEffect } from "react";
import { SourceRow, Source } from "@/types";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";

// ─── Constants ────────────────────────────────────────────────────────────────

const LTGP = 11626.90;
const LOG_MAX = Math.log(41);
const PAID_SOURCES = new Set<Source>(["Meta_Ads", "Google_Ads", "Yelp"]);

type Period = "mtd" | "last" | "m2" | "m3" | "m6" | "ytd";
type SortKey = "label" | "leads" | "contracts" | "closeRate" | "value" | "cpl" | "cac" | "ratio";

const PERIOD_LABELS: Record<Period, string> = {
  mtd:  "MTD",
  last: "Last month",
  m2:   "Last 2 months",
  m3:   "Last 3 months",
  m6:   "Last 6 months",
  ytd:  "YTD",
};

const SOURCE_CONFIG: Partial<Record<string, { label: string; color: string }>> = {
  Google_Ads:      { label: "Google Ads", color: "#4285F4" },
  Meta_Ads:        { label: "Meta Ads",   color: "#1877F2" },
  "ManyChat_(IG)": { label: "ManyChat",   color: "#E1306C" },
  Yelp:            { label: "Yelp",       color: "#D32323" },
  Referrals:       { label: "Referrals",  color: "#34d399" },
  Self_Gen:        { label: "Self-Gen",   color: "#f59e0b" },
  Website:         { label: "Website",    color: "#8b5cf6" },
  Other:           { label: "Other",      color: "#6b7280" },
  NA:              { label: "N/A",        color: "#9b9b9b" },
};

const CHANNEL_KEYS: { key: Source; label: string; color: string }[] = [
  { key: "Meta_Ads",   label: "Meta",   color: "#1877F2" },
  { key: "Google_Ads", label: "Google", color: "#4285F4" },
  { key: "Yelp",       label: "Yelp",   color: "#D32323" },
];

// ─── Period helpers ───────────────────────────────────────────────────────────

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

function filterByPeriod(rows: SourceRow[], period: Period): SourceRow[] {
  const now = new Date();
  const yr = now.getFullYear();
  const mo = now.getMonth();
  return rows.filter((r) => {
    const d = parsePeriodDate(r.period);
    if (!d) return false;
    if (period === "mtd")  return d.getFullYear() === yr && d.getMonth() === mo;
    if (period === "last") { const p = new Date(yr, mo - 1, 1); return d.getFullYear() === p.getFullYear() && d.getMonth() === p.getMonth(); }
    if (period === "m2")   return d >= new Date(yr, mo - 1, 1);
    if (period === "m3")   return d >= new Date(yr, mo - 2, 1);
    if (period === "m6")   return d >= new Date(yr, mo - 5, 1);
    if (period === "ytd")  return d.getFullYear() === yr;
    return false;
  });
}

function filterPriorPeriod(rows: SourceRow[], period: Period): SourceRow[] {
  const now = new Date();
  const yr = now.getFullYear();
  const mo = now.getMonth();
  return rows.filter((r) => {
    const d = parsePeriodDate(r.period);
    if (!d) return false;
    if (period === "mtd")  { const p = new Date(yr, mo - 1, 1); return d.getFullYear() === p.getFullYear() && d.getMonth() === p.getMonth(); }
    if (period === "last") { const p = new Date(yr, mo - 2, 1); return d.getFullYear() === p.getFullYear() && d.getMonth() === p.getMonth(); }
    if (period === "m2")   return d >= new Date(yr, mo - 3, 1) && d < new Date(yr, mo - 1, 1);
    if (period === "m3")   return d >= new Date(yr, mo - 5, 1) && d < new Date(yr, mo - 2, 1);
    if (period === "m6")   return d >= new Date(yr, mo - 11, 1) && d < new Date(yr, mo - 5, 1);
    if (period === "ytd")  return d.getFullYear() === yr - 1 && d.getMonth() <= mo;
    return false;
  });
}

function periodMonths(period: Period): number {
  return { mtd: 1, last: 1, m2: 2, m3: 3, m6: 6, ytd: new Date().getMonth() + 1 }[period];
}

// ─── Formatting helpers ───────────────────────────────────────────────────────

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

function DeltaBadge({ curr, prev, invert = false }: { curr: number; prev: number; invert?: boolean }) {
  if (prev === 0 || curr === 0) return null;
  const pct = ((curr - prev) / prev) * 100;
  const up = pct >= 0;
  const good = invert ? !up : up;
  return (
    <span className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-full font-sans leading-tight ${
      good ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
    }`}>
      {up ? "↑" : "↓"} {Math.abs(pct).toFixed(1)}%
    </span>
  );
}

function Stat({ label, value, sub, accent }: {
  label: string; value: string; sub?: string; accent?: boolean;
}) {
  return (
    <div className="bg-surface-card border border-surface-border rounded-2xl px-4 py-4">
      <p className="text-text-muted text-[10px] uppercase tracking-widest font-sans mb-2">{label}</p>
      <p className={`text-2xl font-bold font-sans tabular-nums leading-none ${accent ? "text-brand" : "text-text-primary"}`}>
        {value}
      </p>
      {sub && <p className="text-text-muted text-[11px] font-sans mt-1.5">{sub}</p>}
    </div>
  );
}

function GoalCard({ storageKey, label, current, defaultTarget, months }: {
  storageKey: string; label: string; current: number; defaultTarget: number; months: number;
}) {
  const [target, setTarget] = useState(defaultTarget);
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState("");

  useEffect(() => {
    const v = localStorage.getItem(storageKey);
    if (v) setTarget(parseFloat(v) || defaultTarget);
  }, [storageKey, defaultTarget]);

  const periodTarget = target * months;
  const pct = periodTarget > 0 ? Math.min(100, (current / periodTarget) * 100) : 0;
  const barColor = pct >= 100 ? "bg-green-500" : pct >= 70 ? "bg-brand" : pct >= 40 ? "bg-yellow-500" : "bg-red-400";

  function save(raw: string) {
    const v = parseFloat(raw.replace(/[$,]/g, ""));
    if (!isNaN(v) && v > 0) {
      setTarget(v);
      localStorage.setItem(storageKey, v.toString());
    }
    setEditing(false);
  }

  return (
    <div className="bg-surface-card border border-surface-border rounded-2xl p-4">
      <div className="flex items-start justify-between mb-3">
        <p className="text-text-muted text-[10px] uppercase tracking-widest font-sans">{label}</p>
        <button
          onClick={() => { setInput(target.toString()); setEditing(true); }}
          className="text-text-muted hover:text-brand transition-colors"
          title="Edit monthly target"
        >
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <path d="M8.5 1.5l2 2-7 7H1.5v-2l7-7z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {editing ? (
        <form onSubmit={(e) => { e.preventDefault(); save(input); }} className="flex gap-2 mb-2">
          <input
            autoFocus
            className="flex-1 min-w-0 bg-surface-muted border border-brand rounded-lg px-2 py-1.5 text-sm text-text-primary font-sans outline-none"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onBlur={() => save(input)}
            placeholder="Monthly target"
          />
          <button type="submit" className="px-2.5 py-1.5 bg-brand text-white rounded-lg text-xs font-sans">
            Save
          </button>
        </form>
      ) : (
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-xl font-bold text-text-primary tabular-nums font-sans">{formatNumber(Math.round(current))}</span>
          <span className="text-text-muted text-xs font-sans">
            / {formatNumber(Math.round(periodTarget))}
            {months > 1 && <span className="text-text-muted text-[10px]"> ({months}×{formatNumber(Math.round(target))}/mo)</span>}
          </span>
        </div>
      )}

      <div className="h-1.5 rounded-full bg-surface-muted overflow-hidden mb-1.5">
        <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-text-muted text-[10px] font-sans">{pct.toFixed(0)}% of target</p>
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
      {row("Leads",            leads     > 0 ? formatNumber(leads)                 : "—")}
      {row("Contracts signed", contracts > 0 ? formatNumber(contracts)             : "—")}
      {row("Close rate",       closeRate > 0 ? formatPercent(closeRate)            : "—")}
      {row("Ad spend",         spend     > 0 ? fmtCompact(spend)                  : "—")}
      {row("CPL",              cpl       > 0 ? formatCurrency(Math.round(cpl))    : "—")}
      {row("CAC",              cac       > 0 ? formatCurrency(Math.round(cac))    : "—")}
      {row("LTGP : CAC",       ratio     > 0 ? formatRatio(ratio)                 : "—", true)}

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

type SortDir = "asc" | "desc";

export function MarketingDashboard({ allData }: Props) {
  const [period, setPeriod]     = useState<Period>("mtd");
  const [sortKey, setSortKey]   = useState<SortKey>("value");
  const [sortDir, setSortDir]   = useState<SortDir>("desc");

  // ── Period-filtered data ──
  const filtered = useMemo<Record<string, SourceRow[]>>(() => {
    const out: Record<string, SourceRow[]> = {};
    for (const [k, rows] of Object.entries(allData)) out[k] = filterByPeriod(rows, period);
    return out;
  }, [allData, period]);

  const priorFiltered = useMemo<Record<string, SourceRow[]>>(() => {
    const out: Record<string, SourceRow[]> = {};
    for (const [k, rows] of Object.entries(allData)) out[k] = filterPriorPeriod(rows, period);
    return out;
  }, [allData, period]);

  const months = periodMonths(period);

  // ── Aggregates ──
  const allRows  = useMemo(() => Object.values(filtered).flat(), [filtered]);
  const priorRows = useMemo(() => Object.values(priorFiltered).flat(), [priorFiltered]);
  const paidRows = useMemo(() => CHANNEL_KEYS.flatMap((ch) => filtered[ch.key] ?? []), [filtered]);
  const priorPaidRows = useMemo(() => CHANNEL_KEYS.flatMap((ch) => priorFiltered[ch.key] ?? []), [priorFiltered]);

  // Current period
  const totalLeads         = allRows.reduce((s, r) => s + r.leads, 0);
  const totalContracts     = allRows.reduce((s, r) => s + r.closed, 0);
  const closeRate          = totalLeads > 0 ? (totalContracts / totalLeads) * 100 : 0;
  const totalContractValue = allRows.reduce((s, r) => s + r.contractValue, 0);
  const paidAdSpend        = paidRows.reduce((s, r) => s + r.adSpend, 0);
  const paidLeads          = paidRows.reduce((s, r) => s + r.leads, 0);
  const paidContracts      = paidRows.reduce((s, r) => s + r.closed, 0);
  const cpl                = paidLeads > 0 && paidAdSpend > 0 ? paidAdSpend / paidLeads : 0;
  const cac                = paidContracts > 0 && paidAdSpend > 0 ? paidAdSpend / paidContracts : 0;
  const cacLtgpRatio       = cac > 0 ? LTGP / cac : 0;

  // Prior period (for deltas)
  const priorLeads         = priorRows.reduce((s, r) => s + r.leads, 0);
  const priorContracts     = priorRows.reduce((s, r) => s + r.closed, 0);
  const priorCloseRate     = priorLeads > 0 ? (priorContracts / priorLeads) * 100 : 0;
  const priorValue         = priorRows.reduce((s, r) => s + r.contractValue, 0);
  const priorPaidAdSpend   = priorPaidRows.reduce((s, r) => s + r.adSpend, 0);
  const priorPaidLeads     = priorPaidRows.reduce((s, r) => s + r.leads, 0);
  const priorPaidContracts = priorPaidRows.reduce((s, r) => s + r.closed, 0);
  const priorCpl           = priorPaidLeads > 0 && priorPaidAdSpend > 0 ? priorPaidAdSpend / priorPaidLeads : 0;
  const priorCac           = priorPaidContracts > 0 && priorPaidAdSpend > 0 ? priorPaidAdSpend / priorPaidContracts : 0;

  // ── Source breakdowns ──
  const sourceLeads = useMemo(() =>
    Object.entries(filtered)
      .map(([key, rows]) => ({ key, label: SOURCE_CONFIG[key]?.label ?? key, color: SOURCE_CONFIG[key]?.color ?? "#888", leads: rows.reduce((s, r) => s + r.leads, 0) }))
      .filter((s) => s.leads > 0).sort((a, b) => b.leads - a.leads),
    [filtered]
  );
  const maxLeads = sourceLeads[0]?.leads ?? 1;

  const sourceRevenue = useMemo(() =>
    Object.entries(filtered)
      .map(([key, rows]) => ({ key, label: SOURCE_CONFIG[key]?.label ?? key, color: SOURCE_CONFIG[key]?.color ?? "#888", value: rows.reduce((s, r) => s + r.contractValue, 0) }))
      .filter((s) => s.value > 0).sort((a, b) => b.value - a.value),
    [filtered]
  );
  const maxRevenue = sourceRevenue[0]?.value ?? 1;

  // ── Efficiency table rows ──
  const tableRows = useMemo(() => {
    return Object.entries(filtered)
      .map(([key, rows]) => {
        const leads     = rows.reduce((s, r) => s + r.leads, 0);
        const contracts = rows.reduce((s, r) => s + r.closed, 0);
        const spend     = rows.reduce((s, r) => s + r.adSpend, 0);
        const value     = rows.reduce((s, r) => s + r.contractValue, 0);
        const isPaid    = PAID_SOURCES.has(key as Source);
        const closeRate = leads > 0 ? (contracts / leads) * 100 : 0;
        const cpl       = isPaid && leads > 0 && spend > 0 ? spend / leads : 0;
        const cac       = isPaid && contracts > 0 && spend > 0 ? spend / contracts : 0;
        const ratio     = cac > 0 ? LTGP / cac : 0;
        return { key, label: SOURCE_CONFIG[key]?.label ?? key, color: SOURCE_CONFIG[key]?.color ?? "#888", isPaid, leads, contracts, closeRate, value, cpl, cac, ratio };
      })
      .filter((r) => r.leads > 0 || r.value > 0);
  }, [filtered]);

  const sortedRows = useMemo(() => {
    return [...tableRows].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortKey === "label")     return dir * a.label.localeCompare(b.label);
      if (sortKey === "leads")     return dir * (a.leads - b.leads);
      if (sortKey === "contracts") return dir * (a.contracts - b.contracts);
      if (sortKey === "closeRate") return dir * (a.closeRate - b.closeRate);
      if (sortKey === "value")     return dir * (a.value - b.value);
      if (sortKey === "cpl")       return dir * (a.cpl - b.cpl);
      if (sortKey === "cac")       return dir * (a.cac - b.cac);
      if (sortKey === "ratio")     return dir * (a.ratio - b.ratio);
      return 0;
    });
  }, [tableRows, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  }

  function SortTh({ col, children }: { col: SortKey; children: React.ReactNode }) {
    const active = sortKey === col;
    return (
      <th
        onClick={() => toggleSort(col)}
        className="text-left px-3 py-2.5 cursor-pointer select-none whitespace-nowrap group"
      >
        <span className={`text-[10px] uppercase tracking-widest font-normal font-sans flex items-center gap-1 ${active ? "text-brand" : "text-text-muted"}`}>
          {children}
          <span className="opacity-50 group-hover:opacity-100 transition-opacity">
            {active ? (sortDir === "desc" ? "↓" : "↑") : "↕"}
          </span>
        </span>
      </th>
    );
  }

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

      {/* ── Revenue KPIs ── */}
      <p className="text-text-muted text-[10px] uppercase tracking-widest font-sans mb-3">Revenue</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-surface-card border border-surface-border rounded-2xl px-5 py-5">
          <div className="flex items-start justify-between mb-2">
            <p className="text-text-muted text-[10px] uppercase tracking-widest font-sans">Contract value</p>
            <DeltaBadge curr={totalContractValue} prev={priorValue} />
          </div>
          <p className="text-4xl font-bold text-brand tabular-nums leading-none">
            {totalContractValue > 0 ? fmtCompact(totalContractValue) : "—"}
          </p>
          <p className="text-text-muted text-[11px] font-sans mt-2">Signed deals · committed revenue</p>
        </div>
        <div className="bg-surface-card border border-surface-border rounded-2xl px-5 py-5">
          <div className="flex items-start justify-between mb-2">
            <p className="text-text-muted text-[10px] uppercase tracking-widest font-sans">Paid ad spend</p>
            <DeltaBadge curr={paidAdSpend} prev={priorPaidAdSpend} invert />
          </div>
          <p className="text-4xl font-bold text-text-primary tabular-nums leading-none">
            {paidAdSpend > 0 ? fmtCompact(paidAdSpend) : "—"}
          </p>
          <p className="text-text-muted text-[11px] font-sans mt-2">Meta · Google · Yelp</p>
        </div>
      </div>

      {/* ── Pipeline KPIs ── */}
      <p className="text-text-muted text-[10px] uppercase tracking-widest font-sans mb-3">Pipeline</p>
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-surface-card border border-surface-border rounded-2xl px-4 py-4">
          <div className="flex items-start justify-between mb-2">
            <p className="text-text-muted text-[10px] uppercase tracking-widest font-sans">Total leads</p>
            <DeltaBadge curr={totalLeads} prev={priorLeads} />
          </div>
          <p className="text-2xl font-bold text-text-primary tabular-nums leading-none">
            {totalLeads > 0 ? formatNumber(totalLeads) : "—"}
          </p>
        </div>
        <div className="bg-surface-card border border-surface-border rounded-2xl px-4 py-4">
          <div className="flex items-start justify-between mb-2">
            <p className="text-text-muted text-[10px] uppercase tracking-widest font-sans">Contracts signed</p>
            <DeltaBadge curr={totalContracts} prev={priorContracts} />
          </div>
          <p className="text-2xl font-bold text-brand tabular-nums leading-none">
            {totalContracts > 0 ? formatNumber(totalContracts) : "—"}
          </p>
          <p className="text-text-muted text-[11px] font-sans mt-1.5">All sources</p>
        </div>
        <div className="bg-surface-card border border-surface-border rounded-2xl px-4 py-4">
          <div className="flex items-start justify-between mb-2">
            <p className="text-text-muted text-[10px] uppercase tracking-widest font-sans">Close rate</p>
            <DeltaBadge curr={closeRate} prev={priorCloseRate} />
          </div>
          <p className="text-2xl font-bold text-brand tabular-nums leading-none">
            {closeRate > 0 ? formatPercent(closeRate) : "—"}
          </p>
        </div>
      </div>

      {/* ── Conversion funnel ── */}
      {totalLeads > 0 && (
        <>
          <p className="text-text-muted text-[10px] uppercase tracking-widest font-sans mb-3">Conversion funnel</p>
          <div className="bg-surface-card border border-surface-border rounded-2xl p-5 mb-8">
            <div className="flex flex-col gap-1">
              {/* Step 1: Leads */}
              <div className="flex items-center gap-4">
                <div className="w-28 flex-shrink-0 text-right">
                  <p className="text-text-muted text-[10px] uppercase tracking-widest font-sans">Leads</p>
                  <p className="text-text-primary text-lg font-bold tabular-nums font-sans">{formatNumber(totalLeads)}</p>
                </div>
                <div className="flex-1 h-8 rounded-lg bg-brand/20 overflow-hidden">
                  <div className="h-full bg-brand rounded-lg transition-all duration-700" style={{ width: "100%" }} />
                </div>
              </div>

              {/* Conversion rate arrow */}
              <div className="flex items-center gap-4 py-1">
                <div className="w-28 flex-shrink-0" />
                <div className="flex-1 flex items-center gap-2 pl-3">
                  <div className="w-px h-5 bg-surface-border" />
                  <span className="text-text-muted text-[10px] font-sans">
                    {closeRate > 0 ? `${formatPercent(closeRate)} close rate` : "—"}
                  </span>
                </div>
              </div>

              {/* Step 2: Contracts */}
              <div className="flex items-center gap-4">
                <div className="w-28 flex-shrink-0 text-right">
                  <p className="text-text-muted text-[10px] uppercase tracking-widest font-sans">Contracts</p>
                  <p className="text-text-primary text-lg font-bold tabular-nums font-sans">{formatNumber(totalContracts)}</p>
                </div>
                <div className="flex-1 h-8 rounded-lg bg-surface-muted overflow-hidden">
                  <div
                    className="h-full bg-brand/60 rounded-lg transition-all duration-700"
                    style={{ width: totalLeads > 0 ? `${(totalContracts / totalLeads) * 100}%` : "0%" }}
                  />
                </div>
              </div>

              {/* LTGP arrow */}
              <div className="flex items-center gap-4 py-1">
                <div className="w-28 flex-shrink-0" />
                <div className="flex-1 flex items-center gap-2 pl-3">
                  <div className="w-px h-5 bg-surface-border" />
                  <span className="text-text-muted text-[10px] font-sans">
                    × ${LTGP.toLocaleString()} LTGP · avg deal {totalContracts > 0 && totalContractValue > 0 ? fmtCompact(totalContractValue / totalContracts) : "—"}
                  </span>
                </div>
              </div>

              {/* Step 3: Pipeline value */}
              <div className="flex items-center gap-4">
                <div className="w-28 flex-shrink-0 text-right">
                  <p className="text-text-muted text-[10px] uppercase tracking-widest font-sans">Value</p>
                  <p className="text-brand text-lg font-bold tabular-nums font-sans">
                    {totalContractValue > 0 ? fmtCompact(totalContractValue) : "—"}
                  </p>
                </div>
                <div className="flex-1 h-8 rounded-lg bg-surface-muted overflow-hidden">
                  <div
                    className="h-full rounded-lg transition-all duration-700"
                    style={{
                      width: totalContracts > 0 ? `${Math.min(100, (totalContracts / totalLeads) * 100)}%` : "0%",
                      background: "linear-gradient(90deg, #EA6B2A 0%, #f08a52 100%)",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Goals ── */}
      <p className="text-text-muted text-[10px] uppercase tracking-widest font-sans mb-3">
        Goals
        {months > 1 && <span className="normal-case ml-1">· scaled to {months} months</span>}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <GoalCard storageKey="gw_target_leads"     label="Leads"      current={totalLeads}         defaultTarget={30}     months={months} />
        <GoalCard storageKey="gw_target_contracts" label="Contracts"  current={totalContracts}     defaultTarget={10}     months={months} />
        <GoalCard storageKey="gw_target_revenue"   label="Contract value" current={totalContractValue} defaultTarget={100000} months={months} />
      </div>

      {/* ── Source breakdowns ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {sourceLeads.length > 0 && (
          <div className="bg-surface-card border border-surface-border rounded-2xl p-5">
            <p className="text-text-primary text-xs font-medium font-sans mb-4">Leads by source</p>
            <div className="flex flex-col gap-3">
              {sourceLeads.map((s) => (
                <div key={s.key} className="grid items-center gap-3" style={{ gridTemplateColumns: "80px 1fr 36px" }}>
                  <span className="text-text-secondary text-xs font-sans truncate">{s.label}</span>
                  <div className="h-[3px] rounded-full bg-surface-muted overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(s.leads / maxLeads) * 100}%`, background: s.color }} />
                  </div>
                  <span className="text-text-muted text-[11px] font-sans text-right tabular-nums">{s.leads}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {sourceRevenue.length > 0 && (
          <div className="bg-surface-card border border-surface-border rounded-2xl p-5">
            <p className="text-text-primary text-xs font-medium font-sans mb-4">Revenue by source</p>
            <div className="flex flex-col gap-3">
              {sourceRevenue.map((s) => (
                <div key={s.key} className="grid items-center gap-3" style={{ gridTemplateColumns: "80px 1fr 52px" }}>
                  <span className="text-text-secondary text-xs font-sans truncate">{s.label}</span>
                  <div className="h-[3px] rounded-full bg-surface-muted overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(s.value / maxRevenue) * 100}%`, background: s.color }} />
                  </div>
                  <span className="text-text-muted text-[11px] font-sans text-right tabular-nums">{fmtCompact(s.value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Optimization signals ── */}
      <div className="flex items-baseline gap-2 mb-3">
        <p className="text-text-muted text-[10px] uppercase tracking-widest font-sans">Optimization signals</p>
        <p className="text-text-muted text-[10px] font-sans">· paid channels only</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-surface-card border border-surface-border rounded-2xl px-4 py-4">
          <div className="flex items-start justify-between mb-2">
            <p className="text-text-muted text-[10px] uppercase tracking-widest font-sans">Paid CPL</p>
            <DeltaBadge curr={cpl} prev={priorCpl} invert />
          </div>
          <p className="text-2xl font-bold text-text-primary tabular-nums leading-none">
            {cpl > 0 ? formatCurrency(Math.round(cpl)) : "—"}
          </p>
          <p className="text-text-muted text-[11px] font-sans mt-1.5">Paid ad spend ÷ paid leads</p>
        </div>
        <div className="bg-surface-card border border-surface-border rounded-2xl px-4 py-4">
          <div className="flex items-start justify-between mb-2">
            <p className="text-text-muted text-[10px] uppercase tracking-widest font-sans">Paid CAC</p>
            <DeltaBadge curr={cac} prev={priorCac} invert />
          </div>
          <p className="text-2xl font-bold text-text-primary tabular-nums leading-none">
            {cac > 0 ? formatCurrency(Math.round(cac)) : "—"}
          </p>
          <p className="text-text-muted text-[11px] font-sans mt-1.5">Paid ad spend ÷ paid contracts</p>
        </div>
        <Stat label="Close rate" value={closeRate > 0 ? formatPercent(closeRate) : "—"} sub="All sources" accent />
      </div>

      {/* ── LTGP:CAC Gauge ── */}
      <div className="bg-surface-card border border-surface-border rounded-2xl p-5 mb-8">
        <div className="flex items-baseline gap-3 mb-1">
          <p className="text-text-secondary text-xs font-medium font-sans">Paid LTGP : CAC</p>
          <p className="text-text-muted text-[11px] font-sans">$11,626.90 lifetime gross profit per customer</p>
        </div>
        <p className="text-3xl font-bold text-brand tabular-nums mb-4 leading-none">
          {cacLtgpRatio > 0 ? formatRatio(cacLtgpRatio) : "—"}
        </p>
        {cacLtgpRatio > 0 && (
          <>
            <div className="relative h-[5px] flex rounded-full overflow-visible mb-5">
              <div className="h-[5px] rounded-l-full bg-red-500"   style={{ width: "18.6%" }} />
              <div className="h-[5px] bg-yellow-500"               style={{ width: "18.7%" }} />
              <div className="h-[5px] rounded-r-full flex-1 bg-green-500" />
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full border-2 border-surface-card transition-all duration-500"
                style={{ left: gaugePos(cacLtgpRatio), background: "#EA6B2A" }}
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

      {/* ── Source efficiency table ── */}
      {sortedRows.length > 0 && (
        <>
          <p className="text-text-muted text-[10px] uppercase tracking-widest font-sans mb-3">Source efficiency</p>
          <div className="bg-surface-card border border-surface-border rounded-2xl overflow-x-auto mb-8">
            <table className="w-full text-sm font-sans">
              <thead>
                <tr className="border-b border-surface-border">
                  <SortTh col="label">Source</SortTh>
                  <SortTh col="leads">Leads</SortTh>
                  <SortTh col="contracts">Contracts</SortTh>
                  <SortTh col="closeRate">Close %</SortTh>
                  <SortTh col="value">Contract value</SortTh>
                  <SortTh col="cpl">CPL</SortTh>
                  <SortTh col="cac">CAC</SortTh>
                  <SortTh col="ratio">LTGP:CAC</SortTh>
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((r) => (
                  <tr key={r.key} className="border-b border-surface-border/50 last:border-0 hover:bg-surface-muted/40 transition-colors">
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: r.color }} />
                        <span className="text-text-primary text-xs font-medium">{r.label}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-text-secondary text-xs tabular-nums">{r.leads > 0 ? formatNumber(r.leads) : "—"}</td>
                    <td className="px-3 py-2.5 text-text-secondary text-xs tabular-nums">{r.contracts > 0 ? formatNumber(r.contracts) : "—"}</td>
                    <td className="px-3 py-2.5 text-text-secondary text-xs tabular-nums">{r.closeRate > 0 ? formatPercent(r.closeRate) : "—"}</td>
                    <td className="px-3 py-2.5 text-brand text-xs font-medium tabular-nums">{r.value > 0 ? fmtCompact(r.value) : "—"}</td>
                    <td className="px-3 py-2.5 text-text-secondary text-xs tabular-nums">{r.cpl > 0 ? formatCurrency(Math.round(r.cpl)) : "—"}</td>
                    <td className="px-3 py-2.5 text-text-secondary text-xs tabular-nums">{r.cac > 0 ? formatCurrency(Math.round(r.cac)) : "—"}</td>
                    <td className="px-3 py-2.5 text-xs tabular-nums">
                      {r.ratio > 0 ? (
                        <span className={`font-medium ${r.ratio >= 3 ? "text-green-600" : r.ratio >= 1 ? "text-yellow-600" : "text-red-500"}`}>
                          {formatRatio(r.ratio)}
                        </span>
                      ) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── Paid channel cards ── */}
      <p className="text-text-muted text-[10px] uppercase tracking-widest font-sans mb-3">Paid channels</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {CHANNEL_KEYS.map((ch) => (
          <ChannelCard key={ch.key} label={ch.label} color={ch.color} rows={filtered[ch.key] ?? []} />
        ))}
      </div>
    </div>
  );
}
