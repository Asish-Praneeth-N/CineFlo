-- Supabase PostgreSQL Schema Definition & Seed Script for CineFlo

-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS screens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  total_seats INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  description TEXT,
  image_url TEXT,
  is_popular BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Separate Inventory Table to isolate contention state
CREATE TABLE IF NOT EXISTS item_inventory (
  item_id UUID PRIMARY KEY REFERENCES menu_items(id) ON DELETE CASCADE,
  available_stock INT NOT NULL CHECK (available_stock >= 0),
  reserved_stock INT DEFAULT 0,
  total_allocated INT NOT NULL,
  version INT DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC(10,2) NOT NULL,
  max_redemptions_total INT NOT NULL,
  current_redemptions_count INT DEFAULT 0,
  max_redemptions_per_user INT DEFAULT 1,
  min_order_amount NUMERIC(10,2) DEFAULT 0,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  is_stackable BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT CHECK (role IN ('patron', 'kitchen', 'admin', 'simulator')) NOT NULL DEFAULT 'patron',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patron_id TEXT NOT NULL,
  screen_id UUID REFERENCES screens(id),
  seat_number TEXT NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL,
  discount_total NUMERIC(10,2) DEFAULT 0,
  total_amount NUMERIC(10,2) NOT NULL,
  applied_offer_codes TEXT[],
  status TEXT CHECK (status IN ('placed', 'preparing', 'ready', 'delivered', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  item_id UUID REFERENCES menu_items(id),
  unit_price NUMERIC(10,2) NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0)
);

-- =====================================================================
-- PRE-SEED PRIMARY ADMIN USER: nagavallikamma1979@gmail.com (Admin@123)
-- =====================================================================
DO $$
DECLARE
  v_admin_id UUID := '00000000-0000-0000-0000-000000000001'::UUID;
BEGIN
  -- Seed User Profile
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (v_admin_id, 'nagavallikamma1979@gmail.com', 'Nagavalli Kamma (Cinema Admin)', 'admin')
  ON CONFLICT (email) DO UPDATE SET role = 'admin';
END $$;

-- Enable Realtime CDC Publications
ALTER PUBLICATION supabase_realtime ADD TABLE item_inventory;
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
