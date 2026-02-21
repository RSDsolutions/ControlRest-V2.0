
-- ==========================================
-- MIGRATION: Advanced Cash Control Layer
-- ==========================================

-- 1. EXTEND cash_sessions
ALTER TABLE public.cash_sessions 
ADD COLUMN IF NOT EXISTS opening_amount numeric(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS opening_comment text,
ADD COLUMN IF NOT EXISTS counted_cash numeric(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS counted_card numeric(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS counted_transfer numeric(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS counted_other numeric(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS closing_comment text,
ADD COLUMN IF NOT EXISTS cash_difference numeric(12,2) DEFAULT 0;

-- 2. EXTEND payments
ALTER TABLE public.payments
ADD COLUMN IF NOT EXISTS payment_method text CHECK (payment_method IN ('CASH', 'CARD', 'TRANSFER', 'OTHER'));

-- 2.1 EXTEND financial_ledger constraints
ALTER TABLE public.financial_ledger DROP CONSTRAINT IF EXISTS financial_ledger_entry_type_check;

ALTER TABLE public.financial_ledger 
ADD CONSTRAINT financial_ledger_entry_type_check 
CHECK (entry_type IN (
    'revenue', 
    'expense', 
    'inventory_purchase', 
    'waste_loss', 
    'CASH_OPENING_FLOAT', 
    'CASH_DISCREPANCY', 
    'SALE_REVENUE'
));

-- 3. REFACTOR: open_cash_session (Updated with Opening Amount)
CREATE OR REPLACE FUNCTION public.open_cash_session(
    p_branch_id uuid,
    p_opening_cash numeric,
    p_comment text,
    p_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_session_id uuid;
    v_restaurant_id uuid;
BEGIN
    -- 1. Check if an OPEN session already exists
    IF EXISTS (SELECT 1 FROM public.cash_sessions WHERE branch_id = p_branch_id AND status = 'open') THEN
        RAISE EXCEPTION 'Ya existe una sesión de caja abierta para esta sucursal.';
    END IF;

    -- 2. Get Restaurant ID from Branch
    SELECT restaurant_id INTO v_restaurant_id FROM public.branches WHERE id = p_branch_id;

    -- 3. Create Session
    INSERT INTO public.cash_sessions (
        restaurant_id, branch_id, opened_by, opened_at, initial_cash, opening_amount, opening_comment, status
    ) VALUES (
        v_restaurant_id, p_branch_id, p_user_id, now(), p_opening_cash, p_opening_cash, p_comment, 'open'
    ) RETURNING id INTO v_session_id;

    -- 4. Log in Financial Ledger (CASH_OPENING_FLOAT)
    INSERT INTO public.financial_ledger (
        restaurant_id, branch_id, cash_session_id, entry_type, amount, source_table, source_id, created_by
    ) VALUES (
        v_restaurant_id, p_branch_id, v_session_id, 'CASH_OPENING_FLOAT', p_opening_cash, 'cash_sessions', v_session_id, p_user_id
    );

    -- 5. Log in Cash Session Transactions
    INSERT INTO public.cash_session_transactions (
        cash_session_id, amount, type, reference_type, reference_id, created_by
    ) VALUES (
        v_session_id, p_opening_cash, 'CASH_IN', 'OPENING_FLOAT', v_session_id, p_user_id
    );

    RETURN jsonb_build_object('id', v_session_id, 'status', 'open');
END;
$$;

-- 4. NEW: close_order_with_split_payments
CREATE OR REPLACE FUNCTION public.close_order_with_split_payments(
    p_order_ids uuid[],
    p_payments jsonb, -- Array of { method: 'CASH'|'CARD'|'TRANSFER'|'OTHER', amount: 10 }
    p_cash_session_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order_id uuid;
    v_payment record;
    v_session record;
    v_total_paid numeric := 0;
    v_order_total numeric := 0;
BEGIN
    -- 1. Get Session Info
    SELECT * INTO v_session FROM public.cash_sessions WHERE id = p_cash_session_id;
    IF v_session.id IS NULL OR v_session.status != 'open' THEN
        RAISE EXCEPTION 'Se requiere una sesión de caja ABIERTA para procesar pagos.';
    END IF;

    -- 2. Calculate Order Total (sum of all unique orders provided)
    SELECT SUM(total_price) INTO v_order_total FROM public.orders WHERE id = ANY(p_order_ids);

    -- 3. Validate Payments Sum
    FOR v_payment IN SELECT * FROM jsonb_to_recordset(p_payments) AS x(method text, amount numeric)
    LOOP
        v_total_paid := v_total_paid + v_payment.amount;
    END LOOP;

    IF ABS(v_total_paid - v_order_total) > 0.01 THEN
        RAISE EXCEPTION 'El monto pagado (%) no coincide con el total de la orden (%).', v_total_paid, v_order_total;
    END IF;

    -- 4. Record Payments & Update Orders
    FOR v_payment IN SELECT * FROM jsonb_to_recordset(p_payments) AS x(method text, amount numeric)
    LOOP
        -- Insert into payments table
        INSERT INTO public.payments (
            order_id, restaurant_id, branch_id, cash_session_id, payment_method, amount, paid_at, created_at, status, user_id
        ) VALUES (
            p_order_ids[1], v_session.restaurant_id, v_session.branch_id, p_cash_session_id, v_payment.method, v_payment.amount, now(), now(), 'completed', v_session.opened_by
        );

        -- Log in Cash Session Transactions IF CASH
        IF v_payment.method = 'CASH' THEN
            INSERT INTO public.cash_session_transactions (
                cash_session_id, amount, type, reference_type, reference_id, created_by
            ) VALUES (
                p_cash_session_id, v_payment.amount, 'CASH_IN', 'ORDER_PAYMENT', p_order_ids[1], v_session.opened_by
            );
        END IF;

        -- Log in Financial Ledger (Revenue)
        INSERT INTO public.financial_ledger (
            restaurant_id, branch_id, cash_session_id, entry_type, amount, source_table, source_id, created_by
        ) VALUES (
            v_session.restaurant_id, v_session.branch_id, p_cash_session_id, 'SALE_REVENUE', v_payment.amount, 'orders', p_order_ids[1], v_session.opened_by
        );
    END LOOP;

    -- 5. Mark Orders as Paid
    FOREACH v_order_id IN ARRAY p_order_ids
    LOOP
        UPDATE public.orders SET
            status = 'paid',
            shift_id = p_cash_session_id
        WHERE id = v_order_id;
    END LOOP;

    RETURN jsonb_build_object('status', 'success', 'order_ids', p_order_ids);
END;
$$;

-- 5. REFACTOR: close_cash_session (Updated with counting and auditing)
CREATE OR REPLACE FUNCTION public.close_cash_session(
    p_session_id uuid,
    p_counted_cash numeric,
    p_counted_card numeric,
    p_counted_transfer numeric,
    p_counted_other numeric,
    p_comment text,
    p_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_session record;
    v_expected_cash numeric;
    v_difference numeric;
BEGIN
    -- 1. Get Session Info
    SELECT * INTO v_session FROM public.cash_sessions WHERE id = p_session_id;
    IF v_session.id IS NULL OR v_session.status != 'open' THEN
        RAISE EXCEPTION 'Sesión no encontrada o ya cerrada.';
    END IF;

    -- 2. Calculate Expected Cash
    -- Formula: Opening + All CASH_IN (Sales, Manual) - All CASH_OUT (Expenses, Payments, Transfers)
    SELECT 
        COALESCE(SUM(CASE WHEN type = 'CASH_IN' THEN amount ELSE -amount END), 0)
    INTO v_expected_cash
    FROM public.cash_session_transactions
    WHERE cash_session_id = p_session_id;

    v_difference := p_counted_cash - v_expected_cash;

    -- 3. Update Session with granular counts and difference
    UPDATE public.cash_sessions SET
        status = 'closed',
        closed_at = now(),
        closed_by = p_user_id,
        expected_cash = v_expected_cash, -- Total expected CASH
        actual_cash = p_counted_cash,
        counted_cash = p_counted_cash,
        counted_card = p_counted_card,
        counted_transfer = p_counted_transfer,
        counted_other = p_counted_other,
        closing_comment = p_comment,
        difference = v_difference,
        cash_difference = v_difference
    WHERE id = p_session_id;

    -- 4. Log Discrepancy in Ledger if exists
    IF v_difference != 0 THEN
        INSERT INTO public.financial_ledger (
            restaurant_id, branch_id, cash_session_id, entry_type, amount, source_table, source_id, created_by
        ) VALUES (
            v_session.restaurant_id, v_session.branch_id, p_session_id, 'CASH_DISCREPANCY', v_difference, 'cash_sessions', p_session_id, p_user_id
        );
    END IF;

    RETURN jsonb_build_object(
        'id', p_session_id,
        'expected_cash', v_expected_cash,
        'actual_cash', p_counted_cash,
        'difference', v_difference
    );
END;
$$;
