
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
        <div className="p-6 space-y-6 animate-fadeIn max-w-[1200px] mx-auto pb-20">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <span className="material-icons-round text-accent">table_restaurant</span> Gestión de Mesas
                    </h1>
                    <p className="text-slate-500 font-medium">Configura la distribución del restaurante.</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                >
                    <span className="material-icons-round">add</span> Nueva Mesa
                </button>
            </header>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {tables.map(table => (
                    <div key={table.id || table.label} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center gap-4 relative group hover:shadow-md transition-all">
                        {/* Status Badge */}
                        <div className={`absolute top-4 right-4 w-3 h-3 rounded-full ${table.status === 'available' ? 'bg-emerald-400' :
                                table.status === 'occupied' ? 'bg-rose-500' :
                                    table.status === 'billing' ? 'bg-amber-400' : 'bg-slate-400'
                            }`}></div>

                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                            <span className="material-icons-round text-3xl">table_restaurant</span>
                        </div>

                        <div className="text-center">
                            <h3 className="font-black text-xl text-slate-800">{table.label}</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{table.seats} Personas</p>
                        </div>

                        <div className="flex gap-2 w-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => openModal(table)}
                                className="flex-1 bg-blue-50 text-blue-600 py-2 rounded-lg font-bold text-xs hover:bg-blue-100"
                            >
                                Editar
                            </button>
                            <button
                                onClick={() => table.id && handleDelete(table.id)}
                                className="flex-1 bg-red-50 text-red-600 py-2 rounded-lg font-bold text-xs hover:bg-red-100"
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-black text-xl text-slate-800">{editingTable ? 'Editar Mesa' : 'Nueva Mesa'}</h3>
                            <button onClick={closeModal} className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors">
                                <span className="material-icons-round text-lg">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nombre / Identificador</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ej: Mesa 1, Barra 2"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                                    value={formData.label}
                                    onChange={e => setFormData({ ...formData, label: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Capacidad (Personas)</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                                    value={formData.seats}
                                    onChange={e => setFormData({ ...formData, seats: parseInt(e.target.value) })}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-xl font-black text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                            >
                                {loading ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TablesView;
