import { BadgeCheck, CalendarDays, Eye, UploadCloud } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CategoryIcon } from "@/components/category-icon";
import { RelatedVideo } from "@/components/related-video";
import { ShareButton } from "@/components/share-button";
import { VideoPlayer } from "@/components/video-player";
import { formatDate, formatViews, getCategoryName } from "@/lib/catalog";
import { getPublicVideo, getRelatedVideos } from "@/lib/uploads";

type WatchParams = { id: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<WatchParams>;
}): Promise<Metadata> {
  const { id } = await params;
  const video = await getPublicVideo(id);

  if (!video) return { title: "Video not found" };

  return {
    title: video.title,
    description: video.description,
    openGraph: {
      title: video.title,
      description: video.description,
      type: "video.other",
    },
  };
}

export default async function WatchPage({
  params,
}: {
  params: Promise<WatchParams>;
}) {
  const { id } = await params;
  const video = await getPublicVideo(id);

  if (!video) notFound();

  const related = await getRelatedVideos(video, 8);
  const categoryName = getCategoryName(video.category);

  return (
    <main className="mx-auto w-full max-w-[1600px] px-4 py-5">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px]">
        <article className="min-w-0">
          <VideoPlayer video={video} />

          <div className="mt-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h1 className="text-lg font-bold leading-snug tracking-tight sm:text-xl">
                  {video.title}
                </h1>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="size-3.5" />
                    {formatViews(video.views)} views
                  </span>
                  <span className="flex items-center gap-1">
                    <CalendarDays className="size-3.5" />
                    {formatDate(video.createdAt)}
                  </span>
                  {video.source === "upload" ? (
                    <span className="flex items-center gap-1 text-primary">
                      <UploadCloud className="size-3.5" />
                      Fresh upload
                    </span>
                  ) : (
                    <Link
                      href={`/?category=${video.category}`}
                      className="flex items-center gap-1 text-primary transition-colors hover:text-red-400"
                    >
                      <CategoryIcon
                        category={video.category}
                        className="size-3.5"
                      />
                      {categoryName}
                    </Link>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <ShareButton title={video.title} />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-y border-border py-3.5">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-full bg-primary/15 text-sm font-black text-primary ring-1 ring-primary/20">
                  V
                </span>
                <div>
                  <p className="flex items-center gap-1 text-sm font-semibold">
                    {video.uploader}
                    <BadgeCheck className="size-4 fill-primary text-black" />
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {video.source === "upload"
                      ? "Admin studio · Direct upload"
                      : "Admin studio · Curated uploads"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-white/[0.05] px-3 py-1 text-[11px] font-medium text-muted-foreground ring-1 ring-white/10">
                  {video.source === "upload" ? "Fresh upload" : categoryName}
                </span>
                {video.tags.slice(0, 3).map((tag, index) => (
                  <Link
                    key={index}
                    href={`/?tag=${encodeURIComponent(tag)}`}
                    className="rounded-full bg-white/[0.05] px-3 py-1 text-[11px] font-medium text-muted-foreground ring-1 ring-white/10 transition-colors hover:text-foreground"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-4 rounded-lg bg-[#141414] p-4 ring-1 ring-white/5">
              <div className="mb-2 flex flex-wrap gap-2">
                {video.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/?tag=${encodeURIComponent(tag)}`}
                    className="rounded bg-white/[0.05] px-2 py-1 text-[11px] font-medium text-primary/90 transition-colors hover:bg-white/[0.09] hover:text-primary"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
              <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {video.description}
              </p>
            </div>
          </div>
        </article>

        <aside className="min-w-0 lg:sticky lg:top-28 lg:self-start">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-foreground">
              Related videos
            </h2>
            <span className="text-[11px] text-muted-foreground">
              {related.length}
            </span>
          </div>
          <div className="space-y-1.5">
            {related.map((item) => (
              <RelatedVideo key={item.id} video={item} />
            ))}
          </div>
        </aside>
      </div>
    </main>
  );
}
