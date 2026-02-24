
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
            <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 animate-fade-in max-w-[1400px] mx-auto font-sans pb-24 lg:pb-8">
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
                            <span className="material-icons-round text-primary text-2xl">table_restaurant</span>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Gestión de Mesas</h1>
                            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 font-medium">Organiza la distribución física de tu restaurante y gestiona capacidades.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => openModal()}
                        className="w-full sm:w-auto btn bg-[#136dec] text-white hover:bg-[#0d5cc7] transition-all px-8 py-3 rounded-2xl sm:rounded-full shadow-lg shadow-blue-100 font-bold border border-[#136dec] flex items-center justify-center gap-2 text-sm"
                    >
                        <span className="material-icons-round text-[20px]">add</span> Nueva Mesa
                    </button>
                </header>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
                    {tables.map(table => (
                        <div key={table.id || table.label} className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative group overflow-hidden flex flex-col items-center">
                            {/* Status Pulse Indicator */}
                            <div className="absolute top-6 right-6 flex items-center gap-2">
                                <div className={`w-3.5 h-3.5 rounded-full ${table.status === 'available' ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]' :
                                    table.status === 'occupied' ? 'bg-rose-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]' :
                                        table.status === 'billing' ? 'bg-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.5)]' : 'bg-slate-400 shadow-[0_0_12px_rgba(148,163,184,0.5)]'
                                    }`}></div>
                            </div>

                            <div className="w-24 h-24 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 mb-6 transition-transform group-hover:scale-110 duration-500">
                                <span className="material-icons-round text-6xl">table_restaurant</span>
                            </div>

                            <div className="text-center space-y-2">
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{table.label}</h3>
                                <div className="flex items-center justify-center gap-2">
                                    <span className="material-icons-round text-slate-400 text-sm">groups</span>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{table.seats} PERSONAS</p>
                                </div>
                                <span className={`inline-block mt-4 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${table.status === 'available' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                    table.status === 'occupied' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                        table.status === 'billing' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-slate-50 text-slate-500 border-slate-200'
                                    }`}>
                                    {table.status === 'available' ? 'Disponible' :
                                        table.status === 'occupied' ? 'Ocupada' :
                                            table.status === 'billing' ? 'Cobrando' : 'Inactiva'}
                                </span>
                            </div>

                            <div className="flex gap-2 w-full mt-10 opacity-0 group-hover:opacity-100 transition-all transform translate-y-4 group-hover:translate-y-0 duration-300">
                                <button
                                    onClick={() => openModal(table)}
                                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black text-slate-600 hover:bg-primary hover:text-white hover:border-primary transition-all flex items-center justify-center gap-1.5 uppercase tracking-widest"
                                >
                                    <span className="material-icons-round text-lg">edit</span>
                                </button>
                                <button
                                    onClick={() => table.id && handleDelete(table.id)}
                                    className="flex-1 px-4 py-3 bg-red-50/50 border border-red-100 text-red-600 rounded-2xl text-[10px] font-black hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-1.5 uppercase tracking-widest"
                                >
                                    <span className="material-icons-round text-lg">delete</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Modal de Registro/Edición */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="relative bg-white w-full max-w-[480px] rounded-t-[40px] sm:rounded-[40px] border border-slate-200 shadow-2xl overflow-hidden animate-scaleUp">
                        {/* Header */}
                        <div className="px-8 py-8 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                                    {editingTable ? 'Modificar Mesa' : 'Nueva Mesa'}
                                </h3>
                                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">CONFIGURACIÓN DE SALÓN</p>
                            </div>
                            <button
                                onClick={closeModal}
                                className="w-10 h-10 flex items-center justify-center hover:bg-slate-200/50 rounded-full text-slate-400 transition-all hover:rotate-90"
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
                            <div className="px-8 py-8 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row justify-end items-center gap-4">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="w-full sm:w-auto px-10 py-3.5 text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-2xl transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full sm:w-auto px-12 py-3.5 bg-[#136dec] text-white hover:bg-[#0d5cc7] transition-all rounded-2xl shadow-xl shadow-blue-200/50 font-bold text-sm disabled:opacity-50"
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
