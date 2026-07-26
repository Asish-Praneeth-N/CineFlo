-- ====================================================================
-- CineFlo · PL/pgSQL Atomic Checkout RPC Function
-- Run this in: Supabase SQL Editor → New Query → Run
-- Guarantees ZERO OVERSELLING under high concurrent intermission load.
-- ====================================================================

-- Drop any old mismatched versions first
DROP FUNCTION IF EXISTS checkout_order_atomic(TEXT, UUID, TEXT, JSONB, TEXT[]);
DROP FUNCTION IF EXISTS checkout_order_atomic(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT[]);

CREATE OR REPLACE FUNCTION checkout_order_atomic(
  p_patron_id   TEXT,
  p_screen_id   TEXT,
  p_screen_name TEXT,
  p_seat_number TEXT,
  p_show_id     TEXT,
  p_movie_title TEXT,
  p_cart_items  JSONB, -- Array of { itemId, name, unitPrice, quantity }
  p_promo_codes TEXT[]
) RETURNS JSONB AS $$
DECLARE
  v_item          RECORD;
  v_avail_stock   INT;
  v_order_id      TEXT;
  v_subtotal      NUMERIC(10,2) := 0;
  v_total_discount NUMERIC(10,2) := 0;
  v_final_total   NUMERIC(10,2);
  v_patron_uuid   UUID := NULL;
BEGIN

  -- Try parsing patron_id as UUID if valid UUID string (registered patron vs guest)
  BEGIN
    IF p_patron_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
      v_patron_uuid := p_patron_id::UUID;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_patron_uuid := NULL;
  END;

  -- ─── STEP 1: Row-Level Locking on Inventory Items (Prevents Deadlocks) ───
  FOR v_item IN
    SELECT (x->>'itemId')::TEXT AS item_id,
           (x->>'quantity')::INT AS qty,
           (x->>'unitPrice')::NUMERIC AS price,
           COALESCE(x->>'name', 'Item')::TEXT AS name
    FROM jsonb_array_elements(p_cart_items) AS x
    ORDER BY (x->>'itemId')::TEXT
  LOOP
    SELECT available_stock INTO v_avail_stock
    FROM item_inventory
    WHERE item_id = v_item.item_id
    FOR UPDATE;

    IF v_avail_stock IS NULL OR v_avail_stock < v_item.qty THEN
      RAISE EXCEPTION 'INSUFFICIENT_STOCK: Only % available for % (Requested: %)',
        COALESCE(v_avail_stock, 0), v_item.name, v_item.qty;
    END IF;

    v_subtotal := v_subtotal + (v_item.price * v_item.qty);
  END LOOP;

  -- ─── STEP 2: Atomic Inventory Decrement ───
  FOR v_item IN
    SELECT (x->>'itemId')::TEXT AS item_id,
           (x->>'quantity')::INT AS qty
    FROM jsonb_array_elements(p_cart_items) AS x
  LOOP
    UPDATE item_inventory
    SET available_stock = available_stock - v_item.qty,
        reserved_stock  = reserved_stock + v_item.qty,
        version         = version + 1,
        updated_at      = NOW()
    WHERE item_id = v_item.item_id;
  END LOOP;

  v_final_total := GREATEST(0, v_subtotal - v_total_discount);
  v_order_id    := 'ord-' || floor(100000 + random() * 900000)::TEXT;

  -- ─── STEP 3: Create Order Record ───
  INSERT INTO orders (
    id, patron_id, screen_id, screen_name, seat_number,
    show_id, movie_title, subtotal, discount_total, total_amount,
    applied_offer_codes, status, estimated_delivery, created_at, updated_at
  ) VALUES (
    v_order_id, v_patron_uuid, p_screen_id, p_screen_name, p_seat_number,
    p_show_id, p_movie_title, v_subtotal, v_total_discount, v_final_total,
    p_promo_codes, 'placed', '5-7 mins', NOW(), NOW()
  );

  -- ─── STEP 4: Insert Order Line Items ───
  FOR v_item IN
    SELECT (x->>'itemId')::TEXT AS item_id,
           (x->>'quantity')::INT AS qty,
           (x->>'unitPrice')::NUMERIC AS price,
           COALESCE(x->>'name', 'Item')::TEXT AS name
    FROM jsonb_array_elements(p_cart_items) AS x
  LOOP
    INSERT INTO order_items (order_id, item_id, item_name, unit_price, quantity)
    VALUES (v_order_id, v_item.item_id, v_item.name, v_item.price, v_item.qty);
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'total_amount', v_final_total,
    'status', 'placed'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION checkout_order_atomic(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT[]) TO anon;
GRANT EXECUTE ON FUNCTION checkout_order_atomic(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION checkout_order_atomic(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT[]) TO service_role;
