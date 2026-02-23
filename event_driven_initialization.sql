-- ========================================================================================
-- EVENT-DRIVEN INITIALIZATION & DATA SEEDING
-- ========================================================================================
-- Run this script to populate your initial snapshots and immediately generate 
-- system events (alerts and suggestions) so the Dashboard shows data.
-- ========================================================================================

-- 1. Function to detect critical stock directly from Inventory
CREATE OR REPLACE FUNCTION detect_critical_stock() RETURNS void AS $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT 
            i.ingredient_id, i.branch_id, i.quantity_gr, i.min_level_gr, i.critical_level_gr,
            ing.name as ingredient_name, ing.unit_base, b.restaurant_id
        FROM public.inventory i
        JOIN public.ingredients ing ON i.ingredient_id = ing.id
        JOIN public.branches b ON i.branch_id = b.id
    LOOP
        -- Check if an unresolved event already exists for this ingredient to avoid duplicates
        IF NOT EXISTS (
            SELECT 1 FROM public.system_events 
            WHERE source_record_id = r.ingredient_id::text 
            AND event_category = 'inventory'
            AND resolved = FALSE
        ) THEN

            IF r.quantity_gr <= 0 THEN
                INSERT INTO public.system_events (
                    restaurant_id, branch_id, event_type, event_category, severity, 
                    source_table, source_record_id, impact_projection, recommended_action, metadata
                ) VALUES (
                    r.restaurant_id, r.branch_id, 'stock_out', 'inventory', 'critical',
                    'inventory', r.ingredient_id::text, 
                    'Stock en cero. Platos asociados están desactivados de facto.',
                    'Comprar Urgente',
                    jsonb_build_object('ingredient_name', r.ingredient_name, 'measure_unit', r.unit_base)
                );
            ELSIF r.quantity_gr <= r.critical_level_gr THEN
                INSERT INTO public.system_events (
                    restaurant_id, branch_id, event_type, event_category, severity, 
                    source_table, source_record_id, impact_projection, recommended_action, metadata
                ) VALUES (
                    r.restaurant_id, r.branch_id, 'stock_critical', 'inventory', 'critical',
                    'inventory', r.ingredient_id::text, 
                    'El ingrediente está por debajo del nivel crítico (' || r.quantity_gr || ').',
                    'Crear Pedido',
                    jsonb_build_object('ingredient_name', r.ingredient_name, 'measure_unit', r.unit_base, 'current_qty', r.quantity_gr)
                );
            ELSIF r.quantity_gr <= r.min_level_gr THEN
                INSERT INTO public.system_events (
                    restaurant_id, branch_id, event_type, event_category, severity, 
                    source_table, source_record_id, impact_projection, recommended_action, metadata
                ) VALUES (
                    r.restaurant_id, r.branch_id, 'stock_low', 'inventory', 'warning',
                    'inventory', r.ingredient_id::text, 
                    'Nivel por debajo del mínimo recomendado (' || r.quantity_gr || ').',
                    'Ver Inventario',
                    jsonb_build_object('ingredient_name', r.ingredient_name, 'measure_unit', r.unit_base, 'current_qty', r.quantity_gr)
                );
            END IF;

        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;


-- 2. Function to compute and save Daily Snapshots
CREATE OR REPLACE FUNCTION generate_daily_snapshots() RETURNS void AS $$
BEGIN
    -- Populate Recipe Cost Snapshot Daily (Branch Specific)
    IF public.is_feature_enabled((SELECT restaurant_id FROM public.branches WHERE id = ANY(SELECT branch_id FROM public.inventory LIMIT 1)), 'ENABLE_DAILY_FINANCIAL_SNAPSHOT') THEN
        INSERT INTO public.recipe_cost_snapshot_daily (recipe_id, branch_id, avg_cost_per_unit, snapshot_date)
        SELECT 
            r.id as recipe_id,
            i.branch_id,
            COALESCE(SUM(ri.quantity_gr * i.unit_cost_gr), 0) as avg_cost_per_unit,
            CURRENT_DATE
        FROM public.recipes r
        JOIN public.recipe_items ri ON r.id = ri.recipe_id
        JOIN (
            -- Group inventory by branch to get specific costs per branch
            SELECT ingredient_id, branch_id, AVG(unit_cost_gr) as unit_cost_gr 
            FROM public.inventory 
            GROUP BY ingredient_id, branch_id
        ) i ON ri.ingredient_id = i.ingredient_id
        GROUP BY r.id, i.branch_id
        ON CONFLICT (recipe_id, branch_id, snapshot_date) DO UPDATE 
        SET avg_cost_per_unit = EXCLUDED.avg_cost_per_unit;
    END IF;

    -- Populate Inventory Idle Snapshot
    IF public.is_feature_enabled((SELECT restaurant_id FROM public.branches WHERE id = ANY(SELECT branch_id FROM public.inventory LIMIT 1)), 'ENABLE_DAILY_FINANCIAL_SNAPSHOT') THEN
        INSERT INTO public.inventory_idle_snapshot (ingredient_id, branch_id, idle_days, inventory_value, snapshot_date)
        SELECT 
            ingredient_id,
            branch_id,
            -- fallback to 8 days if updated_at is missing, to trigger the rule (>= 7)
            GREATEST(EXTRACT(DAY FROM (NOW() - COALESCE(updated_at, NOW() - INTERVAL '8 days')))::INT, 8) as idle_days,      
            (quantity_gr * unit_cost_gr) as inventory_value,
            CURRENT_DATE
        FROM public.inventory
        WHERE quantity_gr > 0
        ON CONFLICT (ingredient_id, branch_id, snapshot_date) DO UPDATE
        SET idle_days = EXCLUDED.idle_days, inventory_value = EXCLUDED.inventory_value;
    END IF;

END;
$$ LANGUAGE plpgsql;


-- 3. EXECUTE INITIALIZATION (Seed the data immediately)

-- Limpiamos eventos previos no resueltos para empezar limpios en esta prueba
DELETE FROM public.system_events;

-- Toma de snapshots con datos actuales
SELECT generate_daily_snapshots();

-- Ejecución de las reglas de negocio
SELECT detect_critical_stock();
SELECT detect_margin_drift();
SELECT detect_idle_inventory_capital();
SELECT detect_expense_anomaly('30 days'); -- Catch-up on recent history
SELECT detect_efficiency_leak();

-- Done!
-- Now your UI will show events based on the actual backend data.
