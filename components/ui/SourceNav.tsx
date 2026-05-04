"use client";

import Link from "next/link";
import { ALL_SOURCES, SOURCE_LABELS, Source } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  current: Source;
}

export function SourceNav({ current }: Props) {
  return (
    <div className="flex gap-1 overflow-x-auto pb-1 mb-6 scrollbar-none">
      {ALL_SOURCES.map((source) => (
        <Link
          key={source}
          href={`/source/${source}`}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-sans whitespace-nowrap transition-colors flex-shrink-0",
            source === current
              ? "bg-brand text-white"
              : "text-text-secondary hover:text-text-primary bg-surface-muted hover:bg-surface-border"
          )}
        >
          {SOURCE_LABELS[source]}
        </Link>
      ))}
    </div>
  );
}
