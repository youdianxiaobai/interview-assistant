"use client";

/**
 * JD 智能匹配面板 — 粘贴JD -> AI解析关键词 -> 匹配度分项评分
 * 路径: src/components/resume/jd-match-panel.tsx
 */
import { useState, useRef } from "react";
import { useSettingsStore } from "@/lib/store/settings-store";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Sparkles,
  Upload,
  FileText,
  Target,
  BarChart3,
  Lightbulb,
} from "lucide-react";
import toast from "react-hot-toast";
import ReactMarkdown from "react-markdown";

// --------------- types ---------------
interface JDMatchResult {
  jdKeywords: string[];
  coreCompetencies: { name: string; level: string }[];
  matchScore: number;
  skillMatch: number;
  experienceMatch: number;
  educationMatch: number;
  gapAnalysis: string;
  optimizationTips: string;
}

interface Props {
  resumeId: string;
  userId: string;
  resumeContent: Record<string, unknown>;
}

// --------------- helpers ---------------
function levelColor(level: string) {
  if (level === "精通") return "bg-primary text-primary-foreground";
  if (level === "熟练") return "bg-accent text-accent-foreground";
  return "bg-muted text-muted-foreground";
}

// --------------- component ---------------
export function JDMatchPanel({ resumeId, userId, resumeContent }: Props) {
  const apiKey = useSettingsStore((s) => s.deepseekApiKey);
  const model = useSettingsStore((s) => s.deepseekModel);
  const baseUrl = useSettingsStore((s) => s.deepseekBaseUrl);

  const [jdText, setJdText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<JDMatchResult | null>(null);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const extractText = async (file: File): Promise<string> => {
    if (file.type === "text/plain" || file.name.endsWith(".md")) {
      return await file.text();
    }
    toast.error("暂不支持此文件格式，请直接粘贴JD文本");
    throw new Error("不支持的文件格式");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await extractText(file);
      setJdText(text.slice(0, 5000));
      toast.success("文件已加载");
    } catch {
      /* handled */
    }
  };

  const handleAnalyze = async () => {
    if (!jdText.trim() || !apiKey) return;
    setLoading(true);
    setError("");

    const system = `你是资深招聘专家和简历优化师。请分析以下岗位JD，并评估候选人的简历匹配度。

JD文本：
${jdText.slice(0, 3000)}

候选人简历：
${JSON.stringify(resumeContent).slice(0, 3000)}

请输出严格JSON（不要包含其他文字）：
{
  "jdKeywords": ["JD关键要求词1", "词2", ...],
  "coreCompetencies": [{"name": "核心能力", "level": "精通/熟练/了解"}],
  "matchScore": 数字(0-100 综合匹配度),
  "skillMatch": 数字(0-100 技能匹配),
  "experienceMatch": 数字(0-100 经验匹配),
  "educationMatch": 数字(0-100 教育匹配),
  "gapAnalysis": "差距分析（60-100字）",
  "optimizationTips": "简历优化建议，包含应补充的关键词、话术调整、经历包装建议（100-200字）"
}`;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      const resp = await fetch(
        `${baseUrl || "https://api.deepseek.com"}/v1/chat/completions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: model || "deepseek-v4-flash",
            max_tokens: 4096,
            messages: [
              { role: "system", content: system },
              { role: "user", content: "请分析JD并评估匹配度。" },
            ],
          }),
          signal: controller.signal,
        }
      );
      clearTimeout(timeout);

      if (!resp.ok) throw new Error(`API错误: ${resp.status}`);
      const data = await resp.json();
      const text = data.choices?.[0]?.message?.content || "";
      const jsonMatch =
        text.match(/```(?:json)?\s*([\s\S]*?)```/) ||
        text.match(/(\{[\s\S]*\})/);
      const parsed: JDMatchResult = JSON.parse(
        jsonMatch ? jsonMatch[1] || jsonMatch[0] : text
      );

      setResult(parsed);

      // Save to DB
      await supabase.from("jd_analyses").insert({
        user_id: userId,
        resume_id: resumeId,
        jd_text: jdText.slice(0, 5000),
        jd_keywords: parsed.jdKeywords,
        core_competencies: parsed.coreCompetencies,
        match_score: parsed.matchScore,
        skill_match: parsed.skillMatch,
        experience_match: parsed.experienceMatch,
        education_match: parsed.educationMatch,
        gap_analysis: parsed.gapAnalysis,
        optimization_tips: parsed.optimizationTips,
      });

      toast.success("匹配分析完成");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "未知错误";
      setError(msg);
      toast.error(msg);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* ----- Input ----- */}
      <Card className="rounded-xl shadow-sm border border-border/40 bg-card">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <FileText className="w-4 h-4 text-primary-foreground" />
            </div>
            <h3 className="font-display font-semibold text-foreground">
              岗位 JD 智能匹配
            </h3>
          </div>
          <p className="text-sm text-muted-foreground">
            粘贴目标岗位的JD描述，AI 自动解析关键词并评估匹配度
          </p>
          <Textarea
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            placeholder="粘贴岗位JD描述..."
            rows={6}
            className="rounded-xl resize-none"
          />
          <div className="flex gap-2">
            <Button
              onClick={() => fileRef.current?.click()}
              variant="outline"
              className="rounded-xl"
              disabled={loading}
            >
              <Upload className="w-4 h-4 mr-1.5" />
              上传文件
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".txt,.md,.pdf,.doc,.docx"
              className="hidden"
              onChange={handleFileUpload}
            />
            <Button
              onClick={handleAnalyze}
              disabled={!jdText.trim() || loading || !apiKey}
              className="flex-1 rounded-xl"
            >
              {loading ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                  分析中...
                </>
              ) : (
                <>
                  <Target className="w-4 h-4 mr-2" />
                  开始匹配分析
                </>
              )}
            </Button>
          </div>
          {error && (
            <p className="text-xs text-destructive bg-destructive/10 rounded-xl p-3">
              {error}
            </p>
          )}
        </CardContent>
      </Card>

      {/* ----- Results ----- */}
      {result && (
        <div className="space-y-4">
          {/* Overall score */}
          <Card className="rounded-xl shadow-sm border border-border/40 bg-card overflow-hidden">
            <div className="bg-primary p-6 text-center text-primary-foreground">
              <p className="text-primary-foreground/70 text-sm mb-1">
                综合匹配度
              </p>
              <p className="text-5xl font-display font-bold tabular-nums">
                {result.matchScore}
                <span className="text-lg text-primary-foreground/50">
                  /100
                </span>
              </p>
            </div>
            <CardContent className="p-5">
              <div className="grid grid-cols-3 gap-4">
                {[
                  {
                    label: "技能匹配",
                    score: result.skillMatch,
                    color: "bg-primary",
                  },
                  {
                    label: "经验匹配",
                    score: result.experienceMatch,
                    color: "bg-accent",
                  },
                  {
                    label: "教育匹配",
                    score: result.educationMatch,
                    color: "bg-[hsl(140,18%,45%)]",
                  },
                ].map(({ label, score, color }) => (
                  <div key={label} className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">
                      {label}
                    </p>
                    <p className="text-2xl font-bold tabular-nums">
                      {score}
                      <span className="text-sm text-muted-foreground/50">
                        %
                      </span>
                    </p>
                    <Progress
                      value={score}
                      className={`h-1.5 mt-1 [&>div]:${color}`}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Keywords */}
          <Card className="rounded-xl shadow-sm border border-border/40 bg-card">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                <h4 className="font-display font-semibold text-sm">
                  JD 关键要求
                </h4>
              </div>
              <div className="flex gap-2 flex-wrap">
                {result.jdKeywords.map((kw, i) => (
                  <Badge key={i} variant="secondary" className="rounded-lg">
                    {kw}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Core competencies */}
          <Card className="rounded-xl shadow-sm border border-border/40 bg-card">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-accent" />
                <h4 className="font-display font-semibold text-sm">
                  核心能力要求
                </h4>
              </div>
              <div className="space-y-2">
                {result.coreCompetencies.map((c, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 rounded-xl bg-muted/50"
                  >
                    <span className="text-sm">{c.name}</span>
                    <Badge className={`rounded-lg ${levelColor(c.level)}`}>
                      {c.level}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Gap + Tips */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="rounded-xl shadow-sm border border-border/40 bg-card">
              <CardContent className="p-5 space-y-2">
                <h4 className="font-display font-semibold text-sm text-primary">
                  差距分析
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {result.gapAnalysis}
                </p>
              </CardContent>
            </Card>
            <Card className="rounded-xl shadow-sm border border-border/40 bg-card">
              <CardContent className="p-5 space-y-2">
                <h4 className="font-display font-semibold text-sm text-[hsl(140,18%,45%)]">
                  <Lightbulb className="w-4 h-4 inline mr-1" />
                  优化建议
                </h4>
                <div className="text-xs text-muted-foreground leading-relaxed prose prose-sm">
                  <ReactMarkdown>{result.optimizationTips}</ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
