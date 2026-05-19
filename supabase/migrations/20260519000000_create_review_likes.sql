create table public.review_likes (
  review_id uuid not null references public.reviews(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (review_id, user_id)
);

create index review_likes_user_id_idx
  on public.review_likes (user_id);

grant select, insert, update, delete on table public.review_likes to service_role;
