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

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'open': return 'bg-blue-100 text-blue-700';
            case 'preparing': return 'bg-orange-100 text-orange-700';
            case 'delivered': return 'bg-purple-100 text-purple-700';
            case 'paid': return 'bg-emerald-100 text-emerald-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    const getStatusLabel = (status: string) => {
        const map: Record<string, string> = {
            'open': 'Abierto',
            'preparing': 'Preparando',
            'delivered': 'Entregado',
            'paid': 'Pagado'
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

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="kpi-card">
                    <div className="flex items-center justify-between mb-3">
                        <p className="kpi-label">Ventas Totales</p>
                        <span className="material-icons-round text-xl text-[#136dec] opacity-70">payments</span>
                    </div>
                    <p className="kpi-value">${totalSales.toFixed(2)}</p>
                </div>
                <div className="kpi-card">
                    <div className="flex items-center justify-between mb-3">
                        <p className="kpi-label">Pedidos</p>
                        <span className="material-icons-round text-xl text-emerald-500 opacity-70">receipt_long</span>
                    </div>
                    <p className="kpi-value">{totalOrders}</p>
                </div>
                <div className="kpi-card">
                    <div className="flex items-center justify-between mb-3">
                        <p className="kpi-label">Ticket Promedio</p>
                        <span className="material-icons-round text-xl text-violet-500 opacity-70">analytics</span>
                    </div>
                    <p className="kpi-value">${avgTicket.toFixed(2)}</p>
                </div>
            </div>

            {/* Table */}
            <div className="table-wrapper">
                <table className="table">
                    <thead>
                        <tr>
                            <th>ID / Hora</th>
                            {branchId === 'GLOBAL' && <th>Sucursal</th>}
                            <th>Mesa</th>
                            <th>Estado</th>
                            <th>Mesero</th>
                            <th className="text-right">Total</th>
                            <th className="text-center">Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredOrders.length === 0 ? (
                            <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-semibold">No se encontraron pedidos.</td></tr>
                        ) : (
                            filteredOrders.map(order => (
                                <tr key={order.id}>
                                    <td>
                                        <div className="flex flex-col">
                                            <span className="font-mono text-xs text-slate-400">#{order.id.slice(0, 8)}</span>
                                            <span className="font-semibold text-slate-700 text-sm">
                                                {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </td>
                                    {branchId === 'GLOBAL' && (
                                        <td>
                                            <span className="badge badge-neutral">
                                                {branches?.find(b => b.id === order.branchId)?.name || 'Desconocida'}
                                            </span>
                                        </td>
                                    )}
                                    <td>
                                        <span className="badge badge-neutral">{getTableLabel(order.tableId)}</span>
                                    </td>
                                    <td>
                                        <span className={`badge ${order.status === 'paid' ? 'badge-success' : order.status === 'preparing' ? 'badge-warning' : order.status === 'delivered' ? 'badge-purple' : 'badge-info'}`}>
                                            {getStatusLabel(order.status)}
                                        </span>
                                    </td>
                                    <td>
                                        <span className="text-sm text-slate-600">{order.waiterName || '-'}</span>
                                    </td>
                                    <td className="text-right">
                                        <span className="font-semibold text-slate-800">{formatMoney(order.total)}</span>
                                    </td>
                                    <td className="text-center">
                                        <button
                                            onClick={() => setSelectedOrder(order)}
                                            className="btn btn-outline btn-sm"
                                        >
                                            Ver
                                        </button>
                                    </td>
                                </tr>
                            )))}
                    </tbody>
                </table>
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
