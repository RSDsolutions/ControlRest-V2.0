import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import LandingFooter from './LandingFooter';

const COUNTRIES = [
    {
        name: 'Ecuador',
        code: '+593',
        cities: [
            'Quito', 'Guayaquil', 'Cuenca', 'Santo Domingo', 'Machala', 'Durán', 'Manta', 'Portoviejo', 'Loja', 'Ambato',
            'Esmeraldas', 'Quevedo', 'Riobamba', 'Milagro', 'Ibarra', 'La Libertad', 'Babahoyo', 'Sangolquí', 'Daule',
            'Latacunga', 'Tulcán', 'Chone', 'Pasaje', 'Santa Rosa', 'Nueva Loja', 'Huaquillas', 'El Carmen', 'Montecristi',
            'Samborondón', 'Puerto Baquerizo Moreno', 'Santa Elena', 'Salinas', 'Otavalo', 'Azogues', 'Guaranda', 'Tena',
            'Puyo', 'Macas', 'Zamora'
        ]
    },
    {
        name: 'Colombia',
        code: '+57',
        cities: ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Cúcuta', 'Bucaramanga', 'Pereira', 'Santa Marta', 'Ibagué']
    },
    {
        name: 'Perú',
        code: '+51',
        cities: ['Lima', 'Arequipa', 'Trujillo', 'Chiclayo', 'Piura', 'Iquitos', 'Cusco', 'Chimbote', 'Huancayo', 'Tacna']
    },
    {
        name: 'México',
        code: '+52',
        cities: ['CDMX', 'Guadalajara', 'Monterrey', 'Puebla', 'Tijuana', 'León', 'Juárez', 'Zapopan', 'Mérida', 'San Luis Potosí']
    },
    {
        name: 'Chile',
        code: '+56',
        cities: ['Santiago', 'Puente Alto', 'Antofagasta', 'Viña del Mar', 'Valparaíso', 'Talcahuano', 'San Bernardo', 'Temuco', 'Iquique', 'Concepción']
    },
    {
        name: 'Argentina',
        code: '+54',
        cities: ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'Tucumán', 'La Plata', 'Mar del Plata', 'Salta', 'Santa Fe', 'San Juan']
    }
];

interface CustomSelectProps {
    label: string;
    value: string;
    options: string[] | { label: string; value: string }[];
    onChange: (value: string) => void;
    placeholder?: string;
    required?: boolean;
    icon?: string;
}

const CustomSelect: React.FC<CustomSelectProps> = ({ label, value, options, onChange, placeholder = "Selecciona una opción", required, icon }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const displayValue = React.useMemo(() => {
        if (!value) return placeholder;
        const option = options.find(opt =>
            typeof opt === 'string' ? opt === value : opt.value === value
        );
        return typeof option === 'string' ? option : option?.label || value;
    }, [value, options, placeholder]);

    return (
        <div className="space-y-2 relative" ref={containerRef}>
            <label className="text-slate-300 text-sm font-semibold ml-1">{label}</label>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full h-14 bg-slate-900/50 border rounded-2xl px-5 flex items-center justify-between transition-all group ${isOpen ? 'border-blue-600 ring-2 ring-blue-600/20' : 'border-slate-700/50 hover:border-slate-600'
                    }`}
            >
                <div className="flex items-center gap-3">
                    {icon && <span className="material-symbols-outlined text-slate-500 text-xl">{icon}</span>}
                    <span className={`text-sm ${value ? 'text-white font-medium' : 'text-slate-500'}`}>
                        {displayValue}
                    </span>
                </div>
                <span className={`material-symbols-outlined text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180 text-blue-500' : ''}`}>
                    expand_more
                </span>
            </button>

            {isOpen && (
                <div className="absolute z-[100] mt-2 w-full bg-[#1e293b] border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 backdrop-blur-xl">
                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                        {options.length === 0 ? (
                            <div className="p-4 text-center text-slate-500 text-sm italic">Sin opciones disponibles</div>
                        ) : (
                            options.map((opt, idx) => {
                                const optVal = typeof opt === 'string' ? opt : opt.value;
                                const optLabel = typeof opt === 'string' ? opt : opt.label;
                                return (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => {
                                            onChange(optVal);
                                            setIsOpen(false);
                                        }}
                                        className={`w-full text-left px-5 py-4 text-sm transition-colors hover:bg-blue-600/10 hover:text-white border-b border-slate-800/50 last:border-0 ${value === optVal ? 'bg-blue-600 text-white font-bold' : 'text-slate-300'
                                            }`}
                                    >
                                        {optLabel}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const DemoRequestView: React.FC = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        restaurant_name: '',
        contact_name: '',
        email: '',
        country: 'Ecuador',
        phone_code: '+593',
        phone: '',
        city: '',
        number_of_branches: '',
        monthly_sales_range: '',
        current_control_method: '',
        has_inventory_control: false,
        has_recipe_costing: false,
        uses_pos: false,
        main_problem: '',
        requested_plan_interest: '',
        preferred_contact_method: 'WhatsApp'
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleCustomChange = (name: string, value: string) => {
        setFormData(prev => {
            const updates: any = { [name]: value };

            if (name === 'country') {
                const countryData = COUNTRIES.find(c => c.name === value);
                updates.phone_code = countryData?.code || '';
                updates.city = ''; // Reset city when country changes
            }

            return { ...prev, ...updates };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        // Calculate score
        let score = 0;
        if (['2-3'].includes(formData.number_of_branches)) score += 10;
        if (['4-10', 'Más de 10'].includes(formData.number_of_branches)) score += 15;
        if (formData.main_problem.toLowerCase().includes('urgent')) score += 5;

        const genericDomains = ['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com', 'live.com', 'icloud.com'];
        const domain = formData.email.split('@')[1]?.toLowerCase();
        if (domain && !genericDomains.includes(domain)) {
            score += 5;
        }

        const { country, phone_code, preferred_contact_method, phone, ...submitData } = formData;
        const payload = {
            ...submitData,
            phone: `${phone_code} ${phone}`,
            score
        };

        try {
            const { error: insertError } = await supabase
                .from('demo_requests')
                .insert([payload]);

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
                                    <div className="flex gap-2">
                                        <div className="w-24">
                                            <button
                                                type="button"
                                                className="w-full h-14 bg-slate-900/50 border border-slate-700/50 rounded-2xl px-3 text-white text-sm font-bold flex items-center justify-center cursor-default"
                                            >
                                                {formData.phone_code}
                                            </button>
                                        </div>
                                        <input
                                            type="tel" required name="phone" value={formData.phone} onChange={handleChange}
                                            className="flex-1 h-14 bg-slate-900/50 border border-slate-700/50 rounded-2xl px-5 text-white focus:outline-none focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600 transition-all font-medium"
                                            placeholder="XXX XXX XXXX"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <CustomSelect
                                        label="País"
                                        value={formData.country}
                                        options={COUNTRIES.map(c => c.name)}
                                        onChange={(v) => handleCustomChange('country', v)}
                                        icon="public"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <CustomSelect
                                        label="Ciudad"
                                        value={formData.city}
                                        options={COUNTRIES.find(c => c.name === formData.country)?.cities || []}
                                        onChange={(v) => handleCustomChange('city', v)}
                                        placeholder="Selecciona tu ciudad"
                                        icon="location_on"
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
                                    <CustomSelect
                                        label="Número de sucursales"
                                        value={formData.number_of_branches}
                                        options={['1', '2-3', '4-10', 'Más de 10']}
                                        onChange={(v) => handleCustomChange('number_of_branches', v)}
                                        icon="storefront"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <CustomSelect
                                        label="Ventas mensuales aprox."
                                        value={formData.monthly_sales_range}
                                        options={['Menos de $5.000', '$5.000 - $20.000', '$20.000 - $50.000', 'Más de $50.000']}
                                        onChange={(v) => handleCustomChange('monthly_sales_range', v)}
                                        icon="payments"
                                    />
                                </div>
                                <div className="space-y-2 sm:col-span-2">
                                    <CustomSelect
                                        label="¿Cómo llevas actualmente tu control financiero?"
                                        value={formData.current_control_method}
                                        options={['Excel', 'Sistema POS', 'Manual', 'Otro Software']}
                                        onChange={(v) => handleCustomChange('current_control_method', v)}
                                        icon="tune"
                                    />
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
                                    <CustomSelect
                                        label="Plan de interés"
                                        value={formData.requested_plan_interest}
                                        options={['Operar', 'Controlar', 'Escalar', 'No estoy seguro']}
                                        onChange={(v) => handleCustomChange('requested_plan_interest', v)}
                                        icon="star"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <CustomSelect
                                        label="Preferencia de atención"
                                        value={formData.preferred_contact_method}
                                        options={[
                                            { label: 'WhatsApp', value: 'WhatsApp' },
                                            { label: 'Correo Electrónico', value: 'Email' }
                                        ]}
                                        onChange={(v) => handleCustomChange('preferred_contact_method', v)}
                                        icon="chat"
                                    />
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


            <LandingFooter />
        </div>
    );
};

export default DemoRequestView;
