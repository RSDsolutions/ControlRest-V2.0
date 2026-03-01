import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LandingHeader from './LandingHeader';
import LandingFooter from './LandingFooter';

const ProblemView: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        document.documentElement.classList.add('dark');
        return () => {
            document.documentElement.classList.remove('dark');
        };
    }, []);

    const problemPoints = [
        {
            id: '01',
            title: 'Inflación Silenciosa',
            desc: 'Aumento de costos de insumos que no se reflejan a tiempo en tus precios de venta.',
            impact: 'Pérdida de utilidad 2% - 4%',
            icon: 'trending_up',
            severity: 'high'
        },
        {
            id: '02',
            title: 'Mermas No Auditadas',
            desc: 'Desperdicio operativo y errores de producción que drenan tu capital diario.',
            impact: 'Pérdida de utilidad 3% - 5%',
            icon: 'delete_outline',
            severity: 'critical'
        },
        {
            id: '03',
            title: 'Consumo no Registrado',
            desc: 'Alimentos de personal y cortesías que no figuran en tus balances financieros.',
            impact: 'Pérdida de utilidad 1% - 3%',
            icon: 'restaurant',
            severity: 'medium'
        },
        {
            id: '04',
            title: 'Sobreproducción',
            desc: 'Falta de pronósticos inteligentes que resulta en inventario desperdiciado.',
            impact: 'Pérdida de utilidad 2% - 6%',
            icon: 'inventory_2',
            severity: 'critical'
        },
        {
            id: '05',
            title: 'Gastos de "Caja Chica"',
            desc: 'Pequeñas salidas de efectivo no categorizadas que distorsionan tu flujo de caja.',
            impact: 'Pérdida de utilidad 1% - 4%',
            icon: 'visibility_off',
            severity: 'high'
        }
    ];

    return (
        <div className="bg-[#020617] text-slate-100 font-sans antialiased selection:bg-blue-600 selection:text-white min-h-screen relative overflow-x-hidden">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 blur-[120px] rounded-full"></div>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-150 contrast-150 mix-blend-overlay"></div>
            </div>

            <LandingHeader />

            <main className="relative z-10">
                {/* Hero Section */}
                <section className="max-w-7xl mx-auto px-4 pt-32 pb-20 md:pt-48 md:pb-32 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-red-500/20 bg-red-500/5 backdrop-blur-md mb-8 animate-fade-in">
                        <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
                        <span className="text-red-400 text-[10px] md:text-xs font-bold uppercase tracking-[0.2em]">Diagnóstico de Fuga de Capital</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[0.9] mb-10 text-white drop-shadow-2xl">
                        Estás perdiendo el <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-500 to-red-600">
                            20% de tu utilidad
                        </span> <br />
                        <span className="text-4xl md:text-6xl lg:text-7xl opacity-90 italic font-light">sin darte cuenta.</span>
                    </h1>

                    <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto font-medium leading-relaxed mb-12">
                        La contabilidad tradicional te muestra lo que quieres ver. RestoGestión auditada tu operación en tiempo real para revelarte lo que necesitas saber.
                    </p>

                    {/* Dashboard Preview Mockup */}
                    <div className="max-w-4xl mx-auto mt-16 relative">
                        <div className="absolute inset-0 bg-blue-500/10 blur-[80px] -z-10 rounded-3xl"></div>
                        <div className="bg-[#0B1120]/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                            <div className="flex items-center px-4 py-3 border-b border-white/5 bg-white/5">
                                <div className="flex gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/40"></div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-orange-500/40"></div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/40"></div>
                                </div>
                                <div className="mx-auto text-[10px] font-mono text-slate-500 tracking-widest uppercase">Sistema de Auditoría RestoGestión V2.0</div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2">
                                <div className="p-8 md:p-12 border-b md:border-b-0 md:border-r border-white/5">
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="material-symbols-outlined text-slate-400 text-xl">account_balance</span>
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Utilidad en Libros</span>
                                    </div>
                                    <div className="text-5xl md:text-6xl font-black text-white mb-2">18.5%</div>
                                    <p className="text-sm text-slate-500 italic">"Lo que crees que estás ganando"</p>
                                </div>
                                <div className="p-8 md:p-12 bg-red-500/5 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4">
                                        <span className="material-symbols-outlined text-red-500/50 text-4xl animate-pulse">warning</span>
                                    </div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="material-symbols-outlined text-red-500 text-xl">analytics</span>
                                        <span className="text-xs font-bold text-red-400 uppercase tracking-widest">Utilidad Real</span>
                                    </div>
                                    <div className="text-5xl md:text-6xl font-black text-red-500 mb-2">8.4%</div>
                                    <p className="text-sm text-red-400/80 font-bold uppercase tracking-tight">Fuga detectada: -$4,200/mes</p>
                                </div>
                            </div>

                            <div className="p-4 bg-red-500/10 border-t border-red-500/20 text-center">
                                <span className="text-[10px] font-mono text-red-400 font-bold tracking-widest">ESTADO: ALERTA DE RENTABILIDAD CRÍTICA</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Vectors of Loss */}
                <section className="py-24 bg-[#0F172A]/50 border-y border-white/5">
                    <div className="max-w-7xl mx-auto px-4">
                        <div className="mb-16 md:mb-24 flex flex-col md:flex-row md:items-end justify-between gap-6">
                            <div className="max-w-2xl">
                                <h2 className="text-3xl md:text-5xl font-black text-white mb-6 leading-tight">
                                    Identificamos los vectores de <span className="text-blue-500">fuga financiera.</span>
                                </h2>
                                <p className="text-lg text-slate-400">
                                    Analizamos cada centavo que entra y sale de tu operación para detener las pérdidas invisibles.
                                </p>
                            </div>
                            <div className="text-right">
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                    <span className="text-sm font-mono text-blue-400 font-bold uppercase animate-pulse">Scanning_Operational_Gaps...</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                            {problemPoints.map((point) => (
                                <div
                                    key={point.id}
                                    className="group relative bg-[#1E293B]/40 backdrop-blur-md border border-white/5 p-8 rounded-2xl hover:bg-[#1E293B]/60 transition-all duration-300 hover:-translate-y-2 overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 p-4 text-[40px] font-black text-white/5 italic">{point.id}</div>
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 transition-transform duration-500 group-hover:rotate-[360deg] ${point.severity === 'critical' ? 'bg-red-500/10 text-red-500' :
                                        point.severity === 'high' ? 'bg-orange-500/10 text-orange-500' :
                                            'bg-blue-500/10 text-blue-500'
                                        }`}>
                                        <span className="material-symbols-outlined">{point.icon}</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-3 tracking-tight">{point.title}</h3>
                                    <p className="text-sm text-slate-400 leading-relaxed mb-6">{point.desc}</p>
                                    <div className="pt-4 border-t border-white/5">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">Impacto Previsto</span>
                                        <span className={`text-sm font-bold ${point.severity === 'critical' ? 'text-red-500' :
                                            point.severity === 'high' ? 'text-orange-500' :
                                                'text-blue-500'
                                            }`}>{point.impact}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* The Breach Section */}
                <section className="py-24 max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div className="relative">
                        <div className="absolute -top-10 -left-10 w-40 h-40 bg-blue-500/20 blur-[80px] -z-10 rounded-full"></div>
                        <h2 className="text-4xl md:text-5xl font-black text-white mb-8 leading-tight">
                            La brecha entre <br />
                            <span className="text-slate-500 line-through decoration-red-500/50 decoration-4">Lo que crees ganar</span> <br />
                            <span className="text-blue-500 italic">Y lo que realmente ganas.</span>
                        </h2>
                        <div className="space-y-6 text-slate-400 text-lg leading-relaxed">
                            <p>
                                La mayoría de los software para restaurantes solo suman ventas. Nosotros auditamos la rentabilidad.
                            </p>
                            <p>
                                Entendemos que un negocio exitoso no se mide por cuánto factura, sino por cuánto retiene después de mermas, inflación y errores operativos.
                            </p>
                        </div>
                        <div className="mt-10 flex flex-wrap gap-4">
                            <button onClick={() => navigate('/como-funciona')} className="px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-lg shadow-blue-600/20">
                                Ver cómo lo resolvemos
                            </button>
                        </div>
                    </div>

                    <div className="bg-[#0B1120] border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 blur-3xl -z-10"></div>

                        <div className="space-y-12">
                            <div>
                                <div className="flex justify-between items-end mb-4">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Utilidad Ficticia (Teórica)</span>
                                    <span className="text-xl font-black text-white">18.5%</span>
                                </div>
                                <div className="h-4 bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-slate-500 w-[85%] rounded-full shadow-[0_0_15px_rgba(100,116,139,0.3)]"></div>
                                </div>
                            </div>

                            <div className="relative">
                                <div className="absolute -left-4 -right-4 top-1/2 -translate-y-1/2 h-24 bg-red-500/5 -z-10 border-y border-red-500/10"></div>
                                <div className="flex justify-between items-end mb-4">
                                    <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Utilidad Real (RestoGestión)</span>
                                    <span className="text-xl font-black text-blue-400">8.4%</span>
                                </div>
                                <div className="h-4 bg-slate-800 rounded-full overflow-hidden relative">
                                    <div className="h-full bg-blue-500 w-[35%] rounded-full shadow-[0_0_20px_rgba(59,130,246,0.5)] z-10 relative"></div>
                                    <div className="absolute left-[35%] w-[50%] h-full bg-red-500/20 animate-pulse"></div>
                                </div>
                                <div className="mt-6 flex items-center justify-between text-[10px] font-mono">
                                    <span className="text-red-500 font-black tracking-tighter blink">▼ 10.1% FUGA DE CAPITAL DETECTADA</span>
                                    <span className="text-slate-600 tracking-widest underline underline-offset-4">ID_AUDIT: #RST-8812</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Final CTA */}
                <section className="py-24 md:py-40 bg-[#0F172A] relative overflow-hidden text-center">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(59,130,246,0.08),_transparent_70%)]"></div>

                    <div className="relative z-10 max-w-4xl mx-auto px-4">
                        <div className="w-20 h-20 bg-blue-600/20 border border-blue-500/30 rounded-3xl flex items-center justify-center mx-auto mb-10 shadow-xl">
                            <span className="material-symbols-outlined text-4xl text-blue-500 animate-bounce">rocket_launch</span>
                        </div>

                        <h2 className="text-4xl md:text-6xl font-black text-white mb-8 leading-tight tracking-tight">
                            Deja de adivinar tus márgenes. <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600 italic">Empieza a auditarlos.</span>
                        </h2>

                        <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-12 font-medium">
                            En menos de 24 horas podemos tener tu sistema configurado y detectando las primeras anomalías en tu costo de ventas.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-6 justify-center">
                            <button onClick={() => navigate('/solicitar-demo')} className="group relative px-10 py-5 bg-blue-600 hover:bg-blue-700 text-white font-black text-lg rounded-2xl transition-all shadow-2xl shadow-blue-600/20 hover:scale-105 active:scale-95">
                                <span className="flex items-center gap-2">
                                    Auditar mi operación ahora
                                    <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">arrow_forward_ios</span>
                                </span>
                            </button>
                        </div>

                        <div className="mt-12 flex items-center justify-center gap-8 text-xs font-bold text-slate-500 uppercase tracking-widest">
                            <span className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-green-500 text-lg">verified</span>
                                Setup inmediato
                            </span>
                            <span className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-green-500 text-lg">verified</span>
                                ROI desde el mes 1
                            </span>
                        </div>
                    </div>
                </section>

                <LandingFooter />
            </main>
        </div>
    );
};

export default ProblemView;

