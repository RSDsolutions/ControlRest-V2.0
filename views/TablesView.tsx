
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
                        className="btn bg-[#136dec] text-white hover:bg-[#0d5cc7] transition-all px-10 py-3 rounded-full shadow-lg shadow-blue-100 font-bold border border-[#136dec] flex items-center gap-2"
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
                    <div className="relative bg-white w-full max-w-[480px] rounded-xl border border-slate-200 shadow-2xl overflow-hidden animate-fade-in">
                        {/* Header */}
                        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-start">
                            <div>
                                <h3 className="text-[22px] font-bold text-slate-900 tracking-tight leading-none">
                                    {editingTable ? 'Modificar Mesa' : 'Nueva Mesa'}
                                </h3>
                                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.05em] mt-2.5">CONFIGURACIÓN DE SALÓN</p>
                            </div>
                            <button
                                onClick={closeModal}
                                className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <span className="material-icons-round text-2xl">close</span>
                            </button>
                        </div>

                        {/* Form Body */}
                        <form onSubmit={handleSubmit}>
                            <div className="p-8 space-y-7">
                                <div className="space-y-3">
                                    <label className="text-[13px] font-bold text-slate-700">Identificador de Mesa</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ej: Mesa VIP 1, Terraza A"
                                        className="w-full px-4 py-3.5 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-300 focus:ring-4 focus:ring-slate-50 transition-all"
                                        value={formData.label}
                                        onChange={e => setFormData({ ...formData, label: e.target.value })}
                                        autoFocus
                                    />
                                    <p className="text-[11px] text-slate-400 font-medium">Nombre único para identificar la mesa en el plano.</p>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[13px] font-bold text-slate-700">Capacidad (Personas)</label>
                                    <div className="relative w-32">
                                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                                            <span className="material-icons-round text-slate-400 text-[18px]">groups</span>
                                        </div>
                                        <input
                                            type="number"
                                            required
                                            min="1"
                                            className="w-full pl-10 pr-4 py-3 text-sm font-bold rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-slate-300 focus:ring-4 focus:ring-slate-50 transition-all font-sans"
                                            value={formData.seats}
                                            onChange={e => setFormData({ ...formData, seats: parseInt(e.target.value) })}
                                        />
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="material-icons-round text-emerald-500 text-[16px]">check_circle</span>
                                        <p className="text-[11px] text-slate-400 font-medium tracking-tight">Capacidad válida para reservas estándar.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="btn bg-white border border-slate-200 text-[#136dec] hover:bg-slate-50 transition-all px-10 py-3 rounded-full shadow-lg shadow-slate-100 font-bold"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn bg-[#136dec] text-white hover:bg-[#0d5cc7] transition-all px-10 py-3 rounded-full shadow-lg shadow-blue-100 font-bold border border-[#136dec] disabled:opacity-50"
                                >
                                    {loading ? 'Guardando...' : 'Guardar Mesa'}
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
