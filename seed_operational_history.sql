
-- Seeding Operational History
-- User: robinsonsolorzano99@gmail.com
-- Restaurant ID: d58334f5-0edd-4ef5-a4ff-7f6b09e5b99b
-- Branch ID: 831f886c-fe37-4a83-8d48-becedfb05dee

DO $$
DECLARE
    v_restaurant_id uuid := 'd58334f5-0edd-4ef5-a4ff-7f6b09e5b99b';
    v_branch_id uuid := '831f886c-fe37-4a83-8d48-becedfb05dee';
    v_waiter_id uuid := '61bf2470-b455-49de-9982-ec862e8a8491'; -- User 'test' (Role: Waiter)
    
    -- IDs for looping
    v_rec_id uuid;
    v_table_id uuid;
    v_ing_id uuid;
    v_purchase_id uuid;
    
    -- Variables for Purchases
    v_purchase_date timestamptz;
    v_qty numeric;
    v_cost numeric;
    
    -- Variables for Orders
    v_order_req jsonb;
    v_order_res jsonb;
    v_order_id uuid;
    v_order_date timestamptz;
    v_items jsonb;
    v_payment_method text;
    v_total numeric;
    v_table_list uuid[];
    v_recipe_list uuid[];
    v_ing_list uuid[];
    
    -- Variables for Expenses
    v_expense_cat text[];
    v_expense_date timestamptz;
    
    i int;
BEGIN
    -- Get Lists for random selection
    SELECT array_agg(id) INTO v_table_list FROM public.tables WHERE branch_id = v_branch_id;
    SELECT array_agg(id) INTO v_recipe_list FROM public.recipes WHERE restaurant_id = v_restaurant_id;
    SELECT array_agg(id) INTO v_ing_list FROM public.ingredients WHERE restaurant_id = v_restaurant_id;
    
    v_expense_cat := ARRAY['Sueldos', 'Alquiler', 'Luz', 'Agua', 'Gas', 'Internet', 'Limpieza', 'Mantenimiento', 'Publicidad', 'Insumos Oficina'];

    -- =================================================================
    -- 1. SIMULATE PURCHASES (Ensure EVERY ingredient gets stocked)
    -- =================================================================
    IF v_ing_list IS NOT NULL THEN
        FOREACH v_ing_id IN ARRAY v_ing_list LOOP
            
            -- Random date within last 30 days
            v_purchase_date := now() - (floor(random() * 30 + 1) || ' days')::interval;
            
            -- Random Quantity (Massive stock to prevent errors: 5000 - 15000)
            v_qty := floor(random() * 10000 + 5000);
            
            -- Random Cost ($10 - $100)
            v_cost := floor(random() * 90 + 10);
            
            -- Insert Purchase Header
            INSERT INTO public.purchases (branch_id, supplier, total_amount, created_at)
            VALUES (v_branch_id, 'Proveedor Simulado', v_cost, v_purchase_date)
            RETURNING id INTO v_purchase_id;
            
            -- Insert Purchase Item
            INSERT INTO public.purchase_items (purchase_id, ingredient_id, quantity_gr, total_cost)
            VALUES (v_purchase_id, v_ing_id, v_qty, v_cost);
            
            -- Update Inventory (Add Stock)
            UPDATE public.inventory
            SET quantity_gr = quantity_gr + v_qty
            WHERE branch_id = v_branch_id AND ingredient_id = v_ing_id;
            
            -- Log Movement (Purchase)
            INSERT INTO public.inventory_movements (inventory_id, ingredient_id, branch_id, quantity_change, type, created_at)
            SELECT id, v_ing_id, v_branch_id, v_qty, 'purchase', v_purchase_date
            FROM public.inventory WHERE branch_id = v_branch_id AND ingredient_id = v_ing_id;
            
        END LOOP;
    END IF;

    -- =================================================================
    -- 2. SIMULATE EXPENSES (12 records, last 30 days)
    -- =================================================================
    FOR i IN 1..12 LOOP
         -- Random date within last 30 days
        v_expense_date := now() - (floor(random() * 30 + 1) || ' days')::interval;
        
        INSERT INTO public.expenses (
            branch_id, 
            category, 
            description, 
            amount, 
            date, 
            created_at,
            type,
            payment_method
        )
        VALUES (
            v_branch_id,
            v_expense_cat[floor(random() * array_length(v_expense_cat, 1) + 1)],
            'Gasto Operativo Simulado',
            floor(random() * 200 + 20), -- $20 - $220
            v_expense_date::date, 
            v_expense_date,
            CASE WHEN random() > 0.5 THEN 'fixed' ELSE 'variable' END,
            CASE WHEN random() > 0.5 THEN 'Efectivo' ELSE 'Transferencia' END
        );
    END LOOP;

    -- =================================================================
    -- 3. SIMULATE ORDERS (40 records, last 15 days)
    -- =================================================================
    FOR i IN 1..40 LOOP
        BEGIN
            -- Random date within last 15 days
            v_order_date := now() - (floor(random() * 15 + 1) || ' days')::interval - (floor(random() * 12) || ' hours')::interval;
            
            -- Random Table
            v_table_id := v_table_list[floor(random() * array_length(v_table_list, 1) + 1)];
            
            -- Random Recipe (Single Item Order for simplicity, or small random qty)
            v_rec_id := v_recipe_list[floor(random() * array_length(v_recipe_list, 1) + 1)];
            
            -- Construct Items JSON
            v_items := jsonb_build_array(
                jsonb_build_object(
                    'recipe_id', v_rec_id,
                    'quantity', floor(random() * 2 + 1), -- Keep quantity low (1-2) to avoid draining stock too fast
                    'notes', 'Simulado',
                    'unit_price', (SELECT selling_price FROM public.recipes WHERE id = v_rec_id)
                )
            );
            
            -- Calculate Total
            SELECT sum((item->>'quantity')::int * (item->>'unit_price')::numeric) INTO v_total
            FROM jsonb_array_elements(v_items) as item;

            -- CALL RPC: create_order_atomic
            v_order_res := public.create_order_atomic(
                v_branch_id,
                v_table_id,
                v_waiter_id,
                v_total,
                v_items
            );
            
            v_order_id := (v_order_res->>'id')::uuid;
            
            -- Determine Payment Method (60% Cash / 40% Card)
            IF random() < 0.6 THEN
                v_payment_method := 'Efectivo';
            ELSE
                v_payment_method := 'Tarjeta';
            END IF;

            -- CALL RPC: close_order_with_payment
            PERFORM public.close_order_with_payment(
                ARRAY[v_order_id],
                v_payment_method,
                v_total
            );
            
            -- =============================================================
            -- BACKDATE TIMESTAMP FIX
            -- =============================================================
            -- Manually update the timestamps to make them historical
            UPDATE public.orders 
            SET created_at = v_order_date,
                paid_at = v_order_date + interval '45 minutes'
            WHERE id = v_order_id;
            
            -- Update the inventory movements for this order to match order date
            UPDATE public.inventory_movements
            SET created_at = v_order_date
            WHERE order_id = v_order_id;

        EXCEPTION WHEN OTHERS THEN
            -- If an order fails (e.g. out of stock), just ignore and continue
            -- This ensures the script finishes even if one random combo is invalid
            RAISE NOTICE 'Order creation failed: %', SQLERRM;
        END;

    END LOOP;
    
    -- Reset tables to available just in case (though close_order handles it)
    UPDATE public.tables SET status = 'available' WHERE branch_id = v_branch_id;

END $$;
