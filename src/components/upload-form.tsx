"use client";

import { useMutation } from "@tanstack/react-query";
import {
  CheckCircle2,
  ExternalLink,
  FileVideo,
  Loader2,
  ShieldCheck,
  UploadCloud,
  X,
} from "lucide-react";
import Link from "next/link";
import {
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
} from "react";

import { useUploadVideo } from "@/features/videos/hooks/use-upload-video";
import type { VideoItem } from "@/features/videos/types";
import { formatDuration } from "@/lib/catalog";
import { useTRPC } from "@/trpc/client";
import { cn } from "@/lib/utils";

const MAX_SIZE_BYTES = 512 * 1024 * 1024;

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

export function UploadForm() {
  const inputRef = useRef<HTMLInputElement>(null);
  const trpc = useTRPC();
  const { upload, progress, isUploading } = useUploadVideo();

  const [file, setFile] = useState<File | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<VideoItem | null>(null);
  const [publishFailed, setPublishFailed] = useState(false);

  const publish = useMutation(trpc.videos.update.mutationOptions());

  function acceptFile(nextFile: File) {
    setError(null);

    if (!nextFile.type.startsWith("video/")) {
      setError("Please choose a video file (MP4, WebM, or MOV).");
      return;
    }

    if (nextFile.size > MAX_SIZE_BYTES) {
      setError("That file is larger than 512 MB. Please choose a smaller video.");
      return;
    }

    setFile(nextFile);

    if (!title.trim()) {
      setTitle(
        nextFile.name
          .replace(/\.[^.]+$/, "")
          .replace(/[-_]+/g, " ")
          .replace(/\s+/g, " ")
          .trim(),
      );
    }

    const objectUrl = URL.createObjectURL(nextFile);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      if (Number.isFinite(video.duration)) {
        setDuration(Math.round(video.duration));
      }
      URL.revokeObjectURL(objectUrl);
    };
    video.onerror = () => URL.revokeObjectURL(objectUrl);
    video.src = objectUrl;
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0];
    if (nextFile) acceptFile(nextFile);
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    const nextFile = event.dataTransfer.files?.[0];
    if (nextFile) acceptFile(nextFile);
  }

  function reset() {
    setFile(null);
    setDuration(null);
    setTitle("");
    setDescription("");
    setTags("");
    setError(null);
    setCreated(null);
    setPublishFailed(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file) {
      setError("Choose a video file before uploading.");
      return;
    }
    if (title.trim().length < 3) {
      setError("Give your video a title with at least 3 characters.");
      return;
    }

    setError(null);

    try {
      const video = await upload(file, { 
        title: title.trim(),
        tags: tags.split(",").map(t => t.trim()).filter(Boolean)
      });
      setCreated(video);

      // Publish the metadata the admin entered in the upload form.
      try {
        await publish.mutateAsync({
          id: video.id,
          description: description.trim() || null,
          visibility: "PUBLIC",
          tags: tags.split(",").map(t => t.trim()).filter(Boolean),
        });
      } catch {
        setPublishFailed(true);
      }
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "The upload could not be completed. Please try again.",
      );
    }
  }

  if (created) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center rounded-xl border border-border bg-[#111] px-6 py-14 text-center shadow-2xl shadow-black/40">
        <span className="mb-5 grid size-16 place-items-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/30">
          <CheckCircle2 className="size-8 text-emerald-400" />
        </span>
        <h1 className="text-xl font-bold tracking-tight">
          {publishFailed ? "Video uploaded" : "Video published"}
        </h1>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">{created.title}</span>{" "}
          {publishFailed
            ? "was uploaded but is still unlisted. Publish it from the Studio when you are ready."
            : "is live. StreamTape may take a few minutes to finish converting it before playback starts."}
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
          <Link
            href={`/watch/${created.id}`}
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-red-500"
          >
            <ExternalLink className="size-4" />
            Open watch page
          </Link>
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-9 items-center rounded-md border border-border bg-[#181818] px-4 text-sm font-medium text-foreground transition-colors hover:bg-[#222]"
          >
            Upload another
          </button>
          <Link
            href="/videos"
            className="inline-flex h-9 items-center rounded-md border border-border bg-[#181818] px-4 text-sm font-medium text-foreground transition-colors hover:bg-[#222]"
          >
            Go to Studio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            <UploadCloud className="size-3.5" />
            Studio upload
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Upload a video</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Publish to the VideoApp library. Maximum file size 512 MB.
          </p>
        </div>
        <span className="inline-flex h-7 w-fit items-center rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 text-[11px] font-semibold text-emerald-300">
          StreamTape connected
        </span>
      </div>

      <form onSubmit={onSubmit} className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-xl border border-border bg-[#111] p-4 sm:p-5">
          <div
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                inputRef.current?.click();
              }
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={cn(
              "relative flex min-h-[280px] cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed px-6 py-10 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
              dragging
                ? "border-primary bg-primary/[0.06]"
                : "border-white/15 bg-black/20 hover:border-white/30 hover:bg-white/[0.02]",
            )}
          >
            <input
              ref={inputRef}
              id="video-file"
              type="file"
              accept="video/*"
              onChange={onFileChange}
              className="sr-only"
            />

            {file ? (
              <div className="w-full max-w-sm">
                <div className="mx-auto mb-4 grid size-14 place-items-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
                  <FileVideo className="size-6 text-primary" />
                </div>
                <p className="truncate text-sm font-semibold text-foreground">
                  {file.name}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatBytes(file.size)}
                  {duration ? ` · ${formatDuration(duration)}` : ""}
                </p>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={(event) => {
                    event.stopPropagation();
                    reset();
                  }}
                  className="mt-4 inline-flex h-7 items-center gap-1 rounded border border-border bg-[#181818] px-2.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                >
                  <X className="size-3" />
                  Remove file
                </button>
              </div>
            ) : (
              <>
                <div className="mb-4 grid size-14 place-items-center rounded-full bg-white/[0.04] ring-1 ring-white/10">
                  <UploadCloud className="size-6 text-primary" />
                </div>
                <p className="text-sm font-semibold">Drag and drop your video</p>
                <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">
                  or click to browse. MP4, WebM, and MOV are supported.
                </p>
                <span className="mt-4 inline-flex h-8 items-center rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground">
                  Choose file
                </span>
              </>
            )}
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-md border border-border/70 bg-[#0d0d0d] p-3 text-[11px] leading-relaxed text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-emerald-400" />
            <p>
              Uploads go directly from your browser to StreamTape. Only the
              seeded admin account can publish videos.
            </p>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-[#111] p-4 sm:p-5">
          <div className="space-y-4">
            <div>
              <label
                htmlFor="title"
                className="mb-1.5 block text-xs font-semibold text-foreground"
              >
                Title <span className="text-primary">*</span>
              </label>
              <input
                id="title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={200}
                placeholder="Give your video a clear, descriptive title"
                className="h-10 w-full rounded-md border border-border bg-[#181818] px-3 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/25"
              />
              <p className="mt-1 text-right text-[10px] text-muted-foreground">
                {title.length}/200
              </p>
            </div>

            <div>
              <label
                htmlFor="description"
                className="mb-1.5 block text-xs font-semibold text-foreground"
              >
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength={5000}
                rows={7}
                placeholder="What is this video about? Add context, credits, or links."
                className="w-full resize-y rounded-md border border-border bg-[#181818] px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/25"
              />
              <p className="mt-1 text-right text-[10px] text-muted-foreground">
                {description.length}/5000
              </p>
            </div>

            <div>
              <label
                htmlFor="tags"
                className="mb-1.5 block text-xs font-semibold text-foreground"
              >
                Tags (comma-separated)
              </label>
              <input
                id="tags"
                value={tags}
                onChange={(event) => setTags(event.target.value)}
                placeholder="e.g. tutorial, javascript, react"
                className="h-10 w-full rounded-md border border-border bg-[#181818] px-3 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/25"
              />
              <p className="mt-1 text-right text-[10px] text-muted-foreground">
                {tags.split(",").filter(t => t.trim()).length} tags
              </p>
            </div>

            {error ? (
              <p className="rounded-md border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                {error}
              </p>
            ) : null}

            {isUploading ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Uploading to StreamTape…</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            ) : null}

            <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
              <p className="text-[11px] text-muted-foreground">
                By uploading, you confirm you own the content.
              </p>
              <button
                type="submit"
                disabled={isUploading}
                className="inline-flex h-10 shrink-0 items-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isUploading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <UploadCloud className="size-4" />
                )}
                {isUploading ? "Uploading…" : "Upload video"}
              </button>
            </div>
          </div>
        </section>
      </form>
    </div>
  );
}
