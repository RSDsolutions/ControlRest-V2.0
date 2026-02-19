
import React from 'react';

const GlobalModeWarning: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center animate-fadeIn">
            <div className="bg-indigo-50 p-6 rounded-full mb-6">
                <span className="material-icons-round text-6xl text-indigo-500">public</span>
            </div>
            <h2 className="text-3xl font-black text-slate-800 mb-3 tracking-tight">Modo Global Activo</h2>
            <p className="text-slate-500 text-lg max-w-md mb-8">
                Estás visualizando la información consolidada de todas las sucursales.
                Para realizar operaciones específicas (como tomar pedidos, gestionar caja o ver cocina),
                por favor selecciona una <span className="font-bold text-slate-700">Sucursal</span> en el menú lateral.
            </p>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-500 flex items-center gap-2">
                <span className="material-icons-round text-base">info</span>
                Selecciona una sucursal en el menú de la izquierda.
            </div>
        </div>
    );
};

export default GlobalModeWarning;
