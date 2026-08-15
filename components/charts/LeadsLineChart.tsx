"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Dot,
} from "recharts";
import { SourceRow } from "@/types";

interface Props {
  data: SourceRow[];
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) => {
  if (active && payload?.length) {
    return (
      <div className="bg-surface-card border border-surface-border rounded-xl px-4 py-3 shadow-xl">
        <p className="text-text-secondary text-xs mb-2">{label}</p>
        {payload.map((p) => (
          <div key={p.name} className="flex items-center gap-2 text-xs">
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: p.color }}
            />
            <span className="text-text-secondary">{p.name}:</span>
            <span className="text-text-primary font-medium">{p.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function LeadsLineChart({ data }: Props) {
  const hasInstalls = data.some((r) => r.installs > 0);
  const hasClosed   = data.some((r) => r.closed > 0);

  const chartData = data.map((r) => ({
    period: r.period,
    Leads: r.leads,
    ...(hasClosed   ? { "Contracts Signed":   r.closed }   : {}),
    ...(hasInstalls ? { "Projects Installed": r.installs } : {}),
  }));

  return (
    <div className="bg-surface-card border border-surface-border rounded-2xl p-6">
      <p className="text-text-primary text-sm font-medium mb-1">
        Pipeline Activity
      </p>
      <p className="text-text-muted text-xs mb-5">
        Leads · Contracts signed · Projects installed
      </p>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart
          data={chartData}
          margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
        >
          <CartesianGrid stroke="#E5E3DF" />
          <XAxis
            dataKey="period"
            tick={{ fill: "#666", fontSize: 11, fontFamily: "DM Sans" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#666", fontSize: 11, fontFamily: "DM Sans" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{
              fontSize: "11px",
              fontFamily: "DM Sans",
              color: "#6B6B6B",
            }}
          />
          {/* Leads — faint */}
          <Line
            type="monotone"
            dataKey="Leads"
            stroke="#666666"
            strokeWidth={1.5}
            strokeDasharray="4 3"
            dot={false}
            activeDot={{ r: 3, strokeWidth: 0, fill: "#666" }}
          />
          {/* Contracts Signed — brand orange (leading indicator) */}
          {hasClosed && (
            <Line
              type="monotone"
              dataKey="Contracts Signed"
              stroke="#EA6B2A"
              strokeWidth={2}
              dot={<Dot r={3} fill="#EA6B2A" strokeWidth={0} />}
              activeDot={{ r: 5, fill: "#EA6B2A", strokeWidth: 0 }}
            />
          )}
          {/* Projects Installed — white (lagging indicator) */}
          {hasInstalls && (
            <Line
              type="monotone"
              dataKey="Projects Installed"
              stroke="#FFFFFF"
              strokeWidth={2}
              dot={<Dot r={3} fill="#FFFFFF" strokeWidth={0} />}
              activeDot={{ r: 5, fill: "#FFFFFF", strokeWidth: 0 }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
