import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LandingHeader from './LandingHeader';
import LandingFooter from './LandingFooter';

const FeaturesView: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        document.documentElement.classList.add('dark');
        return () => {
            document.documentElement.classList.remove('dark');
        };
    }, []);

    return (
        <div className="bg-[#0F172A] text-slate-100 font-sans antialiased selection:bg-blue-600 selection:text-white overflow-x-hidden min-h-screen">

            <div className="flex min-h-screen w-full flex-col overflow-x-hidden erp-grid">
                <LandingHeader />
                <main className="flex-grow">
                    <section className="relative isolate overflow-hidden pt-14 pb-16 sm:pt-24 sm:pb-20">
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
                            <div className="inline-flex items-center gap-2 rounded-sm bg-surface-dark px-3 py-1 text-xs font-mono text-primary mb-8 border border-white/10">
                                <span className="h-2 w-2 rounded-full bg-success animate-pulse"></span>
                                SISTEMA FINANCIERO OPERATIVO ACTIVO
                            </div>
                            <h1 className="mx-auto max-w-5xl text-4xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl mb-8 leading-tight">
                                Tu utilidad no depende de cuánto vendes. <br />
                                <span className="text-primary">Depende de cuánto te cuesta producir cada venta.</span>
                            </h1>
                            <p className="mx-auto max-w-2xl text-lg leading-8 text-slate-400 mb-10 font-light">
                                Transforma tu restaurante en una operación financiera predecible. Controla el margen real plato por plato, turno por turno.
                            </p>
                        </div>
                    </section>
                    <section className="py-16 bg-surface-dark border-y border-white/5">
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            <div className="text-center mb-12">
                                <h2 className="text-2xl font-bold text-white">Flujo Financiero Automatizado</h2>
                                <p className="text-slate-400 mt-2">Cada venta deja de ser solo ingreso. Se convierte en un evento financiero medible.</p>
                            </div>
                            <div className="relative">
                                <div className="hidden md:flex justify-between items-center gap-4 relative z-10">
                                    <div className="flex-1 relative group">
                                        <div className="bg-background-dark border border-white/10 p-6 rounded-sm text-center hover:border-primary/50 transition-all h-full flex flex-col items-center justify-center gap-3">
                                            <span className="material-symbols-outlined text-4xl text-slate-500 group-hover:text-primary transition-colors">point_of_sale</span>
                                            <h3 className="font-bold text-white text-sm">Pedido en POS</h3>
                                        </div>
                                        <div className="hidden lg:block absolute top-1/2 -right-6 w-12 h-[2px] bg-white/10 -translate-y-1/2 z-0">
                                            <div className="absolute right-0 -top-[4px] border-t-[6px] border-b-[6px] border-l-[8px] border-t-transparent border-b-transparent border-l-white/10"></div>
                                        </div>
                                    </div>
                                    <div className="flex-1 relative group">
                                        <div className="bg-background-dark border border-white/10 p-6 rounded-sm text-center hover:border-primary/50 transition-all h-full flex flex-col items-center justify-center gap-3">
                                            <span className="material-symbols-outlined text-4xl text-slate-500 group-hover:text-primary transition-colors">soup_kitchen</span>
                                            <h3 className="font-bold text-white text-sm">Consumo automático</h3>
                                        </div>
                                        <div className="hidden lg:block absolute top-1/2 -right-6 w-12 h-[2px] bg-white/10 -translate-y-1/2 z-0">
                                            <div className="absolute right-0 -top-[4px] border-t-[6px] border-b-[6px] border-l-[8px] border-t-transparent border-b-transparent border-l-white/10"></div>
                                        </div>
                                    </div>
                                    <div className="flex-1 relative group">
                                        <div className="bg-background-dark border border-white/10 p-6 rounded-sm text-center hover:border-primary/50 transition-all h-full flex flex-col items-center justify-center gap-3">
                                            <span className="material-symbols-outlined text-4xl text-slate-500 group-hover:text-primary transition-colors">receipt_long</span>
                                            <h3 className="font-bold text-white text-sm">Costo Real FIFO</h3>
                                        </div>
                                        <div className="hidden lg:block absolute top-1/2 -right-6 w-12 h-[2px] bg-white/10 -translate-y-1/2 z-0">
                                            <div className="absolute right-0 -top-[4px] border-t-[6px] border-b-[6px] border-l-[8px] border-t-transparent border-b-transparent border-l-white/10"></div>
                                        </div>
                                    </div>
                                    <div className="flex-1 relative group">
                                        <div className="bg-background-dark border border-white/10 p-6 rounded-sm text-center hover:border-primary/50 transition-all h-full flex flex-col items-center justify-center gap-3">
                                            <span className="material-symbols-outlined text-4xl text-slate-500 group-hover:text-primary transition-colors">trending_down</span>
                                            <h3 className="font-bold text-white text-sm">Impacto en Utilidad</h3>
                                        </div>
                                        <div className="hidden lg:block absolute top-1/2 -right-6 w-12 h-[2px] bg-white/10 -translate-y-1/2 z-0">
                                            <div className="absolute right-0 -top-[4px] border-t-[6px] border-b-[6px] border-l-[8px] border-t-transparent border-b-transparent border-l-white/10"></div>
                                        </div>
                                    </div>
                                    <div className="flex-1 relative group">
                                        <div className="bg-background-dark border border-success/30 p-6 rounded-sm text-center shadow-[0_0_15px_-3px_rgba(46,204,113,0.1)] h-full flex flex-col items-center justify-center gap-3">
                                            <span className="material-symbols-outlined text-4xl text-success">account_balance_wallet</span>
                                            <h3 className="font-bold text-white text-sm">P&amp;L Diario</h3>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex md:hidden flex-col gap-4">
                                    <div className="bg-background-dark border border-white/10 p-4 rounded-sm flex items-center gap-4">
                                        <span className="material-symbols-outlined text-2xl text-slate-500">point_of_sale</span>
                                        <span className="font-bold text-white text-sm">Pedido en POS</span>
                                    </div>
                                    <div className="mx-auto text-white/20"><span className="material-symbols-outlined">arrow_downward</span></div>
                                    <div className="bg-background-dark border border-white/10 p-4 rounded-sm flex items-center gap-4">
                                        <span className="material-symbols-outlined text-2xl text-slate-500">soup_kitchen</span>
                                        <span className="font-bold text-white text-sm">Consumo automático</span>
                                    </div>
                                    <div className="mx-auto text-white/20"><span className="material-symbols-outlined">arrow_downward</span></div>
                                    <div className="bg-background-dark border border-white/10 p-4 rounded-sm flex items-center gap-4">
                                        <span className="material-symbols-outlined text-2xl text-slate-500">receipt_long</span>
                                        <span className="font-bold text-white text-sm">Costo real FIFO</span>
                                    </div>
                                    <div className="mx-auto text-white/20"><span className="material-symbols-outlined">arrow_downward</span></div>
                                    <div className="bg-background-dark border border-white/10 p-4 rounded-sm flex items-center gap-4">
                                        <span className="material-symbols-outlined text-2xl text-slate-500">trending_down</span>
                                        <span className="font-bold text-white text-sm">Impacto en utilidad</span>
                                    </div>
                                    <div className="mx-auto text-white/20"><span className="material-symbols-outlined">arrow_downward</span></div>
                                    <div className="bg-background-dark border border-success/30 p-4 rounded-sm flex items-center gap-4">
                                        <span className="material-symbols-outlined text-2xl text-success">account_balance_wallet</span>
                                        <span className="font-bold text-white text-sm">P&amp;L Diario</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                    <section className="py-16 sm:py-24">
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            <div className="mb-10 flex items-center gap-3">
                                <span className="bg-primary/20 p-2 rounded-sm text-primary material-symbols-outlined">calculate</span>
                                <h2 className="text-3xl font-bold text-white">Motor de Costos</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="bg-surface-dark p-6 rounded-sm border border-white/5 hover:border-primary/50 transition-colors group">
                                    <div className="mb-4 text-primary group-hover:scale-110 transition-transform origin-left">
                                        <span className="material-symbols-outlined text-4xl">integration_instructions</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-2">Recetas Vinculadas</h3>
                                    <p className="text-sm text-slate-400">Cada ingrediente está conectado a su SKU de inventario. Sin duplicidades, sin errores manuales.</p>
                                </div>
                                <div className="bg-surface-dark p-6 rounded-sm border border-white/5 hover:border-primary/50 transition-colors group">
                                    <div className="mb-4 text-primary group-hover:scale-110 transition-transform origin-left">
                                        <span className="material-symbols-outlined text-4xl">sync_alt</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-2">Actualización por Factura</h3>
                                    <p className="text-sm text-slate-400">El costo de la receta se recalcula automáticamente al ingresar una nueva factura de compra.</p>
                                </div>
                                <div className="bg-surface-dark p-6 rounded-sm border border-white/5 hover:border-primary/50 transition-colors group">
                                    <div className="mb-4 text-primary group-hover:scale-110 transition-transform origin-left">
                                        <span className="material-symbols-outlined text-4xl">pie_chart_outlined</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-2">Margen por Plato</h3>
                                    <p className="text-sm text-slate-400">Visualiza la contribución real de cada item del menú a tu utilidad bruta.</p>
                                </div>
                                <div className="bg-surface-dark p-6 rounded-sm border border-white/5 hover:border-primary/50 transition-colors group">
                                    <div className="mb-4 text-primary group-hover:scale-110 transition-transform origin-left">
                                        <span className="material-symbols-outlined text-4xl">science</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-2">Simulación</h3>
                                    <p className="text-sm text-slate-400">Modela cambios de precios en proveedores y ve cómo afectan tu rentabilidad antes de que suceda.</p>
                                </div>
                            </div>
                        </div>
                    </section>
                    <section className="py-16 bg-surface-dark/30 border-y border-white/5">
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                                <div>
                                    <div className="flex items-center gap-3 mb-6">
                                        <span className="bg-primary/20 p-2 rounded-sm text-primary material-symbols-outlined">inventory_2</span>
                                        <h2 className="text-2xl font-bold text-white">Inventario Financiero</h2>
                                    </div>
                                    <p className="text-slate-400 mb-8">El stock no es solo cantidad, es dinero inmovilizado. Gestiona tu capital de trabajo.</p>
                                    <ul className="space-y-6">
                                        <li className="flex gap-4">
                                            <span className="material-symbols-outlined text-success mt-1">monetization_on</span>
                                            <div>
                                                <strong className="block text-white">Capital Inmovilizado</strong>
                                                <span className="text-sm text-slate-500">Reporte en tiempo real del valor monetario de tu bodega.</span>
                                            </div>
                                        </li>
                                        <li className="flex gap-4">
                                            <span className="material-symbols-outlined text-red-400 mt-1">delete_forever</span>
                                            <div>
                                                <strong className="block text-white">Impacto de Mermas</strong>
                                                <span className="text-sm text-slate-500">Cada gramo desperdiciado se contabiliza como pérdida financiera directa en el P&amp;L.</span>
                                            </div>
                                        </li>
                                    </ul>
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-6">
                                        <span className="bg-primary/20 p-2 rounded-sm text-primary material-symbols-outlined">shopping_cart</span>
                                        <h2 className="text-2xl font-bold text-white">Compras Estratégicas</h2>
                                    </div>
                                    <p className="text-slate-400 mb-8">Tus decisiones de compra definen tu margen antes de vender el primer plato.</p>
                                    <ul className="space-y-6">
                                        <li className="flex gap-4">
                                            <span className="material-symbols-outlined text-primary mt-1">trending_up</span>
                                            <div>
                                                <strong className="block text-white">Impacto en Margen</strong>
                                                <span className="text-sm text-slate-500">Alerta inmediata si una compra eleva el costo por encima del umbral permitido.</span>
                                            </div>
                                        </li>
                                        <li className="flex gap-4">
                                            <span className="material-symbols-outlined text-primary mt-1">history_edu</span>
                                            <div>
                                                <strong className="block text-white">Histórico de Costos</strong>
                                                <span className="text-sm text-slate-500">Audita la evolución de precios de tus proveedores clave mes a mes.</span>
                                            </div>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </section>
                    <section className="py-16 sm:py-24">
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            <div className="text-center mb-16">
                                <h2 className="text-3xl font-bold text-white">Dashboard Ejecutivo</h2>
                                <p className="text-slate-400 mt-2">La salud financiera de tu negocio en una sola pantalla.</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="bg-surface-dark border border-white/5 p-8 rounded-sm text-center relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
                                    <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-2">Utilidad Bruta / Neta</h3>
                                    <div className="text-4xl font-mono text-white font-bold my-4">24.8%</div>
                                    <p className="text-xs text-success flex items-center justify-center gap-1">
                                        <span className="material-symbols-outlined text-sm">arrow_upward</span> +2.4% vs mes anterior
                                    </p>
                                </div>
                                <div className="bg-surface-dark border border-white/5 p-8 rounded-sm text-center relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
                                    <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-2">Capital Inmovilizado</h3>
                                    <div className="text-4xl font-mono text-white font-bold my-4">$12,450</div>
                                    <p className="text-xs text-slate-500">Valorización FIFO actual</p>
                                </div>
                                <div className="bg-surface-dark border border-white/5 p-8 rounded-sm text-center relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
                                    <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-2">Punto de Equilibrio</h3>
                                    <div className="text-4xl font-mono text-white font-bold my-4">Dia 18</div>
                                    <p className="text-xs text-slate-500">Proyección de cobertura de costos fijos</p>
                                </div>
                            </div>
                        </div>
                    </section>
                    <section className="relative isolate overflow-hidden bg-surface-dark px-6 py-24 sm:px-24 xl:py-32 border-t border-white/10">
                        <div className="absolute inset-0 -z-10 h-full w-full bg-[radial-gradient(#3A86FF_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.05]"></div>
                        <div className="mx-auto max-w-2xl text-center">
                            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Cada pedido debería decirte cuánto ganaste.</h2>
                            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-slate-400">
                                Deja de operar a ciegas. Empieza a tomar decisiones basadas en datos financieros operativos reales.
                            </p>
                            <div className="mt-10 flex items-center justify-center gap-x-6">
                                <button
                                    onClick={() => navigate('/solicitar-demo')}
                                    className="rounded-sm bg-primary px-8 py-4 text-base font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all border border-white/10"
                                >
                                    Solicitar Demo Financiera
                                </button>
                            </div>
                        </div>
                    </section>
                </main>
                <LandingFooter />
            </div>


        </div>
    );
};

export default FeaturesView;
