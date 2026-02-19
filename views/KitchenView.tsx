import React, { useState, useEffect, useCallback } from 'react';
import { Order, OrderItem, Plate, Table, Ingredient } from '../types';
import { supabase } from '../supabaseClient';
import { useRealtimeOrders } from '../hooks/useRealtimeOrders';

interface KitchenViewProps {
    orders: Order[];
    plates: Plate[];
    tables: Table[];
    setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
    branchId?: string | null;
    fetchOrders?: () => void;
    ingredients?: Ingredient[];
    setIngredients?: React.Dispatch<React.SetStateAction<Ingredient[]>>;
}

type KitchenStatus = 'pending' | 'preparing' | 'ready' | 'cancelled';

interface KitchenOrder extends Order {
    kitchenStatus: KitchenStatus;
    receivedAt: Date;
    startedAt?: Date;
    readyAt?: Date;
    priority: number; // lower = higher priority
}

const KitchenView: React.FC<KitchenViewProps> = ({ plates, tables, branchId, fetchOrders, ingredients = [], setIngredients, initialView }) => {
    const { orders, refresh: refreshOrders } = useRealtimeOrders(branchId || null);

    // Debug initial props
    useEffect(() => {
        console.log('[KitchenView] Props updated. initialView:', initialView);
    }, [initialView]);

    // Local state for kitchen workflow (derived from orders)
    const [kitchenOrders, setKitchenOrders] = useState<KitchenOrder[]>([]);

    // Initialize filter with initialView, defaulting to 'all'
    const [filter, setFilter] = useState<'all' | KitchenStatus | 'history'>(initialView || 'all');
    const [notification, setNotification] = useState<string | null>(null);

    // Force update filter when initialView prop changes (critical for navigation)
    useEffect(() => {
        if (initialView) {
            console.log('[KitchenView] Updating filter to:', initialView);
            setFilter(initialView);
        }
    }, [initialView]);

    const showNotification = (msg: string) => {
        setNotification(msg);
        setTimeout(() => setNotification(null), 4000);
    };

    // Convert orders to kitchen orders
    useEffect(() => {
        // Filter out optimistic orders to avoid showing orders with 0 items during race condition window
        const activeOrders = orders.filter(o => !o.optimistic && ['open', 'pending', 'preparing', 'ready'].includes(o.status));

        setKitchenOrders(prev => {
            const newKitchenOrders: KitchenOrder[] = activeOrders.map(order => {
                const existing = prev.find(ko => ko.id === order.id);
                if (existing) {
                    // Update kitchenStatus if the raw order status has changed
                    // Fix: Map 'open' to 'pending' even for existing orders updates
                    const mappedStatus = order.status === 'open' ? 'pending' : (order.status as KitchenStatus);
                    return {
                        ...existing,
                        items: order.items,
                        status: order.status,
                        kitchenStatus: mappedStatus
                    };
                }
                return {
                    ...order,
                    // Map 'open' status to 'pending' for kitchen view
                    kitchenStatus: order.status === 'preparing' ? 'preparing' : order.status === 'ready' ? 'ready' : 'pending',
                    receivedAt: order.timestamp ? new Date(order.timestamp) : new Date(),
                    priority: 0,
                };
            });
            return newKitchenOrders.sort((a, b) => {
                if (a.priority !== b.priority) return a.priority - b.priority;
                return a.receivedAt.getTime() - b.receivedAt.getTime();
            });
        });
    }, [orders]);

    const getPlate = useCallback((plateId: string) => plates.find(p => p.id === plateId), [plates]);
    const getTable = useCallback((tableId: string) => tables.find(t => (t.id || t.label) === tableId), [tables]);

    const changeStatus = async (orderId: string, newStatus: KitchenStatus) => {
        const now = new Date();

        // 1. Optimistic UI Update (Local state only)
        setKitchenOrders(prev => prev.map(ko => {
            if (ko.id !== orderId) return ko;
            const updates: Partial<KitchenOrder> = { kitchenStatus: newStatus, status: newStatus as any };
            if (newStatus === 'preparing') updates.startedAt = now;
            if (newStatus === 'ready') updates.readyAt = now;
            return { ...ko, ...updates };
        }));

        // We no longer manually update 'orders' prop since it's read-only from hook.
        // The hook will refresh shortly.

        try {
            if (newStatus === 'preparing') {
                // CALL RPC: start_preparation_atomic (Deducts stock here)
                const { error } = await supabase.rpc('start_preparation_atomic', { p_order_id: orderId });

                if (error) {
                    console.error('RPC start_preparation_atomic failed:', error);
                    // Force refresh to revert
                    if (refreshOrders) refreshOrders();

                    const msg = error.message.includes('Stock Insuficiente') ? '⚠️ Stock Insuficiente en Cocina' : '❌ Error al iniciar preparación';
                    showNotification(msg);
                    return; // Stop execution
                }
                showNotification(`🔥 Preparando Pedido #${orderId.slice(-4)}`);
            } else {
                // Normal update for 'ready' or 'cancelled'
                let updatePayload: any = { status: newStatus };
                if (newStatus === 'ready') updatePayload.ready_at = now.toISOString();

                const { error } = await supabase.from('orders').update(updatePayload).eq('id', orderId);
                if (error) throw error;

                if (newStatus === 'ready') showNotification(`✅ Pedido #${orderId.slice(-4)} listo`);
            }

            if (refreshOrders) refreshOrders();

        } catch (err: any) {
            console.error('Unexpected error in changeStatus:', err);
            // Force refresh to revert
            if (refreshOrders) refreshOrders();
            showNotification('❌ Error de conexión o base de datos');
        }
    };

    const togglePriority = (orderId: string) => {
        setKitchenOrders(prev => prev.map(ko =>
            ko.id === orderId ? { ...ko, priority: ko.priority === -1 ? 0 : -1 } : ko
        ));
    };

    const getElapsedTime = (from: Date | string, to?: Date | string) => {
        const fromDate = new Date(from);
        const toDate = to ? new Date(to) : new Date();

        if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) return "0:00";

        const diff = (toDate.getTime() - fromDate.getTime()) / 1000;
        const mins = Math.floor(diff / 60);
        const secs = Math.floor(diff % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getPendingOrders = () => kitchenOrders.filter(o => o.kitchenStatus === 'pending');
    const getPreparingOrders = () => kitchenOrders.filter(o => o.kitchenStatus === 'preparing');
    const getReadyOrders = () => kitchenOrders.filter(o => o.kitchenStatus === 'ready');

    const statusConfig: Record<KitchenStatus, { label: string; color: string; bg: string; icon: string }> = {
        pending: { label: 'Pendiente', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: 'schedule' },
        preparing: { label: 'En Preparación', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', icon: 'local_fire_department' },
        ready: { label: 'Listo', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: 'check_circle' },
        cancelled: { label: 'Cancelado', color: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: 'cancel' },
    };

    const [now, setNow] = useState(new Date());
    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    const renderOrderCard = (ko: KitchenOrder) => {
        const cfg = statusConfig[ko.kitchenStatus];
        const tableInfo = getTable(ko.tableId);
        const elapsed = ko.kitchenStatus === 'preparing' && ko.startedAt ? getElapsedTime(ko.startedAt, now) : null;
        const waitTime = getElapsedTime(ko.receivedAt, ko.kitchenStatus === 'ready' ? ko.readyAt : now);
        const isUrgent = ko.priority === -1;

        return (
            <div key={ko.id} className={`rounded-2xl border-2 ${cfg.bg} ${isUrgent ? 'ring-2 ring-red-400 shadow-lg shadow-red-100' : 'shadow-md'} transition-all hover:shadow-lg`}>
                {/* Header */}
                <div className={`px-4 py-3 border-b ${isUrgent ? 'border-red-200 bg-red-50' : 'border-inherit'} rounded-t-2xl`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {isUrgent && <span className="material-icons-round text-red-500 text-lg animate-pulse">priority_high</span>}
                            <span className="font-black text-slate-800 text-lg">#{ko.id.slice(-4).toUpperCase()}</span>
                            <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${cfg.color} ${cfg.bg}`}>
                                <span className="material-icons-round text-xs mr-0.5 align-middle">{cfg.icon}</span> {cfg.label}
                            </span>
                        </div>
                        <button onClick={() => togglePriority(ko.id)} title={isUrgent ? 'Quitar urgente' : 'Marcar urgente'}
                            className={`p-1 rounded-lg transition-all ${isUrgent ? 'text-red-500 bg-red-100' : 'text-slate-400 hover:text-red-500 hover:bg-red-50'}`}>
                            <span className="material-icons-round text-lg">bolt</span>
                        </button>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><span className="material-icons-round text-sm">table_restaurant</span> {tableInfo?.label || ko.tableId}</span>
                        {ko.waiterName && <span className="flex items-center gap-1"><span className="material-icons-round text-sm">person</span> {ko.waiterName}</span>}
                        <span className="flex items-center gap-1"><span className="material-icons-round text-sm">schedule</span> {waitTime}</span>
                        {elapsed && <span className="flex items-center gap-1 text-blue-600 font-bold"><span className="material-icons-round text-sm">local_fire_department</span> {elapsed}</span>}
                    </div>
                </div>

                {/* Items */}
                <div className="p-4 space-y-2">
                    {ko.items.map((item: OrderItem, idx: number) => {
                        const plate = getPlate(item.plateId);
                        return (
                            <div key={idx} className="flex items-start gap-3 py-1">
                                <span className="bg-slate-800 text-white font-black rounded-lg w-7 h-7 flex items-center justify-center text-sm shrink-0">{item.qty}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-slate-800 text-sm">{plate?.name || 'Plato N/A'}</p>
                                    {item.notes && (
                                        <p className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded-lg mt-1 flex items-center gap-1">
                                            <span className="material-icons-round text-xs">info</span> {item.notes}
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Actions */}
                <div className="px-4 pb-4 flex gap-2">
                    {ko.kitchenStatus === 'pending' && (
                        <button onClick={() => changeStatus(ko.id, 'preparing')}
                            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-1 shadow-sm">
                            <span className="material-icons-round text-lg">local_fire_department</span> Preparar
                        </button>
                    )}
                    {ko.kitchenStatus === 'preparing' && (
                        <button onClick={() => changeStatus(ko.id, 'ready')}
                            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-1 shadow-sm">
                            <span className="material-icons-round text-lg">check_circle</span> Listo
                        </button>
                    )}
                    {(ko.kitchenStatus === 'pending' || ko.kitchenStatus === 'preparing') && (
                        <button onClick={() => changeStatus(ko.id, 'cancelled')}
                            className="py-2.5 px-3 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-xl text-sm transition-all">
                            <span className="material-icons-round text-lg">close</span>
                        </button>
                    )}
                </div>
            </div>
        );
    };

    const pendingCount = getPendingOrders().length;
    const preparingCount = getPreparingOrders().length;
    const readyCount = getReadyOrders().length;

    console.log('[KitchenView] Render - Total Orders Prop:', orders.length);
    console.log('[KitchenView] Render - Active Kitchen Orders:', kitchenOrders.length);



    return (
        <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">
            {/* MAIN CONTENT AREA */}
            <main className="flex-1 flex flex-col h-full overflow-hidden relative">
                {/* HEADER */}
                <header className="bg-white h-20 border-b border-slate-200 flex items-center justify-between px-8 shrink-0 z-20 shadow-sm">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                            {filter === 'history' ? 'Historial de Pedidos' : 'Pedidos en Curso'}
                        </h2>
                        <p className="text-xs text-slate-500 font-medium">
                            {filter === 'history' ? 'Registro de comandas entregadas' : 'Gestiona la preparación de alimentos en tiempo real'}
                        </p>
                    </div>

                    {filter !== 'history' && (
                        <div className="flex bg-slate-100 p-1 rounded-xl">
                            {['all', 'pending', 'preparing', 'ready'].map((f) => {
                                const count = kitchenOrders.filter(o =>
                                    f === 'all' ? true : o.kitchenStatus === f
                                ).length;

                                const labels: any = { all: 'Todos', pending: 'Pendientes', preparing: 'En Cocina', ready: 'Listos' };
                                const icons: any = { all: 'list', pending: 'schedule', preparing: 'local_fire_department', ready: 'check_circle' };

                                return (
                                    <button
                                        key={f}
                                        onClick={() => setFilter(f as any)}
                                        className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${filter === f ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <span className="material-icons-round text-sm">{icons[f]}</span>
                                        {labels[f]}
                                        <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${filter === f ? 'bg-slate-100' : 'bg-slate-200'}`}>
                                            {count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    <button onClick={refreshOrders} className="p-2 text-slate-400 hover:text-primary transition-colors">
                        <span className="material-icons-round">refresh</span>
                    </button>
                </header>

                {/* CONTENT */}
                <div className="flex-1 overflow-x-auto overflow-y-auto p-6 bg-slate-50/50">
                    {filter === 'history' ? (
                        // HISTORY VIEW
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-fadeIn">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        <th className="px-6 py-4">Hora</th>
                                        <th className="px-6 py-4">Orden</th>
                                        <th className="px-6 py-4">Mesa</th>
                                        <th className="px-6 py-4">Items</th>
                                        <th className="px-6 py-4">Mesero</th>
                                        <th className="px-6 py-4 text-center">Total</th>
                                        <th className="px-6 py-4 text-center">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm">
                                    {orders
                                        .filter(o => ['delivered', 'billing', 'paid', 'cancelled'].includes(o.status))
                                        .map(order => {
                                            const table = tables.find(t => (t.id || t.label) === order.tableId);
                                            return (
                                                <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                                                    <td className="px-6 py-4 text-slate-500 font-mono">
                                                        {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </td>
                                                    <td className="px-6 py-4 font-mono font-bold text-slate-600">
                                                        #{order.id.slice(0, 8)}...
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-lg font-bold text-xs">
                                                            {table?.label || 'N/A'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col gap-1">
                                                            {order.items.map((item, idx) => {
                                                                const plate = plates.find(p => p.id === item.plateId);
                                                                return (
                                                                    <span key={idx} className="text-slate-700">
                                                                        <span className="font-bold">{item.qty}x</span> {plate?.name}
                                                                    </span>
                                                                );
                                                            })}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-500">
                                                        {order.waiterName || 'Sin asignar'}
                                                    </td>
                                                    <td className="px-6 py-4 text-center font-bold text-slate-700">
                                                        ${order.total.toFixed(2)}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${order.status === 'delivered' ? 'bg-purple-100 text-purple-700' :
                                                            order.status === 'billing' ? 'bg-pink-100 text-pink-700' :
                                                                order.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                                                                    'bg-red-100 text-red-700'
                                                            }`}>
                                                            {order.status === 'delivered' ? 'Entregado' :
                                                                order.status === 'billing' ? 'Cobrando' :
                                                                    order.status === 'paid' ? 'Pagado' :
                                                                        'Cancelado'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    {orders.filter(o => ['delivered', 'billing', 'paid', 'cancelled'].includes(o.status)).length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                                                <span className="material-icons-round text-4xl mb-2 block text-slate-300">history_toggle_off</span>
                                                No hay historial de pedidos reciente
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        // ACTIVE KANBAN VIEW
                        <div className="flex gap-6 h-full min-w-max pb-4">
                            {/* PENDING COLUMN */}
                            {(filter === 'all' || filter === 'pending') && (
                                <div className="w-80 flex flex-col h-full">
                                    <div className="flex items-center justify-between mb-4 px-1">
                                        <h3 className="font-black text-slate-700 flex items-center gap-2">
                                            <span className="w-3 h-3 rounded-full bg-amber-500"></span> PENDIENTES
                                        </h3>
                                        <span className="bg-white px-2 py-0.5 rounded-lg text-xs font-bold text-slate-500 shadow-sm border border-slate-100">
                                            {kitchenOrders.filter(o => o.kitchenStatus === 'pending').length}
                                        </span>
                                    </div>
                                    <div className="flex-1 overflow-y-auto pr-2 space-y-4 pb-20 scrollbar-thin scrollbar-thumb-slate-200">
                                        {kitchenOrders.filter(o => o.kitchenStatus === 'pending').map(order => renderOrderCard(order))}
                                    </div>
                                </div>
                            )}

                            {/* PREPARING COLUMN */}
                            {(filter === 'all' || filter === 'preparing') && (
                                <div className="w-80 flex flex-col h-full">
                                    <div className="flex items-center justify-between mb-4 px-1">
                                        <h3 className="font-black text-slate-700 flex items-center gap-2">
                                            <span className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></span> EN PREPARACIÓN
                                        </h3>
                                        <span className="bg-white px-2 py-0.5 rounded-lg text-xs font-bold text-slate-500 shadow-sm border border-slate-100">
                                            {kitchenOrders.filter(o => o.kitchenStatus === 'preparing').length}
                                        </span>
                                    </div>
                                    <div className="flex-1 overflow-y-auto pr-2 space-y-4 pb-20 scrollbar-thin scrollbar-thumb-slate-200">
                                        {kitchenOrders.filter(o => o.kitchenStatus === 'preparing').map(order => renderOrderCard(order))}
                                    </div>
                                </div>
                            )}

                            {/* READY COLUMN */}
                            {(filter === 'all' || filter === 'ready') && (
                                <div className="w-80 flex flex-col h-full">
                                    <div className="flex items-center justify-between mb-4 px-1">
                                        <h3 className="font-black text-slate-700 flex items-center gap-2">
                                            <span className="w-3 h-3 rounded-full bg-emerald-500"></span> LISTOS
                                        </h3>
                                        <span className="bg-white px-2 py-0.5 rounded-lg text-xs font-bold text-slate-500 shadow-sm border border-slate-100">
                                            {kitchenOrders.filter(o => o.kitchenStatus === 'ready').length}
                                        </span>
                                    </div>
                                    <div className="flex-1 overflow-y-auto pr-2 space-y-4 pb-20 scrollbar-thin scrollbar-thumb-slate-200">
                                        {kitchenOrders.filter(o => o.kitchenStatus === 'ready').map(order => renderOrderCard(order))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {notification && (
                    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-slideUp z-50">
                        <span className="material-icons-round text-emerald-400">info</span>
                        <span className="font-medium">{notification}</span>
                    </div>
                )}
            </main>
        </div>
    );
};

export default KitchenView;

