"use client";

import { formatCompact } from "@/lib/utils";
import { SocialPlatform } from "@/types";
import { PlatformIcon, PLATFORM_COLORS } from "./PlatformIcon";

interface VideoCardProps {
  platform: SocialPlatform;
  title: string;
  url: string;
  views: number;
  likes: number;
  comments: number;
  type?: string;
  datePosted?: string;
  thumbnailUrl?: string;
  topPerformer?: boolean;
  notes?: string;
}

export function VideoCard({
  platform,
  title,
  url,
  views,
  likes,
  comments,
  type,
  datePosted,
  thumbnailUrl,
  topPerformer,
  notes,
}: VideoCardProps) {
  const color = PLATFORM_COLORS[platform];

  return (
    <div
      className={`relative bg-surface-card border rounded-2xl overflow-hidden flex flex-col transition-all hover:border-opacity-60 ${
        topPerformer ? "border-brand/40" : "border-surface-border"
      }`}
    >
      {/* Thumbnail / placeholder */}
      <div className="relative aspect-video bg-surface-muted overflow-hidden flex-shrink-0">
        {thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnailUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <PlatformIcon platform={platform} size={32} className="opacity-20" style={{ color }} />
          </div>
        )}

        {/* Platform badge */}
        <div
          className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-lg text-white text-[10px] font-sans font-medium"
          style={{ background: `${color}CC` }}
        >
          <PlatformIcon platform={platform} size={11} />
          {type && <span>{type}</span>}
        </div>

        {/* Top performer badge */}
        {topPerformer && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-brand px-2 py-1 rounded-lg text-white text-[10px] font-sans font-medium">
            <svg width="9" height="9" viewBox="0 0 16 16" fill="none">
              <path d="M9 1L4 9h5l-2 6 7-8H9l2-6z" fill="white" />
            </svg>
            Top
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        <p className="text-text-primary text-sm font-medium font-sans leading-snug line-clamp-2">
          {title}
        </p>

        {/* Stats row */}
        <div className="flex items-center gap-4 text-xs font-sans text-text-muted">
          <span className="flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <path d="M1 8C1 8 4 3 8 3s7 5 7 5-3 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.4" />
              <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.4" />
            </svg>
            {formatCompact(views)}
          </span>
          <span className="flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <path d="M8 2l1.5 3 3.5.5-2.5 2.5.5 3.5L8 10l-3 1.5.5-3.5L3 5.5l3.5-.5z" stroke="currentColor" strokeWidth="1.3" />
            </svg>
            {formatCompact(likes)}
          </span>
          <span className="flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <path d="M2 2h12v9H9l-3 3v-3H2z" stroke="currentColor" strokeWidth="1.3" />
            </svg>
            {formatCompact(comments)}
          </span>
          {datePosted && (
            <span className="ml-auto text-text-muted">{datePosted}</span>
          )}
        </div>

        {notes && (
          <p className="text-text-muted text-[11px] font-sans italic leading-snug">
            {notes}
          </p>
        )}

        {/* Link */}
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-auto text-xs font-sans text-text-muted hover:text-brand transition-colors flex items-center gap-1"
          >
            View post
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
              <path d="M2 10L10 2M10 2H5M10 2v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </a>
        )}
      </div>
    </div>
  );
}
