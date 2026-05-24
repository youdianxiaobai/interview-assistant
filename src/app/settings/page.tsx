"use client";
import { AppShell } from "@/components/layout/app-shell";
import { useSettingsStore } from "@/lib/store/settings-store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Settings,
  Key,
  Globe,
  Cpu,
  Shield,
  Mic,
  Palette,
  Trash2,
  AlertTriangle,
  Check,
} from "lucide-react";
import toast from "react-hot-toast";
import { useState } from "react";

const DEEPSEEK_MODELS = [
  { value: "deepseek-chat", label: "DeepSeek Chat" },
  { value: "deepseek-reasoner", label: "DeepSeek Reasoner (R1)" },
  { value: "deepseek-v4-flash", label: "DeepSeek V4 Flash" },
];

export default function SettingsPage() {
  const {
    deepseekApiKey,
    deepseekBaseUrl,
    deepseekModel,
    setDeepseekApiKey,
    setDeepseekBaseUrl,
    setDeepseekModel,
  } = useSettingsStore();

  const [voiceSpeed, setVoiceSpeed] = useState(1.0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSave = () => {
    toast.success("已保存");
  };

  const handleClearData = () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }
    localStorage.clear();
    toast.success("本地数据已清除");
    setShowDeleteConfirm(false);
    // Reload to reset all zustand stores
    setTimeout(() => window.location.reload(), 500);
  };

  return (
    <AppShell>
      <div className="max-w-lg mx-auto space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-sm">
            <Settings className="w-5 h-5 text-primary-foreground" />
          </div>
          <h2 className="text-2xl font-bold font-display">设置</h2>
        </div>

        {/* API Configuration */}
        <Card className="rounded-xl shadow-sm border border-border/40 bg-card overflow-hidden">
          <CardHeader className="bg-muted/40 border-b border-border/20 pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Cpu className="w-4 h-4 text-primary" />
              DeepSeek API
            </CardTitle>
            <CardDescription>配置 AI 模型连接参数</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-sm font-medium">
                <Key className="w-3.5 h-3.5 text-muted-foreground" />
                API Key
              </Label>
              <Input
                type="password"
                value={deepseekApiKey}
                onChange={(e) => setDeepseekApiKey(e.target.value)}
                placeholder="sk-..."
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-sm font-medium">
                <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                API 地址
              </Label>
              <Input
                value={deepseekBaseUrl}
                onChange={(e) => setDeepseekBaseUrl(e.target.value)}
                placeholder="https://api.deepseek.com"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-sm font-medium">
                <Cpu className="w-3.5 h-3.5 text-muted-foreground" />
                模型
              </Label>
              <Select value={deepseekModel} onValueChange={setDeepseekModel}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="选择模型" />
                </SelectTrigger>
                <SelectContent>
                  {DEEPSEEK_MODELS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      <div className="flex items-center gap-2">
                        {m.value === deepseekModel && (
                          <Check className="w-3.5 h-3.5 text-primary" />
                        )}
                        {m.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="p-3 rounded-xl bg-accent/5 border border-accent/15 flex items-start gap-2">
              <Shield className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
              <p className="text-xs text-foreground/70 leading-relaxed">
                Key 仅保存在你的浏览器 localStorage 中，不会上传到任何服务器。默认使用 DeepSeek 官方 API。
              </p>
            </div>
            <Button
              onClick={handleSave}
              className="w-full rounded-xl bg-primary hover:bg-primary/90 shadow-sm"
            >
              保存设置
            </Button>
          </CardContent>
        </Card>

        {/* Voice Settings */}
        <Card className="rounded-xl shadow-sm border border-border/40 bg-card overflow-hidden">
          <CardHeader className="bg-muted/40 border-b border-border/20 pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Mic className="w-4 h-4 text-primary" />
              语音设置
            </CardTitle>
            <CardDescription>调整语音播报速度</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">语速</Label>
                <span className="text-sm text-muted-foreground tabular-nums">
                  {voiceSpeed.toFixed(1)}x
                </span>
              </div>
              <Slider
                value={[voiceSpeed]}
                onValueChange={([v]) => setVoiceSpeed(v)}
                min={0.5}
                max={2.0}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0.5x 慢速</span>
                <span>1.0x 正常</span>
                <span>2.0x 快速</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Theme Info */}
        <Card className="rounded-xl shadow-sm border border-border/40 bg-card overflow-hidden">
          <CardHeader className="bg-muted/40 border-b border-border/20 pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Palette className="w-4 h-4 text-primary" />
              外观
            </CardTitle>
            <CardDescription>主题模式切换</CardDescription>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
              <div>
                <p className="text-sm font-medium">主题切换</p>
                <p className="text-xs text-muted-foreground">
                  点击右上角太阳/月亮图标可在浅色、深色、跟随系统之间切换
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <Palette className="w-4 h-4 text-primary-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="rounded-xl shadow-sm border border-destructive/20 bg-card overflow-hidden">
          <CardHeader className="bg-destructive/5 border-b border-destructive/10 pb-4">
            <CardTitle className="text-lg flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-4 h-4" />
              危险操作
            </CardTitle>
            <CardDescription>不可逆的操作，请谨慎使用</CardDescription>
          </CardHeader>
          <CardContent className="pt-5 space-y-3">
            <p className="text-sm text-muted-foreground">
              清除所有本地存储的数据，包括 API Key、用户信息、面试记录等。此操作不可撤销。
            </p>
            {showDeleteConfirm && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20">
                <p className="text-sm font-medium text-destructive mb-2">
                  确定要清除所有本地数据吗？此操作不可撤销。
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="rounded-xl"
                    onClick={handleClearData}
                  >
                    <Trash2 className="w-4 h-4 mr-1.5" />
                    确认清除
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    取消
                  </Button>
                </div>
              </div>
            )}
            <Button
              variant="outline"
              className="w-full rounded-xl border-destructive/40 text-destructive hover:bg-destructive/5 hover:text-destructive"
              onClick={handleClearData}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {showDeleteConfirm ? "再次点击确认清除" : "清除本地数据"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
