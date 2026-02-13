
import React, { useState, useEffect, useRef } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { UserRole, Ingredient, Plate, Order, Table, Expense, User } from './types';
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
import KitchenView from './views/KitchenView';

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
  const [inventoryError, setInventoryError] = useState<string | null>(null);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchProfile(session.user.id);
      } else {
        // Check for saved staff session in localStorage
        const savedSession = localStorage.getItem('staff_session');
        if (savedSession) {
          try {
            const parsed = JSON.parse(savedSession);
            const staffUser: User = parsed.user;
            isStaffLoginRef.current = true;
            setUser(staffUser);
            if (parsed.restaurantId) setRestaurantId(parsed.restaurantId);
            if (parsed.branchId) setBranchId(parsed.branchId);

            // Sync user object with saved session
            setUser(staffUser);

            const activeBranchId = parsed.branchId;
            if (activeBranchId && parsed.restaurantId) {
              fetchIngredients(activeBranchId, parsed.restaurantId);
              fetchExpenses(activeBranchId);
              fetchTables(activeBranchId);
              fetchOrders(activeBranchId);
            }
            fetchPlates();
          } catch (e) {
            localStorage.removeItem('staff_session');
          }
        }
        setLoading(false);
      }
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchProfile(session.user.id);
      } else if (!isStaffLoginRef.current) {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const [branchId, setBranchId] = useState<string | null>(null);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);

  // Supabase Realtime: sync orders & tables across all sessions
  // Supabase Realtime: sync orders & tables across all sessions
  useEffect(() => {
    if (!branchId || !restaurantId) return;

    const channel = supabase
      .channel('realtime-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        console.log('[Realtime] Orders update:', payload);
        fetchOrders(branchId);
        fetchTables(branchId); // Sync tables too as status might change
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, (payload) => {
        console.log('[Realtime] Order Items update:', payload);
        // Small delay to ensure order parent is ready if it was just created
        setTimeout(() => {
          fetchOrders(branchId);
          fetchTables(branchId);
        }, 500);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tables' }, (payload) => {
        console.log('[Realtime] Tables update:', payload);
        fetchTables(branchId);
        fetchOrders(branchId); // Sync orders too just in case
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, (payload) => {
        console.log('[Realtime] Inventory update:', payload);
        fetchIngredients(branchId, restaurantId);
      })
      .subscribe((status) => {
        console.log(`[Realtime] Channel status: ${status}`);
        if (status === 'SUBSCRIBED') {
          // Re-fetch everything on connect just in case
          fetchOrders(branchId);
          fetchTables(branchId);
          fetchIngredients(branchId, restaurantId);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [branchId, restaurantId]);

  const fetchIngredients = async (bId: string, rId: string) => {
    if (!rId) {
      console.warn('Cannot fetch ingredients: restaurantId is missing.');
      return;
    }

    try {
      // 1. Fetch ingredients for this restaurant
      const { data: ingredientsData, error: ingError } = await supabase
        .from('ingredients')
        .select('*')
        .eq('restaurant_id', rId);

      if (ingError) throw ingError;

      setInventoryError(null);
      // 2. Fetch inventory for this branch
      const { data: inventoryData, error: invError } = await supabase
        .from('inventory')
        .select('*')
        .eq('branch_id', bId);

      if (invError) {
        console.warn('Could not fetch inventory separately:', invError);
        setInventoryError(invError.message);
      }

      console.log(`[FetchIngredients] Found ${ingredientsData?.length || 0} ingredients and ${inventoryData?.length || 0} inventory records for branch ${bId}.`);

      if (ingredientsData) {
        // Transform and join in JS
        const formatted: Ingredient[] = ingredientsData.map((ing: any) => {
          const inv = inventoryData ? inventoryData.find((i: any) => i.ingredient_id === ing.id) : null;
          const invData = inv || { quantity_gr: 0, unit_cost_gr: 0, min_level_gr: 0, critical_level_gr: 0 };

          return {
            id: ing.id,
            name: ing.name,
            category: ing.category || 'General',
            currentQty: invData.quantity_gr,
            unitPrice: invData.unit_cost_gr,
            minQty: invData.min_level_gr,
            criticalQty: invData.critical_level_gr,
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
    try {
      const { data: platesData, error } = await supabase
        .from('recipes')
        .select(`
          *,
          recipe_items (
            ingredient_id,
            quantity_gr
          )
        `);

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
    try {
      const { data, error } = await supabase.from('tables').select('*').eq('branch_id', bId).order('label');
      if (error) throw error;
      if (data) {
        // Map DB fields to Table interface
        const formatted: Table[] = data.map((t: any) => ({
          id: t.id,
          seats: t.seats,
          status: t.status as any,
          label: t.label // Ensure Table interface has label
        }));
        setTables(formatted);
      }
    } catch (err) {
      console.error('Error fetching tables:', err);
    }
  };

  const fetchExpenses = async (bId: string) => {
    try {
      const { data, error } = await supabase.from('expenses').select('*').eq('branch_id', bId).order('date', { ascending: false });
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
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayISO = todayStart.toISOString();

      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('branch_id', bId)
        .or(`status.neq.paid,created_at.gte."${todayISO}"`)
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
          readyAt: o.ready_at,
          servedAt: o.served_at,
          servedBy: o.served_by,
        }));
        setOrders(formatted);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    }
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role, full_name, branch_id, restaurant_id')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        setLoading(false);
        return;
      }

      if (data) {
        const roleStr = data.role.toUpperCase();
        const role = UserRole[roleStr as keyof typeof UserRole] || UserRole.ADMIN;
        setUser({
          id: userId,
          name: data.full_name || 'Usuario',
          role,
          branchId: data.branch_id,
          restaurantId: data.restaurant_id
        });

        if (data.restaurant_id) {
          setRestaurantId(data.restaurant_id);
        }

        // Fetch global data (plates)
        fetchPlates();

        if (data.branch_id && data.restaurant_id) {
          setBranchId(data.branch_id);
          fetchIngredients(data.branch_id, data.restaurant_id);
          fetchExpenses(data.branch_id);
          fetchTables(data.branch_id);
          fetchOrders(data.branch_id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (role: UserRole) => {
    // Handled by Auth Listener for admin login
  };

  const handleStaffLogin = (staffUser: User, restId: string, brId: string) => {
    isStaffLoginRef.current = true;
    setUser(staffUser);
    if (restId) setRestaurantId(restId);
    if (brId) {
      setBranchId(brId);
      fetchIngredients(brId, restId);
      fetchExpenses(brId);
      fetchTables(brId);
      fetchOrders(brId);
    }
    fetchPlates();
    // Save staff session to localStorage for persistence
    localStorage.setItem('staff_session', JSON.stringify({ user: staffUser, restaurantId: restId, branchId: brId }));
    // Reset route to role's home
    const roleHome = staffUser.role === UserRole.WAITER ? '#/waiter' : staffUser.role === UserRole.KITCHEN ? '#/kitchen' : '#/cashier';
    window.location.hash = roleHome;
  };

  const handleLogout = async () => {
    if (isStaffLoginRef.current) {
      isStaffLoginRef.current = false;
    } else {
      await supabase.auth.signOut();
    }
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
    return <LoginView onLogin={handleLogin} onStaffLogin={handleStaffLogin} />;
  }

  return (
    <Router>
      <div className="flex h-screen overflow-hidden bg-bg-light">
        <Sidebar user={user} onLogout={handleLogout} onLock={handleLock} />

        <main className="flex-1 overflow-y-auto relative">
          <Routes>
            <Route path="/" element={<Navigate to={user.role === UserRole.ADMIN ? "/admin" : user.role === UserRole.WAITER ? "/waiter" : user.role === UserRole.KITCHEN ? "/kitchen" : "/cashier"} />} />

            {/* Rutas de Administrador */}
            <Route path="/admin" element={<AdminDashboard ingredients={ingredients} plates={plates} orders={orders} tables={tables} />} />
            <Route path="/ingredients" element={<IngredientsView ingredients={ingredients} setIngredients={setIngredients} branchId={branchId} restaurantId={restaurantId} />} />
            <Route path="/inventory" element={<InventoryView ingredients={ingredients} setIngredients={setIngredients} branchId={branchId} />} />
            <Route path="/tables" element={<TablesView tables={tables} setTables={setTables} branchId={branchId} />} />
            <Route path="/orders-history" element={<OrdersHistoryView orders={orders} plates={plates} tables={tables} />} />
            <Route path="/users" element={<UserManagementView currentUser={user} />} />
            <Route path="/audit" element={<AuditLogView />} />
            <Route path="/plates" element={<PlatesView plates={plates} ingredients={ingredients} setPlates={setPlates} restaurantId={restaurantId} orders={orders} />} />
            <Route path="/finance" element={<FinanceView orders={orders} ingredients={ingredients} expenses={expenses} plates={plates} />} />
            <Route path="/expenses" element={<ExpensesView expenses={expenses} orders={orders} ingredients={ingredients} plates={plates} onAddExpense={(exp) => setExpenses(prev => [exp, ...prev])} branchId={branchId} />} />

            {/* Rutas de Mesero */}
            <Route path="/waiter" element={<WaiterView tables={tables} plates={plates} orders={orders} setOrders={setOrders} setTables={setTables} branchId={branchId} currentUser={user} fetchOrders={() => fetchOrders(branchId || '')} ingredients={ingredients} restaurantId={restaurantId} inventoryError={inventoryError} />} />

            {/* Rutas de Cajero */}
            <Route path="/cashier" element={<CashierView tables={tables} orders={orders} plates={plates} setTables={setTables} setOrders={setOrders} />} />

            {/* Rutas de Cocina */}
            <Route path="/kitchen" element={<KitchenView orders={orders} plates={plates} tables={tables} setOrders={setOrders} branchId={branchId} fetchOrders={() => branchId && fetchOrders(branchId)} ingredients={ingredients} setIngredients={setIngredients} />} />

            <Route path="*" element={<Navigate to={user.role === UserRole.ADMIN ? "/admin" : user.role === UserRole.WAITER ? "/waiter" : user.role === UserRole.KITCHEN ? "/kitchen" : "/cashier"} replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
