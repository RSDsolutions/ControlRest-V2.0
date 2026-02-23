-- 1. TABLES: Manual Income & Transfers
CREATE TABLE IF NOT EXISTS public.manual_income (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id uuid REFERENCES public.restaurants(id),
    branch_id uuid REFERENCES public.branches(id),
    cash_session_id uuid REFERENCES public.cash_sessions(id),
    amount numeric(12,2) NOT NULL,
    category text NOT NULL, -- e.g. 'Propina', 'Venta Extra', etc.
    description text,
    created_by uuid REFERENCES public.users(id),
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.internal_transfers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id uuid REFERENCES public.restaurants(id),
    from_branch_id uuid REFERENCES public.branches(id),
    to_branch_id uuid REFERENCES public.branches(id),
    from_session_id uuid REFERENCES public.cash_sessions(id),
    to_session_id uuid REFERENCES public.cash_sessions(id),
    amount numeric(12,2) NOT NULL,
    type text NOT NULL, -- 'BRANCH_TO_BRANCH', 'CASH_TO_BANK', etc.
    description text,
    created_by uuid REFERENCES public.users(id),
    created_at timestamptz DEFAULT now()
);

-- 2. Helper Function: Check for Open Session
CREATE OR REPLACE FUNCTION public.get_open_session_id(p_branch_id uuid)
RETURNS uuid AS $$
    SELECT id FROM public.cash_sessions 
    WHERE branch_id = p_branch_id AND status = 'open'
    LIMIT 1;
$$ LANGUAGE sql STABLE;

-- 2. REFACTOR: open_cash_session
CREATE OR REPLACE FUNCTION public.open_cash_session(
    p_branch_id uuid,
    p_initial_cash numeric,
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
        restaurant_id, branch_id, opened_by, opened_at, initial_cash, status
    ) VALUES (
        v_restaurant_id, p_branch_id, p_user_id, now(), p_initial_cash, 'open'
    ) RETURNING id INTO v_session_id;

    -- 4. Log in Financial Ledger (Generic Schema)
    IF public.is_feature_enabled(v_restaurant_id, 'ENABLE_FINANCIAL_LEDGER_IMPACT') THEN
        INSERT INTO public.financial_ledger (
            restaurant_id, branch_id, cash_session_id, entry_type, amount, source_table, source_id, created_by
        ) VALUES (
            v_restaurant_id, p_branch_id, v_session_id, 'CASH_OPENING_FLOAT', p_initial_cash, 'cash_sessions', v_session_id, p_user_id
        );
    END IF;

    -- 5. Log in Cash Session Transactions (Specific for Cash/Bank audit)
    INSERT INTO public.cash_session_transactions (
        cash_session_id, amount, type, reference_type, reference_id, created_by
    ) VALUES (
        v_session_id, p_initial_cash, 'CASH_IN', 'OPENING_FLOAT', v_session_id, p_user_id
    );

    RETURN jsonb_build_object('id', v_session_id, 'status', 'open');
END;
$$;

-- 3. REFACTOR: close_cash_session
CREATE OR REPLACE FUNCTION public.close_cash_session(
    p_session_id uuid,
    p_actual_cash numeric,
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
    v_restaurant_id uuid;
BEGIN
    -- 1. Get Session Info
    SELECT * INTO v_session FROM public.cash_sessions WHERE id = p_session_id;
    IF v_session.id IS NULL OR v_session.status != 'open' THEN
        RAISE EXCEPTION 'Sesión no encontrada o ya cerrada.';
    END IF;

    -- 2. Calculate Expected Cash
    -- Base: Initial + Net sum of transactions
    SELECT 
        COALESCE(SUM(CASE WHEN type = 'CASH_IN' THEN amount ELSE -amount END), 0)
    INTO v_expected_cash
    FROM public.cash_session_transactions
    WHERE cash_session_id = p_session_id;

    v_difference := p_actual_cash - v_expected_cash;

    -- 3. Update Session
    UPDATE public.cash_sessions SET
        status = 'closed',
        closed_at = now(),
        closed_by = p_user_id,
        expected_cash = v_expected_cash,
        actual_cash = p_actual_cash,
        difference = v_difference
    WHERE id = p_session_id;

    -- 4. Log Discrepancy in Ledger if exists
    IF v_difference != 0 AND public.is_feature_enabled(v_session.restaurant_id, 'ENABLE_FINANCIAL_LEDGER_IMPACT') THEN
        INSERT INTO public.financial_ledger (
            restaurant_id, branch_id, cash_session_id, entry_type, amount, source_table, source_id, created_by
        ) VALUES (
            v_session.restaurant_id, v_session.branch_id, p_session_id, 'CASH_DISCREPANCY', v_difference, 'cash_sessions', p_session_id, p_user_id
        );
    END IF;

    -- 5. Trigger Daily Snapshot (Assumption: This function calculates multi-branch or daily stats)
    -- We'll just return the result for now. 
    -- The frontend already triggers the accounting_period_lock via upsert.

    RETURN jsonb_build_object(
        'id', p_session_id,
        'expected_cash', v_expected_cash,
        'actual_cash', p_actual_cash,
        'difference', v_difference
    );
END;
$$;

-- 4. REFACTOR: register_supplier_invoice (With Enforcement)
CREATE OR REPLACE FUNCTION public.register_supplier_invoice(
    p_branch_id uuid,
    p_purchase_order_id uuid,
    p_supplier_id uuid,
    p_invoice_number text,
    p_total_amount numeric,
    p_payment_terms text,
    p_invoice_date date,
    p_due_date date,
    p_user_id uuid,
    p_items jsonb,
    p_cash_session_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_invoice_id uuid;
    v_restaurant_id uuid;
    v_session_id uuid;
BEGIN
    -- 1. Get Restaurant ID
    SELECT restaurant_id INTO v_restaurant_id FROM public.branches WHERE id = p_branch_id;

    -- 2. ENFORCEMENT: Check for Open Session
    v_session_id := COALESCE(p_cash_session_id, public.get_open_session_id(p_branch_id));
    
    IF v_session_id IS NULL AND p_payment_terms = 'contado' THEN
        RAISE EXCEPTION 'Se requiere una sesión de caja ABIERTA para registrar compras al contado.';
    END IF;

    -- 3. Check for Date Lock (Retroactive block)
    IF EXISTS (
        SELECT 1 FROM public.accounting_period_locks 
        WHERE branch_id = p_branch_id AND lock_date = CURRENT_DATE
    ) THEN
        RAISE EXCEPTION 'El periodo contable para hoy está bloqueado (Caja Cerrada).';
    END IF;

    -- 4. Create Invoice
    INSERT INTO public.supplier_invoices (
        restaurant_id, branch_id, purchase_order_id, supplier_id, invoice_number, total_amount, payment_terms, invoice_date, due_date, status, created_by
    ) VALUES (
        v_restaurant_id, p_branch_id, p_purchase_order_id, p_supplier_id, p_invoice_number, p_total_amount, p_payment_terms, p_invoice_date, p_due_date, 
        CASE WHEN p_payment_terms = 'contado' THEN 'paid' ELSE 'pending' END, p_user_id
    ) RETURNING id INTO v_invoice_id;

    -- 5. Register in Ledger (Operational Expense)
    IF public.is_feature_enabled(v_restaurant_id, 'ENABLE_FINANCIAL_LEDGER_IMPACT') THEN
        INSERT INTO public.financial_ledger (
            restaurant_id, branch_id, cash_session_id, entry_type, amount, source_table, source_id, created_by
        ) VALUES (
            v_restaurant_id, p_branch_id, v_session_id, 'SUPPLIER_PURCHASE', p_total_amount, 'supplier_invoices', v_invoice_id, p_user_id
        );
    END IF;

    -- 6. If 'contado' (cash), log Cash Transaction
    IF p_payment_terms = 'contado' THEN
        INSERT INTO public.cash_session_transactions (
            cash_session_id, amount, type, reference_type, reference_id, created_by
        ) VALUES (
            v_session_id, p_total_amount, 'CASH_OUT', 'SUPPLIER_INVOICE', v_invoice_id, p_user_id
        );
    ELSE
        -- If credit, create Accounts Payable
        INSERT INTO public.accounts_payable (
            restaurant_id, branch_id, supplier_invoice_id, supplier_id, total_amount, remaining_amount, due_date, status
        ) VALUES (
            v_restaurant_id, p_branch_id, v_invoice_id, p_supplier_id, p_total_amount, p_total_amount, p_due_date, 'pending'
        );
    END IF;

    -- 7. Update Purchase Order Status
    UPDATE public.purchase_orders SET status = 'invoiced' WHERE id = p_purchase_order_id;

    RETURN jsonb_build_object('id', v_invoice_id, 'status', 'success');
END;
$$;

-- 5. REFACTOR: pay_accounts_payable (With Enforcement)
CREATE OR REPLACE FUNCTION public.pay_accounts_payable(
    p_ap_id uuid,
    p_amount numeric,
    p_payment_method text,
    p_payment_date date,
    p_user_id uuid,
    p_cash_session_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_ap record;
    v_payment_id uuid;
    v_session_id uuid;
BEGIN
    -- 1. Get AP info
    SELECT * INTO v_ap FROM public.accounts_payable WHERE id = p_ap_id;
    IF v_ap.id IS NULL THEN RAISE EXCEPTION 'Registro de cuenta por pagar no encontrado.'; END IF;
    IF v_ap.remaining_amount < p_amount THEN RAISE EXCEPTION 'El monto supera el saldo pendiente.'; END IF;

    -- 2. ENFORCEMENT: Check session if paying in cash
    IF p_payment_method = 'Efectivo' THEN
        v_session_id := COALESCE(p_cash_session_id, public.get_open_session_id(v_ap.branch_id));
        IF v_session_id IS NULL THEN
            RAISE EXCEPTION 'Se requiere una sesión de caja ABIERTA para pagos en efectivo.';
        END IF;
    END IF;

    -- 3. Create Payment record
    INSERT INTO public.accounts_payable_payments (
        accounts_payable_id, amount, payment_method, payment_date, created_by
    ) VALUES (
        p_ap_id, p_amount, p_payment_method, p_payment_date, p_user_id
    ) RETURNING id INTO v_payment_id;

    -- 4. Update AP status
    UPDATE public.accounts_payable SET
        remaining_amount = remaining_amount - p_amount,
        status = CASE WHEN (remaining_amount - p_amount) <= 0 THEN 'paid' ELSE 'partially_paid' END
    WHERE id = p_ap_id;

    -- 5. Log in Ledger
    IF public.is_feature_enabled(v_ap.restaurant_id, 'ENABLE_FINANCIAL_LEDGER_IMPACT') THEN
        INSERT INTO public.financial_ledger (
            restaurant_id, branch_id, cash_session_id, entry_type, amount, source_table, source_id, created_by
        ) VALUES (
            v_ap.restaurant_id, v_ap.branch_id, v_session_id, 'SUPPLIER_PAYMENT', p_amount, 'accounts_payable_payments', v_payment_id, p_user_id
        );
    END IF;

    -- 6. Log in Cash Transactions if Cash
    IF p_payment_method = 'Efectivo' AND v_session_id IS NOT NULL THEN
        INSERT INTO public.cash_session_transactions (
            cash_session_id, amount, type, reference_type, reference_id, created_by
        ) VALUES (
            v_session_id, p_amount, 'CASH_OUT', 'AP_PAYMENT', v_payment_id, p_user_id
        );
    END IF;

    RETURN jsonb_build_object('id', v_payment_id, 'status', 'success');
END;
$$;

-- 6. REFACTOR: record_expense (If exists or generic)
-- The frontend inserts into 'expenses' but we should use an RPC for enforcement.
CREATE OR REPLACE FUNCTION public.record_operational_expense(
    p_branch_id uuid,
    p_category text,
    p_amount numeric,
    p_payment_method text,
    p_description text,
    p_user_id uuid,
    p_cash_session_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_expense_id uuid;
    v_restaurant_id uuid;
    v_session_id uuid;
BEGIN
    SELECT restaurant_id INTO v_restaurant_id FROM public.branches WHERE id = p_branch_id;
    
    -- ENFORCEMENT
    IF p_payment_method = 'Efectivo' THEN
        v_session_id := COALESCE(p_cash_session_id, public.get_open_session_id(p_branch_id));
        IF v_session_id IS NULL THEN
            RAISE EXCEPTION 'Se requiere una sesión de caja ABIERTA para gastos en efectivo.';
        END IF;
    END IF;

    INSERT INTO public.expenses (
        restaurant_id, branch_id, category, amount, payment_method, description, date, created_by
    ) VALUES (
        v_restaurant_id, p_branch_id, p_category, p_amount, p_payment_method, p_description, CURRENT_DATE, p_user_id
    ) RETURNING id INTO v_expense_id;

    -- Log Ledger
    IF public.is_feature_enabled(v_restaurant_id, 'ENABLE_FINANCIAL_LEDGER_IMPACT') THEN
        INSERT INTO public.financial_ledger (
            restaurant_id, branch_id, cash_session_id, entry_type, amount, source_table, source_id, created_by
        ) VALUES (
            v_restaurant_id, p_branch_id, v_session_id, 'EXPENSE', p_amount, 'expenses', v_expense_id, p_user_id
        );
    END IF;

    -- Log Cash if applicable
    IF p_payment_method = 'Efectivo' AND v_session_id IS NOT NULL THEN
        INSERT INTO public.cash_session_transactions (
            cash_session_id, amount, type, reference_type, reference_id, created_by
        ) VALUES (
            v_session_id, p_amount, 'CASH_OUT', 'OPERATIONAL_EXPENSE', v_expense_id, p_user_id
        );
    END IF;

    RETURN jsonb_build_object('id', v_expense_id, 'status', 'success');
END;
$$;

-- 7. NEW: register_manual_income
CREATE OR REPLACE FUNCTION public.register_manual_income(
    p_branch_id uuid,
    p_amount numeric,
    p_category text,
    p_description text,
    p_user_id uuid,
    p_cash_session_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_income_id uuid;
    v_restaurant_id uuid;
    v_session_id uuid;
BEGIN
    SELECT restaurant_id INTO v_restaurant_id FROM public.branches WHERE id = p_branch_id;
    
    -- ENFORCEMENT
    v_session_id := COALESCE(p_cash_session_id, public.get_open_session_id(p_branch_id));
    IF v_session_id IS NULL THEN
        RAISE EXCEPTION 'Se requiere una sesión de caja ABIERTA para registrar ingresos manuales.';
    END IF;

    INSERT INTO public.manual_income (
        restaurant_id, branch_id, cash_session_id, amount, category, description, created_by
    ) VALUES (
        v_restaurant_id, p_branch_id, v_session_id, p_amount, p_category, p_description, p_user_id
    ) RETURNING id INTO v_income_id;

    -- Log Ledger
    IF public.is_feature_enabled(v_restaurant_id, 'ENABLE_FINANCIAL_LEDGER_IMPACT') THEN
        INSERT INTO public.financial_ledger (
            restaurant_id, branch_id, cash_session_id, entry_type, amount, source_table, source_id, created_by
        ) VALUES (
            v_restaurant_id, p_branch_id, v_session_id, 'MANUAL_INCOME', p_amount, 'manual_income', v_income_id, p_user_id
        );
    END IF;

    -- Log Cash
    INSERT INTO public.cash_session_transactions (
        cash_session_id, amount, type, reference_type, reference_id, created_by
    ) VALUES (
        v_session_id, p_amount, 'CASH_IN', 'MANUAL_INCOME', v_income_id, p_user_id
    );

    RETURN jsonb_build_object('id', v_income_id, 'status', 'success');
END;
$$;

-- 8. NEW: register_internal_transfer
CREATE OR REPLACE FUNCTION public.register_internal_transfer(
    p_from_branch_id uuid,
    p_to_branch_id uuid,
    p_amount numeric,
    p_type text,
    p_description text,
    p_user_id uuid,
    p_from_session_id uuid DEFAULT NULL,
    p_to_session_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_transfer_id uuid;
    v_restaurant_id uuid;
    v_from_session_id uuid;
    v_to_session_id uuid;
BEGIN
    SELECT restaurant_id INTO v_restaurant_id FROM public.branches WHERE id = p_from_branch_id;
    
    -- ENFORCEMENT: Source session must be open if it's a cash transfer
    v_from_session_id := COALESCE(p_from_session_id, public.get_open_session_id(p_from_branch_id));
    IF v_from_session_id IS NULL AND p_type != 'BANK_TO_BANK' THEN
        RAISE EXCEPTION 'Se requiere una sesión de caja ABIERTA en la sucursal de origen.';
    END IF;

    -- Target session is optional (e.g. if transferring to bank or to a branch that isn't open yet)
    v_to_session_id := COALESCE(p_to_session_id, public.get_open_session_id(p_to_branch_id));

    INSERT INTO public.internal_transfers (
        restaurant_id, from_branch_id, to_branch_id, from_session_id, to_session_id, amount, type, description, created_by
    ) VALUES (
        v_restaurant_id, p_from_branch_id, p_to_branch_id, v_from_session_id, v_to_session_id, p_amount, p_type, p_description, p_user_id
    ) RETURNING id INTO v_transfer_id;

    -- Log Ledger (Outflow from Source)
    IF v_from_session_id IS NOT NULL THEN
        IF public.is_feature_enabled(v_restaurant_id, 'ENABLE_FINANCIAL_LEDGER_IMPACT') THEN
            INSERT INTO public.financial_ledger (
                restaurant_id, branch_id, cash_session_id, entry_type, amount, source_table, source_id, created_by
            ) VALUES (
                v_restaurant_id, p_from_branch_id, v_from_session_id, 'TRANSFER_OUT', p_amount, 'internal_transfers', v_transfer_id, p_user_id
            );
        END IF;

        INSERT INTO public.cash_session_transactions (
            cash_session_id, amount, type, reference_type, reference_id, created_by
        ) VALUES (
            v_from_session_id, p_amount, 'CASH_OUT', 'INTERNAL_TRANSFER', v_transfer_id, p_user_id
        );
    END IF;

    -- Log Ledger (Inflow to Target)
    IF v_to_session_id IS NOT NULL THEN
        IF public.is_feature_enabled(v_restaurant_id, 'ENABLE_FINANCIAL_LEDGER_IMPACT') THEN
            INSERT INTO public.financial_ledger (
                restaurant_id, branch_id, cash_session_id, entry_type, amount, source_table, source_id, created_by
            ) VALUES (
                v_restaurant_id, p_to_branch_id, v_to_session_id, 'TRANSFER_IN', p_amount, 'internal_transfers', v_transfer_id, p_user_id
            );
        END IF;

        INSERT INTO public.cash_session_transactions (
            cash_session_id, amount, type, reference_type, reference_id, created_by
        ) VALUES (
            v_to_session_id, p_amount, 'CASH_IN', 'INTERNAL_TRANSFER', v_transfer_id, p_user_id
        );
    END IF;

    RETURN jsonb_build_object('id', v_transfer_id, 'status', 'success');
END;
$$;

-- 9. REFACTOR: close_order_with_payment (With Enforcement)
CREATE OR REPLACE FUNCTION public.close_order_with_payment(
    p_order_ids uuid[],
    p_payment_method text,
    p_total_paid numeric,
    p_shift_id uuid -- This is the cash_session_id from frontend
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order_id uuid;
    v_session record;
BEGIN
    -- 1. Get Session Info
    SELECT * INTO v_session FROM public.cash_sessions WHERE id = p_shift_id;
    
    IF v_session.id IS NULL OR v_session.status != 'open' THEN
        RAISE EXCEPTION 'Se requiere una sesión de caja ABIERTA para procesar pagos.';
    END IF;

    -- 2. Update Orders & Table Status
    FOREACH v_order_id IN ARRAY p_order_ids
    LOOP
        UPDATE public.orders SET
            status = 'paid',
            payment_method = p_payment_method,
            shift_id = p_shift_id -- Link to session
        WHERE id = v_order_id;
    END LOOP;

    UPDATE public.tables
    SET status = 'available'
    WHERE id IN (SELECT DISTINCT table_id FROM public.orders WHERE id = ANY(p_order_ids));

    -- 3. Log in Ledger (Revenue)
    IF public.is_feature_enabled(v_session.restaurant_id, 'ENABLE_FINANCIAL_LEDGER_IMPACT') THEN
        INSERT INTO public.financial_ledger (
            restaurant_id, branch_id, cash_session_id, entry_type, amount, source_table, source_id, created_by
        ) VALUES (
            v_session.restaurant_id, v_session.branch_id, p_shift_id, 'SALE_REVENUE', p_total_paid, 'orders', p_order_ids[1], v_session.opened_by
        );
    END IF;

    -- 4. Log in Cash Transactions if Cash
    IF p_payment_method = 'cash' THEN
        INSERT INTO public.cash_session_transactions (
            cash_session_id, amount, type, reference_type, reference_id, created_by
        ) VALUES (
            p_shift_id, p_total_paid, 'CASH_IN', 'ORDER_PAYMENT', p_order_ids[1], v_session.opened_by
        );
    END IF;

    RETURN jsonb_build_object('status', 'success', 'order_ids', p_order_ids);
END;
$$;


