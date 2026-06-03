import { getSocialStats, getSocialVideos } from "@/lib/google-sheets";
import {
  getYouTubeChannelStats,
  getRecentYouTubeVideos,
  getTopYouTubeVideos,
} from "@/lib/youtube";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatCard } from "@/components/ui/StatCard";
import { VideoCard } from "@/components/social/VideoCard";
import { SocialStatsChart } from "@/components/social/SocialStatsChart";
import { PlatformIcon, PLATFORM_COLORS } from "@/components/social/PlatformIcon";
import { SOCIAL_PLATFORMS, SocialPlatform, SocialStatRow, SocialVideoRow } from "@/types";
import { formatCompact, formatDate } from "@/lib/utils";

export const revalidate = 3600; // 1 hour — social data changes slowly

// ─── Helpers ─────────────────────────────────────────────────────────────────

function latestStat(
  rows: SocialStatRow[],
  platform: SocialPlatform,
  type: "Monthly" | "Weekly"
): SocialStatRow | undefined {
  return rows
    .filter((r) => r.platform === platform && r.periodType === type)
    .at(-1); // last row = most recent period
}

function sumField(
  rows: SocialStatRow[],
  platform: SocialPlatform,
  type: "Monthly" | "Weekly",
  field: keyof Pick<SocialStatRow, "views" | "postsPublished" | "newFollowers">
): number {
  return rows
    .filter((r) => r.platform === platform && r.periodType === type)
    .reduce((s, r) => s + r[field], 0);
}

// ─── Platform section ─────────────────────────────────────────────────────────

function EmptyState({ platform }: { platform: SocialPlatform }) {
  return (
    <div className="bg-surface-card border border-surface-border rounded-2xl p-10 text-center">
      <p className="text-text-muted text-sm">
        No data yet for {platform}. Add rows to the{" "}
        <span className="text-text-secondary font-medium">📱 Social Stats</span> and{" "}
        <span className="text-text-secondary font-medium">📱 Social Videos</span> tabs in
        the tracker.
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SocialPage() {
  // Fetch sheet data and YouTube API data in parallel
  const [statsRows, videoRows, ytChannel, ytRecent, ytTop] = await Promise.all([
    getSocialStats(),
    getSocialVideos(),
    getYouTubeChannelStats(),
    getRecentYouTubeVideos(6),
    getTopYouTubeVideos(6),
  ]);

  // YouTube API enabled?
  const ytEnabled = !!(process.env.YOUTUBE_API_KEY && process.env.YOUTUBE_CHANNEL_ID);

  return (
    <div>
      <SectionHeader
        title="Social Media"
        subtitle="Instagram · Facebook · YouTube — content performance"
      />

      {SOCIAL_PLATFORMS.map((platform) => {
        const color = PLATFORM_COLORS[platform];

        // ── Stats from sheet ──
        const latestMonthly = latestStat(statsRows, platform, "Monthly");
        const latestWeekly  = latestStat(statsRows, platform, "Weekly");
        const hasSheetStats = !!latestMonthly || !!latestWeekly;

        // ── YouTube: prefer live API data ──
        const isYT = platform === "YouTube";
        const ytFollowers = ytChannel?.subscriberCount ?? 0;

        const displayFollowers =
          isYT && ytEnabled
            ? ytFollowers
            : latestMonthly?.totalFollowers ?? 0;

        const displayMonthlyViews =
          isYT && ytEnabled
            ? null // YouTube totals all-time, not monthly — use sheet
            : latestMonthly?.views ?? null;

        const displayMonthlyPosts =
          isYT && ytEnabled
            ? null
            : latestMonthly?.postsPublished ?? null;

        // ── Videos ──
        const sheetVideos = videoRows.filter((v) => v.platform === platform);
        const topSheetVideos  = sheetVideos.filter((v) => v.topPerformer);
        const recentSheetVideos = [...sheetVideos]
          .sort((a, b) => {
            // Try date sort; fall back to original order
            const da = new Date(a.datePosted).getTime();
            const db = new Date(b.datePosted).getTime();
            return isNaN(db - da) ? 0 : db - da;
          })
          .slice(0, 6);

        // For YouTube, use live API data when available
        const ytTopVideos    = isYT && ytEnabled ? ytTop    : [];
        const ytRecentVideos = isYT && ytEnabled ? ytRecent : [];

        const hasAnyData =
          hasSheetStats ||
          sheetVideos.length > 0 ||
          (isYT && ytEnabled);

        // Chart data (monthly stats from sheet)
        const chartData = statsRows
          .filter((r) => r.platform === platform && r.periodType === "Monthly")
          .map((r) => ({
            period:    r.period,
            views:     r.views,
            followers: r.newFollowers,
            posts:     r.postsPublished,
          }));

        return (
          <section key={platform} className="mb-14">
            {/* Platform header */}
            <div className="flex items-center gap-3 mb-5">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${color}22`, border: `1px solid ${color}44` }}
              >
                <PlatformIcon platform={platform} size={18} style={{ color }} />
              </div>
              <div>
                <h2 className="text-text-primary text-base font-medium font-sans">
                  {platform}
                </h2>
                {isYT && ytEnabled && ytChannel && (
                  <p className="text-text-muted text-xs font-sans">
                    {formatCompact(ytChannel.subscriberCount)} subscribers ·{" "}
                    {formatCompact(ytChannel.videoCount)} videos total
                  </p>
                )}
                {!isYT && displayFollowers > 0 && (
                  <p className="text-text-muted text-xs font-sans">
                    {formatCompact(displayFollowers)} followers
                  </p>
                )}
              </div>
              <div
                className="ml-auto h-px flex-1 opacity-20"
                style={{ background: color }}
              />
            </div>

            {!hasAnyData ? (
              <EmptyState platform={platform} />
            ) : (
              <>
                {/* ── Stat cards ── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <StatCard
                    label="Followers"
                    value={displayFollowers > 0 ? formatCompact(displayFollowers) : "—"}
                    sub={isYT && ytEnabled ? "Live from YouTube" : latestMonthly?.period ?? ""}
                  />
                  <StatCard
                    label="Views This Month"
                    value={
                      displayMonthlyViews !== null && displayMonthlyViews > 0
                        ? formatCompact(displayMonthlyViews)
                        : "—"
                    }
                    sub={latestMonthly?.period ?? ""}
                    highlight
                  />
                  <StatCard
                    label="Posts This Month"
                    value={
                      displayMonthlyPosts !== null && displayMonthlyPosts > 0
                        ? String(displayMonthlyPosts)
                        : "—"
                    }
                    sub={latestMonthly?.period ?? ""}
                  />
                  <StatCard
                    label="Views This Week"
                    value={
                      latestWeekly?.views && latestWeekly.views > 0
                        ? formatCompact(latestWeekly.views)
                        : "—"
                    }
                    sub={latestWeekly?.period ?? "No weekly data"}
                  />
                </div>

                {/* ── Chart (sheet data) ── */}
                {chartData.length > 1 && (
                  <div className="mb-6">
                    <SocialStatsChart
                      data={chartData}
                      color={color}
                      platformName={platform}
                    />
                  </div>
                )}

                {/* ── Top Performers ── */}
                {(topSheetVideos.length > 0 || ytTopVideos.length > 0) && (
                  <div className="mb-6">
                    <p className="text-text-primary text-sm font-medium mb-3 flex items-center gap-2">
                      <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                        <path d="M9 1L4 9h5l-2 6 7-8H9l2-6z" fill="#EA6B2A" />
                      </svg>
                      Top Performers
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {isYT && ytEnabled
                        ? ytTopVideos.map((v) => (
                            <VideoCard
                              key={v.id}
                              platform="YouTube"
                              title={v.title}
                              url={v.url}
                              views={v.viewCount}
                              likes={v.likeCount}
                              comments={v.commentCount}
                              type="Video"
                              datePosted={formatDate(v.publishedAt)}
                              thumbnailUrl={v.thumbnailUrl}
                            />
                          ))
                        : topSheetVideos.map((v, i) => (
                            <VideoCard
                              key={i}
                              platform={v.platform}
                              title={v.title}
                              url={v.url}
                              views={v.views}
                              likes={v.likes}
                              comments={v.comments}
                              type={v.type}
                              datePosted={v.datePosted}
                              topPerformer
                              notes={v.notes}
                            />
                          ))}
                    </div>
                  </div>
                )}

                {/* ── Recent Posts ── */}
                {(recentSheetVideos.length > 0 || ytRecentVideos.length > 0) && (
                  <div>
                    <p className="text-text-primary text-sm font-medium mb-3">
                      Recent Posts
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {isYT && ytEnabled
                        ? ytRecentVideos.map((v) => (
                            <VideoCard
                              key={v.id}
                              platform="YouTube"
                              title={v.title}
                              url={v.url}
                              views={v.viewCount}
                              likes={v.likeCount}
                              comments={v.commentCount}
                              type="Video"
                              datePosted={formatDate(v.publishedAt)}
                              thumbnailUrl={v.thumbnailUrl}
                            />
                          ))
                        : recentSheetVideos.map((v, i) => (
                            <VideoCard
                              key={i}
                              platform={v.platform}
                              title={v.title}
                              url={v.url}
                              views={v.views}
                              likes={v.likes}
                              comments={v.comments}
                              type={v.type}
                              datePosted={v.datePosted}
                              topPerformer={v.topPerformer}
                              notes={v.notes}
                            />
                          ))}
                    </div>
                  </div>
                )}

                {/* No video data yet */}
                {sheetVideos.length === 0 && !ytEnabled && (
                  <div className="bg-surface-muted border border-surface-border rounded-xl p-6 text-center">
                    <p className="text-text-muted text-xs font-sans">
                      No videos yet. Add rows to the{" "}
                      <span className="text-text-secondary">📱 Social Videos</span> tab.
                    </p>
                  </div>
                )}
              </>
            )}
          </section>
        );
      })}

      {/* Coming soon chips */}
      <div className="border-t border-surface-border pt-6">
        <p className="text-text-muted text-xs font-sans mb-3 uppercase tracking-widest">
          Coming soon
        </p>
        <div className="flex gap-3">
          {["TikTok", "LinkedIn"].map((p) => (
            <div
              key={p}
              className="px-3 py-1.5 rounded-lg border border-surface-border text-text-muted text-xs font-sans"
            >
              {p}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
