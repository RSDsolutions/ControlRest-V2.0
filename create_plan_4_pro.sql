-- Create Plan 4 - PRO and assign it to robinsonsolorzano99@gmail.com's restaurant

DO $$
DECLARE
    v_plan_id uuid;
    v_restaurant_id uuid := 'd58334f5-0edd-4ef5-a4ff-7f6b09e5b99b';
BEGIN
    -- 1. Insert the Plan
    INSERT INTO public.subscription_plans (name, code, description)
    VALUES ('Plan 4 - PRO', 'PRO_UNLIMITED', 'Plan profesional con todas las funciones habilitadas (IA, Análisis Avanzado, FIFO, Snapshots)')
    ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_plan_id;

    -- If no record was returned (already exists and no update happened), fetch it
    IF v_plan_id IS NULL THEN
        SELECT id INTO v_plan_id FROM public.subscription_plans WHERE code = 'PRO_UNLIMITED';
    END IF;

    -- 2. Habilitar Características
    -- ENABLE_NET_PROFIT_CALCULATION
    INSERT INTO public.plan_features (plan_id, feature_code, enabled)
    VALUES (v_plan_id, 'ENABLE_NET_PROFIT_CALCULATION', true)
    ON CONFLICT (plan_id, feature_code) DO UPDATE SET enabled = true;

    -- ENABLE_DAILY_FINANCIAL_SNAPSHOT
    INSERT INTO public.plan_features (plan_id, feature_code, enabled)
    VALUES (v_plan_id, 'ENABLE_DAILY_FINANCIAL_SNAPSHOT', true)
    ON CONFLICT (plan_id, feature_code) DO UPDATE SET enabled = true;

    -- ENABLE_SIMULATION_ENGINE
    INSERT INTO public.plan_features (plan_id, feature_code, enabled)
    VALUES (v_plan_id, 'ENABLE_SIMULATION_ENGINE', true)
    ON CONFLICT (plan_id, feature_code) DO UPDATE SET enabled = true;

    -- 3. Asignar al Restaurante
    -- First, expire any existing active subscription for this restaurant
    UPDATE public.restaurant_subscriptions
    SET status = 'suspended', ends_at = now()
    WHERE restaurant_id = v_restaurant_id AND status = 'active';

    -- Insert the new subscription
    INSERT INTO public.restaurant_subscriptions (restaurant_id, plan_id, status, starts_at)
    VALUES (v_restaurant_id, v_plan_id, 'active', now());

    RAISE NOTICE 'Plan 4 - PRO creado y asignado al restaurante %', v_restaurant_id;
END $$;
