-- ==========================================
-- ACCOUNTS PAYABLE PAYMENT FLOW
-- ==========================================

-- 1. Create accounts_payable_payments
CREATE TABLE IF NOT EXISTS public.accounts_payable_payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id uuid REFERENCES public.branches(id),
    accounts_payable_id uuid REFERENCES public.accounts_payable(id),
    supplier_invoice_id uuid REFERENCES public.supplier_invoices(id),
    amount numeric(12,2) NOT NULL,
    payment_date date NOT NULL,
    cash_session_id uuid REFERENCES public.cash_sessions(id),
    created_by uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now()
);

-- 2. RLS Policies
ALTER TABLE public.accounts_payable_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for authenticated" ON public.accounts_payable_payments FOR ALL TO authenticated USING (true);

-- 3. RPC: pay_accounts_payable
CREATE OR REPLACE FUNCTION public.pay_accounts_payable(
    p_accounts_payable_id uuid,
    p_payment_amount numeric,
    p_payment_date date,
    p_cash_session_id uuid,
    p_user_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_payment_id uuid;
    v_payable_status text;
    v_branch_id uuid;
    v_invoice_id uuid;
    v_locked_id uuid;
    v_invoice_number text;
BEGIN
    -- 3.1 FETCH & VALIDATE PAYABLE
    SELECT status, branch_id, supplier_invoice_id INTO v_payable_status, v_branch_id, v_invoice_id
    FROM public.accounts_payable
    WHERE id = p_accounts_payable_id;

    IF v_payable_status = 'PAID' THEN
        RAISE EXCEPTION 'Accounts payable already settled';
    END IF;

    -- 3.2 ACCOUNTING PERIOD LOCK VALIDATION
    SELECT id INTO v_locked_id
    FROM public.accounting_period_locks
    WHERE branch_id = v_branch_id 
      AND lock_date = p_payment_date;

    IF v_locked_id IS NOT NULL THEN
        RAISE EXCEPTION 'Cannot register payment in locked accounting period (%)', p_payment_date;
    END IF;

    -- Fetch invoice number for ledger/notes
    SELECT invoice_number INTO v_invoice_number
    FROM public.supplier_invoices
    WHERE id = v_invoice_id;

    -- 3.3 INSERT INTO accounts_payable_payments
    INSERT INTO public.accounts_payable_payments (
        branch_id, accounts_payable_id, supplier_invoice_id, 
        amount, payment_date, cash_session_id, created_by
    ) VALUES (
        v_branch_id, p_accounts_payable_id, v_invoice_id,
        p_payment_amount, p_payment_date, p_cash_session_id, p_user_id
    ) RETURNING id INTO v_payment_id;

    -- 3.4 INSERT INTO financial_ledger
    INSERT INTO public.financial_ledger (
        branch_id, supplier_invoice_id, amount, 
        type, occurred_at, created_by, description
    ) VALUES (
        v_branch_id, v_invoice_id, p_payment_amount,
        'SUPPLIER_PAYMENT', p_payment_date, p_user_id,
        'Liquidación Deuda Factura #' || v_invoice_number
    );

    -- 3.5 INSERT INTO cash_session_transactions
    IF p_cash_session_id IS NOT NULL THEN
        INSERT INTO public.cash_session_transactions (
            cash_session_id, amount, type, reference_id, 
            reference_type, created_by, notes
        ) VALUES (
            p_cash_session_id, p_payment_amount, 'CASH_OUT', p_accounts_payable_id,
            'ACCOUNTS_PAYABLE_PAYMENT', p_user_id, 'Pago Deuda Factura #' || v_invoice_number
        );
    END IF;

    -- 3.6 UPDATE accounts_payable
    UPDATE public.accounts_payable
    SET status = 'PAID'
    WHERE id = p_accounts_payable_id;

    RETURN v_payment_id;
END;
$$;
