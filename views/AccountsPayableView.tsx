import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { User, Branch, AccountsPayable } from '../types';
import { useCashSession } from '../hooks/useCashSession';

interface AccountsPayableViewProps {
    currentUser: User | null;
    branches: Branch[];
    branchId: string | 'GLOBAL' | null;
}

interface AccountsPayableHydrated extends AccountsPayable {
    supplier_name?: string;
    branch_name?: string;
    invoice_number?: string;
}

const AccountsPayableView: React.FC<AccountsPayableViewProps> = ({ currentUser, branches, branchId }) => {
    const [payables, setPayables] = useState<AccountsPayableHydrated[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPayable, setSelectedPayable] = useState<AccountsPayableHydrated | null>(null);

    // Form State
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

    const targetBranch = branchId === 'GLOBAL' ? null : (branchId || currentUser?.branchId || null);
    const { session: currentSession } = useCashSession(targetBranch);

    useEffect(() => {
        fetchPayables();
    }, [branchId]);

    const fetchPayables = async () => {
        setLoading(true);
        try {
            let query = supabase.from('accounts_payable').select(`
                *,
                suppliers ( name ),
                branches ( name ),
                supplier_invoices ( invoice_number )
            `).order('created_at', { ascending: false });

            if (branchId && branchId !== 'GLOBAL') {
                query = query.eq('branch_id', branchId);
            }

            const { data, error } = await query;
            if (error) throw error;

            setPayables((data || []).map((p: any) => ({
                ...p,
                supplier_name: p.suppliers?.name,
                branch_name: p.branches?.name,
                invoice_number: p.supplier_invoices?.invoice_number
            })));
        } catch (err: any) {
            console.error('Error fetching payables:', err.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePayDebt = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser || !selectedPayable) return;

        if (!currentSession) {
            return alert('Debe tener una sesión de caja abierta para liquidar una deuda en EFECTIVO.');
        }

        setLoading(true);
        try {
            const { data: paymentId, error } = await supabase.rpc('pay_accounts_payable', {
                p_ap_id: selectedPayable.id,
                p_amount: selectedPayable.amount,
                p_payment_method: 'Efectivo',
                p_payment_date: paymentDate,
                p_cash_session_id: currentSession.id,
                p_user_id: currentUser.id
            });

            if (error) throw error;

            alert('Pago registrado con éxito. La deuda ha sido liquidada.');
            setIsModalOpen(false);
            setSelectedPayable(null);
            fetchPayables();
        } catch (err: any) {
            alert('Error al liquidar deuda: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const openPaymentModal = (payable: AccountsPayableHydrated) => {
        setSelectedPayable(payable);
        setIsModalOpen(true);
    };

    return (
        <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 animate-fadeIn max-w-[1200px] mx-auto pb-20 font-sans">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 shadow-sm shrink-0">
                        <span className="material-icons-round text-xl sm:text-2xl">account_balance_wallet</span>
                    </div>
                    <div>
                        <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-tight">Cuentas por Pagar</h1>
                        <p className="text-[10px] sm:text-xs text-slate-400 font-medium">Gestión de deudas y liquidaciones.</p>
                    </div>
                </div>
            </header>

            {/* Payables Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px]">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Estado</th>
                                <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Proveedor</th>
                                <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Factura #</th>
                                <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Monto</th>
                                <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Vencimiento</th>
                                <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {payables.map(p => (
                                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${p.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700 animate-pulse'}`}>
                                            {p.status === 'PAID' ? 'Pagado' : 'Pendiente'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-slate-700">{p.supplier_name}</td>
                                    <td className="px-6 py-4 font-mono text-sm text-indigo-600">{p.invoice_number}</td>
                                    <td className="px-6 py-4 font-black text-slate-900">${p.amount.toLocaleString()}</td>
                                    <td className={`px-6 py-4 text-sm font-bold ${new Date(p.due_date) < new Date() && p.status === 'PENDING' ? 'text-rose-500' : 'text-slate-500'}`}>
                                        {new Date(p.due_date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        {p.status === 'PENDING' ? (
                                            <button
                                                onClick={() => openPaymentModal(p)}
                                                className="bg-amber-100 hover:bg-amber-200 text-amber-700 px-4 py-2 rounded-lg text-xs font-black flex items-center gap-1 transition-all"
                                            >
                                                <span className="material-icons-round text-sm">payments</span> Liquidar
                                            </button>
                                        ) : (
                                            <span className="text-emerald-500 flex items-center gap-1 text-xs font-bold">
                                                <span className="material-icons-round text-sm">check_circle</span> Saldado
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {payables.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="py-20 text-center text-slate-400">
                                        <span className="material-icons-round text-5xl block mb-2 opacity-20">credit_score</span>
                                        <p className="font-bold">No hay cuentas por pagar registradas.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Payment Modal */}
            {isModalOpen && selectedPayable && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-white/20 max-h-[90vh] flex flex-col">
                        <div className="p-6 bg-amber-50 border-b border-amber-100 flex justify-between items-center shrink-0">
                            <h2 className="text-xl font-black text-amber-800 flex items-center gap-2">
                                <span className="material-icons-round">payments</span> Liquidar Deuda
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-amber-400 hover:text-amber-600">
                                <span className="material-icons-round">close</span>
                            </button>
                        </div>
                        <form onSubmit={handlePayDebt} className="p-8 space-y-6 overflow-y-auto flex-1">
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 italic text-sm text-slate-600">
                                Estás liquidando un monto de <strong className="text-slate-900">${selectedPayable.amount.toLocaleString()}</strong> correspondiente a la factura <strong>#{selectedPayable.invoice_number}</strong> de <strong>{selectedPayable.supplier_name}</strong>.
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Fecha de Pago (Impacto en Caja)</label>
                                    <input
                                        required
                                        type="date"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700"
                                        value={paymentDate}
                                        onChange={e => setPaymentDate(e.target.value)}
                                    />
                                    <p className="text-[10px] text-slate-400 mt-1">Esta fecha determinará en qué snapshot financiero se registra el egreso.</p>
                                </div>

                                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                                    <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                                        <span className="material-icons-round text-lg">account_balance</span>
                                        Pago vía Caja Chica / Mayor
                                    </div>
                                    <p className="text-[10px] text-emerald-600 mt-1">
                                        El monto se descontará automáticamente de la sesión de caja abierta actual:
                                        {currentSession ? <strong className="ml-1">#{currentSession.id.substring(0, 8)}</strong> : <strong className="text-rose-500 ml-1">SIN SESIÓN ACTIVA</strong>}
                                    </p>
                                </div>
                            </div>

                            <div className="pt-2">
                                <button
                                    disabled={loading || !currentSession}
                                    type="submit"
                                    className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 text-white py-4 rounded-2xl font-black shadow-xl shadow-amber-200 transition-all flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <span className="material-icons-round animate-spin">refresh</span>
                                    ) : (
                                        <span className="material-icons-round">verified</span>
                                    )}
                                    {loading ? 'Procesando...' : 'Confirmar Pago y Cerrar Deuda'}
                                </button>
                                {!currentSession && (
                                    <p className="text-[10px] text-rose-500 font-bold mt-2 text-center">
                                        Requiere una sesión de caja abierta.
                                    </p>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AccountsPayableView;
