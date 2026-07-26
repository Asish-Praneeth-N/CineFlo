-- ====================================================================
-- CineFlo · Create All Test Users (Admin + Patron + Kitchen Staff)
-- Run this in: Supabase SQL Editor → New Query → Run
-- ====================================================================

-- ─── Reusable function to upsert a user safely ────────────────────────
CREATE OR REPLACE FUNCTION create_cineflo_user(
  p_email      TEXT,
  p_password   TEXT,
  p_full_name  TEXT,
  p_role       TEXT
) RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_uid    UUID        := gen_random_uuid();
  v_now    TIMESTAMPTZ := NOW();
  v_exists UUID;
BEGIN
  -- Check if auth user already exists
  SELECT id INTO v_exists FROM auth.users WHERE email = p_email LIMIT 1;

  IF v_exists IS NOT NULL THEN
    -- Auth user exists → just update password + profile
    UPDATE auth.users
    SET encrypted_password = crypt(p_password, gen_salt('bf')),
        email_confirmed_at = COALESCE(email_confirmed_at, v_now),
        raw_user_meta_data = jsonb_build_object('full_name', p_full_name, 'role', p_role),
        updated_at         = v_now
    WHERE id = v_exists;

    -- Remove stale profile rows with same email but different id
    DELETE FROM public.profiles WHERE email = p_email AND id <> v_exists;

    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (v_exists, p_email, p_full_name, p_role)
    ON CONFLICT (id) DO UPDATE
      SET role      = p_role,
          full_name = p_full_name,
          email     = p_email;

    RETURN 'UPDATED: ' || p_email || ' (id=' || v_exists::TEXT || ')';
  END IF;

  -- Remove any stale profile row with same email
  DELETE FROM public.profiles WHERE email = p_email;

  -- Insert auth user
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password,
    email_confirmed_at, raw_user_meta_data, raw_app_meta_data,
    aud, role, created_at, updated_at,
    is_super_admin, confirmation_token, email_change_token_new, recovery_token
  ) VALUES (
    v_uid,
    '00000000-0000-0000-0000-000000000000',
    p_email,
    crypt(p_password, gen_salt('bf')),
    v_now,
    jsonb_build_object('full_name', p_full_name, 'role', p_role),
    jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
    'authenticated', 'authenticated',
    v_now, v_now, FALSE, '', '', ''
  );

  -- Insert identity (required for email/password login)
  INSERT INTO auth.identities (
    id, user_id, provider_id, identity_data,
    provider, last_sign_in_at, created_at, updated_at
  ) VALUES (
    v_uid, v_uid, p_email,
    jsonb_build_object('sub', v_uid::TEXT, 'email', p_email),
    'email', v_now, v_now, v_now
  );

  -- Insert profile
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (v_uid, p_email, p_full_name, p_role)
  ON CONFLICT (id) DO UPDATE
    SET role = p_role, full_name = p_full_name;

  RETURN 'CREATED: ' || p_email || ' (id=' || v_uid::TEXT || ')';
END;
$$;

-- ====================================================================
-- CREATE ALL THREE USERS
-- ====================================================================

SELECT create_cineflo_user(
  'nagavallikamma1979@gmail.com',
  'Admin@123',
  'Nagavalli Kamma',
  'admin'
) AS result;

SELECT create_cineflo_user(
  'patron@cineflo.com',
  'Patron@123',
  'Test Patron',
  'patron'
) AS result;

SELECT create_cineflo_user(
  'kitchen@cineflo.com',
  'Kitchen@123',
  'Kitchen Staff',
  'kitchen'
) AS result;

-- ─── Cleanup helper function ──────────────────────────────────────────
DROP FUNCTION IF EXISTS create_cineflo_user(TEXT, TEXT, TEXT, TEXT);

-- ====================================================================
-- VERIFY: Should show 3 rows with correct roles
-- ====================================================================
SELECT
  u.email,
  p.full_name,
  p.role,
  u.email_confirmed_at IS NOT NULL AS email_confirmed,
  u.encrypted_password IS NOT NULL AS has_password
FROM auth.users u

JOIN public.profiles p ON p.id = u.id
WHERE u.email IN (
  'nagavallikamma1979@gmail.com',
  'patron@cineflo.com',
  'kitchen@cineflo.com'
)
ORDER BY p.role;
