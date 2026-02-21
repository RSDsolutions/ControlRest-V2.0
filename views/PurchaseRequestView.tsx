import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { PurchaseOrder, PurchaseOrderItem, Supplier, Ingredient, User } from '../types';

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

const PurchaseRequestView: React.FC<Props> = ({ branchId, currentUser }) => {
    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [loading, setLoading] = useState(true);

    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);

    // Detail Drawer State
    const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);

    // New PO State
    const [form, setForm] = useState<{ supplier_id: string; notes: string; items: { id: string; ingredient_id: string; qty: string; cost: string }[] }>({
        supplier_id: '',
        notes: '',
        items: [{ id: crypto.randomUUID(), ingredient_id: '', qty: '', cost: '' }]
    });

    const fetchOrders = useCallback(async () => {
        if (!branchId || branchId === 'GLOBAL') { setLoading(false); return; }
        setLoading(true);
        try {
            const { data: poData, error: poErr } = await supabase
                .from('purchase_orders')
                .select(`
          *,
          suppliers(name),
          users:created_by(full_name)
        `)
                .eq('branch_id', branchId)
                .order('created_at', { ascending: false });
            if (poErr) throw poErr;

            setOrders((poData || []).map((p: any) => ({
                ...p,
                supplier_name: p.suppliers?.name,
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

            const restId = (currentUser as any)?.restaurant_id || currentUser?.restaurantId;
            if (restId) {
                const { data: sData } = await supabase.from('suppliers').select('*').eq('restaurant_id', restId).eq('status', 'active');
                if (sData) setSuppliers(sData);
            }
        } catch (err) {
            console.error('Error fetching dependencies', err);
        }
    }, [currentUser?.restaurantId, currentUser]);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);
    useEffect(() => { fetchDependencies(); }, [fetchDependencies]);

    const loadOrderItems = async (order: PurchaseOrder) => {
        try {
            const { data, error } = await supabase
                .from('purchase_order_items')
                .select(`*, ingredients(name, icon)`)
                .eq('purchase_order_id', order.id);

            if (error) throw error;
            setSelectedOrder({
                ...order,
                items: (data || []).map((i: any) => ({
                    ...i,
                    ingredient_name: i.ingredients?.name,
                    ingredient_icon: i.ingredients?.icon || '📦'
                }))
            });
        } catch (err) {
            console.error('Error fetching items', err);
        }
    };

    const handleCreatePO = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!branchId) return;

        // Validate items
        const validItems = form.items.filter(i => i.ingredient_id && parseFloat(i.qty) > 0 && parseFloat(i.cost) >= 0);
        if (validItems.length === 0) {
            setMsg('❌ Agrega al menos un ingrediente válido.');
            return;
        }

        setSubmitting(true);
        try {
            // 1. Create PO
            const { data: poData, error: poError } = await supabase
                .from('purchase_orders')
                .insert([{
                    branch_id: branchId,
                    supplier_id: form.supplier_id || null,
                    created_by: currentUser?.id,
                    notes: form.notes
                }])
                .select()
                .single();

            if (poError) throw poError;

            // 2. Create items
            const itemsToInsert = validItems.map(i => ({
                purchase_order_id: poData.id,
                ingredient_id: i.ingredient_id,
                quantity_requested: parseFloat(i.qty),
                expected_unit_cost: parseFloat(i.cost)
            }));

            const { error: itemsError } = await supabase.from('purchase_order_items').insert(itemsToInsert);
            if (itemsError) throw itemsError;

            setMsg('✅ Solicitud de Compra creada.');
            setShowForm(false);
            setForm({ supplier_id: '', notes: '', items: [{ id: crypto.randomUUID(), ingredient_id: '', qty: '', cost: '' }] });
            fetchOrders();
        } catch (err: any) {
            setMsg('❌ Error: ' + err.message);
        } finally {
            setSubmitting(false);
            setTimeout(() => setMsg(null), 4000);
        }
    };

    const updatePOStatus = async (id: string, status: PurchaseOrder['status']) => {
        try {
            const { error } = await supabase.from('purchase_orders').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
            if (error) throw error;
            setSelectedOrder(prev => prev ? { ...prev, status } : null);
            fetchOrders();
        } catch (err: any) {
            alert('Error: ' + err.message);
        }
    };

    const receiveItem = async (itemId: string, actualQty: number, actualCost: number, expDate: string | null) => {
        try {
            const { error } = await supabase.rpc('receive_purchase_order_item', {
                p_item_id: itemId,
                p_received_qty: actualQty,
                p_actual_cost: actualCost,
                p_expiration_date: expDate || null
            });
            if (error) throw error;

            // Reload drawer items
            if (selectedOrder) {
                loadOrderItems(selectedOrder);
                fetchOrders(); // refresh list to potentially see status fully received
            }
        } catch (err: any) {
            alert('Error al recibir: ' + err.message);
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
                        Solicitudes de Compra
                    </h1>
                    <p className="text-slate-500 mt-1 text-sm">
                        Crea órdenes, apruébalas y recibe mercancía para integrarla al inventario FIFO y al Ledger.
                    </p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 px-5 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
                >
                    <span className="material-icons-round">{showForm ? 'close' : 'add'}</span>
                    {showForm ? 'Cancelar' : 'Nueva Solicitud'}
                </button>
            </header>

            {msg && (
                <div className={`px-4 py-3 rounded-xl font-bold text-sm ${msg.startsWith('✅') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                    {msg}
                </div>
            )}

            {showForm && (
                <form onSubmit={handleCreatePO} className="bg-white rounded-2xl border-2 border-primary/20 shadow-xl p-6 space-y-5 animate-fadeIn">
                    <h2 className="text-lg font-black text-slate-900">Detalles de Solicitud</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Proveedor (Opcional)</label>
                            <select value={form.supplier_id} onChange={e => setForm(f => ({ ...f, supplier_id: e.target.value }))} className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl focus:border-primary font-bold">
                                <option value="">Ninguno / Proveedor Informal</option>
                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Notas / Justificación</label>
                            <input type="text" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl focus:border-primary font-bold" />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h3 className="font-bold text-slate-700">Ingredientes a solicitar</h3>
                        {form.items.map((item, idx) => {
                            const selectedIng = ingredients.find(i => i.id === item.ingredient_id);
                            const unit = selectedIng?.measureUnit || 'unidades';

                            return (
                                <div key={item.id} className="flex gap-2 items-center">
                                    <select
                                        required
                                        value={item.ingredient_id}
                                        onChange={e => {
                                            const newItems = [...form.items];
                                            const ingId = e.target.value;
                                            newItems[idx] = { ...newItems[idx], ingredient_id: ingId };
                                            const ing = ingredients.find(i => i.id === ingId);
                                            // Handle dynamically mapped properties or undefined cases safely
                                            const defaultCost = (ing as any)?.unitPrice ?? (ing as any)?.unit_cost_gr ?? 0;
                                            if (ing) newItems[idx].cost = defaultCost.toString();
                                            setForm({ ...form, items: newItems });
                                        }}
                                        className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold"
                                    >
                                        <option value="">Seleccionar...</option>
                                        {ingredients.map(i => <option key={i.id} value={i.id}>{i.icon} {i.name}</option>)}
                                    </select>
                                    <input
                                        required type="number" min="0.1" step="any" placeholder={`Cant. (${unit})`} value={item.qty}
                                        onChange={e => { const newItems = [...form.items]; newItems[idx].qty = e.target.value; setForm({ ...form, items: newItems }); }}
                                        className="w-32 px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold"
                                        title={`Cantidad en ${unit}`}
                                    />
                                    <div className="relative w-32">
                                        <span className="absolute left-3 top-2 text-slate-400 text-sm font-bold">$</span>
                                        <input
                                            required type="number" min="0" step="any" placeholder="Costo Unit." value={item.cost}
                                            onChange={e => { const newItems = [...form.items]; newItems[idx].cost = e.target.value; setForm({ ...form, items: newItems }); }}
                                            className="w-full pl-6 pr-3 py-2 border border-slate-200 rounded-lg text-sm font-bold"
                                            title={`Costo por ${unit}`}
                                        />
                                    </div>
                                    <button type="button" onClick={() => {
                                        const newItems = form.items.filter((_, i) => i !== idx);
                                        setForm({ ...form, items: newItems.length ? newItems : [{ id: crypto.randomUUID(), ingredient_id: '', qty: '', cost: '' }] });
                                    }} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                        <span className="material-icons-round text-[20px]">delete</span>
                                    </button>
                                </div>
                            );
                        })}
                        <button type="button" onClick={() => setForm({ ...form, items: [...form.items, { id: crypto.randomUUID(), ingredient_id: '', qty: '', cost: '' }] })} className="text-sm font-bold text-primary flex items-center gap-1 hover:underline">
                            <span className="material-icons-round text-[16px]">add_circle</span> Añadir Fila
                        </button>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button type="submit" disabled={submitting} className="px-6 py-2 bg-primary text-white font-bold rounded-xl shadow-md disabled:opacity-50">
                            {submitting ? 'Creando...' : 'Guardar Solicitud'}
                        </button>
                    </div>
                </form>
            )}

            {loading ? (
                <div className="text-center py-20 text-slate-400 font-bold">Cargando órdenes...</div>
            ) : orders.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 text-slate-400">
                    <span className="material-icons-round text-5xl block mb-3 text-slate-200">receipt_long</span>
                    <p className="font-bold">No hay solicitudes de compra.</p>
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
                            <h3 className="font-black text-slate-900 mb-1 line-clamp-1 flex items-center gap-1">
                                <span className="material-icons-round text-[16px] text-slate-400">local_shipping</span>
                                {o.supplier_name || 'Sin Proveedor Específico'}
                            </h3>
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                                <span className="material-icons-round text-[14px]">person</span> {o.creator_name}
                            </p>
                            {o.notes && <p className="text-xs text-slate-400 mt-2 line-clamp-1 italic">"{o.notes}"</p>}
                        </div>
                    ))}
                </div>
            )}

            {/* PO Details Drawer */}
            {selectedOrder && (
                <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/20 backdrop-blur-sm animate-fadeIn">
                    <div className="w-[500px] max-w-full bg-white h-full shadow-2xl p-6 flex flex-col pt-0 animate-slideLeft">
                        <header className="flex justify-between items-center py-4 border-b border-slate-100 mb-4 sticky top-0 bg-white z-10">
                            <h2 className="text-xl font-black text-slate-900">Orden de Compra</h2>
                            <button onClick={() => { setSelectedOrder(null); fetchOrders(); }} className="p-2 rounded-xl border-2 border-slate-100 hover:bg-slate-50 text-slate-400 transition-colors">
                                <span className="material-icons-round">close</span>
                            </button>
                        </header>

                        <div className="flex-1 overflow-y-auto space-y-6 pb-20">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                                <p className="text-sm font-bold text-slate-700"><span className="text-slate-400">Proveedor:</span> {selectedOrder.supplier_name || 'Sin especificar'}</p>
                                <p className="text-sm font-bold text-slate-700"><span className="text-slate-400">Fecha:</span> {new Date(selectedOrder.created_at).toLocaleString()}</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className={`px-3 py-1 rounded border text-xs uppercase font-black tracking-wider ${statusColor(selectedOrder.status)}`}>
                                        Estado: {selectedOrder.status}
                                    </span>
                                </div>
                            </div>

                            {selectedOrder.status === 'pending' && (
                                <div className="flex gap-2">
                                    <button onClick={() => updatePOStatus(selectedOrder.id, 'approved')} className="flex-1 py-2 bg-blue-100 text-blue-700 font-bold rounded-lg border border-blue-200 hover:bg-blue-200 transition-colors">
                                        Aprobar Orden
                                    </button>
                                    <button onClick={() => updatePOStatus(selectedOrder.id, 'cancelled')} className="flex-1 py-2 bg-red-100 text-red-700 font-bold rounded-lg border border-red-200 hover:bg-red-200 transition-colors">
                                        Cancelar
                                    </button>
                                </div>
                            )}

                            <div className="space-y-3">
                                <h3 className="font-black text-slate-900 mb-3 border-b  border-slate-100 pb-2">Artículos</h3>
                                {!selectedOrder.items ? (
                                    <p className="text-slate-400 text-sm italic">Cargando...</p>
                                ) : (
                                    selectedOrder.items.map((item, i) => (
                                        <div key={item.id} className={`p-4 rounded-xl border-2 transition-colors ${item.status === 'received' ? 'border-emerald-100 bg-emerald-50/50' : 'border-slate-100 bg-white'}`}>
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="font-bold text-slate-900">{item.ingredient_icon} {item.ingredient_name}</span>
                                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${item.status === 'received' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                                    {item.status === 'received' ? 'Recibido' : 'Pendiente'}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mb-3">
                                                <p>Req: <span className="font-bold">{item.quantity_requested} gr</span></p>
                                                <p>Costo Esp: <span className="font-bold">${item.expected_unit_cost.toFixed(4)}/gr</span></p>
                                                {item.status === 'received' && (
                                                    <>
                                                        <p className="text-emerald-700">Recibido: <span className="font-bold">{item.quantity_received} gr</span></p>
                                                        <p className="text-emerald-700">Costo Real: <span className="font-bold">${item.actual_unit_cost?.toFixed(4)}/gr</span></p>
                                                    </>
                                                )}
                                            </div>

                                            {selectedOrder.status === 'approved' && item.status === 'pending' && (
                                                <div>
                                                    {!item.receiveMode ? (
                                                        <button onClick={() => {
                                                            const newItems = [...selectedOrder.items!];
                                                            newItems[i].receiveMode = true;
                                                            setSelectedOrder({ ...selectedOrder, items: newItems });
                                                        }} className="w-full py-1.5 bg-slate-100 text-primary font-bold rounded hover:bg-slate-200 transition-colors text-xs">
                                                            Recibir ahora
                                                        </button>
                                                    ) : (
                                                        <form className="mt-2 space-y-2 border-t border-slate-100 pt-2" onSubmit={(e: any) => {
                                                            e.preventDefault();
                                                            const aq = parseFloat(e.target.aq.value);
                                                            const ac = parseFloat(e.target.ac.value);
                                                            const ed = e.target.ed.value;
                                                            receiveItem(item.id, aq, ac, ed);
                                                        }}>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <div>
                                                                    <label className="text-[10px] font-bold text-slate-400">Cant. Recibida ({item.ingredient_id ? ingredients.find(ing => ing.name === item.ingredient_name)?.measureUnit || 'unidades' : 'unidades'})</label>
                                                                    <input required name="aq" type="number" step="any" defaultValue={item.quantity_requested} className="w-full p-1 border rounded text-sm" />
                                                                </div>
                                                                <div>
                                                                    <label className="text-[10px] font-bold text-slate-400">Costo Real ($ / unid.)</label>
                                                                    <input required name="ac" type="number" step="any" defaultValue={item.expected_unit_cost} className="w-full p-1 border rounded text-sm" />
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-bold text-slate-400">Fecha Expiración (Opc.)</label>
                                                                <input name="ed" type="date" className="w-full p-1 border rounded text-sm" />
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <button type="button" onClick={() => {
                                                                    const newItems = [...selectedOrder.items!];
                                                                    newItems[i].receiveMode = false;
                                                                    setSelectedOrder({ ...selectedOrder, items: newItems });
                                                                }} className="flex-1 py-1 bg-slate-100 text-slate-500 font-bold rounded text-xs">Cancerlar</button>
                                                                <button type="submit" className="flex-1 py-1 bg-emerald-500 text-white font-bold rounded shadow-sm text-xs border border-emerald-600">
                                                                    Confirmar Recepción
                                                                </button>
                                                            </div>
                                                        </form>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PurchaseRequestView;
