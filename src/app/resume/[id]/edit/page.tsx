"use client";

import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import {
  MultiStepResumeForm,
  type ResumeFormData,
} from "@/components/resume/multi-step-form";
import { JDMatchPanel } from "@/components/resume/jd-match-panel";
import { supabase } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import type { Resume, ResumeContent } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

function getStr(v: unknown, fallback = ""): string {
  if (typeof v === "string") return v;
  if (Array.isArray(v))
    return v.filter((x): x is string => typeof x === "string").join("，");
  return fallback;
}

type FormEdu = {
  school: string;
  major: string;
  degree: string;
  start: string;
  end: string;
  highlights: string;
};
type FormExp = {
  title: string;
  organization: string;
  start: string;
  end: string;
  description: string;
  highlights: string;
};

function toEdu(e: Record<string, unknown>): FormEdu {
  return {
    school: getStr(e.organization),
    major: getStr(e.title),
    degree: getStr(e.degree, "本科"),
    start: getStr(e.start_date),
    end: getStr(e.end_date),
    highlights: getStr(e.highlights) || getStr(e.description),
  };
}
function toExp(e: Record<string, unknown>): FormExp {
  return {
    title: getStr(e.title),
    organization: getStr(e.organization),
    start: getStr(e.start_date),
    end: getStr(e.end_date),
    description: getStr(e.description),
    highlights: getStr(e.highlights),
  };
}

const DEF_EDU: FormEdu = {
  school: "",
  major: "",
  degree: "本科",
  start: "",
  end: "",
  highlights: "",
};
const DEF_EXP: FormExp = {
  title: "",
  organization: "",
  start: "",
  end: "",
  description: "",
  highlights: "",
};

function resumeToFormData(r: Resume): Partial<ResumeFormData> {
  const c = (r.content || {}) as unknown as Record<string, unknown>;
  const eduArr: FormEdu[] =
    Array.isArray(c.education) && (c.education as unknown[]).length
      ? (c.education as unknown[]).map((e) =>
          toEdu(e as Record<string, unknown>)
        )
      : [DEF_EDU];
  const expArr: FormExp[] =
    Array.isArray(c.experience) && (c.experience as unknown[]).length
      ? (c.experience as unknown[]).map((e) =>
          toExp(e as Record<string, unknown>)
        )
      : [DEF_EXP];
  const projArr: FormExp[] =
    Array.isArray(c.projects) && (c.projects as unknown[]).length
      ? (c.projects as unknown[]).map((e) =>
          toExp(e as Record<string, unknown>)
        )
      : [DEF_EXP];
  return {
    name: getStr(c.name),
    phone: getStr(c.phone),
    email: getStr(c.email),
    summary: getStr(c.summary),
    education: eduArr,
    experience: expArr,
    projects: projArr,
    skills:
      Array.isArray(c.skills) && (c.skills as unknown[]).length
        ? (c.skills as string[])
        : [""],
    certifications:
      Array.isArray(c.certifications) && (c.certifications as unknown[]).length
        ? (c.certifications as string[])
        : [""],
    targetPosition: r.target_position || "",
    targetIndustry: "",
  };
}

function formDataToContent(d: ResumeFormData): ResumeContent {
  return {
    name: d.name,
    phone: d.phone,
    email: d.email,
    summary: d.summary,
    education: d.education.map((e) => ({
      title: e.major,
      organization: e.school,
      start_date: e.start,
      end_date: e.end,
      description: e.highlights,
      highlights: [e.highlights].filter(Boolean),
    })),
    experience: d.experience.map((e) => ({
      title: e.title,
      organization: e.organization,
      start_date: e.start,
      end_date: e.end,
      description: e.description,
      highlights: [e.highlights].filter(Boolean),
    })),
    projects: d.projects.map((e) => ({
      title: e.title,
      organization: e.organization,
      start_date: e.start,
      end_date: e.end,
      description: e.description,
      highlights: [e.highlights].filter(Boolean),
    })),
    skills: d.skills.filter(Boolean),
    certifications: d.certifications.filter(Boolean),
  };
}

export default function ResumeEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [resume, setResume] = useState<Resume | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("resumes")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        setResume(data);
        setLoading(false);
      });
  }, [id]);

  const handleSave = async (data: ResumeFormData) => {
    const content = formDataToContent(data);
    await supabase
      .from("resumes")
      .update({
        content,
        target_position: data.targetPosition,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    await supabase.from("resume_versions").insert({
      resume_id: id,
      user_id: resume?.user_id,
      version_number: 1,
      content_snapshot: content,
      change_summary: "手动编辑更新",
    });
    toast.success("保存成功");
  };

  if (loading) {
    return (
      <AppShell>
        <div className="page-container animate-fade-in">
          <Skeleton className="h-8 w-48 mb-6 rounded-lg" />
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl mt-4" />
        </div>
      </AppShell>
    );
  }

  if (!resume) {
    return (
      <AppShell>
        <div className="page-container animate-fade-in">
          <p className="text-center py-12 text-muted-foreground">
            简历未找到
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="page-container animate-fade-in">
        {/* Back + Title */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            className="rounded-xl"
            onClick={() => router.push("/resume")}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            返回
          </Button>
          <h2 className="text-2xl font-display font-bold text-foreground">
            编辑简历
          </h2>
        </div>

        <Tabs defaultValue="form">
          <TabsList className="rounded-xl">
            <TabsTrigger value="form" className="rounded-lg">
              分步填写
            </TabsTrigger>
            <TabsTrigger value="jd" className="rounded-lg">
              JD 匹配
            </TabsTrigger>
          </TabsList>
          <TabsContent value="form" className="mt-6">
            <MultiStepResumeForm
              initial={resumeToFormData(resume)}
              onSave={handleSave}
            />
          </TabsContent>
          <TabsContent value="jd" className="mt-6">
            <JDMatchPanel
              resumeId={id}
              userId={resume.user_id}
              resumeContent={
                resume.content as unknown as Record<string, unknown>
              }
            />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
