-- Create Subscriptions Table for Wompi Recurring Billing

create table if not exists public.subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  
  -- Wompi Tokenization Data
  wompi_token text not null, -- The credit card token "tok_..."
  wompi_acceptance_token text, -- Acceptance token used during initial setup
  
  -- Subscription Details
  status text not null check (status in ('active', 'past_due', 'cancelled', 'paused')),
  amount numeric(10, 2) not null, -- Price in full units (e.g. 74.99)
  currency text default 'USD' not null,
  
  -- Billing Cycle
  frequency text default 'monthly', -- monthly, yearly
  last_charged_at timestamp with time zone,
  next_billing_date timestamp with time zone not null,
  payment_retries int default 0,
  
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- RLS Policies (Optional but recommended)
alter table public.subscriptions enable row level security;

-- Only Admins (or Service Role) can see/edit all subscriptions
create policy "Admins can view all subscriptions"
  on public.subscriptions for select
  using ( auth.uid() in (select id from public.users where role = 'admin') );

-- Users can view their own subscription
create policy "Users can view own subscription"
  on public.subscriptions for select
  using ( auth.uid() = user_id );

-- Indexes
create index if not exists idx_subscriptions_user_id on public.subscriptions(user_id);
create index if not exists idx_subscriptions_next_billing on public.subscriptions(next_billing_date) where status = 'active';
