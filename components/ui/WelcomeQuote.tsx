"use client";

import { useEffect, useState } from "react";

interface Props {
  quote: string;
}

export function WelcomeQuote({ quote }: Props) {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Start fading out after 3.5 seconds
    const fadeTimer = setTimeout(() => setFading(true), 3500);
    // Remove from DOM after fade completes
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
      }}
    >
      <div className="max-w-lg px-8 text-center">
        <div className="w-8 h-8 rounded-full bg-brand mx-auto mb-8 flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M9 1L4 9h5l-2 6 7-8H9l2-6z" fill="white" />
          </svg>
        </div>
        <p
          className="font-serif text-2xl md:text-3xl text-text-primary leading-relaxed"
          style={{
            opacity: fading ? 0 : 1,
            transition: "opacity 1.4s ease-out",
          }}
        >
          &ldquo;{quote}&rdquo;
        </p>
      </div>
    </div>
  );
}
