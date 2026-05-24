"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Mic,
  Library,
  FileText,
  Settings,
  Sparkles,
  Heart,
  Compass,
} from "lucide-react";

const primaryNav = [
  { href: "/dashboard", label: "仪表盘", icon: LayoutDashboard },
  { href: "/interview/new", label: "模拟面试", icon: Mic },
  { href: "/question-bank", label: "题库", icon: Library },
  { href: "/resume", label: "简历", icon: FileText },
];

const secondaryNav = [
  { href: "/career-planning", label: "岗位规划", icon: Compass },
  { href: "/wellness", label: "心理支持", icon: Heart },
  { href: "/settings", label: "设置", icon: Settings },
];

function NavItem({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      )}
    >
      <Icon
        className={cn(
          "w-4 h-4 flex-shrink-0 transition-transform duration-200",
          active ? "" : "group-hover:scale-110"
        )}
      />
      <span>{label}</span>
      {active && (
        <span className="absolute right-2 top-1/2 -translate-y-1/2 w-1 h-5 rounded-full bg-accent" />
      )}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 flex flex-col shrink-0 border-r border-border/60 bg-card/40 backdrop-blur-xl">
      {/* Brand */}
      <Link
        href="/dashboard"
        className="flex items-center gap-3 px-5 py-5 border-b border-border/40"
      >
        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shadow-sm">
          <Sparkles className="w-4.5 h-4.5 text-primary-foreground" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="font-display text-lg font-bold tracking-tight text-foreground">
            面试助手
          </span>
          <span className="text-[10px] text-muted-foreground tracking-wide uppercase">
            Interview Coach
          </span>
        </div>
      </Link>

      {/* Primary Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="px-3 mb-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
          核心功能
        </p>
        {primaryNav.map((item) => (
          <NavItem
            key={item.href}
            {...item}
            active={
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href))
            }
          />
        ))}

        <p className="px-3 mb-2 mt-6 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
          更多工具
        </p>
        {secondaryNav.map((item) => (
          <NavItem
            key={item.href}
            {...item}
            active={pathname.startsWith(item.href)}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-border/40">
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          AI 面试教练
          <br />
          助你拿下心仪 Offer
        </p>
      </div>
    </aside>
  );
}
