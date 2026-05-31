alter table public.recommendation_chat_debug_questions
  add column if not exists is_buggy boolean not null default false;

grant update on table public.recommendation_chat_debug_questions to service_role;
