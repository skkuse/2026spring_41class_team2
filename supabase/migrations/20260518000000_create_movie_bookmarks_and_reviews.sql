create table public.movie_bookmarks (
  user_id uuid not null references public.profiles(id) on delete cascade,
  movie_id bigint not null references public.movies(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, movie_id)
);

create index movie_bookmarks_movie_id_idx
  on public.movie_bookmarks (movie_id);

alter table public.movie_bookmarks enable row level security;

create policy movie_bookmarks_select_own
  on public.movie_bookmarks
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy movie_bookmarks_insert_own
  on public.movie_bookmarks
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy movie_bookmarks_delete_own
  on public.movie_bookmarks
  for delete
  to authenticated
  using (auth.uid() = user_id);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  movie_id bigint not null references public.movies(id) on delete cascade,
  rating numeric(2,1) not null,
  content text not null,
  created_at timestamptz not null default now(),
  constraint reviews_user_movie_key unique (user_id, movie_id),
  constraint reviews_rating_range_check check (rating >= 0.5 and rating <= 5.0)
);

create index reviews_movie_id_created_at_idx
  on public.reviews (movie_id, created_at desc);

alter table public.reviews enable row level security;

create policy reviews_select_all
  on public.reviews
  for select
  to anon, authenticated
  using (true);

create policy reviews_insert_own
  on public.reviews
  for insert
  to authenticated
  with check (auth.uid() = user_id);

grant select, insert, delete on table public.movie_bookmarks to authenticated;
grant select, insert on table public.reviews to authenticated;
grant select on table public.reviews to anon;
grant select, insert, update, delete on table public.movie_bookmarks to service_role;
grant select, insert, update, delete on table public.reviews to service_role;
