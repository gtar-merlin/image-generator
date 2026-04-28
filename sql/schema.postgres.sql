create table if not exists diagram_requests (
  id uuid primary key,
  original_prompt text not null,
  settings jsonb not null default '{}'::jsonb,
  status text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists diagram_generations (
  id uuid primary key,
  request_id uuid not null references diagram_requests(id) on delete cascade,
  provider text not null,
  model text not null,
  refined_prompt text not null,
  diagram_spec jsonb not null,
  compiled_js text not null,
  validation_result jsonb not null,
  raw_provider_response jsonb,
  status text not null,
  created_at timestamptz not null default now()
);

create table if not exists diagram_artifacts (
  id uuid primary key,
  generation_id uuid not null references diagram_generations(id) on delete cascade,
  type text not null,
  format text not null,
  storage_key text,
  created_at timestamptz not null default now()
);
