
import React, { useState, useMemo } from 'react';
import { Expense, Order, Ingredient, Plate } from '../types';
import { supabase } from '../supabaseClient';
import { usePlanFeatures, isFeatureEnabled } from '../hooks/usePlanFeatures';
import PlanUpgradeFullPage from '../components/PlanUpgradeFullPage';

interface ExpensesViewProps {
    expenses: Expense[];
    orders: Order[];
    ingredients: Ingredient[];
    plates: Plate[];
    onAddExpense: (exp: Expense) => void;
    branchId: string | 'GLOBAL' | null;
    branches?: any[];
    restaurantId?: string | null;
}

const ExpensesView: React.FC<ExpensesViewProps> = ({ expenses = [], orders = [], ingredients = [], plates = [], onAddExpense, branchId, branches = [], restaurantId }) => {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'list'>('dashboard');
    const [showAddModal, setShowAddModal] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date());

    const { data: planData } = usePlanFeatures(restaurantId || undefined);
    const isPlanOperativo = !isFeatureEnabled(planData, 'ENABLE_NET_PROFIT_CALCULATION');

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
    const operatingProfit = (totalSales - totalCOGS) - totalOpExpenses;
    const netProfit = operatingProfit;

    const fixedExpenses = filteredExpenses.filter(e => e.type === 'fixed').reduce((acc, e) => acc + Number(e.amount), 0);
    const variableExpenses = filteredExpenses.filter(e => e.type === 'variable').reduce((acc, e) => acc + Number(e.amount), 0) + totalCOGS;

    const breakEvenPoint = totalSales > 0 && (totalSales - variableExpenses) !== 0
        ? fixedExpenses / ((totalSales - variableExpenses) / totalSales)
        : 0;

    const expensesByCategory = filteredExpenses.reduce((acc: any, e) => {
        acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
        return acc;
    }, {});

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
            if (!user) return;

            const targetBranchId = newExpense.branchId || (branchId !== 'GLOBAL' ? branchId : null);

            if (!targetBranchId) {
                alert("Por favor, seleccione una sucursal para registrar el gasto.");
                return;
            }

            const { data, error } = await supabase.rpc('record_operational_expense', {
                p_branch_id: targetBranchId,
                p_category: newExpense.category,
                p_amount: newExpense.amount,
                p_payment_method: newExpense.paymentMethod,
                p_description: newExpense.description || null,
                p_user_id: user.id
            });

            if (error) throw error;
            if (data) {
                const { data: fullRecord, error: fetchErr } = await supabase.from('expenses').select('*').eq('id', data.id).single();
                if (fetchErr) throw fetchErr;

                const formatted: Expense = {
                    id: fullRecord.id,
                    branchId: fullRecord.branch_id,
                    date: fullRecord.date,
                    category: fullRecord.category,
                    subcategory: fullRecord.subcategory,
                    amount: fullRecord.amount,
                    type: fullRecord.type,
                    description: fullRecord.description,
                    paymentMethod: fullRecord.payment_method,
                    isRecurrent: fullRecord.is_recurrent,
                    recurrenceFreq: fullRecord.recurrence_frequency,
                    shiftId: fullRecord.shift_id
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

    if (isPlanOperativo) {
        return <PlanUpgradeFullPage featureName="Gastos Operativos" description="El control financiero avanzado, análisis de COGS y estados de resultados pro-forma están disponibles en planes superiores. Toma decisiones basadas en datos financieros precisos." />;
    }

    return (
        <>
            <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-10 space-y-6 sm:space-y-10 animate-fade-in font-sans pb-24 xl:pb-0">
                {/* Header Premium */}
                <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
                            <span className="material-icons-round text-white text-2xl sm:text-3xl">account_balance</span>
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate">Gastos Operativos</h1>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-0.5 truncate">Dashboard de Rentabilidad</p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-4 w-full lg:w-auto">
                        <div className="bg-slate-100 p-1 rounded-full flex items-center self-start">
                            <button
                                onClick={() => setActiveTab('dashboard')}
                                className={`px-4 sm:px-6 py-2 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'dashboard' ? 'bg-primary text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
                            >
                                Dashboard
                            </button>
                            <button
                                onClick={() => setActiveTab('list')}
                                className={`px-4 sm:px-6 py-2 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'list' ? 'bg-primary text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
                            >
                                Listado
                            </button>
                        </div>

                        <div className="relative group flex items-center">
                            <input
                                type="month"
                                className="w-full sm:w-auto bg-white border border-slate-200 rounded-2xl px-5 py-2.5 text-xs font-bold text-slate-700 outline-none cursor-pointer"
                                value={`${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`}
                                onChange={e => {
                                    const [y, m] = e.target.value.split('-');
                                    setCurrentDate(new Date(parseInt(y), parseInt(m) - 1, 1));
                                }}
                            />
                        </div>

                        <button
                            onClick={() => setShowAddModal(true)}
                            className="bg-primary text-white hover:bg-primary-dark transition-all px-6 sm:px-8 py-3 rounded-2xl shadow-xl shadow-primary/20 font-black text-[10px] sm:text-[11px] uppercase tracking-widest flex items-center justify-center gap-2"
                        >
                            <span className="material-icons-round text-base">add</span> Registrar Gasto
                        </button>

                        <button className="hidden lg:flex w-12 h-12 bg-white border border-slate-200 rounded-2xl items-center justify-center text-slate-400 hover:text-primary transition-all shadow-sm">
                            <span className="material-icons-round text-xl">dark_mode</span>
                        </button>
                    </div>
                </header>

                {activeTab === 'dashboard' ? (
                    <div className="space-y-6 sm:space-y-10">
                        {/* KPI High Fidelity */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                            <FinancialKPI
                                label="Total Gastos Op."
                                value={totalOpExpenses}
                                sub={`${((totalOpExpenses / totalSales || 0) * 100).toFixed(1)}% de Ventas Netas`}
                                badge="CRÍTICO"
                                color="text-red-500"
                                barColor="bg-red-500"
                            />
                            <FinancialKPI
                                label="Margen Operativo"
                                value={operatingProfit}
                                sub={`${((operatingProfit / totalSales || 0) * 100).toFixed(1)}% Variación Mensual`}
                                badge="TENDENCIA"
                                color="text-emerald-500"
                                barColor="bg-emerald-500"
                                prefix={operatingProfit < 0 ? '-' : ''}
                            />
                            <FinancialKPI
                                label="Utilidad Neta Est."
                                value={netProfit}
                                sub={`${((netProfit / totalSales || 0) * 100) > 0 ? '+' : ''}${((netProfit / totalSales || 0) * 100).toFixed(1)}% vs Presupuesto`}
                                badge="PROYECCIÓN"
                                color="text-slate-800"
                                barColor="bg-slate-300"
                            />
                            <FinancialKPI
                                label="Punto de Equilibrio"
                                value={Math.abs(breakEvenPoint)}
                                sub="Ventas Necesarias para Break-even"
                                badge="META"
                                color="text-primary"
                                barColor="bg-primary"
                            />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                            {/* Left Column: Distribution */}
                            <div className="lg:col-span-4 bg-white p-6 sm:p-10 rounded-[28px] sm:rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden">
                                <div className="flex justify-between items-center mb-6 sm:mb-10">
                                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Distribución de Gastos</h3>
                                    <button className="p-2 hover:bg-slate-50 rounded-full transition-colors">
                                        <span className="material-icons-round text-primary">more_vert</span>
                                    </button>
                                </div>

                                {/* Central Circle Metric */}
                                <div className="relative w-56 h-56 mx-auto mb-12 flex items-center justify-center">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle cx="112" cy="112" r="100" fill="transparent" stroke="#f1f5f9" strokeWidth="16" />
                                        <circle cx="112" cy="112" r="100" fill="transparent" stroke="url(#expenseGradient)" strokeWidth="20" strokeDasharray="400, 628" strokeLinecap="round" />
                                        <defs>
                                            <linearGradient id="expenseGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#ef4444" />
                                                <stop offset="100%" stopColor="#3b82f6" />
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <p className="text-4xl font-black text-slate-900 tracking-tighter">${(totalOpExpenses / 1000).toFixed(1)}k</p>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TOTAL</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {Object.entries(expensesByCategory).sort((a: any, b: any) => b[1] - a[1]).map(([cat, amount]: any, idx) => (
                                        <div key={cat} className="flex justify-between items-center group">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-3 h-3 rounded-full shadow-sm ${idx === 0 ? 'bg-blue-500' : idx === 1 ? 'bg-primary-light' : idx === 2 ? 'bg-orange-400' : 'bg-slate-300'}`}></div>
                                                <span className="text-[13px] font-bold text-slate-600 transition-colors group-hover:text-slate-900">{cat}</span>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[13px] font-black text-slate-900tracking-tight">${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{((amount / totalOpExpenses) * 100).toFixed(1)}%</p>
                                            </div>
                                        </div>
                                    ))}
                                    {filteredExpenses.length === 0 && (
                                        <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest py-10">Sin datos registrados</p>
                                    )}
                                </div>
                            </div>

                            {/* Right Column: Comparison & Analysis */}
                            <div className="lg:col-span-8 bg-white p-6 sm:p-10 rounded-[28px] sm:rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col h-full overflow-hidden">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                                    <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">Rentabilidad vs Gastos</h3>
                                    <div className="flex flex-wrap gap-4">
                                        <LegendItem color="bg-[#2563eb]" label="Ventas" />
                                        <LegendItem color="bg-[#f97316]" label="COGS" />
                                        <LegendItem color="bg-[#f43f5e]" label="Gastos" />
                                    </div>
                                </div>
                                <p className="text-sm text-slate-400 font-medium mb-16">Comparativa mensual de flujos financieros</p>

                                <div className="flex-1 relative min-h-[400px]">
                                    {/* Y-Axis Labels and Grid Lines */}
                                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                                        {[15000, 10000, 5000, 0].map((val) => (
                                            <div key={val} className="w-full flex items-center gap-4">
                                                <span className="text-[10px] font-bold text-slate-300 w-10 text-right">${val >= 1000 ? `${val / 1000}k` : val}</span>
                                                <div className="flex-1 h-[1px] bg-slate-100/60"></div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Bars Container */}
                                    <div className="absolute inset-0 flex items-end justify-around px-10 pb-12 gap-8">
                                        <FinancialBar label="VENTAS" value={totalSales} max={15000} color="bg-[#2563eb]" />
                                        <FinancialBar label="COGS" value={totalCOGS} max={15000} color="bg-[#f97316]" />
                                        <FinancialBar label="GASTOS OP." value={totalOpExpenses} max={15000} color="bg-[#f43f5e]" />
                                        <FinancialBar label="UTILIDAD OPS" value={operatingProfit} max={15000} color="bg-[#10b981]" isProfit />
                                    </div>

                                    {/* Horizontal Dotted Equilibrium Line (Optional but useful) */}
                                    {breakEvenPoint > 0 && breakEvenPoint < 15000 && (
                                        <div className="absolute w-full border-t-2 border-dashed border-blue-400/20 pointer-events-none" style={{ bottom: `${(breakEvenPoint / 15000 * 100) + 12}%` }}>
                                        </div>
                                    )}
                                </div>

                                {/* Insight Box */}
                                <div className="mt-10 p-8 bg-blue-50/50 rounded-3xl border border-blue-100 flex items-start gap-6">
                                    <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
                                        <span className="material-icons-round text-2xl">bar_chart</span>
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-[13px] font-black text-primary uppercase tracking-widest">Insight de Rendimiento</h4>
                                        <p className="text-xs text-slate-600 font-medium leading-relaxed">
                                            {operatingProfit < 0 ?
                                                `Sus gastos operativos exceden el margen bruto. Se recomienda revisar los costos de nómina y servicios básicos, los cuales representan una carga significativa en el presupuesto actual.`
                                                : `Operación saludable. El margen operativo actual permite una reinversión estratégica en marketing y mantenimiento preventivo.`}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-[28px] sm:rounded-[40px] border border-slate-100 shadow-xl overflow-x-auto custom-scrollbar animate-fade-in">
                        <table className="w-full text-left min-w-[800px]">
                            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                                <tr>
                                    <th className="px-6 sm:px-10 py-4 sm:py-6">Fecha</th>
                                    {branchId === 'GLOBAL' && <th>Sucursal</th>}
                                    <th>Categoría</th>
                                    <th>Descripción</th>
                                    <th>Método de Pago</th>
                                    <th className="px-6 sm:px-10 py-4 sm:py-6 text-right">Monto</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredExpenses.map(e => (
                                    <tr key={e.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 sm:px-10 py-4 sm:py-5 text-xs font-bold text-slate-600">{new Date(e.date).toLocaleDateString()}</td>
                                        {branchId === 'GLOBAL' && (
                                            <td>
                                                <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
                                                    {branches?.find(b => b.id === e.branchId)?.name || 'Sucursal'}
                                                </span>
                                            </td>
                                        )}
                                        <td>
                                            <p className="text-sm font-black text-slate-900 tracking-tight">{e.category}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase">{e.subcategory || 'General'}</p>
                                        </td>
                                        <td className="text-xs font-medium text-slate-500">{e.description || '-'}</td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <span className="material-icons-round text-slate-300 text-sm">payment</span>
                                                <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{e.paymentMethod}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 sm:px-10 py-4 sm:py-5 text-right font-black text-slate-900 font-heading text-base sm:text-lg">${Number(e.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <footer className="pt-10 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">© 2026 RESTOGESTIÓN S.A. - ERP Gastronómico Profesional</p>
                    <div className="flex gap-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <a href="#" className="hover:text-primary transition-colors">Términos</a>
                        <a href="#" className="hover:text-primary transition-colors">Privacidad</a>
                        <a href="#" className="hover:text-primary transition-colors">Soporte Técnico</a>
                    </div>
                </footer>
            </div>

            {showAddModal && (
                <ExpenseModal
                    onClose={() => setShowAddModal(false)}
                    onSave={handleCreateExpense}
                    newExpense={newExpense}
                    setNewExpense={setNewExpense}
                    branches={branches}
                    branchId={branchId}
                />
            )}
        </>
    );
};

// Sub-components
const FinancialKPI = ({ label, value, sub, badge, color, barColor, prefix = '$' }: any) => (
    <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-lg shadow-slate-200/40 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
        <div className="flex justify-between items-center mb-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
            <span className={`px-2 py-0.5 rounded text-[8px] font-black tracking-widest bg-slate-50 border border-slate-100 text-slate-400 group-hover:border-primary/20 group-hover:bg-primary/5 group-hover:text-primary transition-all`}>{badge}</span>
        </div>
        <h3 className={`text-4xl font-heading font-black tracking-tighter ${color} mb-1`}>{prefix}{Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{sub}</p>
        <div className="mt-8 h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
            <div className={`h-full ${barColor} w-2/3 transition-all duration-1000 animate-slideIn`} />
        </div>
    </div>
);

const LegendItem = ({ color, label }: any) => (
    <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${color}`}></div>
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
    </div>
);

const FinancialBar = ({ label, value, max, color, isProfit }: any) => {
    const height = max > 0 ? (Math.min(Math.abs(value), max) / max) * 100 : 0;
    return (
        <div className="flex flex-col items-center justify-end h-full gap-4 relative group flex-1 max-w-[100px]">
            <div
                className={`w-full rounded-t-[32px] transition-all duration-1000 delay-300 relative hover:brightness-110 active:scale-95 shadow-lg ${color} ${value < 0 ? 'opacity-40' : ''}`}
                style={{ height: `${Math.max(height, 2)}%` }}
            >
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-black py-1.5 px-3 rounded-xl opacity-0 group-hover:opacity-100 transition-all shadow-xl whitespace-nowrap z-20">
                    ${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </div>
            </div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center leading-tight whitespace-nowrap mt-2">{label}</span>
            {isProfit && value < 0 && (
                <div className="absolute -top-6 w-full text-center">
                    <span className="material-icons-round text-red-500 text-xl animate-bounce">trending_down</span>
                </div>
            )}
        </div>
    );
};

const ExpenseModal = ({ onClose, onSave, newExpense, setNewExpense, branches, branchId }: any) => (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-[4px] animate-fade-in">
        <div className="relative bg-white w-full max-w-lg rounded-[40px] border border-slate-100 shadow-2xl animate-fade-in flex flex-col max-h-[90vh] overflow-hidden">
            <header className="p-10 border-b border-slate-50 flex justify-between items-start bg-slate-50/30 relative">
                <div className="flex gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-3xl shadow-sm"><span className="material-icons-round">receipt_long</span></div>
                    <div className="pt-1">
                        <h2 className="text-2xl font-black text-brand-black tracking-tight">Registrar Gasto</h2>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Egreso Operativo del Periodo</p>
                    </div>
                </div>
                <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-slate-100 text-slate-400 hover:text-primary transition-all shadow-sm">
                    <span className="material-icons-round">close</span>
                </button>
            </header>

            <div className="p-10 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-2">Fecha del Gasto</label>
                        <input type="date" className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-5 py-3.5 font-bold text-sm focus:ring-4 focus:ring-primary/5 outline-none transition-all" value={newExpense.date} onChange={e => setNewExpense({ ...newExpense, date: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-2">Monto Solicitado</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                            <input type="number" className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-10 pr-5 py-3.5 font-black text-lg focus:ring-4 focus:ring-primary/5 outline-none transition-all" value={newExpense.amount} onChange={e => setNewExpense({ ...newExpense, amount: parseFloat(e.target.value) })} />
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-2">Centro de Costo / Categoría</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <select className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-5 py-3.5 font-bold text-sm appearance-none cursor-pointer focus:ring-4 focus:ring-primary/5 outline-none transition-all" value={newExpense.category} onChange={e => setNewExpense({ ...newExpense, category: e.target.value })}>
                            {['Nómina', 'Alquiler', 'Servicios Básicos', 'Logística', 'Mantenimiento', 'Marketing', 'Software', 'Administrativos', 'Impuestos', 'Financieros'].map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                        {branchId === 'GLOBAL' && (
                            <select
                                className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl px-5 py-3.5 font-bold text-sm appearance-none cursor-pointer focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                                value={newExpense.branchId || ''}
                                onChange={e => setNewExpense({ ...newExpense, branchId: e.target.value })}
                            >
                                <option value="">Seleccionar Sucursal</option>
                                {branches.map((b: any) => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-2">Tipo de Egreso</label>
                        <select className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-5 py-3.5 font-bold text-sm appearance-none cursor-pointer focus:ring-4 focus:ring-primary/5 outline-none transition-all" value={newExpense.type} onChange={e => setNewExpense({ ...newExpense, type: e.target.value as any })}>
                            <option value="fixed">Gasto Fijo</option>
                            <option value="variable">Gasto Variable</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-2">Medio de Pago</label>
                        <select className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-5 py-3.5 font-bold text-sm appearance-none cursor-pointer focus:ring-4 focus:ring-primary/5 outline-none transition-all" value={newExpense.paymentMethod} onChange={e => setNewExpense({ ...newExpense, paymentMethod: e.target.value })}>
                            <option value="Transferencia">Transferencia</option>
                            <option value="Efectivo">Efectivo</option>
                            <option value="Tarjeta">Tarjeta</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-2">Detalles / Notas Adicionales</label>
                    <textarea className="w-full bg-slate-50/50 border border-slate-100 rounded-3xl px-6 py-4 font-medium text-sm focus:ring-4 focus:ring-primary/5 outline-none transition-all h-28" placeholder="Describa el motivo del gasto..." value={newExpense.description || ''} onChange={e => setNewExpense({ ...newExpense, description: e.target.value })}></textarea>
                </div>
            </div>

            <footer className="p-10 border-t border-slate-50 bg-slate-50/30 flex justify-between items-center shrink-0">
                <button onClick={onClose} className="px-10 py-4 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">Cancelar</button>
                <button onClick={onSave} className="bg-primary text-white hover:bg-primary-dark transition-all px-12 py-4 rounded-2xl shadow-xl shadow-primary/30 font-black text-xs uppercase tracking-widest">Confirmar Registro</button>
            </footer>
        </div>
    </div>
);

export default ExpensesView;
