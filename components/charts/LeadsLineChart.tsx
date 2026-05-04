"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Dot,
} from "recharts";
import { SourceRow } from "@/types";

interface Props {
  data: SourceRow[];
}

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) => {
  if (active && payload?.length) {
    return (
      <div className="bg-surface-card border border-surface-border rounded-xl px-4 py-3 shadow-xl">
        <p className="text-text-secondary text-xs mb-1">{label}</p>
        <p className="text-brand text-sm font-medium">{payload[0].value} leads</p>
      </div>
    );
  }
  return null;
};

export function LeadsLineChart({ data }: Props) {
  return (
    <div className="bg-surface-card border border-surface-border rounded-2xl p-6">
      <p className="text-text-primary text-sm font-medium mb-5">Leads Over Time</p>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid stroke="#232323" />
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
          <Line
            type="monotone"
            dataKey="leads"
            stroke="#EA6B2A"
            strokeWidth={2}
            dot={<Dot r={3} fill="#EA6B2A" strokeWidth={0} />}
            activeDot={{ r: 5, fill: "#EA6B2A", strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
