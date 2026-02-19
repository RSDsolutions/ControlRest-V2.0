import React, { useState, useMemo, useEffect } from 'react';
import { Order, Ingredient, Plate, Table } from '../types';
import { useRealtimeOrders } from '../hooks/useRealtimeOrders';

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

  const activeTables = tables.filter(t => t.status !== 'available').length;
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

  return (
    <div className="p-6 space-y-6 animate-fadeIn max-w-[1600px] mx-auto pb-20">
      <header className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <span className="material-icons-round text-accent">dashboard</span>
            Control Operativo {branchName && <span className="text-slate-400 font-medium text-lg ml-2">| {branchName}</span>}
          </h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{currentTime.toLocaleDateString()} • {currentTime.toLocaleTimeString()}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className={`px-3 py-1 rounded-full text-xs font-black uppercase flex items-center gap-2 ${pendingOrders > 5 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-emerald-100 text-emerald-600'}`}>
            <span className="material-icons-round text-sm">restaurant</span>
            Cocina: {pendingOrders > 0 ? `${pendingOrders} Pendientes` : 'Al día'}
          </div>
          <div className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-black uppercase flex items-center gap-2">
            <span className="material-icons-round text-sm">table_restaurant</span>
            Mesas: {activeTables}/{tables.length}
          </div>
        </div>
      </header>

      {/* 1. KPIs SUPERIORES */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <KPIBox label="Ventas Hoy" value={formatMoney(totalSalesToday)} sub={`vs ${formatMoney(totalSalesYesterday)} ayer`} icon="payments" color="text-slate-800" />
        <KPIBox label="Órdenes" value={todayOrders.length} sub="Transacciones" icon="receipt" color="text-blue-600" />
        <KPIBox label="Ticket Promedio" value={formatMoney(ticketAvg)} sub="Por mesa" icon="attach_money" color="text-purple-600" />
        <KPIBox label="Mesas Activas" value={`${activeTables}`} sub={`de ${tables.length} total`} icon="table_bar" color="text-orange-600" />
        <KPIBox label="Caja (Est.)" value={formatMoney(cashFlow.cash)} sub="Efectivo en cajón" icon="point_of_sale" color="text-emerald-600" />
      </div>

      {/* 2. ALERTAS CRÍTICAS */}
      {(criticalIngredients.length > 0 || lowMarginPlates.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {criticalIngredients.slice(0, 3).map(i => (
            <div key={i.id} className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <span className="material-icons-round text-red-500">inventory_2</span>
                <div>
                  <p className="text-xs font-black text-red-400 uppercase">Stock Crítico</p>
                  <p className="font-bold text-red-800">{i.name}</p>
                </div>
              </div>
              <span className="text-xl font-black text-red-600">{i.currentQty}{i.measureUnit}</span>
            </div>
          ))}
          {lowMarginPlates.slice(0, 2).map(p => (
            <div key={p.id} className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <span className="material-icons-round text-amber-500">trending_down</span>
                <div>
                  <p className="text-xs font-black text-amber-400 uppercase">Margen Bajo</p>
                  <p className="font-bold text-amber-800">{p.name}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        {/* 3. MONITOREO EN TIEMPO REAL (Orders) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden max-h-[500px]">
          <header className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 className="font-bold text-slate-800 flex items-center gap-2"><span className="material-icons-round text-slate-400">list_alt</span> Pedidos en Curso</h3>
            <span className="text-xs font-bold text-slate-400 uppercase">{pendingOrders} Activos</span>
          </header>
          <div className="overflow-y-auto p-2 space-y-2 flex-1">
            {todayOrders.slice(0, 10).map(o => (
              <div key={o.id} className={`p-3 rounded-xl border flex items-center justify-between transition-all ${o.status === 'preparing' ? 'bg-orange-50 border-orange-100' : 'bg-white border-slate-100 hover:border-slate-300'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-white ${o.status === 'preparing' ? 'bg-orange-400 animate-pulse' : o.status === 'open' ? 'bg-blue-400' : 'bg-emerald-400'}`}>
                    {o.tableId.substring(0, 2)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">Mesa {o.tableId}</p>
                    <p className="text-xs text-slate-500 font-medium">{o.items.length} ítems • {o.waiterName || 'Sin mesero'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-slate-700">{formatMoney(o.total)}</p>
                  <p className="text-[10px] font-bold uppercase text-slate-400">{new Date(o.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            ))}
            {todayOrders.length === 0 && <div className="p-8 text-center text-slate-400 font-bold">Sin actividad hoy aún.</div>}
          </div>
        </div>

        {/* 4. INVENTARIO RÁPIDO & CAJA */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><span className="material-icons-round text-rose-500">warning</span> Alertas de Stock</h3>
            <div className="space-y-3">
              {criticalIngredients.slice(0, 5).map(i => (
                <div key={i.id} className="flex justify-between items-center text-sm">
                  <span className="font-medium text-slate-600">{i.name}</span>
                  <span className="font-black text-rose-500 bg-rose-50 px-2 py-1 rounded-md">{i.currentQty} {i.measureUnit}</span>
                </div>
              ))}
              {criticalIngredients.length === 0 && <p className="text-xs text-emerald-500 font-bold">Todo el inventario OK.</p>}
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl shadow-lg p-6 text-white">
            <h3 className="font-bold text-slate-200 mb-6 flex items-center gap-2"><span className="material-icons-round">savings</span> Monitor de Caja</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm font-medium">Efectivo</span>
                <span className="font-mono font-bold text-emerald-400">{formatMoney(cashFlow.cash)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm font-medium">Tarjeta</span>
                <span className="font-mono font-bold text-blue-400">{formatMoney(cashFlow.card)}</span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-700 pt-2 mt-2">
                <span className="font-bold">Total</span>
                <span className="font-black text-xl">{formatMoney(cashFlow.cash + cashFlow.card + cashFlow.transfer)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 6. RENDIMIENTO MESEROS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-bold text-slate-800 mb-4">Rendimiento Meseros</h3>
          <div className="space-y-3">
            {activeWaiters.map((w, i) => (
              <div key={i} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs bg-slate-100 text-slate-600`}>
                    {w.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{w.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold">{w.count} mesas</p>
                  </div>
                </div>
                <span className="font-black text-slate-700 font-mono">{formatMoney(w.sales)}</span>
              </div>
            ))}
            {activeWaiters.length === 0 && <p className="text-sm text-slate-400">Sin datos de meseros hoy.</p>}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-bold text-slate-800 mb-4">Platos Top (Hoy)</h3>
          {/* Simplified logic for top plates calculation would go here if needed, for now placeholder or simple calc */}
          <div className="flex items-center justify-center h-32 text-slate-400 text-sm font-bold bg-slate-50 rounded-xl border border-dashed border-slate-200">
            Gráfico de Ventas por Plato
          </div>
        </div>
      </div>
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
