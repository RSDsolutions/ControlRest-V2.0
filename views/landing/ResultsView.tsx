import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LandingHeader from './LandingHeader';
import LandingFooter from './LandingFooter';

const ResultsView: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('Todos');

    const kpis = [
        { label: 'Reducción Food Cost', value: '-6%', sub: 'Promedio Anual', icon: 'pie_chart' },
        { label: 'Margen Bruto', value: '+12%', sub: 'Incremento Neto', icon: 'trending_up' },
        { label: 'Detección de Desviaciones', value: '-85%', sub: 'Tiempo Reacción', icon: 'error_outline' },
    ];

    const caseStudies = [
        {
            id: 'fast-food',
            category: 'Fast Food',
            title: 'Cadena de Fast Food',
            tag: 'Alta Rotación',
            metrics: { old: '34.2%', new: '28.1%', label: 'Food Cost' },
            period: 'Optimización: 3 meses',
            initial: 'Costos ocultos en inventario y mermas no registradas en turnos nocturnos.',
            implementation: 'Auditoría de recetas en tiempo real y bloqueo de stock negativo.',
            result: 'Recuperación de rentabilidad y estandarización de porciones.'
        },
        {
            id: 'full-service',
            category: 'Full Service',
            title: 'Operación Full Service',
            tag: 'Servicio Completo',
            metrics: { old: '15%', new: '22%', label: 'Margen Neto' },
            period: 'Optimización: 5 meses',
            initial: 'Variabilidad extrema de precios de proveedores sin alertas.',
            implementation: 'Comparador automático de compras y semáforo de precios.',
            result: 'Estabilización de margen bruto y renegociación con proveedores.'
        },
        {
            id: 'dark-kitchen',
            category: 'Dark Kitchen',
            title: 'Red de Dark Kitchens',
            tag: 'Delivery Only',
            metrics: { old: '8.5%', new: '3.2%', label: 'Desperdicio (Waste)' },
            period: 'Optimización: 2 meses',
            initial: 'Producción excesiva y falta de trazabilidad en ensamblaje.',
            implementation: 'Digitalización de producción KDS (Kitchen Display System).',
            result: 'Minimización de waste y mejora en tiempos de despacho.'
        }
    ];

    const filteredCases = activeTab === 'Todos'
        ? caseStudies
        : caseStudies.filter(c => c.category === activeTab);

    return (
        <div className="min-h-screen bg-[#0B1120] text-white font-sans selection:bg-blue-500/30">
            <LandingHeader />

            <main className="pt-24 pb-16">
                {/* Hero Section */}
                <section className="max-w-7xl mx-auto px-6 lg:px-8 mb-20">
                    <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-blue-600/10 via-slate-900/50 to-slate-900 border border-slate-800 p-8 md:p-16">
                        <div className="grid lg:grid-cols-2 gap-12 items-center">
                            <div className="relative z-10">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider mb-6">
                                    <span className="material-symbols-outlined text-sm">analytics</span>
                                    Reporte Financiero 2024
                                </div>
                                <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6 leading-[1.1]">
                                    Resultados Financieros en <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 text-shadow-glow">Operaciones Gastronómicas</span> Reales
                                </h1>
                                <p className="text-lg text-slate-400 mb-10 leading-relaxed max-w-xl">
                                    Análisis de impacto financiero y optimización de KPIs operativos mediante la integración de datos con RestoGestión. Eliminamos la intuición de la ecuación.
                                </p>
                                <div className="flex flex-wrap gap-4">
                                </div>
                            </div>

                            <div className="relative">
                                {/* Dashboard Mockup Graphic */}
                                <div className="relative z-10 rounded-2xl border border-white/10 shadow-2xl overflow-hidden bg-slate-900/80 backdrop-blur">
                                    <img
                                        src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800&auto=format&fit=crop"
                                        alt="Dashboard Analytics"
                                        className="w-full h-auto opacity-80"
                                    />
                                    {/* Overlay cards mimic the design */}
                                    <div className="absolute top-4 right-4 space-y-3">
                                        <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl backdrop-blur shadow-xl">
                                            <p className="text-[10px] text-slate-500 uppercase font-bold">Costo Promedio Industria</p>
                                            <div className="flex items-end gap-2 text-xl font-black mt-1">
                                                32.4% <span className="text-red-500 text-[10px] font-bold mb-1">High Risk</span>
                                            </div>
                                        </div>
                                        <div className="bg-[#0D1525]/90 border border-blue-500/30 p-3 rounded-xl backdrop-blur shadow-2xl ring-1 ring-blue-500/20">
                                            <p className="text-[10px] text-blue-400 uppercase font-bold">Costo con RestoGestión</p>
                                            <div className="flex items-end gap-2 text-xl font-black mt-1">
                                                26.8% <span className="text-emerald-500 text-[10px] font-bold mb-1">▼5.6% Delta</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {/* Glow Effect */}
                                <div className="absolute -inset-4 bg-blue-500/10 blur-3xl -z-10 rounded-full"></div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* KPI Stripes */}
                <section className="max-w-7xl mx-auto px-6 mb-24">
                    <div className="grid md:grid-cols-3 gap-6">
                        {kpis.map((kpi, idx) => (
                            <div key={idx} className="bg-slate-900/40 border border-slate-800 p-8 rounded-3xl group hover:border-blue-500/30 transition-all">
                                <div className="flex justify-between items-start mb-4">
                                    <p className="text-sm font-bold text-slate-400 group-hover:text-blue-400 transition-colors uppercase tracking-wider">{kpi.label}</p>
                                    <span className="material-symbols-outlined text-blue-500/50 group-hover:text-blue-400">{kpi.icon}</span>
                                </div>
                                <div className="text-4xl font-black mb-2">{kpi.value}</div>
                                <div className="text-xs font-bold text-emerald-500 uppercase tracking-widest">{kpi.sub}</div>
                                <div className="h-1 bg-slate-800 rounded-full mt-6 overflow-hidden">
                                    <div className="h-full bg-blue-600 rounded-full w-2/3 group-hover:w-full transition-all duration-1000"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Case Studies */}
                <section className="max-w-7xl mx-auto px-6 mb-24">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-black mb-4 uppercase tracking-tighter">Análisis de Impacto: Casos de Estudio</h2>
                            <p className="text-slate-500 max-w-2xl font-medium">
                                Selección de auditorías operativas donde se implementó la metodología de control de RestoGestión. Datos anonimizados bajo acuerdos de confidencialidad B2B.
                            </p>
                        </div>
                        <div className="flex p-1.5 bg-slate-900/80 rounded-xl border border-slate-800 gap-1 overflow-x-auto no-scrollbar">
                            {['Todos', 'Full Service', 'Fast Food', 'Dark Kitchen'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${activeTab === tab ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:bg-slate-800'}`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {filteredCases.map((cs) => (
                            <div key={cs.id} className="bg-[#0D1525] border border-slate-800 rounded-3xl overflow-hidden hover:border-blue-500/20 transition-all flex flex-col group">
                                <div className="p-8 border-b border-slate-800/50 relative overflow-hidden">
                                    {/* Category Badge */}
                                    <div className="absolute top-6 right-6 px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded text-[10px] uppercase font-black text-blue-400 tracking-wider">
                                        {cs.tag}
                                    </div>
                                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] mb-3">{cs.category}</p>
                                    <h3 className="text-xl font-black mb-6">{cs.title}</h3>

                                    <div className="flex items-center gap-4">
                                        <div className="text-center">
                                            <p className="text-[9px] text-slate-500 uppercase font-bold mb-1">Métrica</p>
                                            <p className="text-red-400 font-bold line-through text-sm opacity-60">{cs.metrics.old}</p>
                                        </div>
                                        <div className="text-2xl font-black text-blue-400 group-hover:scale-110 transition-transform">
                                            → {cs.metrics.new}
                                        </div>
                                        <div className="px-2 py-1 bg-slate-800 rounded text-[9px] uppercase font-bold text-slate-400 mt-3">
                                            {cs.metrics.label}
                                        </div>
                                    </div>
                                    <p className="text-[9px] text-emerald-500 font-black uppercase mt-4 flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                        {cs.period}
                                    </p>
                                </div>

                                <div className="p-8 space-y-6 flex-grow">
                                    <div className="flex gap-4">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                                            <span className="material-symbols-outlined text-lg whitespace-nowrap">priority_high</span>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider mb-1">Situación Inicial</p>
                                            <p className="text-xs text-slate-500 leading-relaxed font-medium">{cs.initial}</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                                            <span className="material-symbols-outlined text-lg whitespace-nowrap">build</span>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider mb-1">Implementación</p>
                                            <p className="text-xs text-slate-500 leading-relaxed font-medium">{cs.implementation}</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                                            <span className="material-symbols-outlined text-lg whitespace-nowrap">check_circle</span>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider mb-1">Resultado</p>
                                            <p className="text-xs text-slate-500 leading-relaxed font-medium font-bold italic">{cs.result}</p>
                                        </div>
                                    </div>
                                </div>

                                <button className="p-4 bg-slate-900 border-t border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-2 group-hover:bg-slate-800/50">
                                    Ver Detalle Técnico <span className="material-symbols-outlined text-xs">arrow_forward_ios</span>
                                </button>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Global Indicators */}
                <section className="max-w-7xl mx-auto px-6 mb-24">
                    <div className="p-16 rounded-[3rem] bg-gradient-to-b from-slate-900/50 to-slate-900 border border-slate-800 text-center relative overflow-hidden">
                        <h2 className="text-3xl font-black mb-4 uppercase tracking-tighter">Indicadores Optimizados Globalmente</h2>
                        <p className="text-slate-500 mb-16 text-sm font-bold uppercase tracking-widest">Patrones de mejora recurrentes en nuestra cartera de clientes</p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 max-w-5xl mx-auto">
                            {[
                                { icon: 'query_stats', title: 'Detección Temprana', desc: 'Alertas automáticas ante desviaciones de receta standard > 2%.' },
                                { icon: 'published_with_changes', title: 'Precios Dinámicos', desc: 'Sugerencia de ajuste de precios basada en el margen real actualizado.' },
                                { icon: 'inventory_2', title: 'Stock Inteligente', desc: 'Predicción de compras basada en histórico de ventas y recetas.' },
                                { icon: 'hub', title: 'Integración Total', desc: 'Conexión directa POS-ERP-Proveedor sin carga manual.' }
                            ].map((item, idx) => (
                                <div key={idx} className="flex flex-col items-center">
                                    <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 mb-6 group-hover:scale-110 transition-transform">
                                        <span className="material-symbols-outlined text-2xl">{item.icon}</span>
                                    </div>
                                    <h4 className="text-sm font-black mb-3 uppercase tracking-wider">{item.title}</h4>
                                    <p className="text-xs text-slate-500 leading-relaxed font-medium">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Final CTA */}
                <section className="max-w-7xl mx-auto px-6">
                    <div className="bg-blue-600 rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden group shadow-2xl shadow-blue-600/20">
                        {/* Background Decor */}
                        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[600px] h-[600px] bg-white opacity-[0.03] rounded-full blur-[100px] group-hover:scale-110 transition-transform duration-1000"></div>

                        <h2 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tighter">Deje de perder margen en su operación</h2>
                        <p className="text-blue-100 text-lg md:text-xl mb-12 max-w-2xl mx-auto font-medium">
                            Obtenga un diagnóstico operativo preliminar basado en sus datos actuales. Sin costo para cadenas de +3 sucursales.
                        </p>
                        <button
                            onClick={() => navigate('/solicitar-demo')}
                            className="bg-white text-blue-600 hover:bg-blue-50 font-black py-4 px-10 rounded-xl transition-all shadow-2xl shadow-black/20 flex items-center gap-3 mx-auto uppercase tracking-widest text-sm"
                        >
                            <span className="material-symbols-outlined text-lg">fact_check</span>
                            Solicitar Diagnóstico Operativo
                        </button>
                        <p className="text-blue-200/50 mt-8 text-[10px] font-bold uppercase tracking-widest italic">
                            * Auditoría confidencial bajo NDA
                        </p>
                    </div>
                </section>
            </main>

            <LandingFooter />
        </div>
    );
};

export default ResultsView;
