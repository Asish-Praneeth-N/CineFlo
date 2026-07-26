-- ====================================================================
-- CineFlo · Fix + Create Admin User (handles stale profile row)
-- Run this in: Supabase SQL Editor → New Query → Run
-- ====================================================================

-- ─── STEP 1: Fix the trigger to handle BOTH id AND email conflicts ────
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

  -- Delete any stale profile row that has the same email but different id
  DELETE FROM public.profiles
  WHERE email = NEW.email AND id <> NEW.id;

  -- Insert or update by id (primary key)
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

-- ─── STEP 2: Delete the stale profile row with mismatched UUID ─────────
DELETE FROM public.profiles
WHERE email = 'nagavallikamma1979@gmail.com';

-- ─── STEP 3: Create the admin user in auth.users ─────────────────────
DO $$
DECLARE
  v_uid        UUID        := gen_random_uuid();
  v_email      TEXT        := 'nagavallikamma1979@gmail.com';
  v_password   TEXT        := 'Admin@123';
  v_full_name  TEXT        := 'Nagavalli Kamma';
  v_now        TIMESTAMPTZ := NOW();
  v_exists     UUID;
BEGIN

  -- Check if this email already exists in auth.users
  SELECT id INTO v_exists FROM auth.users WHERE email = v_email LIMIT 1;

  IF v_exists IS NOT NULL THEN
    -- Auth user already exists — update their profile only
    RAISE NOTICE 'Auth user already exists (id=%). Updating profile role to admin.', v_exists;

    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (v_exists, v_email, v_full_name, 'admin')
    ON CONFLICT (id) DO UPDATE
      SET role      = 'admin',
          full_name = v_full_name,
          email     = v_email;

    -- Also update the encrypted password in case they need to reset it
    UPDATE auth.users
    SET encrypted_password  = crypt(v_password, gen_salt('bf')),
        email_confirmed_at  = COALESCE(email_confirmed_at, v_now),
        updated_at          = v_now
    WHERE id = v_exists;

    RAISE NOTICE 'Profile updated. Login: % / Admin@123', v_email;
    RETURN;
  END IF;

  -- ─── Insert new auth user ────────────────────────────────────────────
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    raw_app_meta_data,
    aud,
    role,
    created_at,
    updated_at,
    is_super_admin,
    confirmation_token,
    email_change_token_new,
    recovery_token
  ) VALUES (
    v_uid,
    '00000000-0000-0000-0000-000000000000',
    v_email,
    crypt(v_password, gen_salt('bf')),
    v_now,
    jsonb_build_object('full_name', v_full_name, 'role', 'admin'),
    jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
    'authenticated',
    'authenticated',
    v_now,
    v_now,
    FALSE,
    '',
    '',
    ''
  );

  -- ─── Insert identity (required for email/password login) ─────────────
  INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    v_uid,
    v_uid,
    v_email,
    jsonb_build_object('sub', v_uid::TEXT, 'email', v_email),
    'email',
    v_now,
    v_now,
    v_now
  );

  -- Profile is created by trigger above — but also ensure it here:
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (v_uid, v_email, v_full_name, 'admin')
  ON CONFLICT (id) DO UPDATE
    SET role = 'admin', full_name = v_full_name;

  RAISE NOTICE 'Admin created: % / Admin@123 (id=%)', v_email, v_uid;

END $$;

-- ─── STEP 4: Verify everything is correct ────────────────────────────
SELECT
  u.id,
  u.email,
  u.email_confirmed_at IS NOT NULL  AS email_confirmed,
  u.encrypted_password IS NOT NULL  AS has_password,
  p.role,
  p.full_name
FROM auth.users u
JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'nagavallikamma1979@gmail.com';
