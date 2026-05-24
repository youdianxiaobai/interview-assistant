"use client";
import { AppShell } from "@/components/layout/app-shell";
import { useUserStore } from "@/lib/store/user-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Brain,
  ArrowLeft,
  ArrowRight,
  Lightbulb,
  CheckCircle2,
  Pencil,
  RefreshCw,
  Shield,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";

// CBT thought record template
interface ThoughtRecord {
  situation: string;
  autoThought: string;
  emotion: string;
  evidenceFor: string;
  evidenceAgainst: string;
  balancedThought: string;
  newEmotion: string;
}

const PRESET_SCENARIOS = [
  {
    title: "面试焦虑",
    situation: "明天有一场重要面试",
    autoThought: "我肯定表现不好，面试官会看出我不够格，我找不到工作了",
    emotion: "焦虑、恐惧、自我怀疑",
  },
  {
    title: "被拒后自我否定",
    situation: "收到拒信",
    autoThought: "我就是不行，别人都比我强，我永远找不到好工作",
    emotion: "沮丧、自卑、绝望",
  },
  {
    title: "同辈比较压力",
    situation: "看到同学都拿到offer了",
    autoThought: "我是最差的，我落后太多了，我是不是选错了方向",
    emotion: "焦虑、羞耻、迷茫",
  },
  {
    title: "面试后反复纠结",
    situation: "面试结束等待结果",
    autoThought: "那个问题我回答得太差了，他们肯定觉得我不行，我没戏了",
    emotion: "后悔、不安、自我批评",
  },
];

export default function CognitiveRestructuringPage() {
  const router = useRouter();
  const { currentUserId, profiles } = useUserStore();
  const currentUser = profiles.find((p) => p.id === currentUserId);

  const [step, setStep] = useState(0);
  const [record, setRecord] = useState<ThoughtRecord>({
    situation: "",
    autoThought: "",
    emotion: "",
    evidenceFor: "",
    evidenceAgainst: "",
    balancedThought: "",
    newEmotion: "",
  });
  const [completed, setCompleted] = useState(false);

  const applyPreset = (scenario: (typeof PRESET_SCENARIOS)[number]) => {
    setRecord((prev) => ({
      ...prev,
      situation: scenario.situation,
      autoThought: scenario.autoThought,
      emotion: scenario.emotion,
    }));
    setStep(1);
    toast.success(`已加载「${scenario.title}」场景`);
  };

  const updateField = (field: keyof ThoughtRecord, value: string) => {
    setRecord((prev) => ({ ...prev, [field]: value }));
  };

  const steps = [
    {
      title: "发生了什么？",
      subtitle: "描述让你感到焦虑的具体情境",
      icon: Pencil,
      fields: [
        { key: "situation" as const, label: "具体情境", placeholder: "比如：收到了面试通知、等待面试结果、看到别人拿到offer...", rows: 2 },
        { key: "autoThought" as const, label: "自动冒出来的负面想法", placeholder: "你脑子里第一时间跳出来的那些念头是什么？不要评判，直接写下来...", rows: 3 },
        { key: "emotion" as const, label: "此刻的情绪", placeholder: "焦虑？恐惧？沮丧？试着给情绪命个名...", rows: 1 },
      ],
    },
    {
      title: "检验这个想法",
      subtitle: "像侦探一样，客观地看看证据",
      icon: Lightbulb,
      fields: [
        { key: "evidenceFor" as const, label: "支持这个想法的证据", placeholder: "有什么客观事实支持你的担忧？注意区分「事实」和「猜测」...", rows: 3 },
        { key: "evidenceAgainst" as const, label: "反对这个想法的证据", placeholder: "过去有哪些相反的经历？你的优势是什么？别人会怎么说？...", rows: 3 },
      ],
    },
    {
      title: "换个角度看",
      subtitle: "用更平衡、更友善的视角重新看待这件事",
      icon: RefreshCw,
      fields: [
        { key: "balancedThought" as const, label: "更平衡的想法", placeholder: "综合考虑所有证据后，一个更客观、更友善的想法是...\n\n提示：试着用对待好朋友的方式对自己说话。", rows: 3 },
        { key: "newEmotion" as const, label: "现在的情绪", placeholder: "重新审视之后，现在感觉怎么样？...", rows: 1 },
      ],
    },
  ];

  const currentStep = steps[step];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      setCompleted(true);
      toast.success("恭喜你完成了一次认知重构练习！");
    }
  };

  const handleReset = () => {
    setStep(0);
    setRecord({
      situation: "",
      autoThought: "",
      emotion: "",
      evidenceFor: "",
      evidenceAgainst: "",
      balancedThought: "",
      newEmotion: "",
    });
    setCompleted(false);
  };

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => router.push("/wellness")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center shadow-sm">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold font-display">焦虑认知重构</h2>
            <p className="text-sm text-muted-foreground">基于 CBT 认知行为疗法，帮你用理性回应焦虑</p>
          </div>
        </div>

        {/* Completed state */}
        {completed && (
          <Card className="rounded-2xl shadow-sm border border-emerald-200 bg-emerald-50/50 overflow-hidden">
            <CardContent className="p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-display font-bold text-emerald-700">练习完成！</h3>
              <p className="text-sm text-emerald-600 max-w-sm mx-auto leading-relaxed">
                你刚刚完成了一次认知重构。从最初的「{record.autoThought.slice(0, 30)}...」到现在的「{record.balancedThought.slice(0, 30)}...」
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <Button onClick={handleReset} variant="outline" className="rounded-xl">
                  再做一次
                </Button>
                <Button onClick={() => router.push("/wellness")} className="rounded-xl bg-emerald-500 hover:bg-emerald-600">
                  返回心理中心
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Preset scenarios - step 0 */}
        {step === 0 && !completed && (
          <>
            <Card className="rounded-xl shadow-sm border border-border/40 bg-card">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  <h3 className="font-semibold text-sm">选择一个场景快速开始，或者自己填写</h3>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {PRESET_SCENARIOS.map((s) => (
                    <button
                      key={s.title}
                      onClick={() => applyPreset(s)}
                      className="text-left p-3 rounded-xl border border-purple-200 hover:bg-purple-50 hover:border-purple-300 transition-colors"
                    >
                      <p className="font-medium text-sm text-purple-700">{s.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{s.autoThought}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Step 0 form */}
            <Card className="rounded-xl shadow-sm border border-border/40 bg-card">
              <CardContent className="p-6 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                    <currentStep.icon className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{currentStep.title}</h3>
                    <p className="text-sm text-muted-foreground">{currentStep.subtitle}</p>
                  </div>
                </div>

                {currentStep.fields.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <label className="text-sm font-medium text-foreground">{field.label}</label>
                    <Textarea
                      value={record[field.key]}
                      onChange={(e) => updateField(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      rows={field.rows}
                      className="resize-none rounded-xl"
                    />
                  </div>
                ))}

                <Button onClick={handleNext} className="w-full rounded-xl" size="lg">
                  进入下一步：检验想法
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </>
        )}

        {/* Steps 1-2 */}
        {step > 0 && !completed && (
          <>
            {/* Progress indicator */}
            <div className="flex items-center gap-2 justify-center">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    i < step ? "bg-purple-500" : i === step ? "bg-purple-300" : "bg-muted"
                  }`}
                />
              ))}
              <span className="text-xs text-muted-foreground ml-2">
                步骤 {step + 1}/{steps.length}
              </span>
            </div>

            <Card className="rounded-xl shadow-sm border border-border/40 bg-card">
              <CardContent className="p-6 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                    <currentStep.icon className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{currentStep.title}</h3>
                    <p className="text-sm text-muted-foreground">{currentStep.subtitle}</p>
                  </div>
                </div>

                {/* Show what was written in previous step for context */}
                {step === 1 && (
                  <div className="p-3 rounded-xl bg-muted/40 border border-border/30">
                    <p className="text-xs font-medium text-muted-foreground mb-1">你之前写下的自动想法</p>
                    <p className="text-sm text-foreground italic">"{record.autoThought}"</p>
                  </div>
                )}

                {currentStep.fields.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <label className="text-sm font-medium text-foreground">{field.label}</label>
                    <Textarea
                      value={record[field.key]}
                      onChange={(e) => updateField(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      rows={field.rows}
                      className="resize-none rounded-xl"
                    />
                  </div>
                ))}

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(step - 1)} className="rounded-xl">
                    上一步
                  </Button>
                  <Button onClick={handleNext} className="flex-1 rounded-xl" size="lg">
                    {step < steps.length - 1 ? (
                      <>
                        下一步
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    ) : (
                      <>
                        完成练习
                        <CheckCircle2 className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* CBT explanation card */}
        {!completed && (
          <Card className="rounded-xl shadow-sm border border-border/40 bg-muted/30">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold mb-1">这是什么原理？</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    这是认知行为疗法（CBT）的核心工具——思维记录表。焦虑往往来自「自动负性思维」——那些不经检验就相信的负面想法。
                    通过有意识地检验这些想法、寻找证据、换个角度看问题，我们可以逐步打破焦虑的循环。
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
