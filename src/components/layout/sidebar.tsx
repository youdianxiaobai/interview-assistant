"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Mic, Library, FileText } from "lucide-react";

const items = [
  { href: "/dashboard", label: "仪表盘", icon: LayoutDashboard },
  { href: "/interview/new", label: "模拟面试", icon: Mic },
  { href: "/question-bank", label: "题库", icon: Library },
  { href: "/resume", label: "简历", icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <nav className="w-56 border-r bg-muted/30 flex flex-col p-3 gap-1">
      <div className="h-14 flex items-center px-3 font-bold text-lg">面试助手</div>
      {items.map(({ href, label, icon: Icon }) => (
        <Link key={href} href={href} className={cn("flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors", pathname.startsWith(href) ? "bg-primary text-primary-foreground" : "hover:bg-muted")}>
          <Icon className="w-4 h-4" />{label}
        </Link>
      ))}
    </nav>
  );
}
