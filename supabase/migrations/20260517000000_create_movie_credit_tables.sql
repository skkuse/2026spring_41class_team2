create table public.people (
  id bigint primary key,
  name text not null,
  profile_path text,
  known_for_department text,
  popularity numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.movie_casts (
  movie_id bigint not null references public.movies(id) on delete cascade,
  person_id bigint not null references public.people(id) on delete restrict,
  character_name text not null,
  cast_order integer,
  primary key (movie_id, person_id, character_name)
);

create table public.movie_crew (
  movie_id bigint not null references public.movies(id) on delete cascade,
  person_id bigint not null references public.people(id) on delete restrict,
  department text not null,
  job text not null,
  primary key (movie_id, person_id, department, job)
);

create index movie_casts_person_id_idx on public.movie_casts (person_id);
create index movie_casts_movie_id_cast_order_idx on public.movie_casts (movie_id, cast_order);
create index movie_crew_person_id_idx on public.movie_crew (person_id);
create index movie_crew_movie_id_job_idx on public.movie_crew (movie_id, job);

create or replace function public.set_people_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger people_set_updated_at
before update on public.people
for each row
execute function public.set_people_updated_at();
