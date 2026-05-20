-- 心理支持模块表
create table if not exists mood_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  mood text not null,
  note text default '',
  related_event_id uuid,
  created_at timestamptz default now()
);
alter table mood_logs enable row level security;
create policy "public_access" on mood_logs for all using (true);

-- 每日打卡
create table if not exists daily_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  checkin_date date not null default current_date,
  question_count int default 0,
  streak_days int default 0,
  created_at timestamptz default now(),
  unique(user_id, checkin_date)
);
alter table daily_checkins enable row level security;
create policy "public_access" on daily_checkins for all using (true);
