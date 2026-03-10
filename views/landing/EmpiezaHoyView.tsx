import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const WHATSAPP_LINK = 'https://wa.me/593984918811?text=Hola%2C%20vi%20su%20anuncio%20y%20quiero%20una%20demo%20de%20RestoGesti%C3%B3n%20para%20mi%20restaurante.';

const EmpiezaHoyView: React.FC = () => {
    const navigate = useNavigate();
    useEffect(() => {
        document.documentElement.classList.add('dark');
        window.scrollTo(0, 0);
        return () => {
            document.documentElement.classList.remove('dark');
        };
    }, []);

    return (
        <div className="bg-[#0B1120] text-slate-100 font-sans antialiased selection:bg-emerald-600 selection:text-white overflow-x-hidden min-h-screen">

            {/* ═══════════════════════════════════════════════════════
                SECTION 1 — HERO
            ═══════════════════════════════════════════════════════ */}
            <section className="relative min-h-screen flex flex-col">
                {/* Background glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[900px] h-[500px] bg-emerald-600/10 blur-[120px] rounded-full -z-10" />
                <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-600/5 blur-[100px] rounded-full -z-10" />

                {/* Minimal header — logo only */}
                <header className="flex items-center px-6 sm:px-10 pt-6 sm:pt-8">
                    <div className="flex items-center gap-2.5 group">
                        <div className="w-8 h-8 flex items-center justify-center bg-blue-600 rounded-lg text-white shadow-lg shadow-blue-600/30">
                            <span className="material-symbols-outlined text-[18px]">dataset</span>
                        </div>
                        <span className="text-white font-black text-lg tracking-tight">RestoGestión</span>
                    </div>
                </header>

                {/* Hero content */}
                <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 text-center max-w-4xl mx-auto py-16 sm:py-24">

                    <h1 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tight text-white mb-6 leading-[1.08]">
                        Deja de perder dinero<br />
                        por errores en comandas<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600">y cuadres de caja.</span>
                    </h1>

                    <p className="text-base sm:text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed font-medium px-2">
                        Toma el control total de tu restaurante desde el celular de tus meseros.{' '}
                        <span className="text-white font-semibold">Sin comprar equipos costosos</span> ni enredarte con instalaciones complicadas.
                    </p>

                    {/* Phone mockup animation */}
                    <div className="w-full max-w-sm mx-auto mb-10 relative">
                        <div className="absolute inset-0 bg-emerald-500/10 blur-[60px] rounded-full -z-10" />
                        <div className="bg-[#1E293B] border border-slate-700/60 rounded-[2rem] p-6 shadow-2xl">
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
                            <div className="mt-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl px-4 py-2 flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined text-emerald-400 text-[18px] animate-bounce">restaurant</span>
                                <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">Enviado a cocina ✓</span>
                            </div>
                        </div>
                    </div>

                    {/* CTA Button */}
                    <a
                        href={WHATSAPP_LINK}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative bg-emerald-500 hover:bg-emerald-600 text-white font-black text-base sm:text-lg px-10 py-5 rounded-2xl transition-all shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-500/40 hover:scale-[1.03] active:scale-95 flex items-center gap-3"
                    >
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        Solicitar Demo por WhatsApp
                        <span className="material-symbols-outlined text-xl transition-transform group-hover:translate-x-1">arrow_forward</span>
                    </a>

                    <p className="mt-4 text-xs text-slate-500 font-medium">Sin compromiso · Respuesta en minutos</p>
                </div>

                {/* Scroll hint */}
                <div className="flex justify-center pb-8 animate-bounce">
                    <span className="material-symbols-outlined text-slate-600 text-3xl">expand_more</span>
                </div>
            </section>


            {/* ═══════════════════════════════════════════════════════
                SECTION 2 — PROBLEM AGITATION
            ═══════════════════════════════════════════════════════ */}
            <section className="py-20 sm:py-28 bg-[#111827] border-y border-slate-800">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-red-500/20 bg-red-500/5 mb-8">
                        <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-red-400 text-[10px] font-bold uppercase tracking-[0.2em]">Diagnóstico Operativo</span>
                    </div>

                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-16 leading-tight tracking-tight">
                        ¿Tu restaurante es un <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400">caos</span> en las horas pico?
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                        {/* Pain 1 */}
                        <div className="group relative bg-[#1E293B]/60 backdrop-blur-md border border-white/5 p-8 rounded-2xl hover:bg-[#1E293B]/80 transition-all duration-300 hover:-translate-y-2 overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 text-[60px] font-black text-white/3 italic select-none pointer-events-none">01</div>
                            <div className="w-14 h-14 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-500 group-hover:rotate-[360deg]">
                                <span className="material-symbols-outlined text-2xl">description</span>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3 tracking-tight">Papeles Perdidos</h3>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                Meseros corriendo a la cocina y cocineros confundidos con letras ilegibles. Pedidos que se pierden entre el salón y la estufa.
                            </p>
                        </div>

                        {/* Pain 2 */}
                        <div className="group relative bg-[#1E293B]/60 backdrop-blur-md border border-white/5 p-8 rounded-2xl hover:bg-[#1E293B]/80 transition-all duration-300 hover:-translate-y-2 overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 text-[60px] font-black text-white/3 italic select-none pointer-events-none">02</div>
                            <div className="w-14 h-14 bg-orange-500/10 text-orange-500 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-500 group-hover:rotate-[360deg]">
                                <span className="material-symbols-outlined text-2xl">money_off</span>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3 tracking-tight">Fugas de Dinero</h3>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                Platos que se entregan pero nunca se cobran porque no se anotaron bien. Dinero que desaparece de tu operación cada día.
                            </p>
                        </div>

                        {/* Pain 3 */}
                        <div className="group relative bg-[#1E293B]/60 backdrop-blur-md border border-white/5 p-8 rounded-2xl hover:bg-[#1E293B]/80 transition-all duration-300 hover:-translate-y-2 overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 text-[60px] font-black text-white/3 italic select-none pointer-events-none">03</div>
                            <div className="w-14 h-14 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-500 group-hover:rotate-[360deg]">
                                <span className="material-symbols-outlined text-2xl">schedule</span>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3 tracking-tight">Cierres Agotadores</h3>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                Quedarte hasta la madrugada sumando tickets para ver si la caja cuadra. Noches de estrés que erosionan tu energía y motivación.
                            </p>
                        </div>
                    </div>

                    {/* Transition text */}
                    <div className="mt-16 max-w-2xl mx-auto">
                        <div className="h-px w-24 bg-gradient-to-r from-transparent via-emerald-500 to-transparent mx-auto mb-8" />
                        <p className="text-lg sm:text-xl text-slate-300 font-medium leading-relaxed">
                            <span className="text-emerald-400 font-bold">RestoGestión</span> elimina este estrés para que te enfoques en <span className="text-white font-bold">atender mejor y vender más.</span>
                        </p>
                    </div>
                </div>
            </section>


            {/* ═══════════════════════════════════════════════════════
                SECTION 3 — THE SOLUTION (3 PILLARS)
            ═══════════════════════════════════════════════════════ */}
            <section className="py-20 sm:py-28 bg-[#0B1120]">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 leading-tight tracking-tight">
                            Todo lo que necesitas en una sola app,<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">súper fácil de usar.</span>
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Pillar 1 */}
                        <div className="group bg-[#1E293B] rounded-2xl p-8 border border-slate-800 transition-all hover:border-emerald-500/50 hover:-translate-y-2 duration-300">
                            <div className="w-16 h-16 bg-emerald-600/10 text-emerald-500 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-emerald-600 group-hover:text-white transition-colors shadow-lg">
                                <span className="material-symbols-outlined text-3xl">bolt</span>
                            </div>
                            <h3 className="text-2xl font-black text-white mb-4 tracking-tight">
                                Pedidos a cocina en 1 segundo
                            </h3>
                            <p className="text-slate-400 leading-relaxed">
                                Tus meseros toman la orden en la mesa e inmediatamente suena en la pantalla de la cocina.{' '}
                                <span className="text-white font-semibold">Cero gritos, cero demoras.</span>
                            </p>
                            <div className="mt-6 pt-4 border-t border-slate-700/50">
                                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                                    Sin errores de transcripción
                                </div>
                            </div>
                        </div>

                        {/* Pillar 2 */}
                        <div className="group bg-[#1E293B] rounded-2xl p-8 border border-slate-800 transition-all hover:border-blue-500/50 hover:-translate-y-2 duration-300">
                            <div className="w-16 h-16 bg-blue-600/10 text-blue-500 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-lg">
                                <span className="material-symbols-outlined text-3xl">table_restaurant</span>
                            </div>
                            <h3 className="text-2xl font-black text-white mb-4 tracking-tight">
                                Control de mesas en vivo
                            </h3>
                            <p className="text-slate-400 leading-relaxed">
                                Mira desde tu propio teléfono qué mesas están libres, cuáles están esperando comida y cuáles ya pidieron la cuenta.
                            </p>
                            <div className="mt-6 pt-4 border-t border-slate-700/50">
                                <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
                                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                                    Visibilidad total en tiempo real
                                </div>
                            </div>
                        </div>

                        {/* Pillar 3 */}
                        <div className="group bg-[#1E293B] rounded-2xl p-8 border border-slate-800 transition-all hover:border-violet-500/50 hover:-translate-y-2 duration-300">
                            <div className="w-16 h-16 bg-violet-600/10 text-violet-500 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-violet-600 group-hover:text-white transition-colors shadow-lg">
                                <span className="material-symbols-outlined text-3xl">calculate</span>
                            </div>
                            <h3 className="text-2xl font-black text-white mb-4 tracking-tight">
                                Cierre de caja automático
                            </h3>
                            <p className="text-slate-400 leading-relaxed">
                                Olvídate de la calculadora. Al final del día, la app te dice exactamente cuánto dinero debe haber{' '}
                                <span className="text-white font-semibold">en efectivo y en tarjetas, al centavo.</span>
                            </p>
                            <div className="mt-6 pt-4 border-t border-slate-700/50">
                                <div className="flex items-center gap-2 text-xs font-bold text-violet-400 uppercase tracking-wider">
                                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                                    Caja cuadrada en 30 segundos
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>


            {/* ═══════════════════════════════════════════════════════
                SECTION 4 — OBJECTION HANDLING (TRUST)
            ═══════════════════════════════════════════════════════ */}
            <section className="py-20 sm:py-28 bg-[#111827] border-y border-slate-800">
                <div className="max-w-5xl mx-auto px-4 sm:px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 leading-tight tracking-tight">
                            Modernizar tu local es más fácil<br />
                            <span className="text-slate-400">de lo que crees.</span>
                        </h2>
                    </div>

                    <div className="space-y-6 max-w-3xl mx-auto">
                        {/* Objection 1 */}
                        <div className="bg-[#0B1120] border border-slate-800 rounded-2xl p-8 flex items-start gap-6 hover:border-emerald-500/30 transition-colors group">
                            <div className="w-14 h-14 shrink-0 bg-emerald-500/10 rounded-2xl flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                                <span className="material-symbols-outlined text-emerald-500 group-hover:text-white text-2xl transition-colors">smartphone</span>
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="px-3 py-1 bg-slate-800 rounded-full text-[9px] font-black text-slate-400 uppercase tracking-widest">Hardware</span>
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">No necesitas comprar computadoras.</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    La app funciona perfectamente en los celulares <span className="text-white font-medium">Android o iOS</span> que tu equipo ya tiene. Cero inversión en dispositivos.
                                </p>
                            </div>
                        </div>

                        {/* Objection 2 */}
                        <div className="bg-[#0B1120] border border-slate-800 rounded-2xl p-8 flex items-start gap-6 hover:border-blue-500/30 transition-colors group">
                            <div className="w-14 h-14 shrink-0 bg-blue-500/10 rounded-2xl flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                <span className="material-symbols-outlined text-blue-500 group-hover:text-white text-2xl transition-colors">school</span>
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="px-3 py-1 bg-slate-800 rounded-full text-[9px] font-black text-slate-400 uppercase tracking-widest">Capacitación</span>
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">Aprenderán a usarla hoy mismo.</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    La interfaz es tan sencilla como enviar un mensaje de texto. <span className="text-white font-medium">Tus meseros volarán tomando pedidos</span> desde el primer día.
                                </p>
                            </div>
                        </div>

                        {/* Objection 3 */}
                        <div className="bg-[#0B1120] border border-slate-800 rounded-2xl p-8 flex items-start gap-6 hover:border-violet-500/30 transition-colors group">
                            <div className="w-14 h-14 shrink-0 bg-violet-500/10 rounded-2xl flex items-center justify-center group-hover:bg-violet-500 group-hover:text-white transition-colors">
                                <span className="material-symbols-outlined text-violet-500 group-hover:text-white text-2xl transition-colors">cloud</span>
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="px-3 py-1 bg-slate-800 rounded-full text-[9px] font-black text-slate-400 uppercase tracking-widest">Instalación</span>
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">100% en la Nube.</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    Cero cables y cero técnicos en tu local. <span className="text-white font-medium">Te creamos la cuenta y empiezas a operar al instante.</span> Sin complicaciones.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>


            {/* ═══════════════════════════════════════════════════════
                SECTION 5 — FINAL CTA (CLOSING)
            ═══════════════════════════════════════════════════════ */}
            <section className="py-24 md:py-32 bg-[#0F172A] relative overflow-hidden text-center">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(16,185,129,0.08),_transparent_70%)]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-600/5 blur-[120px] rounded-full -z-10" />

                <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6">
                    <div className="w-20 h-20 bg-emerald-600/20 border border-emerald-500/30 rounded-3xl flex items-center justify-center mx-auto mb-10 shadow-xl">
                        <span className="material-symbols-outlined text-4xl text-emerald-500 animate-bounce">rocket_launch</span>
                    </div>

                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-6 leading-tight tracking-tight">
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
                        className="group inline-flex items-center gap-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-base sm:text-lg px-10 py-5 rounded-2xl transition-all shadow-2xl shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.03] active:scale-95"
                    >
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        Hablar con un Asesor por WhatsApp
                        <span className="material-symbols-outlined text-xl transition-transform group-hover:translate-x-1">arrow_forward</span>
                    </a>

                    <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-6 text-xs font-bold text-slate-500 uppercase tracking-widest">
                        <span className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-emerald-500 text-lg">verified</span>
                            Demo en 5 minutos
                        </span>
                        <span className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-emerald-500 text-lg">verified</span>
                            Sin tarjeta de crédito
                        </span>
                        <span className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-emerald-500 text-lg">verified</span>
                            Setup inmediato
                        </span>
                    </div>

                    <button
                        onClick={() => navigate('/')}
                        className="mt-8 inline-flex items-center gap-2 bg-[#1E293B] border border-slate-700 hover:border-white text-white text-base font-bold px-8 py-4 rounded-2xl transition-colors"
                    >
                        <span className="material-symbols-outlined text-xl">language</span>
                        Conocer más de RestoGestión
                    </button>
                </div>
            </section>


            {/* Minimal Footer */}
            <footer className="bg-[#0B1120] border-t border-slate-800 py-8">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 flex items-center justify-center bg-blue-600 rounded text-white">
                            <span className="material-symbols-outlined text-[12px]">dataset</span>
                        </div>
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
