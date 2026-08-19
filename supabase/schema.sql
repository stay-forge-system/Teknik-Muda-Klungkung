-- ============================================
-- TMK Billing App - Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- PROFILES TABLE
-- ============================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  email text not null,
  role text not null default 'teknisi' check (role in ('owner', 'admin', 'teknisi', 'viewer')),
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- CLIENTS TABLE
-- ============================================
create table public.clients (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  company text,
  email text,
  phone text,
  address text,
  city text,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id)
);

-- ============================================
-- PRODUCTS TABLE
-- ============================================
create table public.products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  category text not null check (category in (
    'CCTV', 'Access Point', 'Instalasi Listrik', 
    'Kabel LAN', 'Kabel FO', 'Kabel Listrik', 
    'Cleaning AC', 'Jasa', 'Lainnya'
  )),
  description text,
  unit text not null default 'pcs' check (unit in ('pcs', 'meter', 'unit', 'set', 'titik', 'roll', 'box')),
  price numeric(15,2) not null default 0,
  is_custom_price boolean not null default false,
  stock integer,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id)
);

-- ============================================
-- BILLS TABLE
-- ============================================
create table public.bills (
  id uuid primary key default uuid_generate_v4(),
  bill_number text not null unique,
  client_id uuid not null references public.clients(id),
  title text not null,
  description text,
  status text not null default 'draft' check (status in ('draft', 'sent', 'paid', 'cancelled')),
  issue_date date not null default current_date,
  due_date date,
  subtotal numeric(15,2) not null default 0,
  discount numeric(15,2) not null default 0,
  tax numeric(15,2) not null default 0,
  total numeric(15,2) not null default 0,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- BILL ITEMS TABLE
-- ============================================
create table public.bill_items (
  id uuid primary key default uuid_generate_v4(),
  bill_id uuid not null references public.bills(id) on delete cascade,
  product_id uuid references public.products(id),
  name text not null,
  description text,
  quantity numeric(10,2) not null default 1,
  unit text not null default 'pcs',
  unit_price numeric(15,2) not null default 0,
  total numeric(15,2) not null default 0,
  is_custom_price boolean not null default false,
  sort_order integer not null default 0
);

-- ============================================
-- AUTO BILL NUMBER FUNCTION
-- ============================================
create or replace function generate_bill_number()
returns text as $$
declare
  year_str text;
  seq_num integer;
  bill_num text;
begin
  year_str := to_char(now(), 'YYYY');
  select count(*) + 1 into seq_num
  from public.bills
  where extract(year from created_at) = extract(year from now());
  
  bill_num := 'TMK-' || year_str || '-' || lpad(seq_num::text, 4, '0');
  return bill_num;
end;
$$ language plpgsql;

-- ============================================
-- UPDATE TIMESTAMP TRIGGER
-- ============================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger bills_updated_at
  before update on public.bills
  for each row execute procedure update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.products enable row level security;
alter table public.bills enable row level security;
alter table public.bill_items enable row level security;

-- Profiles: users can read all, update own
create policy "Profiles viewable by authenticated users"
  on public.profiles for select
  to authenticated using (true);

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated using (
    auth.uid() = id
    or exists (select 1 from profiles where id = auth.uid() and role = 'owner')
  );

-- Clients: all authenticated can CRUD
create policy "Clients viewable by authenticated"
  on public.clients for select to authenticated using (true);
create policy "Clients insertable by authenticated"
  on public.clients for insert to authenticated with check (true);
create policy "Clients updatable by admin or creator"
  on public.clients for update to authenticated
  using (
    exists (select 1 from profiles where id = auth.uid() and role in ('owner', 'admin'))
    or created_by = auth.uid()
  );
create policy "Clients deletable by admin"
  on public.clients for delete to authenticated
  using (exists (select 1 from profiles where id = auth.uid() and role in ('owner', 'admin')));

-- Products: all authenticated can read, admin/teknisi can write
create policy "Products viewable by authenticated"
  on public.products for select to authenticated using (true);
create policy "Products insertable by admin or teknisi"
  on public.products for insert to authenticated
  with check (exists (select 1 from profiles where id = auth.uid() and role in ('owner', 'admin', 'teknisi')));
create policy "Products updatable by admin or creator"
  on public.products for update to authenticated
  using (exists (select 1 from profiles where id = auth.uid() and role in ('owner', 'admin')) or created_by = auth.uid());
create policy "Products deletable by admin"
  on public.products for delete to authenticated
  using (exists (select 1 from profiles where id = auth.uid() and role in ('owner', 'admin')));

-- Bills: all authenticated can read, admin/teknisi can write
create policy "Bills viewable by authenticated"
  on public.bills for select to authenticated using (true);
create policy "Bills insertable by admin or teknisi"
  on public.bills for insert to authenticated
  with check (exists (select 1 from profiles where id = auth.uid() and role in ('owner', 'admin', 'teknisi')));
create policy "Bills updatable by admin or creator"
  on public.bills for update to authenticated
  using (exists (select 1 from profiles where id = auth.uid() and role in ('owner', 'admin')) or created_by = auth.uid());
create policy "Bills deletable by admin"
  on public.bills for delete to authenticated
  using (exists (select 1 from profiles where id = auth.uid() and role in ('owner', 'admin')));

-- Bill Items: follows bill RLS
create policy "Bill items viewable by authenticated"
  on public.bill_items for select to authenticated using (true);
create policy "Bill items insertable by authenticated"
  on public.bill_items for insert to authenticated with check (true);
create policy "Bill items updatable by authenticated"
  on public.bill_items for update to authenticated using (true);
create policy "Bill items deletable by authenticated"
  on public.bill_items for delete to authenticated using (true);

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Sample products
insert into public.products (name, category, unit, price, is_custom_price, description) values
  ('CCTV Hikvision 2MP Bullet', 'CCTV', 'unit', 350000, false, 'Kamera CCTV outdoor 2MP IP66'),
  ('CCTV Dahua 4MP Dome', 'CCTV', 'unit', 475000, false, 'Kamera CCTV dome 4MP indoor'),
  ('DVR 4 Channel Hikvision', 'CCTV', 'unit', 850000, false, 'Digital Video Recorder 4CH 1080P'),
  ('DVR 8 Channel Hikvision', 'CCTV', 'unit', 1250000, false, 'Digital Video Recorder 8CH 1080P'),
  ('NVR 4 Channel', 'CCTV', 'unit', 950000, false, 'Network Video Recorder 4CH'),
  ('HDD 1TB WD Purple', 'CCTV', 'unit', 650000, false, 'Harddisk khusus CCTV 1TB'),
  ('Access Point Ubiquiti UAP-AC-Lite', 'Access Point', 'unit', 750000, false, 'Indoor Dual Band AP'),
  ('Access Point TP-Link EAP225', 'Access Point', 'unit', 450000, false, 'Indoor Dual Band AC1350'),
  ('Kabel UTP Cat6 Belden', 'Kabel LAN', 'meter', 8500, true, 'Kabel LAN Cat6 per meter'),
  ('Kabel UTP Cat5e', 'Kabel LAN', 'meter', 5500, true, 'Kabel LAN Cat5e per meter'),
  ('Kabel FO Single Mode', 'Kabel FO', 'meter', 12000, true, 'Fiber Optic single mode per meter'),
  ('Kabel NYM 3x2.5mm', 'Kabel Listrik', 'meter', 15000, true, 'Kabel listrik NYM 3x2.5mm per meter'),
  ('Kabel NYA 2.5mm', 'Kabel Listrik', 'meter', 6500, true, 'Kabel listrik NYA 2.5mm per meter'),
  ('Instalasi Listrik Panel', 'Instalasi Listrik', 'titik', 150000, true, 'Jasa instalasi per titik'),
  ('Cleaning AC 1PK', 'Cleaning AC', 'unit', 150000, false, 'Cuci AC split 1PK'),
  ('Cleaning AC 1.5PK', 'Cleaning AC', 'unit', 175000, false, 'Cuci AC split 1.5PK'),
  ('Cleaning AC 2PK', 'Cleaning AC', 'unit', 200000, false, 'Cuci AC split 2PK'),
  ('Jasa Instalasi CCTV', 'Jasa', 'unit', 250000, true, 'Jasa pemasangan CCTV per kamera'),
  ('Jasa Tarik Kabel LAN', 'Jasa', 'meter', 5000, true, 'Jasa penarikan kabel LAN per meter'),
  ('Jasa Setting Jaringan', 'Jasa', 'unit', 500000, false, 'Konfigurasi jaringan');
