import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LandingHeader from './LandingHeader';

const ProblemView: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        document.documentElement.classList.add('dark');
        return () => {
            document.documentElement.classList.remove('dark');
        };
    }, []);

    return (
        <div className="bg-[#0F172A] text-slate-100 font-sans antialiased selection:bg-blue-600 selection:text-white overflow-x-hidden min-h-screen">

            <LandingHeader />
            <main className="flex flex-col items-center w-full">
                <section className="w-full max-w-6xl px-4 py-16 md:py-24 flex flex-col items-center text-center relative">
                    <div className="absolute inset-0 grid-bg pointer-events-none"></div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 border border-primary-blue/50 bg-secondary-bg/50 backdrop-blur-sm">
                        <span className="h-1.5 w-1.5 bg-primary-blue"></span>
                        <span className="text-primary-blue text-xs font-mono font-bold uppercase tracking-widest">Auditoría Financiera Operativa</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter leading-none mb-6 text-white max-w-4xl">
                        Podrías estar perdiendo hasta el <span className="text-critical-red">20% de tu utilidad</span> sin saberlo.
                    </h1>
                    <p className="text-lg text-slate-400 max-w-2xl font-light leading-relaxed mb-12">
                        Los costos invisibles en la operación diaria de tu restaurante están drenando tu flujo de caja. Realiza un diagnóstico técnico ahora.
                    </p>
                    <div className="w-full max-w-3xl bg-secondary-bg border border-slate-border p-1 relative group">
                        <div className="absolute -top-1 -left-1 w-2 h-2 border-l border-t border-primary-blue"></div>
                        <div className="absolute -top-1 -right-1 w-2 h-2 border-r border-t border-primary-blue"></div>
                        <div className="absolute -bottom-1 -left-1 w-2 h-2 border-l border-b border-primary-blue"></div>
                        <div className="absolute -bottom-1 -right-1 w-2 h-2 border-r border-b border-primary-blue"></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-border bg-main-bg">
                            <div className="p-6 flex flex-col items-start">
                                <div className="flex items-center gap-2 mb-2 w-full">
                                    <span className="material-symbols-outlined text-slate-500 text-sm">query_stats</span>
                                    <span className="text-xs text-slate-400 font-mono uppercase tracking-wider">Margen Estimado Real</span>
                                    <span className="ml-auto h-2 w-2 rounded-full bg-critical-red animate-pulse"></span>
                                </div>
                                <div className="text-4xl font-mono font-bold text-white mb-1">8.4%</div>
                                <div className="text-xs text-slate-500">vs. 15-20% Promedio Industria</div>
                            </div>
                            <div className="p-6 flex flex-col items-start bg-critical-red/5">
                                <div className="flex items-center gap-2 mb-2 w-full">
                                    <span className="material-symbols-outlined text-critical-red text-sm">warning</span>
                                    <span className="text-xs text-critical-red font-mono uppercase tracking-wider">Fuga Mensual Potencial</span>
                                </div>
                                <div className="text-4xl font-mono font-bold text-critical-red mb-1">-$4,200</div>
                                <div className="text-xs text-critical-red/80">Proyección basada en facturación media</div>
                            </div>
                        </div>
                        <div className="bg-secondary-bg px-4 py-2 flex justify-between items-center text-xs font-mono text-slate-400 border-t border-slate-border">
                            <span>SYSTEM_STATUS: AUDIT_REQUIRED</span>
                            <span>ID: #REQ-8821</span>
                        </div>
                    </div>
                </section>
                <section className="w-full border-y border-slate-border bg-secondary-bg/30">
                    <div className="max-w-7xl mx-auto px-4 py-16">
                        <div className="flex flex-col md:flex-row justify-between items-end mb-10 border-b border-slate-border pb-4">
                            <div>
                                <h2 className="text-2xl font-bold text-white tracking-tight">Origen de la Pérdida</h2>
                                <p className="text-slate-400 text-sm mt-1">Análisis de vectores de fuga financiera</p>
                            </div>
                            <div className="text-right hidden md:block">
                                <span className="text-xs font-mono text-primary-blue bg-primary-blue/10 px-2 py-1">DETECTING ANOMALIES...</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            <div className="technical-card technical-border bg-main-bg p-4 flex flex-col h-full transition-all duration-300">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="material-symbols-outlined text-slate-400">trending_up</span>
                                    <span className="text-xs font-mono text-slate-600">01</span>
                                </div>
                                <h3 className="text-sm font-bold text-white mb-2 uppercase">Inflación</h3>
                                <p className="text-xs text-slate-400 mb-4 flex-grow">Aumento de costos de insumos no reflejados en el precio de venta final.</p>
                                <div className="mt-auto border-t border-slate-border pt-3">
                                    <span className="text-[10px] uppercase text-critical-red font-bold block mb-1">Impacto Financiero</span>
                                    <span className="text-xs font-mono text-white">Reducen utilidad neta 2% - 4%</span>
                                </div>
                            </div>
                            <div className="technical-card technical-border bg-main-bg p-4 flex flex-col h-full transition-all duration-300">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="material-symbols-outlined text-slate-400">delete_outline</span>
                                    <span className="text-xs font-mono text-slate-600">02</span>
                                </div>
                                <h3 className="text-sm font-bold text-white mb-2 uppercase">Mermas</h3>
                                <p className="text-xs text-slate-400 mb-4 flex-grow">Desperdicio operativo y errores de producción en cocina no reportados.</p>
                                <div className="mt-auto border-t border-slate-border pt-3">
                                    <span className="text-[10px] uppercase text-critical-red font-bold block mb-1">Impacto Financiero</span>
                                    <span className="text-xs font-mono text-white">Reducen utilidad neta 3% - 5%</span>
                                </div>
                            </div>
                            <div className="technical-card technical-border bg-main-bg p-4 flex flex-col h-full transition-all duration-300">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="material-symbols-outlined text-slate-400">restaurant</span>
                                    <span className="text-xs font-mono text-slate-600">03</span>
                                </div>
                                <h3 className="text-sm font-bold text-white mb-2 uppercase">Consumo Interno</h3>
                                <p className="text-xs text-slate-400 mb-4 flex-grow">Alimentos de personal y cortesías sin registro contable adecuado.</p>
                                <div className="mt-auto border-t border-slate-border pt-3">
                                    <span className="text-[10px] uppercase text-critical-red font-bold block mb-1">Impacto Financiero</span>
                                    <span className="text-xs font-mono text-white">Reducen utilidad neta 1% - 3%</span>
                                </div>
                            </div>
                            <div className="technical-card technical-border bg-main-bg p-4 flex flex-col h-full transition-all duration-300">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="material-symbols-outlined text-slate-400">inventory_2</span>
                                    <span className="text-xs font-mono text-slate-600">04</span>
                                </div>
                                <h3 className="text-sm font-bold text-white mb-2 uppercase">Sobreproducción</h3>
                                <p className="text-xs text-slate-400 mb-4 flex-grow">Preparación excesiva que termina en la basura por falta de pronóstico.</p>
                                <div className="mt-auto border-t border-slate-border pt-3">
                                    <span className="text-[10px] uppercase text-critical-red font-bold block mb-1">Impacto Financiero</span>
                                    <span className="text-xs font-mono text-white">Reducen utilidad neta 2% - 6%</span>
                                </div>
                            </div>
                            <div className="technical-card technical-border bg-main-bg p-4 flex flex-col h-full transition-all duration-300">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="material-symbols-outlined text-slate-400">visibility_off</span>
                                    <span className="text-xs font-mono text-slate-600">05</span>
                                </div>
                                <h3 className="text-sm font-bold text-white mb-2 uppercase">Gastos Ocultos</h3>
                                <p className="text-xs text-slate-400 mb-4 flex-grow">Pequeños gastos de caja chica y mantenimiento no categorizados.</p>
                                <div className="mt-auto border-t border-slate-border pt-3">
                                    <span className="text-[10px] uppercase text-critical-red font-bold block mb-1">Impacto Financiero</span>
                                    <span className="text-xs font-mono text-white">Reducen utilidad neta 1% - 4%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                <section className="w-full max-w-4xl px-4 py-20 flex flex-col md:flex-row gap-12 items-center">
                    <div className="flex-1">
                        <h2 className="text-3xl font-bold text-white mb-6">Utilidad Ficticia vs. <br /><span className="text-primary-blue">Rentabilidad Real</span></h2>
                        <div className="space-y-4 text-slate-400 text-sm leading-relaxed">
                            <p>
                                La contabilidad tradicional suele reportar una "Utilidad Ficticia" basada en costos teóricos. Sin embargo, la realidad operativa (mermas, robos, inflación) crea una brecha financiera significativa.
                            </p>
                            <p>
                                ControlRest V2.0 audita cada movimiento para revelar tu "Rentabilidad Real", eliminando la incertidumbre de los reportes financieros mensuales.
                            </p>
                        </div>
                    </div>
                    <div className="flex-1 w-full">
                        <div className="bg-secondary-bg border border-slate-border p-6 relative">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-mono text-slate-400">UTILIDAD REPORTADA (LIBROS)</span>
                                <span className="text-sm font-bold text-white">18.5%</span>
                            </div>
                            <div className="w-full h-2 bg-slate-700 mb-6">
                                <div className="h-full bg-slate-400 w-[75%]"></div>
                            </div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-mono text-primary-blue">RENTABILIDAD REAL (AUDITADA)</span>
                                <span className="text-sm font-bold text-primary-blue">8.4%</span>
                            </div>
                            <div className="w-full h-2 bg-slate-700 relative">
                                <div className="h-full bg-primary-blue w-[35%] relative">
                                    <div className="absolute right-0 -top-1 bottom-0 border-r border-white"></div>
                                </div>
                                <div className="absolute left-[35%] w-[40%] h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMWMyNTQxIi8+CjxwYXRoIGQ9Ik0wIDBMNCA0Wk00IDBMMCA0WiIgc3Ryb2tlPSIjZmY0ZDRmIiBzdHJva2Utd2lkdGg9IjEiLz4KPC9zdmc+')] opacity-50"></div>
                            </div>
                            <div className="mt-2 text-right">
                                <span className="text-xs font-mono text-critical-red">-10.1% BRECHA FINANCIERA</span>
                            </div>
                        </div>
                    </div>
                </section>
                <section className="w-full bg-secondary-bg/20 border-y border-slate-border py-20">
                    <div className="max-w-5xl mx-auto px-4">
                        <div className="mb-12 border-l-4 border-critical-red pl-6">
                            <h2 className="text-3xl font-bold text-white">Los 4 Errores Financieros</h2>
                            <p className="text-slate-400 mt-2">Patrones recurrentes en restaurantes con fugas de capital.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-slate-border border border-slate-border">
                            <div className="bg-main-bg p-8 hover:bg-secondary-bg transition-colors group">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="material-symbols-outlined text-3xl text-slate-500 group-hover:text-primary-blue">calculate</span>
                                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-critical-red bg-critical-red/10 border border-critical-red/20">Impacto Crítico</span>
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">Costeo no actualizado</h3>
                                <p className="text-sm text-slate-400 leading-relaxed mb-4">
                                    Precios de venta calculados con costos de insumos de hace meses. La inflación absorbe tu margen silenciosamente.
                                </p>
                            </div>
                            <div className="bg-main-bg p-8 hover:bg-secondary-bg transition-colors group">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="material-symbols-outlined text-3xl text-slate-500 group-hover:text-primary-blue">inventory</span>
                                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-orange-400 bg-orange-400/10 border border-orange-400/20">Impacto Alto</span>
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">Inventario sin valorización</h3>
                                <p className="text-sm text-slate-400 leading-relaxed mb-4">
                                    Conteo físico que no se cruza con valor monetario real. Sabes cuántas botellas tienes, pero no cuánto capital está parado.
                                </p>
                            </div>
                            <div className="bg-main-bg p-8 hover:bg-secondary-bg transition-colors group">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="material-symbols-outlined text-3xl text-slate-500 group-hover:text-primary-blue">shopping_cart_checkout</span>
                                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-yellow-400 bg-yellow-400/10 border border-yellow-400/20">Impacto Medio</span>
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">Compras sin impacto</h3>
                                <p className="text-sm text-slate-400 leading-relaxed mb-4">
                                    Adquisición de insumos basada en intuición y no en datos históricos de consumo real por platillo.
                                </p>
                            </div>
                            <div className="bg-main-bg p-8 hover:bg-secondary-bg transition-colors group">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="material-symbols-outlined text-3xl text-slate-500 group-hover:text-primary-blue">point_of_sale</span>
                                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-critical-red bg-critical-red/10 border border-critical-red/20">Impacto Crítico</span>
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">Utilidad basada en Ventas Brutas</h3>
                                <p className="text-sm text-slate-400 leading-relaxed mb-4">
                                    Error fundamental: medir el éxito por la facturación total sin descontar costos ocultos e impuestos operativos.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
                <section className="w-full py-24 flex items-center justify-center bg-main-bg relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center opacity-5">
                        <span className="text-[20vw] font-black text-white leading-none tracking-tighter select-none">ERROR</span>
                    </div>
                    <div className="relative z-10 text-center max-w-2xl px-4">
                        <h2 className="text-3xl md:text-4xl font-mono font-bold text-white mb-2">
                            El problema no es operativo.
                        </h2>
                        <h2 className="text-3xl md:text-4xl font-mono font-bold text-primary-blue">
                            Es financiero.
                        </h2>
                        <div className="w-24 h-1 bg-critical-red mx-auto mt-8"></div>
                    </div>
                </section>
                <section className="w-full bg-secondary-bg border-t border-slate-border py-20 px-4">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="inline-block p-4 border border-slate-border bg-main-bg mb-8 rounded-full">
                            <span className="material-symbols-outlined text-4xl text-primary-blue">finance_chip</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Recupera el control de tus márgenes</h2>
                        <p className="text-slate-400 mb-10 max-w-xl mx-auto">
                            Implementa ControlRest V2.0 y transforma tu operación en un sistema financiero blindado.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full max-w-lg mx-auto">
                            <button className="w-full sm:w-auto bg-primary-blue hover:bg-blue-600 text-white font-bold py-4 px-8 uppercase tracking-wider text-sm border border-blue-400 transition-all hover:shadow-[0_0_20px_rgba(58,134,255,0.3)]">
                                [ Auditar mi operación ahora ]
                            </button>
                            <button className="w-full sm:w-auto bg-transparent hover:bg-white/5 text-slate-300 hover:text-white font-mono font-bold py-4 px-8 uppercase tracking-wider text-sm border border-slate-border transition-colors">
                                Ver cómo funciona
                            </button>
                        </div>
                        <div className="mt-8 flex items-center justify-center gap-6 text-xs text-slate-500 font-mono">
                            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">check_circle</span> Configuración inmediata</span>
                            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">check_circle</span> Sin contratos forzosos</span>
                        </div>
                    </div>
                </section>
                <footer className="w-full bg-main-bg border-t border-slate-border py-12 px-4 text-xs font-mono">
                    <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-slate-500">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">terminal</span>
                            <span className="font-bold">ControlRest V2.0 SYSTEMS</span>
                        </div>
                        <div className="flex gap-6 uppercase tracking-wider">
                            <a className="hover:text-primary-blue" href="#">Privacidad</a>
                            <a className="hover:text-primary-blue" href="#">Términos</a>
                            <a className="hover:text-primary-blue" href="#">Soporte</a>
                        </div>
                        <div>
                            © 2023 FINANCIAL AUDIT MODULE.
                        </div>
                    </div>
                </footer>
            </main>


        </div>
    );
};

export default ProblemView;
