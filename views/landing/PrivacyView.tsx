import React from 'react';
import LandingHeader from './LandingHeader';
import LandingFooter from './LandingFooter';

const PrivacyView: React.FC = () => {
    return (
        <div className="min-h-screen bg-[#0B1120] text-white font-sans selection:bg-blue-500/30">
            <LandingHeader />

            <main className="pt-24 pb-16">
                {/* Hero Section */}
                <section className="max-w-7xl mx-auto px-6 lg:px-8 mb-20 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-wider mb-6">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                        Última actualización: Noviembre 2024
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6 leading-tight">
                        Política de Privacidad y <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Protección de Datos</span>
                    </h1>
                    <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
                        Transparencia radical sobre cómo protegemos, procesamos y eliminamos sus datos empresariales bajo la LOPDP de Ecuador.
                    </p>
                </section>

                {/* Compliance Section */}
                <section className="max-w-4xl mx-auto px-6 mb-24">
                    <div className="bg-gradient-to-b from-slate-900/50 to-slate-900 border border-slate-800 rounded-[2.5rem] p-8 md:p-16 text-center relative overflow-hidden">
                        <div className="w-16 h-16 bg-blue-600/10 border border-blue-500/20 rounded-2xl flex items-center justify-center text-blue-500 mx-auto mb-8">
                            <span className="material-symbols-outlined text-3xl">shield_person</span>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-black mb-6 uppercase tracking-tight">Cumplimiento Normativo LOPDP</h2>
                        <p className="text-slate-400 mb-12 leading-relaxed text-sm md:text-base">
                            RestoGestión opera bajo estricto cumplimiento de la <span className="text-white font-bold italic">Ley Orgánica de Protección de Datos Personales (LOPDP) de Ecuador</span>. Nuestra infraestructura y procesos han sido auditados para garantizar la soberanía digital y la privacidad absoluta de su información empresarial.
                        </p>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-[#0D1525] border border-slate-800 p-6 rounded-2xl text-left flex gap-4 items-start">
                                <span className="material-symbols-outlined text-blue-500">gavel</span>
                                <div>
                                    <h4 className="text-sm font-black uppercase mb-1">Marco Legal Local</h4>
                                    <p className="text-xs text-slate-500 leading-relaxed">Adaptados al Registro Nacional de Protección de Datos y normativa ecuatoriana vigente.</p>
                                </div>
                            </div>
                            <div className="bg-[#0D1525] border border-slate-800 p-6 rounded-2xl text-left flex gap-4 items-start">
                                <span className="material-symbols-outlined text-blue-500">verified_user</span>
                                <div>
                                    <h4 className="text-sm font-black uppercase mb-1">Consentimiento Explícito</h4>
                                    <p className="text-xs text-slate-500 leading-relaxed">Procesamiento de datos exclusivamente bajo autorización contractual y fines específicos.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Ownership Banner */}
                <section className="max-w-7xl mx-auto px-6 mb-24">
                    <div className="bg-blue-600 rounded-[2.5rem] p-12 md:p-20 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-12 group">
                        <div className="relative z-10 max-w-xl">
                            <h2 className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tighter">Tus datos son tuyos, <br /> no nuestros</h2>
                            <p className="text-blue-100 text-lg mb-8 font-medium">
                                Garantizamos la propiedad absoluta de su información. RestoGestión funciona como encargado del tratamiento, no como propietario.
                            </p>
                            <div className="inline-block px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white font-bold text-xs uppercase mb-6">
                                NO vendemos, NO intercambiamos y NO minamos sus datos comerciales.
                            </div>
                        </div>
                        <div className="relative">
                            <div className="w-48 h-48 md:w-64 md:h-64 bg-blue-500/20 rounded-full flex items-center justify-center border border-white/20 backdrop-blur shadow-2xl relative z-10">
                                <span className="material-symbols-outlined text-7xl md:text-9xl text-white drop-shadow-2xl">lock</span>
                            </div>
                            <div className="absolute -inset-10 bg-white/5 blur-3xl rounded-full group-hover:bg-white/10 transition-colors"></div>
                        </div>
                    </div>
                </section>

                {/* Security Section */}
                <section className="max-w-7xl mx-auto px-6 mb-24 text-center">
                    <h2 className="text-3xl md:text-4xl font-black mb-4 tracking-tighter uppercase">Seguridad Técnica de Grado Bancario</h2>
                    <p className="text-slate-500 max-w-2xl mx-auto mb-16 text-sm md:text-base font-medium">
                        Implementamos una arquitectura de defensa en profundidad para proteger sus activos digitales con los más altos estándares de la industria.
                    </p>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: 'view_kanban',
                                color: 'emerald',
                                title: 'Aislamiento RLS',
                                desc: 'Implementación de Row Level Security (RLS) en base de datos. Cada registro está vinculado criptográficamente a su Tenant ID único, haciendo matemáticamente imposible que una empresa acceda a los datos de otra.'
                            },
                            {
                                icon: 'encrypted',
                                color: 'blue',
                                title: 'Encriptación Extremo a Extremo',
                                desc: 'Todo tráfico se transmite vía TLS 1.3 con certificados SSL de 256 bits. Los datos en reposo (bases de datos y backups) están cifrados usando el estándar AES-256.'
                            },
                            {
                                icon: 'cloud_sync',
                                color: 'indigo',
                                title: 'Backups Redundantes',
                                desc: 'Copias de seguridad automáticas cada hora con replicación geográfica. Garantizamos un RPO (Recovery Point Objective) menor a 15 minutos en caso de desastre.'
                            }
                        ].map((item, idx) => (
                            <div key={idx} className="bg-slate-900/40 border border-slate-800 p-10 rounded-3xl hover:border-blue-500/30 transition-all text-left group">
                                <div className={`w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-8 group-hover:scale-110 transition-transform`}>
                                    <span className="material-symbols-outlined text-2xl">{item.icon}</span>
                                </div>
                                <h3 className="text-lg font-black mb-4 uppercase tracking-wider">{item.title}</h3>
                                <p className="text-xs text-slate-500 leading-relaxed font-medium">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Data Lifecycle */}
                <section className="max-w-3xl mx-auto px-6 mb-24">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-black mb-4 tracking-tighter uppercase">Ciclo de Vida de los Datos</h2>
                        <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Transparencia en la retención, portabilidad y eliminación definitiva.</p>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-[#0D1525] border border-slate-800 p-8 rounded-2xl">
                            <div className="flex items-center gap-4 mb-4">
                                <span className="material-symbols-outlined text-blue-500">exit_to_app</span>
                                <h4 className="text-lg font-black uppercase tracking-wider text-white">Exportación de Datos (Portabilidad)</h4>
                            </div>
                            <p className="text-slate-400 text-sm leading-relaxed mb-4">
                                En cumplimiento con el derecho a la portabilidad de la LOPDP, usted puede solicitar la exportación íntegra de sus datos operativos y financieros en formatos estructurados (JSON o CSV) en cualquier momento.
                            </p>
                            <ul className="text-xs text-slate-500 space-y-2 list-disc pl-5">
                                <li>Histórico completo de ventas y tickets.</li>
                                <li>Catálogo de recetas e inventarios.</li>
                                <li>Registros de auditoría y logs de usuarios.</li>
                            </ul>
                        </div>

                        <div className="bg-[#0D1525] border border-slate-800 p-8 rounded-2xl">
                            <div className="flex items-center gap-4 mb-4">
                                <span className="material-symbols-outlined text-red-500">delete_forever</span>
                                <h4 className="text-lg font-black uppercase tracking-wider text-white">Proceso de Eliminación Segura</h4>
                            </div>
                            <p className="text-slate-400 text-sm leading-relaxed mb-4">
                                Garantizamos el "Derecho al Olvido". Ante la terminación del servicio o solicitud expresa, procedemos a una purga criptográfica de sus datos de nuestros servidores de producción y backups.
                            </p>
                            <ul className="text-xs text-slate-500 space-y-2 list-disc pl-5">
                                <li>Eliminación definitiva en un plazo máximo de 30 días.</li>
                                <li>Certificación de borrado de bases de datos relacionales.</li>
                                <li>Suspensión inmediata de procesamiento de datos personales de clientes.</li>
                            </ul>
                        </div>
                    </div>
                </section>
            </main>

            <LandingFooter />
        </div>
    );
};

export default PrivacyView;
