import { LayoutDashboard, Upload, Video } from "lucide-react";
import Link from "next/link";

export const AppSidebar = () => {
  const navItems = [
    { title: "Videos", icon: Video, url: "/videos" },
    { title: "Upload", icon: Upload, url: "/videos/upload" },
  ];

  return (
    <nav className="flex h-full flex-col gap-4 p-4" aria-label="Admin navigation">
      <div className="flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Video className="size-4" />
        </span>
        <span className="text-sm font-semibold">VideoApp Studio</span>
      </div>

      <ul className="flex-1 space-y-1" role="list">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.title}>
              <Link
                href={item.url}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <Icon className="size-4" />
                {item.title}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="border-t border-border pt-4">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <LayoutDashboard className="size-4" />
          View public site
        </Link>
      </div>
    </nav>
  );
};