import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

function pageWindow(page: number, totalPages: number): number[] {
  const size = Math.min(5, totalPages);
  let start = Math.max(1, page - Math.floor(size / 2));
  const end = Math.min(totalPages, start + size - 1);
  start = Math.max(1, end - size + 1);

  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

export function Pagination({
  page,
  totalPages,
  buildHref,
}: {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  const pages = pageWindow(page, totalPages);

  return (
    <nav
      aria-label="Pagination"
      className="mt-10 flex flex-wrap items-center justify-center gap-1.5"
    >
      <Link
        href={buildHref(page - 1)}
        aria-disabled={page <= 1}
        className={cn(
          "inline-flex h-9 items-center gap-1 rounded-md border border-border bg-[#151515] px-3 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground",
          page <= 1 && "pointer-events-none opacity-40",
        )}
      >
        <ChevronLeft className="size-3.5" />
        Prev
      </Link>

      {pages.map((item) => (
        <Link
          key={item}
          href={buildHref(item)}
          aria-current={item === page ? "page" : undefined}
          className={cn(
            "inline-flex size-9 items-center justify-center rounded-md border text-xs font-semibold transition-colors",
            item === page
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-[#151515] text-muted-foreground hover:border-white/20 hover:text-foreground",
          )}
        >
          {item}
        </Link>
      ))}

      <Link
        href={buildHref(page + 1)}
        aria-disabled={page >= totalPages}
        className={cn(
          "inline-flex h-9 items-center gap-1 rounded-md border border-border bg-[#151515] px-3 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground",
          page >= totalPages && "pointer-events-none opacity-40",
        )}
      >
        Next
        <ChevronRight className="size-3.5" />
      </Link>
    </nav>
  );
}
