import "server-only";

import type { Video } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";
import type { VideoModel } from "../../prisma/generated/prisma/models";

export const VIDEOS_PER_PAGE = 12;

function toPublicVideo(record: VideoModel): Video {
  const tags = record.tags ?? [];

  return {
    id: record.streamtapeId,
    title: record.title,
    description: record.description ?? "",
    category: tags[0] ?? "uncategorized",
    tags,
    durationSeconds: 0,
    views: 0,
    createdAt: record.createdAt.toISOString(),
    uploader: "VideoApp Studio",
    gradient: ["#1e1b4b", "#7f1d1d"],
    status:
      record.status === "READY"
        ? "ready"
        : record.status === "FAILED"
          ? "failed"
          : "processing",
    streamtapeId: record.streamtapeId,
    source: "upload",
  };
}

export type PublicVideoFilters = {
  query?: string;
  tag?: string;
  page?: number;
};

// No view counter exists yet, so every listing is newest-first.
// shortcut: "most viewed" ordering, add a views column when needed.
export async function listPublicVideos(filters: PublicVideoFilters) {
  const search = filters.query?.trim() ?? "";
  const page = Math.max(filters.page ?? 1, 1);

  const where = {
    visibility: "PUBLIC" as const,
    ...(filters.tag ? { tags: { has: filters.tag } } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" as const } },
            { description: { contains: search, mode: "insensitive" as const } },
            { tags: { has: search.toLowerCase() } },
          ],
        }
      : {}),
  };

  const [total, records] = await Promise.all([
    prisma.video.count({ where }),
    prisma.video.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * VIDEOS_PER_PAGE,
      take: VIDEOS_PER_PAGE,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / VIDEOS_PER_PAGE));

  return {
    items: records.map(toPublicVideo),
    total,
    totalPages,
    page: Math.min(page, totalPages),
    perPage: VIDEOS_PER_PAGE,
  };
}

export async function getPublicVideo(id: string): Promise<Video | undefined> {
  const record = await prisma.video.findUnique({
    where: { streamtapeId: id },
  });

  if (!record || record.visibility === "PRIVATE") {
    return undefined;
  }

  return toPublicVideo(record);
}

/** Other public videos, preferring ones that share a tag. */
export async function getRelatedVideos(
  video: Video,
  limit = 8,
): Promise<Video[]> {
  const records = await prisma.video.findMany({
    where: { visibility: "PUBLIC", streamtapeId: { not: video.id } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  const matching = video.tags.length
    ? records.filter((record) =>
        (record.tags ?? []).some((tag) => video.tags.includes(tag)),
      )
    : [];

  return [...matching, ...records.filter((r) => !matching.includes(r))].map(
    toPublicVideo,
  );
}
