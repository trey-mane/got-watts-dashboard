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
import { formatCurrency } from "@/lib/utils";

interface RevenueDataPoint {
  period: string;
  "Contract Value": number;
  "Install Revenue": number;
}

interface Props {
  data: RevenueDataPoint[];
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
            <span className="text-text-primary font-medium">
              {formatCurrency(p.value)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function TrendsRevenueChart({ data }: Props) {
  return (
    <div className="bg-surface-card border border-surface-border rounded-2xl p-6">
      <p className="text-text-primary text-sm font-medium mb-1">
        Contract Value vs Install Revenue — All Sources
      </p>
      <p className="text-text-muted text-xs mb-5">
        Orange = signed bookings (leading) · White dashed = installations completed (lagging)
      </p>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid stroke="#E5E3DF" />
          <XAxis
            dataKey="period"
            tick={{ fill: "#666", fontSize: 11, fontFamily: "DM Sans" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v) => formatCurrency(v)}
            tick={{ fill: "#666", fontSize: 11, fontFamily: "DM Sans" }}
            axisLine={false}
            tickLine={false}
            width={72}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{
              fontSize: "11px",
              fontFamily: "DM Sans",
              color: "#6B6B6B",
            }}
          />
          <Line
            type="monotone"
            dataKey="Contract Value"
            stroke="#EA6B2A"
            strokeWidth={3}
            dot={<Dot r={3} fill="#EA6B2A" strokeWidth={0} />}
            activeDot={{ r: 5, fill: "#EA6B2A", strokeWidth: 0 }}
          />
          <Line
            type="monotone"
            dataKey="Install Revenue"
            stroke="#FFFFFF"
            strokeWidth={2}
            strokeDasharray="6 4"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0, fill: "#FFFFFF" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
