-- Drop table if exists to start fresh
drop table if exists public.tenants cascade;

-- Create tenants table for multi-tenant architecture
create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Explicitly disable RLS for now (will be enabled in script 005)
alter table public.tenants disable row level security;

-- Grant necessary permissions
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on public.tenants to postgres, service_role;
grant select, insert, update on public.tenants to authenticated;
-- Adding public read access so tenants appear in signup form
grant select on public.tenants to anon;

-- Insert default tenants for testing
insert into public.tenants (id, name, slug)
values 
  ('00000000-0000-0000-0000-000000000001', 'Demo Tenant', 'demo'),
  ('00000000-0000-0000-0000-000000000002', 'Acme Properties', 'acme')
on conflict (id) do nothing;
