"use client";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { ResumeEditor } from "@/components/resume/resume-editor";
import { AiPolishPanel } from "@/components/resume/ai-polish-panel";
import { supabase } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import type { Resume, ResumeContent } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ResumeEditPage() {
  const { id } = useParams<{ id: string }>();
  const [resume, setResume] = useState<Resume | null>(null);

  useEffect(() => {
    supabase.from("resumes").select("*").eq("id", id).single().then(({ data }) => setResume(data));
  }, [id]);

  const handleSave = async (content: ResumeContent) => {
    await supabase.from("resumes").update({ content, updated_at: new Date().toISOString() }).eq("id", id);
  };

  if (!resume) return <AppShell><p>加载中...</p></AppShell>;

  return (
    <AppShell>
      <Tabs defaultValue="edit">
        <TabsList><TabsTrigger value="edit">编辑简历</TabsTrigger><TabsTrigger value="ai">AI 润色</TabsTrigger></TabsList>
        <TabsContent value="edit"><ResumeEditor content={resume.content} onSave={handleSave} /></TabsContent>
        <TabsContent value="ai"><AiPolishPanel resumeId={id} content={resume.content} targetPosition={resume.target_position} /></TabsContent>
      </Tabs>
    </AppShell>
  );
}
