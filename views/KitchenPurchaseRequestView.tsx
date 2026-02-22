import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { PurchaseOrder, Ingredient, User } from '../types';

interface Props {
    branchId: string | null;
    currentUser: User | null;
}

const statusColor = (status: PurchaseOrder['status']) => {
    switch (status) {
        case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
        case 'approved': return 'bg-blue-100 text-blue-700 border-blue-200';
        case 'received': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
        default: return 'bg-slate-100 text-slate-500';
    }
};

const KitchenPurchaseRequestView: React.FC<Props> = ({ branchId, currentUser }) => {
    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [loading, setLoading] = useState(true);

    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);

    // Detail Drawer State
    const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);

    // New Request State
    const [form, setForm] = useState<{ notes: string; items: { id: string; ingredient_id: string; qty: string; }[] }>({
        notes: '',
        items: [{ id: crypto.randomUUID(), ingredient_id: '', qty: '' }]
    });

    const fetchOrders = useCallback(async () => {
        if (!branchId || branchId === 'GLOBAL') { setLoading(false); return; }
        setLoading(true);
        try {
            const { data: poData, error: poErr } = await supabase
                .from('purchase_orders')
                .select(`
          *,
          users:created_by(full_name)
        `)
                .eq('branch_id', branchId)
                .eq('created_by', currentUser?.id)
                .order('created_at', { ascending: false });
            if (poErr) throw poErr;

            setOrders((poData || []).map((p: any) => ({
                ...p,
                creator_name: p.users?.full_name || 'Usuario'
            })));
        } catch (err: any) {
            console.error('Error fetching POs', err);
        } finally {
            setLoading(false);
        }
    }, [branchId]);

    const fetchDependencies = useCallback(async () => {
        try {
            const { data: iData } = await supabase.from('ingredients').select('*').order('name');
            if (iData) setIngredients(iData);
        } catch (err) {
            console.error('Error fetching dependencies', err);
        }
    }, []);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);
    useEffect(() => { fetchDependencies(); }, [fetchDependencies]);

    const loadOrderItems = async (order: PurchaseOrder) => {
        try {
            const { data, error } = await supabase
                .from('purchase_order_items')
                .select(`*, ingredients(name, icon, unit_base)`)
                .eq('purchase_order_id', order.id);

            if (error) throw error;
            setSelectedOrder({
                ...order,
                items: (data || []).map((i: any) => ({
                    ...i,
                    ingredient_name: i.ingredients?.name,
                    ingredient_icon: i.ingredients?.icon || '📦',
                    unit_base: i.ingredients?.unit_base || 'gr'
                }))
            });
        } catch (err) {
            console.error('Error fetching items', err);
        }
    };

    const handleCreateRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!branchId) return;

        // Validate items
        const validItems = form.items.filter(i => i.ingredient_id && parseFloat(i.qty) > 0);
        if (validItems.length === 0) {
            setMsg('❌ Agrega al menos un ingrediente válido.');
            return;
        }

        setSubmitting(true);
        try {
            // 1. Create PO (No supplier, status pending automatically)
            const { data: poData, error: poError } = await supabase
                .from('purchase_orders')
                .insert([{
                    branch_id: branchId,
                    created_by: currentUser?.id,
                    notes: form.notes
                }])
                .select()
                .single();

            if (poError) throw poError;

            // 2. Create items (cost is 0 for kitchen requests)
            const itemsToInsert = validItems.map(i => ({
                purchase_order_id: poData.id,
                ingredient_id: i.ingredient_id,
                quantity_requested: parseFloat(i.qty),
                expected_unit_cost: 0
            }));

            const { error: itemsError } = await supabase.from('purchase_order_items').insert(itemsToInsert);
            if (itemsError) throw itemsError;

            setMsg('✅ Solicitud de Insumos enviada a Administración.');
            setShowForm(false);
            setForm({ notes: '', items: [{ id: crypto.randomUUID(), ingredient_id: '', qty: '' }] });
            fetchOrders();
        } catch (err: any) {
            setMsg('❌ Error: ' + err.message);
        } finally {
            setSubmitting(false);
            setTimeout(() => setMsg(null), 4000);
        }
    };

    if (branchId === 'GLOBAL') {
        return (
            <div className="p-8 flex items-center justify-center min-h-[400px]">
                <p className="text-slate-500 font-bold">Las compras se gestionan por sucursal. Selecciona una específica.</p>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 animate-fadeIn relative">
            <header className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                        <span className="material-icons-round text-primary text-3xl">shopping_cart</span>
                        Solicitar Insumos
                    </h1>
                    <p className="text-slate-500 mt-1 text-sm">
                        Envía solicitudes de ingredientes a Administración para su compra y recepción.
                    </p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="btn bg-[#136dec] text-white hover:bg-[#0d5cc7] transition-all px-10 py-3 rounded-full shadow-lg shadow-blue-100 font-bold border border-[#136dec] flex items-center gap-2"
                >
                    <span className="material-icons-round text-[18px]">{showForm ? 'close' : 'add'}</span>
                    {showForm ? 'Cancelar' : 'Nueva Solicitud'}
                </button>
            </header>

            {msg && (
                <div className={`px-4 py-3 rounded-xl font-bold text-sm ${msg.startsWith('✅') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {msg}
                </div>
            )}

            {showForm && (
                <form onSubmit={handleCreateRequest} className="bg-white rounded-2xl border-2 border-primary/20 shadow-xl p-6 space-y-5 animate-fadeIn">
                    <h2 className="text-lg font-black text-slate-900">Detalles de Solicitud</h2>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Notas / Justificación *</label>
                        <input required type="text" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Ej. Para el evento del sábado, se acabó prematuramente, etc." className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl focus:border-primary font-bold" />
                    </div>

                    <div className="space-y-3">
                        <h3 className="font-bold text-slate-700">Ingredientes a solicitar</h3>
                        {form.items.map((item, idx) => {
                            const selectedIng = ingredients.find(i => i.id === item.ingredient_id);
                            const unit = (selectedIng as any)?.unit_base || 'unidades';

                            return (
                                <div key={item.id} className="flex gap-2 items-center">
                                    <select
                                        required
                                        value={item.ingredient_id}
                                        onChange={e => {
                                            const newItems = [...form.items];
                                            newItems[idx] = { ...newItems[idx], ingredient_id: e.target.value };
                                            setForm({ ...form, items: newItems });
                                        }}
                                        className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold bg-white"
                                    >
                                        <option value="">Seleccionar...</option>
                                        {ingredients.map(i => <option key={i.id} value={i.id}>{i.icon} {i.name}</option>)}
                                    </select>
                                    <input
                                        required type="number" min="0.1" step="any" placeholder={`Cant. (${unit})`} value={item.qty}
                                        onChange={e => { const newItems = [...form.items]; newItems[idx].qty = e.target.value; setForm({ ...form, items: newItems }); }}
                                        className="w-40 px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold"
                                        title={`Cantidad en ${unit}`}
                                    />

                                    <button type="button" onClick={() => {
                                        const newItems = form.items.filter((_, i) => i !== idx);
                                        setForm({ ...form, items: newItems.length ? newItems : [{ id: crypto.randomUUID(), ingredient_id: '', qty: '' }] });
                                    }} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                        <span className="material-icons-round text-[20px]">delete</span>
                                    </button>
                                </div>
                            );
                        })}
                        <button type="button" onClick={() => setForm({ ...form, items: [...form.items, { id: crypto.randomUUID(), ingredient_id: '', qty: '' }] })} className="text-sm font-bold text-primary flex items-center gap-1 hover:underline">
                            <span className="material-icons-round text-[16px]">add_circle</span> Añadir Fila
                        </button>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="btn bg-[#136dec] text-white hover:bg-[#0d5cc7] transition-all px-10 py-3 rounded-full shadow-lg shadow-blue-100 font-bold border border-[#136dec] disabled:opacity-50"
                        >
                            {submitting ? 'Enviando...' : 'Enviar Solicitud'}
                        </button>
                    </div>
                </form>
            )}

            {loading ? (
                <div className="text-center py-20 text-slate-400 font-bold">Cargando solicitudes...</div>
            ) : orders.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 text-slate-400">
                    <span className="material-icons-round text-5xl block mb-3 text-slate-200">receipt_long</span>
                    <p className="font-bold">No has realizado ninguna solicitud de compra.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {orders.map(o => (
                        <div
                            key={o.id}
                            onClick={() => { setSelectedOrder(o); loadOrderItems(o); }}
                            className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer relative"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <span className={`px-2 py-0.5 rounded border text-[10px] uppercase font-black tracking-wider ${statusColor(o.status)}`}>
                                    {o.status}
                                </span>
                                <span className="text-[10px] text-slate-400 font-bold mt-1">
                                    {new Date(o.created_at).toLocaleDateString()}
                                </span>
                            </div>

                            <p className="text-xs text-slate-500 flex items-center gap-1">
                                <span className="material-icons-round text-[14px]">person</span> {o.creator_name}
                            </p>
                            {o.notes && <p className="text-sm text-slate-700 mt-2 line-clamp-2 italic font-medium">"{o.notes}"</p>}
                        </div>
                    ))}
                </div>
            )}

            {/* PO Details Drawer (Read Only for Kitchen) */}
            {selectedOrder && (
                <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/20 backdrop-blur-sm animate-fadeIn">
                    <div className="w-[500px] max-w-full bg-white h-full shadow-2xl p-6 flex flex-col pt-0 animate-slideLeft">
                        <header className="flex justify-between items-center py-4 border-b border-slate-100 mb-4 sticky top-0 bg-white z-10">
                            <h2 className="text-xl font-black text-slate-900">Detalles de Solicitud</h2>
                            <button onClick={() => { setSelectedOrder(null); }} className="p-2 rounded-xl border-2 border-slate-100 hover:bg-slate-50 text-slate-400 transition-colors">
                                <span className="material-icons-round">close</span>
                            </button>
                        </header>

                        <div className="flex-1 overflow-y-auto space-y-6 pb-20">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                                <p className="text-sm font-bold text-slate-700"><span className="text-slate-400">Fecha:</span> {new Date(selectedOrder.created_at).toLocaleString()}</p>
                                <p className="text-sm font-bold text-slate-700"><span className="text-slate-400">Justificación:</span> {selectedOrder.notes}</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className={`px-3 py-1 rounded border text-xs uppercase font-black tracking-wider ${statusColor(selectedOrder.status)}`}>
                                        Estado: {selectedOrder.status}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h3 className="font-black text-slate-900 mb-3 border-b  border-slate-100 pb-2">Artículos Solicitados</h3>
                                {!selectedOrder.items ? (
                                    <p className="text-slate-400 text-sm italic">Cargando...</p>
                                ) : (
                                    selectedOrder.items.map((item, i) => {
                                        const unitUI = (item as any).unit_base || 'unidades';

                                        return (
                                            <div key={item.id} className={`p-4 rounded-xl border-2 transition-colors ${item.status === 'received' ? 'border-emerald-100 bg-emerald-50/50' : 'border-slate-100 bg-white'}`}>
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="font-bold text-slate-900">{item.ingredient_icon} {item.ingredient_name}</span>
                                                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${item.status === 'received' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                                        {item.status === 'received' ? 'Recibido' : 'Pendiente'}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-slate-600 space-y-1">
                                                    <p>Cantidad Solicitada: <span className="font-bold text-slate-800">{item.quantity_requested} {unitUI}</span></p>
                                                    {item.status === 'received' && (
                                                        <p className="text-emerald-700">Cant. Entregada: <span className="font-bold">{item.quantity_received} {unitUI}</span></p>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default KitchenPurchaseRequestView;
