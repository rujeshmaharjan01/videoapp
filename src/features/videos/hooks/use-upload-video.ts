"use client";

import { toast } from "@/lib/toast";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { VideoItem } from "../types";

function uploadFileWithProgress(
  uploadUrl: string,
  file: File,
  onProgress: (progress: number) => void,
) {
  return new Promise<unknown>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();

    formData.append("file1", file);

    xhr.open("POST", uploadUrl);

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          resolve(null);
        }
        return;
      }

      reject(new Error(`Upload failed with HTTP ${xhr.status}.`));
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Upload failed. Check your connection and try again."));
    });

    xhr.addEventListener("abort", () => {
      reject(new Error("Upload cancelled."));
    });

    xhr.send(formData);
  });
}

export const useUploadVideo = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const createUpload = useMutation(
    trpc.videos.createUpload.mutationOptions(),
  );

  const confirmUpload = useMutation(
    trpc.videos.confirmUpload.mutationOptions({
      onSuccess: (video) => {
        toast.success("Video uploaded", video.title);
      },
      onError: (error) => {
        toast.error("Upload could not be confirmed", error.message);
      },
    }),
  );

  const upload = async (
    file: File,
    options?: {
      title?: string;
      description?: string;
      tags?: string[];
      folderId?: string;
      onSuccess?: (video: VideoItem) => void;
    },
  ) => {
    setIsUploading(true);
    setProgress(0);

    try {
      const target = await createUpload.mutateAsync({
        fileName: file.name,
        size: file.size,
        folderId: options?.folderId,
      });

      const uploadResult = await uploadFileWithProgress(
        target.uploadUrl,
        file,
        setProgress,
      );

      const video = await confirmUpload.mutateAsync({
        fileName: file.name,
        title: options?.title,
        description: options?.description,
        size: file.size,
        folderId: target.folderId ?? undefined,
        tags: options?.tags,
        uploadResult,
      });

      await queryClient.invalidateQueries({
        queryKey: [["videos", "getMany"]],
      });
      await queryClient.invalidateQueries({
        queryKey: [["videos", "getStats"]],
      });

      options?.onSuccess?.(video);
      return video;
    } catch (error) {
      toast.error(
        "Upload failed",
        error instanceof Error ? error.message : "Something went wrong.",
      );
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    upload,
    progress,
    isUploading,
  };
};
