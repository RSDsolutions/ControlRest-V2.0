
import React, { useState } from 'react';
import { Table } from '../types';
import { supabase } from '../supabaseClient';

interface TablesViewProps {
    tables: Table[];
    setTables: React.Dispatch<React.SetStateAction<Table[]>>;
    branchId: string | null;
}

const TablesView: React.FC<TablesViewProps> = ({ tables, setTables, branchId }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTable, setEditingTable] = useState<Table | null>(null);
    const [formData, setFormData] = useState({ label: '', seats: 4 });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!branchId) {
            alert('Error: No se ha identificado la sucursal. Recarga la página.');
            return;
        }
        setLoading(true);
        try {
            if (editingTable) {
                // Update
                const { error } = await supabase
                    .from('tables')
                    .update({ label: formData.label, seats: formData.seats })
                    .eq('id', editingTable.id);

                if (error) throw error;

                setTables(prev => prev.map(t => t.id === editingTable.id ? { ...t, label: formData.label, seats: formData.seats } : t));
            } else {
                // Create
                const { data, error } = await supabase
                    .from('tables')
                    .insert([{
                        label: formData.label,
                        seats: formData.seats,
                        status: 'available',
                        branch_id: branchId
                    }])
                    .select()
                    .single();

                if (error) throw error;
                if (data) setTables(prev => [...prev, { id: data.id, label: data.label, seats: data.seats, status: 'available' }]);
            }
            closeModal();
        } catch (err: any) {
            console.error(err);
            alert('Error al guardar mesa: ' + (err.message || 'Error desconocido'));
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar esta mesa?')) return;
        try {
            const { error } = await supabase.from('tables').delete().eq('id', id);
            if (error) throw error;
            setTables(prev => prev.filter(t => t.id !== id));
        } catch (err: any) {
            console.error(err);
            alert('Error al eliminar mesa: ' + (err.message || 'Error desconocido'));
        }
    };

    const openModal = (table?: Table) => {
        if (table) {
            setEditingTable(table);
            setFormData({ label: table.label, seats: table.seats });
        } else {
            setEditingTable(null);
            setFormData({ label: '', seats: 4 });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingTable(null);
    };

    return (
        <>
            <div className="p-6 space-y-5 animate-fade-in max-w-[1400px] mx-auto">
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-[8px] shadow-card border border-slate-200">
                    <div>
                        <h1 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                            <span className="material-icons-round text-[#136dec] text-xl">table_restaurant</span>
                            Configuración de Mesas
                        </h1>
                        <p className="text-xs text-slate-400 mt-0.5">Organiza la distribución física de tu restaurante y gestiona capacidades.</p>
                    </div>
                    <button
                        onClick={() => openModal()}
                        className="btn btn-primary flex items-center gap-2"
                    >
                        <span className="material-icons-round text-[18px]">add</span> Nueva Mesa
                    </button>
                </header>

                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {tables.map(table => (
                        <div key={table.id || table.label} className="card p-8 group relative overflow-hidden flex flex-col items-center">
                            {/* Status Pulse Indicator */}
                            <div className="absolute top-6 right-6 flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${table.status === 'available' ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]' :
                                    table.status === 'occupied' ? 'bg-rose-500 shadow-[0_0_12px_rgba(239,68,68,0.4)]' :
                                        table.status === 'billing' ? 'bg-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.4)]' : 'bg-slate-400'
                                    }`}></div>
                            </div>

                            <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mb-6 transition-transform group-hover:scale-110 duration-300">
                                <span className="material-icons-round text-5xl">table_restaurant</span>
                            </div>

                            <div className="text-center space-y-1">
                                <h3 className="text-2xl font-heading font-black text-brand-black tracking-tight">{table.label}</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{table.seats} PERSONAS</p>
                                <span className={`inline-block mt-3 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${table.status === 'available' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                    table.status === 'occupied' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                        table.status === 'billing' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-slate-50 text-slate-500 border-slate-100'
                                    }`}>
                                    {table.status === 'available' ? 'Disponible' :
                                        table.status === 'occupied' ? 'Ocupada' :
                                            table.status === 'billing' ? 'En Cuenta' : 'Inactiva'}
                                </span>
                            </div>

                            <div className="flex gap-3 w-full mt-8 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 duration-300">
                                <button
                                    onClick={() => openModal(table)}
                                    className="flex-1 btn btn-outline py-2 text-[10px]"
                                >
                                    <span className="material-icons-round text-sm mr-1">edit</span> Editar
                                </button>
                                <button
                                    onClick={() => table.id && handleDelete(table.id)}
                                    className="flex-1 btn btn-danger py-2 text-[10px]"
                                >
                                    <span className="material-icons-round text-sm mr-1">delete</span> Eliminar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Modal de Registro/Edición */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop con blur */}
                    <div
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] animate-fade-in"
                        onClick={closeModal}
                    ></div>

                    {/* Contenido del Modal */}
                    <div className="relative bg-white w-full max-w-md rounded-brand border border-slate-200 shadow-modal overflow-hidden animate-fade-in">
                        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900 leading-none">
                                    {editingTable ? 'Editar Mesa' : 'Nueva Mesa'}
                                </h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1.5">Configuración de salón</p>
                            </div>
                            <button
                                onClick={closeModal}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                            >
                                <span className="material-icons-round text-xl">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div className="space-y-1.5">
                                <label className="label">Identificador de Mesa</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ej: Mesa VIP 1, Terraza A"
                                    className="input"
                                    value={formData.label}
                                    onChange={e => setFormData({ ...formData, label: e.target.value })}
                                    autoFocus
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="label">Capacidad (Personas)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-icons-round text-slate-400 text-lg">groups</span>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        className="input pl-10"
                                        value={formData.seats}
                                        onChange={e => setFormData({ ...formData, seats: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 btn btn-outline"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-[2] btn btn-primary shadow-primary/20"
                                >
                                    {loading ? (
                                        <span className="flex items-center gap-2">
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                            Guardando...
                                        </span>
                                    ) : (
                                        'Guardar Mesa'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default TablesView;
