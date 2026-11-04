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
    views: record.views,
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
  sort?: "new" | "views";
};

export async function listPublicVideos(filters: PublicVideoFilters) {
  const search = filters.query?.trim() ?? "";
  const requestedPage = Math.max(filters.page ?? 1, 1);

  const where = {
    visibility: "PUBLIC" as const,
    status: "READY" as const,
    ...(filters.tag
      ? { tags: { has: filters.tag.trim().toLowerCase() } }
      : {}),
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

  const orderBy =
    filters.sort === "views"
      ? [{ views: "desc" as const }, { createdAt: "desc" as const }]
      : [{ createdAt: "desc" as const }];

  const total = await prisma.video.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / VIDEOS_PER_PAGE));
  const page = Math.min(requestedPage, totalPages);

  const records = await prisma.video.findMany({
    where,
    orderBy,
    skip: (page - 1) * VIDEOS_PER_PAGE,
    take: VIDEOS_PER_PAGE,
  });

  return {
    items: records.map(toPublicVideo),
    total,
    totalPages,
    page,
    perPage: VIDEOS_PER_PAGE,
  };
}

export async function getPublicVideo(id: string): Promise<Video | undefined> {
  const record = await prisma.video.findUnique({
    where: { streamtapeId: id },
  });

  if (!record || record.visibility === "PRIVATE" || record.status !== "READY") {
    return undefined;
  }

  return toPublicVideo(record);
}

/** Other public videos, preferring ones that share a tag. */
export async function getRelatedVideos(
  video: Video,
  limit = 8,
): Promise<Video[]> {
  const where = {
    visibility: "PUBLIC" as const,
    status: "READY" as const,
    streamtapeId: { not: video.id },
  };

  const [matching, recent] = await Promise.all([
    video.tags.length
      ? prisma.video.findMany({
          where: { ...where, tags: { hasSome: video.tags } },
          orderBy: { createdAt: "desc" },
          take: limit,
        })
      : [],
    prisma.video.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
  ]);

  const seen = new Set(matching.map((record) => record.id));

  return [...matching, ...recent.filter((record) => !seen.has(record.id))]
    .slice(0, limit)
    .map(toPublicVideo);
}

function visitorHash(headers: Headers): string {
  const ip = headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const ua = headers.get("user-agent") ?? "unknown";
  let hash = 0;
  for (const ch of ip + "|" + ua) {
    hash = ((hash << 5) - hash + ch.charCodeAt(0)) | 0;
  }
  return Math.abs(hash).toString(36);
}

function bucketKey(): string {
  const now = Date.now();
  return String(Math.floor(now / (4 * 3600 * 1000))); // 4-hour buckets
}

export async function recordView(id: string, headers: Headers): Promise<boolean> {
  const video = await prisma.video.findUnique({
    where: { streamtapeId: id },
    select: { id: true, visibility: true, status: true },
  });

  if (!video || video.visibility === "PRIVATE" || video.status !== "READY") {
    return false;
  }

  const vHash = visitorHash(headers);
  const bucket = bucketKey();

  try {
    await prisma.videoView.create({
      data: {
        videoId: video.id,
        visitorHash: vHash,
        bucket,
      },
    });

    await prisma.video.update({
      where: { id: video.id },
      data: { views: { increment: 1 } },
    });

    return true;
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === "P2002") {
      return false;
    }
    throw e;
  }
}
