import { Eye, Play } from "lucide-react";
import Link from "next/link";

import { CategoryIcon } from "@/components/category-icon";
import {
  formatDuration,
  formatViews,
  getCategoryName,
  timeAgo,
  type Video,
} from "@/lib/catalog";
import { cn } from "@/lib/utils";

export function VideoCard({
  video,
  className,
}: {
  video: Video;
  className?: string;
}) {
  return (
    <Link
      href={`/watch/${video.id}`}
      className={cn("group block min-w-0 focus-visible:outline-none", className)}
    >
      <div className="relative aspect-video overflow-hidden rounded-lg bg-[#151515] ring-1 ring-white/10 transition-all duration-300 group-hover:ring-white/25 group-focus-visible:ring-2 group-focus-visible:ring-primary">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(135deg, ${video.gradient[0]}, ${video.gradient[1]})`,
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_18%,rgba(255,255,255,0.22),transparent_45%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/10" />
        <CategoryIcon
          category={video.category}
          className="absolute -bottom-6 -right-4 size-32 text-white/[0.09] transition-transform duration-500 group-hover:scale-110"
          strokeWidth={1}
        />

        <span className="absolute left-2 top-2 rounded bg-black/65 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white/85 backdrop-blur-sm">
          {video.source === "upload"
            ? "New"
            : getCategoryName(video.category).split(" ")[0]}
        </span>

        <span className="absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <span className="grid size-12 place-items-center rounded-full bg-black/55 ring-1 ring-white/30 backdrop-blur-sm">
            <Play className="size-5 translate-x-0.5 fill-white text-white" />
          </span>
        </span>

        {video.durationSeconds > 0 ? (
          <span className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-white">
            {formatDuration(video.durationSeconds)}
          </span>
        ) : null}
      </div>

      <div className="mt-2.5 min-w-0 space-y-1">
        <h3 className="line-clamp-2 text-[13px] font-medium leading-snug text-foreground/95 transition-colors group-hover:text-primary sm:text-sm">
          {video.title}
        </h3>
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Eye className="size-3" />
          <span>{formatViews(video.views)} views</span>
          <span aria-hidden="true">·</span>
          <span className="truncate">{timeAgo(video.createdAt)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/80">
          <span className="grid size-4 shrink-0 place-items-center rounded-full bg-primary/15 text-[8px] font-bold text-primary">
            V
          </span>
          <span className="truncate">{video.uploader}</span>
        </div>
      </div>
    </Link>
  );
}
