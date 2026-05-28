grant usage on schema public to service_role;

grant select, insert, update, delete on table public.characters to service_role;
grant select, insert, update, delete on table public.character_chat_events to service_role;
grant select, insert, update, delete on table public.character_chat_event_participants to service_role;
grant select, insert, update, delete on table public.character_chat_default_questions to service_role;
grant select, insert, update, delete on table public.character_chat_conversations to service_role;
grant select, insert, update, delete on table public.character_chat_conversation_messages to service_role;
