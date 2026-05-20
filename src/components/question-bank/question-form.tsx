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
import { Plus, Camera, Sparkles } from "lucide-react";
import { chat, chatWithImage } from "@/lib/ai/client";
import toast from "react-hot-toast";

export function QuestionForm() {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [position, setPosition] = useState("");
  const [type, setType] = useState<"tech" | "behavioral">("tech");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    "medium"
  );
  const [aiLoading, setAiLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { currentUserId } = useUserStore();
  const apiKey = useSettingsStore((s) => s.deepseekApiKey);
  const baseUrl = useSettingsStore((s) => s.deepseekBaseUrl);
  const model = useSettingsStore((s) => s.deepseekModel);
  const queryClient = useQueryClient();

  const handleSubmit = async () => {
    if (!content.trim() || !position.trim() || !currentUserId) return;
    await createQuestion({
      user_id: currentUserId,
      position,
      type,
      difficulty,
      source: "user",
      content,
      reference_answer: "",
      tags: [position],
    });
    queryClient.invalidateQueries({ queryKey: ["questions"] });
    toast.success("已添加");
    setContent("");
    setOpen(false);
  };

  const handleAI = async () => {
    if (!position.trim() || !apiKey) return;
    setAiLoading(true);
    try {
      const system =
        "你是资深面试官。请为指定岗位生成面试题。输出JSON: {\"content\":\"...\",\"reference_answer\":\"...\",\"tags\":[\"...\"]}";
      const userMsg = `岗位：${position}，题型：${type === "tech" ? "专业" : "行为"}，难度：${difficulty}`;
      const text = await chat(apiKey, system, userMsg, model, baseUrl);
      const j = JSON.parse(text);
      setContent(j.content);
    } catch {
      toast.error("AI 生成失败");
    } finally {
      setAiLoading(false);
    }
  };

  const handleOCR = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !apiKey) return;
    toast.loading("识别中...");
    const reader = new FileReader();
    reader.onload = async () => {
      const b64 = (reader.result as string).split(",")[1];
      try {
        const text = await chatWithImage(apiKey, "识别图片中的所有面试题目，纯文本输出。", b64, file.type, model, baseUrl);
        setContent(text);
        toast.dismiss();
        toast.success("识别完成");
      } catch {
        toast.dismiss();
        toast.error("OCR 失败");
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          添加题目
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>添加面试题</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>目标岗位</Label>
            <Input
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="如：跨境海运操作"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>题型</Label>
              <Select
                value={type}
                onValueChange={(v) => setType(v as "tech" | "behavioral")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tech">技术/专业面</SelectItem>
                  <SelectItem value="behavioral">行为面</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>难度</Label>
              <Select
                value={difficulty}
                onValueChange={(v) =>
                  setDifficulty(v as "easy" | "medium" | "hard")
                }
              >
                <SelectTrigger>
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
          <div>
            <Label>题目内容</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="输入题目..."
              rows={4}
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAI}
              disabled={aiLoading || !apiKey}
            >
              <Sparkles className="w-4 h-4 mr-1" />
              AI 生成
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
            >
              <Camera className="w-4 h-4 mr-1" />
              拍照 OCR
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleOCR}
            />
          </div>
          <Button onClick={handleSubmit} className="w-full">
            保存
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
