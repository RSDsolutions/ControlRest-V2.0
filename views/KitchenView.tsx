
import React, { useState, useEffect, useCallback } from 'react';
import { Order, OrderItem, Plate, Table, Ingredient } from '../types';
import { supabase } from '../supabaseClient';

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

const KitchenView: React.FC<KitchenViewProps> = ({ orders, plates, tables, setOrders, branchId, fetchOrders, ingredients = [], setIngredients }) => {
    const [kitchenOrders, setKitchenOrders] = useState<KitchenOrder[]>([]);
    const [filter, setFilter] = useState<'all' | 'pending' | 'preparing' | 'ready'>('all');
    const [notification, setNotification] = useState<string | null>(null);

    const showNotification = (msg: string) => {
        setNotification(msg);
        setTimeout(() => setNotification(null), 4000);
    };

    // Convert orders to kitchen orders
    useEffect(() => {
        const activeOrders = orders.filter(o => ['pending', 'preparing', 'ready'].includes(o.status));

        setKitchenOrders(prev => {
            const newKitchenOrders: KitchenOrder[] = activeOrders.map(order => {
                const existing = prev.find(ko => ko.id === order.id);
                if (existing) {
                    // Update kitchenStatus if the raw order status has changed
                    return {
                        ...existing,
                        items: order.items,
                        status: order.status,
                        kitchenStatus: order.status as KitchenStatus
                    };
                }
                return {
                    ...order,
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

        // Update local state immediately for snappy UI
        setKitchenOrders(prev => prev.map(ko => {
            if (ko.id !== orderId) return ko;
            const updates: Partial<KitchenOrder> = { kitchenStatus: newStatus, status: newStatus as any };
            if (newStatus === 'preparing') updates.startedAt = now;
            if (newStatus === 'ready') updates.readyAt = now;
            return { ...ko, ...updates };
        }));

        // Also update the global orders state
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus as any } : o));

        // Stock deduction has been moved to WaiterView (at order creation)

        try {
            // First attempt: Try updating with audit fields
            let updatePayload: any = { status: newStatus };
            if (newStatus === 'ready') updatePayload.ready_at = now.toISOString();

            const { error: firstError } = await supabase.from('orders').update(updatePayload).eq('id', orderId);

            if (firstError) {
                console.warn('Retrying status-only update:', firstError);
                // Second attempt: Only status
                const { error: secondError } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);

                if (secondError) {
                    console.error('Final update failed:', secondError);
                    showNotification(`\u274C Error DB: No se pudo guardar`);
                    if (fetchOrders) fetchOrders();
                } else {
                    showNotification(`\u2705 Guardado (Sin datos de auditor\u00EDa)`);
                    if (fetchOrders) fetchOrders();
                }
            } else {
                showNotification(`\u2705 Pedido #${orderId.slice(-4)} listo`);
                if (fetchOrders) fetchOrders();
            }
        } catch (err) {
            console.error('Unexpected error in changeStatus:', err);
            showNotification('\u274C Error inesperado al actualizar');
        }
    };

    const togglePriority = (orderId: string) => {
        setKitchenOrders(prev => prev.map(ko =>
            ko.id === orderId ? { ...ko, priority: ko.priority === -1 ? 0 : -1 } : ko
        ));
    };

    const getElapsedTime = (from: Date, to?: Date) => {
        const diff = ((to || new Date()).getTime() - new Date(from).getTime()) / 1000;
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

    return (
        <div className="h-full flex flex-col bg-slate-100 relative">
            {/* Notification toast */}
            {notification && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[200] bg-slate-900/90 backdrop-blur-md text-white px-6 py-3 rounded-2xl shadow-2xl font-bold text-sm flex items-center gap-2 animate-fadeIn border border-white/10">
                    {notification}
                </div>
            )}
            {/* Top Bar */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="material-icons-round text-3xl text-red-500">soup_kitchen</span>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900">Panel de Cocina</h1>
                            <p className="text-xs text-slate-500">Kitchen Display System</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-3 py-2 rounded-xl font-bold text-sm">
                            <span className="material-icons-round text-lg">schedule</span> {pendingCount} Pendientes
                        </div>
                        <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-2 rounded-xl font-bold text-sm">
                            <span className="material-icons-round text-lg">local_fire_department</span> {preparingCount} En Prep.
                        </div>
                        <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-3 py-2 rounded-xl font-bold text-sm">
                            <span className="material-icons-round text-lg">check_circle</span> {readyCount} Listos
                        </div>
                    </div>
                </div>
            </div>

            {/* Kanban Columns */}
            <div className="flex-1 overflow-hidden p-4">
                <div className="grid grid-cols-3 gap-4 h-full">
                    {/* PENDIENTE */}
                    <div className="flex flex-col bg-amber-50/50 rounded-2xl border border-amber-100 overflow-hidden">
                        <div className="px-4 py-3 bg-amber-100/80 border-b border-amber-200 flex items-center gap-2 shrink-0">
                            <span className="material-icons-round text-amber-600">schedule</span>
                            <h2 className="font-black text-amber-800 text-sm uppercase tracking-wider">Pendiente</h2>
                            <span className="ml-auto bg-amber-200 text-amber-800 font-black text-xs px-2 py-0.5 rounded-lg">{pendingCount}</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 space-y-3 no-scrollbar">
                            {getPendingOrders().length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-amber-300">
                                    <span className="material-icons-round text-5xl">hourglass_empty</span>
                                    <p className="text-sm font-bold mt-2">Sin pedidos</p>
                                </div>
                            ) : getPendingOrders().map(renderOrderCard)}
                        </div>
                    </div>

                    {/* EN PREPARACIÓN */}
                    <div className="flex flex-col bg-blue-50/50 rounded-2xl border border-blue-100 overflow-hidden">
                        <div className="px-4 py-3 bg-blue-100/80 border-b border-blue-200 flex items-center gap-2 shrink-0">
                            <span className="material-icons-round text-blue-600">local_fire_department</span>
                            <h2 className="font-black text-blue-800 text-sm uppercase tracking-wider">En Preparación</h2>
                            <span className="ml-auto bg-blue-200 text-blue-800 font-black text-xs px-2 py-0.5 rounded-lg">{preparingCount}</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 space-y-3 no-scrollbar">
                            {getPreparingOrders().length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-blue-300">
                                    <span className="material-icons-round text-5xl">local_fire_department</span>
                                    <p className="text-sm font-bold mt-2">Nada cocinando</p>
                                </div>
                            ) : getPreparingOrders().map(renderOrderCard)}
                        </div>
                    </div>

                    {/* LISTO */}
                    <div className="flex flex-col bg-emerald-50/50 rounded-2xl border border-emerald-100 overflow-hidden">
                        <div className="px-4 py-3 bg-emerald-100/80 border-b border-emerald-200 flex items-center gap-2 shrink-0">
                            <span className="material-icons-round text-emerald-600">check_circle</span>
                            <h2 className="font-black text-emerald-800 text-sm uppercase tracking-wider">Listo para servir</h2>
                            <span className="ml-auto bg-emerald-200 text-emerald-800 font-black text-xs px-2 py-0.5 rounded-lg">{readyCount}</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 space-y-3 no-scrollbar">
                            {getReadyOrders().length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-emerald-300">
                                    <span className="material-icons-round text-5xl">dining</span>
                                    <p className="text-sm font-bold mt-2">Nada listo aún</p>
                                </div>
                            ) : getReadyOrders().map(renderOrderCard)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default KitchenView;
