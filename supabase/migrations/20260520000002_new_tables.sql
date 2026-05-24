-- =====================================================
-- 面试助手 - 新增数据表 (2026-05-20)
-- 执行方式: Supabase SQL Editor 粘贴运行
-- =====================================================

-- 1. 综合评估报告表
create table if not exists interview_reports (
  id uuid primary key default gen_random_uuid(),
  interview_id uuid not null references interviews(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  overall_score int not null default 0,
  summary text not null default '',
  strengths text[] not null default '{}',
  weaknesses text[] not null default '{}',
  action_plan jsonb not null default '[]',
  position_match text not null default '',
  next_steps text not null default '',
  radar_data jsonb not null default '[]',
  created_at timestamptz default now()
);

alter table interview_reports enable row level security;

create policy "用户只能读写自己的报告"
  on interview_reports for all
  using (user_id = auth.uid()::uuid)
  with check (user_id = auth.uid()::uuid);

create policy "允许公开读取（开发阶段）"
  on interview_reports for select using (true);

-- 2. 岗位规划方案表
create table if not exists career_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  position text not null,
  background text not null default '',
  position_overview text not null default '',
  required_skills jsonb not null default '[]',
  skill_gap jsonb not null default '[]',
  learning_path jsonb not null default '[]',
  interview_focus text not null default '',
  career_path text not null default '',
  salary_range text not null default '',
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table career_plans enable row level security;

create policy "用户只能读写自己的规划"
  on career_plans for all
  using (user_id = auth.uid()::uuid)
  with check (user_id = auth.uid()::uuid);

create policy "允许公开读取（开发阶段）"
  on career_plans for select using (true);

-- 3. 简历版本历史表
create table if not exists resume_versions (
  id uuid primary key default gen_random_uuid(),
  resume_id uuid not null references resumes(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  version_number int not null default 1,
  content_snapshot jsonb not null default '{}',
  change_summary text not null default '',
  created_at timestamptz default now()
);

alter table resume_versions enable row level security;

create policy "用户只能读写自己的简历版本"
  on resume_versions for all
  using (user_id = auth.uid()::uuid)
  with check (user_id = auth.uid()::uuid);

create policy "允许公开读取（开发阶段）"
  on resume_versions for select using (true);

-- 4. JD解析记录表
create table if not exists jd_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  resume_id uuid references resumes(id) on delete set null,
  jd_text text not null,
  jd_keywords text[] not null default '{}',
  core_competencies jsonb not null default '[]',
  match_score int not null default 0,
  skill_match int not null default 0,
  experience_match int not null default 0,
  education_match int not null default 0,
  gap_analysis text not null default '',
  optimization_tips text not null default '',
  created_at timestamptz default now()
);

alter table jd_analyses enable row level security;

create policy "用户只能读写自己的JD分析"
  on jd_analyses for all
  using (user_id = auth.uid()::uuid)
  with check (user_id = auth.uid()::uuid);

create policy "允许公开读取（开发阶段）"
  on jd_analyses for select using (true);

-- 5. 爬虫运行日志表
create table if not exists crawl_logs (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  status text not null default 'running',
  questions_found int not null default 0,
  questions_new int not null default 0,
  errors text[] not null default '{}',
  started_at timestamptz default now(),
  finished_at timestamptz,
  details jsonb not null default '{}'
);

alter table crawl_logs enable row level security;

create policy "允许公开读写（管理功能）"
  on crawl_logs for all using (true);

-- 6. 为题库表添加来源标签字段（如果不存在）
alter table questions add column if not exists source_detail text default '';

-- 7. 知识点卡片增强（新增关联字段）
alter table knowledge_cards add column if not exists related_questions text[] not null default '{}';
alter table knowledge_cards add column if not exists export_count int not null default 0;

-- =====================================================
-- 索引
-- =====================================================
create index if not exists idx_interview_reports_user on interview_reports(user_id);
create index if not exists idx_interview_reports_interview on interview_reports(interview_id);
create index if not exists idx_career_plans_user on career_plans(user_id);
create index if not exists idx_resume_versions_resume on resume_versions(resume_id);
create index if not exists idx_jd_analyses_user on jd_analyses(user_id);
create index if not exists idx_crawl_logs_source on crawl_logs(source);
create index if not exists idx_crawl_logs_started on crawl_logs(started_at desc);
