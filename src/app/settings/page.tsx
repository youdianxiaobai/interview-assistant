"use client";
import { AppShell } from "@/components/layout/app-shell";
import { useSettingsStore } from "@/lib/store/settings-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const { deepseekApiKey, deepseekBaseUrl, deepseekModel, setDeepseekApiKey, setDeepseekBaseUrl, setDeepseekModel } = useSettingsStore();

  const handleSave = () => {
    toast.success("已保存");
  };

  return (
    <AppShell>
      <div className="max-w-lg mx-auto space-y-6">
        <h2 className="text-2xl font-bold">设置</h2>
        <Card>
          <CardHeader><CardTitle>DeepSeek API</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>API Key</Label>
              <Input type="password" value={deepseekApiKey} onChange={(e) => setDeepseekApiKey(e.target.value)} placeholder="sk-..." />
            </div>
            <div className="space-y-2">
              <Label>API 地址</Label>
              <Input value={deepseekBaseUrl} onChange={(e) => setDeepseekBaseUrl(e.target.value)} placeholder="https://api.deepseek.com" />
            </div>
            <div className="space-y-2">
              <Label>模型</Label>
              <Input value={deepseekModel} onChange={(e) => setDeepseekModel(e.target.value)} placeholder="deepseek-chat" />
            </div>
            <p className="text-xs text-muted-foreground">Key 仅保存在你的浏览器 localStorage 中，不会上传到任何服务器。默认使用 DeepSeek 官方 API。</p>
            <Button onClick={handleSave}>保存</Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
