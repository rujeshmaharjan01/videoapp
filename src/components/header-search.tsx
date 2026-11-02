"use client";

import { Search } from "lucide-react";
import { useSearchParams } from "next/navigation";

export function HeaderSearch() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") ?? "";

  return (
    <form
      action="/"
      method="get"
      role="search"
      className="relative flex w-full items-center"
    >
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-3 size-4 text-muted-foreground"
      />
      <input
        key={query}
        type="search"
        name="q"
        defaultValue={query}
        placeholder="Search videos, tags, creators…"
        aria-label="Search videos"
        className="h-10 w-full rounded-md border border-border bg-[#181818] py-2 pl-9 pr-20 text-sm text-foreground shadow-inner shadow-black/20 transition-colors placeholder:text-muted-foreground/80 focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
      <button
        type="submit"
        className="absolute right-1.5 inline-flex h-7 items-center rounded bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors hover:bg-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
      >
        Search
      </button>
    </form>
  );
}
