
-- Seeding Script for Ingredients, Inventory, and Recipes
-- User: robinsonsolorzano99@gmail.com
-- Restaurant ID: d58334f5-0edd-4ef5-a4ff-7f6b09e5b99b
-- Branch ID: 831f886c-fe37-4a83-8d48-becedfb05dee

DO $$
DECLARE
    v_restaurant_id uuid := 'd58334f5-0edd-4ef5-a4ff-7f6b09e5b99b';
    v_branch_id uuid := '831f886c-fe37-4a83-8d48-becedfb05dee';
    
    -- Ingredient IDs
    v_ing_carne uuid;
    v_ing_pollo uuid;
    v_ing_jamon uuid;
    v_ing_tocino uuid;
    v_ing_queso_cheddar uuid;
    v_ing_queso_mozzarella uuid;
    v_ing_pan_hamburguesa uuid;
    v_ing_pan_hotdog uuid;
    v_ing_arroz uuid;
    v_ing_papas uuid;
    v_ing_tomate uuid;
    v_ing_lechuga uuid;
    v_ing_cebolla uuid;
    v_ing_pepinillos uuid;
    v_ing_mayonesa uuid;
    v_ing_mostaza uuid;
    v_ing_ketchup uuid;
    v_ing_aceite uuid;
    v_ing_sal uuid;
    v_ing_pimienta uuid;
    v_ing_harina uuid;
    v_ing_huevo uuid;
    v_ing_mantequilla uuid;
    v_ing_salsa_bbq uuid;
    v_ing_salsa_picante uuid;

    -- Recipe IDs
    v_rec_hamburguesa_clasica uuid;
    v_rec_hamburguesa_bbq uuid;
    v_rec_hotdog uuid;
    v_rec_papas_fritas uuid;
    v_rec_pollo_arroz uuid;
    v_rec_arroz_pollo uuid;
    v_rec_nuggets uuid;
    v_rec_sandwich_mixto uuid;
    v_rec_papas_queso uuid;
    v_rec_hamburguesa_doble uuid;

BEGIN
    -- =================================================================
    -- 1. INSERT INGREDIENTS & INVENTORY
    -- =================================================================

    -- Helper function to insert ingredient and inventory
    -- Note: We are doing this inline for complexity reasons in DO block

    -- Carne Molida
    INSERT INTO public.ingredients (restaurant_id, name, category, unit_base, icon)
    VALUES (v_restaurant_id, 'Carne Molida', 'Proteinas', 'gr', '🥩')
    RETURNING id INTO v_ing_carne;
    
    INSERT INTO public.inventory (branch_id, ingredient_id, quantity_gr, unit_cost_gr, min_level_gr)
    VALUES (v_branch_id, v_ing_carne, 5000, 0.02, 1000);

    -- Pollo
    INSERT INTO public.ingredients (restaurant_id, name, category, unit_base, icon)
    VALUES (v_restaurant_id, 'Pollo', 'Proteinas', 'gr', '🍗')
    RETURNING id INTO v_ing_pollo;
    
    INSERT INTO public.inventory (branch_id, ingredient_id, quantity_gr, unit_cost_gr, min_level_gr)
    VALUES (v_branch_id, v_ing_pollo, 5000, 0.015, 1000);

    -- Jamón
    INSERT INTO public.ingredients (restaurant_id, name, category, unit_base, icon)
    VALUES (v_restaurant_id, 'Jamón', 'Proteinas', 'gr', '🥓')
    RETURNING id INTO v_ing_jamon;
    
    INSERT INTO public.inventory (branch_id, ingredient_id, quantity_gr, unit_cost_gr, min_level_gr)
    VALUES (v_branch_id, v_ing_jamon, 3000, 0.025, 500);

    -- Tocino
    INSERT INTO public.ingredients (restaurant_id, name, category, unit_base, icon)
    VALUES (v_restaurant_id, 'Tocino', 'Proteinas', 'gr', '🥓')
    RETURNING id INTO v_ing_tocino;
    
    INSERT INTO public.inventory (branch_id, ingredient_id, quantity_gr, unit_cost_gr, min_level_gr)
    VALUES (v_branch_id, v_ing_tocino, 2000, 0.03, 500);

    -- Queso Cheddar
    INSERT INTO public.ingredients (restaurant_id, name, category, unit_base, icon)
    VALUES (v_restaurant_id, 'Queso Cheddar', 'Lacteos', 'gr', '🧀')
    RETURNING id INTO v_ing_queso_cheddar;
    
    INSERT INTO public.inventory (branch_id, ingredient_id, quantity_gr, unit_cost_gr, min_level_gr)
    VALUES (v_branch_id, v_ing_queso_cheddar, 2000, 0.02, 500);

    -- Queso Mozzarella
    INSERT INTO public.ingredients (restaurant_id, name, category, unit_base, icon)
    VALUES (v_restaurant_id, 'Queso Mozzarella', 'Lacteos', 'gr', '🧀')
    RETURNING id INTO v_ing_queso_mozzarella;
    
    INSERT INTO public.inventory (branch_id, ingredient_id, quantity_gr, unit_cost_gr, min_level_gr)
    VALUES (v_branch_id, v_ing_queso_mozzarella, 2000, 0.022, 500);

    -- Pan Hamburguesa
    INSERT INTO public.ingredients (restaurant_id, name, category, unit_base, icon)
    VALUES (v_restaurant_id, 'Pan Hamburguesa', 'Panaderia', 'un', '🍔')
    RETURNING id INTO v_ing_pan_hamburguesa;
    -- Note: storing units as quantity directly (assuming 1 un = 1 gr representation or logic handles it, user said '1 unidad')
    -- Usually unit_base='un' implies quantity is count.
    INSERT INTO public.inventory (branch_id, ingredient_id, quantity_gr, unit_cost_gr, min_level_gr)
    VALUES (v_branch_id, v_ing_pan_hamburguesa, 100, 0.50, 20); 

    -- Pan Hotdog
    INSERT INTO public.ingredients (restaurant_id, name, category, unit_base, icon)
    VALUES (v_restaurant_id, 'Pan Hotdog', 'Panaderia', 'un', '🌭')
    RETURNING id INTO v_ing_pan_hotdog;
    
    INSERT INTO public.inventory (branch_id, ingredient_id, quantity_gr, unit_cost_gr, min_level_gr)
    VALUES (v_branch_id, v_ing_pan_hotdog, 100, 0.40, 20);

    -- Arroz
    INSERT INTO public.ingredients (restaurant_id, name, category, unit_base, icon)
    VALUES (v_restaurant_id, 'Arroz', 'Granos', 'gr', '🍚')
    RETURNING id INTO v_ing_arroz;
    
    INSERT INTO public.inventory (branch_id, ingredient_id, quantity_gr, unit_cost_gr, min_level_gr)
    VALUES (v_branch_id, v_ing_arroz, 10000, 0.005, 2000);

    -- Papas
    INSERT INTO public.ingredients (restaurant_id, name, category, unit_base, icon)
    VALUES (v_restaurant_id, 'Papas', 'Verduras', 'gr', '🥔')
    RETURNING id INTO v_ing_papas;
    
    INSERT INTO public.inventory (branch_id, ingredient_id, quantity_gr, unit_cost_gr, min_level_gr)
    VALUES (v_branch_id, v_ing_papas, 8000, 0.008, 2000);

    -- Tomate
    INSERT INTO public.ingredients (restaurant_id, name, category, unit_base, icon)
    VALUES (v_restaurant_id, 'Tomate', 'Verduras', 'gr', '🍅')
    RETURNING id INTO v_ing_tomate;
    
    INSERT INTO public.inventory (branch_id, ingredient_id, quantity_gr, unit_cost_gr, min_level_gr)
    VALUES (v_branch_id, v_ing_tomate, 3000, 0.01, 500);

    -- Lechuga
    INSERT INTO public.ingredients (restaurant_id, name, category, unit_base, icon)
    VALUES (v_restaurant_id, 'Lechuga', 'Verduras', 'gr', '🥬')
    RETURNING id INTO v_ing_lechuga;
    
    INSERT INTO public.inventory (branch_id, ingredient_id, quantity_gr, unit_cost_gr, min_level_gr)
    VALUES (v_branch_id, v_ing_lechuga, 2000, 0.01, 500);

    -- Cebolla
    INSERT INTO public.ingredients (restaurant_id, name, category, unit_base, icon)
    VALUES (v_restaurant_id, 'Cebolla', 'Verduras', 'gr', '🧅')
    RETURNING id INTO v_ing_cebolla;
    
    INSERT INTO public.inventory (branch_id, ingredient_id, quantity_gr, unit_cost_gr, min_level_gr)
    VALUES (v_branch_id, v_ing_cebolla, 3000, 0.008, 500);

    -- Pepinillos
    INSERT INTO public.ingredients (restaurant_id, name, category, unit_base, icon)
    VALUES (v_restaurant_id, 'Pepinillos', 'Verduras', 'gr', '🥒')
    RETURNING id INTO v_ing_pepinillos;
    
    INSERT INTO public.inventory (branch_id, ingredient_id, quantity_gr, unit_cost_gr, min_level_gr)
    VALUES (v_branch_id, v_ing_pepinillos, 1000, 0.02, 200);

    -- Mayonesa
    INSERT INTO public.ingredients (restaurant_id, name, category, unit_base, icon)
    VALUES (v_restaurant_id, 'Mayonesa', 'Salsas', 'ml', '🥛')
    RETURNING id INTO v_ing_mayonesa;
    
    INSERT INTO public.inventory (branch_id, ingredient_id, quantity_gr, unit_cost_gr, min_level_gr)
    VALUES (v_branch_id, v_ing_mayonesa, 2000, 0.01, 500);

    -- Mostaza
    INSERT INTO public.ingredients (restaurant_id, name, category, unit_base, icon)
    VALUES (v_restaurant_id, 'Mostaza', 'Salsas', 'ml', '🌭')
    RETURNING id INTO v_ing_mostaza;
    
    INSERT INTO public.inventory (branch_id, ingredient_id, quantity_gr, unit_cost_gr, min_level_gr)
    VALUES (v_branch_id, v_ing_mostaza, 1500, 0.01, 500);

    -- Ketchup
    INSERT INTO public.ingredients (restaurant_id, name, category, unit_base, icon)
    VALUES (v_restaurant_id, 'Ketchup', 'Salsas', 'ml', '🍅')
    RETURNING id INTO v_ing_ketchup;
    
    INSERT INTO public.inventory (branch_id, ingredient_id, quantity_gr, unit_cost_gr, min_level_gr)
    VALUES (v_branch_id, v_ing_ketchup, 2000, 0.01, 500);

    -- Aceite
    INSERT INTO public.ingredients (restaurant_id, name, category, unit_base, icon)
    VALUES (v_restaurant_id, 'Aceite', 'Insumos', 'ml', '🌻')
    RETURNING id INTO v_ing_aceite;
    
    INSERT INTO public.inventory (branch_id, ingredient_id, quantity_gr, unit_cost_gr, min_level_gr)
    VALUES (v_branch_id, v_ing_aceite, 5000, 0.005, 1000);

    -- Sal
    INSERT INTO public.ingredients (restaurant_id, name, category, unit_base, icon)
    VALUES (v_restaurant_id, 'Sal', 'Especias', 'gr', '🧂')
    RETURNING id INTO v_ing_sal;
    
    INSERT INTO public.inventory (branch_id, ingredient_id, quantity_gr, unit_cost_gr, min_level_gr)
    VALUES (v_branch_id, v_ing_sal, 2000, 0.001, 500);

    -- Pimienta
    INSERT INTO public.ingredients (restaurant_id, name, category, unit_base, icon)
    VALUES (v_restaurant_id, 'Pimienta', 'Especias', 'gr', '🧂')
    RETURNING id INTO v_ing_pimienta;
    
    INSERT INTO public.inventory (branch_id, ingredient_id, quantity_gr, unit_cost_gr, min_level_gr)
    VALUES (v_branch_id, v_ing_pimienta, 1000, 0.005, 200);

    -- Harina
    INSERT INTO public.ingredients (restaurant_id, name, category, unit_base, icon)
    VALUES (v_restaurant_id, 'Harina', 'Insumos', 'gr', '🌾')
    RETURNING id INTO v_ing_harina;
    
    INSERT INTO public.inventory (branch_id, ingredient_id, quantity_gr, unit_cost_gr, min_level_gr)
    VALUES (v_branch_id, v_ing_harina, 3000, 0.002, 500);

    -- Huevo
    INSERT INTO public.ingredients (restaurant_id, name, category, unit_base, icon)
    VALUES (v_restaurant_id, 'Huevo', 'Proteinas', 'un', '🥚')
    RETURNING id INTO v_ing_huevo;
    
    INSERT INTO public.inventory (branch_id, ingredient_id, quantity_gr, unit_cost_gr, min_level_gr)
    VALUES (v_branch_id, v_ing_huevo, 200, 0.15, 20);

    -- Mantequilla
    INSERT INTO public.ingredients (restaurant_id, name, category, unit_base, icon)
    VALUES (v_restaurant_id, 'Mantequilla', 'Lacteos', 'gr', '🧈')
    RETURNING id INTO v_ing_mantequilla;
    
    INSERT INTO public.inventory (branch_id, ingredient_id, quantity_gr, unit_cost_gr, min_level_gr)
    VALUES (v_branch_id, v_ing_mantequilla, 1500, 0.015, 300);

    -- Salsa BBQ
    INSERT INTO public.ingredients (restaurant_id, name, category, unit_base, icon)
    VALUES (v_restaurant_id, 'Salsa BBQ', 'Salsas', 'ml', '🍖')
    RETURNING id INTO v_ing_salsa_bbq;
    
    INSERT INTO public.inventory (branch_id, ingredient_id, quantity_gr, unit_cost_gr, min_level_gr)
    VALUES (v_branch_id, v_ing_salsa_bbq, 2000, 0.015, 500);

     -- Salsa Picante
    INSERT INTO public.ingredients (restaurant_id, name, category, unit_base, icon)
    VALUES (v_restaurant_id, 'Salsa Picante', 'Salsas', 'ml', '🌶️')
    RETURNING id INTO v_ing_salsa_picante;
    
    INSERT INTO public.inventory (branch_id, ingredient_id, quantity_gr, unit_cost_gr, min_level_gr)
    VALUES (v_branch_id, v_ing_salsa_picante, 1000, 0.02, 200);


    -- =================================================================
    -- 2. INSERT RECIPES & RECIPE ITEMS
    -- =================================================================

    -- Hamburguesa Clásica ($5.00)
    INSERT INTO public.recipes (restaurant_id, name, selling_price, category, is_active)
    VALUES (v_restaurant_id, 'Hamburguesa Clásica', 5.00, 'Hamburguesas', true)
    RETURNING id INTO v_rec_hamburguesa_clasica;

        INSERT INTO public.recipe_items (recipe_id, ingredient_id, quantity_gr) VALUES (v_rec_hamburguesa_clasica, v_ing_carne, 150);
        INSERT INTO public.recipe_items (recipe_id, ingredient_id, quantity_gr) VALUES (v_rec_hamburguesa_clasica, v_ing_pan_hamburguesa, 1);
        INSERT INTO public.recipe_items (recipe_id, ingredient_id, quantity_gr) VALUES (v_rec_hamburguesa_clasica, v_ing_queso_cheddar, 20);
        INSERT INTO public.recipe_items (recipe_id, ingredient_id, quantity_gr) VALUES (v_rec_hamburguesa_clasica, v_ing_tomate, 30);
        INSERT INTO public.recipe_items (recipe_id, ingredient_id, quantity_gr) VALUES (v_rec_hamburguesa_clasica, v_ing_lechuga, 20);

    -- Hamburguesa BBQ ($6.50)
    INSERT INTO public.recipes (restaurant_id, name, selling_price, category, is_active)
    VALUES (v_restaurant_id, 'Hamburguesa BBQ', 6.50, 'Hamburguesas', true)
    RETURNING id INTO v_rec_hamburguesa_bbq;

        INSERT INTO public.recipe_items (recipe_id, ingredient_id, quantity_gr) VALUES (v_rec_hamburguesa_bbq, v_ing_carne, 150);
        INSERT INTO public.recipe_items (recipe_id, ingredient_id, quantity_gr) VALUES (v_rec_hamburguesa_bbq, v_ing_tocino, 30);
        INSERT INTO public.recipe_items (recipe_id, ingredient_id, quantity_gr) VALUES (v_rec_hamburguesa_bbq, v_ing_queso_cheddar, 20);
        INSERT INTO public.recipe_items (recipe_id, ingredient_id, quantity_gr) VALUES (v_rec_hamburguesa_bbq, v_ing_salsa_bbq, 15);
        INSERT INTO public.recipe_items (recipe_id, ingredient_id, quantity_gr) VALUES (v_rec_hamburguesa_bbq, v_ing_pan_hamburguesa, 1);

    -- Hot Dog ($3.50)
    INSERT INTO public.recipes (restaurant_id, name, selling_price, category, is_active)
    VALUES (v_restaurant_id, 'Hot Dog', 3.50, 'Comida Rápida', true)
    RETURNING id INTO v_rec_hotdog;

        INSERT INTO public.recipe_items (recipe_id, ingredient_id, quantity_gr) VALUES (v_rec_hotdog, v_ing_jamon, 80); -- Using jamon as substitute for sausage as per prompt
        INSERT INTO public.recipe_items (recipe_id, ingredient_id, quantity_gr) VALUES (v_rec_hotdog, v_ing_pan_hotdog, 1);
        INSERT INTO public.recipe_items (recipe_id, ingredient_id, quantity_gr) VALUES (v_rec_hotdog, v_ing_mostaza, 10);

    -- Papas Fritas ($2.50)
    INSERT INTO public.recipes (restaurant_id, name, selling_price, category, is_active)
    VALUES (v_restaurant_id, 'Papas Fritas', 2.50, 'Acompañantes', true)
    RETURNING id INTO v_rec_papas_fritas;

        INSERT INTO public.recipe_items (recipe_id, ingredient_id, quantity_gr) VALUES (v_rec_papas_fritas, v_ing_papas, 200);
        INSERT INTO public.recipe_items (recipe_id, ingredient_id, quantity_gr) VALUES (v_rec_papas_fritas, v_ing_aceite, 20);
        INSERT INTO public.recipe_items (recipe_id, ingredient_id, quantity_gr) VALUES (v_rec_papas_fritas, v_ing_sal, 5);

    -- Pollo con Arroz ($5.50)
    INSERT INTO public.recipes (restaurant_id, name, selling_price, category, is_active)
    VALUES (v_restaurant_id, 'Pollo con Arroz', 5.50, 'Platos Fuertes', true)
    RETURNING id INTO v_rec_pollo_arroz;

        INSERT INTO public.recipe_items (recipe_id, ingredient_id, quantity_gr) VALUES (v_rec_pollo_arroz, v_ing_pollo, 200);
        INSERT INTO public.recipe_items (recipe_id, ingredient_id, quantity_gr) VALUES (v_rec_pollo_arroz, v_ing_arroz, 150);
        INSERT INTO public.recipe_items (recipe_id, ingredient_id, quantity_gr) VALUES (v_rec_pollo_arroz, v_ing_aceite, 10);

    -- Arroz con Pollo ($7.00)
    INSERT INTO public.recipes (restaurant_id, name, selling_price, category, is_active)
    VALUES (v_restaurant_id, 'Arroz con Pollo', 7.00, 'Platos Fuertes', true)
    RETURNING id INTO v_rec_arroz_pollo;

        INSERT INTO public.recipe_items (recipe_id, ingredient_id, quantity_gr) VALUES (v_rec_arroz_pollo, v_ing_pollo, 150);
        INSERT INTO public.recipe_items (recipe_id, ingredient_id, quantity_gr) VALUES (v_rec_arroz_pollo, v_ing_arroz, 200);
        INSERT INTO public.recipe_items (recipe_id, ingredient_id, quantity_gr) VALUES (v_rec_arroz_pollo, v_ing_cebolla, 20);

    -- Nuggets ($4.00)
    INSERT INTO public.recipes (restaurant_id, name, selling_price, category, is_active)
    VALUES (v_restaurant_id, 'Nuggets de Pollo', 4.00, 'Entradas', true)
    RETURNING id INTO v_rec_nuggets;

        INSERT INTO public.recipe_items (recipe_id, ingredient_id, quantity_gr) VALUES (v_rec_nuggets, v_ing_pollo, 100);
        INSERT INTO public.recipe_items (recipe_id, ingredient_id, quantity_gr) VALUES (v_rec_nuggets, v_ing_harina, 20);
        INSERT INTO public.recipe_items (recipe_id, ingredient_id, quantity_gr) VALUES (v_rec_nuggets, v_ing_huevo, 30); -- approx half egg

    -- Sandwich Mixto ($3.00)
    INSERT INTO public.recipes (restaurant_id, name, selling_price, category, is_active)
    VALUES (v_restaurant_id, 'Sandwich Mixto', 3.00, 'Comida Rápida', true)
    RETURNING id INTO v_rec_sandwich_mixto;

        INSERT INTO public.recipe_items (recipe_id, ingredient_id, quantity_gr) VALUES (v_rec_sandwich_mixto, v_ing_jamon, 60);
        INSERT INTO public.recipe_items (recipe_id, ingredient_id, quantity_gr) VALUES (v_rec_sandwich_mixto, v_ing_queso_mozzarella, 30);
        INSERT INTO public.recipe_items (recipe_id, ingredient_id, quantity_gr) VALUES (v_rec_sandwich_mixto, v_ing_pan_hamburguesa, 1); -- Subbing burger bun

    -- Papas con Queso ($4.00)
    INSERT INTO public.recipes (restaurant_id, name, selling_price, category, is_active)
    VALUES (v_restaurant_id, 'Papas con Queso', 4.00, 'Acompañantes', true)
    RETURNING id INTO v_rec_papas_queso;

        INSERT INTO public.recipe_items (recipe_id, ingredient_id, quantity_gr) VALUES (v_rec_papas_queso, v_ing_papas, 200);
        INSERT INTO public.recipe_items (recipe_id, ingredient_id, quantity_gr) VALUES (v_rec_papas_queso, v_ing_queso_cheddar, 50);

    -- Hamburguesa Doble ($8.00)
    INSERT INTO public.recipes (restaurant_id, name, selling_price, category, is_active)
    VALUES (v_restaurant_id, 'Hamburguesa Doble', 8.00, 'Hamburguesas', true)
    RETURNING id INTO v_rec_hamburguesa_doble;

        INSERT INTO public.recipe_items (recipe_id, ingredient_id, quantity_gr) VALUES (v_rec_hamburguesa_doble, v_ing_carne, 300);
        INSERT INTO public.recipe_items (recipe_id, ingredient_id, quantity_gr) VALUES (v_rec_hamburguesa_doble, v_ing_pan_hamburguesa, 1);
        INSERT INTO public.recipe_items (recipe_id, ingredient_id, quantity_gr) VALUES (v_rec_hamburguesa_doble, v_ing_queso_cheddar, 40);

END $$;
