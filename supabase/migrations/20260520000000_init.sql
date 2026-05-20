-- 用户
create table profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null default '',
  avatar_url text,
  created_at timestamptz default now()
);

-- 设置
create table user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  voice_speed float default 1.0,
  default_mode text default 'practice',
  default_language text default 'zh',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id)
);

-- 简历
create table resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  version_name text not null,
  target_position text not null,
  content jsonb not null default '{}',
  file_url text,
  is_current boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index idx_one_current_resume on resumes (user_id) where is_current = true;

create table resume_analyses (
  id uuid primary key default gen_random_uuid(),
  resume_id uuid not null references resumes(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  position_target text not null,
  match_score int check (match_score >= 0 and match_score <= 100),
  strength_points jsonb default '[]',
  risk_points jsonb default '[]',
  predicted_questions jsonb default '[]',
  created_at timestamptz default now()
);

-- 题库
create table questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  position text not null,
  type text not null check (type in ('tech','behavioral')),
  difficulty text not null check (difficulty in ('easy','medium','hard')),
  source text not null check (source in ('preset','user','ai','resume')),
  content text not null,
  reference_answer text not null default '',
  tags text[] default '{}',
  is_favorite boolean default false,
  enabled boolean default true,
  created_at timestamptz default now()
);

create table user_entered_questions (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  company text default '',
  round text default '',
  format text default '',
  interview_date date,
  created_at timestamptz default now()
);

create table wrong_questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  question_id uuid not null references questions(id) on delete cascade,
  review_notes text default '',
  wrong_reason text default '',
  correct_approach text default '',
  retry_count int default 0,
  last_wrong_at timestamptz default now(),
  is_mastered boolean default false,
  created_at timestamptz default now()
);

create table knowledge_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  content text not null,
  category text default '',
  tags text[] default '{}',
  related_question_ids uuid[] default '{}',
  easiness_factor float default 2.5,
  next_review_at timestamptz default now(),
  review_count int default 0,
  created_at timestamptz default now()
);

-- 面试
create table interviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  mode text not null check (mode in ('practice','coach','mock','challenge')),
  position text not null,
  type text not null check (type in ('tech','behavioral','comprehensive')),
  language text not null default 'zh',
  score jsonb default '{}',
  duration int default 0,
  recording_url text,
  created_at timestamptz default now()
);

create table interview_qa (
  id uuid primary key default gen_random_uuid(),
  interview_id uuid not null references interviews(id) on delete cascade,
  question_id uuid references questions(id),
  question_text text not null,
  user_answer_text text default '',
  user_answer_audio_url text,
  ai_feedback jsonb default '{}',
  score_breakdown jsonb default '{}',
  followup_depth int default 0,
  is_weak boolean default false,
  created_at timestamptz default now()
);

-- 共享
create table shared_questions (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions(id) on delete cascade,
  from_user_id uuid not null references profiles(id) on delete cascade,
  shared_at timestamptz default now()
);

create table shared_reviews (
  id uuid primary key default gen_random_uuid(),
  interview_id uuid not null references interviews(id) on delete cascade,
  from_user_id uuid not null references profiles(id) on delete cascade,
  shared_at timestamptz default now()
);

create table challenge_sessions (
  id uuid primary key default gen_random_uuid(),
  challenger_id uuid not null references profiles(id) on delete cascade,
  opponent_id uuid references profiles(id) on delete cascade,
  questions jsonb default '[]',
  challenger_scores jsonb default '{}',
  opponent_scores jsonb default '{}',
  created_at timestamptz default now()
);

-- Row Level Security (启用所有表)
alter table profiles enable row level security;
alter table user_settings enable row level security;
alter table resumes enable row level security;
alter table resume_analyses enable row level security;
alter table questions enable row level security;
alter table user_entered_questions enable row level security;
alter table wrong_questions enable row level security;
alter table knowledge_cards enable row level security;
alter table interviews enable row level security;
alter table interview_qa enable row level security;
alter table shared_questions enable row level security;
alter table shared_reviews enable row level security;
alter table challenge_sessions enable row level security;

-- RLS Policy: 公开访问
create policy "public_access" on profiles for all using (true);
create policy "public_access" on user_settings for all using (true);
create policy "public_access" on questions for all using (true);
create policy "public_access" on user_entered_questions for all using (true);
create policy "public_access" on wrong_questions for all using (true);
create policy "public_access" on knowledge_cards for all using (true);
create policy "public_access" on interviews for all using (true);
create policy "public_access" on interview_qa for all using (true);
create policy "public_access" on resumes for all using (true);
create policy "public_access" on resume_analyses for all using (true);
create policy "public_access" on shared_questions for all using (true);
create policy "public_access" on shared_reviews for all using (true);
create policy "public_access" on challenge_sessions for all using (true);
commit;
