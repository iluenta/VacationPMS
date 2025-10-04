# Database Setup Instructions

## Overview
This PMS uses a multi-tenant architecture with Supabase as the database backend.

## Database Schema

### Tables
1. **tenants** - Stores tenant/organization information
2. **users** - Extends auth.users with tenant relationship and additional fields

### Multi-Tenant Architecture
- Each user belongs to a tenant (except admin users)
- Admin users (is_admin = true) can access all tenants
- Regular users can only access data from their assigned tenant
- Row Level Security (RLS) enforces tenant isolation

## Running the Scripts

**IMPORTANT:** The scripts must be run in this exact order to avoid errors:

1. `001_create_tenants.sql` - Creates the tenants table (without RLS)
2. `002_create_users.sql` - Creates the users table (without RLS)
3. `003_create_user_trigger.sql` - Sets up automatic user profile creation
4. `004_seed_initial_data.sql` - Seeds initial test data
5. `005_enable_rls_policies.sql` - Enables RLS and creates all security policies

### Why This Order?

The RLS policies reference both tables, so both must exist before enabling RLS. This prevents the "Tenant or user not found" error.

### How to Run Scripts in v0

You can run these scripts directly from the v0 interface:
1. The scripts are in the `/scripts` folder
2. Click on each script in order and execute them
3. No need to go to the Supabase dashboard

## User Types

### Admin User
- Set `is_admin: true` in signup metadata
- Can view and manage all tenants
- tenant_id can be null

### Regular User
- Set `tenant_id` in signup metadata
- Can only access their assigned tenant
- Must belong to a valid tenant

## Environment Variables

All Supabase environment variables are already configured in your v0 project:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY

For local development, copy `.env.local.example` to `.env.local`

## Security

- All tables use Row Level Security (RLS)
- Users can only access data from their tenant
- Admin users have elevated permissions
- Authentication is handled by Supabase Auth
