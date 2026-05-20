"use client";
import { useState } from "react";
import { useSettingsStore } from "@/lib/store/settings-store";
import { chat } from "@/lib/ai/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sparkles } from "lucide-react";
import type { ResumeContent } from "@/types";
import toast from "react-hot-toast";

export function AiPolishPanel({ resumeId, content, targetPosition }: { resumeId: string; content: ResumeContent; targetPosition: string }) {
  const apiKey = useSettingsStore((s) => s.anthropicApiKey);
  const [selectedSection, setSelectedSection] = useState("summary");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const getSectionText = () => {
    if (selectedSection === "summary") return content.summary;
    const entries = (content as any)[selectedSection];
    if (!entries) return "";
    return entries.map((e: any) => `${e.title} at ${e.organization}: ${e.description}`).join("\n");
  };

  const handlePolish = async () => {
    setLoading(true);
    try {
      const text = getSectionText();
      const resp = await chat(apiKey, "你是简历优化专家，擅长用 STAR 法则优化简历。直接输出优化文本，无需解释。", `优化以下简历${selectedSection === "summary" ? "个人简介" : "经历"}，目标岗位：${targetPosition}。内容：${text}。用STAR法则重写，突出与目标岗位匹配的关键词，更有冲击力和量化结果。`);
      setResult(resp);
    } catch { toast.error("AI 润色失败"); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-4">
        <Label>选择润色段落</Label>
        <select className="border rounded p-2" value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)}>
          <option value="summary">个人简介</option>
          <option value="experience">工作经历</option>
          <option value="projects">项目经历</option>
        </select>
        <Button onClick={handlePolish} disabled={loading}><Sparkles className="w-4 h-4 mr-1" />{loading ? "润色中..." : "AI 润色"}</Button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><Label>原文</Label><Textarea value={getSectionText()} readOnly rows={8} /></div>
        <div><Label>AI 优化版</Label><div className="border rounded-md p-3 min-h-[200px] whitespace-pre-wrap text-sm">{result || "点击 AI 润色生成"}</div></div>
      </div>
    </div>
  );
}
