"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="text-center max-w-sm space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto">
          <RefreshCcw className="w-7 h-7 text-destructive" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-display font-bold tracking-tight">出了点问题</h2>
          <p className="text-sm text-muted-foreground">
            页面加载时发生了意外错误，请尝试刷新页面。
          </p>
        </div>
        <Button onClick={reset} className="rounded-xl">
          <RefreshCcw className="w-4 h-4 mr-2" />
          重新加载
        </Button>
      </div>
    </div>
  );
}
