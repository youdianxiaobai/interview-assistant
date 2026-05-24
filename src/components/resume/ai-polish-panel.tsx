"use client";

import { useState } from "react";
import { useSettingsStore } from "@/lib/store/settings-store";
import { chat } from "@/lib/ai/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, ArrowRight } from "lucide-react";
import type { ResumeContent } from "@/types";
import toast from "react-hot-toast";

export function AiPolishPanel({
  resumeId,
  content,
  targetPosition,
}: {
  resumeId: string;
  content: ResumeContent;
  targetPosition: string;
}) {
  const apiKey = useSettingsStore((s) => s.deepseekApiKey);
  const model = useSettingsStore((s) => s.deepseekModel);
  const baseUrl = useSettingsStore((s) => s.deepseekBaseUrl);
  const [selectedSection, setSelectedSection] = useState("summary");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const getSectionText = () => {
    if (selectedSection === "summary") return content.summary;
    const entries = (content as unknown as Record<string, unknown>)[selectedSection];
    if (!entries) return "";
    return (entries as Array<Record<string, unknown>>)
      .map(
        (e) =>
          `${(e.title as string) || ""} at ${(e.organization as string) || ""}: ${(e.description as string) || ""}`
      )
      .join("\n");
  };

  const handlePolish = async () => {
    setLoading(true);
    try {
      const text = getSectionText();
      const resp = await chat(
        apiKey,
        "你是简历优化专家，擅长用 STAR 法则优化简历。直接输出优化文本，无需解释。",
        `优化以下简历${selectedSection === "summary" ? "个人简介" : "经历"}，目标岗位：${targetPosition}。内容：${text}。用STAR法则重写，突出与目标岗位匹配的关键词，更有冲击力和量化结果。`,
        model,
        baseUrl
      );
      setResult(resp);
      toast.success("润色完成");
    } catch (err) {
      console.error("AI 润色失败:", err);
      toast.error(`AI 润色失败: ${String(err).slice(0, 80)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-fade-in">
      {/* Controls */}
      <Card className="rounded-xl shadow-sm border border-border/40 bg-card">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Label className="text-sm whitespace-nowrap">
                润色段落
              </Label>
              <select
                className="border border-border/60 rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring/50"
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
              >
                <option value="summary">个人简介</option>
                <option value="experience">工作经历</option>
                <option value="projects">项目经历</option>
              </select>
            </div>
            <Button
              onClick={handlePolish}
              disabled={loading || !apiKey}
              className="rounded-xl"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {loading ? "润色中..." : "AI 润色"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Side-by-side */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="rounded-xl shadow-sm border border-border/40 bg-card">
          <CardContent className="pt-6">
            <Label className="mb-2 block text-sm text-muted-foreground">
              原文
            </Label>
            <Textarea
              value={getSectionText()}
              readOnly
              rows={8}
              className="rounded-xl resize-none bg-muted/30"
            />
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-sm border border-border/40 bg-card">
          <CardContent className="pt-6">
            <Label className="mb-2 block text-sm text-muted-foreground">
              AI 优化版
            </Label>
            {result ? (
              <div className="border border-border/60 rounded-xl p-4 min-h-[200px] whitespace-pre-wrap text-sm bg-background">
                {result}
              </div>
            ) : (
              <div className="border border-border/60 rounded-xl p-4 min-h-[200px] flex items-center justify-center text-sm text-muted-foreground bg-muted/30">
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  点击「AI 润色」生成优化版本
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
