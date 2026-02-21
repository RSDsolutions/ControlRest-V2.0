import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { User, Branch, Supplier, PurchaseOrder, SupplierInvoice } from '../types';
import { useCashSession } from '../hooks/useCashSession';

interface SupplierInvoicesViewProps {
    currentUser: User | null;
    branches: Branch[];
    branchId: string | 'GLOBAL' | null;
}

const SupplierInvoicesView: React.FC<SupplierInvoicesViewProps> = ({ currentUser, branches, branchId }) => {
    const [invoices, setInvoices] = useState<SupplierInvoice[]>([]);
    const [receivedPOs, setReceivedPOs] = useState<PurchaseOrder[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [form, setForm] = useState({
        supplierId: '',
        purchaseOrderId: '',
        invoiceNumber: '',
        totalAmount: 0,
        paymentType: 'CASH' as 'CASH' | 'CREDIT',
        invoiceDate: new Date().toISOString().split('T')[0],
        dueDate: ''
    });

    const { session: currentSession } = useCashSession(branchId === 'GLOBAL' ? null : (branchId || currentUser?.branchId || null));

    useEffect(() => {
        fetchInvoices();
        fetchReceivedPOs();
        fetchSuppliers();
    }, [branchId]);

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            let query = supabase.from('supplier_invoices').select(`
                *,
                suppliers ( name ),
                branches ( name )
            `).order('created_at', { ascending: false });

            if (branchId && branchId !== 'GLOBAL') {
                query = query.eq('branch_id', branchId);
            }

            const { data, error } = await query;
            if (error) throw error;

            setInvoices((data || []).map((inv: any) => ({
                ...inv,
                supplier_name: inv.suppliers?.name,
                branch_name: inv.branches?.name
            })));
        } catch (err: any) {
            console.error('Error fetching invoices:', err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchReceivedPOs = async () => {
        try {
            // Find POs that are 'received' but NOT yet in supplier_invoices
            // (Strictly we could allow multiple invoices per PO, but usually it's 1:1)
            const { data: invoicedPOIds } = await supabase.from('supplier_invoices').select('purchase_order_id');
            const excludedIds = (invoicedPOIds || []).map(i => i.purchase_order_id).filter(Boolean);

            let query = supabase.from('purchase_orders')
                .select('*, suppliers(name)')
                .eq('status', 'received');

            if (branchId && branchId !== 'GLOBAL') {
                query = query.eq('branch_id', branchId);
            }

            if (excludedIds.length > 0) {
                query = query.not('id', 'in', `(${excludedIds.join(',')})`);
            }

            const { data, error } = await query;
            if (error) throw error;

            setReceivedPOs((data || []).map((po: any) => ({
                ...po,
                supplier_name: po.suppliers?.name
            })));
        } catch (err: any) {
            console.error('Error fetching POs:', err.message);
        }
    };

    const fetchSuppliers = async () => {
        try {
            const { data, error } = await supabase.from('suppliers').select('*').eq('status', 'active');
            if (error) throw error;
            setSuppliers(data || []);
        } catch (err: any) {
            console.error('Error fetching suppliers:', err.message);
        }
    };

    const handleRegisterInvoice = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;

        const targetBranchId = branchId !== 'GLOBAL' ? branchId : receivedPOs.find(po => po.id === form.purchaseOrderId)?.branch_id;
        if (!targetBranchId) return alert('Seleccione una sucursal o una orden de compra.');

        if (form.paymentType === 'CASH' && !currentSession) {
            return alert('Debe tener una sesión de caja abierta para registrar un pago en EFECTIVO.');
        }

        setLoading(true);
        try {
            const { data: invoiceId, error } = await supabase.rpc('register_supplier_invoice', {
                p_branch_id: targetBranchId,
                p_supplier_id: form.supplierId,
                p_purchase_order_id: form.purchaseOrderId || null,
                p_invoice_number: form.invoiceNumber,
                p_total_amount: form.totalAmount,
                p_payment_terms: form.paymentType === 'CASH' ? 'contado' : 'credito',
                p_invoice_date: form.invoiceDate,
                p_due_date: form.paymentType === 'CREDIT' ? form.dueDate : null,
                p_cash_session_id: form.paymentType === 'CASH' ? currentSession?.id : null,
                p_user_id: currentUser.id,
                p_items: [] // Optional items array
            });

            if (error) throw error;

            alert('Factura registrada con éxito.');
            setIsModalOpen(false);
            setForm({
                supplierId: '',
                purchaseOrderId: '',
                invoiceNumber: '',
                totalAmount: 0,
                paymentType: 'CASH',
                invoiceDate: new Date().toISOString().split('T')[0],
                dueDate: ''
            });
            fetchInvoices();
            fetchReceivedPOs();
        } catch (err: any) {
            alert('Error al registrar factura: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const onSelectPO = (poId: string) => {
        const po = receivedPOs.find(p => p.id === poId);
        if (po) {
            // Auto-fill from PO
            setForm(prev => ({
                ...prev,
                purchaseOrderId: poId,
                supplierId: po.supplier_id || '',
                // Calculate total from items if available (simplified)
            }));

            // In a real scenario, we'd fetch PO items to get total.
            // But let's assume user enters total from physical invoice.
        }
    };

    return (
        <div className="p-6 space-y-6 animate-fadeIn max-w-[1200px] mx-auto pb-20">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <span className="material-icons-round text-indigo-600">receipt</span> Facturas de Proveedores
                    </h1>
                    <p className="text-slate-500 font-medium">Registro contable y cuentas por pagar.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all"
                >
                    <span className="material-icons-round">add_circle</span> Registrar Factura
                </button>
            </header>

            {/* Invoices Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Fecha Factura</th>
                            <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Nº Factura</th>
                            <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Proveedor</th>
                            <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Monto</th>
                            <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Tipo Pago</th>
                            <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Sucursal</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {invoices.map(inv => (
                            <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 font-bold text-slate-700">
                                    {new Date(inv.invoice_date).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 font-mono text-sm text-indigo-600">{inv.invoice_number}</td>
                                <td className="px-6 py-4 text-slate-600 font-medium">{inv.supplier_name}</td>
                                <td className="px-6 py-4 font-black text-slate-900">${inv.total_amount.toLocaleString()}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${inv.payment_type === 'CASH' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {inv.payment_type === 'CASH' ? 'Efectivo' : 'Crédito'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-xs text-slate-400">{inv.branch_name}</td>
                            </tr>
                        ))}
                        {invoices.length === 0 && (
                            <tr>
                                <td colSpan={6} className="py-20 text-center text-slate-400">
                                    <span className="material-icons-round text-5xl block mb-2 opacity-20">history_edu</span>
                                    <p className="font-bold">No hay facturas registradas todavía.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Reset Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-white/20 max-h-[90vh] flex flex-col">
                        <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center shrink-0">
                            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                                <span className="material-icons-round text-indigo-600">post_add</span> Nueva Factura Fiscal
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <span className="material-icons-round">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleRegisterInvoice} className="p-8 space-y-4 overflow-y-auto flex-1">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Orden de Compra Relacionada</label>
                                    <select
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700"
                                        value={form.purchaseOrderId}
                                        onChange={e => onSelectPO(e.target.value)}
                                    >
                                        <option value="">Seleccione OC Recibida (Opcional)</option>
                                        {receivedPOs.map(po => (
                                            <option key={po.id} value={po.id}>{po.supplier_name} - {new Date(po.created_at).toLocaleDateString()}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Proveedor</label>
                                    <select
                                        required
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700"
                                        value={form.supplierId}
                                        onChange={e => setForm({ ...form, supplierId: e.target.value })}
                                    >
                                        <option value="">Seleccione Proveedor</option>
                                        {suppliers.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Nº Factura</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="001-001-..."
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700"
                                        value={form.invoiceNumber}
                                        onChange={e => setForm({ ...form, invoiceNumber: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Monto TOTAL</label>
                                    <input
                                        required
                                        type="number"
                                        step="any"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700"
                                        value={form.totalAmount || ''}
                                        onChange={e => setForm({ ...form, totalAmount: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Fecha Factura</label>
                                    <input
                                        required
                                        type="date"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700"
                                        value={form.invoiceDate}
                                        onChange={e => setForm({ ...form, invoiceDate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Tipo de Pago</label>
                                    <select
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700"
                                        value={form.paymentType}
                                        onChange={e => setForm({ ...form, paymentType: e.target.value as any })}
                                    >
                                        <option value="CASH">Efectivo (Impacta Caja)</option>
                                        <option value="CREDIT">Crédito (Cuentas por Pagar)</option>
                                    </select>
                                </div>
                                {form.paymentType === 'CREDIT' && (
                                    <div className="col-span-2">
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1 text-amber-600">Fecha de Vencimiento (Pago)</label>
                                        <input
                                            required
                                            type="date"
                                            className="w-full bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 font-bold text-slate-700"
                                            value={form.dueDate}
                                            onChange={e => setForm({ ...form, dueDate: e.target.value })}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="pt-4">
                                <button
                                    disabled={loading}
                                    type="submit"
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-black shadow-xl shadow-indigo-200 transition-all flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <span className="material-icons-round animate-spin">refresh</span>
                                    ) : (
                                        <span className="material-icons-round">verified</span>
                                    )}
                                    {loading ? 'Registrando...' : 'Confirmar e Impactar Contabilidad'}
                                </button>
                                {form.paymentType === 'CASH' && !currentSession && (
                                    <p className="text-[10px] text-rose-500 font-bold mt-2 flex items-center gap-1">
                                        <span className="material-icons-round text-xs">warning</span> No hay sesión de caja activa. No podrá registrar pagos en efectivo.
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

export default SupplierInvoicesView;
