-- =========================================================================================
-- ERP Profitability System - Financial Audit Export Module Migration
-- Includes: Unified audit_events_view
-- =========================================================================================

-- Drop existing if we are recreating
DROP VIEW IF EXISTS public.audit_events_view;

CREATE OR REPLACE VIEW public.audit_events_view AS

-- 1. financial_ledger
SELECT
    id::text AS id,
    entry_type AS event_type,
    created_at AS timestamp,
    restaurant_id,
    branch_id,
    created_by AS user_id,
    source_id AS reference_id,
    amount,
    'Financial Ledger Entry: ' || entry_type AS description,
    jsonb_build_object('source_table', source_table, 'cash_session_id', cash_session_id) AS details
FROM public.financial_ledger

UNION ALL

-- 2. cash_sessions (Opening)
SELECT
    id::text || '-open' AS id,
    'CASH_SESSION_OPENED' AS event_type,
    opened_at AS timestamp,
    restaurant_id,
    branch_id,
    opened_by AS user_id,
    id AS reference_id,
    opening_amount AS amount,
    COALESCE(opening_comment, 'Caja Abierta') AS description,
    jsonb_build_object('initial_cash', initial_cash) AS details
FROM public.cash_sessions
WHERE opened_at IS NOT NULL

UNION ALL

-- 2b. cash_sessions (Closing)
SELECT
    id::text || '-close' AS id,
    'CASH_SESSION_CLOSED' AS event_type,
    closed_at AS timestamp,
    restaurant_id,
    branch_id,
    closed_by AS user_id,
    id AS reference_id,
    counted_cash AS amount,
    COALESCE(closing_comment, 'Caja Cerrada') AS description,
    jsonb_build_object(
        'expected_cash', expected_cash, 
        'actual_cash', actual_cash, 
        'difference', difference,
        'counted_card', counted_card,
        'counted_transfer', counted_transfer,
        'counted_other', counted_other
    ) AS details
FROM public.cash_sessions
WHERE closed_at IS NOT NULL

UNION ALL

-- 3. expenses
SELECT
    e.id::text AS id,
    'EXPENSE_RECORDED' AS event_type,
    e.created_at AS timestamp,
    b.restaurant_id,
    e.branch_id,
    NULL::uuid AS user_id, -- Expenses currently don't track creator in the table schema
    e.id AS reference_id,
    e.amount,
    COALESCE(e.description, e.category || ' - ' || COALESCE(e.subcategory, '')) AS description,
    jsonb_build_object('category', e.category, 'type', e.type, 'payment_method', e.payment_method, 'date', e.date) AS details
FROM public.expenses e
LEFT JOIN public.branches b ON e.branch_id = b.id

UNION ALL

-- 4. accounts_payable_payments
SELECT
    p.id::text AS id,
    'ACCOUNTS_PAYABLE_PAYMENT' AS event_type,
    p.created_at AS timestamp,
    b.restaurant_id,
    p.branch_id,
    p.created_by AS user_id,
    p.accounts_payable_id AS reference_id,
    p.amount,
    'Pago a cuenta por pagar' AS description,
    jsonb_build_object('supplier_invoice_id', p.supplier_invoice_id, 'payment_date', p.payment_date) AS details
FROM public.accounts_payable_payments p
LEFT JOIN public.branches b ON p.branch_id = b.id

UNION ALL

-- 5. payments (Order payments)
SELECT
    p.id::text AS id,
    'ORDER_PAYMENT_' || UPPER(p.method) AS event_type,
    p.created_at AS timestamp,
    p.restaurant_id,
    p.branch_id,
    p.user_id,
    p.order_id AS reference_id,
    p.amount,
    'Pago de orden vía ' || p.method AS description,
    jsonb_build_object('status', p.status, 'cash_session_id', p.cash_session_id) AS details
FROM public.payments p

UNION ALL

-- 6. supplier_invoices
SELECT
    i.id::text AS id,
    'SUPPLIER_INVOICE_REGISTERED' AS event_type,
    i.created_at AS timestamp,
    b.restaurant_id,
    i.branch_id,
    i.created_by AS user_id,
    i.purchase_order_id AS reference_id,
    i.total_amount AS amount,
    'Factura #' || COALESCE(i.invoice_number, 'N/A') || ' registrada' AS description,
    jsonb_build_object('supplier_id', i.supplier_id, 'payment_type', i.payment_type, 'invoice_date', i.invoice_date) AS details
FROM public.supplier_invoices i
LEFT JOIN public.branches b ON i.branch_id = b.id

UNION ALL

-- 7. inventory_movements
SELECT
    m.id::text AS id,
    'INVENTORY_MOVEMENT_' || UPPER(m.type) AS event_type,
    m.created_at AS timestamp,
    b.restaurant_id,
    m.branch_id,
    m.user_id,
    COALESCE(m.order_id, m.inventory_id) AS reference_id,
    0 AS amount, -- Purely logistical movements, value captured elsewhere
    COALESCE(m.description, 'Movimiento de inventario') AS description,
    jsonb_build_object('quantity_change', m.quantity_change, 'ingredient_id', m.ingredient_id) AS details
FROM public.inventory_movements m
LEFT JOIN public.branches b ON m.branch_id = b.id

UNION ALL

-- 8. waste_records
SELECT
    w.id::text AS id,
    'WASTE_RECORDED' AS event_type,
    w.created_at AS timestamp,
    b.restaurant_id,
    w.branch_id,
    w.user_id,
    w.batch_id AS reference_id,
    w.total_cost AS amount,
    COALESCE(w.reason, 'Merma registrada') AS description,
    jsonb_build_object('quantity', w.quantity, 'unit', w.unit, 'ingredient_id', w.ingredient_id, 'notes', w.notes) AS details
FROM public.waste_records w
LEFT JOIN public.branches b ON w.branch_id = b.id

UNION ALL

-- 9. activity_logs (System Event Log)
SELECT
    a.id::text AS id,
    'SYSTEM_ACTIVITY_' || UPPER(a.action) AS event_type,
    a.created_at AS timestamp,
    u.restaurant_id,
    u.branch_id,
    a.user_id,
    a.reference_id,
    0 AS amount,
    'Acción: ' || a.action || ' en ' || a.module AS description,
    a.details
FROM public.activity_logs a
LEFT JOIN public.users u ON a.user_id = u.id

UNION ALL

-- 10. daily_branch_financial_snapshots
SELECT
    d.id::text AS id,
    'DAILY_FINANCIAL_SNAPSHOT' AS event_type,
    d.created_at AS timestamp,
    b.restaurant_id,
    d.branch_id,
    NULL::uuid AS user_id,
    d.cash_session_id AS reference_id,
    d.gross_profit AS amount,
    'Corte financiero del ' || d.snapshot_date::text AS description,
    jsonb_build_object(
        'total_sales', d.total_sales,
        'total_cogs', d.total_cogs,
        'total_expenses', d.total_expenses,
        'total_waste_cost', d.total_waste_cost,
        'net_profit', d.net_profit,
        'inventory_value', d.inventory_value
    ) AS details
FROM public.daily_branch_financial_snapshots d
LEFT JOIN public.branches b ON d.branch_id = b.id;

-- Apply Security Policies (Read Only view)
-- Views don't typically have RLS unless they are security invoker views or row-level permissions are implied via the underlying tables.
-- Supabase relies on the query hitting the tables. Since it's a view, we can just grant SELECT.
GRANT SELECT ON public.audit_events_view TO authenticated;
GRANT SELECT ON public.audit_events_view TO service_role;
