import { ArrowLeft, Film } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col items-center px-4 py-24 text-center">
      <span className="mb-5 grid size-16 place-items-center rounded-full bg-white/[0.04] ring-1 ring-white/10">
        <Film className="size-7 text-primary" />
      </span>
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
        404 — Not found
      </p>
      <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
        This video is off the reel
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
        The page you are looking for does not exist, or the video was removed
        from the library.
      </p>
      <Link
        href="/"
        className="mt-7 inline-flex h-10 items-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-red-500"
      >
        <ArrowLeft className="size-4" />
        Back to videos
      </Link>
    </main>
  );
}
