import { Play } from "lucide-react";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-[#0d0d0d]">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded bg-primary text-primary-foreground">
              <Play className="size-3.5 fill-current" />
            </span>
            <span className="text-base font-black tracking-tight">
              VIDEO<span className="text-primary">APP</span>
            </span>
          </Link>
        </div>

        <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-foreground">
            Home
          </Link>
          <Link
            href="/login"
            className="transition-colors hover:text-foreground"
          >
            Sign in
          </Link>
        </nav>
      </div>

      <div className="border-t border-border/70">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-1 px-4 py-4 text-[11px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 VideoApp. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
