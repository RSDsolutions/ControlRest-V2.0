import React, { useState, useMemo } from 'react';
import { Order, Plate, Table, User } from '../types';
import { useRealtimeOrders } from '../hooks/useRealtimeOrders';

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
    const [onlyMyOrders, setOnlyMyOrders] = useState(currentUser?.role === 'CASHIER');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

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
            if (onlyMyOrders && currentUser) {
                matchesUser = o.cashierId === currentUser.id;
            }

            return matchesDate && matchesStatus && matchesUser;
        });
    }, [orders, currentDate, filterStatus, showAllDates, onlyMyOrders, currentUser]);

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
        <div className="p-6 space-y-5 animate-fade-in">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-[8px] shadow-card border border-slate-200">
                <div>
                    <h1 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                        <span className="material-icons-round text-[#136dec] text-xl">history_edu</span>
                        Historial de Pedidos
                    </h1>
                    <p className="text-xs text-slate-400 mt-0.5">Consulta y audita las ventas diarias.</p>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                    <input
                        type="date"
                        disabled={showAllDates}
                        className={`input text-sm w-auto ${showAllDates ? 'opacity-30 cursor-not-allowed' : ''}`}
                        value={currentDate.toISOString().split('T')[0]}
                        onChange={(e) => setCurrentDate(new Date(e.target.value))}
                    />
                    <select
                        className="input text-sm w-auto"
                        value={filterStatus}
                        onChange={(e: any) => setFilterStatus(e.target.value)}
                    >
                        <option value="all">Todos los Estados</option>
                        <option value="paid">Pagados</option>
                        <option value="pending">Pendientes</option>
                        <option value="cancelled">Cancelados</option>
                    </select>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <div className="relative inline-flex items-center">
                            <input type="checkbox" className="sr-only peer" checked={showAllDates} onChange={() => setShowAllDates(!showAllDates)} />
                            <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#136dec]"></div>
                        </div>
                        <span className="text-xs font-semibold text-slate-500">Todas las fechas</span>
                    </label>
                    {currentUser && (
                        <label className="flex items-center gap-2 cursor-pointer">
                            <div className="relative inline-flex items-center">
                                <input type="checkbox" className="sr-only peer" checked={onlyMyOrders} onChange={() => setOnlyMyOrders(!onlyMyOrders)} />
                                <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                            </div>
                            <span className="text-xs font-semibold text-slate-500">Solo mis cobros</span>
                        </label>
                    )}
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between min-h-[140px]">
                    <div className="flex justify-between items-start">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ventas Totales</p>
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                            <span className="material-icons-round text-emerald-500 text-xl">attach_money</span>
                        </div>
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-slate-900 mb-1">{formatMoney(totalSales)}</p>
                        <p className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
                            <span className="material-icons-round text-[14px]">trending_up</span> +12.5% vs ayer
                        </p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between min-h-[140px]">
                    <div className="flex justify-between items-start">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pedidos</p>
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                            <span className="material-icons-round text-blue-500 text-xl">receipt_long</span>
                        </div>
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-slate-900 mb-1">{totalOrders}</p>
                        <p className="text-[10px] text-slate-400 font-medium">Total del día</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between min-h-[140px]">
                    <div className="flex justify-between items-start">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ticket Promedio</p>
                        <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
                            <span className="material-icons-round text-teal-500 text-xl">payments</span>
                        </div>
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-slate-900 mb-1">{formatMoney(avgTicket)}</p>
                        <p className="text-[10px] text-rose-500 font-bold flex items-center gap-1">
                            <span className="material-icons-round text-[14px]">trending_down</span> -2.4% vs semana pasada
                        </p>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="table-wrapper">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-slate-100">
                            <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                ID / Hora <span className="material-icons-round text-[14px]">unfold_more</span>
                            </th>
                            {branchId === 'GLOBAL' && <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sucursal</th>}
                            <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mesa</th>
                            <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estado</th>
                            <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mesero</th>
                            <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                Total <span className="material-icons-round text-[14px]">unfold_more</span>
                            </th>
                            <th className="px-6 py-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredOrders.length === 0 ? (
                            <tr><td colSpan={branchId === 'GLOBAL' ? 7 : 6} className="px-6 py-12 text-center text-slate-400 font-semibold">No se encontraron pedidos.</td></tr>
                        ) : (
                            filteredOrders.map(order => (
                                <tr key={order.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-[13px] text-[#136dec] tracking-tight">{order.id.slice(0, 8)}</span>
                                            <span className="text-[11px] text-slate-400 font-bold mt-0.5">
                                                {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase().replace(' ', ' ')}
                                            </span>
                                        </div>
                                    </td>
                                    {branchId === 'GLOBAL' && (
                                        <td className="px-6 py-4">
                                            <span className="text-xs text-slate-600 font-medium">
                                                {branches?.find(b => b.id === order.branchId)?.name || 'Sucursal Principal'}
                                            </span>
                                        </td>
                                    )}
                                    <td className="px-6 py-4">
                                        <span className="text-xs text-slate-600 font-medium">{getTableLabel(order.tableId)}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusStyles(order.status)}`}>
                                            {getStatusLabel(order.status)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs text-slate-500 font-medium">{order.waiterName || 'test3'}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-bold text-slate-900 text-[13px]">{formatMoney(order.total)}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button
                                            onClick={() => setSelectedOrder(order)}
                                            className="text-[#136dec] hover:text-[#0d4fb0] font-bold text-xs transition-colors"
                                        >
                                            Ver Detalle
                                        </button>
                                    </td>
                                </tr>
                            )))}
                    </tbody>
                </table>
            </div>

            {/* Pagination / Table Footer */}
            <div className="flex flex-col sm:flex-row justify-between items-center px-4 py-3 bg-white/50 backdrop-blur-sm rounded-xl border border-slate-100 gap-4">
                <p className="text-[11px] text-slate-400 font-medium">
                    Mostrando <span className="text-slate-900 font-bold">1</span> a <span className="text-slate-900 font-bold">{Math.min(10, filteredOrders.length)}</span> de <span className="text-slate-900 font-bold">{filteredOrders.length}</span> resultados
                </p>
                <div className="flex items-center gap-2">
                    <button className="px-4 py-2 bg-slate-50 text-slate-400 text-[11px] font-bold rounded-lg border border-slate-100 cursor-not-allowed">
                        Anterior
                    </button>
                    <button className="px-4 py-2 bg-white text-slate-600 text-[11px] font-bold rounded-lg border border-slate-200 hover:border-[#136dec] hover:text-[#136dec] transition-all">
                        Siguiente
                    </button>
                </div>
            </div>

            {/* Details Modal */}
            {selectedOrder && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <div>
                                <h3 className="text-base font-semibold text-slate-900">Pedido #{selectedOrder.id.substring(0, 8)}</h3>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    {new Date(selectedOrder.timestamp).toLocaleString()}
                                </p>
                            </div>
                            <button onClick={() => setSelectedOrder(null)} className="btn btn-ghost btn-icon text-slate-400">
                                <span className="material-icons-round text-[20px]">close</span>
                            </button>
                        </div>

                        <div className="modal-body space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-slate-50 p-3 rounded-[8px] border border-slate-100">
                                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Mesa</p>
                                    <p className="font-semibold text-slate-800">{getTableLabel(selectedOrder.tableId)}</p>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-[8px] border border-slate-100">
                                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Estado</p>
                                    <span className={`badge ${selectedOrder.status === 'paid' ? 'badge-success' : selectedOrder.status === 'preparing' ? 'badge-warning' : 'badge-info'}`}>
                                        {getStatusLabel(selectedOrder.status)}
                                    </span>
                                </div>
                                {selectedOrder.waiterName && (
                                    <div className="bg-slate-50 p-3 rounded-[8px] border border-slate-100 col-span-2">
                                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Atendido por</p>
                                        <p className="font-semibold text-slate-800">{selectedOrder.waiterName}</p>
                                    </div>
                                )}
                            </div>

                            <div>
                                <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2 text-sm">
                                    <span className="material-icons-round text-slate-400 text-[16px]">restaurant_menu</span> Ítems
                                </h4>
                                <div className="space-y-2">
                                    {selectedOrder.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-start py-2 border-b border-slate-50 last:border-0">
                                            <div className="flex items-start gap-3">
                                                <span className="bg-slate-100 text-slate-600 font-semibold text-xs min-w-[24px] h-6 rounded flex items-center justify-center">
                                                    {item.qty}
                                                </span>
                                                <div>
                                                    <p className="font-semibold text-slate-700 text-sm">{item.plateId ? getPlateName(item.plateId) : 'Ítem desconocido'}</p>
                                                    {item.notes && <p className="text-xs text-slate-400 italic mt-0.5">{item.notes}</p>}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                                <span className="font-semibold text-slate-500 text-sm">Total Pagado</span>
                                <span className="font-bold text-2xl text-slate-900">{formatMoney(selectedOrder.total)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrdersHistoryView;
