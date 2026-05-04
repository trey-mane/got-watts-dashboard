import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
  className?: string;
}

export function StatCard({ label, value, sub, highlight, className }: StatCardProps) {
  return (
    <div
      className={cn(
        "bg-surface-card border border-surface-border rounded-2xl p-5 flex flex-col gap-1",
        highlight && "border-brand/30 bg-brand/5",
        className
      )}
    >
      <p className="text-text-muted text-xs uppercase tracking-widest font-sans">{label}</p>
      <p className={cn("text-2xl font-medium font-sans", highlight ? "text-brand" : "text-text-primary")}>
        {value}
      </p>
      {sub && <p className="text-text-muted text-xs font-sans">{sub}</p>}
    </div>
  );
}
