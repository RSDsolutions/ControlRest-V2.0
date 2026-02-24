import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LandingHeader from './LandingHeader';

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
                    <div className="max-w-[960px] w-full flex flex-col items-center text-center gap-6 mb-16">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight tracking-tight text-white max-w-5xl">
                            No todos los restaurantes necesitan más ventas. <span className="text-primary block mt-2">Necesitan más control.</span>
                        </h1>
                        <p className="text-lg text-text-light max-w-2xl font-normal leading-relaxed">
                            La mayoría de los negocios gastronómicos mueren vendiendo mucho pero ganando poco. ControlRest V2.0 te da visibilidad financiera diaria para transformar flujo de caja en utilidad neta.
                        </p>
                        <div className="flex items-center p-1 bg-card-dark rounded-full border border-border-dark mt-8 transition-all">
                            <button
                                onClick={() => setIsAnnual(false)}
                                className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${!isAnnual ? 'bg-primary text-white shadow-glow-sm' : 'text-text-light hover:text-white'}`}
                            >
                                Mensual
                            </button>
                            <button
                                onClick={() => setIsAnnual(true)}
                                className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${isAnnual ? 'bg-primary text-white shadow-glow-sm' : 'text-text-light hover:text-white'}`}
                            >
                                Anual <span className="text-xs text-primary font-bold ml-1 border border-primary px-1 rounded bg-primary/10">-20%</span>
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
                                className="w-full h-12 rounded-xl bg-white hover:bg-gray-200 text-background-dark font-bold text-sm transition-colors mb-8"
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
                                <thead className="bg-background-dark/50 text-xs uppercase text-white font-bold border-b border-border-dark">
                                    <tr>
                                        <th className="px-6 py-4 w-1/3" scope="col">Dimensión</th>
                                        <th className="px-6 py-4 w-1/5 text-center text-text-muted" scope="col">Operar</th>
                                        <th className="px-6 py-4 w-1/5 text-center text-primary" scope="col">Controlar</th>
                                        <th className="px-6 py-4 w-1/5 text-center text-white" scope="col">Escalar</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-dark">
                                    <tr className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 font-medium text-white">Visibilidad de Margen</td>
                                        <td className="px-6 py-4 text-center">Teórico</td>
                                        <td className="px-6 py-4 text-center font-bold text-primary">Real (FIFO)</td>
                                        <td className="px-6 py-4 text-center">Consolidado</td>
                                    </tr>
                                    <tr className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 font-medium text-white">Impacto Financiero</td>
                                        <td className="px-6 py-4 text-center">Solo Ventas</td>
                                        <td className="px-6 py-4 text-center font-bold text-primary">Utilidad Neta</td>
                                        <td className="px-6 py-4 text-center">EBITDA</td>
                                    </tr>
                                    <tr className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 font-medium text-white">Detección de Merma</td>
                                        <td className="px-6 py-4 text-center text-text-muted">Manual</td>
                                        <td className="px-6 py-4 text-center font-bold text-primary">Automática</td>
                                        <td className="px-6 py-4 text-center">Predictiva</td>
                                    </tr>
                                    <tr className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 font-medium text-white">Consolidación</td>
                                        <td className="px-6 py-4 text-center text-text-muted">-</td>
                                        <td className="px-6 py-4 text-center text-text-muted">-</td>
                                        <td className="px-6 py-4 text-center text-success font-bold">Multi-Razón Social</td>
                                    </tr>
                                    <tr className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 font-medium text-white">Control de Stock</td>
                                        <td className="px-6 py-4 text-center">Básico</td>
                                        <td className="px-6 py-4 text-center font-bold text-primary">Receta vs Real</td>
                                        <td className="px-6 py-4 text-center">Centralizado</td>
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
                    <div className="w-full max-w-[800px] mt-24 mb-10">
                        <h2 className="text-2xl font-bold text-white mb-8 text-center">Preguntas Frecuentes sobre Control</h2>
                        <div className="flex flex-col gap-4">
                            <details className="group rounded-xl border border-border-dark bg-card-dark p-4 transition-all">
                                <summary className="flex cursor-pointer items-center justify-between font-medium text-white">
                                    <span>¿Qué significa "FIFO Snapshot"?</span>
                                    <span className="material-symbols-outlined transition-transform group-open:rotate-180">expand_more</span>
                                </summary>
                                <p className="mt-3 text-sm text-text-light leading-relaxed">
                                    FIFO (First In, First Out) significa que costeamos tus platos usando el precio real del lote de insumos que se consumió. El "Snapshot" es una foto exacta del valor de tu inventario en cualquier momento, permitiéndote saber exactamente cuánto dinero tienes parado en la cocina.
                                </p>
                            </details>
                            <details className="group rounded-xl border border-border-dark bg-card-dark p-4 transition-all">
                                <summary className="flex cursor-pointer items-center justify-between font-medium text-white">
                                    <span>¿Por qué el plan OPERAR no incluye utilidad real?</span>
                                    <span className="material-symbols-outlined transition-transform group-open:rotate-180">expand_more</span>
                                </summary>
                                <p className="mt-3 text-sm text-text-light leading-relaxed">
                                    Para calcular utilidad real necesitamos trazabilidad de inventario y recetas. El plan OPERAR está diseñado para negocios que recién empiezan a digitalizarse y solo necesitan conectar el POS para ver ventas y cuadrar caja, sin la complejidad operativa de llevar inventarios estrictos.
                                </p>
                            </details>
                            <details className="group rounded-xl border border-border-dark bg-card-dark p-4 transition-all">
                                <summary className="flex cursor-pointer items-center justify-between font-medium text-white">
                                    <span>¿Cuánto tiempo toma implementar el nivel CONTROLAR?</span>
                                    <span className="material-symbols-outlined transition-transform group-open:rotate-180">expand_more</span>
                                </summary>
                                <p className="mt-3 text-sm text-text-light leading-relaxed">
                                    Depende de la calidad de tus recetas actuales. Si tienes recetas estándar, la carga inicial toma entre 3 a 5 días. Nuestro equipo de onboarding te asiste en la carga masiva de ingredientes y configuración de fichas técnicas.
                                </p>
                            </details>
                        </div>
                    </div>
                </main>
                <footer className="border-t border-border-dark py-12 px-10 bg-background-dark">
                    <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-3 text-white">
                            <div className="size-6 text-primary">
                                <svg className="w-full h-full" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M42.4379 44C42.4379 44 36.0744 33.9038 41.1692 24C46.8624 12.9336 42.2078 4 42.2078 4L7.01134 4C7.01134 4 11.6577 12.932 5.96912 23.9969C0.876273 33.9029 7.27094 44 7.27094 44L42.4379 44Z" fill="currentColor"></path>
                                </svg>
                            </div>
                            <span className="font-bold text-sm">ControlRest V2.0</span>
                        </div>
                        <div className="text-xs text-text-muted">
                            © 2024 ControlRest Inc. Datos financieros seguros.
                        </div>
                        <div className="flex gap-4">
                            <a className="text-text-muted hover:text-primary transition-colors" href="#">
                                <span className="sr-only">LinkedIn</span>
                                <svg aria-hidden="true" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path clip-rule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" fill-rule="evenodd"></path></svg>
                            </a>
                        </div>
                    </div>
                </footer>
            </div>


        </div>
    );
};

export default PricingView;
