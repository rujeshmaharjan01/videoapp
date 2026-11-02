import { Clock3, Flame } from "lucide-react";
import Link from "next/link";

import { buildHomeQuery } from "@/lib/catalog";
import { cn } from "@/lib/utils";

export function SortLinks({
  sort,
  query,
  category,
  tag,
}: {
  sort: "new" | "views";
  query?: string;
  category?: string;
  tag?: string;
}) {
  const options = [
    {
      value: "new" as const,
      label: "Newest",
      icon: Clock3,
    },
    {
      value: "views" as const,
      label: "Most viewed",
      icon: Flame,
    },
  ];

  return (
    <div className="flex items-center gap-1 rounded-md border border-border bg-[#141414] p-1">
      {options.map((option) => {
        const Icon = option.icon;
        const active = sort === option.value;
        return (
          <Link
            key={option.value}
            href={buildHomeQuery({
              q: query,
              category,
              tag,
              sort: option.value,
            })}
            className={cn(
              "inline-flex h-7 items-center gap-1.5 rounded px-2.5 text-[11px] font-semibold transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-3.5" />
            {option.label}
          </Link>
        );
      })}
    </div>
  );
}
