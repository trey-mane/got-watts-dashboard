"use client";

import { useEffect, useState } from "react";

interface Props {
  quote: string;
}

export function WelcomeQuote({ quote }: Props) {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const key = "quote_shown";
    const alreadyShown = sessionStorage.getItem(key);
    if (alreadyShown) return;

    sessionStorage.setItem(key, "1");
    setVisible(true);

    const fadeTimer = setTimeout(() => setFading(true), 3500);
    const removeTimer = setTimeout(() => setVisible(false), 5000);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-surface"
      style={{
        opacity: fading ? 0 : 1,
        transition: "opacity 1.4s ease-out",
        pointerEvents: fading ? "none" : "all",
      }}
    >
      <div className="max-w-lg px-8 text-center">
        <div className="w-8 h-8 rounded-full bg-brand mx-auto mb-8 flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M9 1L4 9h5l-2 6 7-8H9l2-6z" fill="white" />
          </svg>
        </div>
        <p className="font-serif text-2xl md:text-3xl text-text-primary leading-relaxed">
          &ldquo;{quote}&rdquo;
        </p>
      </div>
    </div>
  );
}
