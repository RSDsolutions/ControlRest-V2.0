import React from 'react';

interface Props {
    featureName: string;
    description?: string;
}

const PlanUpgradeFullPage: React.FC<Props> = ({ featureName, description }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 text-center animate-fadeIn">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-8 shadow-inner border border-slate-200">
                <span className="material-icons-round text-slate-300 text-5xl">lock</span>
            </div>

            <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">
                {featureName}
            </h2>

            <p className="text-slate-500 max-w-md mx-auto mb-10 font-medium leading-relaxed">
                {description || `Esta funcionalidad avanzada requiere un plan superior. Actualiza tu suscripción para desbloquear el módulo completo de ${featureName.toLowerCase()}.`}
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
                <button className="px-10 py-4 bg-[#136dec] text-white rounded-full font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-200 hover:scale-105 active:scale-95 transition-all">
                    Ver Planes Disponibles
                </button>
                <button className="px-10 py-4 bg-white border border-slate-200 text-slate-600 rounded-full font-black uppercase tracking-widest text-xs hover:bg-slate-50 transition-all">
                    Contactar Soporte
                </button>
            </div>

            <div className="mt-16 pt-8 border-t border-slate-100 w-full max-w-lg">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">SaaS RestoGestión v2.0 Platform</p>
            </div>
        </div>
    );
};

export default PlanUpgradeFullPage;
