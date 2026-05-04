import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export function SectionHeader({ title, subtitle, className }: SectionHeaderProps) {
  return (
    <div className={cn("mb-6", className)}>
      <h1 className="text-text-primary text-xl font-medium font-sans">{title}</h1>
      {subtitle && <p className="text-text-secondary text-sm font-sans mt-0.5">{subtitle}</p>}
    </div>
  );
}
