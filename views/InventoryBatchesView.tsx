import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { User } from '../types';

interface Props {
    branchId: string | null;
    currentUser: User | null;
}

interface Batch {
    id: string;
    ingredient_id: string;
    ingredient_name: string;
    ingredient_icon: string;
    quantity_received: number;
    quantity_remaining: number;
    unit_cost: number;
    purchase_reference: string | null;
    received_at: string;
    expiration_date: string | null;
    expiration_status: 'valid' | 'expiring' | 'expired';
    status: 'active' | 'exhausted' | 'voided';
    supplier_name?: string;
}

interface SupplierOption {
    id: string;
    name: string;
}

interface IngredientOption {
    id: string;
    name: string;
    icon: string;
}

const statusBadge = (s: Batch['status']) => {
    if (s === 'active') return 'bg-emerald-100 text-emerald-700';
    if (s === 'exhausted') return 'bg-slate-100 text-slate-500';
    return 'bg-purple-100 text-purple-600'; // voided
};

const statusLabel = (s: Batch['status']) => {
    if (s === 'active') return 'Activo';
    if (s === 'exhausted') return 'Agotado';
    return 'Anulado';
};

const expBadge = (s: Batch['expiration_status']) => {
    if (s === 'valid') return 'bg-slate-100 text-slate-500';
    if (s === 'expiring') return 'bg-amber-100 text-amber-700 border border-amber-300';
    return 'bg-red-100 text-red-700 border border-red-300';
};

const InventoryBatchesView: React.FC<Props> = ({ branchId, currentUser }) => {
    const [batches, setBatches] = useState<Batch[]>([]);
    const [ingredients, setIngredients] = useState<IngredientOption[]>([]);
    const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [filter, setFilter] = useState<'all' | 'active' | 'exhausted'>('active');

    // New batch form state
    const [form, setForm] = useState({
        ingredient_id: '',
        quantity: '',
        unit_cost: '',
        purchase_reference: '',
        expiration_date: '',
        supplier_id: '',
    });
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);

    const fetchBatches = useCallback(async () => {
        if (!branchId || branchId === 'GLOBAL') { setLoading(false); return; }
        setLoading(true);
        try {
            let q = supabase
                .from('inventory_batches')
                .select(`
          id, ingredient_id, quantity_received, quantity_remaining,
          unit_cost, purchase_reference, received_at, status, expiration_date, expiration_status,
          ingredients(name, icon),
          suppliers(name)
        `)
                .eq('branch_id', branchId)
                .order('received_at', { ascending: false });

            if (filter !== 'all') q = q.eq('status', filter);

            const { data, error } = await q;
            if (error) throw error;

            setBatches((data ?? []).map((b: any) => ({
                id: b.id,
                ingredient_id: b.ingredient_id,
                ingredient_name: b.ingredients?.name ?? 'Desconocido',
                ingredient_icon: b.ingredients?.icon ?? '📦',
                quantity_received: b.quantity_received,
                quantity_remaining: b.quantity_remaining,
                unit_cost: b.unit_cost,
                purchase_reference: b.purchase_reference,
                received_at: b.received_at,
                expiration_date: b.expiration_date,
                expiration_status: b.expiration_status ?? 'valid',
                status: b.status,
                supplier_name: b.suppliers?.name,
            })));
        } catch (err) {
            console.error('[Batches] fetch error', err);
        } finally {
            setLoading(false);
        }
    }, [branchId, filter]);

    const fetchIngredientsAndSuppliers = useCallback(async () => {
        const { data: ingData } = await supabase
            .from('ingredients')
            .select('id, name, icon')
            .order('name');
        if (ingData) setIngredients(ingData.map((d: any) => ({ id: d.id, name: d.name, icon: d.icon ?? '📦' })));

        if (currentUser?.restaurantId) {
            const { data: supData } = await supabase
                .from('suppliers')
                .select('id, name')
                .eq('restaurant_id', currentUser.restaurantId)
                .eq('status', 'active')
                .order('name');
            if (supData) setSuppliers(supData);
        }
    }, [currentUser?.restaurantId]);

    useEffect(() => { fetchBatches(); }, [fetchBatches]);
    useEffect(() => { fetchIngredientsAndSuppliers(); }, [fetchIngredientsAndSuppliers]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.ingredient_id || !form.quantity || !form.unit_cost) return;
        setSaving(true);
        try {
            const { error } = await supabase.rpc('register_inventory_batch', {
                p_ingredient_id: form.ingredient_id,
                p_branch_id: branchId,
                p_quantity: parseFloat(form.quantity),
                p_unit_cost: parseFloat(form.unit_cost),
                p_purchase_ref: form.purchase_reference || null,
                p_expiration_date: form.expiration_date || null,
                p_supplier_id: form.supplier_id || null
            });
            if (error) throw error;
            setMsg('✅ Lote registrado exitosamente');
            setForm({ ingredient_id: '', quantity: '', unit_cost: '', purchase_reference: '', expiration_date: '', supplier_id: '' });
            setShowForm(false);
            fetchBatches();
        } catch (err: any) {
            setMsg('❌ Error: ' + err.message);
        } finally {
            setSaving(false);
            setTimeout(() => setMsg(null), 4000);
        }
    };

    const consumedPct = (b: Batch) =>
        b.quantity_received > 0
            ? Math.round(((b.quantity_received - b.quantity_remaining) / b.quantity_received) * 100)
            : 100;

    const handleRunAutoWaste = async () => {
        if (!confirm('¿Seguro que deseas correr manualmente el proceso de auto-merma para lotes expirados? (Normalmente corre automático cada 6 hrs)')) return;
        setLoading(true);
        try {
            await supabase.rpc('update_batch_expiration_status');
            await supabase.rpc('register_expired_batch_waste');
            setMsg('✅ Auto-merma de expirados procesada correctamente.');
            fetchBatches();
        } catch (err: any) {
            setMsg('❌ Error procesando auto-merma: ' + err.message);
        } finally {
            setLoading(false);
            setTimeout(() => setMsg(null), 5000);
        }
    };

    if (branchId === 'GLOBAL') {
        return (
            <div className="p-8 flex items-center justify-center min-h-[400px]">
                <p className="text-slate-500 font-bold">
                    Los lotes se gestionan por sucursal. Selecciona una sucursal específica.
                </p>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 animate-fadeIn">
            {/* Header */}
            <header className="flex justify-between items-start gap-4 flex-wrap">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                        <span className="material-icons-round text-primary text-3xl">inventory_2</span>
                        Seguimiento de Lotes FIFO
                    </h1>
                    <p className="text-slate-500 mt-1 text-sm">
                        Capa logística — trazabilidad de compras por lote. No afecta el PMP financiero.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleRunAutoWaste}
                        className="flex items-center gap-2 px-4 py-3 bg-white border-2 border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 active:scale-95 transition-all text-sm"
                        title="Correr Auto-Merma Manualmente"
                    >
                        <span className="material-icons-round">cleaning_services</span> Limpiar Expirados
                    </button>
                    <button
                        onClick={() => setShowForm(f => !f)}
                        className="flex items-center gap-2 px-5 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 active:scale-95 transition-all"
                    >
                        <span className="material-icons-round">add</span> Registrar Lote
                    </button>
                </div>
            </header>

            {/* Notification */}
            {msg && (
                <div className={`px-4 py-3 rounded-xl font-bold text-sm ${msg.startsWith('✅') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {msg}
                </div>
            )}

            {/* New Batch Form */}
            {showForm && (
                <form onSubmit={handleSave} className="bg-white rounded-2xl border-2 border-primary/20 shadow-xl p-6 space-y-5 animate-fadeIn">
                    <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                        <span className="material-icons-round text-primary">playlist_add</span>
                        Nuevo Lote de Compra
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ingrediente *</label>
                            <select
                                required value={form.ingredient_id}
                                onChange={e => setForm(f => ({ ...f, ingredient_id: e.target.value }))}
                                className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl focus:border-primary font-bold text-slate-800"
                            >
                                <option value="">Seleccionar...</option>
                                {ingredients.map(i => (
                                    <option key={i.id} value={i.id}>{i.icon} {i.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Proveedor (Opcional)</label>
                            <select
                                value={form.supplier_id}
                                onChange={e => setForm(f => ({ ...f, supplier_id: e.target.value }))}
                                className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl focus:border-primary font-bold text-slate-800"
                            >
                                <option value="">Sin proveedor...</option>
                                {suppliers.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cantidad (gr) *</label>
                            <input
                                required type="number" min="0.0001" step="any"
                                value={form.quantity}
                                onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                                placeholder="5000"
                                className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl focus:border-primary font-bold text-slate-800"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Costo unitario ($/gr) *</label>
                            <input
                                required type="number" min="0" step="any"
                                value={form.unit_cost}
                                onChange={e => setForm(f => ({ ...f, unit_cost: e.target.value }))}
                                placeholder="0.0045"
                                className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl focus:border-primary font-bold text-slate-800"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Referencia de Compra</label>
                            <input
                                type="text"
                                value={form.purchase_reference}
                                onChange={e => setForm(f => ({ ...f, purchase_reference: e.target.value }))}
                                placeholder="Factura #001-xxxx"
                                className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl focus:border-primary font-bold text-slate-800"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fecha de Expiración (Opcional)</label>
                            <input
                                type="date"
                                value={form.expiration_date}
                                onChange={e => setForm(f => ({ ...f, expiration_date: e.target.value }))}
                                className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl focus:border-primary font-bold text-slate-800"
                            />
                        </div>
                    </div>
                    <div className="flex gap-3 justify-end pt-2">
                        <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-slate-500 font-bold text-sm hover:text-slate-700">
                            Cancelar
                        </button>
                        <button
                            type="submit" disabled={saving}
                            className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl shadow-md shadow-primary/20 disabled:opacity-50 active:scale-95 transition-all"
                        >
                            {saving ? 'Guardando...' : 'Crear Lote'}
                        </button>
                    </div>
                </form>
            )}

            {/* Filter tabs */}
            <div className="flex gap-2">
                {(['active', 'exhausted', 'all'] as const).map(f => (
                    <button
                        key={f} onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}
                    >
                        {f === 'active' ? 'Activos' : f === 'exhausted' ? 'Agotados' : 'Todos'}
                    </button>
                ))}
            </div>

            {/* Batch list */}
            {loading ? (
                <div className="text-center py-20 text-slate-400 font-bold text-sm">Cargando lotes...</div>
            ) : batches.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 text-slate-400">
                    <span className="material-icons-round text-5xl text-slate-200 block mb-3">inventory_2</span>
                    <p className="font-bold">No hay lotes {filter === 'all' ? '' : filter === 'active' ? 'activos' : 'agotados'}</p>
                    <p className="text-xs mt-1">Registra tu primer lote con el botón de arriba.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {batches.map(b => {
                        const pct = consumedPct(b);
                        return (
                            <div key={b.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center hover:shadow-md transition-all">
                                {/* Icon + name */}
                                <div className="flex items-center gap-3 min-w-[200px]">
                                    <span className="text-3xl">{b.ingredient_icon}</span>
                                    <div>
                                        <p className="font-black text-slate-900 text-sm leading-tight">{b.ingredient_name}</p>
                                        <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                                            {new Date(b.received_at).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </p>
                                        {b.purchase_reference && (
                                            <p className="text-[10px] text-slate-500 font-bold mt-0.5">📄 {b.purchase_reference}</p>
                                        )}
                                        {b.supplier_name && (
                                            <p className="text-[10px] text-slate-500 font-bold mt-0.5 flex items-center gap-1">
                                                <span className="material-icons-round text-[12px]">local_shipping</span>
                                                {b.supplier_name}
                                            </p>
                                        )}
                                        {b.expiration_date && (
                                            <p className={`text-[10px] font-black mt-1 px-1.5 py-0.5 rounded inline-block uppercase ${expBadge(b.expiration_status)}`}>
                                                <span className="material-icons-round text-[10px] mr-1 align-middle">
                                                    {b.expiration_status === 'expired' ? 'dangerous' : b.expiration_status === 'expiring' ? 'warning' : 'event'}
                                                </span>
                                                Vence: {new Date(b.expiration_date).toLocaleDateString('es')}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* FIFO progress bar */}
                                <div className="flex-1">
                                    <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase mb-1">
                                        <span>Consumido: {pct}%</span>
                                        <span>Restante: {b.quantity_remaining.toLocaleString()} gr</span>
                                    </div>
                                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all ${b.status === 'exhausted' ? 'bg-slate-400' : pct > 80 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-[9px] font-bold text-slate-300 mt-1">
                                        <span>0</span>
                                        <span>{b.quantity_received.toLocaleString()} gr</span>
                                    </div>
                                </div>

                                {/* Cost + status */}
                                <div className="flex flex-col items-end gap-2 min-w-[120px]">
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${statusBadge(b.status)}`}>
                                        {statusLabel(b.status)}
                                    </span>
                                    <p className="text-xs font-black text-slate-600">${b.unit_cost.toFixed(6)}/gr</p>
                                    <p className="text-[10px] text-slate-400 font-bold">
                                        Valor lote: ${(b.quantity_remaining * b.unit_cost).toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default InventoryBatchesView;
