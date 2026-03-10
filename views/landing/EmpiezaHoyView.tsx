import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const WHATSAPP_LINK = 'https://wa.me/593984918811?text=Hola%2C%20vi%20su%20anuncio%20y%20quiero%20una%20demo%20de%20RestoGesti%C3%B3n%20para%20mi%20restaurante.';

const EmpiezaHoyView: React.FC = () => {
    const navigate = useNavigate();
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    useEffect(() => {
        document.documentElement.classList.add('dark');
        window.scrollTo(0, 0);
        return () => {
            document.documentElement.classList.remove('dark');
        };
    }, []);

    const toggleFaq = (index: number) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    const faqs = [
        {
            q: '¿Qué pasa si se me va el internet?',
            a: 'RestoGestión cuenta con un modo offline de contingencia que permite seguir tomando pedidos y cuadrarlos automáticamente cuando se recupere la conexión.'
        },
        {
            q: '¿Tengo límite de meseros?',
            a: '¡Para nada! Puedes conectar todos los usuarios que necesites sin costo adicional, así todo tu equipo puede operar en simultáneo.'
        },
        {
            q: '¿Cuánto tardan en capacitar a mi personal?',
            a: 'Nuestra interfaz es tan intuitiva como enviar un mensaje de WhatsApp. En una sesión de 30 minutos tu equipo estará listo para volar operando.'
        }
    ];

    return (
        <div className="bg-[#0B1120] text-slate-100 font-sans antialiased selection:bg-emerald-600 selection:text-white overflow-x-hidden min-h-screen">

            {/* ═══════════════════════════════════════════════════════
                1. HERO SECTION
            ═══════════════════════════════════════════════════════ */}
            <section className="relative flex flex-col pt-8 pb-16 min-h-[90vh] justify-center">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[900px] h-[500px] bg-emerald-600/10 blur-[120px] rounded-full -z-10" />

                <header className="absolute top-0 left-0 w-full flex items-center px-6 sm:px-10 pt-6 sm:pt-8">
                    <div className="flex items-center gap-2.5 group cursor-pointer" onClick={() => navigate('/')}>
                        <img src="/logo-rg.png" alt="RestoGestión" className="h-8 w-auto" />
                        <span className="text-white font-black text-lg tracking-tight">RestoGestión</span>
                    </div>
                </header>

                <div className="flex flex-col items-center justify-center px-4 sm:px-6 text-center max-w-4xl mx-auto pt-20">
                    <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white mb-6 leading-[1.08]">
                        Control total de tu restaurante,<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600">desde tu celular.</span>
                    </h1>

                    <p className="text-base md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed font-medium px-2">
                        Deja de perder dinero por errores en comandas y cuadres de caja. Toma pedidos, controla mesas y cierra caja sin equipos costosos.
                    </p>

                    <div className="w-full max-w-sm mx-auto mb-10 relative">
                        <div className="absolute inset-0 bg-emerald-500/10 blur-[60px] rounded-full -z-10" />
                        <div className="bg-[#1E293B] border border-slate-700/60 rounded-[2rem] p-6 shadow-2xl relative">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.6)]" />
                                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Pedido en Vivo</span>
                            </div>
                            <div className="space-y-2">
                                {[
                                    { name: 'Lomo Saltado', qty: 2, price: '$18.00' },
                                    { name: 'Ceviche Mixto', qty: 1, price: '$14.50' },
                                    { name: 'Chicha Morada', qty: 3, price: '$4.50' },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center justify-between bg-[#0F172A] px-4 py-3 rounded-xl border border-slate-800 animate-fade-in" style={{ animationDelay: `${i * 200}ms` }}>
                                        <div className="flex items-center gap-3">
                                            <span className="w-7 h-7 bg-blue-600/20 text-blue-400 rounded-lg flex items-center justify-center text-xs font-black">{item.qty}</span>
                                            <span className="text-sm font-bold text-white">{item.name}</span>
                                        </div>
                                        <span className="text-sm font-bold text-slate-400">{item.price}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-700">
                                <span className="text-xs font-bold text-slate-500 uppercase">Mesa 4 — Total</span>
                                <span className="text-lg font-black text-emerald-400">$64.00</span>
                            </div>
                        </div>
                    </div>

                    <a
                        href={WHATSAPP_LINK}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative bg-emerald-500 hover:bg-emerald-600 text-white font-black text-lg px-8 py-4 sm:px-10 sm:py-5 rounded-2xl transition-all shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-500/40 hover:scale-[1.03] active:scale-95 flex items-center gap-3"
                    >
                        Solicitar Demo por WhatsApp
                        <span className="material-symbols-outlined text-xl transition-transform group-hover:translate-x-1">arrow_forward</span>
                    </a>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════
                2. TRUST BAR / SOCIAL PROOF
            ═══════════════════════════════════════════════════════ */}
            <section className="bg-[#111827] border-y border-slate-800 py-10 relative overflow-hidden">
                <div className="absolute inset-0 bg-blue-500/5 blur-[100px]" />
                <div className="max-w-6xl mx-auto px-4 text-center relative z-10">
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-[0.2em] mb-8">Diseñado para hacer crecer tu negocio</p>
                    <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
                        <div className="flex items-center gap-4 group">
                            <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-slate-700 transition-colors">⏱️</div>
                            <span className="text-slate-300 font-bold text-lg md:text-xl tracking-tight text-left leading-tight">0 equipos extra<br />necesarios</span>
                        </div>
                        <div className="hidden md:block w-px h-12 bg-slate-800"></div>
                        <div className="flex items-center gap-4 group">
                            <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-slate-700 transition-colors">☁️</div>
                            <span className="text-slate-300 font-bold text-lg md:text-xl tracking-tight text-left leading-tight">100% basado<br />en la nube</span>
                        </div>
                        <div className="hidden md:block w-px h-12 bg-slate-800"></div>
                        <div className="flex items-center gap-4 group">
                            <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-slate-700 transition-colors">📈</div>
                            <span className="text-slate-300 font-bold text-lg md:text-xl tracking-tight text-left leading-tight">Cierres de caja<br />en segundos</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════
                3. ZIG-ZAG FEATURES
            ═══════════════════════════════════════════════════════ */}
            <section className="py-20 sm:py-32 bg-[#0B1120] overflow-hidden">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-32">
                    
                    {/* BLoque A */}
                    <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
                        <div className="flex-1 space-y-6">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-widest">
                                <span className="material-symbols-outlined text-[16px]">bolt</span> Agilidad
                            </div>
                            <h2 className="text-3xl md:text-5xl font-black text-white leading-tight">
                                Pedidos a cocina en <span className="text-emerald-400">1 segundo.</span>
                            </h2>
                            <p className="text-lg text-slate-400 leading-relaxed">
                                El mesero toma la orden en la mesa desde su celular y llega al instante a la pantalla o impresora de la cocina. Adiós a los gritos, los papeles enredados y las demoras.
                            </p>
                            <ul className="space-y-4 pt-4">
                                {['Interfaz ultra-rápida y fácil de usar.', 'Cero errores de escritura o platillos confusos.', 'Sincronización en vivo con todas las áreas.'].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <span className="material-symbols-outlined text-emerald-500 mt-0.5 mt-1">check_circle</span>
                                        <span className="text-slate-300 font-medium">{item}</span>
                                    </li>
                                ))}
                            </ul>
                            <div className="pt-6">
                                <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="inline-flex bg-[#1E293B] hover:bg-slate-700 text-white font-bold py-3 px-8 rounded-xl transition-colors border border-slate-700">
                                    Pedir una Demo
                                </a>
                            </div>
                        </div>
                        {/* Mockup */}
                        <div className="flex-1 w-full max-w-sm mx-auto relative group">
                            <div className="absolute inset-0 bg-emerald-600/20 blur-[80px] rounded-full group-hover:bg-emerald-500/30 transition-all duration-500" />
                            <div className="relative bg-[#111827] border-[6px] border-[#1E293B] rounded-[3rem] p-4 shadow-2xl h-[500px] flex flex-col overflow-hidden">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#1E293B] rounded-b-xl" />
                                <div className="mt-8 mb-4">
                                    <div className="text-lg font-black text-white">Mesa 12</div>
                                    <div className="text-sm font-medium text-slate-400">Atendiendo: Carlos</div>
                                </div>
                                <div className="flex-1 overflow-hidden flex flex-col gap-3">
                                    {['Hamburguesa Doble', 'Papas Fritas Grandes', 'Refresco de Cola', 'Cheesecake'].map((i, idx) => (
                                        <div key={idx} className="bg-[#1E293B] p-3 rounded-xl flex items-center justify-between border border-slate-800">
                                            <div className="font-bold text-white text-sm">{i}</div>
                                            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs text-white cursor-pointer">+</div>
                                        </div>
                                    ))}
                                </div>
                                <div className="pt-4 border-t border-slate-800 mt-4">
                                    <div className="bg-emerald-500 text-white font-black text-center py-3 rounded-xl">Enviar a Cocina</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* BLoque B */}
                    <div className="flex flex-col flex-col-reverse lg:flex-row items-center gap-12 lg:gap-20">
                        {/* Mockup Tablet */}
                        <div className="flex-1 w-full relative group">
                            <div className="absolute inset-0 bg-blue-600/20 blur-[80px] rounded-full group-hover:bg-blue-500/30 transition-all duration-500" />
                            <div className="relative bg-[#111827] border-[8px] border-[#1E293B] rounded-[2rem] aspect-video p-6 shadow-2xl flex flex-col">
                                <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
                                    <div className="font-black text-xl text-white">Mapa de Mesas</div>
                                    <div className="flex gap-2">
                                        <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                        <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                    </div>
                                </div>
                                <div className="flex-1 grid grid-cols-4 gap-4">
                                    {[
                                        {n: 1, s: 'bg-emerald-500/20 border-emerald-500 text-emerald-400', l: 'Libre'},
                                        {n: 2, s: 'bg-orange-500/20 border-orange-500 text-orange-400', l: 'Ocupada'},
                                        {n: 3, s: 'bg-orange-500/20 border-orange-500 text-orange-400', l: 'Ocupada'},
                                        {n: 4, s: 'bg-emerald-500/20 border-emerald-500 text-emerald-400', l: 'Libre'},
                                        {n: 5, s: 'bg-red-500/20 border-red-500 text-red-400', l: 'Por cobrar'},
                                        {n: 6, s: 'bg-emerald-500/20 border-emerald-500 text-emerald-400', l: 'Libre'},
                                        {n: 7, s: 'bg-orange-500/20 border-orange-500 text-orange-400', l: 'Ocupada'},
                                        {n: 8, s: 'bg-emerald-500/20 border-emerald-500 text-emerald-400', l: 'Libre'}
                                    ].map((mesa, i) => (
                                        <div key={i} className={`rounded-xl border-2 flex flex-col items-center justify-center p-2 ${mesa.s}`}>
                                            <span className="font-black text-lg">M{mesa.n}</span>
                                            <span className="text-[10px] font-bold uppercase">{mesa.l}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 space-y-6">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-400 text-xs font-bold uppercase tracking-widest">
                                <span className="material-symbols-outlined text-[16px]">visibility</span> Control
                            </div>
                            <h2 className="text-3xl md:text-5xl font-black text-white leading-tight">
                                Control de mesas y <span className="text-blue-400">salón en vivo.</span>
                            </h2>
                            <p className="text-lg text-slate-400 leading-relaxed">
                                El dueño o administrador puede ver qué pasa en cada mesa en tiempo real, incluso si no está en el local.
                            </p>
                            <ul className="space-y-4 pt-4">
                                {['Tiempos de espera y estados de mesa.', 'Consumos en tiempo real y adiciones a la cuenta.', 'Supervisión de atención de meseros.'].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <span className="material-symbols-outlined text-blue-500 mt-1">check_circle</span>
                                        <span className="text-slate-300 font-medium">{item}</span>
                                    </li>
                                ))}
                            </ul>
                            <div className="pt-6">
                                <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="inline-flex bg-[#1E293B] hover:bg-slate-700 text-white font-bold py-3 px-8 rounded-xl transition-colors border border-slate-700">
                                    Pedir una Demo
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* BLoque C */}
                    <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
                        <div className="flex-1 space-y-6">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-violet-500/20 bg-violet-500/10 text-violet-400 text-xs font-bold uppercase tracking-widest">
                                <span className="material-symbols-outlined text-[16px]">pie_chart</span> Finanzas
                            </div>
                            <h2 className="text-3xl md:text-5xl font-black text-white leading-tight">
                                Cierres de caja automáticos <span className="text-violet-400">y sin estrés.</span>
                            </h2>
                            <p className="text-lg text-slate-400 leading-relaxed">
                                El adiós a las fugas de dinero y los cálculos manuales en la madrugada. RestoGestión hace los números por ti.
                            </p>
                            <ul className="space-y-4 pt-4">
                                {['Reportes de ventas detallados por día, semana o mes.', 'Separación exacta de ingresos por medios de pago (Efectivo, Tarjeta, Transferencia).', 'Control ciego para evitar robos y faltantes.'].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <span className="material-symbols-outlined text-violet-500 mt-1">check_circle</span>
                                        <span className="text-slate-300 font-medium">{item}</span>
                                    </li>
                                ))}
                            </ul>
                            <div className="pt-6">
                                <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="inline-flex bg-[#1E293B] hover:bg-slate-700 text-white font-bold py-3 px-8 rounded-xl transition-colors border border-slate-700">
                                    Pedir una Demo
                                </a>
                            </div>
                        </div>
                        {/* Mockup Dashboard */}
                        <div className="flex-1 w-full relative group">
                            <div className="absolute inset-0 bg-violet-600/20 blur-[80px] rounded-full group-hover:bg-violet-500/30 transition-all duration-500" />
                            <div className="relative bg-[#111827] border border-slate-800 rounded-[2rem] p-6 shadow-2xl flex flex-col">
                                <h3 className="font-bold text-slate-400 mb-4 uppercase tracking-widest text-xs">Cierre de Caja - Hoy</h3>
                                <div className="text-4xl font-black text-white mb-6">$1,245.50</div>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center p-3 bg-[#1E293B] rounded-lg">
                                        <span className="text-slate-300">Efectivo</span>
                                        <span className="font-bold text-white">$450.00</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-[#1E293B] rounded-lg border border-violet-500/30">
                                        <span className="text-slate-300 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-violet-500"></span>Tarjetas</span>
                                        <span className="font-bold text-white">$655.50</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-[#1E293B] rounded-lg">
                                        <span className="text-slate-300">Transferencias</span>
                                        <span className="font-bold text-white">$140.00</span>
                                    </div>
                                </div>
                                <div className="mt-6 flex justify-between gap-4">
                                    <div className="h-16 flex-1 bg-emerald-500/20 rounded-xl relative overflow-hidden"><div className="absolute bottom-0 w-full bg-emerald-500 h-[60%]"></div></div>
                                    <div className="h-16 flex-1 bg-emerald-500/20 rounded-xl relative overflow-hidden"><div className="absolute bottom-0 w-full bg-emerald-500 h-[80%]"></div></div>
                                    <div className="h-16 flex-1 bg-emerald-500/20 rounded-xl relative overflow-hidden"><div className="absolute bottom-0 w-full bg-emerald-500 h-[40%]"></div></div>
                                    <div className="h-16 flex-1 bg-emerald-500/20 rounded-xl relative overflow-hidden"><div className="absolute bottom-0 w-full bg-emerald-500 h-[90%]"></div></div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════
                4. HARDWARE Y COMPATIBILIDAD
            ═══════════════════════════════════════════════════════ */}
            <section className="py-20 sm:py-28 bg-[#111827] border-y border-slate-800 text-center relative overflow-hidden">
                <div className="max-w-4xl mx-auto px-4 z-10 relative">
                    <h2 className="text-3xl md:text-5xl font-black text-white leading-tight mb-8">
                        Usa los equipos que <span className="text-emerald-400">ya tienes.</span>
                    </h2>
                    <p className="text-xl text-slate-400 mb-12">
                        Funciona en cualquier dispositivo con internet sin instalar configuraciones complejas. Android, iPhone, Tablet o Laptop. Todo se sincroniza en la nube al instante.
                    </p>
                    <div className="flex justify-center flex-wrap gap-8 items-center text-slate-600">
                        <span className="material-symbols-outlined text-6xl hover:text-emerald-400 transition-colors cursor-pointer">smartphone</span>
                        <span className="material-symbols-outlined text-6xl hover:text-emerald-400 transition-colors cursor-pointer">tablet_mac</span>
                        <span className="material-symbols-outlined text-7xl hover:text-emerald-400 transition-colors cursor-pointer">laptop_mac</span>
                        <span className="material-symbols-outlined text-6xl hover:text-emerald-400 transition-colors cursor-pointer">point_of_sale</span>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════
                5. TESTIMONIALS
            ═══════════════════════════════════════════════════════ */}
            <section className="py-24 bg-[#0B1120]">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-black text-white leading-tight mb-4">Negocios que ya no <span className="text-emerald-400">pierden dinero</span></h2>
                        <p className="text-lg text-slate-400">Restaurantes reales transformando su operación con nosotros.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { quote: "Desde que usamos RestoGestión, el cierre de caja nos toma 5 minutos. Ya no me quedo hasta la madrugada sumando tickets.", name: "Mariana R.", role: "Dueña de Pizzería" },
                            { quote: "Los meseros ahora atienden el doble de mesas sin equivocarse. La capacitación duró un solo día y fue súper fácil.", name: "Carlos T.", role: "Gerente de Restaurante" },
                            { quote: "Poder ver las ventas desde mi casa me dio paz mental. El control del salón en la pantalla tablet es increíble.", name: "Luis Mendoza", role: "Propietario de Restobar" }
                        ].map((t, idx) => (
                            <div key={idx} className="bg-[#1E293B] p-8 rounded-2xl border border-slate-800 relative">
                                <span className="text-6xl text-emerald-500/20 absolute top-4 left-6 font-serif">"</span>
                                <p className="text-slate-300 relative z-10 italic mb-6">"{t.quote}"</p>
                                <div className="flex items-center gap-4 border-t border-slate-700/50 pt-4">
                                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">{t.name[0]}</div>
                                    <div>
                                        <div className="text-white font-bold text-sm">{t.name}</div>
                                        <div className="text-slate-500 text-xs">{t.role}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════
                6. PRECIOS Y PLANES
            ═══════════════════════════════════════════════════════ */}
            <section className="py-24 bg-[#111827] border-y border-slate-800">
                <div className="max-w-6xl mx-auto px-4 text-center">
                    <h2 className="text-3xl md:text-5xl font-black text-white leading-tight mb-4">Planes adaptados al <span className="text-emerald-400">tamaño de tu local</span></h2>
                    <p className="text-lg text-slate-400 mb-16 max-w-2xl mx-auto">Nuestro modelo se ajusta a tus necesidades. Paga por lo que realmente usas sin ataduras ni letras pequeñas.</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {/* Plan Básico */}
                        <div className="bg-[#0B1120] border border-slate-800 p-8 rounded-3xl flex flex-col text-left hover:border-slate-600 transition-colors">
                            <h3 className="text-xl font-bold text-white mb-2">Básico</h3>
                            <p className="text-slate-400 text-sm mb-6">Perfecto para locales pequeños o foodtrucks.</p>
                            <div className="mb-6"><span className="text-4xl font-black text-white">Consultar</span></div>
                            <ul className="space-y-4 mb-8 flex-1">
                                {['Toma de pedidos móvil', 'Cierre de caja simple', 'Tickets digitales', 'Soporte vía WhatsApp'].map((opt, i) => (
                                    <li key={i} className="flex gap-2 text-sm text-slate-300"><span className="text-emerald-500 font-bold">✓</span> {opt}</li>
                                ))}
                            </ul>
                            <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="block text-center mt-auto bg-[#1E293B] hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-colors">Cotizar por WhatsApp</a>
                        </div>
                        {/* Plan Pro (Destacado) */}
                        <div className="bg-[#1E293B] border-2 border-emerald-500 p-8 rounded-3xl flex flex-col text-left transform md:-translate-y-4 relative shadow-2xl shadow-emerald-500/10">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-emerald-500 text-white font-bold text-xs uppercase tracking-widest px-4 py-1 rounded-full">El más Elegido</div>
                            <h3 className="text-xl font-bold text-white mb-2">Profesional</h3>
                            <p className="text-emerald-400 text-sm mb-6 font-medium">Para restaurantes en crecimiento.</p>
                            <div className="mb-6"><span className="text-4xl font-black text-white">Consultar</span></div>
                            <ul className="space-y-4 mb-8 flex-1">
                                {['Mapa de mesas interactivo', 'Monitor de cocina (KDS)', 'Reportes de ventas detallados', 'Multiusuarios y roles', 'Soporte prioritario'].map((opt, i) => (
                                    <li key={i} className="flex gap-2 text-sm text-white"><span className="text-emerald-500 font-bold">✓</span> {opt}</li>
                                ))}
                            </ul>
                            <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="block text-center mt-auto bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 text-white font-black py-4 rounded-xl transition-colors">Cotizar por WhatsApp</a>
                        </div>
                        {/* Plan Cadenas */}
                        <div className="bg-[#0B1120] border border-slate-800 p-8 rounded-3xl flex flex-col text-left hover:border-slate-600 transition-colors">
                            <h3 className="text-xl font-bold text-white mb-2">Cadenas</h3>
                            <p className="text-slate-400 text-sm mb-6">Múltiples sucursales y operaciones complejas.</p>
                            <div className="mb-6"><span className="text-4xl font-black text-white">Consultar</span></div>
                            <ul className="space-y-4 mb-8 flex-1">
                                {['Todas las funciones Pro', 'Consolidado multisucursal', 'Control de Inventarios full', 'APIs e Integraciones', 'Asesor dedicado'].map((opt, i) => (
                                    <li key={i} className="flex gap-2 text-sm text-slate-300"><span className="text-emerald-500 font-bold">✓</span> {opt}</li>
                                ))}
                            </ul>
                            <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="block text-center mt-auto bg-[#1E293B] hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-colors">Cotizar por WhatsApp</a>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════
                7. FAQ
            ═══════════════════════════════════════════════════════ */}
            <section className="py-24 bg-[#0B1120]">
                <div className="max-w-3xl mx-auto px-4">
                    <h2 className="text-3xl md:text-5xl font-black text-center text-white leading-tight mb-12">Preguntas <span className="text-emerald-400">Frecuentes</span></h2>
                    
                    <div className="space-y-4">
                        {faqs.map((faq, idx) => (
                            <div key={idx} className="bg-[#1E293B] border border-slate-800 rounded-2xl overflow-hidden transition-all duration-300">
                                <button 
                                    className="w-full text-left px-6 py-5 flex items-center justify-between focus:outline-none"
                                    onClick={() => toggleFaq(idx)}
                                >
                                    <span className="font-bold text-lg text-white">{faq.q}</span>
                                    <span className={`material-symbols-outlined text-emerald-500 transition-transform duration-300 ${openFaq === idx ? 'rotate-180' : ''}`}>
                                        expand_more
                                    </span>
                                </button>
                                <div className={`px-6 pb-6 text-slate-400 leading-relaxed transition-all duration-300 ${openFaq === idx ? 'block' : 'hidden'}`}>
                                    {faq.a}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════
                8. FINAL CTA (FOOTER)
            ═══════════════════════════════════════════════════════ */}
            <section className="py-24 md:py-32 bg-[#0F172A] relative overflow-hidden text-center border-t border-slate-800">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(16,185,129,0.08),_transparent_70%)]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-600/5 blur-[120px] rounded-full -z-10" />

                <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6">
                    <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-6 leading-tight tracking-tight">
                        Empieza a ver la rentabilidad<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600">real de tu negocio hoy.</span>
                    </h2>

                    <p className="text-lg sm:text-xl text-slate-400 mb-12 max-w-2xl mx-auto font-medium leading-relaxed">
                        No dejes que un día más de desorden se lleve tus ganancias. Hablemos unos minutos y descubre cómo adaptamos RestoGestión a tu local.
                    </p>

                    <a
                        href={WHATSAPP_LINK}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group inline-flex items-center justify-center w-full sm:w-auto gap-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xl px-12 py-6 rounded-2xl transition-all shadow-2xl shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-1 active:scale-95"
                    >
                        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        ¡Mándanos un WhatsApp AHORA!
                    </a>

                    <div className="mt-8 flex justify-center">
                        <span className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-full text-sm font-bold border border-emerald-500/20">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            Asesores en línea en este momento
                        </span>
                    </div>
                </div>
            </section>

            {/* MINIMAL FOOTER */}
            <footer className="bg-[#0B1120] border-t border-slate-800 py-8">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <img src="/logo-rg.png" alt="RestoGestión" className="h-5 w-auto" />
                        <span className="text-white font-bold text-sm">RestoGestión</span>
                    </div>
                    <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest text-center">
                        © {new Date().getFullYear()} RSD Solutions. Todos los derechos reservados.
                    </p>
                </div>
            </footer>

        </div>
    );
};

export default EmpiezaHoyView;
