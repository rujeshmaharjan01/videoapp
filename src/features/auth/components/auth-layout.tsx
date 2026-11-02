import { Play, ShieldCheck } from "lucide-react";
import Link from "next/link";

export const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-[#0a0a0a] p-6 md:p-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(239,68,68,0.14),transparent_55%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"
      />

      <div className="relative flex w-full max-w-sm flex-col gap-6">
        <Link
          href="/"
          className="flex items-center gap-2 self-center text-lg font-black tracking-tight"
        >
          <span className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground shadow-[0_0_22px_rgba(239,68,68,0.35)]">
            <Play className="size-4 fill-current" />
          </span>
          VIDEO<span className="text-primary">APP</span>
        </Link>

        {children}

        <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
          <ShieldCheck className="size-3.5 text-emerald-400" />
          Admin-only studio · Public sign-up is disabled
        </p>
      </div>
    </div>
  );
};
