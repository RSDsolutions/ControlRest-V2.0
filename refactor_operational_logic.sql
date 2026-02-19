
-- REFACTOR: Operational Logic
-- 1. Modify create_order_atomic (Remove deduction, keep check)
-- 2. Create start_preparation_atomic (Add deduction, update status)

-- =================================================================
-- 1. MODIFY create_order_atomic
-- =================================================================
CREATE OR REPLACE FUNCTION public.create_order_atomic(
    p_branch_id uuid,
    p_table_id uuid,
    p_waiter_id uuid,
    p_total numeric,
    p_items jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_order_id uuid;
    v_item jsonb;
    v_recipe_id uuid;
    v_quantity int;
    v_notes text;
    v_unit_price numeric;
    v_recipe_item record;
    v_ingredient_id uuid;
    v_required_qty numeric;
    v_current_stock numeric;
BEGIN
    IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'No items in order';
    END IF;

    -- 1. Create Order Header
    INSERT INTO public.orders (
        branch_id, table_id, waiter_id, status, total, created_at
    ) VALUES (
        p_branch_id, p_table_id, p_waiter_id, 'open', p_total, now()
    ) RETURNING id INTO v_order_id;

    -- 2. Process Items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_recipe_id := (v_item->>'recipe_id')::uuid;
        v_quantity := (v_item->>'quantity')::int;
        v_notes := v_item->>'notes';
        v_unit_price := (v_item->>'unit_price')::numeric;

        INSERT INTO public.order_items (
            order_id, recipe_id, quantity, notes, unit_price
        ) VALUES (
            v_order_id, v_recipe_id, v_quantity, v_notes, v_unit_price
        );

        -- 3. Inventory CHECK (Best Effort)
        FOR v_recipe_item IN 
            SELECT ingredient_id, quantity_gr 
            FROM public.recipe_items 
            WHERE recipe_id = v_recipe_id
        LOOP
            v_ingredient_id := v_recipe_item.ingredient_id;
            v_required_qty := v_recipe_item.quantity_gr * v_quantity;

            SELECT quantity_gr INTO v_current_stock
            FROM public.inventory
            WHERE branch_id = p_branch_id AND ingredient_id = v_ingredient_id;

            IF v_current_stock IS NULL OR v_current_stock < v_required_qty THEN
                -- Warn but allow? Or Block? 
                -- User wants "gasto" (expense) confirmed by kitchen. 
                -- But usually you shouldn't sell if out of stock. 
                -- I'll keep the BLOCK to prevent selling non-existent items.
                RAISE EXCEPTION 'Stock insuficiente (Estimado) para ingrediente % (Req: %, Disp: %)', v_ingredient_id, v_required_qty, v_current_stock;
            END IF;
            
            -- REMOVED: UPDATE inventory ...
            -- REMOVED: INSERT INTO inventory_movements ...

        END LOOP;
    END LOOP;

    -- 4. Update Table Status
    UPDATE public.tables
    SET status = 'occupied'
    WHERE id = p_table_id; 

    RETURN jsonb_build_object('id', v_order_id, 'status', 'success');
EXCEPTION
    WHEN OTHERS THEN
        RAISE;
END;
$function$;

-- =================================================================
-- 2. CREATE start_preparation_atomic
-- =================================================================
CREATE OR REPLACE FUNCTION public.start_preparation_atomic(
    p_order_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_order record;
    v_item record;
    v_recipe_item record;
    v_ingredient_id uuid;
    v_required_qty numeric;
    v_current_stock numeric;
    v_inventory_id uuid;
BEGIN
    -- Get Order basic info
    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
    
    IF v_order.id IS NULL THEN
        RAISE EXCEPTION 'Order not found';
    END IF;

    IF v_order.status != 'open' AND v_order.status != 'pending' THEN
        -- Allow idempotency if already preparing?
        IF v_order.status = 'preparing' THEN
             RETURN jsonb_build_object('status', 'already_preparing');
        END IF;
        RAISE EXCEPTION 'Order is not in correct state to start preparation (Current: %)', v_order.status;
    END IF;

    -- Iterate Logic for Deduction
    -- Re-fetch items
    FOR v_item IN SELECT * FROM public.order_items WHERE order_id = p_order_id
    LOOP
        FOR v_recipe_item IN 
            SELECT ingredient_id, quantity_gr 
            FROM public.recipe_items 
            WHERE recipe_id = v_item.recipe_id
        LOOP
            v_ingredient_id := v_recipe_item.ingredient_id;
            v_required_qty := v_recipe_item.quantity_gr * v_item.quantity;

            -- LOCK ROWS
            SELECT id, quantity_gr INTO v_inventory_id, v_current_stock
            FROM public.inventory
            WHERE branch_id = v_order.branch_id AND ingredient_id = v_ingredient_id
            FOR UPDATE;

            IF v_current_stock < v_required_qty THEN
                RAISE EXCEPTION 'Stock Insuficiente en Cocina para ingrediente % (Disp: %, Req: %)', v_ingredient_id, v_current_stock, v_required_qty;
            END IF;

            -- DEDUCT
            UPDATE public.inventory
            SET quantity_gr = quantity_gr - v_required_qty
            WHERE id = v_inventory_id;

            -- LOG MOVEMENT
            INSERT INTO public.inventory_movements (
                inventory_id, order_id, ingredient_id, branch_id, quantity_change, type
            ) VALUES (
                v_inventory_id, p_order_id, v_ingredient_id, v_order.branch_id, -v_required_qty, 'sale'
            );
        END LOOP;
    END LOOP;

    -- UPDATE ORDER STATUS
    UPDATE public.orders
    SET status = 'preparing'
    WHERE id = p_order_id;

    RETURN jsonb_build_object('id', p_order_id, 'status', 'preparing');
EXCEPTION
    WHEN OTHERS THEN
        RAISE;
END;
$function$;
