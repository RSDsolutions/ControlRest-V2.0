-- ==========================================
-- SUPPPLIER INVOICE FINANCIAL LAYER
-- ==========================================

-- 1. Create financial_ledger (Libro Mayor)
CREATE TABLE IF NOT EXISTS public.financial_ledger (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id uuid REFERENCES public.branches(id),
    supplier_invoice_id uuid, -- Link later if needed
    purchase_order_id uuid REFERENCES public.purchase_orders(id),
    amount numeric(12,2) NOT NULL,
    type text NOT NULL, -- e.g. 'SUPPLIER_PURCHASE_EXPENSE'
    description text,
    occurred_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES public.users(id),
    created_at timestamptz DEFAULT now()
);

-- 2. Create cash_session_transactions
CREATE TABLE IF NOT EXISTS public.cash_session_transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    cash_session_id uuid REFERENCES public.cash_sessions(id),
    amount numeric(12,2) NOT NULL,
    type text CHECK (type IN ('CASH_IN', 'CASH_OUT')),
    reference_id uuid, -- ID of source transaction (e.g. supplier_invoice_id)
    reference_type text, -- e.g. 'SUPPLIER_INVOICE'
    notes text,
    created_by uuid REFERENCES public.users(id),
    created_at timestamptz DEFAULT now()
);

-- 3. Create supplier_invoices
CREATE TABLE IF NOT EXISTS public.supplier_invoices (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id uuid REFERENCES public.branches(id),
    supplier_id uuid REFERENCES public.suppliers(id),
    purchase_order_id uuid REFERENCES public.purchase_orders(id),
    invoice_number text NOT NULL,
    total_amount numeric(12,2) NOT NULL,
    payment_type text CHECK (payment_type IN ('CASH', 'CREDIT')),
    invoice_date date NOT NULL,
    created_by uuid REFERENCES public.users(id),
    created_at timestamptz DEFAULT now()
);

-- 4. Create accounts_payable
CREATE TABLE IF NOT EXISTS public.accounts_payable (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id uuid REFERENCES public.branches(id),
    supplier_id uuid REFERENCES public.suppliers(id),
    supplier_invoice_id uuid REFERENCES public.supplier_invoices(id),
    amount numeric(12,2) NOT NULL,
    status text CHECK (status IN ('PENDING', 'PAID')) DEFAULT 'PENDING',
    due_date date,
    created_at timestamptz DEFAULT now()
);

-- 5. RLS Policies
ALTER TABLE public.financial_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_session_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts_payable ENABLE ROW LEVEL SECURITY;

-- Simple permissive policy for now (matching existing tables)
CREATE POLICY "Enable all for authenticated" ON public.financial_ledger FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated" ON public.cash_session_transactions FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated" ON public.supplier_invoices FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated" ON public.accounts_payable FOR ALL TO authenticated USING (true);

-- 6. RPC: register_supplier_invoice
CREATE OR REPLACE FUNCTION public.register_supplier_invoice(
    p_branch_id uuid,
    p_supplier_id uuid,
    p_purchase_order_id uuid,
    p_invoice_number text,
    p_total_amount numeric,
    p_payment_type text,
    p_invoice_date date,
    p_due_date date,
    p_cash_session_id uuid,
    p_user_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_invoice_id uuid;
    v_locked_id uuid;
BEGIN
    -- 1. Validate Accounting Period Lock
    SELECT id INTO v_locked_id
    FROM public.accounting_period_locks
    WHERE branch_id = p_branch_id 
      AND lock_date = p_invoice_date;

    IF v_locked_id IS NOT NULL THEN
        RAISE EXCEPTION 'Cannot register supplier invoice in locked accounting period (%)', p_invoice_date;
    END IF;

    -- 2. Insert Supplier Invoice
    INSERT INTO public.supplier_invoices (
        branch_id, supplier_id, purchase_order_id, invoice_number, 
        total_amount, payment_type, invoice_date, created_by
    ) VALUES (
        p_branch_id, p_supplier_id, p_purchase_order_id, p_invoice_number,
        p_total_amount, p_payment_type, p_invoice_date, p_user_id
    ) RETURNING id INTO v_invoice_id;

    -- 3. Insert into financial_ledger
    INSERT INTO public.financial_ledger (
        branch_id, supplier_invoice_id, purchase_order_id, 
        amount, type, occurred_at, created_by, description
    ) VALUES (
        p_branch_id, v_invoice_id, p_purchase_order_id,
        p_total_amount, 'SUPPLIER_PURCHASE_EXPENSE', p_invoice_date, p_user_id,
        'Factura #' || p_invoice_number
    );

    -- 4. Logic by Payment Type
    IF p_payment_type = 'CASH' THEN
        -- Verify cash session if needed (optional check)
        IF p_cash_session_id IS NULL THEN
            RAISE EXCEPTION 'Cash session ID required for CASH payment type';
        END IF;

        INSERT INTO public.cash_session_transactions (
            cash_session_id, amount, type, reference_id, 
            reference_type, created_by, notes
        ) VALUES (
            p_cash_session_id, p_total_amount, 'CASH_OUT', v_invoice_id,
            'SUPPLIER_INVOICE', p_user_id, 'Pago Factura #' || p_invoice_number
        );
    ELSIF p_payment_type = 'CREDIT' THEN
        INSERT INTO public.accounts_payable (
            branch_id, supplier_id, supplier_invoice_id, 
            amount, status, due_date
        ) VALUES (
            p_branch_id, p_supplier_id, v_invoice_id,
            p_total_amount, 'PENDING', p_due_date
        );
    END IF;

    -- 5. Mark PO as closed/billed (optional extension, but user didn't request)
    -- We'll keep it as is.

    RETURN v_invoice_id;
END;
$$;
