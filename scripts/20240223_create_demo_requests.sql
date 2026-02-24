-- Create demo_requests table for commercial leads
CREATE TABLE IF NOT EXISTS public.demo_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_name TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    city TEXT NOT NULL,
    number_of_branches TEXT NOT NULL,
    monthly_sales_range TEXT NOT NULL,
    current_control_method TEXT NOT NULL,
    has_inventory_control BOOLEAN DEFAULT FALSE,
    has_recipe_costing BOOLEAN DEFAULT FALSE,
    uses_pos BOOLEAN DEFAULT FALSE,
    main_problem TEXT,
    requested_plan_interest TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'demo_scheduled', 'closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.demo_requests ENABLE ROW LEVEL SECURITY;

-- Allow public anonymous inserts
CREATE POLICY "Enable insert for everyone" ON public.demo_requests
    FOR INSERT 
    WITH CHECK (true);

-- Allow authenticated admins to read/view leads
CREATE POLICY "Enable read for admins" ON public.demo_requests
    FOR SELECT
    USING (auth.role() = 'authenticated');
