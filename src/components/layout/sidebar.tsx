"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Mic, Library, FileText, Settings, Sparkles } from "lucide-react";

const items = [
  { href: "/dashboard", label: "仪表盘", icon: LayoutDashboard },
  { href: "/interview/new", label: "模拟面试", icon: Mic },
  { href: "/question-bank", label: "题库", icon: Library },
  { href: "/resume", label: "简历", icon: FileText },
  { href: "/settings", label: "设置", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <nav className="w-56 bg-white/80 backdrop-blur-sm border-r flex flex-col p-4 gap-1 shrink-0">
      {/* Logo */}
      <Link href="/dashboard" className="flex items-center gap-2.5 px-3 py-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="font-bold text-lg tracking-tight">面试助手</span>
      </Link>

      {/* Nav items */}
      <div className="space-y-0.5 flex-1">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </div>

      {/* Footer */}
      <div className="pt-3 border-t">
        <p className="text-xs text-muted-foreground px-3">
          AI 面试教练 · 助你拿 Offer
        </p>
      </div>
    </nav>
  );
}
