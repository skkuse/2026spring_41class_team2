grant usage on schema public to service_role;

grant select, insert, update, delete on table public.movie_stats to service_role;
grant select, insert, update, delete on table public.movie_similarities to service_role;
grant select, insert, update, delete on table public.movie_tags to service_role;
grant select, insert, update, delete on table public.movie_tag_relevances to service_role;
