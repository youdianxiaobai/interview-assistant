"use client";

import { useState } from "react";
import type { ResumeContent, ResumeEntry } from "@/types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Save } from "lucide-react";
import toast from "react-hot-toast";

export function ResumeEditor({
  content,
  onSave,
}: {
  content: ResumeContent;
  onSave: (c: ResumeContent) => void;
}) {
  const [c, setC] = useState<ResumeContent>(content);

  const updateField = (field: keyof ResumeContent, value: unknown) =>
    setC({ ...c, [field]: value });

  const addEntry = (section: "education" | "experience" | "projects") => {
    const empty: ResumeEntry = {
      title: "",
      organization: "",
      start_date: "",
      end_date: "",
      description: "",
      highlights: [],
    };
    setC({ ...c, [section]: [...(c[section] || []), empty] });
  };

  const updateEntry = (
    section: "education" | "experience" | "projects",
    index: number,
    field: keyof ResumeEntry,
    value: unknown
  ) => {
    const entries = [...(c[section] || [])];
    entries[index] = { ...entries[index], [field]: value };
    setC({ ...c, [section]: entries });
  };

  const removeEntry = (
    section: "education" | "experience" | "projects",
    index: number
  ) => {
    setC({
      ...c,
      [section]: (c[section] || []).filter((_, i) => i !== index),
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Basic Info */}
      <Card className="rounded-xl shadow-sm border border-border/40 bg-card">
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-display font-semibold text-foreground">
            基本信息
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>姓名</Label>
              <Input
                value={c.name}
                onChange={(e) => updateField("name", e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div>
              <Label>电话</Label>
              <Input
                value={c.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div>
              <Label>邮箱</Label>
              <Input
                value={c.email}
                onChange={(e) => updateField("email", e.target.value)}
                className="rounded-xl"
              />
            </div>
          </div>
          <div>
            <Label>个人简介</Label>
            <Textarea
              value={c.summary}
              onChange={(e) => updateField("summary", e.target.value)}
              rows={3}
              className="rounded-xl resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Sections: experience, education, projects */}
      {(["experience", "education", "projects"] as const).map((section) => (
        <Card
          key={section}
          className="rounded-xl shadow-sm border border-border/40 bg-card"
        >
          <CardContent className="pt-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold text-foreground">
                {section === "experience"
                  ? "工作经历"
                  : section === "education"
                    ? "教育经历"
                    : "项目经历"}
              </h3>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl"
                onClick={() => addEntry(section)}
              >
                <Plus className="w-4 h-4 mr-1" />
                添加
              </Button>
            </div>
            {(c[section] || []).map((entry, i) => (
              <div
                key={i}
                className="p-4 rounded-xl border border-border/40 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    # {i + 1}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeEntry(section, i)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
                <Input
                  placeholder="标题/职位"
                  value={entry.title}
                  onChange={(e) =>
                    updateEntry(section, i, "title", e.target.value)
                  }
                  className="rounded-xl"
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="组织/公司"
                    value={entry.organization}
                    onChange={(e) =>
                      updateEntry(
                        section,
                        i,
                        "organization",
                        e.target.value
                      )
                    }
                    className="rounded-xl"
                  />
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      placeholder="开始"
                      value={entry.start_date}
                      onChange={(e) =>
                        updateEntry(
                          section,
                          i,
                          "start_date",
                          e.target.value
                        )
                      }
                      className="rounded-xl"
                    />
                    <Input
                      type="date"
                      placeholder="结束"
                      value={entry.end_date}
                      onChange={(e) =>
                        updateEntry(
                          section,
                          i,
                          "end_date",
                          e.target.value
                        )
                      }
                      className="rounded-xl"
                    />
                  </div>
                </div>
                <Textarea
                  placeholder="描述"
                  value={entry.description}
                  onChange={(e) =>
                    updateEntry(section, i, "description", e.target.value)
                  }
                  rows={2}
                  className="rounded-xl resize-none"
                />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {/* Skills */}
      <Card className="rounded-xl shadow-sm border border-border/40 bg-card">
        <CardContent className="pt-6 space-y-2">
          <Label>技能（逗号分隔）</Label>
          <Input
            value={(c.skills || []).join(", ")}
            onChange={(e) =>
              updateField(
                "skills",
                e.target.value.split(",").map((s) => s.trim())
              )
            }
            className="rounded-xl"
          />
        </CardContent>
      </Card>

      {/* Save */}
      <Button
        onClick={() => {
          onSave(c);
          toast.success("已保存");
        }}
        className="w-full rounded-xl"
      >
        <Save className="w-4 h-4 mr-2" />
        保存简历
      </Button>
    </div>
  );
}
