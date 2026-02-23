import React from 'react';
import { useNavigate } from 'react-router-dom';

const LandingHeader: React.FC = () => {
    const navigate = useNavigate();

    return (
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800 bg-[#0B1120]/80 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                        <div className="w-8 h-8 flex items-center justify-center bg-blue-600 rounded-lg text-white">
                            <span className="material-symbols-outlined text-[20px]">dataset</span>
                        </div>
                        <span className="text-white text-lg font-bold tracking-tight">ControlRest V2.0</span>
                    </div>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-8">
                        <button onClick={() => navigate('/problema')} className="text-slate-300 hover:text-white text-sm font-medium transition-colors">Problema</button>
                        <button onClick={() => navigate('/como-funciona')} className="text-slate-300 hover:text-white text-sm font-medium transition-colors">Cómo Funciona</button>
                        <button onClick={() => navigate('/funcionalidades')} className="text-slate-300 hover:text-white text-sm font-medium transition-colors">Funcionalidades</button>
                        <button onClick={() => navigate('/precios')} className="text-slate-300 hover:text-white text-sm font-medium transition-colors">Precios</button>
                        <button onClick={() => navigate('/soporte')} className="text-slate-300 hover:text-white text-sm font-medium transition-colors">Soporte</button>
                    </nav>

                    {/* CTA */}
                    <div className="hidden md:flex items-center gap-4">
                        <button onClick={() => navigate('/login')} className="text-slate-300 text-sm font-medium hover:text-white transition-colors">
                            Iniciar Sesión
                        </button>
                        <button onClick={() => navigate('/login')} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2">
                            Agendar Diagnóstico
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
    );
};

export default LandingHeader;
