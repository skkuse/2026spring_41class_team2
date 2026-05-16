create table public.movies (
  id bigint primary key,
  movielens_id bigint not null unique,
  title text not null,
  original_title text,
  overview text,
  release_date date,
  release_year integer,
  runtime integer,
  original_language text,
  production_countries jsonb not null default '[]'::jsonb,
  poster_path text,
  backdrop_path text,
  trailer_url text,
  adult boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.genres (
  id bigint primary key,
  name text not null,
  name_ko text
);

create table public.movie_genres (
  movie_id bigint not null references public.movies(id) on delete cascade,
  genre_id bigint not null references public.genres(id) on delete restrict,
  primary key (movie_id, genre_id)
);

create index movie_genres_genre_id_idx on public.movie_genres (genre_id);
create index movies_release_year_idx on public.movies (release_year);

create or replace function public.set_movies_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger movies_set_updated_at
before update on public.movies
for each row
execute function public.set_movies_updated_at();
