
import React from 'react';

const GlobalModeWarning: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center animate-fade-in">
            <div className="w-16 h-16 bg-blue-50 rounded-[8px] flex items-center justify-center mx-auto mb-5">
                <span className="material-icons-round text-3xl text-[#136dec]">public</span>
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2 tracking-tight">Modo Global Activo</h2>
            <p className="text-sm text-slate-500 max-w-sm mb-6 leading-relaxed">
                Estás visualizando la información consolidada de todas las sucursales.
                Selecciona una <span className="font-semibold text-slate-700">Sucursal</span> en el menú lateral para realizar operaciones específicas.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-[8px] text-xs font-medium text-slate-500">
                <span className="material-icons-round text-[16px] text-slate-400">info_outline</span>
                Selecciona una sucursal en el menú de la izquierda.
            </div>
        </div>
    );
};

export default GlobalModeWarning;
