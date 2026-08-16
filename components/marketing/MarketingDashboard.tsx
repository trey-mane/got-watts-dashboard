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

// ─── Goal helpers ─────────────────────────────────────────────────────────────

function useGoal(key: string, def: number): [number, (v: number) => void] {
  const [val, setVal] = useState(def);
  useEffect(() => {
    try { const s = localStorage.getItem(key); if (s) setVal(parseFloat(s) || def); } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  function update(v: number) { setVal(v); try { localStorage.setItem(key, v.toString()); } catch {} }
  return [val, update];
}

function progColor(pct: number) {
  return pct >= 100 ? "bg-green-500" : pct >= 70 ? "bg-brand" : pct >= 40 ? "bg-yellow-500" : "bg-red-400";
}

function GoalTrack({
  trackLabel, color, months,
  revenueGoal, onChangeRevenue,
  leadsPerMonth, contractsPerMonth,
  currLeads, currContracts, currValue,
  closeRatePct, avgDeal,
}: {
  trackLabel: string; color: string; months: number;
  revenueGoal: number; onChangeRevenue: (v: number) => void;
  leadsPerMonth: number; contractsPerMonth: number;
  currLeads: number; currContracts: number; currValue: number;
  closeRatePct: number; avgDeal: number;
}) {
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState("");

  function saveGoal(raw: string) {
    const cleaned = raw.replace(/[$,\s]/g, "");
    const v = cleaned.endsWith("M") || cleaned.endsWith("m")
      ? parseFloat(cleaned) * 1_000_000
      : cleaned.endsWith("K") || cleaned.endsWith("k")
      ? parseFloat(cleaned) * 1_000
      : parseFloat(cleaned);
    if (!isNaN(v) && v > 0) onChangeRevenue(v);
    setEditing(false);
  }

  const pLeads     = leadsPerMonth     * months;
  const pContracts = contractsPerMonth * months;
  const pRevenue   = revenueGoal       * months;

  const rows = [
    { label: "Leads",     curr: currLeads,     target: pLeads     },
    { label: "Contracts", curr: currContracts, target: pContracts },
    { label: "Revenue",   curr: currValue,     target: pRevenue, isMoney: true },
  ];

  return (
    <div className="bg-surface-card border border-surface-border rounded-2xl p-5 flex flex-col">
      {/* Track header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
        <p className="text-text-muted text-[10px] uppercase tracking-widest font-sans">{trackLabel}</p>
      </div>

      {/* Editable revenue goal */}
      {editing ? (
        <form onSubmit={(e) => { e.preventDefault(); saveGoal(inputVal); }} className="flex gap-2 mb-2">
          <input
            autoFocus
            className="flex-1 min-w-0 bg-surface-muted border border-brand rounded-lg px-3 py-1.5 text-xl font-bold text-text-primary font-sans outline-none tabular-nums"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onBlur={() => saveGoal(inputVal)}
            placeholder="e.g. 1000000 or 1M"
          />
          <button type="submit" className="px-3 py-1.5 bg-brand text-white rounded-lg text-xs font-sans flex-shrink-0">Save</button>
        </form>
      ) : (
        <button
          onClick={() => { setInputVal(revenueGoal.toString()); setEditing(true); }}
          className="group flex items-baseline gap-1.5 mb-2 text-left"
        >
          <span className="text-3xl font-bold text-text-primary tabular-nums font-sans">{fmtCompact(revenueGoal)}</span>
          <span className="text-text-muted text-sm font-sans">/mo</span>
          <svg className="opacity-0 group-hover:opacity-40 transition-opacity ml-1 flex-shrink-0" width="10" height="10" viewBox="0 0 12 12" fill="none">
            <path d="M8.5 1.5l2 2-7 7H1.5v-2l7-7z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
          </svg>
        </button>
      )}

      {/* Reverse-engineered pipeline */}
      {leadsPerMonth > 0 && (
        <div className="flex items-center gap-1 text-[11px] font-sans text-text-muted mb-4 flex-wrap leading-relaxed">
          <span className="font-semibold text-text-secondary tabular-nums">{Math.ceil(leadsPerMonth).toLocaleString()} leads</span>
          <span>→</span>
          <span className="font-semibold text-text-secondary tabular-nums">{Math.ceil(contractsPerMonth).toLocaleString()} contracts</span>
          <span>→</span>
          <span className="font-semibold text-brand tabular-nums">{fmtCompact(revenueGoal)}</span>
          <span className="text-text-muted text-[10px] ml-0.5">
            ({formatPercent(closeRatePct)} close · {fmtCompact(avgDeal)} avg deal)
          </span>
        </div>
      )}

      {/* Progress rows */}
      <div className="border-t border-surface-border pt-4 flex flex-col gap-3 mt-auto">
        {months > 1 && (
          <p className="text-[10px] text-text-muted font-sans -mt-1 mb-1">Progress · target × {months} months</p>
        )}
        {rows.map(({ label, curr, target, isMoney }) => {
          const pct = target > 0 ? Math.min(100, (curr / target) * 100) : 0;
          return (
            <div key={label}>
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-[10px] uppercase tracking-widest text-text-muted font-sans">{label}</span>
                <span className="text-[11px] font-sans text-text-secondary tabular-nums">
                  {isMoney ? fmtCompact(curr) : formatNumber(Math.round(curr))}
                  <span className="text-text-muted"> / {isMoney ? fmtCompact(target) : formatNumber(Math.round(target))}</span>
                  <span className={`ml-1.5 text-[10px] font-medium ${pct >= 70 ? "text-green-600" : "text-text-muted"}`}>{pct.toFixed(0)}%</span>
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-surface-muted overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-700 ${progColor(pct)}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
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
  const [period, setPeriod]   = useState<Period>("mtd");
  const [sortKey, setSortKey] = useState<SortKey>("value");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Goal targets — stored in localStorage, editable inline
  const [goalPaidRev,   setGoalPaidRev]   = useGoal("gw_goal_paid_rev",   1_000_000);
  const [goalOrgRev,    setGoalOrgRev]    = useGoal("gw_goal_org_rev",    1_200_000);
  const [goalAnnual,    setGoalAnnual]    = useGoal("gw_goal_annual",    25_000_000);

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
  const paidRows      = useMemo(() => CHANNEL_KEYS.flatMap((ch) => filtered[ch.key]      ?? []), [filtered]);
  const priorPaidRows = useMemo(() => CHANNEL_KEYS.flatMap((ch) => priorFiltered[ch.key] ?? []), [priorFiltered]);
  const organicRows   = useMemo(
    () => Object.entries(filtered).filter(([k]) => !PAID_SOURCES.has(k as Source)).flatMap(([, r]) => r),
    [filtered]
  );

  // YTD 2026 baseline — used to derive close rates & avg deal sizes for goal math
  const baseline = useMemo(() => {
    const yr = new Date().getFullYear();
    const paid: SourceRow[] = [], org: SourceRow[] = [];
    for (const [k, rows] of Object.entries(allData)) {
      const ytd = rows.filter(r => { const d = parsePeriodDate(r.period); return d && d.getFullYear() === yr; });
      (PAID_SOURCES.has(k as Source) ? paid : org).push(...ytd);
    }
    const pContracts = paid.reduce((s, r) => s + r.closed, 0);
    const pLeads     = paid.reduce((s, r) => s + r.leads, 0);
    const pValue     = paid.reduce((s, r) => s + r.contractValue, 0);
    const oContracts = org.reduce((s, r) => s + r.closed, 0);
    const oLeads     = org.reduce((s, r) => s + r.leads, 0);
    const oValue     = org.reduce((s, r) => s + r.contractValue, 0);
    const allContracts = pContracts + oContracts;
    const allValue     = pValue + oValue;
    const moElapsed    = new Date().getMonth() + 1; // Jan=1
    return {
      paidCloseRate:  pLeads     > 0 ? pContracts / pLeads     : 0,
      orgCloseRate:   oLeads     > 0 ? oContracts / oLeads     : 0,
      paidAvgDeal:    pContracts > 0 ? pValue     / pContracts : 0,
      orgAvgDeal:     oContracts > 0 ? oValue     / oContracts : 0,
      blendedAvgDeal: allContracts > 0 ? allValue / allContracts : 0,
      ytdValue: allValue,
      moElapsed,
    };
  }, [allData]);

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

  // Current period paid/organic value split (for goal progress)
  const paidValue = paidRows.reduce((s, r) => s + r.contractValue, 0);
  const orgLeads  = organicRows.reduce((s, r) => s + r.leads, 0);
  const orgContracts = organicRows.reduce((s, r) => s + r.closed, 0);
  const orgValue     = organicRows.reduce((s, r) => s + r.contractValue, 0);

  // Reverse-engineer monthly lead/contract targets from revenue goals + YTD rates
  const paidAvgDeal = baseline.paidAvgDeal > 0 ? baseline.paidAvgDeal : baseline.blendedAvgDeal;
  const orgAvgDeal  = baseline.orgAvgDeal  > 0 ? baseline.orgAvgDeal  : baseline.blendedAvgDeal;
  const paidContractsPerMo = paidAvgDeal > 0 ? goalPaidRev / paidAvgDeal : 0;
  const paidLeadsPerMo     = baseline.paidCloseRate > 0 ? paidContractsPerMo / baseline.paidCloseRate : 0;
  const orgContractsPerMo  = orgAvgDeal  > 0 ? goalOrgRev  / orgAvgDeal  : 0;
  const orgLeadsPerMo      = baseline.orgCloseRate  > 0 ? orgContractsPerMo  / baseline.orgCloseRate  : 0;

  // Annual run rate from YTD contract value
  const monthlyRunRate = baseline.moElapsed > 0 ? baseline.ytdValue / baseline.moElapsed : 0;
  const annualPace     = monthlyRunRate * 12;

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
      <div className="flex items-baseline justify-between mb-3">
        <p className="text-text-muted text-[10px] uppercase tracking-widest font-sans">Goals</p>
        {(baseline.paidCloseRate > 0 || baseline.orgCloseRate > 0) && (
          <p className="text-text-muted text-[10px] font-sans">
            YTD data · paid close {formatPercent(baseline.paidCloseRate * 100)} · organic close {formatPercent(baseline.orgCloseRate * 100)} · blended avg deal {fmtCompact(baseline.blendedAvgDeal)}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <GoalTrack
          trackLabel="Paid ads"
          color="#EA6B2A"
          months={months}
          revenueGoal={goalPaidRev}
          onChangeRevenue={setGoalPaidRev}
          leadsPerMonth={paidLeadsPerMo}
          contractsPerMonth={paidContractsPerMo}
          currLeads={paidLeads}
          currContracts={paidContracts}
          currValue={paidValue}
          closeRatePct={baseline.paidCloseRate * 100}
          avgDeal={paidAvgDeal}
        />
        <GoalTrack
          trackLabel="Organic & other"
          color="#34d399"
          months={months}
          revenueGoal={goalOrgRev}
          onChangeRevenue={setGoalOrgRev}
          leadsPerMonth={orgLeadsPerMo}
          contractsPerMonth={orgContractsPerMo}
          currLeads={orgLeads}
          currContracts={orgContracts}
          currValue={orgValue}
          closeRatePct={baseline.orgCloseRate * 100}
          avgDeal={orgAvgDeal}
        />
      </div>

      {/* Annual pace */}
      <div className="bg-surface-card border border-surface-border rounded-2xl p-5 mb-8">
        <div className="flex items-start justify-between mb-1">
          <p className="text-text-muted text-[10px] uppercase tracking-widest font-sans">Annual revenue</p>
          <button
            onClick={() => {
              const raw = window.prompt("Annual revenue goal (e.g. 25000000 or 25M):", goalAnnual.toString());
              if (raw) {
                const cleaned = raw.replace(/[$,\s]/g, "");
                const v = cleaned.endsWith("M") || cleaned.endsWith("m") ? parseFloat(cleaned) * 1_000_000 : parseFloat(cleaned);
                if (!isNaN(v) && v > 0) setGoalAnnual(v);
              }
            }}
            className="text-text-muted hover:text-brand transition-colors"
            title="Edit annual target"
          >
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
              <path d="M8.5 1.5l2 2-7 7H1.5v-2l7-7z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <div className="flex items-baseline gap-4 mb-4 flex-wrap">
          <div>
            <p className="text-3xl font-bold text-brand tabular-nums font-sans">{fmtCompact(annualPace)}<span className="text-text-muted text-base font-normal">/yr pace</span></p>
            <p className="text-text-muted text-[11px] font-sans mt-1">
              {fmtCompact(monthlyRunRate)}/mo run rate · {baseline.moElapsed} months of YTD data
            </p>
          </div>
          <div className="border-l border-surface-border pl-4">
            <p className="text-sm font-medium font-sans tabular-nums" style={{
              color: annualPace >= goalAnnual ? "#22c55e" : annualPace >= goalAnnual * 0.7 ? "#EA6B2A" : "#ef4444"
            }}>
              {annualPace >= goalAnnual
                ? `↑ ${fmtCompact(annualPace - goalAnnual)} ahead`
                : `↓ ${fmtCompact(goalAnnual - annualPace)} behind`}
            </p>
            <p className="text-text-muted text-[11px] font-sans">vs {fmtCompact(goalAnnual)} target</p>
          </div>
        </div>
        <div className="h-2 rounded-full bg-surface-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${progColor(annualPace / goalAnnual * 100)}`}
            style={{ width: `${Math.min(100, (annualPace / goalAnnual) * 100)}%` }}
          />
        </div>
        <p className="text-text-muted text-[10px] font-sans mt-2">
          {((annualPace / goalAnnual) * 100).toFixed(0)}% of {fmtCompact(goalAnnual)} annual goal · needs {fmtCompact(goalAnnual / 12)}/mo to hit
        </p>
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
