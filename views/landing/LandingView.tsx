import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LandingHeader from './LandingHeader';
import LandingFooter from './LandingFooter';

const LandingView: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        document.documentElement.classList.add('dark');
        return () => {
            document.documentElement.classList.remove('dark');
        };
    }, []);

    return (
        <div className="bg-[#0B1120] text-slate-100 font-sans antialiased selection:bg-blue-600 selection:text-white overflow-x-hidden min-h-screen">

            {/* Top Navigation */}
            <LandingHeader />

            <main className="pt-16">

                {/* Hero Section */}
                <section className="relative pt-24 pb-32 overflow-hidden flex flex-col items-center">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[400px] bg-blue-600/10 blur-[100px] rounded-full -z-10"></div>

                    <div className="px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center max-w-5xl mx-auto z-10">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-900/30 border border-blue-800/50 text-xs font-semibold text-blue-400 mb-8">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                            </span>
                            Nuevo: Control de Utilidad en Tiempo Real
                        </div>

                        <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight text-white mb-6 leading-[1.1]">
                            Tu restaurante vende.<br />
                            <span className="text-slate-400">Pero... ¿realmente está ganando dinero?</span>
                        </h1>

                        <p className="text-base sm:text-lg md:text-xl text-slate-400 mb-10 max-w-3xl mx-auto leading-relaxed px-4">
                            La inflación de insumos y la volatilidad de costos devoran tus márgenes silenciosamente. Deja de operar a ciegas y <span className="text-white font-medium">toma el control financiero real de tu operación.</span>
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 mb-20 px-4 w-full sm:w-auto">
                            <button
                                onClick={() => navigate('/como-funciona')}
                                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base font-bold h-14 sm:h-12 px-8 rounded-xl sm:rounded-lg transition-all shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-[20px]">insights</span>
                                Descubrir cuánto gano realmente
                            </button>
                            <button
                                onClick={() => navigate('/solicitar-demo')}
                                className="w-full sm:w-auto bg-white border border-slate-200 hover:bg-slate-50 text-slate-900 text-sm sm:text-base font-bold h-14 sm:h-12 px-8 rounded-xl sm:rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-[20px]">event</span>
                                Agendar demo
                            </button>
                        </div>
                    </div>

                    {/* Dashboard Mockup - Side by Side */}
                    <div className="w-full max-w-6xl mx-auto px-4 relative z-20">
                        <div className="rounded-xl border border-slate-700/50 bg-[#111827] shadow-2xl overflow-hidden flex flex-col">
                            {/* Browser Header */}
                            <div className="h-10 border-b border-slate-800 bg-[#1E293B] flex items-center px-4 gap-2">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-slate-600"></div>
                                    <div className="w-3 h-3 rounded-full bg-slate-600"></div>
                                    <div className="w-3 h-3 rounded-full bg-slate-600"></div>
                                </div>
                                <div className="flex-1 text-center text-xs text-slate-500 font-mono">dashboard.restogestion.com/financial_overview</div>
                            </div>

                            {/* Dashboard Content */}
                            <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Left Card: Utilidad */}
                                <div className="bg-[#1E293B] rounded-lg p-5 border border-slate-800 col-span-1">
                                    <div className="flex justify-between items-start mb-4">
                                        <p className="text-sm text-slate-400 font-medium">Utilidad Neta Diaria</p>
                                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-[#10B981]/10 text-[#10B981]">
                                            +12.5% <span className="material-symbols-outlined text-sm ml-1">trending_up</span>
                                        </span>
                                    </div>
                                    <h3 className="text-4xl font-bold text-white mb-6">$1,245.80</h3>
                                    <div className="space-y-2">
                                        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-[#10B981] w-[75%]"></div>
                                        </div>
                                        <p className="text-xs text-slate-500">Meta diaria: $1,650.00</p>
                                    </div>
                                </div>

                                {/* Right Cards: Costo + Mermas */}
                                <div className="col-span-1 md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="bg-[#1E293B] rounded-lg p-5 border border-slate-800">
                                        <div className="flex justify-between items-start mb-4">
                                            <p className="text-sm text-slate-400 font-medium">Costo Primo (Food Cost)</p>
                                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-[#10B981]/10 text-[#10B981]">
                                                -2.1% <span className="material-symbols-outlined text-sm ml-1">trending_down</span>
                                            </span>
                                        </div>
                                        <h3 className="text-3xl font-bold text-white mb-6">28.4%</h3>
                                        <div className="h-12 flex items-end gap-1.5 opacity-80">
                                            <div className="w-full bg-blue-600/30 h-[40%] rounded-t"></div>
                                            <div className="w-full bg-blue-600/40 h-[60%] rounded-t"></div>
                                            <div className="w-full bg-blue-600/50 h-[45%] rounded-t"></div>
                                            <div className="w-full bg-blue-600/60 h-[70%] rounded-t"></div>
                                            <div className="w-full bg-blue-600/80 h-[55%] rounded-t"></div>
                                            <div className="w-full bg-blue-600 h-[85%] rounded-t"></div>
                                        </div>
                                    </div>

                                    <div className="bg-[#1E293B] rounded-lg p-5 border border-slate-800">
                                        <div className="flex justify-between items-start mb-4">
                                            <p className="text-sm text-slate-400 font-medium">Mermas Registradas</p>
                                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-red-500/10 text-red-500">
                                                Alert <span className="material-symbols-outlined text-sm ml-1">warning</span>
                                            </span>
                                        </div>
                                        <h3 className="text-3xl font-bold text-white mb-4">$142.50</h3>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-xs text-slate-300 border-b border-slate-700/50 pb-1.5">
                                                <span>Caducidad (Lácteos)</span>
                                                <span className="font-bold text-white">$85.00</span>
                                            </div>
                                            <div className="flex items-center justify-between text-xs text-slate-300 border-b border-slate-700/50 pb-1.5">
                                                <span>Error Cocina</span>
                                                <span className="font-bold text-white">$42.20</span>
                                            </div>
                                            <div className="flex items-center justify-between text-xs text-slate-300">
                                                <span>Rotura Vajilla</span>
                                                <span className="font-bold text-white">$15.30</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Sell != Profitable Section */}
                <section className="py-20 sm:py-24 bg-[#111827] border-y border-slate-800">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                            <div className="text-center lg:text-left">
                                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight mb-6">
                                    Vender no significa ser rentable.
                                </h2>
                                <p className="text-base sm:text-lg text-slate-400 leading-relaxed mb-10 max-w-2xl mx-auto lg:mx-0">
                                    Muchos restaurantes cierran teniendo ventas récord. ¿La causa? Fugas invisibles que drenan la utilidad neta antes de que llegue a tu banco.
                                </p>
                                <div className="flex items-center justify-center lg:justify-start gap-4 text-sm font-bold text-slate-500 uppercase tracking-widest">
                                    <span className="w-12 sm:w-16 h-[2px] bg-slate-700"></span>
                                    <span className="text-[10px] sm:text-sm">Diagnóstico Común</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {/* Card 1 */}
                                <div className="p-6 rounded-xl bg-[#1E293B] border border-slate-800 flex items-start gap-4">
                                    <div className="w-12 h-12 shrink-0 bg-[#0F172A] rounded-lg flex items-center justify-center text-slate-400">
                                        <span className="material-symbols-outlined">receipt_long</span>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white mb-2">Recetas Desactualizadas</h3>
                                        <p className="text-slate-400 text-sm leading-relaxed">El costo de un plato con salmón no es el mismo que la semana pasada. Sin costeo al día, estás subsidiando los platos populares.</p>
                                    </div>
                                </div>
                                {/* Card 2 */}
                                <div className="p-6 rounded-xl bg-[#1E293B] border border-slate-800 flex items-start gap-4">
                                    <div className="w-12 h-12 shrink-0 bg-[#0F172A] rounded-lg flex items-center justify-center text-slate-400">
                                        <span className="material-symbols-outlined">inventory_2</span>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white mb-2">Inventario Desalineado</h3>
                                        <p className="text-slate-400 text-sm leading-relaxed">Tu POS dice que tienes 10 kg de Lomo Fino, la cocina dice 5 kg. Esos 5 kg faltantes son utilidad directa que desapareció.</p>
                                    </div>
                                </div>
                                {/* Card 3 */}
                                <div className="p-6 rounded-xl bg-[#1E293B] border border-slate-800 flex items-start gap-4">
                                    <div className="w-12 h-12 shrink-0 bg-[#0F172A] rounded-lg flex items-center justify-center text-slate-400">
                                        <span className="material-symbols-outlined">search</span>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white mb-2">Compras sin Trazabilidad</h3>
                                        <p className="text-slate-400 text-sm leading-relaxed">Facturas de proveedores en un cajón mientras que no se reflejan al momento. Costos ocultos que inflan tu Food Cost real.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Urgencia de Medir Section */}
                <section className="py-24 bg-[#0B1120]">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <h2 className="text-3xl md:text-4xl font-black text-white mb-4">La urgencia de medir lo invisible</h2>
                        <p className="text-slate-400 mb-16 max-w-2xl mx-auto">Lo que no mides, no lo controlas. Y lo que no controlas, te hace perder dinero.</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                            {/* Card 1 */}
                            <div className="bg-[#1E293B] rounded-2xl p-8 border border-slate-800 shadow-xl relative overflow-hidden">
                                <div className="flex items-center gap-3 mb-8">
                                    <span className="material-symbols-outlined text-rose-500 bg-rose-500/10 p-2 rounded-lg">error</span>
                                    <h3 className="text-xl font-bold text-white">Food Cost: Teórico vs. Real</h3>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <div className="flex justify-between text-sm mb-2 text-slate-300">
                                            <span>Teórico (Según Receta)</span>
                                            <span className="font-bold">28%</span>
                                        </div>
                                        <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-slate-500 w-[28%] rounded-full"></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-sm mb-2 text-rose-400 font-bold">
                                            <span>Real (Según Inventario)</span>
                                            <span>35%</span>
                                        </div>
                                        <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-rose-500 w-[35%] rounded-full"></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                                    <p className="text-sm text-rose-200">
                                        <span className="font-bold text-rose-400">10% de desviación = $4,500 USD perdidos</span> mensualmente en un restaurante promedio.
                                    </p>
                                </div>
                            </div>

                            {/* Card 2 */}
                            <div className="bg-[#1E293B] rounded-2xl p-8 border border-slate-800 shadow-xl">
                                <div className="flex items-center gap-3 mb-6">
                                    <span className="material-symbols-outlined text-orange-500 bg-orange-500/10 p-2 rounded-lg">delete</span>
                                    <h3 className="text-xl font-bold text-white">Mermas Acumulada Mensual</h3>
                                </div>
                                <div className="mb-2">
                                    <span className="text-5xl font-black text-white">$1,240</span>
                                    <span className="text-slate-400 ml-2 font-bold tracking-widest text-sm">USD</span>
                                </div>
                                <p className="text-slate-400 text-sm mb-8">Equivale a tirar a la basura <span className="font-bold text-white">85 cubiertos</span> cada mes.</p>

                                <div className="grid grid-cols-3 gap-2">
                                    <div className="bg-[#0F172A] p-4 rounded-lg text-center">
                                        <div className="text-xs text-slate-500 font-bold mb-1">Cocina</div>
                                        <div className="text-lg font-bold text-white">45%</div>
                                    </div>
                                    <div className="bg-[#0F172A] p-4 rounded-lg text-center">
                                        <div className="text-xs text-slate-500 font-bold mb-1">Salón</div>
                                        <div className="text-lg font-bold text-white">30%</div>
                                    </div>
                                    <div className="bg-[#0F172A] p-4 rounded-lg text-center">
                                        <div className="text-xs text-slate-500 font-bold mb-1">Almacén</div>
                                        <div className="text-lg font-bold text-white">25%</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Cómo RestoGestion calcula tu utilidad real */}
                <section id="utilidad-real" className="py-24 bg-[#111827] border-y border-slate-800 scroll-mt-20">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Cómo RestoGestion calcula tu utilidad real</h2>
                        <p className="text-slate-400 mb-20 max-w-2xl mx-auto">Un flujo único que conecta tus ventas con tu impacto financiero real, al instante.</p>

                        <div className="relative">
                            <div className="hidden md:block absolute top-[40px] left-[10%] w-[80%] h-[2px] bg-slate-800 -z-10"></div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                                {/* Step 1 */}
                                <div className="flex flex-col items-center group text-center">
                                    <div className="w-20 h-20 rounded-full bg-[#1E293B] border-[3px] border-slate-700 group-hover:border-blue-500 flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors mb-6 relative">
                                        <span className="material-symbols-outlined text-3xl">point_of_sale</span>
                                        <div className="absolute top-0 right-0 w-6 h-6 bg-slate-800 border border-slate-600 rounded-full flex items-center justify-center text-xs font-bold text-white translate-x-1/4 -translate-y-1/4">1</div>
                                    </div>
                                    <h3 className="text-white font-bold mb-2">Venta POS</h3>
                                    <p className="text-xs sm:text-sm text-slate-400 px-4">El mesero ingresa la comanda. Se registra el ingreso bruto.</p>
                                </div>
                                {/* Step 2 */}
                                <div className="flex flex-col items-center group text-center">
                                    <div className="w-20 h-20 rounded-full bg-[#1E293B] border-[3px] border-slate-700 group-hover:border-blue-500 flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors mb-6 relative">
                                        <span className="material-symbols-outlined text-3xl">sync_alt</span>
                                        <div className="absolute top-0 right-0 w-6 h-6 bg-slate-800 border border-slate-600 rounded-full flex items-center justify-center text-xs font-bold text-white translate-x-1/4 -translate-y-1/4">2</div>
                                    </div>
                                    <h3 className="text-white font-bold mb-2">Cruce de Datos</h3>
                                    <p className="text-xs sm:text-sm text-slate-400 px-4">El ERP descuenta inventario, cruza último costo de compra y mermas al mes.</p>
                                </div>
                                {/* Step 3 */}
                                <div className="flex flex-col items-center group text-center">
                                    <div className="w-20 h-20 rounded-full bg-[#1E293B] border-[3px] border-slate-700 group-hover:border-blue-500 flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors mb-6 relative">
                                        <span className="material-symbols-outlined text-3xl">receipt_long</span>
                                        <div className="absolute top-0 right-0 w-6 h-6 bg-slate-800 border border-slate-600 rounded-full flex items-center justify-center text-xs font-bold text-white translate-x-1/4 -translate-y-1/4">3</div>
                                    </div>
                                    <h3 className="text-white font-bold mb-2">Asignación de Gastos</h3>
                                    <p className="text-xs sm:text-sm text-slate-400 px-4">Se prorratean gastos fijos (renta, servicios) y variables al momento.</p>
                                </div>
                                {/* Step 4 */}
                                <div className="flex flex-col items-center group text-center">
                                    <div className="w-20 h-20 rounded-full bg-[#1E293B] border-[3px] border-[#10B981] flex items-center justify-center text-[#10B981] shadow-[0_0_20px_rgba(16,185,129,0.2)] mb-6 relative">
                                        <span className="material-symbols-outlined text-3xl">savings</span>
                                        <div className="absolute top-0 right-0 w-6 h-6 bg-slate-800 border border-slate-600 rounded-full flex items-center justify-center text-xs font-bold text-white translate-x-1/4 -translate-y-1/4">4</div>
                                    </div>
                                    <h3 className="text-white font-bold mb-2">Impacto en Utilidad</h3>
                                    <p className="text-xs sm:text-sm text-slate-400 px-4">Ves la Utilidad Neta (dinero real que genera tu negocio) lista para analizar.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Deja de medir ventas, Empieza a medir utilidad */}
                <section className="py-24 bg-[#0B1120]">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <h2 className="text-3xl md:text-5xl font-black text-white mb-4">Deja de medir ventas. Empieza a medir utilidad.</h2>
                        <p className="text-slate-400 mb-16 max-w-2xl mx-auto">Transforma datos dispersos en decisiones de negocio rentables.</p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                            <div className="p-8 rounded-2xl bg-[#1E293B] border border-slate-800 transition-colors hover:border-blue-500/50 group">
                                <div className="w-12 h-12 bg-blue-600/10 text-blue-500 rounded-lg flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    <span className="material-symbols-outlined">insert_chart</span>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">Utilidad Neta Diaria</h3>
                                <p className="text-sm text-slate-400 leading-relaxed">No esperes a fin de mes. Conoce cada noche cuánto dinero real quedó en la caja después de costos.</p>
                            </div>
                            <div className="p-8 rounded-2xl bg-[#1E293B] border border-slate-800 transition-colors hover:border-blue-500/50 group">
                                <div className="w-12 h-12 bg-blue-600/10 text-blue-500 rounded-lg flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    <span className="material-symbols-outlined">description</span>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">Estado de Resultados Automático</h3>
                                <p className="text-sm text-slate-400 leading-relaxed">Tu P&L (Profit and Loss) se construye solo, día a día, sin procesar exceles.</p>
                            </div>
                            <div className="p-8 rounded-2xl bg-[#1E293B] border border-slate-800 transition-colors hover:border-blue-500/50 group">
                                <div className="w-12 h-12 bg-blue-600/10 text-blue-500 rounded-lg flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    <span className="material-symbols-outlined">published_with_changes</span>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">Flujo de Caja</h3>
                                <p className="text-sm text-slate-400 leading-relaxed">Proyecciones de liquidez basadas en tus cuentas por pagar y proyecciones de venta.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Diseñado para cada modelo */}
                <section className="py-24 bg-[#111827] border-y border-slate-800">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <h2 className="text-3xl md:text-4xl font-black text-white mb-16">Diseñado para cada modelo de negocio</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="p-6 rounded-xl bg-[#1E293B] border border-slate-800 text-left hover:border-slate-500 transition-colors">
                                <span className="material-symbols-outlined text-slate-500 mb-4 text-3xl">restaurant</span>
                                <h3 className="font-bold text-white mb-2">Restaurantes Independientes</h3>
                                <p className="text-xs text-slate-400">Profesionaliza tu gestión y elimina el caos de un solo establecimiento.</p>
                            </div>
                            <div className="p-6 rounded-xl bg-[#1E293B] border border-slate-800 text-left hover:border-slate-500 transition-colors">
                                <span className="material-symbols-outlined text-slate-500 mb-4 text-3xl">takeout_dining</span>
                                <h3 className="font-bold text-white mb-2">Dark Kitchens</h3>
                                <p className="text-xs text-slate-400">Controla costos milimétricos en modelos de alto volumen y márgenes ajustados.</p>
                            </div>
                            <div className="p-6 rounded-xl bg-[#1E293B] border border-slate-800 text-left hover:border-slate-500 transition-colors">
                                <span className="material-symbols-outlined text-slate-500 mb-4 text-3xl">storefront</span>
                                <h3 className="font-bold text-white mb-2">Cadenas</h3>
                                <p className="text-xs text-slate-400">Estandariza recetas y costos en múltiples ubicaciones bajo un solo P&L.</p>
                            </div>
                            <div className="p-6 rounded-xl bg-[#1E293B] border border-slate-800 text-left hover:border-slate-500 transition-colors">
                                <span className="material-symbols-outlined text-slate-500 mb-4 text-3xl">corporate_fare</span>
                                <h3 className="font-bold text-white mb-2">Franquicias</h3>
                                <p className="text-xs text-slate-400">Auditoría, rentabilidad y control de regalías basado en ventas reales.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Final CTA */}
                <section className="py-24 bg-[#0F172A] relative overflow-hidden">
                    <div className="absolute inset-0 bg-blue-600/5"></div>
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                        <h2 className="text-3xl md:text-5xl font-black text-white mb-6 leading-tight">
                            Tu rentabilidad no mejora vendiendo más.<br />Mejora controlando mejor.
                        </h2>
                        <p className="text-lg text-slate-400 mb-10 max-w-2xl mx-auto">
                            Únete a los directores financieros gastronómicos que han dejado de adivinar y han empezado a gestionar con datos.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button onClick={() => navigate('/solicitar-demo')} className="bg-blue-600 hover:bg-blue-700 text-white text-base font-bold h-12 px-8 rounded-lg transition-all shadow-lg flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined">calendar_month</span>
                                Agendar Demo Personalizada
                            </button>
                            <a
                                href="https://wa.link/44jhjq"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-[#1E293B] border border-slate-700 hover:border-white text-white text-base font-bold h-12 px-8 rounded-lg transition-colors flex items-center justify-center"
                            >
                                Hablar con un experto
                            </a>
                        </div>
                    </div>
                </section>

            </main>

            {/* Footer */}
            <LandingFooter />
        </div>
    );
};

export default LandingView;
