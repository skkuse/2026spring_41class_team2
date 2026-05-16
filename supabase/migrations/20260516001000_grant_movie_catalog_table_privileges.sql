grant usage on schema public to service_role;

grant select, insert, update, delete on table public.movies to service_role;
grant select, insert, update, delete on table public.genres to service_role;
grant select, insert, update, delete on table public.movie_genres to service_role;
