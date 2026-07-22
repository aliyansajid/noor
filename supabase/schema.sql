-- Noor — Supabase schema (run in the SQL editor).
-- Auth (Google) + per-user personalization synced across devices.

-- 1) Profiles: one row per auth user, populated on sign-up + refreshed on login.
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text,
  full_name   text,
  avatar_url  text,
  onboarded   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 2) Settings: the user's preferences (theme, translation, reciter, tafsir,
--    arabic script, calendar, time format) as a single JSON blob.
create table if not exists public.user_settings (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  preferences jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

-- Keep updated_at fresh on writes.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists user_settings_touch on public.user_settings;
create trigger user_settings_touch before update on public.user_settings
  for each row execute function public.touch_updated_at();

-- Auto-create a profile row when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3) Row-Level Security: each user sees and writes only their own rows.
alter table public.profiles      enable row level security;
alter table public.user_settings enable row level security;

drop policy if exists "profiles are self-owned" on public.profiles;
create policy "profiles are self-owned" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "settings are self-owned" on public.user_settings;
create policy "settings are self-owned" on public.user_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 4) Chat history: conversations + their messages (ayah cards stored as jsonb).
create table if not exists public.conversations (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists conversations_user_updated
  on public.conversations (user_id, updated_at desc);

create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  role            text not null check (role in ('user', 'assistant')),
  content         text not null default '',
  ayat            jsonb,
  created_at      timestamptz not null default now()
);
create index if not exists messages_conversation_created
  on public.messages (conversation_id, created_at);

drop trigger if exists conversations_touch on public.conversations;
create trigger conversations_touch before update on public.conversations
  for each row execute function public.touch_updated_at();

-- Bump the parent conversation's updated_at whenever a message is added.
create or replace function public.bump_conversation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.conversations set updated_at = now() where id = new.conversation_id;
  return new;
end $$;

drop trigger if exists messages_bump on public.messages;
create trigger messages_bump after insert on public.messages
  for each row execute function public.bump_conversation();

alter table public.conversations enable row level security;
alter table public.messages      enable row level security;

drop policy if exists "conversations are self-owned" on public.conversations;
create policy "conversations are self-owned" on public.conversations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- A message is accessible when the user owns its parent conversation.
drop policy if exists "messages via own conversation" on public.messages;
create policy "messages via own conversation" on public.messages
  for all
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );
