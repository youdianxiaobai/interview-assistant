"use client";
import { Sidebar } from "./sidebar";
import { UserSwitcher } from "./user-switcher";
import { ThemeToggle } from "@/components/theme-toggle";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-14 border-b border-border/50 bg-card/40 backdrop-blur-xl flex items-center justify-between px-6 shrink-0">
          <div />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <UserSwitcher />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto scroll-smooth">
          <div className="p-6 animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
  );
}
