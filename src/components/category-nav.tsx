"use client";

import { Clock3, Flame } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { CATEGORIES } from "@/lib/catalog";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
  active: boolean;
  icon?: typeof Flame;
};

export function CategoryNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const category = searchParams.get("category");
  const sort = searchParams.get("sort");

  const onHome = pathname === "/";
  const isCategory = Boolean(category);
  const isTrending = onHome && sort === "views" && !isCategory;
  const isNewest = onHome && sort !== "views" && !isCategory;

  const items: NavItem[] = [
    {
      label: "Trending",
      href: "/?sort=views",
      active: isTrending,
      icon: Flame,
    },
    {
      label: "Newest",
      href: "/?sort=new",
      active: isNewest,
      icon: Clock3,
    },
    ...CATEGORIES.map((item) => ({
      label: item.name,
      href: `/?category=${item.slug}`,
      active: onHome && category === item.slug,
    })),
  ];

  return (
    <nav
      aria-label="Video categories"
      className="border-t border-border/70 bg-[#0d0d0d]"
    >
      <div className="no-scrollbar mx-auto flex max-w-[1600px] items-center gap-0.5 overflow-x-auto px-2 sm:px-4">
        <Link
          href="/"
          className={cn(
            "relative flex h-11 shrink-0 items-center px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-foreground",
            onHome && !isCategory && !isTrending && !isNewest
              ? "text-foreground after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-primary"
              : "",
          )}
        >
          Home
        </Link>
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "relative flex h-11 shrink-0 items-center gap-1.5 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-foreground",
                item.active
                  ? "text-foreground after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-primary"
                  : "",
              )}
            >
              {Icon ? <Icon className="size-3.5 text-primary" /> : null}
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
