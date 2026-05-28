alter table public.characters disable row level security;
alter table public.character_chat_events disable row level security;
alter table public.character_chat_event_participants disable row level security;
alter table public.character_chat_default_questions disable row level security;
alter table public.character_chat_conversations disable row level security;
alter table public.character_chat_conversation_messages disable row level security;

revoke all privileges on table public.characters from anon;
revoke all privileges on table public.characters from authenticated;
revoke all privileges on table public.character_chat_events from anon;
revoke all privileges on table public.character_chat_events from authenticated;
revoke all privileges on table public.character_chat_event_participants from anon;
revoke all privileges on table public.character_chat_event_participants from authenticated;
revoke all privileges on table public.character_chat_default_questions from anon;
revoke all privileges on table public.character_chat_default_questions from authenticated;
revoke all privileges on table public.character_chat_conversations from anon;
revoke all privileges on table public.character_chat_conversations from authenticated;
revoke all privileges on table public.character_chat_conversation_messages from anon;
revoke all privileges on table public.character_chat_conversation_messages from authenticated;

grant select, insert, update, delete on table public.characters to service_role;
grant select, insert, update, delete on table public.character_chat_events to service_role;
grant select, insert, update, delete on table public.character_chat_event_participants to service_role;
grant select, insert, update, delete on table public.character_chat_default_questions to service_role;
grant select, insert, update, delete on table public.character_chat_conversations to service_role;
grant select, insert, update, delete on table public.character_chat_conversation_messages to service_role;

alter index if exists public.character_chat_conversation_messages_conversation_created_at_id
  rename to character_chat_messages_conversation_created_at_idx;
