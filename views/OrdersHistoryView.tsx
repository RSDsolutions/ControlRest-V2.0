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
        <div className="p-8 space-y-8 animate-fadeIn">
            <header className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-xl">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <span className="material-icons-round text-blue-600">history_edu</span>
                        Historial de Pedidos
                    </h1>
                    <p className="text-slate-500 font-bold mt-1 ml-10">Consulta y audita las ventas diarias.</p>
                </div>
                <div className="flex flex-col gap-4 items-end">
                    <div className="flex gap-4">
                        <input
                            type="date"
                            disabled={showAllDates}
                            className={`bg-slate-50 border-none rounded-xl px-4 py-3 font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/20 outline-none transition-opacity ${showAllDates ? 'opacity-30 cursor-not-allowed' : ''}`}
                            value={currentDate.toISOString().split('T')[0]}
                            onChange={(e) => setCurrentDate(new Date(e.target.value))}
                        />
                        <select
                            className="bg-slate-50 border-none rounded-xl px-6 py-3 font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/20 outline-none appearance-none"
                            value={filterStatus}
                            onChange={(e: any) => setFilterStatus(e.target.value)}
                        >
                            <option value="all">Todos los Estados</option>
                            <option value="paid">Pagados</option>
                            <option value="pending">Pendientes</option>
                            <option value="cancelled">Cancelados</option>
                        </select>
                    </div>
                    <div className="flex gap-6 items-center">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <div className="relative inline-flex items-center">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={showAllDates}
                                    onChange={() => setShowAllDates(!showAllDates)}
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </div>
                            <span className="text-sm font-black text-slate-500 group-hover:text-blue-600 transition-colors uppercase tracking-widest">Todas las fechas</span>
                        </label>

                        {currentUser && (
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <div className="relative inline-flex items-center">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={onlyMyOrders}
                                        onChange={() => setOnlyMyOrders(!onlyMyOrders)}
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                                </div>
                                <span className="text-sm font-black text-slate-500 group-hover:text-emerald-600 transition-colors uppercase tracking-widest">Solo mis cobros</span>
                            </label>
                        )}
                    </div>
                </div>
            </header>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-50 rounded-xl text-blue-600"><span className="material-icons-round text-3xl">payments</span></div>
                    <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Ventas Totales</p>
                        <p className="text-3xl font-black text-slate-900 tracking-tight">${totalSales.toFixed(2)}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600"><span className="material-icons-round text-3xl">receipt_long</span></div>
                    <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Pedidos</p>
                        <p className="text-3xl font-black text-slate-900 tracking-tight">{totalOrders}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-violet-50 rounded-xl text-violet-600"><span className="material-icons-round text-3xl">analytics</span></div>
                    <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Ticket Promedio</p>
                        <p className="text-3xl font-black text-slate-900 tracking-tight">${avgTicket.toFixed(2)}</p>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
                <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-wider">ID / Hora</th>
                            {branchId === 'GLOBAL' && <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-wider">Sucursal</th>}
                            <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-wider">Mesa</th>
                            <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-wider">Estado</th>
                            <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-wider">Mesero</th>
                            <th className="px-6 py-4 text-right text-xs font-black text-slate-400 uppercase tracking-wider">Total</th>
                            <th className="px-6 py-4 text-center text-xs font-black text-slate-400 uppercase tracking-wider">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredOrders.length === 0 ? (
                            <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-bold">No se encontraron pedidos.</td></tr>
                        ) : (
                            filteredOrders.map(order => (
                                <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-mono text-xs text-slate-400">#{order.id.slice(0, 8)}</span>
                                            <span className="font-bold text-slate-700 text-sm">
                                                {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </td>
                                    {branchId === 'GLOBAL' && (
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">
                                                {branches?.find(b => b.id === order.branchId)?.name || 'Desconocida'}
                                            </span>
                                        </td>
                                    )}
                                    <td className="px-6 py-4">
                                        <span className="font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded text-xs">{getTableLabel(order.tableId)}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-md text-xs font-black uppercase tracking-wider ${getStatusColor(order.status)}`}>
                                            {getStatusLabel(order.status)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-medium text-slate-600">{order.waiterName || '-'}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="font-black text-slate-800">{formatMoney(order.total)}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button
                                            onClick={() => setSelectedOrder(order)}
                                            className="text-slate-400 hover:text-blue-600 font-bold text-xs p-2 rounded-lg hover:bg-blue-50 transition-colors"
                                        >
                                            VER DETALLES
                                        </button>
                                    </td>
                                </tr>
                            )))}
                    </tbody>
                </table>
            </div>

            {/* Details Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                        <header className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50">
                            <div>
                                <h3 className="font-black text-xl text-slate-800">Pedido #{selectedOrder.id.substring(0, 8)}</h3>
                                <p className="text-sm text-slate-500 font-medium mt-1">
                                    {new Date(selectedOrder.timestamp).toLocaleString()}
                                </p>
                            </div>
                            <button onClick={() => setSelectedOrder(null)} className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors">
                                <span className="material-icons-round text-lg">close</span>
                            </button>
                        </header>

                        <div className="p-6 overflow-y-auto flex-1 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase">Mesa</p>
                                    <p className="font-bold text-slate-800 text-lg">{getTableLabel(selectedOrder.tableId)}</p>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase">Estado</p>
                                    <p className={`font-bold text-sm uppercase ${getStatusColor(selectedOrder.status).split(' ')[1]}`}>
                                        {getStatusLabel(selectedOrder.status)}
                                    </p>
                                </div>
                                {selectedOrder.waiterName && (
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 col-span-2">
                                        <p className="text-[10px] font-black text-slate-400 uppercase">Atendido por</p>
                                        <p className="font-bold text-slate-800">{selectedOrder.waiterName}</p>
                                    </div>
                                )}
                            </div>

                            <div>
                                <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                                    <span className="material-icons-round text-slate-400 text-sm">restaurant_menu</span> Ítems
                                </h4>
                                <div className="space-y-2">
                                    {selectedOrder.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-start py-2 border-b border-slate-50 last:border-0">
                                            <div className="flex items-start gap-3">
                                                <span className="bg-slate-100 text-slate-600 font-black text-xs min-w-[24px] h-6 rounded flex items-center justify-center">
                                                    {item.qty}
                                                </span>
                                                <div>
                                                    <p className="font-bold text-slate-700 text-sm">{item.plateId ? getPlateName(item.plateId) : 'Ítem desconocido'}</p>
                                                    {item.notes && <p className="text-xs text-slate-400 italic mt-0.5">{item.notes}</p>}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                                <span className="font-bold text-slate-500">Total Pagado</span>
                                <span className="font-black text-3xl text-slate-900">{formatMoney(selectedOrder.total)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrdersHistoryView;
