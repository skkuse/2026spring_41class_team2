drop policy if exists movie_bookmarks_select_own on public.movie_bookmarks;
drop policy if exists movie_bookmarks_insert_own on public.movie_bookmarks;
drop policy if exists movie_bookmarks_delete_own on public.movie_bookmarks;

drop policy if exists reviews_select_all on public.reviews;
drop policy if exists reviews_insert_own on public.reviews;

alter table public.movie_bookmarks disable row level security;
alter table public.reviews disable row level security;

revoke select, insert, delete on table public.movie_bookmarks from authenticated;
revoke select, insert on table public.reviews from authenticated;
revoke select on table public.reviews from anon;
revoke select, insert, update, delete on table public.movie_bookmarks from service_role;
revoke select, insert, update, delete on table public.reviews from service_role;
