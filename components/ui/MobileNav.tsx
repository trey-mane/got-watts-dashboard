"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ALL_SOURCES, SOURCE_LABELS, Source } from "@/types";

const mainNav = [
  { href: "/overview", label: "Overview" },
  { href: "/trends", label: "Trends" },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="lg:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 text-text-secondary hover:text-text-primary rounded-lg hover:bg-surface-muted transition-colors"
        aria-label="Open navigation"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M2 4h14M2 9h14M2 14h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-64 bg-surface-card border-r border-surface-border z-50 flex flex-col">
            <div className="flex items-center justify-between px-5 py-5 border-b border-surface-border">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-brand flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M9 1L4 9h5l-2 6 7-8H9l2-6z" fill="white" />
                  </svg>
                </div>
                <span className="text-text-primary text-sm font-medium">Got Watts</span>
              </div>
              <button onClick={() => setOpen(false)} className="text-text-muted hover:text-text-primary">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
              {mainNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "px-3 py-2 rounded-lg text-sm font-sans transition-colors",
                    pathname === item.href
                      ? "bg-brand/10 text-brand"
                      : "text-text-secondary hover:text-text-primary hover:bg-surface-muted"
                  )}
                >
                  {item.label}
                </Link>
              ))}

              <div className="mt-4 mb-1 px-3">
                <p className="text-text-muted text-[10px] uppercase tracking-widest">Sources</p>
              </div>
              {ALL_SOURCES.map((source) => {
                const href = `/source/${source}`;
                return (
                  <Link
                    key={source}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "px-3 py-2 rounded-lg text-sm font-sans transition-colors",
                      pathname === href
                        ? "bg-brand/10 text-brand"
                        : "text-text-secondary hover:text-text-primary hover:bg-surface-muted"
                    )}
                  >
                    {SOURCE_LABELS[source as Source]}
                  </Link>
                );
              })}
            </nav>
          </div>
        </>
      )}
    </div>
  );
}
