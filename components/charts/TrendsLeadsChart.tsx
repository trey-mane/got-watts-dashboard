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

interface TrendsDataPoint {
  period: string;
  [source: string]: string | number;
}

interface Props {
  data: TrendsDataPoint[];
  sources: string[];
}

const COLORS = [
  "#EA6B2A",
  "#F08A52",
  "#C75520",
  "#FBBF8A",
  "#7C3B13",
  "#E8A87C",
  "#D4622A",
  "#A8441A",
];

const CustomTooltip = ({ active, payload, label }: {
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
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-text-secondary">{p.name.replace(/_/g, " ")}:</span>
            <span className="text-text-primary font-medium">{p.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function TrendsLeadsChart({ data, sources }: Props) {
  return (
    <div className="bg-surface-card border border-surface-border rounded-2xl p-6">
      <p className="text-text-primary text-sm font-medium mb-5">Total Leads by Month (All Sources)</p>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
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
            wrapperStyle={{ fontSize: "11px", fontFamily: "DM Sans", color: "#6B6B6B" }}
            formatter={(value) => value.replace(/_/g, " ")}
          />
          {sources.map((source, i) => {
            const isTotal = source === "Total";
            const color = isTotal ? "#FFFFFF" : COLORS[(i - 1 + COLORS.length) % COLORS.length];
            return (
              <Line
                key={source}
                type="monotone"
                dataKey={source}
                stroke={color}
                strokeWidth={isTotal ? 3 : 1.5}
                strokeDasharray={isTotal ? undefined : "4 3"}
                dot={isTotal ? <Dot r={3} fill={color} strokeWidth={0} /> : false}
                activeDot={{ r: isTotal ? 5 : 3, strokeWidth: 0 }}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
