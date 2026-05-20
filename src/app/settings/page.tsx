"use client";
import { AppShell } from "@/components/layout/app-shell";
import { useSettingsStore } from "@/lib/store/settings-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const { anthropicApiKey, setAnthropicApiKey } = useSettingsStore();

  const handleSave = () => {
    toast.success("设置已保存");
  };

  return (
    <AppShell>
      <div className="max-w-lg mx-auto space-y-6">
        <h2 className="text-2xl font-bold">设置</h2>
        <Card>
          <CardHeader><CardTitle>API Key</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Anthropic API Key</Label>
              <Input type="password" value={anthropicApiKey} onChange={(e) => setAnthropicApiKey(e.target.value)} placeholder="sk-ant-..." />
              <p className="text-xs text-muted-foreground">Key 仅保存在你的浏览器 localStorage 中，不会上传到任何服务器。</p>
            </div>
            <Button onClick={handleSave}>保存</Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
