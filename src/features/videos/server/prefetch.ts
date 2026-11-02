import type { inferInput } from "@trpc/tanstack-react-query";
import { prefetch, trpc } from "@/trpc/server";

type Input = inferInput<typeof trpc.videos.getMany>;

/**
 * Prefetch the paginated video library.
 */
export const prefetchVideos = (params: Input) => {
  return prefetch(trpc.videos.getMany.queryOptions(params));
};

/**
 * Prefetch account statistics.
 */
export const prefetchVideoStats = () => {
  return prefetch(trpc.videos.getStats.queryOptions());
};

/**
 * Prefetch the StreamTape folder list used by filters and upload targets.
 */
export const prefetchVideoFolders = () => {
  return prefetch(trpc.videos.getFolders.queryOptions());
};

/**
 * Prefetch a single video.
 */
export const prefetchVideo = (id: string) => {
  return prefetch(trpc.videos.getOne.queryOptions({ id }));
};
