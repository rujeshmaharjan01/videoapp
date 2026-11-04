import { Eye, Play } from "lucide-react";
import Link from "next/link";

import { CategoryIcon } from "@/components/category-icon";
import { formatViews, timeAgo, type Video } from "@/lib/catalog";

export function RelatedVideo({ video }: { video: Video }) {
  return (
    <Link
      href={`/watch/${video.id}`}
      className="group flex gap-2.5 rounded-md p-1 transition-colors hover:bg-white/[0.035] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
    >
      <div className="relative aspect-video w-36 shrink-0 overflow-hidden rounded-md bg-[#171717] ring-1 ring-white/10 sm:w-40">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(135deg, ${video.gradient[0]}, ${video.gradient[1]})`,
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_50%)]" />
        <CategoryIcon
          category={video.category}
          className="absolute -bottom-4 -right-3 size-20 text-white/8"
          strokeWidth={1}
        />
        <span className="absolute inset-0 grid place-items-center opacity-0 transition-opacity group-hover:opacity-100">
          <span className="grid size-8 place-items-center rounded-full bg-black/60 ring-1 ring-white/30">
            <Play className="size-3.5 translate-x-px fill-white text-white" />
          </span>
        </span>
      </div>

      <div className="min-w-0 py-0.5">
        <h3 className="line-clamp-2 text-xs font-medium leading-snug text-foreground/95 transition-colors group-hover:text-primary">
          {video.title}
        </h3>
        <p className="mt-1 truncate text-[11px] text-muted-foreground">
          {video.uploader}
        </p>
        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground/80">
          <Eye className="size-3" />
          {formatViews(video.views)} views
          <span aria-hidden="true">·</span>
          {timeAgo(video.createdAt)}
        </p>
      </div>
    </Link>
  );
}
