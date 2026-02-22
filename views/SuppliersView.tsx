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
        <div className="p-8 space-y-8 animate-fadeIn">
            <header className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                        <span className="material-icons-round text-primary text-3xl">local_shipping</span>
                        Proveedores
                    </h1>
                    <p className="text-slate-500 mt-1 text-sm">
                        Gestión de suministros para trazabilidad de lotes FIFO e inventario.
                    </p>
                </div>
                <button
                    onClick={() => {
                        setForm({ name: '', contact_name: '', phone: '', email: '', notes: '', status: 'active' });
                        setEditingId(null);
                        setShowForm(f => !f);
                    }}
                    className="btn bg-[#136dec] text-white hover:bg-[#0d5cc7] transition-all px-10 py-3 rounded-full shadow-lg shadow-blue-100 font-bold border border-[#136dec] flex items-center gap-2"
                >
                    <span className="material-icons-round">{showForm ? 'close' : 'add'}</span>
                    {showForm ? 'Cerrar Formulario' : 'Nuevo Proveedor'}
                </button>
            </header>

            {msg && (
                <div className={`px-4 py-3 rounded-xl font-bold text-sm ${msg.startsWith('✅') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {msg}
                </div>
            )}

            {showForm && (
                <form onSubmit={handleCreateOrUpdate} className="bg-white rounded-2xl border-2 border-primary/20 shadow-xl p-6 space-y-5">
                    <h2 className="text-lg font-black text-slate-900">
                        {editingId ? 'Editar Proveedor' : 'Registrar Proveedor'}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Empresa / Nombre *</label>
                            <input required type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl focus:border-primary font-bold text-slate-800" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Contacto Permanente</label>
                            <input type="text" value={form.contact_name} onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))} className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl focus:border-primary font-bold text-slate-800" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Teléfono</label>
                            <input type="text" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl focus:border-primary font-bold text-slate-800" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                            <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl focus:border-primary font-bold text-slate-800" />
                        </div>
                        {editingId && (
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Estatus</label>
                                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))} className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl focus:border-primary font-bold text-slate-800">
                                    <option value="active">Activo</option>
                                    <option value="inactive">Inactivo</option>
                                </select>
                            </div>
                        )}
                        <div className={editingId ? 'md:col-span-1' : 'md:col-span-2'}>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Notas</label>
                            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl focus:border-primary font-bold text-slate-800" rows={2}></textarea>
                        </div>
                    </div>
                    <div className="flex justify-between items-center pt-6 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={() => setShowForm(false)}
                            className="btn bg-white border border-slate-200 text-[#136dec] hover:bg-slate-50 transition-all px-10 py-3 rounded-full shadow-lg shadow-slate-100 font-bold"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="btn bg-[#136dec] text-white hover:bg-[#0d5cc7] transition-all px-10 py-3 rounded-full shadow-lg shadow-blue-100 font-bold border border-[#136dec] disabled:opacity-50"
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {suppliers.map(s => (
                        <div key={s.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative group">
                            <div className="flex justify-between items-start mb-3">
                                <h3 className="font-black text-slate-900 text-lg leading-tight w-4/5">{s.name}</h3>
                                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-wider ${s.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                    {s.status === 'active' ? 'Activo' : 'Inac.'}
                                </span>
                            </div>

                            <div className="space-y-2 text-sm">
                                {s.contact_name && (
                                    <p className="text-slate-600 flex items-center gap-2">
                                        <span className="material-icons-round text-[16px] text-slate-400">person</span> {s.contact_name}
                                    </p>
                                )}
                                {s.phone && (
                                    <p className="text-slate-600 flex items-center gap-2">
                                        <span className="material-icons-round text-[16px] text-slate-400">phone</span> {s.phone}
                                    </p>
                                )}
                                {s.email && (
                                    <p className="text-slate-600 flex items-center gap-2 truncate">
                                        <span className="material-icons-round text-[16px] text-slate-400">email</span> {s.email}
                                    </p>
                                )}
                            </div>

                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white p-1 rounded-lg shadow-sm border border-slate-100">
                                <button onClick={() => handleEdit(s)} className="p-1.5 text-primary hover:bg-primary/10 rounded-md transition-colors" title="Editar">
                                    <span className="material-icons-round text-[18px]">edit</span>
                                </button>
                                <button onClick={() => handleDelete(s.id, s.name)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors" title="Eliminar">
                                    <span className="material-icons-round text-[18px]">delete</span>
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
