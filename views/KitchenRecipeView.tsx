import React, { useState, useMemo } from 'react';
import { Plate, Ingredient } from '../types';

interface KitchenRecipeViewProps {
    plates: Plate[];
    ingredients: Ingredient[];
}

const KitchenRecipeView: React.FC<KitchenRecipeViewProps> = ({ plates, ingredients }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredPlates = useMemo(() => {
        return plates.filter(p =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.category.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [plates, searchTerm]);

    return (
        <div className="p-8 space-y-8 animate-fadeIn max-w-[1200px] mx-auto">
            <header>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Recetario Digital</h1>
                <p className="text-slate-500 mt-1">Consulta técnica de preparaciones e ingredientes.</p>
            </header>

            <div className="relative max-w-md">
                <span className="material-icons-round absolute left-4 top-3 text-slate-400">search</span>
                <input
                    type="text"
                    placeholder="Buscar plato o categoría..."
                    className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-100 rounded-2xl focus:border-primary transition-all shadow-sm font-medium"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPlates.map(plate => (
                    <div key={plate.id} className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-xl transition-all group">
                        <div className="h-48 relative overflow-hidden">
                            <img
                                src={plate.image}
                                alt={plate.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute top-4 left-4">
                                <span className="px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-primary shadow-sm">
                                    {plate.category}
                                </span>
                            </div>
                        </div>

                        <div className="p-6 flex-1 flex flex-col">
                            <h3 className="text-xl font-black text-slate-800 mb-4">{plate.name}</h3>

                            <div className="space-y-3 flex-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Ingredientes Requeridos</p>
                                {plate.ingredients.map((pi, idx) => {
                                    const ing = ingredients.find(i => i.id === pi.ingredientId);
                                    return (
                                        <div key={idx} className="flex justify-between items-center group/item">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg">{ing?.icon || '📦'}</span>
                                                <span className="text-sm font-bold text-slate-700">{ing?.name || 'Cargando...'}</span>
                                            </div>
                                            <span className="font-black text-slate-900 text-sm bg-slate-50 px-2 py-0.5 rounded-lg group-hover/item:bg-primary/10 transition-colors">
                                                {pi.qty}{ing?.measureUnit || 'gr'}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mt-6 pt-4 border-t border-dashed border-slate-200">
                                <div className="flex items-center gap-2 text-slate-400">
                                    <span className="material-icons-round text-sm">info</span>
                                    <span className="text-[10px] font-bold uppercase tracking-wider">Cantidades por porción estándar</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                {filteredPlates.length === 0 && (
                    <div className="col-span-full py-20 text-center text-slate-400 font-bold bg-white rounded-[32px] border border-dashed border-slate-300">
                        No se encontraron recetas que coincidan con la búsqueda.
                    </div>
                )}
            </div>
        </div>
    );
};

export default KitchenRecipeView;
