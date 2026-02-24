import React, { useState, useMemo } from 'react';
import { Order, Plate, Table, User } from '../types';
import { useRealtimeOrders } from '../hooks/useRealtimeOrders';
import { supabase } from '../supabaseClient';
import { useEffect } from 'react';

interface OrdersHistoryViewProps {
    // orders: Order[]; // We ignore the prop now
    plates: Plate[];
    tables: Table[];
    branchId: string | 'GLOBAL' | null;
    branches?: any[];
    currentUser?: User | null;
}

const OrdersHistoryView: React.FC<OrdersHistoryViewProps> = ({ plates, tables, branchId, branches = [], currentUser }) => {
    // Use Realtime Hook
    const { orders } = useRealtimeOrders(branchId === 'GLOBAL' ? null : branchId);

    const [currentDate, setCurrentDate] = useState(new Date());
    const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'pending' | 'cancelled'>('all');
    const [showAllDates, setShowAllDates] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string>('all');
    const [users, setUsers] = useState<{ id: string, full_name: string }[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    useEffect(() => {
        const fetchUsers = async () => {
            if (!currentUser?.restaurantId) return;
            let query = supabase
                .from('users')
                .select('id, full_name, role')
                .eq('restaurant_id', currentUser.restaurantId)
                .in('role', ['waiter', 'cashier'])
                .order('full_name');

            if (branchId && branchId !== 'GLOBAL') {
                query = query.eq('branch_id', branchId);
            }

            const { data, error } = await query;
            if (!error && data) setUsers(data);
        };
        fetchUsers();
    }, [currentUser, branchId]);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [currentDate, filterStatus, showAllDates, selectedUserId]);

    const filteredOrders = useMemo(() => {
        return orders.filter(o => {
            if (o.optimistic) return false;

            // Date Filter
            let matchesDate = true;
            if (!showAllDates) {
                const d = new Date(o.timestamp);
                matchesDate = d.getDate() === currentDate.getDate() &&
                    d.getMonth() === currentDate.getMonth() &&
                    d.getFullYear() === currentDate.getFullYear();
            }

            // Status Filter
            const matchesStatus = filterStatus === 'all' || o.status === filterStatus;

            // User Filter
            let matchesUser = true;
            if (selectedUserId !== 'all') {
                matchesUser = o.waiterId === selectedUserId || o.cashierId === selectedUserId;
            }

            return matchesDate && matchesStatus && matchesUser;
        });
    }, [orders, currentDate, filterStatus, showAllDates, selectedUserId]);

    const paginatedOrders = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredOrders.slice(start, start + pageSize);
    }, [filteredOrders, currentPage]);

    const totalPages = Math.ceil(filteredOrders.length / pageSize);

    // Stats
    const totalSales = filteredOrders.reduce((sum, o) => sum + (o.status === 'paid' ? o.total : 0), 0);
    const totalOrders = filteredOrders.length;
    const avgTicket = totalOrders > 0 ? totalSales / totalOrders : 0;

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'paid': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'pending': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'cancelled': return 'bg-rose-50 text-rose-600 border-rose-100';
            case 'preparing': return 'bg-blue-50 text-blue-600 border-blue-100';
            default: return 'bg-slate-50 text-slate-500 border-slate-100';
        }
    };

    const getStatusLabel = (status: string) => {
        const map: Record<string, string> = {
            'open': 'Pendiente',
            'preparing': 'En Cocina',
            'delivered': 'Servido',
            'paid': 'Pagado',
            'pending': 'Pendiente',
            'cancelled': 'Cancelado'
        };
        return map[status] || status;
    };

    const getTableLabel = (tId: string) => {
        const t = tables.find(tb => (tb.id || tb.label) === tId);
        return t?.label || `Mesa ${tId}`;
    };

    const getPlateName = (id: string) => {
        const plate = plates.find(p => p.id === id);
        return plate ? plate.name : `Plato ${id}`;
    };

    const formatMoney = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

    return (
        <div className="p-4 sm:p-6 space-y-5 animate-fade-in pb-24 xl:pb-0">
            <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white p-5 rounded-2xl shadow-card border border-slate-200">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <span className="material-icons-round text-primary text-2xl">history_edu</span>
                        Historial de Pedidos
                    </h1>
                    <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-widest">Consulta y audita las ventas diarias.</p>
                </div>
                <div className="flex flex-wrap gap-3 items-center w-full lg:w-auto">
                    <input
                        type="date"
                        disabled={showAllDates}
                        className={`px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 transition-all ${showAllDates ? 'opacity-30 cursor-not-allowed bg-slate-50' : 'bg-white'}`}
                        value={currentDate.toISOString().split('T')[0]}
                        onChange={(e) => setCurrentDate(new Date(e.target.value))}
                    />
                    <select
                        className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 bg-white transition-all flex-1 sm:flex-none"
                        value={filterStatus}
                        onChange={(e: any) => setFilterStatus(e.target.value)}
                    >
                        <option value="all">Todos los Estados</option>
                        <option value="paid">Pagados</option>
                        <option value="pending">Pendientes</option>
                        <option value="cancelled">Cancelados</option>
                    </select>

                    <div className="flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100 flex-1 sm:flex-none">
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={showAllDates} onChange={() => setShowAllDates(!showAllDates)} />
                            <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                        <span className="text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-widest">Todas las fechas</span>
                    </div>

                    {currentUser?.role === 'admin' && (
                        <select
                            className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 bg-white transition-all flex-1 sm:flex-none min-w-[180px]"
                            value={selectedUserId}
                            onChange={(e) => setSelectedUserId(e.target.value)}
                        >
                            <option value="all">Todos los Usuarios</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>
                                    {u.full_name || 'Sin Nombre'} ({u.role === 'waiter' ? 'Mesero' : 'Cajero'})
                                </option>
                            ))}
                        </select>
                    )}
                </div>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between min-h-[140px] hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ventas Totales</p>
                        <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
                            <span className="material-icons-round text-xl">attach_money</span>
                        </div>
                    </div>
                    <div>
                        <p className="text-3xl font-black text-slate-900 mb-1 font-mono">{formatMoney(totalSales)}</p>
                        <p className="text-[10px] text-emerald-500 font-black uppercase tracking-wider flex items-center gap-1">
                            <span className="material-icons-round text-[14px]">trending_up</span> +12.5% vs ayer
                        </p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between min-h-[140px] hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pedidos</p>
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center">
                            <span className="material-icons-round text-xl">receipt_long</span>
                        </div>
                    </div>
                    <div>
                        <p className="text-3xl font-black text-slate-900 mb-1 font-mono">{totalOrders}</p>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Total del periodo</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between min-h-[140px] hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-1">
                    <div className="flex justify-between items-start">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ticket Promedio</p>
                        <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                            <span className="material-icons-round text-xl">payments</span>
                        </div>
                    </div>
                    <div>
                        <p className="text-3xl font-black text-slate-900 mb-1 font-mono">{formatMoney(avgTicket)}</p>
                        <p className="text-[10px] text-rose-500 font-black uppercase tracking-widest flex items-center gap-1">
                            <span className="material-icons-round text-[14px]">trending_down</span> -2.4% vs prev.
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left min-w-[900px]">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">ID / Hora</th>
                                {branchId === 'GLOBAL' && <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Sucursal</th>}
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mesa</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mesero</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {paginatedOrders.length === 0 ? (
                                <tr><td colSpan={branchId === 'GLOBAL' ? 7 : 6} className="px-6 py-16 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">No se encontraron pedidos.</td></tr>
                            ) : (
                                paginatedOrders.map(order => (
                                    <tr key={order.id} className="hover:bg-slate-50/80 transition-all group">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-sm text-primary group-hover:underline">#{order.id.slice(0, 8)}</span>
                                                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">
                                                    {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </td>
                                        {branchId === 'GLOBAL' && (
                                            <td className="px-6 py-4">
                                                <span className="text-xs text-slate-600 font-bold">
                                                    {branches?.find(b => b.id === order.branchId)?.name || 'Sucursal Principal'}
                                                </span>
                                            </td>
                                        )}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="material-icons-round text-slate-300 text-sm">chair</span>
                                                <span className="text-xs text-slate-600 font-bold uppercase">{getTableLabel(order.tableId)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-black border-2 uppercase tracking-widest ${getStatusStyles(order.status)}`}>
                                                {getStatusLabel(order.status)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-slate-100 text-[10px] font-black text-slate-400 flex items-center justify-center uppercase">
                                                    {(order.waiterName || 'S').charAt(0)}
                                                </div>
                                                <span className="text-xs text-slate-500 font-bold">{order.waiterName || 'S/A'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="font-black text-slate-900 text-sm sm:text-base font-mono">{formatMoney(order.total)}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => setSelectedOrder(order)}
                                                className="px-4 py-2 hover:bg-primary/5 text-primary rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95"
                                            >
                                                Ver Detalle
                                            </button>
                                        </td>
                                    </tr>
                                )))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination / Table Footer */}
            <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 bg-white rounded-2xl border border-slate-200 shadow-sm gap-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Viendo <span className="text-slate-900">{filteredOrders.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}</span> - <span className="text-slate-900">{Math.min(currentPage * pageSize, filteredOrders.length)}</span> de <span className="text-slate-900">{filteredOrders.length}</span> pedidos
                </p>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-primary hover:border-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                        <span className="material-icons-round">chevron_left</span>
                    </button>
                    <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-xs">{currentPage}</span>
                        <span className="text-[10px] font-black text-slate-300 uppercase">/</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{Math.max(1, totalPages)}</span>
                    </div>
                    <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage >= totalPages}
                        className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-primary hover:border-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                        <span className="material-icons-round">chevron_right</span>
                    </button>
                </div>
            </div>

            {selectedOrder && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-fadeIn" onClick={() => setSelectedOrder(null)}></div>
                    <div className="relative bg-white w-full sm:max-w-lg overflow-hidden animate-scaleUp h-full sm:h-auto sm:max-h-[85vh] flex flex-col sm:rounded-[40px] shadow-2xl">
                        {/* Custom Header */}
                        <header className="px-6 py-8 md:px-10 md:py-10 text-center bg-slate-50 shrink-0 border-b border-slate-100 flex flex-col items-center">
                            <div className="w-16 h-16 md:w-20 md:h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4 md:mb-6 shadow-inner"><span className="material-icons-round text-3xl md:text-4xl">receipt_long</span></div>
                            <h3 className="text-2xl md:text-3xl font-black text-slate-900">Pedido #{selectedOrder.id.substring(0, 8)}</h3>
                            <p className="text-slate-400 font-black text-[10px] md:text-xs uppercase mt-2 tracking-widest flex items-center gap-1.5">
                                <span className="material-icons-round text-[14px]">calendar_today</span>
                                {new Date(selectedOrder.timestamp).toLocaleString([], { dateStyle: 'long', timeStyle: 'short' })}
                            </p>
                        </header>

                        <div className="px-6 md:px-10 py-6 md:py-8 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
                            {/* Summary Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Ubicación</p>
                                    <div className="flex items-center gap-2">
                                        <span className="material-icons-round text-primary text-[18px]">chair</span>
                                        <p className="font-black text-slate-700 text-sm uppercase">{getTableLabel(selectedOrder.tableId)}</p>
                                    </div>
                                </div>
                                <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Estado</p>
                                    <span className={`inline-flex px-2.5 py-1 rounded-full text-[9px] font-black border-2 uppercase tracking-widest ${getStatusStyles(selectedOrder.status)}`}>
                                        {getStatusLabel(selectedOrder.status)}
                                    </span>
                                </div>
                                <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 col-span-2">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Personal</p>
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-black">
                                            {(selectedOrder.waiterName || 'U').charAt(0)}
                                        </div>
                                        <p className="font-black text-slate-700 text-sm">{selectedOrder.waiterName || 'Usuario Desconocido'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Items List */}
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 py-2 border-b border-slate-100">
                                    <span className="material-icons-round text-slate-400 text-[18px]">restaurant_menu</span>
                                    Detalle de Consumo
                                </h4>
                                <div className="divide-y divide-slate-50">
                                    {selectedOrder.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center py-4 group">
                                            <div className="flex items-start gap-4">
                                                <span className="mt-0.5 bg-slate-100 text-slate-600 font-bold text-[11px] px-2 py-0.5 rounded-md border border-slate-200">
                                                    {item.qty}x
                                                </span>
                                                <div>
                                                    <p className="font-bold text-slate-800 text-sm group-hover:text-primary transition-colors">
                                                        {item.plateId ? getPlateName(item.plateId) : 'Producto Directo'}
                                                    </p>
                                                    {item.notes && (
                                                        <div className="flex items-center gap-1 mt-1">
                                                            <span className="material-icons-round text-[12px] text-amber-400">notes</span>
                                                            <p className="text-[11px] text-slate-400 italic leading-tight">{item.notes}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-black text-slate-900 text-sm font-mono">{formatMoney((item.unitPrice || 0) * item.qty)}</p>
                                                <p className="text-[9px] text-slate-400 font-black uppercase">@{formatMoney(item.unitPrice || 0)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <footer className="px-6 py-6 md:px-10 md:py-8 bg-slate-50/80 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-6 shrink-0">
                            <div className="flex flex-col text-center sm:text-left">
                                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Total del Pedido</span>
                                <span className="text-3xl font-black text-slate-900 leading-none font-mono">{formatMoney(selectedOrder.total)}</span>
                            </div>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="w-full sm:w-auto px-8 py-5 bg-slate-900 text-white rounded-3xl font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-xl shadow-slate-200 uppercase tracking-widest"
                            >
                                Cerrar Detalle
                            </button>
                        </footer>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrdersHistoryView;
