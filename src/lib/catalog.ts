import { format, formatDistanceToNow } from "date-fns";

export type VideoStatus = "ready" | "processing" | "failed";

export type Video = {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  durationSeconds: number;
  views: number;
  createdAt: string;
  uploader: string;
  gradient: [string, string];
  status: VideoStatus;
  streamtapeId?: string;
  source?: "upload";
};

export type Category = {
  slug: string;
  name: string;
};

export const CATEGORIES: Category[] = [];

export function getCategoryName(slug: string): string {
  return CATEGORIES.find((category) => category.slug === slug)?.name ?? "Uncategorized";
}

export function formatViews(views: number): string {
  if (views >= 1_000_000_000) return `${trim(views / 1_000_000_000)}B`;
  if (views >= 1_000_000) return `${trim(views / 1_000_000)}M`;
  if (views >= 1_000) return `${trim(views / 1_000)}K`;
  return String(views);
}

function trim(value: number): string {
  return value >= 10 ? Math.round(value).toString() : value.toFixed(1).replace(/\.0$/, "");
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

export function timeAgo(date: string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatDate(date: string): string {
  return format(new Date(date), "MMM d, yyyy");
}

export function buildHomeQuery(
  params: Record<string, string | number | undefined>,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "" || value === null) continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `/?${query}` : "/";
}
