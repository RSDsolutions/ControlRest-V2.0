import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LandingHeader from './LandingHeader';

const HowItWorksView: React.FC = () => {
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
            <main className="flex-1 flex flex-col items-center w-full px-4 py-8 lg:py-16">
                <div className="max-w-[1200px] w-full flex flex-col gap-16 lg:gap-24">
                    <div className="text-center space-y-6 max-w-4xl mx-auto">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/10 border border-blue-500/30 text-blue-500 text-xs font-semibold uppercase tracking-wider mb-2">
                            <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            Inteligencia Financiera en Tiempo Real
                        </div>
                        <h1 className="text-4xl lg:text-6xl font-black leading-tight tracking-tight text-white">
                            Cada venta debería decirte <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-emerald-500">cuánto ganaste</span>
                        </h1>
                        <p className="text-slate-400 text-lg lg:text-xl font-normal max-w-2xl mx-auto">
                            No solo registres ingresos. Transforma cada transacción en un evento financiero medible que conecta tu POS con tu P&amp;L instantáneamente.
                        </p>
                    </div>
                    <div className="space-y-8">
                        <div className="text-center mb-10">
                            <h2 className="text-2xl lg:text-3xl font-bold text-white mb-3">Tu POS registra ingresos.</h2>
                            <p className="text-xl text-slate-400">No registra <span className="text-white font-semibold border-b-2 border-red-500/50">cuánto te costó</span> producir esa venta.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-[#1E293B] p-6 rounded-xl border border-[#3A4B6B] hover:border-red-400/50 transition-colors group">
                                <div className="size-10 rounded-lg bg-red-500/10 flex items-center justify-center mb-4 group-hover:bg-red-500/20 transition-colors">
                                    <span className="material-symbols-outlined text-red-400">trending_up</span>
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">Inflación Oculta</h3>
                                <p className="text-sm text-slate-400">Los costos de insumos suben diariamente, pero tus precios de venta se mantienen estáticos.</p>
                            </div>
                            <div className="bg-[#1E293B] p-6 rounded-xl border border-[#3A4B6B] hover:border-red-400/50 transition-colors group">
                                <div className="size-10 rounded-lg bg-red-500/10 flex items-center justify-center mb-4 group-hover:bg-red-500/20 transition-colors">
                                    <span className="material-symbols-outlined text-red-400">visibility_off</span>
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">Mermas Invisibles</h3>
                                <p className="text-sm text-slate-400">El desperdicio en cocina y el robo hormiga no se reflejan en el ticket de venta.</p>
                            </div>
                            <div className="bg-[#1E293B] p-6 rounded-xl border border-[#3A4B6B] hover:border-red-400/50 transition-colors group">
                                <div className="size-10 rounded-lg bg-red-500/10 flex items-center justify-center mb-4 group-hover:bg-red-500/20 transition-colors">
                                    <span className="material-symbols-outlined text-red-400">menu_book</span>
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">Recetas Teóricas</h3>
                                <p className="text-sm text-slate-400">Lo que dice la ficha técnica rara vez coincide con la porción real servida en el plato.</p>
                            </div>
                            <div className="bg-[#1E293B] p-6 rounded-xl border border-[#3A4B6B] hover:border-red-400/50 transition-colors group">
                                <div className="size-10 rounded-lg bg-red-500/10 flex items-center justify-center mb-4 group-hover:bg-red-500/20 transition-colors">
                                    <span className="material-symbols-outlined text-red-400">money_off</span>
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">Costos no Asignados</h3>
                                <p className="text-sm text-slate-400">Empaques, guarniciones y salsas extra que se entregan sin descontar inventario.</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-[#1E293B]/50 rounded-2xl p-8 lg:p-12 border border-[#3A4B6B] relative overflow-hidden">
                        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl"></div>
                        <h2 className="text-2xl lg:text-3xl font-bold text-white mb-12 text-center">El Flujo de la Verdad Financiera</h2>
                        <div className="grid grid-cols-1 lg:grid-cols-6 gap-8 relative z-10">
                            <div className="flex flex-col items-center flow-connector">
                                <div className="w-16 h-16 rounded-full bg-[#0F172A] border-2 border-blue-500 flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(58,134,255,0.3)]">
                                    <span className="material-symbols-outlined text-blue-500 text-2xl">point_of_sale</span>
                                </div>
                                <div className="text-center">
                                    <h4 className="text-white font-bold text-sm">Pedido POS</h4>
                                    <p className="text-xs text-slate-400 mt-1">Ingreso bruto</p>
                                </div>
                            </div>
                            <div className="flex flex-col items-center flow-connector">
                                <div className="w-16 h-16 rounded-full bg-[#0F172A] border border-slate-600 flex items-center justify-center mb-4">
                                    <span className="material-symbols-outlined text-white text-2xl">restaurant_menu</span>
                                </div>
                                <div className="text-center">
                                    <h4 className="text-white font-bold text-sm">Consumo Receta</h4>
                                    <p className="text-xs text-slate-400 mt-1">Explosión de insumos</p>
                                </div>
                            </div>
                            <div className="flex flex-col items-center flow-connector">
                                <div className="w-16 h-16 rounded-full bg-[#0F172A] border border-slate-600 flex items-center justify-center mb-4">
                                    <span className="material-symbols-outlined text-white text-2xl">inventory</span>
                                </div>
                                <div className="text-center">
                                    <h4 className="text-white font-bold text-sm">Lote FIFO</h4>
                                    <p className="text-xs text-slate-400 mt-1">Selección de stock</p>
                                </div>
                            </div>
                            <div className="flex flex-col items-center flow-connector">
                                <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(58,134,255,0.6)] animate-pulse">
                                    <span className="material-symbols-outlined text-white text-2xl">camera_alt</span>
                                </div>
                                <div className="text-center">
                                    <h4 className="text-blue-500 font-bold text-sm">Cost Snapshot</h4>
                                    <p className="text-xs text-slate-400 mt-1">Captura valor real</p>
                                </div>
                            </div>
                            <div className="flex flex-col items-center flow-connector">
                                <div className="w-16 h-16 rounded-full bg-[#0F172A] border border-slate-600 flex items-center justify-center mb-4">
                                    <span className="material-symbols-outlined text-white text-2xl">ssid_chart</span>
                                </div>
                                <div className="text-center">
                                    <h4 className="text-white font-bold text-sm">Impacto Utilidad</h4>
                                    <p className="text-xs text-slate-400 mt-1">Cálculo de margen</p>
                                </div>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(46,204,113,0.3)]">
                                    <span className="material-symbols-outlined text-emerald-500 text-2xl">account_balance</span>
                                </div>
                                <div className="text-center">
                                    <h4 className="text-emerald-500 font-bold text-sm">P&amp;L Diario</h4>
                                    <p className="text-xs text-slate-400 mt-1">Reporte final</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                            <div className="inline-block px-4 py-2 bg-blue-600/10 rounded-lg border border-blue-500/20">
                                <span className="text-blue-500 font-bold tracking-wide text-sm uppercase">Tecnología Exclusiva</span>
                            </div>
                            <h3 className="text-3xl font-bold text-white">Cost Snapshot at Sale™</h3>
                            <p className="text-slate-400 text-lg leading-relaxed">
                                La mayoría de los sistemas promedian costos al final del mes. Nosotros capturamos el costo exacto del lote específico (FIFO) en el milisegundo que ocurre la venta.
                            </p>
                            <ul className="space-y-4">
                                <li className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-emerald-500 mt-1">check_circle</span>
                                    <span className="text-gray-300">Evita utilidad inflada por promedios antiguos.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-emerald-500 mt-1">check_circle</span>
                                    <span className="text-gray-300">Detecta variaciones de precio de proveedor al instante.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-emerald-500 mt-1">check_circle</span>
                                    <span className="text-gray-300">Auditoría precisa: sabes qué lote alimentó qué venta.</span>
                                </li>
                            </ul>
                        </div>
                        <div className="bg-[#1E293B] p-1 rounded-2xl border border-[#3A4B6B] shadow-2xl relative">
                            <div className="absolute -top-4 -right-4 bg-emerald-500 text-[#0F172A] font-bold px-4 py-2 rounded-lg text-sm shadow-lg z-20">
                                Precisión 99.9%
                            </div>
                            <div className="bg-[#0F172A] rounded-xl p-6 font-mono text-sm leading-loose text-gray-400">
                                <div className="flex justify-between border-b border-gray-800 pb-2 mb-2">
                                    <span>TRANSACTION_ID</span>
                                    <span className="text-white">#9824-X2</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>ITEM_SOLD</span>
                                    <span className="text-blue-500">Lomo Saltado</span>
                                </div>
                                <div className="flex justify-between pl-4 text-xs">
                                    <span>Lote Carne (ID: 4421)</span>
                                    <span className="text-red-400">-$4.20</span>
                                </div>
                                <div className="flex justify-between pl-4 text-xs">
                                    <span>Lote Cebolla (ID: 4419)</span>
                                    <span className="text-red-400">-$0.35</span>
                                </div>
                                <div className="flex justify-between pl-4 text-xs">
                                    <span>Lote Tomate (ID: 4390)</span>
                                    <span className="text-red-400">-$0.45</span>
                                </div>
                                <div className="flex justify-between border-t border-gray-800 pt-2 mt-2 font-bold">
                                    <span className="text-white">REAL_PROFIT</span>
                                    <span className="text-emerald-500">+$12.50</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div>
                        <div className="text-center mb-10">
                            <h2 className="text-2xl lg:text-3xl font-bold text-white">Resultados Medibles</h2>
                            <p className="text-slate-400 mt-2">Métricas que impactan tu cuenta bancaria</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                            <div className="flex flex-col gap-2 rounded-xl p-6 bg-[#1E293B] border border-[#3A4B6B] shadow-lg">
                                <span className="material-symbols-outlined text-blue-500 text-3xl mb-2">payments</span>
                                <span className="text-slate-400 text-sm font-medium uppercase tracking-wider">Utilidad Real</span>
                                <p className="text-white text-2xl font-bold">100% Exacta</p>
                            </div>
                            <div className="flex flex-col gap-2 rounded-xl p-6 bg-[#1E293B] border border-[#3A4B6B] shadow-lg">
                                <span className="material-symbols-outlined text-emerald-500 text-3xl mb-2">pie_chart</span>
                                <span className="text-slate-400 text-sm font-medium uppercase tracking-wider">Margen por Plato</span>
                                <p className="text-white text-2xl font-bold">Detallado</p>
                            </div>
                            <div className="flex flex-col gap-2 rounded-xl p-6 bg-[#1E293B] border border-[#3A4B6B] shadow-lg">
                                <span className="material-symbols-outlined text-blue-500 text-3xl mb-2">inventory_2</span>
                                <span className="text-slate-400 text-sm font-medium uppercase tracking-wider">Capital Inmovilizado</span>
                                <p className="text-white text-2xl font-bold">Optimizado</p>
                            </div>
                            <div className="flex flex-col gap-2 rounded-xl p-6 bg-[#1E293B] border border-[#3A4B6B] shadow-lg">
                                <span className="material-symbols-outlined text-emerald-500 text-3xl mb-2">balance</span>
                                <span className="text-slate-400 text-sm font-medium uppercase tracking-wider">Punto de Equilibrio</span>
                                <p className="text-white text-2xl font-bold">Diario</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col items-center justify-center pt-8 pb-12 gap-8 text-center bg-gradient-to-b from-transparent to-[#1E293B]/30 rounded-3xl border border-[#3A4B6B]/30 p-10">
                        <h2 className="text-3xl lg:text-4xl font-bold text-white max-w-2xl">
                            Deja de medir ventas. <br /><span className="text-emerald-500">Empieza a medir ganancias.</span>
                        </h2>
                        <button className="flex items-center gap-3 bg-blue-600 hover:bg-blue-600/90 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-[0_10px_20px_rgba(58,134,255,0.3)] transition-all transform hover:scale-105 border border-blue-500/50">
                            Solicitar demo financiera
                            <span className="material-symbols-outlined">arrow_forward</span>
                        </button>
                        <p className="text-sm text-slate-400">Sin tarjeta de crédito requerida • Implementación en 48h</p>
                    </div>
                </div>
            </main>


        </div>
    );
};

export default HowItWorksView;
