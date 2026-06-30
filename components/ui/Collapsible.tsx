"use client";

import { useState } from "react";

interface Props {
  label: string;
  accentOpacity?: string; // tailwind opacity suffix e.g. "40" or "20"
  children: React.ReactNode;
}

export function Collapsible({ label, accentOpacity = "40", children }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 mb-3 group"
        aria-expanded={open}
      >
        <span
          className="h-3.5 w-0.5 rounded-full flex-shrink-0 transition-opacity"
          style={{ background: `rgba(234,107,42,${parseInt(accentOpacity) / 100})` }}
        />
        <span className="text-text-muted text-[10px] uppercase tracking-widest font-sans group-hover:text-text-secondary transition-colors">
          {label}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          className={`text-text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <path
            d="M2 4l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && <div>{children}</div>}
    </div>
  );
}
