import { ArrowRight, Flame } from "lucide-react";
import Link from "next/link";

import type { Video } from "@/lib/catalog";

import { VideoCard } from "./video-card";

export function TrendingRow({ videos }: { videos: Video[] }) {
  if (!videos.length) return null;

  return (
    <section aria-labelledby="trending-heading" className="mb-9">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            <Flame className="size-3.5" />
            <span>Hot right now</span>
          </div>
          <h2
            id="trending-heading"
            className="text-xl font-bold tracking-tight sm:text-2xl"
          >
            Trending now
          </h2>
        </div>
        <Link
          href="/?sort=views"
          className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          View all
          <ArrowRight className="size-3.5" />
        </Link>
      </div>

      <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2">
        {videos.map((video) => (
          <VideoCard
            key={video.id}
            video={video}
            className="w-[240px] shrink-0 snap-start sm:w-[280px]"
          />
        ))}
      </div>
    </section>
  );
}
