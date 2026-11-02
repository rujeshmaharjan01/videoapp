import { Play } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { CategoryNav } from "@/components/category-nav";
import { HeaderSearch } from "@/components/header-search";

function SearchFallback() {
  return (
    <div className="h-10 w-full animate-pulse rounded-md border border-border bg-[#181818]" />
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-3 px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground shadow-[0_0_22px_rgba(239,68,68,0.35)]">
            <Play className="size-4 fill-current" />
          </span>
          <span className="text-lg font-black tracking-tight sm:text-xl">
            VIDEO<span className="text-primary">APP</span>
          </span>
        </Link>

        <div className="hidden min-w-0 flex-1 justify-center px-2 md:flex">
          <div className="w-full max-w-2xl">
            <Suspense fallback={<SearchFallback />}>
              <HeaderSearch />
            </Suspense>
          </div>
        </div>
      </div>

      <div className="px-4 pb-3 md:hidden">
        <Suspense fallback={<SearchFallback />}>
          <HeaderSearch />
        </Suspense>
      </div>

      <Suspense
        fallback={<div className="h-11 border-t border-border/70 bg-[#0d0d0d]" />}
      >
        <CategoryNav />
      </Suspense>
    </header>
  );
}