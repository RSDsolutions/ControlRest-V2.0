import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LandingHeader from './LandingHeader';
import LandingFooter from './LandingFooter';

const PricingView: React.FC = () => {
    const navigate = useNavigate();
    const [isAnnual, setIsAnnual] = useState(false);

    useEffect(() => {
        document.documentElement.classList.add('dark');
        return () => {
            document.documentElement.classList.remove('dark');
        };
    }, []);

    const prices = {
        operar: isAnnual ? 23 : 29,
        controlar: isAnnual ? 63 : 79,
        escalar: isAnnual ? 119 : 149
    };

    return (
        <div className="bg-[#0F172A] text-slate-100 font-sans antialiased selection:bg-blue-600 selection:text-white overflow-x-hidden min-h-screen">

            <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden">
                <LandingHeader />
                <main className="flex-1 flex flex-col items-center px-4 md:px-10 py-12 lg:py-20">
                    <div className="max-w-[960px] w-full flex flex-col items-center text-center gap-6 mb-12 sm:mb-16">
                        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-tight tracking-tight text-white max-w-5xl px-2">
                            No todos los restaurantes necesitan más ventas. <span className="text-primary block mt-2">Necesitan más control.</span>
                        </h1>
                        <p className="text-base sm:text-lg text-text-light max-w-2xl font-normal leading-relaxed px-4">
                            La mayoría de los negocios gastronómicos mueren vendiendo mucho pero ganando poco. RestoGestión V2.0 te da visibilidad financiera diaria para transformar flujo de caja en utilidad neta.
                        </p>
                        <div className="flex items-center p-1 bg-card-dark rounded-full border border-border-dark mt-8 transition-all relative">
                            <button
                                onClick={() => setIsAnnual(false)}
                                className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${!isAnnual ? 'bg-primary text-white shadow-glow-sm' : 'text-text-light hover:text-white'}`}
                            >
                                Mensual
                            </button>
                            <button
                                onClick={() => setIsAnnual(true)}
                                className={`px-6 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${isAnnual ? 'bg-primary text-white shadow-glow-sm' : 'text-text-light hover:text-white'}`}
                            >
                                Anual <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded leading-none ${isAnnual ? 'bg-white/20 text-white' : 'bg-primary/20 text-primary border border-primary/10'}`}>-20%</span>
                            </button>
                        </div>
                    </div>
                    <div className="max-w-[1200px] w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
                        <div className="group relative flex flex-col rounded-2xl border border-border-dark bg-card-dark p-8 transition-all duration-300 hover:border-primary/50 hover:-translate-y-1 h-full">
                            <div className="flex flex-col gap-4 mb-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-bold tracking-tight text-white uppercase">Operar</h3>
                                    <span className="material-symbols-outlined text-text-muted">receipt_long</span>
                                </div>
                                <div className="h-16">
                                    <p className="text-sm text-text-light leading-snug">
                                        "Vendes pero no sabes si ganas."<br />
                                        Ideal para digitalización inicial y ordenamiento de tickets.
                                    </p>
                                </div>
                                <div className="flex items-baseline gap-1 mt-2">
                                    <span className="text-4xl font-black tracking-tight text-white">${prices.operar}</span>
                                    <span className="text-base font-medium text-text-muted">/mes</span>
                                </div>
                            </div>
                            <button
                                onClick={() => navigate('/solicitar-demo')}
                                className="w-full h-12 rounded-xl bg-background-dark hover:bg-slate-900 border border-border-dark text-white font-bold text-sm transition-colors mb-8"
                            >
                                Solicitar demo
                            </button>
                            <div className="flex flex-col gap-4 border-t border-white/5 pt-8 mt-auto">
                                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Alcance operativo:</p>
                                <div className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-text-muted text-[20px] shrink-0">check</span>
                                    <span className="text-sm text-text-light">Integración POS para ventas brutas</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-text-muted text-[20px] shrink-0">check</span>
                                    <span className="text-sm text-text-light">Cálculo de costo teórico (congelado)</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-text-muted text-[20px] shrink-0">check</span>
                                    <span className="text-sm text-text-light">Arqueos de caja digitales</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-text-muted text-[20px] shrink-0">remove</span>
                                    <span className="text-sm text-text-muted italic">Sin cálculo de utilidad real</span>
                                </div>
                            </div>
                        </div>
                        <div className="relative flex flex-col rounded-2xl border-2 border-primary bg-card-dark p-8 shadow-glow lg:-mt-4 z-10 h-full">
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-lg">
                                Rentabilidad Real
                            </div>
                            <div className="flex flex-col gap-4 mb-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-bold tracking-tight text-primary uppercase">Controlar</h3>
                                    <span className="material-symbols-outlined text-primary">analytics</span>
                                </div>
                                <div className="h-16">
                                    <p className="text-sm text-text-light leading-snug">
                                        "Cada venta impacta tu utilidad real."<br />
                                        Ideal para detectar fugas y conocer el margen exacto.
                                    </p>
                                </div>
                                <div className="flex items-baseline gap-1 mt-2">
                                    <span className="text-5xl font-black tracking-tight text-white">${prices.controlar}</span>
                                    <span className="text-base font-medium text-text-muted">/mes</span>
                                </div>
                            </div>
                            <button
                                onClick={() => navigate('/solicitar-demo')}
                                className="w-full h-12 rounded-xl bg-primary hover:bg-blue-600 text-white font-bold text-sm transition-all shadow-glow-sm mb-8"
                            >
                                Solicitar demo
                            </button>
                            <div className="flex flex-col gap-4 border-t border-primary/20 pt-8 mt-auto">
                                <p className="text-xs font-semibold text-primary uppercase tracking-wider">Control Financiero Total:</p>
                                <div className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-success text-[20px] shrink-0">check_circle</span>
                                    <span className="text-sm text-white font-medium">FIFO Snapshot: Valoración real de stock</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-success text-[20px] shrink-0">check_circle</span>
                                    <span className="text-sm text-white font-medium">Utilidad Neta por plato vendido</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-success text-[20px] shrink-0">check_circle</span>
                                    <span className="text-sm text-white font-medium">Detección de fugas y mermas</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-success text-[20px] shrink-0">check_circle</span>
                                    <span className="text-sm text-white font-medium">Gestión dinámica de recetas y costos</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-success text-[20px] shrink-0">check_circle</span>
                                    <span className="text-sm text-white font-medium">Alertas de variación de precio compra</span>
                                </div>
                            </div>
                        </div>
                        <div className="group relative flex flex-col rounded-2xl border border-border-dark bg-gradient-to-b from-card-dark to-[#131b2e] p-8 transition-all duration-300 hover:border-text-light/30 hover:-translate-y-1 h-full">
                            <div className="flex flex-col gap-4 mb-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-bold tracking-tight text-white uppercase">Escalar</h3>
                                    <span className="material-symbols-outlined text-text-muted">domain</span>
                                </div>
                                <div className="h-16">
                                    <p className="text-sm text-text-light leading-snug">
                                        "Control consolidado multi-sucursal."<br />
                                        Ideal para grupos gastronómicos y franquicias.
                                    </p>
                                </div>
                                <div className="flex items-baseline gap-1 mt-2">
                                    <span className="text-4xl font-black tracking-tight text-white">${prices.escalar}</span>
                                    <span className="text-base font-medium text-text-muted">/mes</span>
                                </div>
                            </div>
                            <button
                                onClick={() => navigate('/solicitar-demo')}
                                className="w-full h-12 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-white font-bold text-sm transition-all shadow-glow-sm mb-8"
                            >
                                Solicitar demo
                            </button>
                            <div className="flex flex-col gap-4 border-t border-white/5 pt-8 mt-auto">
                                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Gestión Corporativa:</p>
                                <div className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-white text-[20px] shrink-0">check</span>
                                    <span className="text-sm text-text-light">P&amp;L Consolidado en tiempo real</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-white text-[20px] shrink-0">check</span>
                                    <span className="text-sm text-text-light">Punto de equilibrio por local</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-white text-[20px] shrink-0">check</span>
                                    <span className="text-sm text-text-light">Análisis de capital inmovilizado</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-white text-[20px] shrink-0">check</span>
                                    <span className="text-sm text-text-light">Benchmarking entre sucursales</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-white text-[20px] shrink-0">check</span>
                                    <span className="text-sm text-text-light">API Full Access &amp; Auditoría</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="w-full max-w-[1000px] mt-24">
                        <div className="flex flex-col gap-4 text-center mb-12">
                            <h2 className="text-2xl md:text-3xl font-bold text-white">Comparativa de Madurez Financiera</h2>
                            <p className="text-text-light max-w-2xl mx-auto">
                                Identifica dónde se encuentra tu operación hoy y hacia dónde quieres llevarla.
                            </p>
                        </div>
                        <div className="overflow-x-auto rounded-xl border border-border-dark bg-card-dark">
                            <table className="w-full text-left text-sm text-text-light">
                                <thead className="bg-background-dark/50 text-[10px] sm:text-xs uppercase text-white font-bold border-b border-border-dark">
                                    <tr>
                                        <th className="px-4 sm:px-6 py-4 w-1/3" scope="col">Dimensión</th>
                                        <th className="px-4 sm:px-6 py-4 w-1/5 text-center text-text-muted" scope="col">Operar</th>
                                        <th className="px-4 sm:px-6 py-4 w-1/5 text-center text-primary" scope="col">Controlar</th>
                                        <th className="px-4 sm:px-6 py-4 w-1/5 text-center text-white" scope="col">Escalar</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-dark text-[11px] sm:text-sm">
                                    <tr className="hover:bg-white/5 transition-colors">
                                        <td className="px-4 sm:px-6 py-4 font-medium text-white">Visibilidad de Margen</td>
                                        <td className="px-4 sm:px-6 py-4 text-center">Teórico</td>
                                        <td className="px-4 sm:px-6 py-4 text-center font-bold text-primary">Real (FIFO)</td>
                                        <td className="px-4 sm:px-6 py-4 text-center">Consolidado</td>
                                    </tr>
                                    <tr className="hover:bg-white/5 transition-colors">
                                        <td className="px-4 sm:px-6 py-4 font-medium text-white">Impacto Financiero</td>
                                        <td className="px-4 sm:px-6 py-4 text-center">Solo Ventas</td>
                                        <td className="px-4 sm:px-6 py-4 text-center font-bold text-primary">Utilidad Neta</td>
                                        <td className="px-4 sm:px-6 py-4 text-center">EBITDA</td>
                                    </tr>
                                    <tr className="hover:bg-white/5 transition-colors">
                                        <td className="px-4 sm:px-6 py-4 font-medium text-white">Detección de Merma</td>
                                        <td className="px-4 sm:px-6 py-4 text-center text-text-muted">Manual</td>
                                        <td className="px-4 sm:px-6 py-4 text-center font-bold text-primary">Automática</td>
                                        <td className="px-4 sm:px-6 py-4 text-center">Predictiva</td>
                                    </tr>
                                    <tr className="hover:bg-white/5 transition-colors">
                                        <td className="px-4 sm:px-6 py-4 font-medium text-white">Consolidación</td>
                                        <td className="px-4 sm:px-6 py-4 text-center text-text-muted">-</td>
                                        <td className="px-4 sm:px-6 py-4 text-center text-text-muted">-</td>
                                        <td className="px-4 sm:px-6 py-4 text-center text-success font-bold">Corporativo</td>
                                    </tr>
                                    <tr className="hover:bg-white/5 transition-colors">
                                        <td className="px-4 sm:px-6 py-4 font-medium text-white">Control de Stock</td>
                                        <td className="px-4 sm:px-6 py-4 text-center">Básico</td>
                                        <td className="px-4 sm:px-6 py-4 text-center font-bold text-primary">Receta vs Real</td>
                                        <td className="px-4 sm:px-6 py-4 text-center">Centralizado</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-12 flex justify-center">
                            <button
                                onClick={() => navigate('/solicitar-demo')}
                                className="bg-primary hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-lg shadow-glow-sm transition-all text-lg"
                            >
                                Solicitar demo
                            </button>
                        </div>
                    </div>
                    <div className="w-full max-w-[850px] mt-32 mb-24 px-4 relative">
                        {/* Background Glows for the section */}
                        <div className="absolute -top-24 -left-24 size-96 bg-primary/5 blur-[100px] rounded-full pointer-events-none"></div>
                        <div className="absolute -bottom-24 -right-24 size-96 bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none"></div>

                        <div className="text-center mb-16 relative">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-4">
                                <span className="material-symbols-outlined text-sm">quiz</span> FAQ TÉCNICA
                            </div>
                            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-6">
                                Resolvemos tus <span className="text-primary">dudas</span>
                            </h2>
                            <div className="h-1 w-24 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto rounded-full"></div>
                            <p className="text-text-light mt-8 text-lg max-w-xl mx-auto leading-relaxed">
                                Entiende cómo nuestra arquitectura transforma la operación de tu restaurante en rentabilidad real.
                            </p>
                        </div>

                        <div className="grid gap-5 relative">
                            {[
                                {
                                    q: "¿El sistema requiere conocimientos contables para su uso?",
                                    a: "No. RestoGestión está diseñado para transformar eventos operativos en indicadores financieros automáticamente. El sistema habla el lenguaje de tu negocio, no el de un auditor, eliminando la necesidad de cálculos manuales o conciliaciones externas complejas."
                                },
                                {
                                    q: "¿Qué tipo de información financiera puedo visualizar?",
                                    a: (
                                        <div className="space-y-4">
                                            <p>Obtén una radiografía completa de tu rentabilidad en tiempo real con indicadores diseñados para la toma de decisiones:</p>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                                                {[
                                                    { label: "Utilidad neta real", icon: "payments" },
                                                    { label: "Margen por producto", icon: "analytics" },
                                                    { label: "Costo de alimentos (%)", icon: "restaurant_menu" },
                                                    { label: "Flujo de caja operativo", icon: "account_balance" },
                                                    { label: "Punto de equilibrio", icon: "show_chart" },
                                                    { label: "Rendimiento por sucursal", icon: "location_on" }
                                                ].map((item, idx) => (
                                                    <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 group/item hover:border-primary/30 transition-all">
                                                        <span className="material-symbols-outlined text-primary text-lg group-hover/item:scale-110 transition-transform">{item.icon}</span>
                                                        <span className="text-sm text-text-light font-medium">{item.label}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                },
                                {
                                    q: "¿Qué ocurre si existe merma o desperdicio de inventario?",
                                    a: "Contamos con un módulo de mermas inteligente. Al registrar cualquier desperdicio, el sistema recalcula instantáneamente el costo operativo y la utilidad proyectada, permitiéndote identificar patrones de pérdida y ajustar la operación antes de que afecte tu margen final."
                                },
                                {
                                    q: "¿Puedo analizar el rendimiento de cada sucursal de forma independiente?",
                                    a: "Sí. Nuestra arquitectura multi-compañía permite visualizar indicadores financieros por unidad operativa o consolidar resultados corporativos. Ideal para dueños que necesitan comparar la eficiencia entre locales en un solo panel."
                                },
                                {
                                    q: "¿Qué tan segura es la información registrada en el sistema?",
                                    a: "Utilizamos infraestructura en la nube con encriptación de grado bancario. Contamos con trazabilidad completa de acciones (quién hizo qué y cuándo), respaldos automáticos diarios y control de accesos granular por roles."
                                },
                                {
                                    q: "¿El cálculo de utilidad se realiza al cierre del mes?",
                                    a: "No. En RestoGestión la utilidad es dinámica. Cada venta, cada compra y cada gasto registrado impacta tu P&L al instante. Deja de esperar al contador 15 días después del cierre para saber si ganaste dinero."
                                },
                                {
                                    q: "¿Puedo comenzar sin cargar todo mi inventario desde el inicio?",
                                    a: "Totalmente. Nuestro método de implementación 'Pareto 80/20' recomienda empezar por tus 20 insumos de mayor impacto. Esto te permite generar valor financiero y control de costos desde la primera semana sin abrumar a tu equipo."
                                },
                                {
                                    q: "¿RestoGestión está diseñado para restaurantes pequeños?",
                                    a: "El sistema es modular. Servimos tanto a locales independientes que necesitan orden básico y digitalización de caja, como a grandes cadenas que requieren auditoría financiera profunda y control de inventarios multi-etapa."
                                },
                                {
                                    q: "¿Cómo impacta RestoGestión en la toma de decisiones operativas?",
                                    a: "Cambiamos el enfoque: de perseguir ventas a proteger márgenes. El sistema te alerta sobre variaciones de precios de proveedores, platos con baja rentabilidad y fugas de efectivo en tiempo real, dándote el poder de actuar de inmediato."
                                },
                                {
                                    q: "¿Qué significa \"FIFO Snapshot\"?",
                                    a: "Es nuestra tecnología de valoración de inventario. FIFO (First In, First Out) garantiza que el costo de tus platos refleje el precio real pagado por los lotes consumidos. El 'Snapshot' es la valoración monetaria de tu inventario actual en stock."
                                }
                            ].map((item, index) => (
                                <details key={index} className="group rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-sm hover:bg-slate-900/80 transition-all duration-500 overflow-hidden hover:border-primary/40 hover:shadow-[0_0_20px_rgba(59,130,246,0.05)]">
                                    <summary className="flex cursor-pointer items-center justify-between p-6 font-bold text-white list-none select-none">
                                        <span className="text-lg md:text-xl pr-6 font-semibold tracking-tight leading-tight group-hover:text-primary transition-colors">{item.q}</span>
                                        <div className="size-10 rounded-xl bg-white/5 flex items-center justify-center group-open:bg-primary group-open:shadow-glow-sm transition-all duration-300 border border-white/10">
                                            <span className="material-symbols-outlined text-2xl transition-transform duration-500 group-open:after:rotate-180 text-white/70 group-open:text-white">add</span>
                                        </div>
                                    </summary>
                                    <div className="px-7 pb-7 pt-0 text-text-light leading-relaxed animate-in fade-in slide-in-from-top-4 duration-500">
                                        <div className="h-px w-full bg-gradient-to-r from-primary/30 to-transparent mb-6"></div>
                                        <div className="text-sm md:text-base opacity-90">
                                            {typeof item.a === 'string' ? <p>{item.a}</p> : item.a}
                                        </div>
                                    </div>
                                </details>
                            ))}
                        </div>
                    </div>
                </main>
                <LandingFooter />
            </div>


        </div>
    );
};

export default PricingView;
