"use client";

import { Check, Share2 } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

export function ShareButton({
  title,
  className,
}: {
  title?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const input = document.createElement("textarea");
      input.value = url;
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
    }

    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button
      type="button"
      onClick={copyLink}
      aria-label={title ? `Copy link to ${title}` : "Copy link"}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-[#181818] px-3 text-xs font-semibold text-muted-foreground transition-colors hover:border-white/20 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        className,
      )}
    >
      {copied ? (
        <Check className="size-3.5 text-emerald-400" />
      ) : (
        <Share2 className="size-3.5" />
      )}
      {copied ? "Copied" : "Share"}
    </button>
  );
}
