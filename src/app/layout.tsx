import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import "@/app/globals.css";

export const metadata: Metadata = { title: "面试助手", description: "AI 模拟面试练习工具" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-background antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
