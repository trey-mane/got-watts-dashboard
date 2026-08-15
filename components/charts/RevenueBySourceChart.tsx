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
  Legend,
} from "recharts";
import { DashboardRow } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface Props {
  data: DashboardRow[];
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

export function RevenueBySourceChart({ data }: Props) {
  const chartData = data
    .filter((r) => r.contractValue > 0 || r.grossSales > 0)
    .map((r) => ({
      name: r.source.replace(/_/g, " "),
      "Contract Value": r.contractValue,
      "Install Revenue": r.grossSales,
    }))
    .sort((a, b) => b["Contract Value"] - a["Contract Value"]);

  return (
    <div className="bg-surface-card border border-surface-border rounded-2xl p-6">
      <p className="text-text-primary text-sm font-medium mb-1">
        Revenue by Source
      </p>
      <p className="text-text-muted text-xs mb-5">
        Contract value (bookings) vs install revenue
      </p>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
          barCategoryGap="30%"
          barGap={3}
        >
          <CartesianGrid horizontal={false} stroke="#E5E3DF" />
          <XAxis
            type="number"
            tickFormatter={(v) => formatCurrency(v)}
            tick={{ fill: "#666", fontSize: 11, fontFamily: "DM Sans" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={90}
            tick={{ fill: "#6B6B6B", fontSize: 11, fontFamily: "DM Sans" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "rgba(234,107,42,0.05)" }}
          />
          <Legend
            wrapperStyle={{
              fontSize: "11px",
              fontFamily: "DM Sans",
              color: "#6B6B6B",
            }}
          />
          <Bar dataKey="Contract Value" radius={[0, 4, 4, 0]}>
            {chartData.map((_, i) => (
              <Cell
                key={i}
                fill={
                  i === 0
                    ? "#EA6B2A"
                    : `rgba(234,107,42,${Math.max(0.25, 0.75 - i * 0.1)})`
                }
              />
            ))}
          </Bar>
          <Bar dataKey="Install Revenue" radius={[0, 4, 4, 0]}>
            {chartData.map((_, i) => (
              <Cell
                key={i}
                fill={`rgba(255,255,255,${Math.max(0.1, 0.3 - i * 0.04)})`}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
