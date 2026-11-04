import { PAGINATION } from "@/config/constants";
import { prisma } from "@/lib/prisma";
import { recordView } from "@/lib/uploads";
import {
  addRemoteUpload,
  createUploadUrl,
  deleteFile,
  getFileInfo,
  listFolder,
  moveFile,
  resolveFolderId,
  type StreamTapeFileInfo,
} from "@/lib/streamtape";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { headers } from "next/headers";
import { z } from "zod";

const statusFromConvert = (value: string) => {
  const normalized = value.toLowerCase();

  if (normalized === "converted" || normalized === "ready") {
    return "READY" as const;
  }

  if (normalized === "error" || normalized === "failed") {
    return "FAILED" as const;
  }

  return "PROCESSING" as const;
};

const titleFromFileName = (fileName: string) => {
  return fileName.replace(/\.[^/.]+$/, "").replace(/[-_]+/g, " ").trim();
};

const videoUrl = (id: string, fileName: string) =>
  `https://streamtape.com/v/${id}/${encodeURIComponent(fileName)}`;

const embedUrl = (id: string) => `https://streamtape.com/e/${id}`;

const thumbnailUrl = (id: string) =>
  `https://thumb.tapecontent.net/thumb/${id}/thumb.jpg`;

/**
 * StreamTape has returned `created_at` in both seconds and milliseconds.
 */
const fromStreamTapeTimestamp = (value: number) =>
  new Date(value > 10_000_000_000 ? value : value * 1000);

const tagsSchema = z
  .array(z.string().min(1).max(50))
  .transform((tags) => [
    ...new Set(
      tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean),
    ),
  ]);

type VideoRecord = {
  id: string;
  title: string;
  description: string | null;
  tags: string[];
  streamtapeId: string;
  fileName: string;
  streamtapeUrl: string;
  thumbnailUrl: string | null;
  folderId: string | null;
  size: bigint | null;
  status: "PROCESSING" | "READY" | "FAILED";
  visibility: "PUBLIC" | "UNLISTED" | "PRIVATE";
  createdAt: Date;
  updatedAt: Date;
  userId: string;
};

function serializeRecord(record: VideoRecord) {
  return {
    id: record.streamtapeId,
    dbId: record.id,
    title: record.title,
    description: record.description,
    tags: record.tags ?? [],
    fileName: record.fileName,
    size: record.size ? Number(record.size) : 0,
    thumbnailUrl:
      record.thumbnailUrl ??
      (record.status === "READY" ? thumbnailUrl(record.streamtapeId) : null),
    folderId: record.folderId,
    status: record.status,
    visibility: record.visibility,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function serializeInfo(info: StreamTapeFileInfo, record?: VideoRecord | null) {
  const status = record?.status ?? (info.converted ? "READY" : "PROCESSING");

  return {
    id: info.id,
    dbId: record?.id ?? null,
    title: record?.title ?? titleFromFileName(info.name),
    description: record?.description ?? null,
    tags: record?.tags ?? [],
    fileName: info.name,
    size: record?.size ? Number(record.size) : info.size,
    thumbnailUrl:
      record?.thumbnailUrl ??
      (info.converted ? thumbnailUrl(info.id) : null),
    folderId: record?.folderId ?? null,
    status,
    visibility: record?.visibility ?? ("UNLISTED" as const),
    createdAt: record?.createdAt.toISOString() ?? new Date().toISOString(),
    updatedAt: record?.updatedAt.toISOString() ?? null,
  };
}

type UploadResultData = {
  id?: string;
  name?: string;
  size?: number;
  url?: string;
};

function extractUploadResult(payload: unknown): UploadResultData {
  if (!payload || typeof payload !== "object") {
    return {};
  }

  const object = payload as Record<string, unknown>;
  const result =
    object.result && typeof object.result === "object"
      ? (object.result as Record<string, unknown>)
      : object;

  const id = [result.id, result.linkid, result.file, object.id, object.linkid]
    .find((value): value is string => typeof value === "string" && value.length > 0);

  const name =
    typeof result.name === "string"
      ? result.name
      : typeof object.name === "string"
        ? object.name
        : undefined;

  const url =
    typeof result.url === "string"
      ? result.url
      : typeof object.url === "string"
        ? object.url
        : undefined;

  const size = Number(result.size ?? object.size);

  return {
    id,
    name,
    url,
    size: Number.isFinite(size) && size > 0 ? size : undefined,
  };
}

async function findUploadedFileId(fileName: string, folderId?: string) {
  // The browser upload happens outside this process, so the cached folder
  // listing may predate the new file.
  const contents = await listFolder(folderId, { fresh: true });
  const match = contents.files
    .filter((file) => file.name === fileName)
    .sort((a, b) => b.created_at - a.created_at)[0];

  if (!match) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message:
        "The upload completed, but the file could not be found in your StreamTape folder.",
    });
  }

  return match.linkid;
}

async function ensureVideoRecord(userId: string, id: string) {
  const existing = await prisma.video.findUnique({
    where: { streamtapeId: id },
  });

  if (existing) {
    if (existing.userId !== userId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Not your video.",
      });
    }

    return existing as VideoRecord;
  }

  const info = await getFileInfo(id);
  const file = info[id];

  if (!file || file.status !== 200) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Video not found on StreamTape.",
    });
  }

  const thumb: string | null = thumbnailUrl(id);

  return (await prisma.video.create({
    data: {
      title: titleFromFileName(file.name),
      streamtapeId: id,
      fileName: file.name,
      streamtapeUrl: videoUrl(id, file.name),
      embedUrl: embedUrl(id),
      thumbnailUrl: thumb,
      size: BigInt(file.size),
      status: file.converted ? "READY" : "PROCESSING",
      visibility: "UNLISTED",
      userId,
    },
  })) as VideoRecord;
}

export const videosRouter = createTRPCRouter({
  getMany: protectedProcedure
    .input(
      z.object({
        page: z.number().int().positive().default(PAGINATION.DEFAULT_PAGE),
        pageSize: z
          .number()
          .int()
          .min(PAGINATION.MIN_PAGE_SIZE)
          .max(PAGINATION.MAX_PAGE_SIZE)
          .default(PAGINATION.DEFAULT_PAGE_SIZE),
        search: z.string().default(""),
        folderId: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const configuredFolder = await resolveFolderId();
      const folderId =
        input.folderId === undefined
          ? configuredFolder ?? null
          : input.folderId || null;

      const search = input.search.trim();
      const where = {
        userId: ctx.auth.user.id,
        folderId,
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: "insensitive" as const } },
                {
                  fileName: { contains: search, mode: "insensitive" as const },
                },
              ],
            }
          : {}),
      };

      const [totalCount, records] = await Promise.all([
        prisma.video.count({ where }),
        prisma.video.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (input.page - 1) * input.pageSize,
          take: input.pageSize,
        }),
      ]);

      const totalPages = Math.ceil(totalCount / input.pageSize);

      return {
        items: (records as VideoRecord[]).map(serializeRecord),
        page: input.page,
        pageSize: input.pageSize,
        totalCount,
        totalPages,
        hasNextPage: input.page < totalPages,
        hasPreviousPage: input.page > 1,
      };
    }),

  getFolders: protectedProcedure.query(async () => {
    const contents = await listFolder();
    return contents.folders;
  }),

  getOne: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const record = await prisma.video.findUnique({
        where: { streamtapeId: input.id },
      });

      if (record) {
        if (record.userId !== ctx.auth.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Not your video.",
          });
        }

        return serializeRecord(record as VideoRecord);
      }

      const info = await getFileInfo(input.id);
      const file = info[input.id];

      if (!file || file.status !== 200) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Video not found on StreamTape.",
        });
      }

      return serializeInfo(file);
    }),

  createUpload: protectedProcedure
    .input(
      z.object({
        fileName: z.string().min(1).max(255),
        size: z.number().int().nonnegative().optional(),
        sha256: z.string().length(64).optional(),
        folderId: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const folderId = input.folderId ?? (await resolveFolderId());

      const upload = await createUploadUrl({
        folder: folderId,
        sha256: input.sha256,
      });

      return {
        uploadUrl: upload.url,
        expiresAt: upload.valid_until,
        folderId: folderId ?? null,
      };
    }),

  confirmUpload: protectedProcedure
    .input(
      z.object({
        fileName: z.string().min(1).max(255),
        title: z.string().min(1).max(200).optional(),
        description: z.string().max(5000).nullable().optional(),
        size: z.number().int().nonnegative().optional(),
        uploadResult: z.unknown().optional(),
        folderId: z.string().optional(),
        tags: tagsSchema.optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const folderId =
        input.folderId === ""
          ? null
          : (input.folderId ??
            (await resolveFolderId()) ??
            null);

      const upload = extractUploadResult(input.uploadResult);
      const id =
        upload.id ??
        (await findUploadedFileId(input.fileName, folderId ?? undefined));

      let fileName = upload.name ?? input.fileName;
      let fileSize = upload.size ?? input.size ?? 0;

      if (!upload.name || !upload.size) {
        const info = await getFileInfo(id);
        const file = info[id];

        if (!file || file.status !== 200) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "The uploaded file was not found on StreamTape.",
          });
        }

        fileName = file.name;
        fileSize = file.size;
      }

      const existing = await prisma.video.findUnique({
        where: { streamtapeId: id },
      });

      if (existing && existing.userId !== ctx.auth.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This video belongs to another account.",
        });
      }

      const fileInfo = await getFileInfo(id);
      const file = fileInfo[id];
      const fileStatus: "PROCESSING" | "READY" | "FAILED" = file ? (file.converted ? "READY" : "PROCESSING") : "PROCESSING";

      const data = {
        fileName,
        streamtapeUrl: videoUrl(id, fileName),
        embedUrl: embedUrl(id),
        folderId,
        size: BigInt(Math.round(fileSize)),
        status: fileStatus,
        thumbnailUrl: fileStatus === "READY" ? thumbnailUrl(id) : null,
      };

      const record = existing
        ? await prisma.video.update({
            where: { id: existing.id },
            data: {
              ...data,
              ...(input.title ? { title: input.title } : {}),
              ...(input.description !== undefined ? { description: input.description } : {}),
              ...(input.tags ? { tags: input.tags } : {}),
            },
          })
        : await prisma.video.create({
            data: {
              ...data,
              title: input.title ?? titleFromFileName(fileName),
              description: input.description ?? null,
              streamtapeId: id,
              visibility: "PUBLIC",
              userId: ctx.auth.user.id,
              tags: input.tags ?? [],
            },
          });

      return serializeRecord(record as VideoRecord);
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
        title: z.string().min(1).max(200).optional(),
        description: z.string().max(5000).nullable().optional(),
        visibility: z.enum(["PUBLIC", "UNLISTED", "PRIVATE"]).optional(),
        tags: tagsSchema.optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ensureVideoRecord(ctx.auth.user.id, input.id);

      const record = await prisma.video.update({
        where: { streamtapeId: input.id },
        data: {
          ...(input.title !== undefined ? { title: input.title } : {}),
          ...(input.description !== undefined
            ? { description: input.description }
            : {}),
          ...(input.visibility !== undefined
            ? { visibility: input.visibility }
            : {}),
          ...(input.tags !== undefined ? { tags: input.tags } : {}),
        },
      });

      return serializeRecord(record as VideoRecord);
    }),

  move: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
        folderId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await prisma.video.updateMany({
        where: { streamtapeId: input.id, userId: ctx.auth.user.id },
        data: { folderId: input.folderId },
      });

      try {
        await moveFile(input.id, input.folderId);
      } catch {
        // Best-effort: StreamTape may be slow; DB is already correct.
      }

      return { id: input.id, folderId: input.folderId };
    }),

  remove: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await prisma.video.deleteMany({
        where: {
          streamtapeId: input.id,
          userId: ctx.auth.user.id,
        },
      });

      try {
        await deleteFile(input.id);
      } catch {
        // Best-effort: file may already be gone or StreamTape may be slow.
        // The DB row is already removed so the user won't see a broken page.
      }

      return { id: input.id };
    }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    const [aggregate, folders] = await Promise.all([
      prisma.video.aggregate({
        where: { userId: ctx.auth.user.id },
        _count: { _all: true },
        _sum: { size: true },
      }),
      prisma.video.findMany({
        where: { userId: ctx.auth.user.id, folderId: { not: null } },
        select: { folderId: true },
        distinct: ["folderId"],
      }),
    ]);

    return {
      totalFiles: aggregate._count._all,
      totalBytes: Number(aggregate._sum.size ?? 0),
      folderCount: folders.length,
    };
  }),

  /**
   * Pull the account root and the configured folder from StreamTape into the
   * local library. This is the only operation that lists files, which keeps
   * normal page loads well below StreamTape's rate limit.
   */
  sync: protectedProcedure
    .input(
      z
        .object({
          folderId: z.string().nullish(),
        })
        .optional(),
    )
    .mutation(async ({ ctx, input }) => {
      const configuredFolder = await resolveFolderId();
      const folderIds: Array<string | undefined> = [undefined];
      const requestedFolder = input?.folderId ?? undefined;

      if (requestedFolder) {
        folderIds.push(requestedFolder);
      } else if (configuredFolder) {
        folderIds.push(configuredFolder);
      }

      const targets = [...new Set(folderIds)];
      let syncedCount = 0;

      for (const folderId of targets) {
        let contents;

        try {
          contents = await listFolder(folderId, { fresh: true });
        } catch (error) {
          if (folderId === undefined) {
            throw error;
          }

          continue;
        }

        // Batch upsert: fetch all existing records at once
        const fileIds = contents.files.map((f) => f.linkid);
        const existingRecords = await prisma.video.findMany({
          where: { streamtapeId: { in: fileIds } },
        });
        const existingMap = new Map(existingRecords.map((r) => [r.streamtapeId, r]));

        for (const file of contents.files) {
          const existing = existingMap.get(file.linkid);

          if (existing && existing.userId !== ctx.auth.user.id) {
            continue;
          }

          const fileStatus = statusFromConvert(file.convert);
          const data = {
            fileName: file.name,
            streamtapeUrl: videoUrl(file.linkid, file.name),
            embedUrl: embedUrl(file.linkid),
            thumbnailUrl:
              fileStatus === "READY" ? thumbnailUrl(file.linkid) : null,
            folderId: folderId ?? null,
            size: BigInt(file.size),
            status: fileStatus,
          };

          if (existing) {
            await prisma.video.update({
              where: { id: existing.id },
              data,
            });
          } else {
            await prisma.video.create({
              data: {
                ...data,
                title: titleFromFileName(file.name),
                streamtapeId: file.linkid,
                visibility: "UNLISTED",
                userId: ctx.auth.user.id,
                createdAt: fromStreamTapeTimestamp(file.created_at),
              },
            });
          }

          syncedCount += 1;
        }
      }

      return {
        syncedCount,
        syncedAt: new Date().toISOString(),
      };
    }),

  recordView: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const h = await headers();
      const counted = await recordView(input.id, h);
      return { ok: true, counted };
    }),

  addRemoteUpload: protectedProcedure
    .input(
      z.object({
        url: z.url(),
        name: z.string().min(1).max(255).optional(),
        folderId: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      return addRemoteUpload({
        url: input.url,
        name: input.name,
        folder: input.folderId ?? (await resolveFolderId()),
      });
    }),
});
