/**
 * YouTube Data API v3 — public channel data (no OAuth required)
 * Set YOUTUBE_API_KEY and YOUTUBE_CHANNEL_ID in your env to enable live pulls.
 * Falls back to empty data if not configured.
 */

export interface YouTubeChannelStats {
  subscriberCount: number;
  totalViews: number;
  videoCount: number;
}

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  publishedAt: string;       // ISO date string
  thumbnailUrl: string;
  url: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
}

const BASE = "https://www.googleapis.com/youtube/v3";

function enabled(): boolean {
  return !!(process.env.YOUTUBE_API_KEY && process.env.YOUTUBE_CHANNEL_ID);
}

export async function getYouTubeChannelStats(): Promise<YouTubeChannelStats | null> {
  if (!enabled()) return null;

  const url =
    `${BASE}/channels?part=statistics&id=${process.env.YOUTUBE_CHANNEL_ID}` +
    `&key=${process.env.YOUTUBE_API_KEY}`;

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } }); // cache 1 hr
    const data = await res.json();
    const stats = data.items?.[0]?.statistics;
    if (!stats) return null;
    return {
      subscriberCount: parseInt(stats.subscriberCount ?? "0", 10),
      totalViews:      parseInt(stats.viewCount      ?? "0", 10),
      videoCount:      parseInt(stats.videoCount     ?? "0", 10),
    };
  } catch {
    return null;
  }
}

async function fetchVideoStats(videoIds: string[]): Promise<Map<string, { views: number; likes: number; comments: number }>> {
  if (!videoIds.length || !enabled()) return new Map();

  const url =
    `${BASE}/videos?part=statistics&id=${videoIds.join(",")}&key=${process.env.YOUTUBE_API_KEY}`;

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    const data = await res.json();
    const map = new Map<string, { views: number; likes: number; comments: number }>();
    for (const item of data.items ?? []) {
      map.set(item.id, {
        views:    parseInt(item.statistics?.viewCount    ?? "0", 10),
        likes:    parseInt(item.statistics?.likeCount    ?? "0", 10),
        comments: parseInt(item.statistics?.commentCount ?? "0", 10),
      });
    }
    return map;
  } catch {
    return new Map();
  }
}

/** Most recent uploads (up to maxResults) */
export async function getRecentYouTubeVideos(maxResults = 8): Promise<YouTubeVideo[]> {
  if (!enabled()) return [];

  const searchUrl =
    `${BASE}/search?part=snippet&channelId=${process.env.YOUTUBE_CHANNEL_ID}` +
    `&order=date&maxResults=${maxResults}&type=video&key=${process.env.YOUTUBE_API_KEY}`;

  try {
    const res  = await fetch(searchUrl, { next: { revalidate: 3600 } });
    const data = await res.json();
    const items = data.items ?? [];
    const ids   = items.map((i: { id: { videoId: string } }) => i.id.videoId);
    const stats = await fetchVideoStats(ids);

    return items.map((item: {
      id: { videoId: string };
      snippet: {
        title: string;
        description: string;
        publishedAt: string;
        thumbnails: { high?: { url: string }; medium?: { url: string } };
      };
    }) => {
      const id = item.id.videoId;
      const s  = stats.get(id) ?? { views: 0, likes: 0, comments: 0 };
      return {
        id,
        title:        item.snippet.title,
        description:  item.snippet.description,
        publishedAt:  item.snippet.publishedAt,
        thumbnailUrl: item.snippet.thumbnails?.high?.url ?? item.snippet.thumbnails?.medium?.url ?? "",
        url:          `https://www.youtube.com/watch?v=${id}`,
        ...s,
      };
    });
  } catch {
    return [];
  }
}

/** Top videos by all-time view count */
export async function getTopYouTubeVideos(maxResults = 6): Promise<YouTubeVideo[]> {
  if (!enabled()) return [];

  const searchUrl =
    `${BASE}/search?part=snippet&channelId=${process.env.YOUTUBE_CHANNEL_ID}` +
    `&order=viewCount&maxResults=${maxResults}&type=video&key=${process.env.YOUTUBE_API_KEY}`;

  try {
    const res  = await fetch(searchUrl, { next: { revalidate: 3600 } });
    const data = await res.json();
    const items = data.items ?? [];
    const ids   = items.map((i: { id: { videoId: string } }) => i.id.videoId);
    const stats = await fetchVideoStats(ids);

    return items.map((item: {
      id: { videoId: string };
      snippet: {
        title: string;
        description: string;
        publishedAt: string;
        thumbnails: { high?: { url: string }; medium?: { url: string } };
      };
    }) => {
      const id = item.id.videoId;
      const s  = stats.get(id) ?? { views: 0, likes: 0, comments: 0 };
      return {
        id,
        title:        item.snippet.title,
        description:  item.snippet.description,
        publishedAt:  item.snippet.publishedAt,
        thumbnailUrl: item.snippet.thumbnails?.high?.url ?? item.snippet.thumbnails?.medium?.url ?? "",
        url:          `https://www.youtube.com/watch?v=${id}`,
        ...s,
      };
    });
  } catch {
    return [];
  }
}
