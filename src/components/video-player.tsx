import { Maximize, Play, Settings2, Volume2 } from "lucide-react";

import type { Video } from "@/lib/catalog";

export function VideoPlayer({ video }: { video: Video }) {
  return (
    <div className="relative aspect-video overflow-hidden rounded-lg bg-black ring-1 ring-white/10">
      {video.streamtapeId ? (
        <iframe
          src={`https://streamtape.com/e/${video.streamtapeId}?color=239,68,68`}
          title={video.title}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      ) : (
        <>
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `linear-gradient(135deg, ${video.gradient[0]}, ${video.gradient[1]})`,
            }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.14),transparent_55%)]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/25" />

          <div className="absolute left-3 top-3 rounded bg-black/55 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/70 ring-1 ring-white/15 backdrop-blur-sm">
            Player preview
          </div>

          <div className="absolute inset-0 grid place-items-center">
            <span className="grid size-16 place-items-center rounded-full bg-black/45 ring-1 ring-white/35 backdrop-blur-sm sm:size-20">
              <Play className="size-7 translate-x-0.5 fill-white text-white sm:size-8" />
            </span>
          </div>

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 sm:p-4">
            <div className="mb-3 h-1 w-full overflow-hidden rounded-full bg-white/20">
              <div className="h-full w-[34%] rounded-full bg-primary" />
            </div>
            <div className="flex items-center gap-3 text-white/75">
              <Play className="size-4 fill-current" />
              <Volume2 className="size-4" />
              <span className="font-mono text-[11px] text-white/60">0:00</span>
              <div className="ml-auto flex items-center gap-3">
                <Settings2 className="size-4" />
                <Maximize className="size-4" />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
