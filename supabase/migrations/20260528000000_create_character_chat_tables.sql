create table public.characters (
  id uuid primary key default gen_random_uuid(),
  movie_id bigint not null references public.movies(id) on delete cascade,
  actor_person_id bigint references public.people(id) on delete set null,
  name text not null,
  description text not null,
  greeting text not null,
  persona_prompt text not null,
  avatar_storage_path text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint characters_movie_name_key unique (movie_id, name)
);

create index characters_movie_id_idx
  on public.characters (movie_id);

create index characters_actor_person_id_idx
  on public.characters (actor_person_id);

create table public.character_chat_events (
  id uuid primary key default gen_random_uuid(),
  movie_id bigint not null references public.movies(id) on delete cascade,
  event_order integer not null,
  title text not null,
  summary text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint character_chat_events_movie_event_order_key unique (movie_id, event_order)
);

create index character_chat_events_movie_event_order_idx
  on public.character_chat_events (movie_id, event_order);

create table public.character_chat_event_participants (
  event_id uuid not null references public.character_chat_events(id) on delete cascade,
  character_id uuid not null references public.characters(id) on delete cascade,
  role text not null,
  perspective_summary text not null,
  emotional_impact text not null,
  knowledge_state text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (event_id, character_id)
);

create index character_chat_event_participants_character_id_idx
  on public.character_chat_event_participants (character_id);

create table public.character_chat_default_questions (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references public.characters(id) on delete cascade,
  question text not null,
  display_order integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint character_chat_default_questions_character_display_order_key unique (character_id, display_order),
  constraint character_chat_default_questions_display_order_check check (display_order > 0)
);

create table public.character_chat_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  character_id uuid not null references public.characters(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index character_chat_conversations_user_updated_at_idx
  on public.character_chat_conversations (user_id, updated_at desc);

create index character_chat_conversations_character_id_idx
  on public.character_chat_conversations (character_id);

create table public.character_chat_conversation_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.character_chat_conversations(id) on delete cascade,
  sender_type text not null,
  content text not null,
  created_at timestamptz not null default now(),
  constraint character_chat_conversation_messages_sender_type_check
    check (sender_type in ('user', 'character'))
);

create index character_chat_conversation_messages_conversation_created_at_idx
  on public.character_chat_conversation_messages (conversation_id, created_at);
