import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const LandingHeader: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [motorMenuOpen, setMotorMenuOpen] = useState(false);

    const motorLinks = [
        { label: 'Cómo Funciona', path: '/como-funciona', icon: 'auto_fix' },
        { label: 'Arquitectura', path: '/arquitectura', icon: 'hub' },
        { label: 'Resultados', path: '/resultados', icon: 'query_stats' },
        { label: 'Funcionalidades', path: '/funcionalidades', icon: 'widgets' },
    ];

    const mainLinks = [
        { label: 'Problema', path: '/problema' },
        { label: 'Precios', path: '/precios' },
        { label: 'Soporte', path: '/soporte' },
    ];

    const isActive = (path: string) => location.pathname === path;
    const isMotorActive = motorLinks.some(link => isActive(link.path));

    const handleNav = (path: string) => {
        navigate(path);
        setMobileMenuOpen(false);
        setMotorMenuOpen(false);
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800 bg-[#0B1120]/80 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center gap-2.5 cursor-pointer group" onClick={() => handleNav('/')}>
                        <div className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-blue-600 rounded-lg text-white shadow-lg shadow-blue-600/20 group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-[20px] sm:text-[22px]">dataset</span>
                        </div>
                        <span className="text-white text-base sm:text-lg font-bold tracking-tight">RestoGestión V2.0</span>
                    </div>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-4">
                        <button
                            onClick={() => handleNav('/problema')}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 ${isActive('/problema')
                                ? 'text-blue-400 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.3)] border border-blue-500/20'
                                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                                }`}
                        >
                            Problema
                        </button>

                        {/* Dropdown Motor Financiero */}
                        <div
                            className="relative"
                            onMouseEnter={() => setMotorMenuOpen(true)}
                            onMouseLeave={() => setMotorMenuOpen(false)}
                        >
                            <button
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-1.5 ${isMotorActive
                                    ? 'text-blue-400 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.3)] border border-blue-500/20'
                                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                                    }`}
                            >
                                Motor Financiero
                                <span className={`material-symbols-outlined text-sm transition-transform duration-300 ${motorMenuOpen ? 'rotate-180' : ''}`}>
                                    keyboard_arrow_down
                                </span>
                            </button>

                            {/* Dropdown Menu */}
                            <div className={`absolute left-0 top-full pt-2 transition-all duration-300 ${motorMenuOpen ? 'opacity-100 translate-y-0 visible' : 'opacity-0 translate-y-2 invisible'}`}>
                                <div className="w-64 bg-[#0F172A] border border-slate-800 rounded-xl shadow-2xl p-2 backdrop-blur-xl">
                                    {motorLinks.map(link => (
                                        <button
                                            key={link.path}
                                            onClick={() => handleNav(link.path)}
                                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${isActive(link.path)
                                                ? 'text-blue-400 bg-blue-500/10'
                                                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                                                }`}
                                        >
                                            <span className="material-symbols-outlined text-lg">{link.icon}</span>
                                            {link.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {mainLinks.slice(1).map(link => (
                            <button
                                key={link.path}
                                onClick={() => handleNav(link.path)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 ${isActive(link.path)
                                    ? 'text-blue-400 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.3)] border border-blue-500/20'
                                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                                    }`}
                            >
                                {link.label}
                            </button>
                        ))}
                    </nav>

                    {/* Desktop CTA */}
                    <div className="hidden md:flex items-center gap-4">
                        <button onClick={() => handleNav('/login')} className="text-slate-300 text-sm font-medium hover:text-white transition-colors">
                            Iniciar Sesión
                        </button>
                        <button onClick={() => handleNav('/solicitar-demo')} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2">
                            Solicitar DEMO
                            <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </button>
                    </div>

                    {/* Mobile hamburger button */}
                    <div className="md:hidden flex items-center">
                        <button
                            className="text-slate-300 hover:text-white p-2 transition-colors"
                            onClick={() => setMobileMenuOpen(prev => !prev)}
                            aria-label="Abrir menú"
                        >
                            <span className="material-symbols-outlined">
                                {mobileMenuOpen ? 'close' : 'menu'}
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile dropdown menu */}
            {mobileMenuOpen && (
                <div className="md:hidden border-t border-slate-800 bg-[#0B1120]/95 backdrop-blur-md">
                    <nav className="flex flex-col px-4 py-4 gap-1">
                        <button
                            onClick={() => handleNav('/problema')}
                            className={`text-sm font-medium px-4 py-3 rounded-lg text-left ${isActive('/problema') ? 'text-blue-400 bg-blue-500/10 font-bold' : 'text-slate-300'}`}
                        >
                            Problema
                        </button>

                        <div className="px-4 py-2 mt-2">
                            <span className="text-[10px] uppercase font-black tracking-widest text-slate-500 block mb-2">Motor Financiero</span>
                            <div className="flex flex-col gap-1 border-l border-slate-800 ml-1 pl-3">
                                {motorLinks.map(link => (
                                    <button
                                        key={link.path}
                                        onClick={() => handleNav(link.path)}
                                        className={`text-sm font-medium px-3 py-2.5 rounded-lg text-left transition-all ${isActive(link.path)
                                            ? 'text-blue-400 bg-blue-500/5 font-bold'
                                            : 'text-slate-400 hover:text-white'
                                            }`}
                                    >
                                        {link.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {mainLinks.slice(1).map(link => (
                            <button
                                key={link.path}
                                onClick={() => handleNav(link.path)}
                                className={`text-sm font-medium px-4 py-3 rounded-lg text-left ${isActive(link.path) ? 'text-blue-400 bg-blue-500/10 font-bold' : 'text-slate-300'}`}
                            >
                                {link.label}
                            </button>
                        ))}

                        <div className="border-t border-slate-800 mt-3 pt-5 pb-2 flex flex-col gap-3">
                            <button
                                onClick={() => handleNav('/login')}
                                className="text-slate-300 hover:text-white text-sm font-medium text-center px-4 py-4 rounded-xl border border-slate-800 hover:bg-slate-800/50 transition-colors"
                            >
                                Iniciar Sesión
                            </button>
                            <button
                                onClick={() => handleNav('/solicitar-demo')}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-4 px-4 rounded-xl transition-colors shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
                            >
                                Solicitar DEMO
                                <span className="material-symbols-outlined text-sm">arrow_forward</span>
                            </button>
                        </div>
                    </nav>
                </div>
            )}
        </header>
    );
};

export default LandingHeader;
