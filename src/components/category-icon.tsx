import {
  Clapperboard,
  Cpu,
  Film,
  Gamepad2,
  GraduationCap,
  Music2,
  Plane,
  Trophy,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  film: Clapperboard,
  music: Music2,
  gaming: Gamepad2,
  tech: Cpu,
  travel: Plane,
  education: GraduationCap,
  sports: Trophy,
};

export function CategoryIcon({
  category,
  className,
  strokeWidth = 1.5,
}: {
  category: string;
  className?: string;
  strokeWidth?: number;
}) {
  const Icon = ICONS[category] ?? Film;
  return <Icon aria-hidden="true" className={cn(className)} strokeWidth={strokeWidth} />;
}
