import React, { useState, useEffect, useRef } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import GlobalModeWarning from './components/GlobalModeWarning';
import { UserRole, Ingredient, Plate, Order, Table, Expense, User, WasteRecord } from './types';
import { INITIAL_INGREDIENTS, INITIAL_PLATES, INITIAL_TABLES } from './constants';
import { supabase } from './supabaseClient';

// Views
import LoginView from './views/LoginView';
import AdminDashboard from './views/AdminDashboard';
import IngredientsView from './views/IngredientsView';
import InventoryView from './views/InventoryView';
import PlatesView from './views/PlatesView';
import WaiterView from './views/WaiterView';
import CashierView from './views/CashierView';
import FinanceView from './views/FinanceView';
import ExpensesView from './views/ExpensesView';
import TablesView from './views/TablesView';
import OrdersHistoryView from './views/OrdersHistoryView';
import UserManagementView from './views/UserManagementView';
import AuditLogView from './views/AuditLogView';
import EnterpriseProfileView from './views/EnterpriseProfileView';
import KitchenView from './views/KitchenView';
import WasteView from './views/WasteView';
import KitchenRecipeView from './views/KitchenRecipeView';
import KitchenWasteView from './views/KitchenWasteView';

// Components
import Sidebar from './components/Sidebar';
import LockScreen from './components/LockScreen';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const isStaffLoginRef = useRef(false);
  const [ingredients, setIngredients] = useState<Ingredient[]>(INITIAL_INGREDIENTS);
  const [plates, setPlates] = useState<Plate[]>(INITIAL_PLATES);
  const [tables, setTables] = useState<Table[]>(INITIAL_TABLES);
  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [wasteRecords, setWasteRecords] = useState<WasteRecord[]>([]);
  const [branches, setBranches] = useState<any[]>([]); // Branch[]
  const [inventoryError, setInventoryError] = useState<string | null>(null);



  const [branchId, setBranchId] = useState<string | 'GLOBAL' | null>(null);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Helper for targeted single order fetch (needed for new orders with relations)
  // We use a delay to allow relational snapshot to become visible in Postgres (Race Condition fix)
  const fetchSingleOrder = async (orderId: string, isRetry = false) => {
    const controller = new AbortController();
    try {
      console.log(`[Realtime] Fetching details for order ${orderId} (Retry: ${isRetry})`);
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*), users:waiter_id(full_name)')
        .eq('id', orderId)
        .abortSignal(controller.signal)
        .single();

      if (error) throw error;
      if (data) {
        const formatted: Order = {
          id: data.id,
          tableId: data.table_id,
          items: (data.order_items || []).map((oi: any) => ({
            plateId: oi.recipe_id,
            qty: oi.quantity,
            notes: oi.notes || undefined,
          })),
          status: data.status,
          total: parseFloat(data.total || '0'),
          timestamp: new Date(data.created_at),
          waiterId: data.waiter_id,
          waiterName: data.users?.full_name || 'Sin Asignar',
          readyAt: data.ready_at,
          servedAt: data.served_at,
          servedBy: data.served_by,
          branchId: data.branch_id,
          optimistic: false
        };

        setOrders(prev => {
          const index = prev.findIndex(o => o.id === formatted.id);
          if (index !== -1) {
            return [
              ...prev.slice(0, index),
              formatted,
              ...prev.slice(index + 1)
            ];
          }
          return [formatted, ...prev];
        });
      }
    } catch (err) {
      console.error('[Realtime] Error fetching details for order:', orderId, err);
      // Optional: one-time retry if items came back empty (still in race condition)
    }
  };

  // Supabase Realtime: sync orders & tables across all sessions
  useEffect(() => {
    if (!branchId || !restaurantId) return;

    console.log('[Realtime] Initializing Channel for Branch:', branchId);
    const channel = supabase.channel(`branch-${branchId}`);

    const filterStr = branchId !== 'GLOBAL' ? `branch_id=eq.${branchId}` : undefined;

    channel
      // 1. ORDERS LISTENER
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: filterStr
      }, (payload) => {
        const eventType = payload.eventType;
        const newRecord = payload.new as any;
        const oldRecord = payload.old as any;

        console.log('[Realtime] 📦 Order Event:', eventType, newRecord?.id || oldRecord?.id);

        if (eventType === 'INSERT') {
          console.log('[Realtime] 📦 New Order -> Refetching all orders');
          fetchOrders(branchId);

        } else if (eventType === 'UPDATE') {
          console.log('[Realtime] 🔄 Order Updated -> Refetching all orders to ensure consistency');
          fetchOrders(branchId);
        } else if (eventType === 'DELETE') {
          setOrders(prev => {
            const index = prev.findIndex(o => o.id === oldRecord.id);
            if (index === -1) return prev;
            return [
              ...prev.slice(0, index),
              ...prev.slice(index + 1)
            ];
          });
          fetchTables(branchId);
        }
      })
      // 2. ORDER ITEMS LISTENER (Critical for "Kitchen" new items)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'order_items',
        // filter: filterStr2  <-- REMOVED: Caused ReferenceError. 
        // We listen to all items and rely on RLS to only send events for this restaurant.
      }, (payload) => {
        console.log('[Realtime] 🍔 Order Item Update:', payload.eventType);
        // We don't have the branch_id in order_items directly (only order_id).
        // Safest bet: Just fetch orders.
        fetchOrders(branchId);
      })
      // 3. TABLES LISTENER
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tables',
        filter: filterStr
      }, (payload) => {
        const eventType = payload.eventType;
        const newRecord = payload.new as any;

        console.log('[Realtime] 🪑 Table Event:', eventType);
        if (eventType === 'UPDATE') {
          // Optimistic update
          setTables(prev => prev.map(t =>
            (t.id === newRecord.id) ? { ...t, status: newRecord.status, label: newRecord.label || t.label } : t
          ));
        } else {
          fetchTables(branchId);
        }
      })
      // 4. INVENTORY LISTENER
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'inventory',
        filter: filterStr
      }, () => {
        console.log('[Realtime] 📦 Inventory Update');
        fetchIngredients(branchId, restaurantId);
      })
      // 5. USERS LISTENER (Self profile updates)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'users',
        filter: `id=eq.${user?.id}`
      }, (payload) => {
        console.log('[Realtime] 👤 User Profile Updated');
        if (user?.id) fetchProfile(user.id);
      })
      .subscribe((status) => {
        console.log('[Realtime] Status:', status);
        setIsConnected(status === 'SUBSCRIBED'); // NEW STATE
        if (status === 'SUBSCRIBED') {
          fetchOrders(branchId);
          fetchTables(branchId);
          fetchIngredients(branchId, restaurantId);
          fetchExpenses(branchId);
          fetchWasteRecords(branchId);
        }
      });

    return () => {
      console.log('[Realtime] Cleaning up Channel for Branch:', branchId);
      supabase.removeChannel(channel);
      setIsConnected(false);
    };
  }, [branchId, restaurantId, user?.id]);


  const fetchIngredients = async (bId: string, rId: string) => {
    if (!rId) return;
    const controller = new AbortController();

    try {
      // 1. Fetch ingredients (Global Catalog)
      const { data: ingredientsData, error: ingError } = await supabase
        .from('ingredients')
        .select('*')
        .eq('restaurant_id', rId)
        .abortSignal(controller.signal);

      if (ingError) throw ingError;
      setInventoryError(null);

      // 2. Fetch Inventory
      let inventoryData: any[] = [];

      if (bId === 'GLOBAL') {
        // GLOBAL MODE: Fetch ALL inventory for restaurant branches
        // Since we verify RLS (Admin sees all), we just need to filter by restaurant branches?
        // Inventory doesn't have restaurant_id, so we need to fetch for all branches we know of, or rely on RLS if it allows all.
        // Better: Fetch inventory where branch_id IN (our branches)
        // Optimization: Admin RLS allows seeing all. So simple select should work if we trust RLS, 
        // but safe is to filter by branches to avoid seeing other restaurants (though RLS prevents that).
        // Let's rely on mapping. 

        // Strategy: Get IDs of all active branches
        const branchIds = branches.map(b => b.id);
        if (branchIds.length > 0) {
          const { data, error } = await supabase
            .from('inventory')
            .select('*')
            .in('branch_id', branchIds);
          if (!error && data) inventoryData = data;
        }
      } else {
        // PER BRANCH
        const { data, error } = await supabase.from('inventory').select('*').eq('branch_id', bId);
        if (error) setInventoryError(error.message);
        if (data) inventoryData = data;
      }

      if (ingredientsData) {
        // Transform and join
        const formatted: Ingredient[] = ingredientsData.map((ing: any) => {
          let totalQty = 0;
          let unitPrice = 0;
          let minQty = 0;
          let criticalQty = 0;

          if (bId === 'GLOBAL') {
            // Aggregate
            const items = inventoryData.filter((i: any) => i.ingredient_id === ing.id);
            totalQty = items.reduce((sum: number, item: any) => sum + (item.quantity_gr || 0), 0);
            // For levels/price, maybe average or max? Or just show first? 
            // Price is usually same per ingredient if global catalog? 
            // Actually inventory has unit_cost_gr. Let's avg or take max.
            unitPrice = items.length > 0 ? items[0].unit_cost_gr : 0;
            minQty = items.reduce((sum: number, item: any) => sum + (item.min_level_gr || 0), 0);
            criticalQty = items.reduce((sum: number, item: any) => sum + (item.critical_level_gr || 0), 0);
          } else {
            const inv = inventoryData.find((i: any) => i.ingredient_id === ing.id);
            if (inv) {
              totalQty = inv.quantity_gr;
              unitPrice = inv.unit_cost_gr;
              minQty = inv.min_level_gr;
              criticalQty = inv.critical_level_gr;
            }
          }

          return {
            id: ing.id,
            name: ing.name,
            category: ing.category || 'General',
            currentQty: totalQty,
            unitPrice: unitPrice,
            minQty: minQty,
            criticalQty: criticalQty,
            icon: ing.icon || '📦',
            description: ing.description,
            measureUnit: ing.unit_base === 'ml' ? 'ml' : 'gr'
          };
        });
        setIngredients(formatted);
      }
    } catch (err) {
      console.error('Error fetching ingredients:', err);
    }
  };

  const fetchPlates = async () => {
    const controller = new AbortController();
    try {
      const { data: platesData, error } = await supabase
        .from('recipes')
        .select(`
          *,
          recipe_items (
            ingredient_id,
            quantity_gr
          )
        `)
        .abortSignal(controller.signal);

      if (error) throw error;

      if (platesData) {
        const formatted: Plate[] = platesData.map((p: any) => ({
          id: p.id,
          name: p.name,
          category: p.category || 'Fuertes',
          sellingPrice: p.selling_price || 0,
          ingredients: p.recipe_items?.map((ri: any) => ({
            ingredientId: ri.ingredient_id,
            qty: ri.quantity_gr
          })) || [],
          status: p.is_active ? 'active' : 'inactive',
          image: p.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400&auto=format&fit=crop'
        }));
        setPlates(formatted);
      }
    } catch (err) {
      console.error('Error fetching plates:', err);
    }
  };

  const fetchTables = async (bId: string) => {
    const controller = new AbortController();
    try {
      let query = supabase.from('tables').select('*').abortSignal(controller.signal);

      if (bId === 'GLOBAL') {
        const branchIds = branches.map(b => b.id);
        if (branchIds.length > 0) query = query.in('branch_id', branchIds);
        else return; // No branches
      } else {
        query = query.eq('branch_id', bId);
      }

      const { data, error } = await query.order('label');
      if (error) throw error;
      if (data) {
        const formatted: Table[] = data.map((t: any) => ({
          id: t.id,
          seats: t.seats,
          status: t.status as any,
          label: bId === 'GLOBAL' ? `${t.label} (Sucursal)` : t.label, // Ideally show branch name but we need join
          branchId: t.branch_id
        }));
        setTables(formatted);
      }
    } catch (err) {
      console.error('Error fetching tables:', err);
    }
  };

  const fetchExpenses = async (bId: string) => {
    const controller = new AbortController();
    try {
      let query = supabase.from('expenses').select('*').abortSignal(controller.signal);
      if (bId === 'GLOBAL') {
        const branchIds = branches.map(b => b.id);
        if (branchIds.length > 0) query = query.in('branch_id', branchIds);
        else return;
      } else {
        query = query.eq('branch_id', bId);
      }

      const { data, error } = await query.order('date', { ascending: false });

      if (data) {
        const formatted: Expense[] = data.map((e: any) => ({
          id: e.id,
          branchId: e.branch_id,
          date: e.date,
          category: e.category,
          subcategory: e.subcategory,
          amount: e.amount,
          type: e.type,
          description: e.description,
          paymentMethod: e.payment_method,
          isRecurrent: e.is_recurrent,
          recurrenceFreq: e.recurrence_frequency,
          receiptUrl: e.receipt_url
        }));
        setExpenses(formatted);
      }
    } catch (err) {
      console.error('Error fetching expenses:', err);
    }
  };

  const fetchOrders = async (bId: string) => {
    const controller = new AbortController();
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
      const startDateISO = startDate.toISOString();

      let query = supabase
        .from('orders')
        .select('*, order_items(*), users:waiter_id(full_name)')
        .abortSignal(controller.signal);

      if (bId === 'GLOBAL') {
        const branchIds = branches.map(b => b.id);
        if (branchIds.length > 0) query = query.in('branch_id', branchIds);
        else return;
      } else {
        query = query.eq('branch_id', bId);
      }

      const { data, error } = await query
        .or(`status.neq.paid,created_at.gte."${startDateISO}"`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (data) {
        const formatted: Order[] = data.map((o: any) => ({
          id: o.id,
          tableId: o.table_id,
          items: (o.order_items || []).map((oi: any) => ({
            plateId: oi.recipe_id,
            qty: oi.quantity,
            notes: oi.notes || undefined,
          })),
          status: o.status,
          total: parseFloat(o.total || '0'),
          timestamp: new Date(o.created_at),
          waiterId: o.waiter_id,
          waiterName: o.users?.full_name || 'Sin Asignar',
          readyAt: o.ready_at,
          servedAt: o.served_at,
          servedBy: o.served_by,
          branchId: o.branch_id,
        }));
        setOrders(formatted);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    }
  };

  const fetchWasteRecords = async (bId: string) => {
    const controller = new AbortController();
    try {
      let query = supabase.from('waste_records').select('*, users(full_name)').abortSignal(controller.signal);

      if (bId === 'GLOBAL') {
        const branchIds = branches.map(b => b.id);
        if (branchIds.length > 0) query = query.in('branch_id', branchIds);
        else return;
      } else {
        query = query.eq('branch_id', bId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        const formatted: WasteRecord[] = data.map((d: any) => ({
          id: d.id,
          ingredientId: d.ingredient_id,
          quantity: d.quantity,
          unit: d.unit,
          costAtTime: d.cost_at_time,
          totalCost: d.total_cost,
          reason: d.reason,
          notes: d.notes,
          userId: d.user_id,
          userName: d.users?.full_name || 'Desconocido',
          branchId: d.branch_id,
          created_at: d.created_at
        }));
        setWasteRecords(formatted);
      }
    } catch (err) {
      console.error('Error fetching waste:', err);
    }
  };









  const fetchProfile = async (userId: string, email?: string) => {
    const controller = new AbortController();
    try {
      const query = supabase
        .from('users')
        .select(`
          id,
          role, 
          full_name, 
          branch_id, 
          restaurant_id,
          branches:branch_id (
            id,
            name
          )
        `)
        .abortSignal(controller.signal);

      // Search by ID or Email
      if (email) {
        query.or(`id.eq.${userId},email.eq.${email}`);
      } else {
        query.eq('id', userId);
      }

      const { data, error } = await query.single();

      if (error) {
        console.error('Error fetching profile:', error);
        setLoading(false);
        return;
      }

      if (data) {
        const role = data.role as UserRole;
        const userProfile = {
          id: data.id, // Important: Use the ID from the database record (operational ID)
          name: data.full_name,
          role: role,
          branchId: data.branch_id,
          restaurantId: data.restaurant_id
        };
        setUser(userProfile);
        setRestaurantId(data.restaurant_id);

        if (role === UserRole.ADMIN) {
          const { data: branchesData } = await supabase
            .from('branches')
            .select('*')
            .eq('restaurant_id', data.restaurant_id)
            .eq('is_active', true)
            .abortSignal(controller.signal)
            .order('name');

          if (branchesData) {
            setBranches(branchesData);
            // Admins see everything if Global, or specific branch
            setBranchId('GLOBAL');
          }
        } else {
          // For staff, populate branches with just their assigned branch
          if (data.branches) {
            setBranches([data.branches]);
            setBranchId(data.branch_id);
          }
        }
        // Fetch global data (plates)
        fetchPlates();

        if (data.branch_id && data.restaurant_id) {
          setBranchId(data.branch_id);
          fetchIngredients(data.branch_id, data.restaurant_id); // Ensure ingredients load immediately for staff
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Effect to fetch data when branchId or User changes
  useEffect(() => {
    // Safety timeout to prevent infinite loading
    const safetyTimer = setTimeout(() => {
      setLoading((prev) => {
        if (prev) {
          console.warn('⚠️ Force stopping loading state due to timeout');
          return false;
        }
        return prev;
      });
    }, 3000);

    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(safetyTimer);
      if (session) {
        fetchProfile(session.user.id, session.user.email);
      } else {
        setLoading(false);
      }
    }).catch(err => {
      console.error('Session check failed:', err);
      clearTimeout(safetyTimer);
      setLoading(false);
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchProfile(session.user.id, session.user.email);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = (role: UserRole) => {
    // Handled by Auth Listener for admin login
  };


  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem('staff_session');
    window.location.hash = '#/';
  };

  const handleUnlock = (u: User) => {
    setUser(u);
    setIsLocked(false);
  };

  const handleLock = () => {
    setIsLocked(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-light">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (isLocked) {
    return <LockScreen onUnlock={handleUnlock} branchId={branchId} />;
  }

  if (!user) {
    return <LoginView onLogin={handleLogin} />;
  }
  console.log('[Render] Orders in state:', orders.length);

  return (
    <Router>
      <div className="flex h-screen overflow-hidden bg-bg-light">
        <Sidebar
          user={user}
          onLogout={handleLogout}
          onLock={handleLock}
          branches={branches}
          currentBranchId={branchId}
          onBranchChange={(id) => setBranchId(id)}
        />

        <main className="flex-1 overflow-y-auto relative">
          <Routes>
            <Route path="/" element={<Navigate to={user.role === UserRole.ADMIN ? "/admin" : user.role === UserRole.WAITER ? "/waiter" : user.role === UserRole.KITCHEN ? "/kitchen" : "/cashier"} />} />

            {/* Rutas de Administrador */}
            <Route path="/admin" element={<AdminDashboard ingredients={ingredients} plates={plates} orders={orders} tables={tables} branchName={branches.find(b => b.id === branchId)?.name} branchId={branchId} />} />
            <Route path="/waste" element={<WasteView ingredients={ingredients} currentUser={user} restaurantId={restaurantId || ''} branchId={branchId || ''} branches={branches} />} />
            <Route path="/ingredients" element={<IngredientsView ingredients={ingredients} setIngredients={setIngredients} branchId={branchId} restaurantId={restaurantId} />} />
            <Route path="/inventory" element={<InventoryView ingredients={ingredients} setIngredients={setIngredients} branchId={branchId} />} />
            <Route path="/tables" element={branchId === 'GLOBAL' ? <GlobalModeWarning /> : <TablesView tables={tables} setTables={setTables} branchId={branchId} />} />
            <Route path="/orders-history" element={<OrdersHistoryView plates={plates} tables={tables} branchId={branchId} branches={branches} currentUser={user} />} />
            <Route path="/users" element={<UserManagementView currentUser={user} branches={branches} />} />
            <Route path="/enterprise-profile" element={<EnterpriseProfileView currentUser={user} branches={branches} setBranches={setBranches} />} />
            <Route path="/audit" element={<AuditLogView />} />
            <Route path="/plates" element={<PlatesView plates={plates} ingredients={ingredients} setPlates={setPlates} restaurantId={restaurantId} orders={orders} />} />
            <Route path="/finance" element={<FinanceView orders={orders} ingredients={ingredients} expenses={expenses} plates={plates} wasteRecords={wasteRecords} branchId={branchId} />} />
            <Route path="/expenses" element={<ExpensesView expenses={expenses} onAddExpense={(newExp) => setExpenses(prev => Array.isArray(prev) ? [newExp, ...prev] : [newExp])} branchId={branchId} branches={branches} orders={orders} ingredients={ingredients} plates={plates} />} />

            {/* Rutas de Mesero */}
            <Route path="/waiter" element={branchId === 'GLOBAL' ? <GlobalModeWarning /> : <WaiterView tables={tables} plates={plates} orders={orders} setOrders={setOrders} setTables={setTables} branchId={branchId} currentUser={user} fetchOrders={() => fetchOrders(branchId || '')} ingredients={ingredients} restaurantId={restaurantId} inventoryError={inventoryError} />} />

            {/* Rutas de Cajero */}
            <Route path="/cashier" element={branchId === 'GLOBAL' ? <GlobalModeWarning /> : <CashierView tables={tables} plates={plates} setTables={setTables} branchId={branchId} currentUser={user} />} />
            <Route path="/cashier-history" element={branchId === 'GLOBAL' ? <GlobalModeWarning /> : <OrdersHistoryView plates={plates} tables={tables} branchId={branchId} currentUser={user} />} />

            {/* Rutas de Cocina */}
            <Route path="/kitchen" element={branchId === 'GLOBAL' ? <GlobalModeWarning /> : <KitchenView orders={orders} plates={plates} tables={tables} setOrders={setOrders} branchId={branchId} fetchOrders={() => branchId && fetchOrders(branchId)} ingredients={ingredients} setIngredients={setIngredients} initialView="active" />} />
            <Route path="/kitchen-history" element={branchId === 'GLOBAL' ? <GlobalModeWarning /> : <KitchenView orders={orders} plates={plates} tables={tables} setOrders={setOrders} branchId={branchId} fetchOrders={() => branchId && fetchOrders(branchId)} ingredients={ingredients} setIngredients={setIngredients} initialView="history" />} />
            <Route path="/kitchen/recipes" element={<KitchenRecipeView plates={plates} ingredients={ingredients} />} />
            <Route path="/kitchen/waste" element={<KitchenWasteView ingredients={ingredients} user={user} branchId={branchId} restaurantId={restaurantId} />} />

            <Route path="*" element={<Navigate to={user.role === UserRole.ADMIN ? "/admin" : user.role === UserRole.WAITER ? "/waiter" : user.role === UserRole.KITCHEN ? "/kitchen" : "/cashier"} replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
