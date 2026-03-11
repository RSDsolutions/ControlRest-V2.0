-- ==========================================
-- FIX PURCHASE ORDERS RLS POLICIES
-- ==========================================

-- 1. Fix purchase_orders policy for authenticated users
-- The existing Multi-tenant isolation policy:
-- (branch_id IN ( SELECT branches.id FROM branches WHERE branches.restaurant_id = get_user_restaurant_id()))
-- Only allowed SELECT, but we need INSERT as well. We'll add a specific INSERT policy just in case.
DROP POLICY IF EXISTS "Enable insert for authenticated" ON public.purchase_orders;

CREATE POLICY "Enable insert for authenticated" ON public.purchase_orders
FOR INSERT TO authenticated
WITH CHECK (
  branch_id IN (
    SELECT branches.id
    FROM branches
    WHERE branches.restaurant_id = get_user_restaurant_id()
  )
);

-- Ensure a general SELECT/UPDATE exists for authenticated users matching tenant.
-- Recreate the "Multi-tenant isolation" if it doesn't already cover ALL.
-- According to previous checks, it covers ALL but lacks "WITH CHECK". We'll force recreate it with WITH CHECK.
DROP POLICY IF EXISTS "Multi-tenant isolation" ON public.purchase_orders;
CREATE POLICY "Multi-tenant isolation" ON public.purchase_orders
FOR ALL TO authenticated
USING (
  branch_id IN (
    SELECT branches.id
    FROM branches
    WHERE branches.restaurant_id = get_user_restaurant_id()
  )
)
WITH CHECK (
  branch_id IN (
    SELECT branches.id
    FROM branches
    WHERE branches.restaurant_id = get_user_restaurant_id()
  )
);

-- 2. Fix purchase_order_items policy for authenticated users
-- It currently ONLY has Superadmin Access policy.
-- So we add the corresponding Multi-tenant isolation policy.
DROP POLICY IF EXISTS "Multi-tenant isolation" ON public.purchase_order_items;

CREATE POLICY "Multi-tenant isolation" ON public.purchase_order_items
FOR ALL TO authenticated
USING (
  purchase_order_id IN (
    SELECT id FROM public.purchase_orders
    WHERE branch_id IN (
      SELECT branches.id
      FROM branches
      WHERE branches.restaurant_id = get_user_restaurant_id()
    )
  )
)
WITH CHECK (
  purchase_order_id IN (
    SELECT id FROM public.purchase_orders
    WHERE branch_id IN (
      SELECT branches.id
      FROM branches
      WHERE branches.restaurant_id = get_user_restaurant_id()
    )
  )
);
