import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const LandingView: React.FC = () => {
    const navigate = useNavigate();

    // The Stitch design used a custom tailwind config in the head.
    // To avoid polluting the global ERP, we will inject these classes directly 
    // via style or use standard tailwind classes closely approximating them where possible, 
    // but to preserve the exact look, we dynamically append the classes just for this view 
    // or use arbitrary values. Given the time constraints, we will map them to standard or arbitrary TW.
    // The primary color in stitch is #2563EB (which is already `blue-600` or standard primary in our app).
    // The dark colors are standard slate-900 etc.

    useEffect(() => {
        // Add the "dark" class to the HTML tag when this component mounts to ensure 
        // the Stitch design renders correctly, as it was designed in dark mode.
        document.documentElement.classList.add('dark');
        return () => {
            document.documentElement.classList.remove('dark');
        };
    }, []);

    return (
        <div className="bg-[#0F172A] text-slate-100 font-sans antialiased selection:bg-blue-600 selection:text-white overflow-x-hidden min-h-screen">
            {/* Top Navigation */}
            <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800 bg-[#0F172A]/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 flex items-center justify-center bg-blue-600 rounded-lg text-white">
                                <span className="material-symbols-outlined text-[20px]">dataset</span>
                            </div>
                            <span className="text-white text-lg font-bold tracking-tight">RestoGestión V2.0</span>
                        </div>
                        {/* Desktop Nav */}
                        <nav className="hidden md:flex items-center gap-8">
                            <a className="text-slate-300 hover:text-white text-sm font-medium transition-colors" href="#problema">Problema</a>
                            <a className="text-slate-300 hover:text-white text-sm font-medium transition-colors" href="#proceso">Cómo Funciona</a>
                            <a className="text-slate-300 hover:text-white text-sm font-medium transition-colors" href="#funcionalidades">Funcionalidades</a>
                            <a className="text-slate-300 hover:text-white text-sm font-medium transition-colors" href="#precios">Precios</a>
                        </nav>
                        {/* CTA */}
                        <div className="hidden md:flex items-center gap-4">
                            <button
                                onClick={() => navigate('/login')}
                                className="text-slate-300 hover:text-white text-sm font-bold py-2 transition-colors duration-200">
                                Iniciar Sesión
                            </button>
                            <button
                                onClick={() => navigate('/login')}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2">
                                Agendar Demo
                                <span className="material-symbols-outlined text-sm">arrow_forward</span>
                            </button>
                        </div>
                        {/* Mobile menu button */}
                        <div className="md:hidden flex items-center">
                            <button className="text-slate-300 hover:text-white p-2" onClick={() => navigate('/login')}>
                                <span className="material-symbols-outlined">menu</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="pt-16">
                {/* Hero Section */}
                <section className="relative pt-20 pb-32 overflow-hidden">
                    {/* Background effects */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[500px] bg-blue-600/20 blur-[120px] rounded-full -z-10 opacity-30"></div>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700 text-xs font-medium text-blue-500 mb-6">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                            </span>
                            Nuevo: Módulo de Inteligencia de Compras v2.0
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-6 max-w-4xl leading-tight">
                            Tu restaurante vende.<br />
                            <span className="text-slate-400">Pero… ¿realmente estás ganando dinero?</span>
                        </h1>
                        <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                            Descubre tu <span className="text-white font-semibold">Utilidad Neta Real</span>, controla mermas y gestiona costos dinámicos con el ERP financiero definitivo para la gastronomía moderna.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 mb-20 w-full sm:w-auto">
                            <button
                                onClick={() => navigate('/login')}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-base font-bold h-12 px-8 rounded-lg transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined">play_circle</span>
                                Ver Demo Interactiva
                            </button>
                            <button className="bg-[#1E293B] border border-slate-700 hover:border-slate-500 text-white text-base font-bold h-12 px-8 rounded-lg transition-colors flex items-center justify-center">
                                Cómo Funciona
                            </button>
                        </div>

                        {/* Dashboard Mockup */}
                        <div className="relative w-full max-w-6xl mx-auto rounded-xl border border-slate-700/50 bg-[#111827]/80 backdrop-blur-sm shadow-2xl overflow-hidden group">
                            {/* Fake Browser Header */}
                            <div className="h-10 border-b border-slate-800 bg-[#1E293B] flex items-center px-4 gap-2">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-slate-600"></div>
                                    <div className="w-3 h-3 rounded-full bg-slate-600"></div>
                                    <div className="w-3 h-3 rounded-full bg-slate-600"></div>
                                </div>
                                <div className="flex-1 text-center text-xs text-slate-500 font-mono">dashboard.restogestion.com/financial-overview</div>
                            </div>

                            {/* Dashboard Content */}
                            <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
                                {/* Metric 1 */}
                                <div className="bg-[#1E293B] rounded-lg p-5 border border-slate-800">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="text-sm text-slate-400 font-medium">Utilidad Neta Diaria</p>
                                            <h3 className="text-3xl font-bold text-white mt-1">$1,245.80</h3>
                                        </div>
                                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-[#10B981]/10 text-[#10B981]">
                                            +12.5% <span className="material-symbols-outlined text-sm ml-1">trending_up</span>
                                        </span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-[#10B981] w-[75%]"></div>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2">Meta diaria: $1,650.00</p>
                                </div>

                                {/* Metric 2 */}
                                <div className="bg-[#1E293B] rounded-lg p-5 border border-slate-800">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="text-sm text-slate-400 font-medium">Costo Primo (Food Cost)</p>
                                            <h3 className="text-3xl font-bold text-white mt-1">28.4%</h3>
                                        </div>
                                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-[#10B981]/10 text-[#10B981]">
                                            -2.1% <span className="material-symbols-outlined text-sm ml-1">trending_down</span>
                                        </span>
                                    </div>
                                    <div className="h-16 flex items-end gap-1">
                                        <div className="w-1/6 bg-blue-600/30 h-[40%] rounded-t"></div>
                                        <div className="w-1/6 bg-blue-600/40 h-[60%] rounded-t"></div>
                                        <div className="w-1/6 bg-blue-600/50 h-[45%] rounded-t"></div>
                                        <div className="w-1/6 bg-blue-600/60 h-[70%] rounded-t"></div>
                                        <div className="w-1/6 bg-blue-600/80 h-[55%] rounded-t"></div>
                                        <div className="w-1/6 bg-blue-600 h-[85%] rounded-t"></div>
                                    </div>
                                </div>

                                {/* Metric 3 */}
                                <div className="bg-[#1E293B] rounded-lg p-5 border border-slate-800">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="text-sm text-slate-400 font-medium">Mermas Reportadas</p>
                                            <h3 className="text-3xl font-bold text-white mt-1">$142.50</h3>
                                        </div>
                                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-red-500/10 text-red-500">
                                            Alert <span className="material-symbols-outlined text-sm ml-1">warning</span>
                                        </span>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between text-xs text-slate-300 border-b border-slate-700/50 pb-2">
                                            <span>Caducidad (Lácteos)</span>
                                            <span className="font-bold text-white">$85.00</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-slate-300 border-b border-slate-700/50 pb-2">
                                            <span>Error Cocina</span>
                                            <span className="font-bold text-white">$42.50</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-slate-300">
                                            <span>Rotura Vajilla</span>
                                            <span className="font-bold text-white">$15.00</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Problem Section */}
                <section className="py-24 bg-[#111827] border-y border-slate-800" id="problema">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col md:flex-row gap-12 items-start">
                            <div className="md:w-1/3 sticky top-24">
                                <h2 className="text-3xl md:text-4xl font-black text-white leading-tight mb-6">
                                    El 80% de restaurantes cree que gana dinero…
                                </h2>
                                <p className="text-lg text-slate-400 leading-relaxed mb-8">
                                    …pero pierden hasta un 15% de utilidad en fugas silenciosas. Sin un sistema integrado, estás operando a ciegas. Identifica dónde se va tu dinero.
                                </p>
                                <div className="flex items-center gap-4 text-sm font-medium text-slate-500">
                                    <span className="w-12 h-[1px] bg-slate-700"></span>
                                    <span>DATOS DE INDUSTRIA 2024</span>
                                </div>
                            </div>
                            <div className="md:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Card 1 */}
                                <div className="p-6 rounded-lg bg-[#1E293B] border border-slate-800 hover:border-blue-500/50 transition-colors group">
                                    <div className="w-12 h-12 bg-[#111827] rounded-lg flex items-center justify-center text-slate-300 group-hover:text-blue-500 group-hover:bg-blue-500/10 transition-colors mb-4">
                                        <span className="material-symbols-outlined">receipt_long</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">Recetas Estáticas</h3>
                                    <p className="text-slate-400 text-sm leading-relaxed">Costos desactualizados que ignoran la inflación diaria de tus insumos clave.</p>
                                </div>
                                {/* Card 2 */}
                                <div className="p-6 rounded-lg bg-[#1E293B] border border-slate-800 hover:border-blue-500/50 transition-colors group">
                                    <div className="w-12 h-12 bg-[#111827] rounded-lg flex items-center justify-center text-slate-300 group-hover:text-blue-500 group-hover:bg-blue-500/10 transition-colors mb-4">
                                        <span className="material-symbols-outlined">link_off</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">Compras Desvinculadas</h3>
                                    <p className="text-slate-400 text-sm leading-relaxed">Facturas que entran a contabilidad pero nunca cruzan datos con el consumo real.</p>
                                </div>
                                {/* Card 3 */}
                                <div className="p-6 rounded-lg bg-[#1E293B] border border-slate-800 hover:border-blue-500/50 transition-colors group">
                                    <div className="w-12 h-12 bg-[#111827] rounded-lg flex items-center justify-center text-slate-300 group-hover:text-blue-500 group-hover:bg-blue-500/10 transition-colors mb-4">
                                        <span className="material-symbols-outlined">inventory_2</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">Inventario Desconectado</h3>
                                    <p className="text-slate-400 text-sm leading-relaxed">Stock teórico en excel que jamás coincide con la realidad física de tu almacén.</p>
                                </div>
                                {/* Card 4 */}
                                <div className="p-6 rounded-lg bg-[#1E293B] border border-slate-800 hover:border-blue-500/50 transition-colors group">
                                    <div className="w-12 h-12 bg-[#111827] rounded-lg flex items-center justify-center text-slate-300 group-hover:text-blue-500 group-hover:bg-blue-500/10 transition-colors mb-4">
                                        <span className="material-symbols-outlined">money_off</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">Ventas sin Margen</h3>
                                    <p className="text-slate-400 text-sm leading-relaxed">Platos populares que, tras recalcular costos ocultos, generan pérdidas invisibles.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* How It Works (Process) */}
                <section className="py-24 bg-[#0F172A]" id="proceso">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">La verdad financiera en 4 pasos</h2>
                            <p className="text-slate-400 max-w-2xl mx-auto">Automatizamos el flujo de información desde que el mesero comanda hasta que ves tu utilidad neta.</p>
                        </div>
                        <div className="relative">
                            {/* Connector Line (Desktop) */}
                            <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-slate-800 -translate-y-1/2 z-0"></div>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
                                {/* Step 1 */}
                                <div className="flex flex-col items-center text-center group">
                                    <div className="w-16 h-16 rounded-full bg-[#1E293B] border-2 border-slate-700 group-hover:border-blue-500 group-hover:bg-blue-500/10 text-slate-400 group-hover:text-blue-500 flex items-center justify-center transition-all duration-300 mb-6 relative">
                                        <span className="material-symbols-outlined text-3xl">point_of_sale</span>
                                        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-800 border border-slate-700 text-xs flex items-center justify-center text-white">1</div>
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-2">Venta POS</h3>
                                    <p className="text-sm text-slate-500 px-4">Integración nativa con tu punto de venta. Cada ticket dispara el proceso.</p>
                                </div>
                                {/* Step 2 */}
                                <div className="flex flex-col items-center text-center group">
                                    <div className="w-16 h-16 rounded-full bg-[#1E293B] border-2 border-slate-700 group-hover:border-blue-500 group-hover:bg-blue-500/10 text-slate-400 group-hover:text-blue-500 flex items-center justify-center transition-all duration-300 mb-6 relative">
                                        <span className="material-symbols-outlined text-3xl">remove_shopping_cart</span>
                                        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-800 border border-slate-700 text-xs flex items-center justify-center text-white">2</div>
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-2">Baja de Inventario</h3>
                                    <p className="text-sm text-slate-500 px-4">Descuento automático de insumos basado en recetas técnicas precisas.</p>
                                </div>
                                {/* Step 3 */}
                                <div className="flex flex-col items-center text-center group">
                                    <div className="w-16 h-16 rounded-full bg-[#1E293B] border-2 border-slate-700 group-hover:border-blue-500 group-hover:bg-blue-500/10 text-slate-400 group-hover:text-blue-500 flex items-center justify-center transition-all duration-300 mb-6 relative">
                                        <span className="material-symbols-outlined text-3xl">calculate</span>
                                        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-800 border border-slate-700 text-xs flex items-center justify-center text-white">3</div>
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-2">Recálculo de Costo</h3>
                                    <p className="text-sm text-slate-500 px-4">Actualización del costo del plato según el último precio de compra.</p>
                                </div>
                                {/* Step 4 */}
                                <div className="flex flex-col items-center text-center group">
                                    <div className="w-16 h-16 rounded-full bg-[#1E293B] border-2 border-[#10B981] group-hover:bg-[#10B981]/10 text-[#10B981] flex items-center justify-center transition-all duration-300 mb-6 relative shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                                        <span className="material-symbols-outlined text-3xl">attach_money</span>
                                        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-800 border border-slate-700 text-xs flex items-center justify-center text-white">4</div>
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-2">Utilidad Neta Real</h3>
                                    <p className="text-sm text-slate-500 px-4">Visualización inmediata del margen real tras costos operativos y mermas.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Grid */}
                <section className="py-24 bg-[#111827] border-y border-slate-800" id="funcionalidades">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="mb-16">
                            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Control Total: Funcionalidades ERP</h2>
                            <p className="text-slate-400 max-w-2xl">Modular, preciso y diseñado exclusivamente para directores financieros gastronómicos.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[
                                { icon: 'currency_exchange', title: 'Inventario Valorizado', desc: 'Conoce el valor exacto de tu stock en tiempo real. Audita movimientos y detecta robos hormiga al instante.' },
                                { icon: 'sync_alt', title: 'Costeo Dinámico', desc: 'Si el precio del tomate sube hoy, el costo de tu ensalada se actualiza hoy. Márgenes siempre reales.' },
                                { icon: 'shopping_cart_checkout', title: 'Compras Inteligentes', desc: 'Algoritmos que sugieren pedidos basados en consumo histórico y proyecciones de venta para evitar sobre-stock.' },
                                { icon: 'delete_forever', title: 'Control de Mermas', desc: 'Registro tipificado de desperdicios. Analiza si pierdes por caducidad, mala manipulación o errores de cocina.' },
                                { icon: 'account_balance', title: 'Gastos Operativos', desc: 'Integra nómina, alquileres y servicios fijos para obtener una visión completa del P&L (Estado de Resultados).' },
                                { icon: 'monitoring', title: 'Utilidad Neta', desc: 'Reportes financieros ejecutivos automáticos. Deja de gestionar ventas brutas y empieza a gestionar ganancias.' }
                            ].map((feat, i) => (
                                <div key={i} className="p-8 rounded-xl bg-[#1E293B] border border-slate-800 hover:border-slate-600 transition-all hover:shadow-lg">
                                    <div className="w-10 h-10 rounded bg-blue-600/20 text-blue-500 flex items-center justify-center mb-6">
                                        <span className="material-symbols-outlined">{feat.icon}</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-3">{feat.title}</h3>
                                    <p className="text-slate-400 text-sm leading-relaxed">{feat.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Pricing Section */}
                <section className="py-24 bg-[#0F172A]" id="precios">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Planes para cada etapa de madurez</h2>
                            <p className="text-slate-400 max-w-2xl mx-auto">Desde operar el día a día hasta escalar una franquicia.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                            {/* Tier 1 */}
                            <div className="rounded-2xl bg-[#1E293B] border border-slate-800 p-8 flex flex-col h-full">
                                <div className="mb-6">
                                    <h3 className="text-xl font-bold text-white tracking-tight">OPERAR</h3>
                                    <p className="text-slate-400 text-sm mt-2">Para restaurantes individuales que buscan orden.</p>
                                </div>
                                <div className="text-3xl font-black text-white mb-6">$89<span className="text-lg font-normal text-slate-500">/mes</span></div>
                                <button className="w-full py-3 px-4 rounded-lg border border-slate-600 text-white font-bold hover:bg-slate-700 transition-colors mb-8">Comenzar</button>
                                <ul className="space-y-4 flex-1">
                                    {[
                                        'Gestión de Recetas Estándar',
                                        'Control de Inventario Básico',
                                        'Integración POS (1 caja)',
                                        'Reportes de Ventas'
                                    ].map((feat, i) => (
                                        <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                                            <span className="material-symbols-outlined text-green-500 text-lg">check</span>
                                            {feat}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Tier 2 (Featured) */}
                            <div className="rounded-2xl bg-[#1E293B] border-2 border-blue-600 p-8 flex flex-col h-full relative shadow-[0_0_40px_rgba(37,99,235,0.1)] transform md:-translate-y-4">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider">
                                    Más Popular
                                </div>
                                <div className="mb-6">
                                    <h3 className="text-xl font-bold text-white tracking-tight">CONTROLAR</h3>
                                    <p className="text-slate-400 text-sm mt-2">El ERP completo para gestión financiera real.</p>
                                </div>
                                <div className="text-3xl font-black text-white mb-6">$199<span className="text-lg font-normal text-slate-500">/mes</span></div>
                                <button
                                    onClick={() => navigate('/login')}
                                    className="w-full py-3 px-4 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors mb-8 shadow-lg shadow-blue-600/25">
                                    Prueba Gratis
                                </button>
                                <ul className="space-y-4 flex-1">
                                    <li className="flex items-start gap-3 text-sm text-white font-medium">
                                        <span className="material-symbols-outlined text-blue-500 text-lg">check_circle</span>
                                        Todo en OPERAR +
                                    </li>
                                    {[
                                        'Costeo Dinámico Automático',
                                        'Módulo de Mermas y Desperdicios',
                                        'Sugerencias de Compra Inteligente',
                                        'P&L en Tiempo Real'
                                    ].map((feat, i) => (
                                        <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                                            <span className="material-symbols-outlined text-blue-500 text-lg">check</span>
                                            {feat}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Tier 3 */}
                            <div className="rounded-2xl bg-[#1E293B] border border-slate-800 p-8 flex flex-col h-full">
                                <div className="mb-6">
                                    <h3 className="text-xl font-bold text-white tracking-tight">ESCALAR</h3>
                                    <p className="text-slate-400 text-sm mt-2">Para grupos gastronómicos y franquicias.</p>
                                </div>
                                <div className="text-3xl font-black text-white mb-6">Personalizado</div>
                                <button
                                    onClick={() => navigate('/login')}
                                    className="w-full py-3 px-4 rounded-lg border border-slate-600 text-white font-bold hover:bg-slate-700 transition-colors mb-8">
                                    Contactar Ventas
                                </button>
                                <ul className="space-y-4 flex-1">
                                    <li className="flex items-start gap-3 text-sm text-slate-300">
                                        <span className="material-symbols-outlined text-green-500 text-lg">check</span>
                                        Todo en CONTROLAR +
                                    </li>
                                    {[
                                        'Multi-sucursal y Multi-almacén',
                                        'Consolidación Financiera de Grupo',
                                        'API y Webhooks personalizados',
                                        'Gerente de Cuenta Dedicado'
                                    ].map((feat, i) => (
                                        <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                                            <span className="material-symbols-outlined text-green-500 text-lg">check</span>
                                            {feat}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Final */}
                <section className="py-24 relative overflow-hidden">
                    <div className="absolute inset-0 bg-blue-600/10"></div>
                    <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-600/10 to-transparent"></div>
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                        <h2 className="text-3xl md:text-5xl font-black text-white mb-6 leading-tight">
                            Empieza a saber si tu restaurante<br />realmente gana dinero
                        </h2>
                        <p className="text-xl text-slate-300 mb-10">
                            Deja de adivinar y empieza a controlar. Únete a los más de 500 restaurantes que han recuperado su margen de utilidad.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={() => navigate('/login')}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold h-14 px-8 rounded-lg transition-all shadow-lg hover:shadow-blue-600/50 flex items-center justify-center gap-2">
                                Agendar Demo Personalizada
                                <span className="material-symbols-outlined">calendar_month</span>
                            </button>
                            <button
                                onClick={() => navigate('/login')}
                                className="bg-[#1E293B] border border-slate-700 hover:border-white text-white text-lg font-bold h-14 px-8 rounded-lg transition-colors">
                                Hablar con un experto
                            </button>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="bg-[#0F172A] border-t border-slate-800 pt-16 pb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                        <div className="col-span-1 md:col-span-1">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-6 h-6 flex items-center justify-center bg-slate-700 rounded text-white">
                                    <span className="material-symbols-outlined text-[16px]">dataset</span>
                                </div>
                                <span className="text-white font-bold">RestoGestión</span>
                            </div>
                            <p className="text-slate-500 text-sm">
                                El ERP financiero líder para el sector gastronómico en Latinoamérica.
                            </p>
                        </div>
                        <div>
                            <h4 className="text-white font-bold mb-4">Producto</h4>
                            <ul className="space-y-2 text-sm text-slate-500">
                                <li><a className="hover:text-blue-500 transition-colors" href="#">Características</a></li>
                                <li><a className="hover:text-blue-500 transition-colors" href="#">Integraciones</a></li>
                                <li><a className="hover:text-blue-500 transition-colors" href="#">Precios</a></li>
                                <li><a className="hover:text-blue-500 transition-colors" href="#">Novedades</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-bold mb-4">Recursos</h4>
                            <ul className="space-y-2 text-sm text-slate-500">
                                <li><a className="hover:text-blue-500 transition-colors" href="#">Blog Financiero</a></li>
                                <li><a className="hover:text-blue-500 transition-colors" href="#">Casos de Éxito</a></li>
                                <li><a className="hover:text-blue-500 transition-colors" href="#">Calculadora de Food Cost</a></li>
                                <li><a className="hover:text-blue-500 transition-colors" href="#">Ayuda</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-bold mb-4">Legal</h4>
                            <ul className="space-y-2 text-sm text-slate-500">
                                <li><a className="hover:text-blue-500 transition-colors" href="#">Privacidad</a></li>
                                <li><a className="hover:text-blue-500 transition-colors" href="#">Términos</a></li>
                                <li><a className="hover:text-blue-500 transition-colors" href="#">Seguridad</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-slate-600 text-xs text-center md:text-left">
                            © {new Date().getFullYear()} RestoGestión Inc. Todos los derechos reservados.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingView;
