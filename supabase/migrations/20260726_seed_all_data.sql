-- ====================================================================
-- CineFlo · Complete Schema + Seed (Idempotent)
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Run
-- This script drops existing tables and recreates them cleanly.
-- SAFE to run multiple times.
-- ====================================================================

-- ─── EXTENSIONS ───────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── DROP EXISTING TABLES (clean slate) ───────────────────────────────
DROP TABLE IF EXISTS order_items  CASCADE;
DROP TABLE IF EXISTS orders       CASCADE;
DROP TABLE IF EXISTS item_inventory CASCADE;
DROP TABLE IF EXISTS offers       CASCADE;
DROP TABLE IF EXISTS menu_items   CASCADE;
DROP TABLE IF EXISTS screens      CASCADE;
-- NOTE: do NOT drop `profiles` here — it stays; we only reset data tables.

-- ─── SCREENS ──────────────────────────────────────────────────────────
CREATE TABLE screens (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  total_seats INT  NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── MENU ITEMS ───────────────────────────────────────────────────────
CREATE TABLE menu_items (
  id          TEXT PRIMARY KEY,
  name        TEXT           NOT NULL,
  category    TEXT           NOT NULL,
  price       NUMERIC(10,2)  NOT NULL,
  description TEXT,
  image_url   TEXT,
  calories    INT,
  is_popular  BOOLEAN        DEFAULT FALSE,
  is_veg      BOOLEAN        DEFAULT TRUE,
  created_at  TIMESTAMPTZ    DEFAULT NOW()
);

-- ─── INVENTORY (separate table to isolate contention) ─────────────────
CREATE TABLE item_inventory (
  item_id          TEXT PRIMARY KEY REFERENCES menu_items(id) ON DELETE CASCADE,
  available_stock  INT           NOT NULL CHECK (available_stock >= 0),
  reserved_stock   INT           DEFAULT 0,
  total_allocated  INT           NOT NULL,
  version          INT           DEFAULT 1,
  updated_at       TIMESTAMPTZ   DEFAULT NOW()
);

-- ─── OFFERS ───────────────────────────────────────────────────────────
CREATE TABLE offers (
  id                        TEXT PRIMARY KEY,
  code                      TEXT          UNIQUE NOT NULL,
  title                     TEXT          NOT NULL,
  description               TEXT,
  discount_type             TEXT          NOT NULL CHECK (discount_type IN ('percentage','fixed')),
  discount_value            NUMERIC(10,2) NOT NULL,
  max_redemptions_total     INT           NOT NULL,
  current_redemptions_count INT           DEFAULT 0,
  max_redemptions_per_user  INT           DEFAULT 1,
  min_order_amount          NUMERIC(10,2) DEFAULT 0,
  applicable_categories     TEXT[],
  valid_from                TIMESTAMPTZ,
  valid_until               TIMESTAMPTZ,
  is_stackable              BOOLEAN       DEFAULT FALSE,
  is_active                 BOOLEAN       DEFAULT TRUE,
  created_at                TIMESTAMPTZ   DEFAULT NOW()
);

-- ─── PROFILES (keep existing or create) ───────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT UNIQUE NOT NULL,
  full_name  TEXT NOT NULL,
  role       TEXT NOT NULL DEFAULT 'patron'
               CHECK (role IN ('patron','kitchen','admin','simulator')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ORDERS ───────────────────────────────────────────────────────────
-- patron_id is UUID (links to auth.users via profiles)
CREATE TABLE orders (
  id                  TEXT          PRIMARY KEY,
  patron_id           UUID          REFERENCES profiles(id),
  screen_id           TEXT          REFERENCES screens(id),
  screen_name         TEXT,
  seat_number         TEXT          NOT NULL,
  show_id             TEXT,
  movie_title         TEXT,
  subtotal            NUMERIC(10,2) NOT NULL,
  discount_total      NUMERIC(10,2) DEFAULT 0,
  total_amount        NUMERIC(10,2) NOT NULL,
  applied_offer_codes TEXT[],
  status              TEXT          DEFAULT 'placed'
                        CHECK (status IN ('placed','preparing','ready','delivered','cancelled')),
  estimated_delivery  TEXT,
  created_at          TIMESTAMPTZ   DEFAULT NOW(),
  updated_at          TIMESTAMPTZ   DEFAULT NOW()
);

-- ─── ORDER ITEMS ──────────────────────────────────────────────────────
CREATE TABLE order_items (
  id         UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   TEXT          NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item_id    TEXT          REFERENCES menu_items(id),
  item_name  TEXT          NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  quantity   INT           NOT NULL CHECK (quantity > 0)
);

-- ─── REALTIME PUBLICATIONS ────────────────────────────────────────────
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE item_inventory;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE orders;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── UPDATED_AT TRIGGER ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_updated_at ON orders;
CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── AUTO-CREATE PROFILE ON SIGNUP ────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_role TEXT;
BEGIN
  IF NEW.email = 'nagavallikamma1979@gmail.com' THEN
    v_role := 'admin';
  ELSIF NEW.raw_user_meta_data->>'role' = 'kitchen'
     OR NEW.email LIKE '%.kitchen@cineflo.com' THEN
    v_role := 'kitchen';
  ELSIF NEW.raw_user_meta_data->>'role' = 'simulator' THEN
    v_role := 'simulator';
  ELSE
    v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'patron');
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    v_role
  )
  ON CONFLICT (id) DO UPDATE
    SET email     = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role      = EXCLUDED.role;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────────────
ALTER TABLE profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers        ENABLE ROW LEVEL SECURITY;
ALTER TABLE screens       ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders        ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items   ENABLE ROW LEVEL SECURITY;

-- Profiles: each user sees/edits their own row
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Menu items: public read
DROP POLICY IF EXISTS "menu_items_select" ON menu_items;
CREATE POLICY "menu_items_select" ON menu_items
  FOR SELECT USING (true);

-- Inventory: public read
DROP POLICY IF EXISTS "inventory_select" ON item_inventory;
CREATE POLICY "inventory_select" ON item_inventory
  FOR SELECT USING (true);

-- Offers: public read (active only)
DROP POLICY IF EXISTS "offers_select" ON offers;
CREATE POLICY "offers_select" ON offers
  FOR SELECT USING (is_active = true);

-- Screens: public read
DROP POLICY IF EXISTS "screens_select" ON screens;
CREATE POLICY "screens_select" ON screens
  FOR SELECT USING (true);

-- Orders: patron sees own; admin/kitchen see all
DROP POLICY IF EXISTS "orders_select" ON orders;
CREATE POLICY "orders_select" ON orders
  FOR SELECT USING (
    patron_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin','kitchen','simulator')
    )
  );

DROP POLICY IF EXISTS "orders_insert" ON orders;
CREATE POLICY "orders_insert" ON orders
  FOR INSERT WITH CHECK (patron_id = auth.uid());

DROP POLICY IF EXISTS "orders_update" ON orders;
CREATE POLICY "orders_update" ON orders
  FOR UPDATE USING (
    patron_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin','kitchen')
    )
  );

-- Order items: follow parent orders
DROP POLICY IF EXISTS "order_items_select" ON order_items;
CREATE POLICY "order_items_select" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_items.order_id
        AND (
          o.patron_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
              AND p.role IN ('admin','kitchen','simulator')
          )
        )
    )
  );

-- ====================================================================
-- SEED DATA
-- ====================================================================

-- ─── SCREENS ──────────────────────────────────────────────────────────
INSERT INTO screens (id, name, total_seats) VALUES
  ('screen-1', 'Screen 1 (IMAX 3D AUDI 1)',       350),
  ('screen-2', 'Screen 2 (Dolby Atmos AUDI 2)',    280),
  ('screen-3', 'Screen 3 (4DX AUDI 3)',            220),
  ('screen-4', 'Screen 4 (Gold Class AUDI 4)',     150);

-- ─── MENU ITEMS ───────────────────────────────────────────────────────
INSERT INTO menu_items (id, name, category, price, description, image_url, calories, is_popular, is_veg) VALUES

-- POPCORN
('item-popcorn-xl',
 'Butter Cheese Gourmet Popcorn (XL Tub)',
 'Popcorn', 390,
 'Crispy warm oversized popcorn tossed in rich Amul butter and spiced cheddar cheese seasoning.',
 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?auto=format&fit=crop&w=600&q=80',
 780, TRUE, TRUE),

('item-popcorn-salted',
 'Classic Salted Butter Popcorn (Large)',
 'Popcorn', 290,
 'Traditional theater salted popcorn popped fresh with golden Amul butter.',
 'https://images.unsplash.com/photo-1505686994434-e3cc5abf1330?auto=format&fit=crop&w=600&q=80',
 540, FALSE, TRUE),

('item-popcorn-caramel',
 'Caramel Drizzle Sweet Popcorn (Medium)',
 'Popcorn', 250,
 'Light fluffy popcorn coated with rich house-made caramel and a pinch of Himalayan pink salt.',
 'https://images.unsplash.com/photo-1559181567-c3190b898ed8?auto=format&fit=crop&w=600&q=80',
 490, FALSE, TRUE),

-- COMBOS
('item-combo-royal',
 'Blockbuster Intermission Mega Combo',
 'Combos', 690,
 '1 XL Butter Popcorn + 2 Large Fountain Sodas + 1 Portion Loaded Paneer Tikka Nachos.',
 'https://images.unsplash.com/photo-1585647347483-22b66260dfff?auto=format&fit=crop&w=600&q=80',
 1450, TRUE, TRUE),

('item-chai-samosa',
 'Desi Masala Chai & Samosa Combo',
 'Combos', 240,
 '2 Crispy Punjabi Potato Samosas served with hot fragrant ginger cardamom tea.',
 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80',
 480, TRUE, TRUE),

('item-combo-family',
 'Family Feast Cinema Pack',
 'Combos', 990,
 '2 XL Popcorns + 4 Fountain Sodas + 1 Plate Veg Seekh Rolls + 1 Gulab Jamun Sundae.',
 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=600&q=80',
 2600, TRUE, TRUE),

-- HOT FOOD
('item-nachos-paneer',
 'Loaded Paneer Tikka Queso Nachos',
 'Hot Food', 320,
 'Stone-ground tortilla chips topped with charred paneer tikka, jalapeños & hot cheese sauce.',
 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&w=600&q=80',
 690, TRUE, TRUE),

('item-mutton-roll',
 'Desi Seekh Kebab Brioche Roll',
 'Hot Food', 350,
 'Juicy spiced seekh kebab wrapped in a buttery soft brioche roll with mint chutney.',
 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80',
 560, FALSE, FALSE),

('item-veg-burger',
 'Crispy Aloo Tikki Cinema Burger',
 'Hot Food', 280,
 'Double aloo tikki patty with coleslaw, pickled onions & sriracha mayo in a sesame brioche bun.',
 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
 620, FALSE, TRUE),

('item-pizza-slice',
 'Margherita Cinema Pizza Slice',
 'Hot Food', 220,
 'Wood-fired sourdough base with fresh mozzarella, San Marzano tomato sauce & basil.',
 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80',
 480, FALSE, TRUE),

-- BEVERAGES
('item-coffee-slushie',
 'Chilled Masala Cold Coffee Slushie',
 'Beverages', 190,
 'Thick creamy blended cold espresso slushie topped with dark cocoa powder.',
 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=600&q=80',
 290, FALSE, TRUE),

('item-soda-large',
 'Fountain Soda (Large 750ml)',
 'Beverages', 120,
 'Choice of Coca-Cola, Sprite, Thums Up or Limca. Chilled and served over ice.',
 'https://images.unsplash.com/photo-1581006852262-e4307cf6283a?auto=format&fit=crop&w=600&q=80',
 180, FALSE, TRUE),

('item-mango-lassi',
 'Thick Alphonso Mango Lassi',
 'Beverages', 160,
 'Creamy chilled yoghurt blended with Ratnagiri Alphonso mango pulp and a dash of cardamom.',
 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=600&q=80',
 280, FALSE, TRUE),

('item-masala-chai',
 'Cutting Masala Chai (2 Cups)',
 'Beverages', 80,
 'Fragrant ginger-cardamom-elaichi Indian spiced tea served piping hot in clay kulhads.',
 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=80',
 60, FALSE, TRUE),

-- SNACKS
('item-corn-cup',
 'Spiced Masala Sweet Corn Cup',
 'Snacks', 110,
 'Steaming corn kernels tossed with chaat masala, butter, lime and green chilli.',
 'https://images.unsplash.com/photo-1635146037526-a5e0177b9b17?auto=format&fit=crop&w=600&q=80',
 220, FALSE, TRUE),

('item-bhel-puri',
 'Crispy Bombay Bhel Puri',
 'Snacks', 130,
 'Puffed rice tossed with raw mango, onion, coriander, tamarind chutney & sev.',
 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=600&q=80',
 260, FALSE, TRUE),

('item-choco-nachos',
 'Choco-Hazelnut Dessert Nachos',
 'Snacks', 220,
 'Cinnamon sugar tortilla chips drizzled with Nutella, strawberries & whipped cream.',
 'https://images.unsplash.com/photo-1481391319762-47dff72954d9?auto=format&fit=crop&w=600&q=80',
 510, FALSE, TRUE),

-- DESSERTS
('item-gulab-jamun',
 'Warm Shahi Gulab Jamun Sundae (2 Pcs)',
 'Desserts', 180,
 'Hot melt-in-the-mouth gulab jamuns served over vanilla bean ice cream & pistachio slivers.',
 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=600&q=80',
 420, FALSE, TRUE),

('item-kulfi',
 'Matka Malai Kulfi on Stick',
 'Desserts', 140,
 'Rich creamy traditional Indian ice cream with saffron, cardamom & pistachios.',
 'https://images.unsplash.com/photo-1464305795204-6f5bbfc7fb81?auto=format&fit=crop&w=600&q=80',
 310, FALSE, TRUE),

('item-brownie',
 'Warm Choco Fudge Brownie + Ice Cream',
 'Desserts', 260,
 'Dense Belgian chocolate brownie served warm with a scoop of Amul vanilla ice cream.',
 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?auto=format&fit=crop&w=600&q=80',
 650, FALSE, TRUE);

-- ─── INVENTORY ────────────────────────────────────────────────────────
INSERT INTO item_inventory (item_id, available_stock, reserved_stock, total_allocated) VALUES
  ('item-popcorn-xl',      30,  0,  30),
  ('item-popcorn-salted',  60,  0,  60),
  ('item-popcorn-caramel', 40,  0,  40),
  ('item-combo-royal',     25,  0,  25),
  ('item-chai-samosa',     50,  0,  50),
  ('item-combo-family',    15,  0,  15),
  ('item-nachos-paneer',   20,  0,  20),
  ('item-mutton-roll',     15,  0,  15),
  ('item-veg-burger',      25,  0,  25),
  ('item-pizza-slice',     30,  0,  30),
  ('item-coffee-slushie', 100,  0, 100),
  ('item-soda-large',     200,  0, 200),
  ('item-mango-lassi',     80,  0,  80),
  ('item-masala-chai',    150,  0, 150),
  ('item-corn-cup',       120,  0, 120),
  ('item-bhel-puri',      100,  0, 100),
  ('item-choco-nachos',    35,  0,  35),
  ('item-gulab-jamun',     40,  0,  40),
  ('item-kulfi',           60,  0,  60),
  ('item-brownie',         25,  0,  25);

-- ─── OFFERS ───────────────────────────────────────────────────────────
INSERT INTO offers (
  id, code, title, description,
  discount_type, discount_value,
  max_redemptions_total, max_redemptions_per_user, min_order_amount,
  applicable_categories, valid_from, valid_until, is_stackable, is_active
) VALUES
('offer-intermission-50',
 'INTERMISSION50', 'Intermission Rush ₹50 Off',
 'Get ₹50 flat discount on orders above ₹300 during intermission.',
 'fixed', 50, 500, 1, 300,
 NULL,
 NOW() - INTERVAL '1 day', NOW() + INTERVAL '30 days', FALSE, TRUE),

('offer-chai-combo',
 'CHAI20', '20% Off Desi Combos',
 'Save 20% on all Combo items — perfect with your masala chai.',
 'percentage', 20, 200, 2, 200,
 ARRAY['Combos'],
 NOW() - INTERVAL '1 day', NOW() + INTERVAL '30 days', TRUE, TRUE),

('offer-vip-member',
 'VIPINR100', 'CineFlo Club ₹100 Off',
 'Exclusive ₹100 discount for VIP CineFlo Club members.',
 'fixed', 100, 1000, 5, 400,
 NULL,
 NOW() - INTERVAL '1 day', NOW() + INTERVAL '90 days', FALSE, TRUE),

('offer-family-pack',
 'FAMILY150', 'Family Pack ₹150 Off',
 'Order above ₹800 and get ₹150 off. Perfect for families!',
 'fixed', 150, 300, 1, 800,
 NULL,
 NOW() - INTERVAL '1 day', NOW() + INTERVAL '60 days', FALSE, TRUE),

('offer-first-order',
 'FIRSTORDER', 'First Order 15% Off',
 'Welcome to CineFlo! Get 15% off your very first order.',
 'percentage', 15, 9999, 1, 100,
 NULL,
 NOW() - INTERVAL '1 day', NOW() + INTERVAL '365 days', FALSE, TRUE);

-- ─── ADMIN: force role after admin signs up ────────────────────────────
-- After creating nagavallikamma1979@gmail.com in Auth Dashboard,
-- the trigger auto-creates the profile with role='admin'.
-- This UPDATE is a safety net in case the trigger already ran:
UPDATE profiles
SET role = 'admin', full_name = 'Nagavalli Kamma'
WHERE email = 'nagavallikamma1979@gmail.com';

-- ====================================================================
-- DONE. Verify with:
--   SELECT * FROM menu_items ORDER BY category;
--   SELECT * FROM item_inventory;
--   SELECT * FROM offers;
--   SELECT * FROM screens;
-- ====================================================================
