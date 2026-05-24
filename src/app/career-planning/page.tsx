"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { useSettingsStore } from "@/lib/store/settings-store";
import { useUserStore } from "@/lib/store/user-store";
import { chat, formatAIError } from "@/lib/ai/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Briefcase,
  Target,
  TrendingUp,
  Map,
  Sparkles,
  BarChart3,
  Compass,
  GraduationCap,
  ChevronRight,
  Play,
  ExternalLink,
  BookOpen,
  Clock,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Globe,
  Monitor,
  Bookmark,
  Zap,
} from "lucide-react";
import toast from "react-hot-toast";

interface CareerAnalysis {
  positionOverview: string;
  industryTrend: string;
  salaryRange: string;
  demandLevel: string;
  requiredSkills: { name: string; level: string; importance: string; howToLearn: string; resource: string }[];
  skillGap: { skill: string; current: string; target: string; gap: string; action: string }[];
  learningPath: { phase: string; duration: string; focus: string; milestones: string[]; resources: { name: string; url: string; type: string }[] }[];
  interviewFocus: string;
  careerPath: string;
  zeroBarrierStart: { step: string; what: string; where: string }[];
  keyResources: { category: string; items: { name: string; url: string; description: string }[] }[];
}

function analyzeCareer(
  apiKey: string,
  model: string,
  baseUrl: string,
  position: string,
  background: string,
): Promise<CareerAnalysis> {
  const system = `你是资深职业规划师和行业分析师。请对目标岗位进行深度分析，给出可落地的成长方案。

重要要求：
1. 所有推荐资源必须是真实存在的平台/课程/书籍/网站
2. 零基础入门方案必须具体到可直接执行
3. 每个技能都要有对应的学习方法和资源
4. 学习路径要有明确的时间节点和里程碑
5. 资源链接使用完整的URL（如 https://www.bilibili.com、https://www.coursera.org、https://www.zhihu.com 等知名平台的具体方向）

输出严格JSON（不要包含其他文字）：
{
  "positionOverview": "岗位概述、行业现状、发展趋势（120-150字）",
  "industryTrend": "行业趋势分析（80-100字）",
  "salaryRange": "薪资范围（应届-3年-5年-资深，具体数字区间）",
  "demandLevel": "市场需求评价（高/中/低，附50字说明）",
  "requiredSkills": [
    {"name": "技能名", "level": "精通/熟练/了解", "importance": "核心/重要/加分", "howToLearn": "具体学习方法（30字）", "resource": "推荐学习资源（平台+课程名/搜索关键词）"}
  ],
  "skillGap": [
    {"skill": "技能名", "current": "当前水平推测", "target": "目标水平", "gap": "差距描述（20字）", "action": "缩小差距的具体行动（40字）"}
  ],
  "learningPath": [
    {
      "phase": "阶段名（如：入门奠基、技能提升、实战进阶）",
      "duration": "预计时间（如：2-4周）",
      "focus": "本阶段重点（30字）",
      "milestones": ["里程碑1", "里程碑2", "里程碑3"],
      "resources": [
        {"name": "资源名称", "url": "https://...", "type": "课程/书籍/网站/社区/工具"}
      ]
    }
  ],
  "interviewFocus": "面试重点及准备策略（80-100字）",
  "careerPath": "该岗位5年职业发展路径：初级→中级→高级→专家/管理（100-120字）",
  "zeroBarrierStart": [
    {"step": "第1步（立即可以做的）", "what": "具体做什么", "where": "去哪里做/用什么工具"},
    {"step": "第2步", "what": "具体做什么", "where": "去哪里做/用什么工具"},
    {"step": "第3步", "what": "具体做什么", "where": "去哪里做/用什么工具"}
  ],
  "keyResources": [
    {
      "category": "资源类别（如：学习平台、行业资讯、社区交流、工具推荐）",
      "items": [
        {"name": "具体资源名", "url": "https://...", "description": "一句话说明有什么用"}
      ]
    }
  ]
}`;

  const userMsg = `目标岗位：${position}
个人背景：${background || "未提供（假设为零基础转行者）"}

请基于当前市场情况，给出全面且可落地的职业规划分析。所有推荐资源必须是真实可用的。`;

  return chat(apiKey, system, userMsg, model, baseUrl).then((r) => JSON.parse(r));
}

function levelBadgeVariant(level: string) {
  if (level === "精通" || level === "核心") return "destructive";
  if (level === "熟练" || level === "重要") return "default";
  return "secondary";
}

function importanceBadge(imp: string) {
  if (imp === "核心") return <Badge variant="destructive" className="rounded-lg text-xs">核心</Badge>;
  if (imp === "重要") return <Badge variant="default" className="rounded-lg text-xs">重要</Badge>;
  return <Badge variant="secondary" className="rounded-lg text-xs">加分</Badge>;
}

export default function CareerPlanningPage() {
  const router = useRouter();
  const apiKey = useSettingsStore((s) => s.deepseekApiKey);
  const model = useSettingsStore((s) => s.deepseekModel);
  const baseUrl = useSettingsStore((s) => s.deepseekBaseUrl);
  const currentUser = useUserStore((s) => {
    const p = s.profiles.find((x) => x.id === s.currentUserId);
    return p;
  });

  const [position, setPosition] = useState(currentUser?.role || "");
  const [background, setBackground] = useState("");
  const storageKey = `career-analysis-${currentUser?.id ?? "anon"}-${position}`;
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<CareerAnalysis | null>(null);
  const [error, setError] = useState("");

  // Load persisted analysis on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) setAnalysis(JSON.parse(saved));
    } catch { /* ignore corrupt data */ }
  }, [storageKey]);

  // Persist analysis whenever it changes
  useEffect(() => {
    if (analysis) {
      localStorage.setItem(storageKey, JSON.stringify(analysis));
    }
  }, [analysis, storageKey]);

  const handleAnalyze = async () => {
    if (!position.trim() || !apiKey) return;
    setLoading(true);
    setError("");
    try {
      const result = await analyzeCareer(apiKey, model, baseUrl, position, background);
      setAnalysis(result);
      toast.success("分析完成！往下拉查看完整规划");
    } catch (err) {
      const msg = formatAIError(err);
      console.error("职业规划分析失败:", msg);
      setError(msg);
      toast.error(`分析失败: ${msg}`);
    }
    setLoading(false);
  };

  const resourceTypeIcon = (type: string) => {
    if (type.includes("课程")) return <Monitor className="w-3 h-3" />;
    if (type.includes("书籍")) return <BookOpen className="w-3 h-3" />;
    if (type.includes("网站") || type.includes("社区")) return <Globe className="w-3 h-3" />;
    return <Bookmark className="w-3 h-3" />;
  };

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-sm">
            <Compass className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-2xl font-bold font-display">岗位规划</h2>
            <p className="text-sm text-muted-foreground">AI 深度分析岗位要求，给出可落地的成长方案和具体资源</p>
          </div>
        </div>

        {/* Input form */}
        <Card className="rounded-xl shadow-sm border border-border/40 bg-card">
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-accent" />
                  目标岗位
                </Label>
                <Input
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="如：跨境电商运营、物流主管、供应链管理..."
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-primary/60" />
                  当前背景
                </Label>
                <Input
                  value={background}
                  onChange={(e) => setBackground(e.target.value)}
                  placeholder="如：物流工程应届生、有2年外贸经验、零基础转行..."
                  className="rounded-xl"
                />
              </div>
            </div>
            <Button
              onClick={handleAnalyze}
              disabled={!position.trim() || loading || !apiKey}
              className="w-full rounded-xl bg-primary hover:bg-primary/90 shadow-sm"
              size="lg"
            >
              {loading ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                  AI 深度分析中，请稍候...
                </>
              ) : (
                <>
                  <Compass className="w-4 h-4 mr-2" />
                  开始岗位分析
                </>
              )}
            </Button>
            {!apiKey && (
              <p className="text-xs text-accent text-center">请先在设置页面配置 DeepSeek API Key</p>
            )}
            {error && (
              <p className="text-xs text-destructive text-center bg-destructive/10 rounded-xl p-3">{error}</p>
            )}
          </CardContent>
        </Card>

        {/* Analysis Results */}
        {analysis && (
          <div className="space-y-6">
            {/* ======== 1. Overview Cards ======== */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card className="rounded-xl border border-border/40 bg-card">
                <CardContent className="p-4">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                    <Briefcase className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-xs text-muted-foreground">市场需求</p>
                  <p className="font-semibold text-sm text-foreground">{analysis.demandLevel}</p>
                </CardContent>
              </Card>
              <Card className="rounded-xl border border-border/40 bg-card">
                <CardContent className="p-4">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center mb-2">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="text-xs text-muted-foreground">薪资参考</p>
                  <p className="font-semibold text-xs text-foreground line-clamp-2">{analysis.salaryRange}</p>
                </CardContent>
              </Card>
              <Card className="rounded-xl border border-border/40 bg-card">
                <CardContent className="p-4">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center mb-2">
                    <TrendingUp className="w-4 h-4 text-amber-600" />
                  </div>
                  <p className="text-xs text-muted-foreground">行业趋势</p>
                  <p className="font-semibold text-xs text-foreground line-clamp-2">{analysis.industryTrend}</p>
                </CardContent>
              </Card>
              <Card className="rounded-xl border border-border/40 bg-card">
                <CardContent className="p-4">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center mb-2">
                    <AlertCircle className="w-4 h-4 text-purple-600" />
                  </div>
                  <p className="text-xs text-muted-foreground">岗位概述</p>
                  <p className="font-semibold text-xs text-foreground line-clamp-2">{analysis.positionOverview}</p>
                </CardContent>
              </Card>
            </div>

            {/* ======== 2. Zero-barrier Start (MOST IMPORTANT - at top) ======== */}
            <Card className="rounded-xl shadow-sm border-2 border-emerald-200 bg-emerald-50/30 overflow-hidden">
              <div className="bg-emerald-500 px-5 py-3 text-white">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  <h3 className="font-semibold">零基础 · 立即上手（今天就能开始）</h3>
                </div>
              </div>
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground mb-4">
                  不需要任何前置知识，跟着这三步，现在就可以踏上{position}的学习之路
                </p>
                <div className="space-y-3">
                  {analysis.zeroBarrierStart.map((item, i) => (
                    <div key={i} className="flex gap-3 p-3 rounded-xl bg-white border border-emerald-100">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {i + 1}
                      </div>
                      <div className="space-y-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground">{item.step}</p>
                        <p className="text-sm text-foreground/80">{item.what}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <ExternalLink className="w-3 h-3" /> {item.where}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* ======== 3. Required Skills + How to Learn ======== */}
            <Card className="rounded-xl shadow-sm border border-border/40 bg-card">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-accent" />
                  </div>
                  <h3 className="font-semibold">岗位技能全景图</h3>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {analysis.requiredSkills.map((s, i) => (
                    <div key={i} className="p-4 rounded-xl bg-muted/30 border border-border/30">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{s.name}</span>
                          {importanceBadge(s.importance)}
                        </div>
                        <Badge variant={levelBadgeVariant(s.level)} className="rounded-lg text-xs">
                          {s.level}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        <span className="font-medium">怎么学：</span>{s.howToLearn}
                      </p>
                      <p className="text-xs text-primary/70 flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        <span className="font-medium">资源推荐：</span>{s.resource}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* ======== 4. Learning Path (Detailed Timeline) ======== */}
            <Card className="rounded-xl shadow-sm border border-border/40 bg-card">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Map className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="font-semibold">学习路线图（从入门到精通）</h3>
                </div>
                <div className="space-y-4">
                  {analysis.learningPath.map((p, i) => (
                    <div key={i} className="relative pl-10 pb-4 border-l-2 border-primary/25 last:border-transparent last:pb-0">
                      <div className="absolute left-0 top-0 -translate-x-1/2 w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shadow-sm">
                        {i + 1}
                      </div>
                      <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-semibold text-sm text-foreground">{p.phase}</p>
                          <Badge className="rounded-lg text-xs flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {p.duration}
                          </Badge>
                        </div>
                        <p className="text-sm text-foreground/70 mb-3">{p.focus}</p>
                        {/* Milestones */}
                        <div className="space-y-1.5 mb-3">
                          <p className="text-xs font-semibold text-muted-foreground">里程碑</p>
                          {p.milestones.map((m, j) => (
                            <div key={j} className="flex items-center gap-2 text-xs text-foreground/70">
                              <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                              {m}
                            </div>
                          ))}
                        </div>
                        {/* Resources */}
                        <div className="space-y-1.5">
                          <p className="text-xs font-semibold text-muted-foreground">推荐资源</p>
                          {p.resources.map((r, j) => (
                            <a
                              key={j}
                              href={r.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-xs text-primary hover:underline bg-white rounded-lg px-2.5 py-1.5 border border-border/30"
                            >
                              {resourceTypeIcon(r.type)}
                              <span className="font-medium">{r.name}</span>
                              <Badge variant="outline" className="text-[10px] rounded-md ml-auto">{r.type}</Badge>
                            </a>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* ======== 5. Skill Gap Analysis ======== */}
            {analysis.skillGap.length > 0 && (
              <Card className="rounded-xl shadow-sm border border-border/40 bg-card">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-warning/20 flex items-center justify-center">
                      <Target className="w-4 h-4 text-warning" />
                    </div>
                    <h3 className="font-semibold">技能差距分析 & 行动计划</h3>
                  </div>
                  <div className="space-y-2">
                    {analysis.skillGap.map((g, i) => (
                      <div key={i} className="p-4 rounded-xl bg-amber-50/50 border border-amber-100">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-sm">{g.skill}</p>
                          <Badge variant="outline" className="text-xs rounded-lg border-amber-300 text-amber-700">
                            {g.gap}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          {g.current} → <span className="text-foreground font-medium">{g.target}</span>
                        </p>
                        <p className="text-xs text-foreground/70 flex items-start gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />
                          {g.action}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ======== 6. Career Path ======== */}
            <Card className="rounded-xl shadow-sm border border-border/40 bg-card">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="font-semibold">5年职业发展路径</h3>
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed bg-muted/30 rounded-xl p-4">
                  {analysis.careerPath}
                </p>
              </CardContent>
            </Card>

            {/* ======== 7. Interview Strategy ======== */}
            <Card className="rounded-xl shadow-sm border border-border/40 bg-card">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
                    <Target className="w-4 h-4 text-accent" />
                  </div>
                  <h3 className="font-semibold">面试准备策略</h3>
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed bg-accent/5 rounded-xl p-4 border border-accent/10">
                  {analysis.interviewFocus}
                </p>
              </CardContent>
            </Card>

            {/* ======== 8. Key Resources Directory ======== */}
            <Card className="rounded-xl shadow-sm border border-border/40 bg-card">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Bookmark className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="font-semibold">资源工具箱（点击直达）</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {analysis.keyResources.map((cat, i) => (
                    <div key={i} className="p-4 rounded-xl bg-muted/30 border border-border/30">
                      <p className="font-semibold text-sm mb-2 text-foreground">{cat.category}</p>
                      <div className="space-y-1.5">
                        {cat.items.map((item, j) => (
                          <a
                            key={j}
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-xs p-2 rounded-lg hover:bg-background transition-colors border border-transparent hover:border-border/40"
                          >
                            <span className="font-medium text-primary">{item.name}</span>
                            <span className="text-muted-foreground ml-1.5">{item.description}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* ======== 9. CTA ======== */}
            <div className="flex items-center justify-center gap-3 pt-2 pb-8">
              <Button
                onClick={() => router.push("/interview/new")}
                className="rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground shadow-sm"
                size="lg"
              >
                <Play className="w-4 h-4 mr-2" />
                针对{position}开始模拟面试
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
