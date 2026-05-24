"use client";

import { useState, useRef } from "react";
import { useUserStore } from "@/lib/store/user-store";
import { useSettingsStore } from "@/lib/store/settings-store";
import { createQuestion } from "@/lib/supabase/queries/questions";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Camera, Sparkles, Loader2, FileText } from "lucide-react";
import { chat, chatWithImage } from "@/lib/ai/client";
import toast from "react-hot-toast";

type InputMode = "text" | "ai" | "ocr";

export function QuestionForm() {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [position, setPosition] = useState("");
  const [type, setType] = useState<"tech" | "behavioral">("tech");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [inputMode, setInputMode] = useState<InputMode>("text");
  const [aiLoading, setAiLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { currentUserId } = useUserStore();
  const apiKey = useSettingsStore((s) => s.deepseekApiKey);
  const baseUrl = useSettingsStore((s) => s.deepseekBaseUrl);
  const model = useSettingsStore((s) => s.deepseekModel);
  const queryClient = useQueryClient();

  const resetForm = () => {
    setContent("");
    setPosition("");
    setType("tech");
    setDifficulty("medium");
    setInputMode("text");
    setAiLoading(false);
  };

  const handleSubmit = async () => {
    if (!content.trim() || !position.trim() || !currentUserId) return;
    try {
      await createQuestion({
        user_id: currentUserId,
        position,
        type,
        difficulty,
        source: inputMode === "ai" ? "ai" : "user",
        content,
        reference_answer: "",
        tags: [position],
      });
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      toast.success("题目已添加");
      resetForm();
      setOpen(false);
    } catch (err) {
      console.error("创建题目失败:", err);
      toast.error("保存失败，请重试");
    }
  };

  const handleAI = async () => {
    if (!position.trim()) {
      toast.error("请先输入目标岗位");
      return;
    }
    if (!apiKey) {
      toast.error("请先在设置页面配置 API Key");
      return;
    }
    setAiLoading(true);
    try {
      const system =
        "你是资深面试官。请为指定岗位生成一道面试题。输出JSON格式: {\"content\":\"题目内容\",\"reference_answer\":\"参考答案\",\"tags\":[\"标签\"]}";
      const userMsg = `岗位：${position}，题型：${type === "tech" ? "技术/专业面" : "行为面"}，难度：${difficulty === "easy" ? "简单" : difficulty === "hard" ? "困难" : "中等"}`;
      const text = await chat(apiKey, system, userMsg, model, baseUrl);
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const j = JSON.parse(jsonMatch[0]);
        setContent(j.content || text);
      } else {
        setContent(text);
      }
      toast.success("AI 题目已生成");
    } catch (err) {
      console.error("AI 生成面试题失败:", err);
      toast.error(`AI 生成失败: ${String(err).slice(0, 80)}`);
    } finally {
      setAiLoading(false);
    }
  };

  const handleOCR = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!apiKey) {
      toast.error("请先在设置页面配置 API Key");
      return;
    }
    toast.loading("识别中...");
    const reader = new FileReader();
    reader.onload = async () => {
      const b64 = (reader.result as string).split(",")[1];
      try {
        const text = await chatWithImage(
          apiKey,
          "识别图片中的所有面试题目，用纯文本逐题输出。",
          b64,
          file.type,
          model,
          baseUrl
        );
        setContent(text);
        toast.dismiss();
        toast.success("识别完成");
      } catch (err) {
        toast.dismiss();
        console.error("OCR 识别失败:", err);
        toast.error(`OCR 失败: ${String(err).slice(0, 80)}`);
      }
    };
    reader.readAsDataURL(file);
    // Reset file input so the same file can be selected again
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>
        <Button className="rounded-xl gap-1.5 shadow-sm">
          <Plus className="w-4 h-4" />
          添加题目
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">添加面试题</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Position */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">目标岗位</Label>
            <Input
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="如：跨境电商运营"
              className="rounded-xl"
            />
          </div>

          {/* Type + Difficulty */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">题型</Label>
              <Select
                value={type}
                onValueChange={(v) => setType(v as "tech" | "behavioral")}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tech">技术 / 专业面</SelectItem>
                  <SelectItem value="behavioral">行为面</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">难度</Label>
              <Select
                value={difficulty}
                onValueChange={(v) =>
                  setDifficulty(v as "easy" | "medium" | "hard")
                }
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">简单</SelectItem>
                  <SelectItem value="medium">中等</SelectItem>
                  <SelectItem value="hard">困难</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Input mode tabs */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">录入方式</Label>
            <div className="flex gap-1 p-1 bg-muted/70 rounded-xl">
              {(
                [
                  { key: "text", icon: FileText, label: "文本输入" },
                  { key: "ai", icon: Sparkles, label: "AI 生成" },
                  { key: "ocr", icon: Camera, label: "拍照 OCR" },
                ] as const
              ).map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setInputMode(key)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                    inputMode === key
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Content area by mode */}
          {inputMode === "text" && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">题目内容</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="输入或粘贴面试题目..."
                rows={5}
                className="rounded-xl resize-none"
              />
            </div>
          )}

          {inputMode === "ai" && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">题目内容</Label>
              <div className="relative">
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="点击下方按钮，AI 将根据岗位和要求自动生成题目..."
                  rows={5}
                  className="rounded-xl resize-none pr-20"
                  readOnly={aiLoading}
                />
                <Button
                  size="sm"
                  onClick={handleAI}
                  disabled={aiLoading || !apiKey}
                  className="absolute bottom-3 right-3 rounded-xl gap-1.5"
                >
                  {aiLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      生成中
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      生成
                    </>
                  )}
                </Button>
              </div>
              {!apiKey && (
                <p className="text-xs text-muted-foreground">
                  请先在设置中配置 API Key
                </p>
              )}
            </div>
          )}

          {inputMode === "ocr" && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">题目内容</Label>
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-border/60 rounded-xl p-8 text-center cursor-pointer hover:border-primary/40 hover:bg-muted/40 transition-colors"
              >
                <Camera className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">点击拍照或选择图片</p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">
                  支持手机拍照、截图，自动识别题目文字
                </p>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleOCR}
              />
              {content && (
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="识别结果将显示在这里..."
                  rows={5}
                  className="rounded-xl resize-none"
                />
              )}
            </div>
          )}

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={!content.trim() || !position.trim() || !currentUserId}
            className="w-full rounded-xl"
          >
            保存题目
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
