create table public.movie_stats (
  movie_id bigint primary key references public.movies(id) on delete cascade,
  movielens_avg_rating numeric(3,2) not null,
  movielens_rating_count integer not null default 0,
  cinemate_rating_sum numeric(10,2) not null default 0,
  cinemate_review_count integer not null default 0,
  user_tag_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint movie_stats_movielens_avg_rating_range_check
    check (movielens_avg_rating >= 0 and movielens_avg_rating <= 5),
  constraint movie_stats_movielens_rating_count_check
    check (movielens_rating_count >= 0),
  constraint movie_stats_cinemate_rating_sum_check
    check (cinemate_rating_sum >= 0),
  constraint movie_stats_cinemate_review_count_check
    check (cinemate_review_count >= 0),
  constraint movie_stats_user_tag_count_check
    check (user_tag_count >= 0)
);

create table public.movie_similarities (
  source_movie_id bigint not null references public.movie_stats(movie_id) on delete cascade,
  target_movie_id bigint not null references public.movie_stats(movie_id) on delete cascade,
  score real not null,
  co_rating_count integer not null,
  primary key (source_movie_id, target_movie_id),
  constraint movie_similarities_no_self_reference_check
    check (source_movie_id <> target_movie_id),
  constraint movie_similarities_score_positive_check
    check (score > 0),
  constraint movie_similarities_co_rating_count_check
    check (co_rating_count >= 0)
);

create table public.movie_tags (
  tag_id integer primary key,
  tag text not null unique
);

create table public.movie_tag_relevances (
  movie_id bigint not null references public.movies(id) on delete cascade,
  tag_id integer not null references public.movie_tags(tag_id) on delete restrict,
  relevance real not null,
  primary key (movie_id, tag_id),
  constraint movie_tag_relevances_relevance_range_check
    check (relevance >= 0 and relevance <= 1)
);

create index movie_stats_fallback_idx
  on public.movie_stats (movielens_rating_count desc, movielens_avg_rating desc);

create index movie_similarities_source_score_idx
  on public.movie_similarities (source_movie_id, score desc);

create index movie_tag_relevances_tag_relevance_movie_idx
  on public.movie_tag_relevances (tag_id, relevance desc, movie_id);

create index movie_tag_relevances_movie_relevance_idx
  on public.movie_tag_relevances (movie_id, relevance desc);

create or replace function public.set_movie_stats_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger movie_stats_set_updated_at
before update on public.movie_stats
for each row
execute function public.set_movie_stats_updated_at();
