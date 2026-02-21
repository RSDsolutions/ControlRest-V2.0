import React, { useState, useMemo, useEffect } from 'react';
import { Order, Ingredient, Plate, Table } from '../types';
import { useRealtimeOrders } from '../hooks/useRealtimeOrders';
import { supabase } from '../supabaseClient';

interface AdminDashboardProps {
  // We keep 'orders' in prop type for compatibility, but will ignore it
  orders: Order[];
  ingredients: Ingredient[];
  plates: Plate[];
  tables: Table[];
  branchName?: string;
  branchId?: string | null; // Added branchId
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ ingredients, plates, tables, branchName, branchId }) => {
  // Use the hook to get fresh orders + auto-refresh
  // Shadowing the 'orders' prop intentionally to force usage of realtime data
  const { orders } = useRealtimeOrders(branchId || null);
  // Note: branchId is critical here. App.tsx must pass it.
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000); // Update every 30s
    return () => clearInterval(timer);
  }, []);

  // --- DATA PROCESSING ---

  // 1. Filter Today's Data
  const todayOrders = useMemo(() => {
    const now = new Date();
    return orders.filter(o => {
      if (o.optimistic) return false;
      const d = new Date(o.timestamp);
      return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
  }, [orders, currentTime]); // 'orders' here refers to the hook return value

  // 2. Filter Yesterday's Partial Data (Same Time)
  const yesterdayPartialOrders = useMemo(() => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    return orders.filter(o => {
      if (o.optimistic) return false;
      const d = new Date(o.timestamp);
      return d.getDate() === yesterday.getDate() &&
        d.getMonth() === yesterday.getMonth() &&
        d.getFullYear() === yesterday.getFullYear() &&
        d.getHours() <= now.getHours(); // Compare up to same hour
    });
  }, [orders, currentTime]);

  // KPIs
  const totalSalesToday = todayOrders.filter(o => o.status === 'paid').reduce((acc, o) => acc + o.total, 0);
  const totalSalesYesterday = yesterdayPartialOrders.filter(o => o.status === 'paid').reduce((acc, o) => acc + o.total, 0);

  // Derive active tables from real orders (not stale DB table status field)
  // This ensures correctness even if the DB table.status lags behind
  const activeTables = useMemo(() => {
    const activeTableIds = new Set(
      orders
        .filter(o => !o.optimistic && !['paid', 'cancelled'].includes(o.status))
        .map(o => o.tableId)
    );
    return activeTableIds.size;
  }, [orders]);
  const pendingOrders = todayOrders.filter(o => o.status === 'preparing' || o.status === 'open').length;

  const ticketAvg = todayOrders.filter(o => o.status === 'paid').length > 0 ? totalSalesToday / todayOrders.filter(o => o.status === 'paid').length : 0;

  // Alerts Logic
  const criticalIngredients = ingredients.filter(i => i.currentQty <= i.criticalQty);
  const lowMarginPlates = plates.filter(p => {
    const cost = p.ingredients.reduce((sum, pi) => {
      const ing = ingredients.find(i => i.id === pi.ingredientId);
      return sum + (pi.qty * (ing?.unitPrice || 0));
    }, 0);
    return (p.sellingPrice - cost) / p.sellingPrice < 0.3; // < 30% margin
  });

  const activeWaiters = useMemo(() => {
    // Group today's orders by waiter
    const waiterStats: Record<string, { name: string, sales: number, count: number }> = {};
    todayOrders.forEach(o => {
      const id = o.waiterId || 'unknown';
      if (!waiterStats[id]) waiterStats[id] = { name: o.waiterName || 'Sin Asignar', sales: 0, count: 0 };
      // Only count sales for paid orders
      if (o.status === 'paid') {
        waiterStats[id].sales += o.total;
      }
      waiterStats[id].count += 1;
    });
    return Object.values(waiterStats);
  }, [todayOrders]);

  const cashFlow = useMemo(() => {
    const flow = { cash: 0, card: 0, transfer: 0 };
    todayOrders.forEach(o => {
      // STRICT FILTER: Only count paid orders in Cash Flow
      if (o.status === 'paid') {
        if (o.paymentMethod === 'cash') flow.cash += o.total;
        else if (o.paymentMethod === 'card') flow.card += o.total;
        else if (o.paymentMethod === 'transfer') flow.transfer += o.total;
        // Default to cash if undefined for now
        else flow.cash += o.total;
      }
    });
    return flow;
  }, [todayOrders]);

  // ── MATERIALIZED VIEW: Monthly KPIs ──────────────────────────────
  const [monthlyKpis, setMonthlyKpis] = useState<any | null>(null);
  const [topRecipes, setTopRecipes] = useState<any[]>([]);
  const [mvLoading, setMvLoading] = useState(false);

  useEffect(() => {
    if (!branchId) return;
    const thisMonth = new Date();
    thisMonth.setDate(1);
    const monthStr = thisMonth.toISOString().split('T')[0];

    const fetchMv = async () => {
      setMvLoading(true);
      try {
        const [kpiRes, recipesRes] = await Promise.all([
          supabase
            .from('mv_monthly_branch_kpis')
            .select('*')
            .eq('branch_id', branchId)
            .eq('month', monthStr)
            .maybeSingle(),
          supabase
            .from('mv_top_recipes_monthly')
            .select('recipe_name, recipe_category, total_quantity, total_revenue')
            .eq('branch_id', branchId)
            .eq('month', monthStr)
            .order('total_quantity', { ascending: false })
            .limit(5),
        ]);
        if (kpiRes.data) setMonthlyKpis(kpiRes.data);
        if (recipesRes.data) setTopRecipes(recipesRes.data);
      } catch (_) { /* fail silently — MV is optional analytics */ }
      finally { setMvLoading(false); }
    };
    fetchMv();
  }, [branchId]);

  return (
    <div className="p-8 space-y-8 animate-fade-in max-w-[1600px] mx-auto pb-24">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-brand shadow-brand border border-slate-100">
        <div>
          <h1 className="text-3xl font-heading font-extrabold text-brand-black flex items-center gap-3 mb-1">
            <span className="material-icons-round text-primary text-3xl">dashboard</span>
            Panel de Control {branchName && <span className="text-slate-300 font-medium text-2xl ml-2">| {branchName}</span>}
          </h1>
          <p className="text-sm font-semibold text-slate-400 uppercase tracking-[0.15em]">{currentTime.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })} • {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm ${pendingOrders > 5 ? 'bg-red-50 text-status-error ring-1 ring-red-100 animate-pulse' : 'bg-emerald-50 text-status-success ring-1 ring-emerald-100'}`}>
            <span className="material-icons-round text-[18px]">restaurant</span>
            Estado Cocina: {pendingOrders > 0 ? `${pendingOrders} Pendientes` : 'Sin Pedidos'}
          </div>
          <div className="px-4 py-2 bg-primary/5 text-primary rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm ring-1 ring-primary/10">
            <span className="material-icons-round text-[18px]">table_restaurant</span>
            Mesas: {activeTables}/{tables.length}
          </div>
        </div>
      </header>

      {/* 1. KPIs SUPERIORES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        <KPIBox label="Ventas de Hoy" value={formatMoney(totalSalesToday)} sub={`Vs ${formatMoney(totalSalesYesterday)} ayer`} icon="payments" color="text-primary" />
        <KPIBox label="Órdenes Totales" value={todayOrders.length} sub="Transacciones hoy" icon="receipt_long" color="text-primary-light" />
        <KPIBox label="Ticket Promedio" value={formatMoney(ticketAvg)} sub="Por consumo" icon="analytics" color="text-indigo-600" />
        <KPIBox label="Mesas Activas" value={`${activeTables}`} sub={`de ${tables.length} habilitadas`} icon="table_bar" color="text-amber-600" />
        <KPIBox label="Efectivo Estimado" value={formatMoney(cashFlow.cash)} sub="Flujo de caja" icon="point_of_sale" color="text-status-success" />
      </div>

      {/* 2. ALERTAS CRÍTICAS */}
      {(criticalIngredients.length > 0 || lowMarginPlates.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {criticalIngredients.slice(0, 3).map(i => (
            <div key={i.id} className="alert alert-error shadow-sm card-hover">
              <span className="material-icons-round text-status-error text-2xl">inventory_2</span>
              <div className="flex-1">
                <p className="text-[10px] font-bold text-status-error uppercase tracking-widest">Agotado / Crítico</p>
                <p className="font-bold text-slate-800 text-lg leading-tight">{i.name}</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-status-error">{i.currentQty}</span>
                <span className="text-xs font-bold text-slate-400 ml-1">{i.measureUnit}</span>
              </div>
            </div>
          ))}
          {lowMarginPlates.slice(0, 2).map(p => (
            <div key={p.id} className="alert alert-warning shadow-sm card-hover">
              <span className="material-icons-round text-status-warning text-2xl">trending_down</span>
              <div className="flex-1">
                <p className="text-[10px] font-bold text-status-warning uppercase tracking-widest">Alerta de Margen</p>
                <p className="font-bold text-slate-800 text-lg leading-tight">{p.name}</p>
                <p className="text-xs font-medium text-slate-500">Rentabilidad inferior al 30%</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 3. MONITOREO EN TIEMPO REAL (Orders) */}
        <div className="lg:col-span-2 card shadow-brand-lg flex flex-col max-h-[600px]">
          <header className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h3 className="font-heading font-bold text-brand-black flex items-center gap-2">
                <span className="material-icons-round text-slate-400">hourglass_top</span>
                Monitoreo de Pedidos
              </h3>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-1">Actividad en tiempo real</p>
            </div>
            <div className="btn btn-ghost text-xs p-1 h-auto">
              {pendingOrders} ACTIVOS
            </div>
          </header>
          <div className="overflow-y-auto p-4 space-y-3 flex-1 custom-scrollbar">
            {todayOrders.slice(0, 15).map(o => (
              <div key={o.id} className={`p-4 rounded-brand border flex items-center justify-between transition-all group ${o.status === 'preparing' ? 'bg-primary/5 border-primary/20 shadow-sm' : 'bg-white border-slate-100 hover:border-primary/30 hover:shadow-md'}`}>
                <div className="flex items-center gap-5">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white shadow-lg ${o.status === 'preparing' ? 'bg-primary animate-pulse' : o.status === 'open' ? 'bg-slate-700' : 'bg-status-success'}`}>
                    {o.tableId.substring(0, 2)}
                  </div>
                  <div>
                    <h4 className="font-bold text-brand-black group-hover:text-primary transition-colors">Mesa {o.tableId}</h4>
                    <p className="text-xs text-slate-500 font-semibold">{o.items.length} productos • {o.waiterName || 'Sin mesero'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-brand-black text-lg">{formatMoney(o.total)}</p>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <span className="material-icons-round text-[14px] text-slate-300">schedule</span>
                    <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                      {new Date(o.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {todayOrders.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                <span className="material-icons-round text-6xl mb-4">inbox</span>
                <p className="font-bold text-lg">Sin órdenes el día de hoy</p>
                <p className="text-sm">La actividad aparecerá aquí automáticamente</p>
              </div>
            )}
          </div>
        </div>

        {/* 4. STOCK & CAJA */}
        <div className="space-y-8">
          <div className="card shadow-brand p-6 border-l-4 border-l-primary">
            <h3 className="font-heading font-bold text-brand-black mb-5 flex items-center gap-2">
              <span className="material-icons-round text-primary">analytics</span>
              Métricas de Inventario
            </h3>
            <div className="space-y-4">
              {criticalIngredients.slice(0, 5).map(i => (
                <div key={i.id} className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-slate-700">{i.name}</span>
                    <span className="font-black text-status-error">{i.currentQty} {i.measureUnit}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-status-error h-full" style={{ width: `${Math.min((i.currentQty / i.minQty) * 100, 100)}%` }}></div>
                  </div>
                </div>
              ))}
              {criticalIngredients.length === 0 && (
                <div className="bg-emerald-50 p-4 rounded-brand border border-emerald-100 flex items-center gap-3">
                  <span className="material-icons-round text-status-success">check_circle</span>
                  <p className="text-xs text-status-success font-bold uppercase tracking-wider">Inventario Saludable</p>
                </div>
              )}
            </div>
            <button className="btn btn-ghost w-full mt-6 text-xs font-bold text-primary">VER TODO EL INVENTARIO</button>
          </div>

          <div className="bg-brand-black rounded-brand shadow-2xl p-8 text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-primary/30 transition-all"></div>
            <h3 className="font-heading font-bold text-white/90 mb-8 flex items-center gap-2 relative z-10">
              <span className="material-icons-round text-primary-light">account_balance_wallet</span>
              Resumen de Caja
            </h3>
            <div className="space-y-5 relative z-10">
              <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                <span className="text-white/50 text-xs font-bold uppercase tracking-wider">Efectivo</span>
                <span className="font-heading font-bold text-primary-light text-lg">{formatMoney(cashFlow.cash)}</span>
              </div>
              <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                <span className="text-white/50 text-xs font-bold uppercase tracking-wider">Tarjeta / Digital</span>
                <span className="font-heading font-bold text-indigo-400 text-lg">{formatMoney(cashFlow.card + cashFlow.transfer)}</span>
              </div>
              <div className="pt-4 border-t border-white/10 mt-6 flex justify-between items-center">
                <div>
                  <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Cierre proyectado</p>
                  <p className="text-3xl font-heading font-black text-white">{formatMoney(cashFlow.cash + cashFlow.card + cashFlow.transfer)}</p>
                </div>
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                  <span className="material-icons-round text-primary-light">trending_up</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 6. COLUMNA INFERIOR */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="card shadow-brand p-6">
          <h3 className="font-heading font-bold text-brand-black mb-6 flex items-center gap-2">
            <span className="material-icons-round text-primary/40">groups</span>
            Mejores Meseros
          </h3>
          <div className="space-y-4">
            {activeWaiters.sort((a, b) => b.sales - a.sales).map((w, i) => (
              <div key={i} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-brand transition-all border border-transparent hover:border-slate-100 group">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm bg-primary/10 text-primary shadow-sm group-hover:scale-110 transition-transform`}>
                    {w.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-brand-black text-sm">{w.name}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{w.count} órdenes</p>
                  </div>
                </div>
                <span className="font-heading font-black text-slate-700">{formatMoney(w.sales)}</span>
              </div>
            ))}
            {activeWaiters.length === 0 && <p className="text-sm text-slate-400 font-medium py-4 text-center italic">Sin actividad de personal registrada</p>}
          </div>
        </div>

        <div className="card shadow-brand p-6">
          <h3 className="font-heading font-bold text-brand-black mb-6 flex items-center gap-2">
            <span className="material-icons-round text-primary/40">auto_graph</span>
            Platos Estrella (Mes)
          </h3>
          {mvLoading && <div className="text-xs text-slate-400 font-bold text-center py-10 animate-pulse">Analizando datos...</div>}
          {!mvLoading && topRecipes.length === 0 && (
            <div className="flex items-center justify-center h-48 text-slate-300 text-sm font-bold bg-slate-50 rounded-brand border border-dashed border-slate-200">
              Datos insuficientes este período
            </div>
          )}
          <div className="space-y-3">
            {topRecipes.map((r, i) => (
              <div key={i} className="flex items-center justify-between text-sm p-3 rounded-brand hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-lg ${i === 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'} text-[11px] font-black flex items-center justify-center`}>{i + 1}</span>
                  <div>
                    <h4 className="font-bold text-brand-black">{r.recipe_name}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{r.recipe_category || 'Gral'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-slate-800">{r.total_quantity} <span className="text-[10px] text-slate-400">vendidos</span></p>
                  <p className="text-[10px] font-bold text-primary uppercase tracking-tighter">{formatMoney(r.total_revenue)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* INFO BOX / AD BLOCK / TIPS */}
        <div className="bg-gradient-to-br from-primary to-primary-dark rounded-brand shadow-brand-lg p-6 text-white flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
              <span className="material-icons-round text-white">lightbulb</span>
            </div>
            <h3 className="text-xl font-heading font-black mb-3 text-white">Sugerencia de Optimización</h3>
            <p className="text-sm text-white/80 leading-relaxed font-medium">
              "Has tenido un flujo constante de pedidos en la última hora. Asegúrate de que el stock de ingredientes perecederos esté al día para evitar cancelaciones."
            </p>
          </div>
          <div className="mt-8 border-t border-white/10 pt-4 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/50">IA Insights v2.0</span>
            <span className="material-icons-round text-white/30 cursor-pointer hover:text-white transition-colors">arrow_forward</span>
          </div>
        </div>
      </div>

      {/* 7. KPIs MENSUALES — from materialized view */}
      {monthlyKpis && (
        <div className="card shadow-brand-lg p-8 bg-white border border-slate-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 transition-all group-hover:scale-110"></div>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-4 relative z-10">
            <div>
              <h3 className="text-2xl font-heading font-black text-brand-black flex items-center gap-3">
                <span className="material-icons-round text-primary text-3xl">insights</span>
                Rendimiento Mensual Corporativo
              </h3>
              <p className="text-slate-400 text-sm font-semibold uppercase tracking-[0.15em] mt-1">
                {new Date(monthlyKpis.month + 'T00:00:00').toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div className="px-4 py-1.5 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg">
              Data Consolidada • {branchId === 'GLOBAL' ? 'MODO GLOBAL' : 'SUCURSAL'}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
            {[
              { label: 'Ingresos Netos', value: formatMoney(Number(monthlyKpis.total_sales)), icon: 'account_balance', color: 'text-primary' },
              { label: 'Utilidad Bruta', value: formatMoney(Number(monthlyKpis.gross_profit)), icon: 'trending_up', color: 'text-indigo-600' },
              { label: 'Utilidad Real', value: formatMoney(Number(monthlyKpis.net_profit)), icon: 'savings', color: Number(monthlyKpis.net_profit) >= 0 ? 'text-status-success' : 'text-status-error' },
              { label: 'Margen de Beneficio', value: `${Number(monthlyKpis.profit_margin).toFixed(1)}%`, icon: 'donut_large', color: Number(monthlyKpis.profit_margin) >= 20 ? 'text-status-success' : 'text-amber-500' },
            ].map(k => (
              <div key={k.label} className="card p-6 border-slate-100 hover:border-primary/20 hover:shadow-brand transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-lg ${k.color.replace('text-', 'bg-')}/10`}>
                    <span className={`material-icons-round ${k.color} text-xl`}>{k.icon}</span>
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">{k.label}</p>
                </div>
                <p className="text-2xl font-heading font-extrabold text-brand-black">{k.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
            <div className="bg-slate-50 border border-slate-100 rounded-brand p-4 flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Costo de Ventas (COGS)</p>
                <p className="font-heading font-extrabold text-brand-black text-lg">{formatMoney(Number(monthlyKpis.total_cogs))}</p>
              </div>
              <span className="material-icons-round text-slate-300">shopping_bag</span>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-brand p-4 flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Gastos Operativos</p>
                <p className="font-heading font-extrabold text-brand-black text-lg">{formatMoney(Number(monthlyKpis.total_expenses))}</p>
              </div>
              <span className="material-icons-round text-slate-300">payments</span>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-brand p-4 flex items-center justify-between">
              <div>
                <p className="text-amber-600/60 text-[10px] font-bold uppercase tracking-wider mb-1">Impacto de Merma</p>
                <p className="font-heading font-extrabold text-amber-700 text-lg">{formatMoney(Number(monthlyKpis.total_waste_cost))}</p>
              </div>
              <span className="material-icons-round text-amber-500/50">delete_sweep</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const KPIBox = ({ label, value, sub, icon, color }: any) => (
  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-2">
      <span className={`material-icons-round text-2xl ${color}`}>{icon}</span>
      {/* Trend could go here */}
    </div>
    <div>
      <h4 className="text-2xl font-black text-slate-800 tracking-tight">{value}</h4>
      <div className="flex justify-between items-end">
        <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">{label}</p>
        <p className="text-[9px] font-bold text-slate-400 truncate max-w-[80px]">{sub}</p>
      </div>
    </div>
  </div>
);

const formatMoney = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

export default AdminDashboard;
