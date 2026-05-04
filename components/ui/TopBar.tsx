"use client";

import { Session } from "next-auth";
import { signOut } from "next-auth/react";
import { MobileNav } from "./MobileNav";

interface TopBarProps {
  session: Session;
}

export function TopBar({ session }: TopBarProps) {
  const firstName = (session.user as { firstName?: string })?.firstName ?? session.user?.name ?? "there";

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-surface-border bg-surface-card flex-shrink-0">
      <div className="flex items-center gap-3">
        <MobileNav />
        <div className="hidden sm:block">
          <p className="text-text-secondary text-sm font-sans">
            Good to see you, <span className="text-text-primary font-medium">{firstName}</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 bg-surface-muted border border-surface-border rounded-lg px-3 py-1.5">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-text-secondary text-xs font-sans">Live data</span>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-text-muted hover:text-text-primary text-xs font-sans transition-colors px-3 py-1.5 rounded-lg hover:bg-surface-muted"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
