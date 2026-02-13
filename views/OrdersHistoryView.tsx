
import React, { useState, useMemo } from 'react';
import { Order, Plate, Table } from '../types';

interface OrdersHistoryViewProps {
    orders: Order[];
    plates: Plate[];
    tables: Table[];
}

const OrdersHistoryView: React.FC<OrdersHistoryViewProps> = ({ orders, plates, tables }) => {
    const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'preparing' | 'delivered' | 'paid'>('all');
    const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('today');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    const filteredOrders = useMemo(() => {
        let result = [...orders];

        // Filter by Status
        if (filterStatus !== 'all') {
            result = result.filter(o => o.status === filterStatus);
        }

        // Filter by Date
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        if (dateRange === 'today') {
            result = result.filter(o => new Date(o.timestamp) >= today);
        } else if (dateRange === 'week') {
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - 7);
            result = result.filter(o => new Date(o.timestamp) >= weekStart);
        } else if (dateRange === 'month') {
            const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
            result = result.filter(o => new Date(o.timestamp) >= monthStart);
        }

        return result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [orders, filterStatus, dateRange]);

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
        <div className="p-6 space-y-6 animate-fadeIn max-w-[1200px] mx-auto pb-20">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <span className="material-icons-round text-accent">history</span> Historial de Pedidos
                    </h1>
                    <p className="text-slate-500 font-medium">Consulta y audita todas las transacciones.</p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <select
                        className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900"
                        value={dateRange}
                        onChange={e => setDateRange(e.target.value as any)}
                    >
                        <option value="today">Hoy</option>
                        <option value="week">Esta Semana</option>
                        <option value="month">Este Mes</option>
                        <option value="all">Todo el Historial</option>
                    </select>

                    <select
                        className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900"
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value as any)}
                    >
                        <option value="all">Todos los Estados</option>
                        <option value="paid">Pagados</option>
                        <option value="preparing">En Cocina</option>
                        <option value="open">Abiertos</option>
                    </select>
                </div>
            </header>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-wider">ID / Hora</th>
                                <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-wider">Mesa</th>
                                <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-wider">Estado</th>
                                <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-wider">Mesero</th>
                                <th className="px-6 py-4 text-right text-xs font-black text-slate-400 uppercase tracking-wider">Total</th>
                                <th className="px-6 py-4 text-center text-xs font-black text-slate-400 uppercase tracking-wider">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredOrders.map(order => (
                                <tr key={order.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-800">#{order.id.substring(0, 6)}</div>
                                        <div className="text-xs text-slate-400 font-medium">
                                            {new Date(order.timestamp).toLocaleDateString()} • {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </td>
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
                            ))}
                            {filteredOrders.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-bold">
                                        No se encontraron pedidos con los filtros actuales.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
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
