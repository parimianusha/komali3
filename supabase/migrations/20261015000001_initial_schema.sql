-- ==============================================================================
-- Intelligent Document Processor: Database Schema & Row-Level Security
-- (100% Idempotent - Safe to run multiple times in Supabase SQL Editor)
-- ==============================================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";

-- ------------------------------------------------------------------------------
-- 1. PROFILES TABLE
-- ------------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Trigger to update updated_at on profiles
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- Trigger to automatically create profile record when auth.users is created
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do update
  set display_name = excluded.display_name;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 2. DOCUMENTS TABLE
-- ------------------------------------------------------------------------------
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  original_name text not null check (char_length(original_name) between 1 and 255),
  mime_type text not null check (mime_type in ('application/pdf', 'image/png', 'image/jpeg', 'text/plain')),
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 52428800), -- max 50MB
  storage_path text not null unique,
  category text not null default 'other' check (category in ('invoice', 'receipt', 'contract', 'form', 'letter', 'report', 'other')),
  custom_category text check (custom_category is null or char_length(custom_category) <= 50),
  status text not null default 'uploaded' check (status in ('uploaded', 'processing', 'completed', 'failed')),
  extracted_text text,
  processing_attempts integer not null default 0 check (processing_attempts >= 0),
  processing_leased_at timestamptz,
  last_error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  processed_at timestamptz,
  constraint check_custom_category_rule check (
    (category = 'other') or (custom_category is null)
  )
);

drop trigger if exists set_documents_updated_at on public.documents;
create trigger set_documents_updated_at
  before update on public.documents
  for each row execute function public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 3. DOCUMENT EXTRACTIONS TABLE
-- ------------------------------------------------------------------------------
create table if not exists public.document_extractions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  version integer not null check (version > 0),
  provider text not null,
  model text not null,
  schema_version text not null,
  result jsonb not null,
  warnings jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  constraint uq_document_version unique (document_id, version)
);

-- ------------------------------------------------------------------------------
-- 4. DOCUMENT REVIEWS TABLE
-- ------------------------------------------------------------------------------
create table if not exists public.document_reviews (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  reviewer_id uuid not null references auth.users(id) on delete cascade,
  field_key text not null check (char_length(field_key) between 1 and 64),
  original_value jsonb,
  corrected_value jsonb,
  verified boolean not null default false,
  note text check (note is null or char_length(note) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_document_reviewer_field unique (document_id, reviewer_id, field_key)
);

drop trigger if exists set_document_reviews_updated_at on public.document_reviews;
create trigger set_document_reviews_updated_at
  before update on public.document_reviews
  for each row execute function public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 5. DOCUMENT TAGS TABLE
-- ------------------------------------------------------------------------------
create table if not exists public.document_tags (
  document_id uuid not null references public.documents(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  tag text not null check (char_length(tag) between 1 and 50),
  created_at timestamptz not null default now(),
  primary key (document_id, tag)
);

-- ------------------------------------------------------------------------------
-- 6. INDEXES FOR PERFORMANCE & FULL-TEXT SEARCH
-- ------------------------------------------------------------------------------
create index if not exists idx_documents_owner_created on public.documents (owner_id, created_at desc);
create index if not exists idx_documents_owner_status on public.documents (owner_id, status);
create index if not exists idx_documents_owner_category on public.documents (owner_id, category);
create index if not exists idx_documents_trgm_name on public.documents using gin (original_name gin_trgm_ops);
create index if not exists idx_documents_tsv_text on public.documents using gin (to_tsvector('english', coalesce(extracted_text, '')));

create index if not exists idx_extractions_doc on public.document_extractions (document_id, version desc);
create index if not exists idx_reviews_doc_reviewer on public.document_reviews (document_id, reviewer_id);
create index if not exists idx_tags_owner_tag on public.document_tags (owner_id, tag);

-- ------------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.documents enable row level security;
alter table public.document_extractions enable row level security;
alter table public.document_reviews enable row level security;
alter table public.document_tags enable row level security;

-- Profiles Policies
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Documents Policies
drop policy if exists "Users can view own documents" on public.documents;
create policy "Users can view own documents"
  on public.documents for select
  to authenticated
  using (owner_id = auth.uid());

drop policy if exists "Users can insert own documents" on public.documents;
create policy "Users can insert own documents"
  on public.documents for insert
  to authenticated
  with check (owner_id = auth.uid());

drop policy if exists "Users can update own documents" on public.documents;
create policy "Users can update own documents"
  on public.documents for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists "Users can delete own documents" on public.documents;
create policy "Users can delete own documents"
  on public.documents for delete
  to authenticated
  using (owner_id = auth.uid());

-- Document Extractions Policies
drop policy if exists "Users can view own document extractions" on public.document_extractions;
create policy "Users can view own document extractions"
  on public.document_extractions for select
  to authenticated
  using (
    exists (
      select 1 from public.documents d
      where d.id = document_extractions.document_id
      and d.owner_id = auth.uid()
    )
  );

drop policy if exists "Users can insert own document extractions" on public.document_extractions;
create policy "Users can insert own document extractions"
  on public.document_extractions for insert
  to authenticated
  with check (
    exists (
      select 1 from public.documents d
      where d.id = document_extractions.document_id
      and d.owner_id = auth.uid()
    )
  );

drop policy if exists "Users can delete own document extractions" on public.document_extractions;
create policy "Users can delete own document extractions"
  on public.document_extractions for delete
  to authenticated
  using (
    exists (
      select 1 from public.documents d
      where d.id = document_extractions.document_id
      and d.owner_id = auth.uid()
    )
  );

-- Document Reviews Policies
drop policy if exists "Users can view reviews on own documents" on public.document_reviews;
create policy "Users can view reviews on own documents"
  on public.document_reviews for select
  to authenticated
  using (
    reviewer_id = auth.uid() and
    exists (
      select 1 from public.documents d
      where d.id = document_reviews.document_id
      and d.owner_id = auth.uid()
    )
  );

drop policy if exists "Users can insert reviews on own documents" on public.document_reviews;
create policy "Users can insert reviews on own documents"
  on public.document_reviews for insert
  to authenticated
  with check (
    reviewer_id = auth.uid() and
    exists (
      select 1 from public.documents d
      where d.id = document_reviews.document_id
      and d.owner_id = auth.uid()
    )
  );

drop policy if exists "Users can update reviews on own documents" on public.document_reviews;
create policy "Users can update reviews on own documents"
  on public.document_reviews for update
  to authenticated
  using (
    reviewer_id = auth.uid() and
    exists (
      select 1 from public.documents d
      where d.id = document_reviews.document_id
      and d.owner_id = auth.uid()
    )
  )
  with check (
    reviewer_id = auth.uid() and
    exists (
      select 1 from public.documents d
      where d.id = document_reviews.document_id
      and d.owner_id = auth.uid()
    )
  );

drop policy if exists "Users can delete reviews on own documents" on public.document_reviews;
create policy "Users can delete reviews on own documents"
  on public.document_reviews for delete
  to authenticated
  using (
    reviewer_id = auth.uid() and
    exists (
      select 1 from public.documents d
      where d.id = document_reviews.document_id
      and d.owner_id = auth.uid()
    )
  );

-- Document Tags Policies
drop policy if exists "Users can view tags on own documents" on public.document_tags;
create policy "Users can view tags on own documents"
  on public.document_tags for select
  to authenticated
  using (
    owner_id = auth.uid() and
    exists (
      select 1 from public.documents d
      where d.id = document_tags.document_id
      and d.owner_id = auth.uid()
    )
  );

drop policy if exists "Users can insert tags on own documents" on public.document_tags;
create policy "Users can insert tags on own documents"
  on public.document_tags for insert
  to authenticated
  with check (
    owner_id = auth.uid() and
    exists (
      select 1 from public.documents d
      where d.id = document_tags.document_id
      and d.owner_id = auth.uid()
    )
  );

drop policy if exists "Users can delete tags on own documents" on public.document_tags;
create policy "Users can delete tags on own documents"
  on public.document_tags for delete
  to authenticated
  using (
    owner_id = auth.uid() and
    exists (
      select 1 from public.documents d
      where d.id = document_tags.document_id
      and d.owner_id = auth.uid()
    )
  );

-- ------------------------------------------------------------------------------
-- 8. REFRESH SCHEMA CACHE
-- ------------------------------------------------------------------------------
notify pgrst, 'reload schema';
