"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { DashboardRow } from "@/types";

interface Props {
  data: DashboardRow[];
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
        <p className="text-text-primary text-sm font-medium">{payload[0].value} leads</p>
      </div>
    );
  }
  return null;
};

export function LeadsBySourceChart({ data }: Props) {
  const chartData = data
    .filter((r) => r.leads > 0)
    .map((r) => ({ name: r.source.replace(/_/g, " "), leads: r.leads }))
    .sort((a, b) => b.leads - a.leads);

  return (
    <div className="bg-surface-card border border-surface-border rounded-2xl p-6">
      <p className="text-text-primary text-sm font-medium mb-5">Leads by Source</p>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
        >
          <CartesianGrid horizontal={false} stroke="#232323" />
          <XAxis
            type="number"
            tick={{ fill: "#666", fontSize: 11, fontFamily: "DM Sans" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={90}
            tick={{ fill: "#A3A3A3", fontSize: 11, fontFamily: "DM Sans" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(234,107,42,0.05)" }} />
          <Bar dataKey="leads" radius={[0, 6, 6, 0]}>
            {chartData.map((_, index) => (
              <Cell
                key={index}
                fill={index === 0 ? "#EA6B2A" : `rgba(234,107,42,${0.7 - index * 0.07})`}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
