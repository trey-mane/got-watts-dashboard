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
} from "recharts";
import { formatCompact } from "@/lib/utils";

interface DataPoint {
  period: string;
  views: number;
  followers: number;
  posts: number;
}

interface Props {
  data: DataPoint[];
  color: string;
  platformName: string;
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
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-text-secondary">{p.name}:</span>
            <span className="text-text-primary font-medium">
              {formatCompact(p.value)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function SocialStatsChart({ data, color, platformName }: Props) {
  if (!data.length) return null;

  // Normalise axis — views on left, follower growth on right would be messy.
  // Show views as main line, posts as secondary.
  return (
    <div className="bg-surface-card border border-surface-border rounded-2xl p-6">
      <p className="text-text-primary text-sm font-medium mb-5">
        {platformName} — Monthly Views &amp; Posts
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid stroke="#232323" />
          <XAxis
            dataKey="period"
            tick={{ fill: "#666", fontSize: 11, fontFamily: "DM Sans" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatCompact}
            tick={{ fill: "#666", fontSize: 11, fontFamily: "DM Sans" }}
            axisLine={false}
            tickLine={false}
            width={48}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: "11px", fontFamily: "DM Sans", color: "#A3A3A3" }}
          />
          <Line
            type="monotone"
            dataKey="views"
            name="Views"
            stroke={color}
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0, fill: color }}
          />
          <Line
            type="monotone"
            dataKey="followers"
            name="New Followers"
            stroke="#FFFFFF"
            strokeWidth={1.5}
            strokeDasharray="5 3"
            dot={false}
            activeDot={{ r: 3, strokeWidth: 0, fill: "#FFF" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
