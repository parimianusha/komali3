-- ==============================================================================
-- AgriSage AI: Complete Database Schema, Row-Level Security & Storage Policies
-- 100% Idempotent - Safe to execute in Supabase SQL Editor
-- ==============================================================================

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";

-- Utility function for updated_at timestamps
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ------------------------------------------------------------------------------
-- 2. PROFILES TABLE (Farmer Profile)
-- ------------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  preferred_language text not null default 'en' check (preferred_language in ('en', 'te', 'hi')),
  country text not null default 'India',
  state text,
  district text,
  village text,
  preferred_units text not null default 'metric' check (preferred_units in ('metric', 'imperial', 'traditional')),
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ensure all columns exist if table was previously created with fewer columns
alter table public.profiles add column if not exists preferred_language text not null default 'en';
alter table public.profiles add column if not exists country text not null default 'India';
alter table public.profiles add column if not exists state text;
alter table public.profiles add column if not exists district text;
alter table public.profiles add column if not exists village text;
alter table public.profiles add column if not exists preferred_units text not null default 'metric';
alter table public.profiles add column if not exists phone text;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- Trigger for auth.users creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, preferred_language)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'preferred_language', 'en')
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
-- 3. FARMS TABLE
-- ------------------------------------------------------------------------------
create table if not exists public.farms (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 150),
  approximate_location text,
  state text not null check (char_length(state) between 1 and 100),
  district text not null check (char_length(district) between 1 and 100),
  area numeric not null check (area > 0),
  area_unit text not null default 'acres' check (area_unit in ('acres', 'hectares', 'bigha', 'guntha')),
  soil_type text not null default 'alluvial' check (soil_type in ('alluvial', 'black', 'red', 'laterite', 'arid', 'clayey', 'loamy', 'sandy', 'silt', 'other')),
  soil_ph numeric check (soil_ph is null or (soil_ph between 2.0 and 12.0)),
  organic_carbon text,
  nitrogen_status text default 'unknown' check (nitrogen_status in ('low', 'medium', 'high', 'unknown')),
  phosphorus_status text default 'unknown' check (phosphorus_status in ('low', 'medium', 'high', 'unknown')),
  potassium_status text default 'unknown' check (potassium_status in ('low', 'medium', 'high', 'unknown')),
  irrigation_method text not null default 'drip' check (irrigation_method in ('drip', 'sprinkler', 'canal_flood', 'borewell', 'rainfed', 'furrow', 'other')),
  water_availability text not null default 'moderate' check (water_availability in ('abundant', 'moderate', 'seasonal', 'scarce')),
  growing_season text not null default 'kharif' check (growing_season in ('kharif', 'rabi', 'zaid', 'perennial', 'all_year')),
  notes text,
  is_sample boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_farms_updated_at on public.farms;
create trigger set_farms_updated_at
  before update on public.farms
  for each row execute function public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 4. CROPS TABLE
-- ------------------------------------------------------------------------------
create table if not exists public.crops (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  crop_name text not null check (char_length(crop_name) between 1 and 100),
  variety text check (variety is null or char_length(variety) <= 100),
  sowing_date date not null,
  growth_stage text not null default 'vegetative' check (growth_stage in ('germination', 'vegetative', 'tillering_flowering', 'fruit_grain_development', 'maturity_harvest', 'post_harvest')),
  season text not null default 'kharif' check (season in ('kharif', 'rabi', 'zaid', 'whole_year')),
  irrigation_details text,
  field_observations text,
  status text not null default 'active' check (status in ('active', 'harvested', 'planned', 'failed')),
  is_sample boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_crops_updated_at on public.crops;
create trigger set_crops_updated_at
  before update on public.crops
  for each row execute function public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 5. ADVISORIES TABLE (AI Crop Advisory & Disease Diagnosis)
-- ------------------------------------------------------------------------------
create table if not exists public.advisories (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  farm_id uuid references public.farms(id) on delete set null,
  crop_id uuid references public.crops(id) on delete set null,
  category text not null check (category in (
    'disease_pest',
    'crop_selection',
    'nutrient_management',
    'soil_health',
    'irrigation_water',
    'weed_management',
    'harvest_post_harvest',
    'climate_weather',
    'general_management',
    'document_interpretation'
  )),
  title text not null check (char_length(title) between 1 and 255),
  user_description text not null,
  affected_plant_parts text[] default '{}',
  duration_spread text,
  image_url text,
  language text not null default 'en' check (language in ('en', 'te', 'hi')),
  weather_context jsonb,
  structured_report jsonb not null,
  status text not null default 'completed' check (status in ('completed', 'processing', 'failed')),
  is_sample boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_advisories_updated_at on public.advisories;
create trigger set_advisories_updated_at
  before update on public.advisories
  for each row execute function public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 6. DOCUMENTS TABLE (Intelligent Agricultural Document Processing)
-- ------------------------------------------------------------------------------
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  original_name text not null check (char_length(original_name) between 1 and 255),
  mime_type text not null check (mime_type in ('application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'text/plain')),
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 52428800), -- max 50MB
  storage_path text not null unique,
  category text not null default 'other',
  custom_category text check (custom_category is null or char_length(custom_category) <= 50),
  status text not null default 'uploaded' check (status in ('uploaded', 'processing', 'completed', 'failed')),
  extracted_text text,
  processing_attempts integer not null default 0 check (processing_attempts >= 0),
  processing_leased_at timestamptz,
  last_error_code text,
  is_sample boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  processed_at timestamptz
);

alter table public.documents add column if not exists is_sample boolean not null default false;

drop trigger if exists set_documents_updated_at on public.documents;
create trigger set_documents_updated_at
  before update on public.documents
  for each row execute function public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 7. DOCUMENT EXTRACTIONS TABLE
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
-- 8. DOCUMENT REVIEWS TABLE
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
-- 9. INDEXES
-- ------------------------------------------------------------------------------
create index if not exists idx_farms_owner on public.farms (owner_id, created_at desc);
create index if not exists idx_farms_location on public.farms (state, district);

create index if not exists idx_crops_farm on public.crops (farm_id, created_at desc);
create index if not exists idx_crops_owner on public.crops (owner_id, status);

create index if not exists idx_advisories_owner on public.advisories (owner_id, created_at desc);
create index if not exists idx_advisories_farm on public.advisories (farm_id);
create index if not exists idx_advisories_crop on public.advisories (crop_id);
create index if not exists idx_advisories_category on public.advisories (owner_id, category);

create index if not exists idx_documents_owner_created on public.documents (owner_id, created_at desc);
create index if not exists idx_documents_owner_status on public.documents (owner_id, status);
create index if not exists idx_documents_owner_category on public.documents (owner_id, category);
create index if not exists idx_documents_trgm_name on public.documents using gin (original_name gin_trgm_ops);

create index if not exists idx_extractions_doc on public.document_extractions (document_id, version desc);
create index if not exists idx_reviews_doc_reviewer on public.document_reviews (document_id, reviewer_id);

-- ------------------------------------------------------------------------------
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.farms enable row level security;
alter table public.crops enable row level security;
alter table public.advisories enable row level security;
alter table public.documents enable row level security;
alter table public.document_extractions enable row level security;
alter table public.document_reviews enable row level security;

-- Profiles Policies
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles for select to authenticated using (id = auth.uid());

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles for insert to authenticated with check (id = auth.uid());

-- Farms Policies
drop policy if exists "Users can view own farms" on public.farms;
create policy "Users can view own farms" on public.farms for select to authenticated using (owner_id = auth.uid());

drop policy if exists "Users can insert own farms" on public.farms;
create policy "Users can insert own farms" on public.farms for insert to authenticated with check (owner_id = auth.uid());

drop policy if exists "Users can update own farms" on public.farms;
create policy "Users can update own farms" on public.farms for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "Users can delete own farms" on public.farms;
create policy "Users can delete own farms" on public.farms for delete to authenticated using (owner_id = auth.uid());

-- Crops Policies
drop policy if exists "Users can view own crops" on public.crops;
create policy "Users can view own crops" on public.crops for select to authenticated using (owner_id = auth.uid());

drop policy if exists "Users can insert own crops" on public.crops;
create policy "Users can insert own crops" on public.crops for insert to authenticated with check (owner_id = auth.uid());

drop policy if exists "Users can update own crops" on public.crops;
create policy "Users can update own crops" on public.crops for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "Users can delete own crops" on public.crops;
create policy "Users can delete own crops" on public.crops for delete to authenticated using (owner_id = auth.uid());

-- Advisories Policies
drop policy if exists "Users can view own advisories" on public.advisories;
create policy "Users can view own advisories" on public.advisories for select to authenticated using (owner_id = auth.uid());

drop policy if exists "Users can insert own advisories" on public.advisories;
create policy "Users can insert own advisories" on public.advisories for insert to authenticated with check (owner_id = auth.uid());

drop policy if exists "Users can update own advisories" on public.advisories;
create policy "Users can update own advisories" on public.advisories for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "Users can delete own advisories" on public.advisories;
create policy "Users can delete own advisories" on public.advisories for delete to authenticated using (owner_id = auth.uid());

-- Documents Policies
drop policy if exists "Users can view own documents" on public.documents;
create policy "Users can view own documents" on public.documents for select to authenticated using (owner_id = auth.uid());

drop policy if exists "Users can insert own documents" on public.documents;
create policy "Users can insert own documents" on public.documents for insert to authenticated with check (owner_id = auth.uid());

drop policy if exists "Users can update own documents" on public.documents;
create policy "Users can update own documents" on public.documents for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "Users can delete own documents" on public.documents;
create policy "Users can delete own documents" on public.documents for delete to authenticated using (owner_id = auth.uid());

-- Extractions Policies
drop policy if exists "Users can view own document extractions" on public.document_extractions;
create policy "Users can view own document extractions" on public.document_extractions for select to authenticated
  using (exists (select 1 from public.documents d where d.id = document_extractions.document_id and d.owner_id = auth.uid()));

drop policy if exists "Users can insert own document extractions" on public.document_extractions;
create policy "Users can insert own document extractions" on public.document_extractions for insert to authenticated
  with check (exists (select 1 from public.documents d where d.id = document_extractions.document_id and d.owner_id = auth.uid()));

-- Reviews Policies
drop policy if exists "Users can view reviews on own documents" on public.document_reviews;
create policy "Users can view reviews on own documents" on public.document_reviews for select to authenticated
  using (reviewer_id = auth.uid() and exists (select 1 from public.documents d where d.id = document_reviews.document_id and d.owner_id = auth.uid()));

drop policy if exists "Users can insert reviews on own documents" on public.document_reviews;
create policy "Users can insert reviews on own documents" on public.document_reviews for insert to authenticated
  with check (reviewer_id = auth.uid() and exists (select 1 from public.documents d where d.id = document_reviews.document_id and d.owner_id = auth.uid()));

drop policy if exists "Users can update reviews on own documents" on public.document_reviews;
create policy "Users can update reviews on own documents" on public.document_reviews for update to authenticated
  using (reviewer_id = auth.uid() and exists (select 1 from public.documents d where d.id = document_reviews.document_id and d.owner_id = auth.uid()))
  with check (reviewer_id = auth.uid() and exists (select 1 from public.documents d where d.id = document_reviews.document_id and d.owner_id = auth.uid()));

-- ------------------------------------------------------------------------------
-- 11. STORAGE BUCKET POLICIES (documents bucket)
-- ------------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

drop policy if exists "Authenticated users can upload documents" on storage.objects;
create policy "Authenticated users can upload documents"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can read own documents" on storage.objects;
create policy "Users can read own documents"
  on storage.objects for select to authenticated
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can delete own documents" on storage.objects;
create policy "Users can delete own documents"
  on storage.objects for delete to authenticated
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

-- ------------------------------------------------------------------------------
-- 12. NOTIFY SCHEMA RELOAD
-- ------------------------------------------------------------------------------
notify pgrst, 'reload schema';
