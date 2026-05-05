"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ALL_SOURCES, SOURCE_LABELS, Source } from "@/types";

const mainNav = [
  {
    href: "/overview",
    label: "Overview",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="1" width="6" height="6" rx="1.5" fill="currentColor" />
        <rect x="9" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.5" />
        <rect x="1" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.5" />
        <rect x="9" y="9" width="6" height="6" rx="1.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    href: "/trends",
    label: "Trends",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M1 12L5 7L8 10L12 4L15 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-56 bg-surface-card border-r border-surface-border flex-shrink-0">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-surface-border">
        <div className="w-7 h-7 rounded-full bg-brand flex items-center justify-center flex-shrink-0">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M9 1L4 9h5l-2 6 7-8H9l2-6z" fill="white" />
          </svg>
        </div>
        <div>
          <p className="text-text-primary text-sm font-medium leading-tight">Got Watts</p>
          <p className="text-text-muted text-xs leading-tight">Dashboard</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
        {/* Main nav */}
        {mainNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-sans transition-colors",
              pathname === item.href
                ? "bg-brand/10 text-brand"
                : "text-text-secondary hover:text-text-primary hover:bg-surface-muted"
            )}
          >
            <span className={pathname === item.href ? "text-brand" : "text-text-muted"}>
              {item.icon}
            </span>
            {item.label}
          </Link>
        ))}

        {/* Sources */}
        <div className="mt-4 mb-1 px-3">
          <p className="text-text-muted text-[10px] uppercase tracking-widest font-sans">Sources</p>
        </div>
        {ALL_SOURCES.map((source) => {
          const href = `/source/${source}`;
          const active = pathname === href;
          return (
            <Link
              key={source}
              href={href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-sans transition-colors",
                active
                  ? "bg-brand/10 text-brand"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-muted"
              )}
            >
              <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", active ? "bg-brand" : "bg-surface-border")} />
              {SOURCE_LABELS[source as Source]}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-surface-border">
        <p className="text-text-muted text-[10px] font-sans">Micheletti Media</p>
      </div>
    </aside>
  );
}
