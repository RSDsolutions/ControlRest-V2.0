import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LandingHeader: React.FC = () => {
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const navLinks = [
        { label: 'Problema', path: '/problema' },
        { label: 'Cómo Funciona', path: '/como-funciona' },
        { label: 'Funcionalidades', path: '/funcionalidades' },
        { label: 'Precios', path: '/precios' },
        { label: 'Soporte', path: '/soporte' },
    ];

    const handleNav = (path: string) => {
        navigate(path);
        setMobileMenuOpen(false);
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800 bg-[#0B1120]/80 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleNav('/')}>
                        <div className="w-8 h-8 flex items-center justify-center bg-blue-600 rounded-lg text-white">
                            <span className="material-symbols-outlined text-[20px]">dataset</span>
                        </div>
                        <span className="text-white text-lg font-bold tracking-tight">ControlRest V2.0</span>
                    </div>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-8">
                        {navLinks.map(link => (
                            <button key={link.path} onClick={() => handleNav(link.path)} className="text-slate-300 hover:text-white text-sm font-medium transition-colors">
                                {link.label}
                            </button>
                        ))}
                    </nav>

                    {/* Desktop CTA */}
                    <div className="hidden md:flex items-center gap-4">
                        <button onClick={() => handleNav('/login')} className="text-slate-300 text-sm font-medium hover:text-white transition-colors">
                            Iniciar Sesión
                        </button>
                        <button onClick={() => handleNav('/login')} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2">
                            Agendar Diagnóstico
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
                        {navLinks.map(link => (
                            <button
                                key={link.path}
                                onClick={() => handleNav(link.path)}
                                className="text-slate-300 hover:text-white hover:bg-slate-800/50 text-sm font-medium transition-colors text-left px-4 py-3 rounded-lg"
                            >
                                {link.label}
                            </button>
                        ))}
                        <div className="border-t border-slate-800 mt-3 pt-3 flex flex-col gap-2">
                            <button
                                onClick={() => handleNav('/login')}
                                className="text-slate-300 hover:text-white text-sm font-medium text-left px-4 py-3 rounded-lg hover:bg-slate-800/50 transition-colors"
                            >
                                Iniciar Sesión
                            </button>
                            <button
                                onClick={() => handleNav('/login')}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                Agendar Diagnóstico
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
