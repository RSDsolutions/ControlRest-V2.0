
import React, { useState, useMemo } from 'react';
import { Expense, Order, Ingredient, Plate } from '../types';
import { supabase } from '../supabaseClient';

interface ExpensesViewProps {
    expenses: Expense[];
    orders: Order[];
    ingredients: Ingredient[];
    plates: Plate[];
    onAddExpense: (exp: Expense) => void;
    branchId: string | 'GLOBAL' | null;
    branches?: any[];
}

const ExpensesView: React.FC<ExpensesViewProps> = ({ expenses = [], orders = [], ingredients = [], plates = [], onAddExpense, branchId, branches = [] }) => {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'list'>('dashboard');
    const [showAddModal, setShowAddModal] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date());

    // Filter Data by Month
    const filteredExpenses = useMemo(() => {
        return expenses.filter(e => {
            const d = new Date(e.date);
            return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
        });
    }, [expenses, currentDate]);

    const filteredOrders = useMemo(() => {
        return orders.filter(o => {
            const d = new Date(o.timestamp);
            return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
        });
    }, [orders, currentDate]);

    // Calculations
    const totalSales = filteredOrders.reduce((acc, o) => acc + (o.total || 0), 0);

    const calculateCOGS = () => {
        let cost = 0;
        filteredOrders.forEach(o => {
            if (!o.items) return;
            o.items.forEach(item => {
                const plate = plates.find(p => p.id === item.plateId);
                if (plate) {
                    const plateCost = plate.ingredients.reduce((sum, pi) => {
                        const ing = ingredients.find(i => i.id === pi.ingredientId);
                        return sum + (pi.qty * (ing?.unitPrice || 0));
                    }, 0);
                    cost += (item.qty * plateCost);
                }
            });
        });
        return cost;
    };

    const totalCOGS = calculateCOGS();
    const totalOpExpenses = filteredExpenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);

    const grossProfit = totalSales - totalCOGS;
    const operatingProfit = grossProfit - totalOpExpenses;
    const netProfit = operatingProfit; // Subtract taxes if tracked separately? Assuming taxes are in expenses for now if categorized.

    const fixedExpenses = filteredExpenses.filter(e => e.type === 'fixed').reduce((acc, e) => acc + Number(e.amount), 0);
    const variableExpenses = filteredExpenses.filter(e => e.type === 'variable').reduce((acc, e) => acc + Number(e.amount), 0) + totalCOGS;

    const breakEvenPoint = totalSales > 0 && (totalSales - variableExpenses) !== 0
        ? fixedExpenses / ((totalSales - variableExpenses) / totalSales)
        : 0;

    // Pie Chart Data
    const expensesByCategory = filteredExpenses.reduce((acc: any, e) => {
        acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
        return acc;
    }, {});

    // Form State
    const [newExpense, setNewExpense] = useState<Partial<Expense>>({
        date: new Date().toISOString().split('T')[0],
        category: 'Nómina',
        type: 'fixed',
        amount: 0,
        paymentMethod: 'Transferencia',
        isRecurrent: false
    });

    const handleCreateExpense = async () => {
        if (!newExpense.amount || !newExpense.category) return;

        try {
            const { data: { user } } = await supabase.auth.getUser();

            // Try to find active shift for this user to link expense
            let shiftId = null;
            if (user) {
                const { data: shiftData } = await supabase.rpc('get_active_shift', { p_user_id: user.id });
                if (shiftData) shiftId = shiftData.id;
            }

            const expensePayload = {
                branch_id: newExpense.branchId || branchId,
                date: newExpense.date,
                category: newExpense.category,
                subcategory: newExpense.subcategory,
                amount: newExpense.amount,
                type: newExpense.type,
                description: newExpense.description,
                payment_method: newExpense.paymentMethod,
                is_recurrent: newExpense.isRecurrent,
                recurrence_frequency: newExpense.recurrenceFreq,
                shift_id: shiftId // Link to active shift if exists
            };

            const { data, error } = await supabase.from('expenses').insert(expensePayload).select().single();
            if (error) throw error;

            if (data) {
                const formatted: Expense = {
                    id: data.id,
                    branchId: data.branch_id,
                    date: data.date,
                    category: data.category,
                    subcategory: data.subcategory,
                    amount: data.amount,
                    type: data.type,
                    description: data.description,
                    paymentMethod: data.payment_method,
                    isRecurrent: data.is_recurrent,
                    recurrenceFreq: data.recurrence_frequency,
                    shiftId: data.shift_id
                };
                onAddExpense(formatted);
                setShowAddModal(false);
                setNewExpense({
                    date: new Date().toISOString().split('T')[0],
                    category: 'Nómina',
                    type: 'fixed',
                    amount: 0,
                    paymentMethod: 'Transferencia',
                    isRecurrent: false
                });
            }
        } catch (err: any) {
            alert("Error al registrar gasto: " + err.message);
        }
    };

    return (
        <div className="p-8 space-y-8 animate-fadeIn">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Gastos Operativos</h1>
                    <p className="text-slate-500 mt-1">Control financiero y análisis de rentabilidad.</p>
                </div>
                <div className="flex gap-4">
                    <div className="flex bg-white rounded-xl border border-slate-200 p-1">
                        <button onClick={() => setActiveTab('dashboard')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'dashboard' ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Dashboard</button>
                        <button onClick={() => setActiveTab('list')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'list' ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Listado</button>
                    </div>
                    <input type="month" className="bg-white border text-slate-700 border-slate-200 rounded-xl px-4 py-2 font-bold text-sm" value={`${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`} onChange={e => {
                        const [y, m] = e.target.value.split('-');
                        setCurrentDate(new Date(parseInt(y), parseInt(m) - 1, 1));
                    }} />
                    {branchId !== 'GLOBAL' && (
                        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-bold text-sm shadow-lg hover:bg-primary-light active:scale-95 transition-all">
                            <span className="material-icons-round">add</span> Registrar Gasto
                        </button>
                    )}
                </div>
            </header>

            {activeTab === 'dashboard' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <KPI label="Total Gastos Op." value={`$${totalOpExpenses.toFixed(2)}`} sub={`${((totalOpExpenses / totalSales || 0) * 100).toFixed(1)}% de Ventas`} color="text-red-500" />
                        <KPI label="Margen Operativo" value={`$${operatingProfit.toFixed(2)}`} sub={`${((operatingProfit / totalSales || 0) * 100).toFixed(1)}%`} color="text-emerald-500" />
                        <KPI label="Utilidad Neta Est." value={`$${netProfit.toFixed(2)}`} sub={`${((netProfit / totalSales || 0) * 100).toFixed(1)}%`} color="text-slate-800" />
                        <KPI label="Punto de Equilibrio" value={`$${Math.abs(breakEvenPoint).toFixed(2)}`} sub="Ventas Necesarias" color="text-blue-500" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <h3 className="font-bold text-lg text-slate-900 mb-6">Distribución de Gastos</h3>
                            <div className="space-y-4">
                                {Object.entries(expensesByCategory).map(([cat, amount]: any) => (
                                    <div key={cat} className="flex justify-between items-center">
                                        <span className="text-sm font-bold text-slate-600">{cat}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-mono font-bold text-slate-800">${amount.toFixed(2)}</span>
                                            <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-primary" style={{ width: `${(amount / totalOpExpenses) * 100}%` }}></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Visual Chart Placeholder - Simple CSS Bars for Category */}
                        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                            <h3 className="font-bold text-lg text-slate-900 mb-4">Rentabilidad vs Gastos</h3>
                            <div className="flex-1 flex items-end justify-around gap-4 px-4 pb-4 border-b border-slate-100 relative h-64">
                                {/* Simple Bar Chart: Sales vs Expenses vs Profit */}
                                <Bar label="Ventas" value={totalSales} max={totalSales} color="bg-blue-500" />
                                <Bar label="COGS" value={totalCOGS} max={totalSales} color="bg-orange-400" />
                                <Bar label="Gastos Op." value={totalOpExpenses} max={totalSales} color="bg-red-400" />
                                <Bar label="Utilidad Ops" value={operatingProfit} max={totalSales} color="bg-emerald-500" />
                            </div>
                        </div>
                    </div>

                    {/* Alerts Section */}
                    {(totalOpExpenses / totalSales) > 0.7 && (
                        <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700 font-bold">
                            <span className="material-icons-round">warning</span>
                            Alerta: Los gastos operativos superan el 70% de las ventas.
                        </div>
                    )}
                    {(expensesByCategory['Nómina'] / totalSales) > 0.4 && (
                        <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-center gap-3 text-amber-700 font-bold">
                            <span className="material-icons-round">people</span>
                            Alerta: La nómina supera el 40% de las ventas.
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'list' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 tracking-widest">
                            <tr>
                                <th className="px-6 py-4">Fecha</th>
                                {branchId === 'GLOBAL' && <th className="px-6 py-4">Sucursal</th>}
                                <th className="px-6 py-4">Categoría</th>
                                <th className="px-6 py-4">Descripción</th>
                                <th className="px-6 py-4">Tipo</th>
                                <th className="px-6 py-4 text-right">Monto</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredExpenses.map(e => (
                                <tr key={e.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 text-sm font-bold text-slate-700">{e.date}</td>
                                    {branchId === 'GLOBAL' && (
                                        <td className="px-6 py-4 text-xs font-bold text-slate-500 bg-slate-50/50">
                                            {branches?.find(b => b.id === e.branchId)?.name || 'Desconocida'}
                                        </td>
                                    )}
                                    <td className="px-6 py-4 text-sm font-bold text-slate-800">{e.category} <span className="text-xs font-normal text-slate-400 block">{e.subcategory}</span></td>
                                    <td className="px-6 py-4 text-sm text-slate-500">{e.description || '-'}</td>
                                    <td className="px-6 py-4"><span className="px-2 py-1 bg-slate-100 rounded text-[10px] font-black uppercase text-slate-500">{e.type}</span></td>
                                    <td className="px-6 py-4 text-right text-sm font-black text-slate-800 font-mono">${Number(e.amount).toFixed(2)}</td>
                                </tr>
                            ))}
                            {filteredExpenses.length === 0 && (
                                <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-400 font-bold">No hay gastos registrados en este periodo.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {showAddModal && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddModal(false)}></div>
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-scaleUp">
                        <header className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-slate-900">Registrar Gasto</h3>
                            <button onClick={() => setShowAddModal(false)}><span className="material-icons-round text-slate-400">close</span></button>
                        </header>
                        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fecha</label>
                                    <input type="date" className="w-full bg-slate-50 border-none rounded-xl px-4 py-2 font-bold text-sm" value={newExpense.date} onChange={e => setNewExpense({ ...newExpense, date: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Monto</label>
                                    <input type="number" className="w-full bg-slate-50 border-none rounded-xl px-4 py-2 font-bold text-sm" value={newExpense.amount} onChange={e => setNewExpense({ ...newExpense, amount: parseFloat(e.target.value) })} />
                                </div>
                            </div>

                            {branchId === 'GLOBAL' && (
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Sucursal</label>
                                    <select
                                        className="w-full bg-slate-50 border-none rounded-xl px-4 py-2 font-bold text-sm"
                                        value={newExpense.branchId || ''}
                                        onChange={e => setNewExpense({ ...newExpense, branchId: e.target.value })}
                                    >
                                        <option value="">Seleccione una sucursal</option>
                                        {branches.map(b => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Categoría</label>
                                <select className="w-full bg-slate-50 border-none rounded-xl px-4 py-2 font-bold text-sm" value={newExpense.category} onChange={e => setNewExpense({ ...newExpense, category: e.target.value })}>
                                    {['Nómina', 'Alquiler', 'Servicios Básicos', 'Logística', 'Mantenimiento', 'Marketing', 'Software', 'Administrativos', 'Impuestos', 'Financieros'].map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Subcategoría</label>
                                <input type="text" className="w-full bg-slate-50 border-none rounded-xl px-4 py-2 font-bold text-sm" placeholder="Ej. Luz, Agua..." value={newExpense.subcategory || ''} onChange={e => setNewExpense({ ...newExpense, subcategory: e.target.value })} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tipo</label>
                                    <select className="w-full bg-slate-50 border-none rounded-xl px-4 py-2 font-bold text-sm" value={newExpense.type} onChange={e => setNewExpense({ ...newExpense, type: e.target.value as any })}>
                                        <option value="fixed">Fijo</option>
                                        <option value="variable">Variable</option>
                                        <option value="semi-variable">Semi-variable</option>
                                        <option value="extraordinary">Extraordinario</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pago</label>
                                    <select className="w-full bg-slate-50 border-none rounded-xl px-4 py-2 font-bold text-sm" value={newExpense.paymentMethod} onChange={e => setNewExpense({ ...newExpense, paymentMethod: e.target.value })}>
                                        <option value="Efectivo">Efectivo</option>
                                        <option value="Transferencia">Transferencia</option>
                                        <option value="Tarjeta">Tarjeta</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Descripción</label>
                                <textarea className="w-full bg-slate-50 border-none rounded-xl px-4 py-2 font-bold text-sm h-20" value={newExpense.description || ''} onChange={e => setNewExpense({ ...newExpense, description: e.target.value })}></textarea>
                            </div>
                        </div>
                        <footer className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <button onClick={() => setShowAddModal(false)} className="px-6 py-2 rounded-xl font-bold text-slate-500 hover:bg-white hover:shadow transition-all">Cancelar</button>
                            <button onClick={handleCreateExpense} className="px-6 py-2 bg-primary text-white rounded-xl font-bold shadow-lg hover:bg-primary-light active:scale-95 transition-all">Guardar Gasto</button>
                        </footer>
                    </div>
                </div>
            )}
        </div>
    );
};

const KPI = ({ label, value, sub, color }: any) => (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <p className={`text-3xl font-black ${color} tracking-tight mb-1`}>{value}</p>
        <p className="text-xs font-bold text-slate-500">{sub}</p>
    </div>
);

const Bar = ({ label, value, max, color }: any) => {
    const height = max > 0 ? (value / max) * 100 : 0;
    return (
        <div className="flex flex-col items-center justify-end h-full gap-2 group w-16">
            <div className={`w-full rounded-t-xl transition-all relative group-hover:opacity-90 ${color}`} style={{ height: `${Math.max(height, 5)}%` }}>
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity font-bold whitespace-nowrap">
                    ${value.toFixed(0)}
                </div>
            </div>
            <span className="text-[10px] font-bold text-slate-500 uppercase">{label}</span>
        </div>
    );
};

export default ExpensesView;
