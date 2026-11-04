import { useTRPC } from "@/trpc/client";
import { toast } from "@/lib/toast";
import {
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { toVideosQueryInput } from "../params";
import { useVideosParams } from "./use-videos-params";

/**
 * Fetch the paginated video library using suspense.
 */
export const useSuspenseVideos = () => {
  const trpc = useTRPC();
  const [params] = useVideosParams();

  return useSuspenseQuery(
    trpc.videos.getMany.queryOptions(toVideosQueryInput(params)),
  );
};

/**
 * Fetch StreamTape folders for upload targets and filtering.
 */
export const useVideoFolders = () => {
  const trpc = useTRPC();

  return useQuery(
    trpc.videos.getFolders.queryOptions(undefined, {
      staleTime: 5 * 60 * 1000,
    }),
  );
};

/**
 * Fetch account statistics.
 */
export const useVideoStats = () => {
  const trpc = useTRPC();

  return useQuery(trpc.videos.getStats.queryOptions());
};

/**
 * Update local video metadata.
 */
export const useUpdateVideo = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.videos.update.mutationOptions({
      onSuccess: (video) => {
        toast.success("Video updated", video.title);
        queryClient.invalidateQueries({
          queryKey: [["videos", "getMany"]],
        });
        queryClient.invalidateQueries(
          trpc.videos.getOne.queryOptions({ id: video.id }),
        );
      },
      onError: (error) => {
        toast.error("Could not update video", error.message);
      },
    }),
  );
};

/**
 * Delete a video from StreamTape and the local database.
 */
export const useRemoveVideo = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.videos.remove.mutationOptions({
      onSuccess: () => {
        toast.success("Video removed");
        queryClient.invalidateQueries({
          queryKey: [["videos", "getMany"]],
        });
        queryClient.invalidateQueries({
          queryKey: [["videos", "getStats"]],
        });
      },
      onError: (error) => {
        toast.error("Could not remove video", error.message);
      },
    }),
  );
};

/**
 * Move a file to another StreamTape folder.
 */
export const useMoveVideo = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.videos.move.mutationOptions({
      onSuccess: () => {
        toast.success("Video moved");
        queryClient.invalidateQueries({
          queryKey: [["videos", "getMany"]],
        });
        queryClient.invalidateQueries({
          queryKey: [["videos", "getStats"]],
        });
      },
      onError: (error) => {
        toast.error("Could not move video", error.message);
      },
    }),
  );
};

/**
 * Start a StreamTape remote upload from a URL.
 */
export const useRemoteUpload = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.videos.addRemoteUpload.mutationOptions({
      onSuccess: () => {
        toast.success("Remote upload started");
        queryClient.invalidateQueries({
          queryKey: [["videos", "getMany"]],
        });
      },
      onError: (error) => {
        toast.error("Could not start remote upload", error.message);
      },
    }),
  );
};

/**
 * Import the account root and configured folder from StreamTape into the
 * local library, refreshing names, sizes, and conversion statuses.
 */
export const useSyncVideos = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.videos.sync.mutationOptions({
      onSuccess: (result) => {
        toast.success("Library synced", `${result.syncedCount} videos checked`);
        queryClient.invalidateQueries({
          queryKey: [["videos", "getMany"]],
        });
        queryClient.invalidateQueries({
          queryKey: [["videos", "getStats"]],
        });
      },
      onError: (error) => {
        toast.error("Could not sync library", error.message);
      },
    }),
  );
};
