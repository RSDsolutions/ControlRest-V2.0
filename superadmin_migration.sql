-- Superadmin Migration
-- Goal: Create superadmin user and global RLS policies

DO $$
DECLARE
  new_user_id UUID := gen_random_uuid();
  v_count INT;
BEGIN
  -- 1. Check if user already exists in auth
  SELECT count(*) INTO v_count FROM auth.users WHERE email = 'rsdsolutions.ec@gmail.com';
  
  IF v_count = 0 THEN
    -- Create User in Auth
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, role, aud, last_sign_in_at)
    VALUES (
      new_user_id,
      'rsdsolutions.ec@gmail.com',
      crypt('Rs2300282858@', gen_salt('bf')),
      now(),
      'authenticated',
      'authenticated',
      now()
    );
  END IF;

  -- 2. Create/Update User in Public
  INSERT INTO public.users (id, email, role, full_name, is_active, restaurant_id)
  SELECT id, email, 'superadmin', 'Global Admin', true, NULL
  FROM auth.users
  WHERE email = 'rsdsolutions.ec@gmail.com'
  ON CONFLICT (id) DO UPDATE SET role = 'superadmin', restaurant_id = NULL;
  
  -- If searched by email and ID changed, ensure public.users is updated
  UPDATE public.users SET role = 'superadmin', restaurant_id = NULL WHERE email = 'rsdsolutions.ec@gmail.com';

END $$;

-- 3. Add Global RLS Policies for Superadmin
-- We add these to every table that currently has restaurant/branch isolation

-- Function to check if current user is superadmin (for internal policy use)
CREATE OR REPLACE FUNCTION public.is_superadmin() 
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'superadmin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Apply policies to all major tables
-- Format: CREATE POLICY "Superadmin Access" ON "public"."table" FOR ALL TO authenticated USING (is_superadmin()) WITH CHECK (is_superadmin());

-- Restaurants
CREATE POLICY "Superadmin Access" ON "public"."restaurants" FOR ALL TO authenticated USING (is_superadmin()) WITH CHECK (is_superadmin());

-- Branches
CREATE POLICY "Superadmin Access" ON "public"."branches" FOR ALL TO authenticated USING (is_superadmin()) WITH CHECK (is_superadmin());

-- Users
CREATE POLICY "Superadmin Access" ON "public"."users" FOR ALL TO authenticated USING (is_superadmin()) WITH CHECK (is_superadmin());

-- Ingredients
CREATE POLICY "Superadmin Access" ON "public"."ingredients" FOR ALL TO authenticated USING (is_superadmin()) WITH CHECK (is_superadmin());

-- Recipes
CREATE POLICY "Superadmin Access" ON "public"."recipes" FOR ALL TO authenticated USING (is_superadmin()) WITH CHECK (is_superadmin());

-- Recipe Items
CREATE POLICY "Superadmin Access" ON "public"."recipe_items" FOR ALL TO authenticated USING (is_superadmin()) WITH CHECK (is_superadmin());

-- Inventory
CREATE POLICY "Superadmin Access" ON "public"."inventory" FOR ALL TO authenticated USING (is_superadmin()) WITH CHECK (is_superadmin());

-- Orders
CREATE POLICY "Superadmin Access" ON "public"."orders" FOR ALL TO authenticated USING (is_superadmin()) WITH CHECK (is_superadmin());

-- Order Items
CREATE POLICY "Superadmin Access" ON "public"."order_items" FOR ALL TO authenticated USING (is_superadmin()) WITH CHECK (is_superadmin());

-- Expenses
CREATE POLICY "Superadmin Access" ON "public"."expenses" FOR ALL TO authenticated USING (is_superadmin()) WITH CHECK (is_superadmin());

-- Waste Records
CREATE POLICY "Superadmin Access" ON "public"."waste_records" FOR ALL TO authenticated USING (is_superadmin()) WITH CHECK (is_superadmin());

-- Cash Sessions
CREATE POLICY "Superadmin Access" ON "public"."cash_sessions" FOR ALL TO authenticated USING (is_superadmin()) WITH CHECK (is_superadmin());

-- Supplier Invoices
CREATE POLICY "Superadmin Access" ON "public"."supplier_invoices" FOR ALL TO authenticated USING (is_superadmin()) WITH CHECK (is_superadmin());

-- Accounts Payable
CREATE POLICY "Superadmin Access" ON "public"."accounts_payable" FOR ALL TO authenticated USING (is_superadmin()) WITH CHECK (is_superadmin());

-- System Events
CREATE POLICY "Superadmin Access" ON "public"."system_events" FOR ALL TO authenticated USING (is_superadmin()) WITH CHECK (is_superadmin());

-- Daily branch snapshots
CREATE POLICY "Superadmin Access" ON "public"."daily_branch_financial_snapshots" FOR ALL TO authenticated USING (is_superadmin()) WITH CHECK (is_superadmin());

-- Accounting Period Locks
CREATE POLICY "Superadmin Access" ON "public"."accounting_period_locks" FOR ALL TO authenticated USING (is_superadmin()) WITH CHECK (is_superadmin());

-- Cashier Shifts
CREATE POLICY "Superadmin Access" ON "public"."cashier_shifts" FOR ALL TO authenticated USING (is_superadmin()) WITH CHECK (is_superadmin());

-- Suppliers
CREATE POLICY "Superadmin Access" ON "public"."suppliers" FOR ALL TO authenticated USING (is_superadmin()) WITH CHECK (is_superadmin());

-- Purchase Orders
CREATE POLICY "Superadmin Access" ON "public"."purchase_orders" FOR ALL TO authenticated USING (is_superadmin()) WITH CHECK (is_superadmin());

-- Purchase Order Items
CREATE POLICY "Superadmin Access" ON "public"."purchase_order_items" FOR ALL TO authenticated USING (is_superadmin()) WITH CHECK (is_superadmin());
