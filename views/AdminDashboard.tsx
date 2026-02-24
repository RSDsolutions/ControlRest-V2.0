import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Order, Ingredient, Plate, Table } from '../types';
import { useRealtimeOrders } from '../hooks/useRealtimeOrders';
import { supabase } from '../supabaseClient';
import { usePlanFeatures, isFeatureEnabled } from '../hooks/usePlanFeatures';

interface AdminDashboardProps {
  // We keep 'orders' in prop type for compatibility, but will ignore it
  orders: Order[];
  ingredients: Ingredient[];
  plates: Plate[];
  tables: Table[];
  branchName?: string;
  branchId?: string | null;
  restaurantId?: string | null;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ ingredients, plates, tables, branchName, branchId, restaurantId }) => {
  const navigate = useNavigate();
  // Use the hook to get fresh orders + auto-refresh
  // Shadowing the 'orders' prop intentionally to force usage of realtime data
  const { orders } = useRealtimeOrders(branchId || null);
  // Note: branchId is critical here. App.tsx must pass it.
  const [currentTime, setCurrentTime] = useState(new Date());

  const { data: planData } = usePlanFeatures(restaurantId || undefined);
  const isPlanOperativo = !isFeatureEnabled(planData, 'ENABLE_NET_PROFIT_CALCULATION');

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

  // --- PLAN 1 TREND CALCULATIONS ---
  const salesTrends = useMemo(() => {
    if (!isPlanOperativo) return null;

    const now = new Date();
    const last30Days = orders.filter(o => {
      const d = new Date(o.timestamp);
      return d >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    });

    // Daily Sales (last 7 days)
    const dailySales = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const daySales = last30Days.filter(o => {
        const od = new Date(o.timestamp);
        return od.getDate() === d.getDate() && od.getMonth() === d.getMonth() && od.getFullYear() === d.getFullYear();
      }).reduce((acc, o) => acc + (o.status === 'paid' ? o.total : 0), 0);
      return { label: d.toLocaleDateString('es-ES', { weekday: 'short' }), value: daySales };
    }).reverse();

    // Weekly Sales (last 4 weeks)
    const weeklySales = Array.from({ length: 4 }, (_, i) => {
      const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const weekStart = new Date(weekEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
      const weekSales = last30Days.filter(o => {
        const od = new Date(o.timestamp);
        return od >= weekStart && od <= weekEnd;
      }).reduce((acc, o) => acc + (o.status === 'paid' ? o.total : 0), 0);
      return { label: `Sem. ${4 - i}`, value: weekSales };
    }).reverse();

    return { daily: dailySales, weekly: weeklySales };
  }, [orders, isPlanOperativo]);

  const plateMargins = useMemo(() => {
    if (!isPlanOperativo) return [];
    return plates.map(p => {
      const cost = p.ingredients.reduce((sum, pi) => {
        const ing = ingredients.find(i => i.id === pi.ingredientId);
        return sum + (pi.qty * (ing?.unitPrice || 0));
      }, 0);
      const margin = p.sellingPrice > 0 ? (p.sellingPrice - cost) / p.sellingPrice : 0;
      return { name: p.name, margin: margin * 100, cost, price: p.sellingPrice };
    }).sort((a, b) => b.margin - a.margin);
  }, [plates, ingredients, isPlanOperativo]);

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
    <div className="p-4 sm:p-6 space-y-6 animate-fade-in max-w-[1400px] mx-auto">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shadow-sm shrink-0">
            <span className="material-icons-round text-xl">dashboard</span>
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 flex flex-wrap items-center gap-1.5 leading-tight">
              Panel de Control {branchName && <span className="text-slate-400 font-normal ml-0.5">— {branchName}</span>}
            </h1>
            <p className="text-[10px] sm:text-xs text-slate-400 font-medium">
              {currentTime.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })} · {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className={`flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold ${pendingOrders > 5 ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
            <span className="material-icons-round text-[14px]">restaurant</span>
            {pendingOrders > 0 ? `${pendingOrders} Pendientes` : 'Sin Pedidos'}
          </div>
          <div className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-50 text-[#136dec] rounded-full text-[10px] sm:text-xs font-bold border border-blue-100">
            <span className="material-icons-round text-[14px]">table_restaurant</span>
            {activeTables}/{tables.length} Mesas
          </div>
        </div>
      </header>

      {/* 1. KPIs SUPERIORES */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-5">
        <KPIBox label="Ventas Hoy" value={formatMoney(totalSalesToday)} sub={`Vs ${formatMoney(totalSalesYesterday)}`} icon="payments" color="text-primary" />
        <KPIBox label="Órdenes" value={todayOrders.length} sub="Transacciones" icon="receipt_long" color="text-primary-light" />
        <KPIBox label="Ticket Prom." value={formatMoney(ticketAvg)} sub="Por consumo" icon="analytics" color="text-indigo-600" />
        <KPIBox label="Mesas Act." value={`${activeTables}`} sub={`de ${tables.length}`} icon="table_bar" color="text-amber-600" />
        <KPIBox label="Efectivo Est." value={formatMoney(cashFlow.cash)} sub="Flujo de caja" icon="point_of_sale" color="text-status-success" className="col-span-2 lg:col-span-1" />
      </div>

      {isPlanOperativo ? (
        <div className="space-y-8 animate-slide-up">
          {/* SALES TRENDS SECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="card shadow-brand-lg p-6 bg-white border border-slate-100">
              <h3 className="font-heading font-black text-slate-800 mb-6 flex items-center gap-2">
                <span className="material-icons-round text-primary">bar_chart</span>
                Tendencia de Ventas (Diaria)
              </h3>
              <div className="h-64 flex items-end justify-between gap-2 px-2">
                {salesTrends?.daily.map((d, i) => {
                  const max = Math.max(...(salesTrends?.daily.map(s => s.value) || []), 1);
                  const height = (d.value / max) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                      <div className="w-full bg-slate-100 rounded-lg relative overflow-hidden h-48 flex items-end">
                        <div
                          className="w-full bg-primary/20 group-hover:bg-primary/40 transition-all rounded-t-md"
                          style={{ height: `${height}%` }}
                        ></div>
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="bg-slate-900 text-white text-[10px] px-2 py-1 rounded font-black">{formatMoney(d.value)}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{d.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="card shadow-brand-lg p-6 bg-white border border-slate-100">
              <h3 className="font-heading font-black text-slate-800 mb-6 flex items-center gap-2">
                <span className="material-icons-round text-indigo-500">show_chart</span>
                Histórico Semanal (Últimos 30 días)
              </h3>
              <div className="h-64 flex items-end justify-between gap-4 px-2">
                {salesTrends?.weekly.map((w, i) => {
                  const max = Math.max(...(salesTrends?.weekly.map(s => s.value) || []), 1);
                  const height = (w.value / max) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                      <div className="w-full bg-slate-100 rounded-xl relative overflow-hidden h-48 flex items-end">
                        <div
                          className="w-full bg-indigo-500/20 group-hover:bg-indigo-500/40 transition-all rounded-t-lg"
                          style={{ height: `${height}%` }}
                        ></div>
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="bg-slate-900 text-white text-[10px] px-2 py-1 rounded font-black">{formatMoney(w.value)}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{w.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* MARGIN ANALYSIS SECTION */}
          <div className="card shadow-brand-lg p-8 bg-white border border-slate-100">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="font-heading font-black text-slate-800 text-2xl flex items-center gap-3">
                  <span className="material-icons-round text-emerald-500 text-3xl">savings</span>
                  Análisis de Margen por Plato
                </h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Optimización de Rentabilidad Directa</p>
              </div>
              <div className="bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                Datos en Tiempo Real
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {plateMargins.slice(0, 6).map((pm, i) => (
                <div key={i} className="bg-slate-50 border border-slate-100 rounded-2xl p-6 hover:shadow-xl transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-black text-slate-900 leading-tight flex-1">{pm.name}</h4>
                    <span className={`text-xl font-black ${pm.margin >= 30 ? 'text-emerald-500' : pm.margin >= 15 ? 'text-amber-500' : 'text-red-500'}`}>
                      {pm.margin.toFixed(1)}%
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      <span>Costo Insumos</span>
                      <span className="text-slate-600 font-black">{formatMoney(pm.cost)}</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-1000 ${pm.margin >= 30 ? 'bg-emerald-500' : pm.margin >= 15 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${pm.margin}%` }}
                      ></div>
                    </div>
                    <div className="pt-2 flex justify-between items-center text-sm font-bold">
                      <span className="text-slate-500">Precio Venta</span>
                      <span className="text-primary">{formatMoney(pm.price)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* UPGRADE PLACEHOLDERS FOR REST */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 opacity-60">
            <div className="card p-8 flex flex-col items-center justify-center text-center border-dashed border-2 border-slate-300 pointer-events-none">
              <span className="material-icons-round text-slate-300 text-4xl mb-3">psychology</span>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">IA Insights & Alertas</p>
              <p className="text-[10px] text-slate-400 font-medium">Bloqueado para Plan Operativo</p>
            </div>
            <div className="card p-8 flex flex-col items-center justify-center text-center border-dashed border-2 border-slate-300 pointer-events-none">
              <span className="material-icons-round text-slate-300 text-4xl mb-3">groups</span>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Ranking de Meseros</p>
              <p className="text-[10px] text-slate-400 font-medium">Bloqueado para Plan Operativo</p>
            </div>
            <div className="card p-8 flex flex-col items-center justify-center text-center border-dashed border-2 border-slate-300 pointer-events-none">
              <span className="material-icons-round text-slate-300 text-4xl mb-3">inventory_2</span>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Monitoreo de Stock</p>
              <p className="text-[10px] text-slate-400 font-medium">Bloqueado para Plan Operativo</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
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
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shrink-0 ${o.status === 'preparing' ? 'bg-primary animate-pulse' : o.status === 'open' ? 'bg-slate-700' : 'bg-status-success'}`}>
                      {o.tableId.substring(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-brand-black group-hover:text-primary transition-colors truncate">Mesa {o.tableId}</h4>
                      <p className="text-[10px] sm:text-xs text-slate-500 font-semibold truncate">{o.items.length} prod. • {o.waiterName || 'Sin mesero'}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-black text-brand-black text-base sm:text-lg">{formatMoney(o.total)}</p>
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
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
              </div>
              <button
                onClick={() => navigate('/inventory')}
                className="btn btn-ghost w-full mt-6 text-xs font-bold text-primary"
              >
                VER TODO EL INVENTARIO
              </button>
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
      )}

      {/* 6. COLUMNA INFERIOR */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        <div className="card shadow-brand p-6">
          <h3 className="font-heading font-bold text-brand-black mb-6 flex items-center gap-2">
            <span className="material-icons-round text-primary/40">groups</span>
            Mejores Meseros
          </h3>
          <div className="space-y-4">
            {isPlanOperativo ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <span className="material-icons-round text-slate-300 text-4xl mb-2">lock</span>
                <p className="text-xs font-bold text-slate-500 max-w-[200px]">Actualiza tu plan para desbloquear el ranking de mejores meseros.</p>
                <button className="mt-4 px-4 py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest">Ver Planes</button>
              </div>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>

        <div className="card shadow-brand p-6">
          <h3 className="font-heading font-bold text-brand-black mb-6 flex items-center gap-2">
            <span className="material-icons-round text-primary/40">auto_graph</span>
            Platos Estrella (Mes)
          </h3>
          {isPlanOperativo ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <span className="material-icons-round text-slate-300 text-4xl mb-2">lock</span>
              <p className="text-xs font-bold text-slate-500 max-w-[200px]">Actualiza tu plan para conocer la rentabilidad de tus platos estrella.</p>
              <button className="mt-4 px-4 py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest">Ver Planes</button>
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-gradient-to-br from-primary to-primary-dark rounded-brand shadow-brand-lg p-6 text-white flex flex-col justify-between flex-1">
            <div>
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
                <span className="material-icons-round text-white">{isPlanOperativo ? 'workspace_premium' : 'lightbulb'}</span>
              </div>
              <h3 className="text-xl font-heading font-black mb-3 text-white">
                {isPlanOperativo ? 'Mejora tu Experiencia' : 'Sugerencia de Optimización'}
              </h3>
              <p className="text-sm text-white/80 leading-relaxed font-medium">
                {isPlanOperativo
                  ? 'Accede a inteligencia artificial predictiva y optimización de márgenes actualizando a un plan superior.'
                  : '"Has tenido un flujo constante de pedidos en la última hora. Asegúrate de que el stock de ingredientes perecederos esté al día para evitar cancelaciones."'}
              </p>
            </div>
          </div>
          {!isPlanOperativo && monthlyKpis && (
            <div className="bg-slate-50 border border-slate-100 rounded-brand p-4 flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Gastos Operativos</p>
                <p className="font-heading font-extrabold text-brand-black text-lg">{formatMoney(Number(monthlyKpis.total_expenses))}</p>
              </div>
              <span className="material-icons-round text-slate-300">payments</span>
            </div>
          )}
        </div>
      </div>

      {!isPlanOperativo && monthlyKpis && (
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
        </div>
      )}
    </div>
  );
};

const KPIBox = ({ label, value, sub, icon, color }: any) => (
  <div className="bg-white p-5 rounded-[8px] border border-slate-200 shadow-card hover:shadow-brand transition-shadow">
    <div className="flex items-center justify-between mb-3">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
      <span className={`material-icons-round text-xl ${color} opacity-70`}>{icon}</span>
    </div>
    <h4 className="text-2xl font-bold text-slate-900 tracking-tight">{value}</h4>
    <p className="text-xs text-slate-400 mt-1">{sub}</p>
  </div>
);

const formatMoney = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

export default AdminDashboard;
