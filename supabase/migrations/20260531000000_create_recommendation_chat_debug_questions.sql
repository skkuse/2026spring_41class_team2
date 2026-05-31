create table if not exists public.recommendation_chat_debug_questions (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  created_at timestamptz not null default now()
);

create index if not exists recommendation_chat_debug_questions_created_at_idx
  on public.recommendation_chat_debug_questions (created_at desc);

grant select, insert, delete on table public.recommendation_chat_debug_questions to service_role;

insert into public.recommendation_chat_debug_questions (text)
values
  ('잔잔하고 여운 남는 일본 로맨스 영화 추천해줘'),
  ('좀비가 등장하는 숨 막히는 공포 영화 추천해줘'),
  ('어두운 범죄 스릴러 중에 분위기 묵직한 거 추천해줘'),
  ('우주 배경의 SF 모험 영화 찾아줘'),
  ('가볍고 웃긴 코미디 영화 추천해줘'),
  ('러닝타임 2시간 이하 코미디 추천해줘');
