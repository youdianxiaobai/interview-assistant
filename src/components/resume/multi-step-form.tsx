"use client";

/**
 * 简历多步骤表单 — 5步填写 + 进度条
 * 路径: src/components/resume/multi-step-form.tsx
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  User,
  BookOpen,
  Briefcase,
  Wrench,
  Target,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";

// --------------- types ---------------
const STEPS = [
  { id: "basic", label: "基本信息", icon: User },
  { id: "education", label: "教育经历", icon: BookOpen },
  { id: "experience", label: "实习/项目", icon: Briefcase },
  { id: "skills", label: "技能证书", icon: Wrench },
  { id: "target", label: "求职意向", icon: Target },
] as const;

type StepId = (typeof STEPS)[number]["id"];

export interface ResumeFormData {
  name: string;
  phone: string;
  email: string;
  summary: string;
  education: {
    school: string;
    major: string;
    degree: string;
    start: string;
    end: string;
    highlights: string;
  }[];
  experience: {
    title: string;
    organization: string;
    start: string;
    end: string;
    description: string;
    highlights: string;
  }[];
  projects: {
    title: string;
    organization: string;
    start: string;
    end: string;
    description: string;
    highlights: string;
  }[];
  skills: string[];
  certifications: string[];
  targetPosition: string;
  targetIndustry: string;
}

const DEFAULT_DATA: ResumeFormData = {
  name: "",
  phone: "",
  email: "",
  summary: "",
  education: [
    {
      school: "",
      major: "",
      degree: "本科",
      start: "",
      end: "",
      highlights: "",
    },
  ],
  experience: [
    {
      title: "",
      organization: "",
      start: "",
      end: "",
      description: "",
      highlights: "",
    },
  ],
  projects: [
    {
      title: "",
      organization: "",
      start: "",
      end: "",
      description: "",
      highlights: "",
    },
  ],
  skills: [""],
  certifications: [""],
  targetPosition: "",
  targetIndustry: "",
};

interface Props {
  initial?: Partial<ResumeFormData>;
  onSave: (data: ResumeFormData) => Promise<void>;
  onAI?: () => void;
  aiLoading?: boolean;
}

// --------------- component ---------------
export function MultiStepResumeForm({
  initial,
  onSave,
  onAI,
  aiLoading,
}: Props) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<ResumeFormData>({
    ...DEFAULT_DATA,
    ...initial,
  });
  const [saving, setSaving] = useState(false);

  const update = (field: string, value: unknown) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const updateArrayItem = (
    field: "education" | "experience" | "projects",
    index: number,
    key: string,
    value: string
  ) => {
    setData((prev) => {
      const arr = [...prev[field]] as Record<string, string>[];
      arr[index] = { ...arr[index], [key]: value };
      return { ...prev, [field]: arr };
    });
  };

  const addArrayItem = (
    field: "education" | "experience" | "projects"
  ) => {
    const empty =
      field === "education"
        ? {
            school: "",
            major: "",
            degree: "本科",
            start: "",
            end: "",
            highlights: "",
          }
        : {
            title: "",
            organization: "",
            start: "",
            end: "",
            description: "",
            highlights: "",
          };
    setData((prev) => ({
      ...prev,
      [field]: [...prev[field], empty as never],
    }));
  };

  const removeArrayItem = (
    field: "education" | "experience" | "projects",
    index: number
  ) => {
    setData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const addStringItem = (field: "skills" | "certifications") => {
    setData((prev) => ({
      ...prev,
      [field]: [...prev[field], ""],
    }));
  };

  const updateStringItem = (
    field: "skills" | "certifications",
    index: number,
    value: string
  ) => {
    setData((prev) => {
      const arr = [...prev[field]];
      arr[index] = value;
      return { ...prev, [field]: arr };
    });
  };

  const removeStringItem = (
    field: "skills" | "certifications",
    index: number
  ) => {
    setData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(data);
      toast.success("简历已保存");
    } catch {
      toast.error("保存失败");
    }
    setSaving(false);
  };

  const StepIcon = STEPS[step].icon;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* ---------- Progress ---------- */}
      <Card className="rounded-xl shadow-sm border border-border/40 bg-card">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <StepIcon className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-foreground">
              第 {step + 1} 步 / 共 {STEPS.length} 步 — {STEPS[step].label}
            </span>
          </div>
          <Progress
            value={((step + 1) / STEPS.length) * 100}
            className="h-2"
          />
          <div className="flex justify-between mt-2">
            {STEPS.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setStep(i)}
                className={`text-xs px-2 py-1 rounded-lg transition-colors ${
                  i === step
                    ? "bg-primary/10 text-primary font-medium"
                    : i < step
                      ? "text-[hsl(140,18%,45%)]"
                      : "text-muted-foreground"
                }`}
              >
                {i < step ? (
                  <Check className="w-3 h-3 inline mr-0.5" />
                ) : null}
                {s.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ---------- Step content ---------- */}
      <Card className="rounded-xl shadow-sm border border-border/40 bg-card">
        <CardContent className="p-6 space-y-4">
          {/* 1. Basic Info */}
          {step === 0 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="font-display font-semibold text-lg text-foreground">
                基本信息
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>姓名</Label>
                  <Input
                    value={data.name}
                    onChange={(e) => update("name", e.target.value)}
                    placeholder="你的姓名"
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <Label>手机</Label>
                  <Input
                    value={data.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    placeholder="手机号"
                    className="rounded-xl"
                  />
                </div>
              </div>
              <div>
                <Label>邮箱</Label>
                <Input
                  value={data.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="邮箱地址"
                  className="rounded-xl"
                />
              </div>
              <div>
                <Label>个人简介</Label>
                <Textarea
                  value={data.summary}
                  onChange={(e) => update("summary", e.target.value)}
                  placeholder="3-5句话概括你的优势和职业目标..."
                  rows={4}
                  className="rounded-xl resize-none"
                />
              </div>
            </div>
          )}

          {/* 2. Education */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-semibold text-lg text-foreground">
                  教育经历
                </h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addArrayItem("education")}
                  className="rounded-xl"
                >
                  + 添加
                </Button>
              </div>
              {data.education.map((edu, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl border border-border/40 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">
                      # {i + 1}
                    </span>
                    {data.education.length > 1 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive h-6 text-xs"
                        onClick={() => removeArrayItem("education", i)}
                      >
                        删除
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      placeholder="学校名称"
                      value={edu.school}
                      onChange={(e) =>
                        updateArrayItem(
                          "education",
                          i,
                          "school",
                          e.target.value
                        )
                      }
                      className="rounded-xl"
                    />
                    <Input
                      placeholder="专业"
                      value={edu.major}
                      onChange={(e) =>
                        updateArrayItem(
                          "education",
                          i,
                          "major",
                          e.target.value
                        )
                      }
                      className="rounded-xl"
                    />
                    <Input
                      placeholder="学历（本科/硕士）"
                      value={edu.degree}
                      onChange={(e) =>
                        updateArrayItem(
                          "education",
                          i,
                          "degree",
                          e.target.value
                        )
                      }
                      className="rounded-xl"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="开始日期"
                        value={edu.start}
                        onChange={(e) =>
                          updateArrayItem(
                            "education",
                            i,
                            "start",
                            e.target.value
                          )
                        }
                        className="rounded-xl"
                      />
                      <Input
                        placeholder="结束日期"
                        value={edu.end}
                        onChange={(e) =>
                          updateArrayItem(
                            "education",
                            i,
                            "end",
                            e.target.value
                          )
                        }
                        className="rounded-xl"
                      />
                    </div>
                  </div>
                  <Input
                    placeholder="亮点（如GPA、奖学金、相关课程）"
                    value={edu.highlights}
                    onChange={(e) =>
                      updateArrayItem(
                        "education",
                        i,
                        "highlights",
                        e.target.value
                      )
                    }
                    className="rounded-xl"
                  />
                </div>
              ))}
            </div>
          )}

          {/* 3. Experience + Projects */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display font-semibold text-lg text-foreground">
                    实习/工作经历
                  </h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => addArrayItem("experience")}
                    className="rounded-xl"
                  >
                    + 添加
                  </Button>
                </div>
                {data.experience.map((exp, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl border border-border/40 space-y-3 mb-3"
                  >
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">
                        经历 # {i + 1}
                      </span>
                      {data.experience.length > 1 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive h-6 text-xs"
                          onClick={() => removeArrayItem("experience", i)}
                        >
                          删除
                        </Button>
                      )}
                    </div>
                    <Input
                      placeholder="职位/岗位名称"
                      value={exp.title}
                      onChange={(e) =>
                        updateArrayItem(
                          "experience",
                          i,
                          "title",
                          e.target.value
                        )
                      }
                      className="rounded-xl"
                    />
                    <Input
                      placeholder="公司/组织名称"
                      value={exp.organization}
                      onChange={(e) =>
                        updateArrayItem(
                          "experience",
                          i,
                          "organization",
                          e.target.value
                        )
                      }
                      className="rounded-xl"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="开始日期"
                        value={exp.start}
                        onChange={(e) =>
                          updateArrayItem(
                            "experience",
                            i,
                            "start",
                            e.target.value
                          )
                        }
                        className="rounded-xl"
                      />
                      <Input
                        placeholder="结束日期"
                        value={exp.end}
                        onChange={(e) =>
                          updateArrayItem(
                            "experience",
                            i,
                            "end",
                            e.target.value
                          )
                        }
                        className="rounded-xl"
                      />
                    </div>
                    <Textarea
                      placeholder="工作描述（建议用STAR法则：情境-任务-行动-结果）"
                      value={exp.description}
                      onChange={(e) =>
                        updateArrayItem(
                          "experience",
                          i,
                          "description",
                          e.target.value
                        )
                      }
                      rows={3}
                      className="rounded-xl resize-none"
                    />
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display font-semibold text-lg text-foreground">
                    项目经历
                  </h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => addArrayItem("projects")}
                    className="rounded-xl"
                  >
                    + 添加
                  </Button>
                </div>
                {data.projects.map((proj, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl border border-border/40 space-y-3 mb-3"
                  >
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">
                        项目 # {i + 1}
                      </span>
                      {data.projects.length > 1 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive h-6 text-xs"
                          onClick={() => removeArrayItem("projects", i)}
                        >
                          删除
                        </Button>
                      )}
                    </div>
                    <Input
                      placeholder="项目名称"
                      value={proj.title}
                      onChange={(e) =>
                        updateArrayItem(
                          "projects",
                          i,
                          "title",
                          e.target.value
                        )
                      }
                      className="rounded-xl"
                    />
                    <Input
                      placeholder="项目角色（如：项目负责人）"
                      value={proj.organization}
                      onChange={(e) =>
                        updateArrayItem(
                          "projects",
                          i,
                          "organization",
                          e.target.value
                        )
                      }
                      className="rounded-xl"
                    />
                    <Textarea
                      placeholder="项目描述（你做了什么，用了什么技术，取得了什么成果）"
                      value={proj.description}
                      onChange={(e) =>
                        updateArrayItem(
                          "projects",
                          i,
                          "description",
                          e.target.value
                        )
                      }
                      rows={3}
                      className="rounded-xl resize-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Skills + Certifications */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display font-semibold text-lg text-foreground">
                    专业技能
                  </h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => addStringItem("skills")}
                    className="rounded-xl"
                  >
                    + 添加
                  </Button>
                </div>
                <div className="space-y-2">
                  {data.skills.map((s, i) => (
                    <div key={i} className="flex gap-2">
                      <Input
                        value={s}
                        onChange={(e) =>
                          updateStringItem("skills", i, e.target.value)
                        }
                        placeholder="如：Excel数据分析、SAP系统、FOB术语..."
                        className="rounded-xl"
                      />
                      {data.skills.length > 1 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive flex-shrink-0"
                          onClick={() => removeStringItem("skills", i)}
                        >
                          删除
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display font-semibold text-lg text-foreground">
                    证书资质
                  </h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => addStringItem("certifications")}
                    className="rounded-xl"
                  >
                    + 添加
                  </Button>
                </div>
                <div className="space-y-2">
                  {data.certifications.map((c, i) => (
                    <div key={i} className="flex gap-2">
                      <Input
                        value={c}
                        onChange={(e) =>
                          updateStringItem(
                            "certifications",
                            i,
                            e.target.value
                          )
                        }
                        placeholder="如：CET-6、报关员证、PMP..."
                        className="rounded-xl"
                      />
                      {data.certifications.length > 1 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive flex-shrink-0"
                          onClick={() =>
                            removeStringItem("certifications", i)
                          }
                        >
                          删除
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 5. Job Target */}
          {step === 4 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="font-display font-semibold text-lg text-foreground">
                求职意向
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>目标岗位</Label>
                  <Input
                    value={data.targetPosition}
                    onChange={(e) =>
                      update("targetPosition", e.target.value)
                    }
                    placeholder="如：跨境电商运营"
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <Label>目标行业</Label>
                  <Input
                    value={data.targetIndustry}
                    onChange={(e) =>
                      update("targetIndustry", e.target.value)
                    }
                    placeholder="如：国际贸易/物流"
                    className="rounded-xl"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 rounded-xl"
                >
                  <Check className="w-4 h-4 mr-2" />
                  {saving ? "保存中..." : "保存简历"}
                </Button>
                {onAI && (
                  <Button
                    variant="outline"
                    onClick={onAI}
                    disabled={aiLoading}
                    className="rounded-xl"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {aiLoading ? "AI生成中..." : "AI 一键生成"}
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ---------- Navigation ---------- */}
      <div className="flex justify-between">
        <Button
          variant="ghost"
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
          className="rounded-xl"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          上一步
        </Button>
        {step < STEPS.length - 1 && (
          <Button
            onClick={() => setStep(step + 1)}
            className="rounded-xl"
          >
            下一步
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}
