create table public.user_onboarding_movies (
  user_id uuid not null references public.profiles(id) on delete cascade,
  movie_id bigint not null references public.movies(id) on delete cascade,
  position integer not null,
  created_at timestamptz not null default now(),
  primary key (user_id, movie_id),
  constraint user_onboarding_movies_user_position_key unique (user_id, position),
  constraint user_onboarding_movies_position_range_check check (position >= 1 and position <= 5)
);

create index user_onboarding_movies_movie_id_idx
  on public.user_onboarding_movies (movie_id);

grant select, insert, update, delete on table public.user_onboarding_movies to service_role;
grant update on table public.profiles to service_role;
