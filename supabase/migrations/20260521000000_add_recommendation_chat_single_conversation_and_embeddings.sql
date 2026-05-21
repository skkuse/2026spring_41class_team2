create extension if not exists vector with schema public;

alter table public.recommendation_chat_conversations
  add constraint recommendation_chat_conversations_user_id_key unique (user_id);

alter table public.recommendation_chat_conversation_message_movies
  alter column reason set not null;

create table public.movie_tag_mapping_embeddings (
  tag_id integer not null references public.movie_tags(tag_id) on delete restrict,
  embedding_model text not null,
  embedding vector(1536) not null,
  created_at timestamptz not null default now(),
  primary key (tag_id, embedding_model)
);

create index movie_tag_mapping_embeddings_embedding_hnsw_idx
  on public.movie_tag_mapping_embeddings
  using hnsw (embedding vector_cosine_ops);

grant select, insert, update, delete on table public.movie_tag_mapping_embeddings to service_role;
