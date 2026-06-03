import { CSSProperties } from "react";
import { SocialPlatform } from "@/types";

interface Props {
  platform: SocialPlatform;
  size?: number;
  className?: string;
  style?: CSSProperties;
}

export function PlatformIcon({ platform, size = 20, className = "", style }: Props) {
  if (platform === "Instagram") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
        <rect x="2" y="2" width="20" height="20" rx="6" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
      </svg>
    );
  }
  if (platform === "Facebook") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
        <rect x="2" y="2" width="20" height="20" rx="6" stroke="currentColor" strokeWidth="1.8" />
        <path
          d="M13.5 8H15V5.5H13C11.343 5.5 10 6.843 10 8.5V10H8V13H10V19H13V13H15L15.5 10H13V8.5C13 8.224 13.224 8 13.5 8Z"
          fill="currentColor"
        />
      </svg>
    );
  }
  // YouTube
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
      <rect x="2" y="5" width="20" height="14" rx="4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M10 9.5L15 12L10 14.5V9.5Z" fill="currentColor" />
    </svg>
  );
}

export const PLATFORM_COLORS: Record<SocialPlatform, string> = {
  Instagram: "#E1306C",
  Facebook:  "#1877F2",
  YouTube:   "#FF0000",
};
