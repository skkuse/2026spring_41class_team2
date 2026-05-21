create table public.recommendation_chat_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.recommendation_chat_conversation_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.recommendation_chat_conversations(id) on delete cascade,
  role text not null,
  content text not null,
  raw_response jsonb,
  created_at timestamptz not null default now(),
  constraint recommendation_chat_messages_role_check
    check (role in ('request', 'response'))
);

create table public.recommendation_chat_conversation_message_movies (
  message_id uuid not null references public.recommendation_chat_conversation_messages(id) on delete cascade,
  movie_id bigint not null references public.movies(id) on delete cascade,
  rank integer not null,
  reason text,
  primary key (message_id, movie_id),
  constraint recommendation_chat_message_movies_rank_check
    check (rank > 0)
);

create index recommendation_chat_conversations_user_updated_at_idx
  on public.recommendation_chat_conversations (user_id, updated_at desc);

create index recommendation_chat_messages_conversation_created_at_idx
  on public.recommendation_chat_conversation_messages (conversation_id, created_at);

create index recommendation_chat_message_movies_movie_id_idx
  on public.recommendation_chat_conversation_message_movies (movie_id);

grant select, insert, update, delete on table public.recommendation_chat_conversations to service_role;
grant select, insert, update, delete on table public.recommendation_chat_conversation_messages to service_role;
grant select, insert, update, delete on table public.recommendation_chat_conversation_message_movies to service_role;
