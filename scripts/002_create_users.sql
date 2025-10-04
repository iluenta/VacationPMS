-- Drop table if exists to start fresh
drop table if exists public.users cascade;

-- Create users table that extends auth.users
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid references public.tenants(id) on delete cascade,
  email text not null,
  full_name text,
  is_admin boolean default false,
  theme_color text default 'blue',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Explicitly disable RLS for now (will be enabled in script 005)
alter table public.users disable row level security;

-- Grant necessary permissions
grant all on public.users to postgres, service_role;
grant select, insert, update on public.users to authenticated;
