begin;

-- Piggi currently allows one active commitment per account. Enforce the rule
-- at the database boundary as well as in the form so concurrent devices cannot
-- create two locked Pigs for the same user.
create unique index pigs_one_locked_per_user_idx
on public.pigs (user_id)
where status = 'locked';

commit;
