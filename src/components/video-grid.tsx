import type { Video } from "@/lib/catalog";
import { cn } from "@/lib/utils";

import { VideoCard } from "./video-card";

export function VideoGrid({
  videos,
  className,
}: {
  videos: Video[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6",
        className,
      )}
    >
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} />
      ))}
    </div>
  );
}
