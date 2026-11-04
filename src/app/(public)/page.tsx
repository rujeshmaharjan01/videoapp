import { Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { Pagination } from "@/components/pagination";
import { SortLinks } from "@/components/sort-links";
import { VideoGrid } from "@/components/video-grid";
import { buildHomeQuery } from "@/lib/catalog";
import { listPublicVideos } from "@/lib/uploads";

export const metadata: Metadata = {
  title: { absolute: "VideoApp — Watch. Discover." },
};

type HomeSearchParams = {
  q?: string | string[];
  tag?: string | string[];
  sort?: string | string[];
  page?: string | string[];
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<HomeSearchParams>;
}) {
  const params = await searchParams;
  const query = first(params.q)?.trim() || undefined;
  const tag = first(params.tag)?.trim() || undefined;
  const sort: "new" | "views" = first(params.sort) === "views" ? "views" : "new";
  const pageParam = Number.parseInt(first(params.page) ?? "1", 10);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  const result = await listPublicVideos({ query, tag, page, sort });

  const heading = query
    ? `Results for “${query}”`
    : tag
      ? `#${tag}`
      : sort === "views"
        ? "Most viewed"
        : "Newest videos";

  return (
    <main className="mx-auto w-full max-w-[1600px] px-4 py-6">
      <section aria-labelledby="video-feed-heading">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              <Sparkles className="size-3.5" />
              <span>{query ? "Search the library" : "Fresh from the studio"}</span>
            </div>
            <h1
              id="video-feed-heading"
              className="truncate text-xl font-bold tracking-tight sm:text-2xl"
            >
              {heading}
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              {result.total} {result.total === 1 ? "video" : "videos"}
              {tag ? ` tagged #${tag}` : ""}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {(query || tag) && (
              <Link
                href="/"
                className="text-xs font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                Clear filters
              </Link>
            )}
            <SortLinks sort={sort} query={query} tag={tag} />
          </div>
        </div>

        {result.items.length ? (
          <VideoGrid videos={result.items} />
        ) : (
          <EmptyState
            title="No videos found"
            description="Nothing has been published here yet. Check back soon."
            action={
              <Link
                href="/"
                className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-red-500"
              >
                Browse all videos
              </Link>
            }
          />
        )}

        <Pagination
          page={result.page}
          totalPages={result.totalPages}
          buildHref={(nextPage) =>
            buildHomeQuery({
              q: query,
              tag,
              sort: sort === "views" ? "views" : undefined,
              page: nextPage === 1 ? undefined : nextPage,
            })
          }
        />
      </section>
    </main>
  );
}
