-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.guide_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  description text,
  icon character varying,
  order_index integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT guide_categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.guide_content (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  category_id uuid,
  title character varying NOT NULL,
  description text,
  content text NOT NULL,
  image_url character varying,
  external_link character varying,
  link_text character varying,
  tags ARRAY,
  is_featured boolean DEFAULT false,
  order_index integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT guide_content_pkey PRIMARY KEY (id),
  CONSTRAINT guide_content_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.guide_categories(id)
);
CREATE TABLE public.tenants (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT tenants_pkey PRIMARY KEY (id)
);
CREATE TABLE public.users (
  id uuid NOT NULL,
  tenant_id uuid,
  email text NOT NULL,
  full_name text,
  is_admin boolean DEFAULT false,
  theme_color text DEFAULT 'blue'::text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);