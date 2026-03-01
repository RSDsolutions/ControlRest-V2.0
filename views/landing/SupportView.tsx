import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LandingHeader from './LandingHeader';
import LandingFooter from './LandingFooter';

const SupportView: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        document.documentElement.classList.add('dark');
        return () => {
            document.documentElement.classList.remove('dark');
        };
    }, []);

    return (
        <div className="bg-[#0F172A] text-slate-100 font-sans antialiased selection:bg-blue-600 selection:text-white overflow-x-hidden min-h-screen">

            <LandingHeader />
            <main className="flex-1 flex flex-col items-center w-full pt-20">
                <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-wrap gap-2 mb-8">
                        <a className="text-[#92a4c8] hover:text-white transition-colors text-sm font-medium leading-normal" href="#">Inicio</a>
                        <span className="text-[#92a4c8] text-sm font-medium leading-normal">/</span>
                        <span className="text-white text-sm font-medium leading-normal">Implementación y Adopción</span>
                    </div>
                    <div className="relative w-full rounded-2xl overflow-hidden mb-12 min-h-[400px] flex items-center justify-center bg-cover bg-center group" data-alt="Dark abstract financial data streams blue background" style={{ "backgroundImage": "linear-gradient(rgba(17, 22, 33, 0.85), rgba(17, 22, 33, 0.95)), url('https" }}>
                        <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-transparent to-transparent opacity-80"></div>
                        <div className="relative z-10 flex flex-col items-center text-center max-w-4xl px-4 animate-fade-in-up">
                            <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary text-xs font-bold uppercase tracking-wider">
                                <span className="material-symbols-outlined text-sm">rocket_launch</span>
                                IMPLEMENTACIÓN GUIADA
                            </div>
                            <h1 className="text-white text-4xl md:text-5xl lg:text-6xl font-black leading-tight tracking-tight mb-6 drop-shadow-lg">
                                No estás comprando acceso. <br className="hidden md:block" />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-primary">Estás implementando control financiero.</span>
                            </h1>
                            <p className="text-[#9CA3AF] text-lg md:text-xl font-normal max-w-2xl leading-relaxed">
                                Nuestro compromiso no termina con la entrega de claves. Te acompañamos en cada etapa operativa hasta que puedas medir la utilidad real de tu negocio con precisión.
                            </p>
                        </div>
                    </div>
                    <div className="mb-12">
                        <h2 className="text-2xl font-bold text-white mb-6 pl-2 border-l-4 border-primary">Ruta de Madurez Financiera</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-[#1a2233] border border-[#374151] rounded-xl p-6 relative overflow-hidden group hover:border-primary/50 transition-all">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <span className="text-6xl font-black text-white">01</span>
                                </div>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="size-10 rounded bg-blue-500/10 flex items-center justify-center text-primary">
                                        <span className="material-symbols-outlined">inventory_2</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-white">Configuración Operativa</h3>
                                </div>
                                <ul className="space-y-2 text-[#9CA3AF] text-sm">
                                    <li className="flex items-start gap-2"><span className="material-symbols-outlined text-xs mt-1 text-primary">check_circle</span>Estandarización de Recetas</li>
                                    <li className="flex items-start gap-2"><span className="material-symbols-outlined text-xs mt-1 text-primary">check_circle</span>Alta de Insumos y Proveedores</li>
                                    <li className="flex items-start gap-2"><span className="material-symbols-outlined text-xs mt-1 text-primary">check_circle</span>Definición de Costos Base</li>
                                </ul>
                            </div>
                            <div className="bg-[#1a2233] border border-[#374151] rounded-xl p-6 relative overflow-hidden group hover:border-primary/50 transition-all">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <span className="text-6xl font-black text-white">02</span>
                                </div>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="size-10 rounded bg-purple-500/10 flex items-center justify-center text-purple-400">
                                        <span className="material-symbols-outlined">query_stats</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-white">Control Financiero</h3>
                                </div>
                                <ul className="space-y-2 text-[#9CA3AF] text-sm">
                                    <li className="flex items-start gap-2"><span className="material-symbols-outlined text-xs mt-1 text-purple-400">check_circle</span>Snapshot de Costos en Tiempo Real</li>
                                    <li className="flex items-start gap-2"><span className="material-symbols-outlined text-xs mt-1 text-purple-400">check_circle</span>Análisis de Utilidad por Plato</li>
                                    <li className="flex items-start gap-2"><span className="material-symbols-outlined text-xs mt-1 text-purple-400">check_circle</span>Conciliación de Inventario</li>
                                </ul>
                            </div>
                            <div className="bg-[#1a2233] border border-[#374151] rounded-xl p-6 relative overflow-hidden group hover:border-primary/50 transition-all">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <span className="text-6xl font-black text-white">03</span>
                                </div>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="size-10 rounded bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                                        <span className="material-symbols-outlined">trending_up</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-white">Optimización Total</h3>
                                </div>
                                <ul className="space-y-2 text-[#9CA3AF] text-sm">
                                    <li className="flex items-start gap-2"><span className="material-symbols-outlined text-xs mt-1 text-emerald-400">check_circle</span>Cálculo de Punto de Equilibrio</li>
                                    <li className="flex items-start gap-2"><span className="material-symbols-outlined text-xs mt-1 text-emerald-400">check_circle</span>P&amp;L Diario Automatizado</li>
                                    <li className="flex items-start gap-2"><span className="material-symbols-outlined text-xs mt-1 text-emerald-400">check_circle</span>Proyección de Flujo de Caja</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-16">
                        <div className="flex flex-col bg-[#1a2233] border border-[#374151] rounded-xl overflow-hidden hover:border-primary/50 transition-all duration-300 group">
                            <div className="p-6 flex flex-col h-full">
                                <div className="size-12 rounded-lg bg-blue-500/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                                    <span className="material-symbols-outlined !text-3xl">monitoring</span>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Monitoreo de Adopción</h3>
                                <p className="text-[#9CA3AF] text-sm mb-6 flex-grow">
                                    Validamos el impacto financiero de tu operación en tiempo real. No solo resolvemos dudas, auditamos que el sistema refleje tu realidad.
                                </p>
                                <div className="flex items-center gap-2 mb-6">
                                    <span className="relative flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                    </span>
                                    <span className="text-xs font-medium text-green-400">Auditoría Activa • Respuesta: Prioritaria</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col bg-[#1a2233] border border-[#374151] rounded-xl overflow-hidden hover:border-primary/50 transition-all duration-300 group">
                            <div className="p-6 flex flex-col h-full">
                                <div className="size-12 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform">
                                    <span className="material-symbols-outlined !text-3xl">model_training</span>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Onboarding Financiero</h3>
                                <p className="text-[#9CA3AF] text-sm mb-6 flex-grow">
                                    Sesiones 1 a 1 especializadas para la estructuración de costos. Transformamos tus datos operativos en inteligencia financiera.
                                </p>
                                <div className="mb-6 bg-[#111622] rounded-lg p-4 border border-[#374151]">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-semibold text-white uppercase">Estructuración de Costos</span>
                                        <span className="text-xs font-bold text-purple-400">En proceso</span>
                                    </div>
                                    <div className="w-full bg-[#242f47] rounded-full h-2">
                                        <div className="bg-purple-500 h-2 rounded-full" style={{ "width": "40%" }}></div>
                                    </div>
                                    <p className="text-[10px] text-[#9CA3AF] mt-2">Siguiente: Validación de recetas base</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col bg-[#1a2233] border border-[#374151] rounded-xl overflow-hidden hover:border-primary/50 transition-all duration-300 group">
                            <div className="p-6 flex flex-col h-full">
                                <div className="size-12 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
                                    <span className="material-symbols-outlined !text-3xl">library_books</span>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Biblioteca de Control</h3>
                                <p className="text-[#9CA3AF] text-sm mb-6">
                                    Guías técnicas avanzadas. Aprende a detectar fugas, calcular márgenes reales y auditar tus propios procesos.
                                </p>
                                <div className="flex-grow space-y-3 mb-6">
                                    <a className="flex items-center gap-3 p-3 rounded-lg bg-[#111622] border border-[#374151] hover:border-primary/50 hover:bg-[#1c2436] transition-all group/item" href="#">
                                        <span className="material-symbols-outlined text-emerald-400 text-lg">description</span>
                                        <span className="text-sm text-gray-300 group-hover/item:text-white line-clamp-1">Guía: Detección de Fugas</span>
                                    </a>
                                    <a className="flex items-center gap-3 p-3 rounded-lg bg-[#111622] border border-[#374151] hover:border-primary/50 hover:bg-[#1c2436] transition-all group/item" href="#">
                                        <span className="material-symbols-outlined text-emerald-400 text-lg">calculate</span>
                                        <span className="text-sm text-gray-300 group-hover/item:text-white line-clamp-1">Cálculo de Margen Real</span>
                                    </a>
                                    <a className="flex items-center gap-3 p-3 rounded-lg bg-[#111622] border border-[#374151] hover:border-primary/50 hover:bg-[#1c2436] transition-all group/item" href="#">
                                        <span className="material-symbols-outlined text-emerald-400 text-lg">playlist_add_check</span>
                                        <span className="text-sm text-gray-300 group-hover/item:text-white line-clamp-1">Checklist de Cierre Diario</span>
                                    </a>
                                </div>
                                <div className="space-y-3 mt-auto">
                                    <button className="w-full flex items-center justify-center gap-2 bg-transparent hover:bg-[#242f47] text-white font-medium py-3 px-4 rounded-lg border border-[#374151] transition-colors">
                                        <span className="material-symbols-outlined text-sm">search</span>
                                        Explorar Guías Técnicas
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="relative rounded-2xl bg-[#1a2233] border border-[#374151] p-8 md:p-12 text-center overflow-hidden">
                        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
                        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
                        <div className="relative z-10 max-w-3xl mx-auto">
                            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">El orden financiero no se instala. Se implementa.</h2>
                            <p className="text-[#9CA3AF] text-base md:text-lg mb-8">
                                Comienza hoy mismo el proceso de transformación operativa de tu restaurante.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                                <button
                                    onClick={() => navigate('/solicitar-demo')}
                                    className="w-full sm:w-auto min-w-[200px] h-14 bg-primary hover:bg-blue-600 text-white text-base font-bold rounded-lg shadow-lg shadow-primary/20 transition-all hover:scale-105 flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined">start</span>
                                    Solicitar DEMO
                                </button>
                                <button
                                    onClick={() => window.open('https://api.whatsapp.com/send?phone=593984918811&text=Hola%20%F0%9F%91%8B%20Estoy%20interesado%20en%20implementar%20un%20sistema%20para%20controlar%20en%20tiempo%20real%20los%20costos%2C%20inventario%20y%20utilidad%20de%20mi%20restaurante.%0A%0AQuisiera%20saber%20c%C3%B3mo%20funciona%20RestoGesti%C3%B3n%20y%20si%20puede%20adaptarse%20a%20mi%20operaci%C3%B3n%20actual.', '_blank')}
                                    className="w-full sm:w-auto min-w-[200px] h-14 bg-transparent hover:bg-white/5 border-2 border-[#374151] text-white text-base font-bold rounded-lg transition-all hover:border-white flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined">support_agent</span>
                                    Hablar con un consultor
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <LandingFooter />


        </div>
    );
};

export default SupportView;
