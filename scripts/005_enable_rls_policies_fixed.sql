-- Enable RLS on both tables
alter table public.tenants enable row level security;
alter table public.users enable row level security;

-- ============================================
-- DROP EXISTING POLICIES FIRST
-- ============================================

-- Drop existing policies on tenants table
drop policy if exists "Admin users can view all tenants" on public.tenants;
drop policy if exists "Users can view their own tenant" on public.tenants;
drop policy if exists "Admin users can insert tenants" on public.tenants;
drop policy if exists "Admin users can update tenants" on public.tenants;

-- Drop existing policies on users table
drop policy if exists "Users can view own profile" on public.users;
drop policy if exists "Admin users can view all users" on public.users;
drop policy if exists "Users can insert own profile" on public.users;
drop policy if exists "Users can update own profile" on public.users;
drop policy if exists "Admin users can update any user" on public.users;

-- ============================================
-- TENANTS TABLE POLICIES
-- ============================================

-- Admin users can see all tenants
create policy "Admin users can view all tenants"
  on public.tenants for select
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid()
      and users.is_admin = true
    )
  );

-- Regular users can only see their own tenant
create policy "Users can view their own tenant"
  on public.tenants for select
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid()
      and users.tenant_id = tenants.id
    )
  );

-- Only admins can insert tenants
create policy "Admin users can insert tenants"
  on public.tenants for insert
  with check (
    exists (
      select 1 from public.users
      where users.id = auth.uid()
      and users.is_admin = true
    )
  );

-- Only admins can update tenants
create policy "Admin users can update tenants"
  on public.tenants for update
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid()
      and users.is_admin = true
    )
  );

-- ============================================
-- USERS TABLE POLICIES
-- ============================================

-- Users can view their own profile
create policy "Users can view own profile"
  on public.users for select
  using (auth.uid() = id);

-- Admin users can view all users
create policy "Admin users can view all users"
  on public.users for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
      and u.is_admin = true
    )
  );

-- Users can insert their own profile
create policy "Users can insert own profile"
  on public.users for insert
  with check (auth.uid() = id);

-- Users can update their own profile
create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);

-- Admin users can update any user
create policy "Admin users can update any user"
  on public.users for update
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
      and u.is_admin = true
    )
  );
