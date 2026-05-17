grant usage on schema public to service_role;

grant select, insert, update, delete on table public.people to service_role;
grant select, insert, update, delete on table public.movie_casts to service_role;
grant select, insert, update, delete on table public.movie_crew to service_role;
