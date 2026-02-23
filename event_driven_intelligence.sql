-- ========================================================================================
-- EVENT-DRIVEN FINANCIAL INTELLIGENCE ENGINE MIGRATION
-- ========================================================================================
-- This script creates the non-intrusive, async-safe, event-driven intelligence layer.
-- IMPORTANT: Ensure the `pg_cron` extension is enabled in your Supabase Database Settings.
-- ========================================================================================

-- Enable pg_cron if not already enabled (Requires superuser, skip if already done via Dashboard)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ==========================================
-- 1. EVENT LOG TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.system_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    event_type VARCHAR(255) NOT NULL, -- e.g., 'margin_drift', 'supplier_cost_shock'
    event_category VARCHAR(100) NOT NULL, -- 'financial', 'operational', 'inventory'
    severity VARCHAR(50) NOT NULL DEFAULT 'info', -- 'info', 'warning', 'critical'
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    source_table VARCHAR(100), -- 'recipe_cost_snapshot_daily', etc.
    source_record_id TEXT, -- ID of the record that triggered this
    impact_value NUMERIC(15, 4), -- Financial impact
    impact_projection TEXT, -- Description of the impact
    recommended_action TEXT, -- Text description of what to do
    metadata JSONB DEFAULT '{}'::jsonb, -- Additional data (e.g., recipe_id, new_cost)
    acknowledged BOOLEAN DEFAULT FALSE,
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for system_events
ALTER TABLE public.system_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read events for their branches" ON public.system_events;
CREATE POLICY "Users can read events for their branches" 
ON public.system_events FOR SELECT 
USING (
    branch_id IN (
        SELECT branch_id FROM public.users WHERE id = auth.uid()
    ) OR 
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);

DROP POLICY IF EXISTS "Only admins can update events" ON public.system_events;
CREATE POLICY "Only admins can update events" 
ON public.system_events FOR UPDATE 
USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);

-- ==========================================
-- 2. SNAPSHOT LAYER
-- ==========================================

-- A. Recipe Cost Snapshot Daily
DROP TABLE IF EXISTS public.recipe_cost_snapshot_daily CASCADE;
CREATE TABLE public.recipe_cost_snapshot_daily (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    avg_cost_per_unit NUMERIC(15, 4) NOT NULL,
    avg_cost_last_7_days NUMERIC(15, 4),
    avg_cost_last_30_days NUMERIC(15, 4),
    snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(recipe_id, branch_id, snapshot_date)
);

-- B. Ingredient Usage Snapshot Daily
DROP TABLE IF EXISTS public.ingredient_usage_snapshot_daily CASCADE;
CREATE TABLE public.ingredient_usage_snapshot_daily (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ingredient_id UUID REFERENCES public.ingredients(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    avg_daily_usage_7d NUMERIC(15, 4),
    usage_today NUMERIC(15, 4),
    variance_pct NUMERIC(5, 2), -- Variance from moving average
    snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(ingredient_id, branch_id, snapshot_date)
);

-- C. Branch Profit Trend Snapshot
DROP TABLE IF EXISTS public.branch_profit_trend_snapshot CASCADE;
CREATE TABLE public.branch_profit_trend_snapshot (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    projected_month_profit NUMERIC(15, 4),
    avg_profit_last_month NUMERIC(15, 4),
    trend_pct NUMERIC(10, 2),
    snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(branch_id, snapshot_date)
);

-- D. Inventory Idle Snapshot
DROP TABLE IF EXISTS public.inventory_idle_snapshot CASCADE;
CREATE TABLE public.inventory_idle_snapshot (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ingredient_id UUID REFERENCES public.ingredients(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    idle_days INT NOT NULL,
    inventory_value NUMERIC(15, 4),
    snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(ingredient_id, branch_id, snapshot_date)
);

-- ==========================================
-- 3. TRIGGER LAYER (NOTIFY)
-- ==========================================
-- These triggers emit async events without blocking the main transaction

-- Supplier Invoice Posted
CREATE OR REPLACE FUNCTION notify_supplier_invoice_posted() RETURNS TRIGGER AS $$
BEGIN
    PERFORM pg_notify('supplier_cost_change_event', row_to_json(NEW)::text);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_supplier_invoice_notify ON public.supplier_invoices;
CREATE TRIGGER trg_supplier_invoice_notify
AFTER INSERT
ON public.supplier_invoices
FOR EACH ROW
EXECUTE FUNCTION notify_supplier_invoice_posted();


-- Waste Record Inserted
CREATE OR REPLACE FUNCTION notify_waste_record_inserted() RETURNS TRIGGER AS $$
BEGIN
    PERFORM pg_notify('waste_impact_event', row_to_json(NEW)::text);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_waste_record_notify ON public.waste_records;
CREATE TRIGGER trg_waste_record_notify
AFTER INSERT
ON public.waste_records
FOR EACH ROW
EXECUTE FUNCTION notify_waste_record_inserted();


-- Cash Session Closed
CREATE OR REPLACE FUNCTION notify_cash_session_closed() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'closed' AND OLD.status = 'open' THEN
        PERFORM pg_notify('cash_discrepancy_check_event', row_to_json(NEW)::text);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_cash_session_notify ON public.cash_sessions;
CREATE TRIGGER trg_cash_session_notify
AFTER UPDATE OF status
ON public.cash_sessions
FOR EACH ROW
EXECUTE FUNCTION notify_cash_session_closed();


-- Expense Record Inserted
CREATE OR REPLACE FUNCTION notify_expense_inserted() RETURNS TRIGGER AS $$
BEGIN
    -- Trigger anomaly detection logic
    PERFORM detect_expense_anomaly();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_expense_notify ON public.expenses;
CREATE TRIGGER trg_expense_notify
AFTER INSERT
ON public.expenses
FOR EACH ROW
EXECUTE FUNCTION notify_expense_inserted();


-- ==========================================
-- 4. EVENT WORKER JOBS (Functions to generate events)
-- ==========================================
-- These functions analyze snapshots and insert into system_events

-- A. Detect Margin Drift
CREATE OR REPLACE FUNCTION detect_margin_drift() RETURNS void AS $$
DECLARE
    r RECORD;
    v_target_margin NUMERIC := 0.35; -- 35% target margin
    v_actual_margin NUMERIC;
BEGIN
    FOR r IN 
        SELECT 
            rc.recipe_id, 
            rc.avg_cost_per_unit, 
            rec.name as recipe_name, 
            rec.selling_price,
            rc.branch_id,
            b.restaurant_id
        FROM public.recipe_cost_snapshot_daily rc
        JOIN public.recipes rec ON rc.recipe_id = rec.id
        JOIN public.branches b ON rc.branch_id = b.id
        WHERE rc.snapshot_date = CURRENT_DATE AND rec.is_active = TRUE
    LOOP
        IF r.selling_price > 0 AND public.is_feature_enabled(r.restaurant_id, 'ENABLE_NET_PROFIT_CALCULATION') THEN
            v_actual_margin := (r.selling_price - r.avg_cost_per_unit) / r.selling_price;
            
            IF v_actual_margin < 0.20 THEN
                INSERT INTO public.system_events (
                    restaurant_id, branch_id, event_type, event_category, severity, 
                    source_table, source_record_id, impact_value, 
                    impact_projection, recommended_action, metadata
                ) VALUES (
                    r.restaurant_id, r.branch_id, 'margin_drift', 'financial', 'critical',
                    'recipe_cost_snapshot_daily', r.recipe_id::text, (r.avg_cost_per_unit - r.selling_price),
                    'Pérdida de margen crítico en esta sucursal. Costo actual: $' || ROUND(r.avg_cost_per_unit, 2),
                    'Ajustar precio de venta o investigar costo de proveedores locales.',
                    jsonb_build_object('recipe_name', r.recipe_name, 'current_margin', v_actual_margin, 'target_margin', v_target_margin)
                );
            END IF;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- B. Detect Idle Inventory
CREATE OR REPLACE FUNCTION detect_idle_inventory_capital() RETURNS void AS $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT 
            i.ingredient_id, i.branch_id, i.idle_days, i.inventory_value,
            ing.name as ingredient_name, b.restaurant_id
        FROM public.inventory_idle_snapshot i
        JOIN public.ingredients ing ON i.ingredient_id = ing.id
        JOIN public.branches b ON i.branch_id = b.id
        WHERE i.snapshot_date = CURRENT_DATE AND i.idle_days >= 7 AND i.inventory_value > 100
    LOOP
        INSERT INTO public.system_events (
            restaurant_id, branch_id, event_type, event_category, severity, 
            source_table, source_record_id, impact_value, 
            impact_projection, recommended_action, metadata
        ) VALUES (
            r.restaurant_id, r.branch_id, 'idle_inventory', 'inventory', 'warning',
            'inventory_idle_snapshot', r.ingredient_id::text, r.inventory_value,
            'Capital retenido. ' || r.idle_days || ' días sin rotación.',
            'Disminuir proyecciones de compra o crear promociones para liberar.',
            jsonb_build_object('ingredient_name', r.ingredient_name, 'idle_days', r.idle_days, 'capital_locked', r.inventory_value)
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- C. Detect Profit Deviation
CREATE OR REPLACE FUNCTION detect_profit_deviation() RETURNS void AS $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        WITH daily_sales AS (
            SELECT 
                branch_id,
                SUM(total) as revenue
            FROM public.orders
            WHERE status = 'completed' AND created_at >= NOW() - INTERVAL '24 hours'
            GROUP BY branch_id
        ),
        daily_expenses AS (
            SELECT 
                branch_id,
                SUM(amount) as cost
            FROM public.expenses
            WHERE date >= CURRENT_DATE - INTERVAL '1 day'
            GROUP BY branch_id
        ),
        historical_stats AS (
            SELECT 
                branch_id,
                AVG(total_sales) as avg_revenue,
                AVG(total_expenses) as avg_expenses
            FROM public.daily_financial_snapshots
            WHERE snapshot_date >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY branch_id
        )
        SELECT 
            ds.branch_id,
            b.restaurant_id,
            ds.revenue,
            COALESCE(de.cost, 0) as expenses,
            hs.avg_revenue,
            COALESCE(hs.avg_expenses, 0) as avg_expenses
        FROM daily_sales ds
        JOIN historical_stats hs ON ds.branch_id = hs.branch_id
        JOIN public.branches b ON ds.branch_id = b.id
        LEFT JOIN daily_expenses de ON ds.branch_id = de.branch_id
        WHERE (ds.revenue < (hs.avg_revenue * 0.8) OR (COALESCE(de.cost, 0) > (hs.avg_expenses * 1.25) AND hs.avg_expenses > 0))
          AND public.is_feature_enabled(r.restaurant_id, 'ENABLE_NET_PROFIT_CALCULATION')
    LOOP
        -- Avoid duplicates
        IF NOT EXISTS (
            SELECT 1 FROM public.system_events 
            WHERE branch_id = r.branch_id 
            AND event_type = 'profit_deviation'
            AND resolved = FALSE
            AND created_at >= NOW() - INTERVAL '12 hours'
        ) THEN
            INSERT INTO public.system_events (
                restaurant_id, branch_id, event_type, event_category, severity, 
                impact_value, impact_projection, recommended_action, metadata
            ) VALUES (
                r.restaurant_id, r.branch_id, 'profit_deviation', 'financial', 'critical',
                (r.avg_revenue - r.revenue + r.expenses - r.avg_expenses),
                CASE 
                    WHEN r.expenses > (r.avg_expenses * 1.25) THEN 'Incremento crítico en gastos operativos detectado.'
                    ELSE 'Caída crítica en volumen de ventas detectada.'
                END,
                'Revisar flujo de caja y controlar gastos variables.',
                jsonb_build_object('revenue', r.revenue, 'avg_revenue', r.avg_revenue, 'expenses', r.expenses, 'avg_expenses', r.avg_expenses)
            );
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- D. Detect Expense Anomaly
CREATE OR REPLACE FUNCTION detect_expense_anomaly(p_lookback_interval INTERVAL DEFAULT '48 hours') RETURNS void AS $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        WITH category_averages AS (
            SELECT 
                branch_id,
                category,
                AVG(amount) as avg_amount
            FROM public.expenses
            WHERE date >= CURRENT_DATE - INTERVAL '90 days'
            GROUP BY branch_id, category
        ),
        recent_expenses AS (
            SELECT 
                e.id,
                e.branch_id,
                e.category,
                e.amount,
                e.description,
                b.restaurant_id
            FROM public.expenses e
            JOIN public.branches b ON e.branch_id = b.id
            WHERE e.created_at >= NOW() - p_lookback_interval
        )
        SELECT 
            re.*,
            ca.avg_amount
        FROM recent_expenses re
        JOIN category_averages ca ON re.branch_id = ca.branch_id AND re.category = ca.category
        WHERE re.amount > ca.avg_amount * 1.25 -- 25% deviation
          AND public.is_feature_enabled(re.restaurant_id, 'ENABLE_NET_PROFIT_CALCULATION')
    LOOP
        -- Avoid duplicates
        IF NOT EXISTS (
            SELECT 1 FROM public.system_events 
            WHERE source_record_id = r.id::text 
            AND event_type = 'expense_anomaly'
            AND resolved = FALSE
        ) THEN
            INSERT INTO public.system_events (
                restaurant_id, branch_id, event_type, event_category, severity, 
                source_table, source_record_id, impact_value, 
                impact_projection, recommended_action, metadata
            ) VALUES (
                r.restaurant_id, r.branch_id, 'expense_anomaly', 'financial', 'warning',
                'expenses', r.id::text, (r.amount - r.avg_amount),
                'Gasto inusual detectado en "' || r.category || '". Supera el promedio histórico en un ' || ROUND(((r.amount - r.avg_amount) / r.avg_amount * 100), 1) || '%.',
                'Simular plan de eficiencia para esta categoría.',
                jsonb_build_object('category', r.category, 'actual_amount', r.amount, 'avg_amount', r.avg_amount)
            );
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- E. Detect Efficiency Leak (Expenses vs Sales Ratio)
CREATE OR REPLACE FUNCTION detect_efficiency_leak() RETURNS void AS $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        WITH financial_metrics AS (
            SELECT 
                o.branch_id,
                SUM(o.total) as total_revenue,
                COALESCE((SELECT SUM(amount) FROM public.expenses e WHERE e.branch_id = o.branch_id AND e.date >= CURRENT_DATE - INTERVAL '30 days'), 0) as total_expenses,
                b.restaurant_id
            FROM public.orders o
            JOIN public.branches b ON o.branch_id = b.id
            WHERE o.status = 'completed' AND o.created_at >= NOW() - INTERVAL '30 days'
            GROUP BY o.branch_id, b.restaurant_id
        )
        SELECT * FROM financial_metrics
        WHERE total_revenue > 0 AND (total_expenses / total_revenue) > 0.50 -- Expenses > 50% of Revenue
          AND public.is_feature_enabled(restaurant_id, 'ENABLE_NET_PROFIT_CALCULATION')
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM public.system_events 
            WHERE branch_id = r.branch_id 
            AND event_type = 'efficiency_leak'
            AND resolved = FALSE
            AND created_at >= NOW() - INTERVAL '7 days'
        ) THEN
            INSERT INTO public.system_events (
                restaurant_id, branch_id, event_type, event_category, severity, 
                impact_value, impact_projection, recommended_action, metadata
            ) VALUES (
                r.restaurant_id, r.branch_id, 'efficiency_leak', 'financial', 'critical',
                r.total_expenses,
                'Fuga de eficiencia detectada. Tus gastos representan el ' || ROUND((r.total_expenses / r.total_revenue * 100), 1) || '% de tus ingresos del último mes.',
                'Revisar estructura de costos fijos y reducir desperdicios.',
                jsonb_build_object('revenue', r.total_revenue, 'expenses', r.total_expenses, 'ratio', (r.total_expenses / r.total_revenue))
            );
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;


-- ==========================================
-- 5. SIMULATION LAYER (Read Only RPCs)
-- ==========================================
-- These do not modify any physical tables, just return projections

-- A. Simulate Price Adjustment
CREATE OR REPLACE FUNCTION simulate_price_adjustment(p_recipe_id UUID, p_new_price NUMERIC)
RETURNS TABLE (
    recipe_id UUID,
    old_price NUMERIC,
    new_price NUMERIC,
    current_cost_per_unit NUMERIC,
    old_margin_pct NUMERIC,
    new_margin_pct NUMERIC,
    projected_daily_profit_increase NUMERIC
) AS $$
DECLARE
    v_old_price NUMERIC;
    v_cost NUMERIC;
    v_avg_daily_sales NUMERIC;
BEGIN
    SELECT selling_price INTO v_old_price FROM public.recipes WHERE id = p_recipe_id;
    
    -- Get cost from snapshot or calculate
    SELECT avg_cost_per_unit INTO v_cost 
    FROM public.recipe_cost_snapshot_daily 
    WHERE public.recipe_cost_snapshot_daily.recipe_id = p_recipe_id 
    ORDER BY snapshot_date DESC LIMIT 1;

    IF v_cost IS NULL THEN v_cost := 0; END IF;

    -- Estimate daily sales (naive avg based on last 7 days order items)
    SELECT COALESCE(SUM(quantity) / 7.0, 0) INTO v_avg_daily_sales
    FROM public.order_items oi
    JOIN public.orders o ON oi.order_id = o.id
    WHERE oi.recipe_id = p_recipe_id AND o.created_at >= NOW() - INTERVAL '7 days';

    RETURN QUERY SELECT 
        p_recipe_id,
        v_old_price,
        p_new_price,
        v_cost,
        CASE WHEN v_old_price > 0 THEN ((v_old_price - v_cost) / v_old_price) ELSE 0 END,
        CASE WHEN p_new_price > 0 THEN ((p_new_price - v_cost) / p_new_price) ELSE 0 END,
        ((p_new_price - v_cost) - (v_old_price - v_cost)) * v_avg_daily_sales;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- B. Simulate Gram Reduction
CREATE OR REPLACE FUNCTION simulate_gram_reduction(p_recipe_id UUID, p_reduction_pct NUMERIC)
RETURNS TABLE (
    recipe_id UUID,
    current_cost NUMERIC,
    new_cost NUMERIC,
    savings_per_unit NUMERIC,
    projected_monthly_savings NUMERIC
) AS $$
DECLARE
    v_current_cost NUMERIC;
    v_new_cost NUMERIC;
    v_avg_daily_sales NUMERIC;
BEGIN
    -- This assumes we are doing a flat reduction across all ingredients in the recipe for simulation
    SELECT avg_cost_per_unit INTO v_current_cost 
    FROM public.recipe_cost_snapshot_daily 
    WHERE public.recipe_cost_snapshot_daily.recipe_id = p_recipe_id 
    ORDER BY snapshot_date DESC LIMIT 1;
    
    IF v_current_cost IS NULL THEN v_current_cost := 0; END IF;

    v_new_cost := v_current_cost * (1 - (p_reduction_pct / 100.0));

    SELECT COALESCE(SUM(quantity) / 7.0, 0) INTO v_avg_daily_sales
    FROM public.order_items oi
    JOIN public.orders o ON oi.order_id = o.id
    WHERE oi.recipe_id = p_recipe_id AND o.created_at >= NOW() - INTERVAL '7 days';

    RETURN QUERY SELECT 
        p_recipe_id,
        v_current_cost,
        v_new_cost,
        (v_current_cost - v_new_cost),
        ((v_current_cost - v_new_cost) * v_avg_daily_sales * 30);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- C. Simulate Expense Reduction
CREATE OR REPLACE FUNCTION simulate_expense_reduction(p_branch_id UUID, p_category TEXT, p_reduction_pct NUMERIC)
RETURNS TABLE (
    category TEXT,
    current_monthly_avg NUMERIC,
    projected_monthly_avg NUMERIC,
    monthly_savings NUMERIC
) AS $$
DECLARE
    v_avg_monthly_spend NUMERIC;
BEGIN
    -- Average monthly spend in this category (last 90 days / 3)
    SELECT COALESCE(SUM(amount) / 3, 0) INTO v_avg_monthly_spend
    FROM public.expenses
    WHERE (p_branch_id IS NULL OR branch_id = p_branch_id) 
      AND category = p_category AND date >= CURRENT_DATE - INTERVAL '90 days';

    -- Fallback: if no history, use the last amount found
    IF v_avg_monthly_spend = 0 THEN
        SELECT COALESCE(amount, 0) INTO v_avg_monthly_spend
        FROM public.expenses
        WHERE (p_branch_id IS NULL OR branch_id = p_branch_id) 
          AND category = p_category
        ORDER BY date DESC LIMIT 1;
    END IF;

    RETURN QUERY SELECT 
        p_category,
        v_avg_monthly_spend,
        v_avg_monthly_spend * (1 - (p_reduction_pct / 100.0)),
        v_avg_monthly_spend * (p_reduction_pct / 100.0);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ==========================================
-- 6. JOB SCHEDULING (pg_cron)
-- ==========================================
-- Uncomment and run these if pg_cron is enabled

-- SELECT cron.schedule('margin_drift', '0 * * * *', 'SELECT detect_margin_drift()');
-- SELECT cron.schedule('idle_inventory', '0 */6 * * *', 'SELECT detect_idle_inventory_capital()');
-- SELECT cron.schedule('profit_deviation', '0 0 * * *', 'SELECT detect_profit_deviation()');

-- ========================================================================================
-- END OF SCRIPT
-- ========================================================================================
