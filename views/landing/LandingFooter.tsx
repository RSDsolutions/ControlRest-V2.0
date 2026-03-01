import React from 'react';
import { Link } from 'react-router-dom';

const LandingFooter: React.FC = () => {
    return (
        <footer className="bg-[#0B1120] border-t border-slate-800 pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    <div className="col-span-1 md:col-span-1">
                        <Link to="/" className="flex items-center gap-2 mb-4 group">
                            <div className="w-6 h-6 flex items-center justify-center bg-blue-600 rounded text-white group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined text-[16px]">dataset</span>
                            </div>
                            <span className="text-white font-bold">RestoGestión</span>
                        </Link>
                        <p className="text-slate-500 text-sm">
                            El ERP financiero líder para el sector gastronómico en Latinoamérica.
                        </p>
                    </div>
                    <div>
                        <h4 className="text-white font-bold mb-4 text-xs uppercase tracking-widest text-slate-400">Motor Financiero</h4>
                        <ul className="space-y-2 text-sm text-slate-500 font-medium">
                            <li><Link className="hover:text-blue-500 transition-colors" to="/como-funciona">Cómo Funciona</Link></li>
                            <li><Link className="hover:text-blue-500 transition-colors" to="/arquitectura">Arquitectura</Link></li>
                            <li><Link className="hover:text-blue-500 transition-colors" to="/resultados">Resultados</Link></li>
                            <li><Link className="hover:text-blue-500 transition-colors" to="/funcionalidades">Funcionalidades</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-white font-bold mb-4 text-xs uppercase tracking-widest text-slate-400">Solución</h4>
                        <ul className="space-y-2 text-sm text-slate-500 font-medium">
                            <li><Link className="hover:text-blue-500 transition-colors" to="/problema">Analizar Problema</Link></li>
                            <li><Link className="hover:text-blue-500 transition-colors" to="/precios">Planes y Precios</Link></li>
                            <li><Link className="hover:text-blue-500 transition-colors" to="/soporte">Soporte Técnico</Link></li>
                            <li><Link className="hover:text-blue-500 transition-colors" to="/solicitar-demo">Solicitar Demo</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-white font-bold mb-4 text-xs uppercase tracking-widest text-slate-400">Información</h4>
                        <ul className="space-y-2 text-sm text-slate-500 font-medium">
                            <li><Link className="hover:text-blue-500 transition-colors" to="/login">Iniciar Sesión</Link></li>
                            <li><Link className="hover:text-blue-500 transition-colors" to="/privacidad">Privacidad</Link></li>
                            <li><Link className="hover:text-blue-500 transition-colors" to="/terminos">Términos</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest text-center md:text-left">
                        © {new Date().getFullYear()} RSD Solutions. Todos los derechos reservados.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default LandingFooter;
