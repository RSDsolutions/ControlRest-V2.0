-- SaaS Management RPCs
-- Allows a superadmin to create restaurants and users globally.

-- 1. Create Restaurant
CREATE OR REPLACE FUNCTION public.saas_create_restaurant(p_name text)
RETURNS uuid AS $$
DECLARE
  v_restaurant_id uuid;
BEGIN
  -- Security check: ONLY superadmin
  IF NOT (SELECT role = 'superadmin' FROM public.users WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'Forbidden: Only superadmins can create restaurants';
  END IF;

  INSERT INTO public.restaurants (name)
  VALUES (p_name)
  RETURNING id INTO v_restaurant_id;

  -- Create default branch (standard for all restaurants)
  INSERT INTO public.branches (restaurant_id, name, address)
  VALUES (v_restaurant_id, 'Matriz', 'Dirección por definir');

  RETURN v_restaurant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create User (Admin or Employee)
-- This function handles the complex insertion into auth.users, auth.identities, and public.users simultaneously.
CREATE OR REPLACE FUNCTION public.saas_create_user(
  p_email text,
  p_password text,
  p_full_name text,
  p_role text,
  p_restaurant_id uuid
)
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid := gen_random_uuid();
  v_branch_id uuid;
BEGIN
  -- Security check: ONLY superadmin
  IF NOT (SELECT role = 'superadmin' FROM public.users WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'Forbidden: Only superadmins can create users';
  END IF;

  -- Validation: restaurant must exist
  IF NOT EXISTS (SELECT 1 FROM public.restaurants WHERE id = p_restaurant_id) THEN
    RAISE EXCEPTION 'Restaurant not found';
  END IF;

  -- Get the default branch for this restaurant
  SELECT id INTO v_branch_id FROM public.branches WHERE restaurant_id = p_restaurant_id LIMIT 1;

  -- 1. Insert into auth.users (Internal GoTrue Table)
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, 
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
    is_super_admin, created_at, updated_at, confirmation_token, 
    recovery_token, email_change_token_new, email_change, 
    phone_change_token, email_change_token_current, reauthentication_token,
    is_sso_user, is_anonymous, confirmed_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', p_email,
    crypt(p_password, gen_salt('bf', 10)), now(),
    '{"provider":"email","providers":["email"]}', '{"email_verified":true}',
    NULL, now(), now(), '', '', '', '', '', '', '', false, false, now()
  );

  -- 2. Insert into auth.identities (Mapping to Email Provider)
  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), v_user_id, 
    jsonb_build_object('sub', v_user_id, 'email', p_email, 'email_verified', true),
    'email', p_email, now(), now()
  );

  -- 3. Insert into public.users (Application Layer)
  INSERT INTO public.users (id, restaurant_id, branch_id, role, full_name, is_active, email)
  VALUES (v_user_id, p_restaurant_id, v_branch_id, p_role, p_full_name, true, p_email);

  RETURN jsonb_build_object('success', true, 'user_id', v_user_id);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Get Restaurants with User Counts
CREATE OR REPLACE FUNCTION public.saas_get_restaurants_with_counts()
RETURNS TABLE (
    id uuid,
    name text,
    created_at timestamptz,
    subscription_status text,
    user_count bigint
) AS $$
BEGIN
  -- Security check
  IF NOT (SELECT role = 'superadmin' FROM public.users WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  RETURN QUERY
  SELECT 
    r.id, 
    r.name, 
    r.created_at, 
    r.subscription_status,
    COUNT(u.id) as user_count
  FROM public.restaurants r
  LEFT JOIN public.users u ON r.id = u.restaurant_id
  GROUP BY r.id, r.name, r.created_at, r.subscription_status
  ORDER BY r.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
