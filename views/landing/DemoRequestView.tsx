import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

const DemoRequestView: React.FC = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        restaurant_name: '',
        contact_name: '',
        email: '',
        phone: '',
        city: '',
        number_of_branches: '',
        monthly_sales_range: '',
        current_control_method: '',
        has_inventory_control: false,
        has_recipe_costing: false,
        uses_pos: false,
        main_problem: '',
        requested_plan_interest: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const { error: insertError } = await supabase
                .from('demo_requests')
                .insert([formData]);

            if (insertError) throw insertError;

            setSubmitted(true);
        } catch (err: any) {
            console.error('Error submitting demo request:', err);
            setError('Ocurrió un error al enviar tu solicitud. Por favor intenta de nuevo.');
        } finally {
            setIsLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-[#0B1120] flex items-center justify-center px-4">
                <div className="max-w-md w-full bg-slate-900/50 backdrop-blur-xl border border-blue-500/20 rounded-3xl p-12 text-center animate-fade-in">
                    <div className="w-20 h-20 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-8 border border-blue-500/30">
                        <span className="material-symbols-outlined text-4xl text-blue-500">check_circle</span>
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">¡Solicitud Recibida!</h2>
                    <p className="text-slate-400 leading-relaxed mb-10">
                        Tu solicitud ha sido recibida. Nuestro equipo te contactará en menos de 24 horas para coordinar tu diagnóstico financiero.
                    </p>
                    <button
                        onClick={() => navigate('/')}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-600/20"
                    >
                        Volver al Inicio
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0B1120] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-blue-600/10 blur-[120px] rounded-full pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/10 blur-[120px] rounded-full pointer-events-none"></div>

            <div className="max-w-3xl mx-auto relative">
                <div className="text-center mb-12">
                    <div
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600/10 border border-blue-600/20 text-blue-400 text-sm font-semibold mb-6 cursor-pointer hover:bg-blue-600/20 transition-all"
                        onClick={() => navigate('/')}
                    >
                        <span className="material-symbols-outlined text-sm">arrow_back</span>
                        Regresar
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4 leading-tight">
                        Solicitar <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600 text-6xl block sm:inline">Demo Guiada</span>
                    </h1>
                    <p className="text-slate-400 text-lg max-w-xl mx-auto leading-relaxed">
                        Completa este breve formulario para personalizar tu diagnóstico y mostrarte cómo RESTOGESTIÓN puede optimizar tu rentabilidad.
                    </p>
                </div>

                <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-[40px] p-8 sm:p-12 shadow-2xl relative">
                    {/* Top Glow bar */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-600 to-transparent rounded-full"></div>

                    <form onSubmit={handleSubmit} className="space-y-10">
                        {/* Section 1: Contact Info */}
                        <div className="space-y-6">
                            <h3 className="text-blue-500 text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
                                <span className="w-8 h-px bg-blue-600/30"></span> 1. Datos del Establecimiento
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-slate-300 text-sm font-semibold ml-1">Nombre del Restaurante</label>
                                    <input
                                        type="text" required name="restaurant_name" value={formData.restaurant_name} onChange={handleChange}
                                        className="w-full h-14 bg-slate-900/50 border border-slate-700/50 rounded-2xl px-5 text-white focus:outline-none focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600 transition-all"
                                        placeholder="Ej: La Fogata Gourmet"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-slate-300 text-sm font-semibold ml-1">Nombre del Responsable</label>
                                    <input
                                        type="text" required name="contact_name" value={formData.contact_name} onChange={handleChange}
                                        className="w-full h-14 bg-slate-900/50 border border-slate-700/50 rounded-2xl px-5 text-white focus:outline-none focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600 transition-all"
                                        placeholder="Tu nombre completo"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-slate-300 text-sm font-semibold ml-1">Correo Electrónico</label>
                                    <input
                                        type="email" required name="email" value={formData.email} onChange={handleChange}
                                        className="w-full h-14 bg-slate-900/50 border border-slate-700/50 rounded-2xl px-5 text-white focus:outline-none focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600 transition-all"
                                        placeholder="admin@restaurante.com"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-slate-300 text-sm font-semibold ml-1">Teléfono</label>
                                    <input
                                        type="tel" required name="phone" value={formData.phone} onChange={handleChange}
                                        className="w-full h-14 bg-slate-900/50 border border-slate-700/50 rounded-2xl px-5 text-white focus:outline-none focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600 transition-all"
                                        placeholder="+X XXX XXX XXXX"
                                    />
                                </div>
                                <div className="space-y-2 sm:col-span-2">
                                    <label className="text-slate-300 text-sm font-semibold ml-1">Ciudad</label>
                                    <input
                                        type="text" required name="city" value={formData.city} onChange={handleChange}
                                        className="w-full h-14 bg-slate-900/50 border border-slate-700/50 rounded-2xl px-5 text-white focus:outline-none focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600 transition-all"
                                        placeholder="Ciudad y país"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Operational Info */}
                        <div className="space-y-6">
                            <h3 className="text-blue-500 text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
                                <span className="w-8 h-px bg-blue-600/30"></span> 2. Perfil Operativo
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-slate-300 text-sm font-semibold ml-1">Número de sucursales</label>
                                    <select
                                        required name="number_of_branches" value={formData.number_of_branches} onChange={handleChange}
                                        className="w-full h-14 bg-slate-900/50 border border-slate-700/50 rounded-2xl px-5 text-white focus:outline-none focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600 transition-all appearance-none"
                                    >
                                        <option value="" disabled>Selecciona una opción</option>
                                        <option value="1">1</option>
                                        <option value="2-3">2-3</option>
                                        <option value="4-10">4-10</option>
                                        <option value="Más de 10">Más de 10</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-slate-300 text-sm font-semibold ml-1">Ventas mensuales aprox.</label>
                                    <select
                                        required name="monthly_sales_range" value={formData.monthly_sales_range} onChange={handleChange}
                                        className="w-full h-14 bg-slate-900/50 border border-slate-700/50 rounded-2xl px-5 text-white focus:outline-none focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600 transition-all appearance-none"
                                    >
                                        <option value="" disabled>Selecciona un rango</option>
                                        <option value="Menos de $5.000">Menos de $5.000</option>
                                        <option value="$5.000 - $20.000">$5.000 - $20.000</option>
                                        <option value="$20.000 - $50.000">$20.000 - $50.000</option>
                                        <option value="Más de $50.000">Más de $50.000</option>
                                    </select>
                                </div>
                                <div className="space-y-2 sm:col-span-2">
                                    <label className="text-slate-300 text-sm font-semibold ml-1">¿Cómo llevas actualmente tu control financiero?</label>
                                    <select
                                        required name="current_control_method" value={formData.current_control_method} onChange={handleChange}
                                        className="w-full h-14 bg-slate-900/50 border border-slate-700/50 rounded-2xl px-5 text-white focus:outline-none focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600 transition-all appearance-none"
                                    >
                                        <option value="" disabled>Selecciona una opción</option>
                                        <option value="Excel">Excel</option>
                                        <option value="Sistema POS">Sistema POS</option>
                                        <option value="Manual">Manual</option>
                                        <option value="Otro Software">Otro Software</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Tech & Controls */}
                        <div className="space-y-6">
                            <h3 className="text-blue-500 text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
                                <span className="w-8 h-px bg-blue-600/30"></span> 3. Controles Actuales
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <label className="flex items-center gap-3 p-4 bg-slate-900/30 border border-slate-700/30 rounded-2xl cursor-pointer hover:bg-slate-900/50 transition-all active:scale-[0.98]">
                                    <input
                                        type="checkbox" name="has_inventory_control" checked={formData.has_inventory_control} onChange={handleChange}
                                        className="w-5 h-5 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-600"
                                    />
                                    <span className="text-slate-300 text-sm font-bold">Control de Inventario</span>
                                </label>
                                <label className="flex items-center gap-3 p-4 bg-slate-900/30 border border-slate-700/30 rounded-2xl cursor-pointer hover:bg-slate-900/50 transition-all active:scale-[0.98]">
                                    <input
                                        type="checkbox" name="has_recipe_costing" checked={formData.has_recipe_costing} onChange={handleChange}
                                        className="w-5 h-5 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-600"
                                    />
                                    <span className="text-slate-300 text-sm font-bold">Costeo de Recetas</span>
                                </label>
                                <label className="flex items-center gap-3 p-4 bg-slate-900/30 border border-slate-700/30 rounded-2xl cursor-pointer hover:bg-slate-900/50 transition-all active:scale-[0.98]">
                                    <input
                                        type="checkbox" name="uses_pos" checked={formData.uses_pos} onChange={handleChange}
                                        className="w-5 h-5 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-600"
                                    />
                                    <span className="text-slate-300 text-sm font-bold">Uso de POS</span>
                                </label>
                                <div className="space-y-2">
                                    <label className="text-slate-300 text-sm font-semibold ml-1">Plan de interés</label>
                                    <select
                                        required name="requested_plan_interest" value={formData.requested_plan_interest} onChange={handleChange}
                                        className="w-full h-14 bg-slate-900/50 border border-slate-700/50 rounded-2xl px-5 text-white focus:outline-none focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600 transition-all appearance-none"
                                    >
                                        <option value="" disabled>Selecciona interés</option>
                                        <option value="Operar">Operar</option>
                                        <option value="Controlar">Controlar</option>
                                        <option value="Escalar">Escalar</option>
                                        <option value="No estoy seguro">No estoy seguro</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Section 4: Main Problem */}
                        <div className="space-y-6">
                            <h3 className="text-blue-500 text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
                                <span className="w-8 h-px bg-blue-600/30"></span> 4. Tu principal objetivo
                            </h3>
                            <div className="space-y-2">
                                <label className="text-slate-300 text-sm font-semibold ml-1">Principal problema que deseas resolver</label>
                                <textarea
                                    required name="main_problem" value={formData.main_problem} onChange={handleChange}
                                    className="w-full h-32 bg-slate-900/50 border border-slate-700/50 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600 transition-all resize-none"
                                    placeholder="Cuéntanos un poco sobre el desafío que tienes hoy..."
                                ></textarea>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl text-sm flex items-center gap-3 animate-shake">
                                <span className="material-symbols-outlined text-lg">error</span>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl text-lg shadow-xl shadow-blue-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
                        >
                            {isLoading ? (
                                <span className="animate-spin material-symbols-outlined">sync</span>
                            ) : (
                                <>
                                    Agendar Mi Demo
                                    <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>

            <div className="text-center mt-12 mb-20 text-slate-500 text-[10px] font-black uppercase tracking-[0.4em]">
                RSD SOLUTIONS &copy; 2026 - RestoGestión V2.0 Enterprise
            </div>
        </div>
    );
};

export default DemoRequestView;
