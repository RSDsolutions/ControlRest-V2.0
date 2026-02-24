import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { Supplier, User } from '../types';

interface Props {
    currentUser: User | null;
    restaurantId: string | null;
}

const SuppliersView: React.FC<Props> = ({ currentUser, restaurantId }) => {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [msg, setMsg] = useState<string | null>(null);

    const [form, setForm] = useState<Partial<Supplier>>({
        name: '',
        contact_name: '',
        phone: '',
        email: '',
        notes: '',
        status: 'active'
    });

    const fetchSuppliers = useCallback(async () => {
        if (!restaurantId) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('suppliers')
                .select('*')
                .eq('restaurant_id', restaurantId)
                .order('name');

            if (error) throw error;
            setSuppliers(data || []);
        } catch (err) {
            console.error('Error fetching suppliers:', err);
        } finally {
            setLoading(false);
        }
    }, [restaurantId]);

    useEffect(() => {
        fetchSuppliers();
    }, [fetchSuppliers]);

    const handleCreateOrUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!restaurantId || !form.name) return;
        setSubmitting(true);
        setMsg(null);

        try {
            if (editingId) {
                const { error } = await supabase
                    .from('suppliers')
                    .update({
                        name: form.name,
                        contact_name: form.contact_name,
                        phone: form.phone,
                        email: form.email,
                        notes: form.notes,
                        status: form.status
                    })
                    .eq('id', editingId);
                if (error) throw error;
                setMsg('✅ Proveedor actualizado');
            } else {
                const { error } = await supabase
                    .from('suppliers')
                    .insert([{ ...form, restaurant_id: restaurantId }]);
                if (error) throw error;
                setMsg('✅ Proveedor creado');
            }

            setShowForm(false);
            setEditingId(null);
            setForm({ name: '', contact_name: '', phone: '', email: '', notes: '', status: 'active' });
            fetchSuppliers();
        } catch (err: any) {
            setMsg('❌ Error: ' + err.message);
        } finally {
            setSubmitting(false);
            setTimeout(() => setMsg(null), 4000);
        }
    };

    const handleEdit = (s: Supplier) => {
        setForm({
            name: s.name,
            contact_name: s.contact_name || '',
            phone: s.phone || '',
            email: s.email || '',
            notes: s.notes || '',
            status: s.status
        });
        setEditingId(s.id);
        setShowForm(true);
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`¿Seguro que deseas eliminar el proveedor "${name}"?`)) return;
        setLoading(true);
        try {
            const { error } = await supabase.from('suppliers').delete().eq('id', id);
            if (error) throw error;
            setMsg('✅ Proveedor eliminado');
            fetchSuppliers();
        } catch (err: any) {
            setMsg('❌ Error eliminando: ' + err.message);
        } finally {
            setLoading(false);
            setTimeout(() => setMsg(null), 4000);
        }
    };

    return (
        <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 animate-fade-in max-w-[1400px] mx-auto font-sans pb-24 lg:pb-8">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
                        <span className="material-icons-round text-primary text-2xl">local_shipping</span>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Proveedores</h1>
                        <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 font-medium">Gestión de suministros para trazabilidad de lotes FIFO e inventario.</p>
                    </div>
                </div>
                <button
                    onClick={() => {
                        setForm({ name: '', contact_name: '', phone: '', email: '', notes: '', status: 'active' });
                        setEditingId(null);
                        setShowForm(f => !f);
                    }}
                    className="w-full sm:w-auto btn bg-[#136dec] text-white hover:bg-[#0d5cc7] transition-all px-8 py-3 rounded-2xl sm:rounded-full shadow-lg shadow-blue-100 font-bold border border-[#136dec] flex items-center justify-center gap-2 text-sm"
                >
                    <span className="material-icons-round text-[20px]">{showForm ? 'close' : 'add'}</span>
                    {showForm ? 'Cerrar Formulario' : 'Nuevo Proveedor'}
                </button>
            </header>

            {msg && (
                <div className={`px-4 py-3 rounded-xl font-bold text-sm ${msg.startsWith('✅') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {msg}
                </div>
            )}

            {showForm && (
                <form onSubmit={handleCreateOrUpdate} className="bg-white rounded-[32px] border border-primary/20 shadow-2xl p-6 sm:p-8 space-y-6 sm:space-y-8 animate-scaleUp">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                            <span className="material-icons-round text-primary text-xl">{editingId ? 'edit' : 'person_add'}</span>
                        </div>
                        <h2 className="text-xl font-black text-slate-900">
                            {editingId ? 'Editar Proveedor' : 'Registrar Proveedor'}
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Empresa / Nombre *</label>
                            <input required type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:border-primary font-bold text-slate-800 text-sm outline-none transition-all" placeholder="Nombre del proveedor" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Contacto Permanente</label>
                            <input type="text" value={form.contact_name} onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:border-primary font-bold text-slate-800 text-sm outline-none transition-all" placeholder="Nombre del contacto" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Teléfono</label>
                            <input type="text" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:border-primary font-bold text-slate-800 text-sm outline-none transition-all" placeholder="Número de contacto" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                            <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:border-primary font-bold text-slate-800 text-sm outline-none transition-all" placeholder="proveedor@ejemplo.com" />
                        </div>
                        {editingId && (
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Estatus</label>
                                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:border-primary font-bold text-slate-800 text-sm outline-none transition-all cursor-pointer">
                                    <option value="active">Activo</option>
                                    <option value="inactive">Inactivo</option>
                                </select>
                            </div>
                        )}
                        <div className={editingId ? 'md:col-span-1' : 'md:col-span-2'}>
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Notas</label>
                            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:border-primary font-bold text-slate-800 text-sm outline-none transition-all" rows={2} placeholder="Comentarios adicionales..."></textarea>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-end items-center gap-4 pt-6 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={() => setShowForm(false)}
                            className="w-full sm:w-auto px-10 py-3.5 text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-2xl transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full sm:w-auto px-12 py-3.5 bg-[#136dec] text-white hover:bg-[#0d5cc7] transition-all rounded-2xl shadow-xl shadow-blue-200/50 font-bold text-sm disabled:opacity-50"
                        >
                            {submitting ? 'Guardando...' : 'Guardar Proveedor'}
                        </button>
                    </div>
                </form>
            )}

            {loading ? (
                <div className="text-center py-20 text-slate-400 font-bold">Cargando proveedores...</div>
            ) : suppliers.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 text-slate-400">
                    <span className="material-icons-round text-5xl block mb-3 text-slate-200">local_shipping</span>
                    <p className="font-bold">No hay proveedores registrados.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
                    {suppliers.map(s => (
                        <div key={s.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative group overflow-hidden">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100">
                                        <span className="material-icons-round text-slate-400 text-xl font-bold">business</span>
                                    </div>
                                    <h3 className="font-black text-slate-900 text-lg leading-tight">{s.name}</h3>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-[10px] uppercase font-black tracking-widest border ${s.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                                    {s.status === 'active' ? 'Activa' : 'Inact.'}
                                </span>
                            </div>

                            <div className="space-y-4 text-sm">
                                {s.contact_name && (
                                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl group-hover:bg-slate-100/50 transition-colors">
                                        <span className="material-icons-round text-slate-400 text-lg">person</span>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">Contacto</span>
                                            <span className="text-slate-700 font-bold">{s.contact_name}</span>
                                        </div>
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-3">
                                    {s.phone && (
                                        <div className="flex flex-col p-3 bg-slate-50 rounded-2xl group-hover:bg-slate-100/50 transition-colors">
                                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">Teléfono</span>
                                            <span className="text-slate-700 font-bold text-[13px]">{s.phone}</span>
                                        </div>
                                    )}
                                    {s.email && (
                                        <div className="flex flex-col p-3 bg-slate-50 rounded-2xl group-hover:bg-slate-100/50 transition-colors truncate">
                                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">Email</span>
                                            <span className="text-slate-700 font-bold text-[13px] truncate">{s.email}</span>
                                        </div>
                                    )}
                                </div>
                                {s.notes && (
                                    <div className="flex items-start gap-3 p-3 bg-amber-50/50 rounded-2xl border border-amber-100/50">
                                        <span className="material-icons-round text-amber-400 text-lg">notes</span>
                                        <p className="text-xs text-amber-700 font-medium leading-relaxed italic">{s.notes}</p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-end gap-2">
                                <button onClick={() => handleEdit(s)} className="p-3 text-slate-400 hover:text-primary transition-all hover:bg-slate-50 rounded-xl" title="Editar">
                                    <span className="material-icons-round text-[20px]">edit</span>
                                </button>
                                <button onClick={() => handleDelete(s.id, s.name)} className="p-3 text-slate-400 hover:text-red-500 transition-all hover:bg-red-50 rounded-xl" title="Eliminar">
                                    <span className="material-icons-round text-[20px]">delete_forever</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SuppliersView;
