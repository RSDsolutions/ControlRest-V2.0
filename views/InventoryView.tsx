import React, { useState, useEffect, useCallback } from 'react';
import { Ingredient } from '../types';
import { supabase } from '../supabaseClient';

interface InventoryViewProps {
  ingredients: Ingredient[];
  setIngredients: React.Dispatch<React.SetStateAction<Ingredient[]>>;
  branchId: string | null;
}

const KPIItem = ({ label, value, sub, icon, color }: any) => (
  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group">
    <div className={`absolute -right-4 -top-4 w-20 h-20 ${color} opacity-10 rounded-full blur-xl transition-all group-hover:scale-150`}></div>
    <div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      <h3 className="text-2xl font-black text-slate-900 mt-1">{value}</h3>
    </div>
    <p className="text-[10px] font-bold text-slate-500">{sub}</p>
  </div>
);

const InventoryCard: React.FC<{ ingredient: Ingredient; onViewDetails: (ing: Ingredient) => void }> = ({ ingredient, onViewDetails }) => {
  const percentage = (ingredient.currentQty / (ingredient.minQty * 2)) * 100;
  const isCritical = ingredient.currentQty <= ingredient.criticalQty;
  const isLow = ingredient.currentQty <= ingredient.minQty;

  let statusText = 'NORMAL';
  let colorClass = 'text-primary';
  let iconName = 'check_circle';

  if (isCritical) {
    statusText = 'CRÍTICO';
    colorClass = 'text-red-500';
    iconName = 'error';
  } else if (isLow) {
    statusText = 'STOCK BAJO';
    colorClass = 'text-amber-500';
    iconName = 'warning';
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col gap-4 hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
      <div className="flex justify-between items-start">
        <div>
          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-slate-100 text-slate-500 mb-2">{ingredient.category}</span>
          <h3 className="font-bold text-lg text-slate-900 leading-tight">{ingredient.name}</h3>
        </div>
        <span className="text-2xl">{ingredient.icon}</span>
      </div>
      <div className="flex items-center gap-4 py-2">
        <div className="relative w-16 h-16 flex-shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <path className="text-slate-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3"></path>
            <path className={colorClass} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray={`${Math.min(percentage, 100)}, 100`} strokeLinecap="round" strokeWidth="3"></path>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-[10px] font-bold ${colorClass}`}>{Math.round(percentage)}%</span>
          </div>
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-baseline mb-1">
            <span className="text-xl font-black text-slate-900">{ingredient.currentQty.toLocaleString()}<span className="text-[10px] font-bold text-slate-400 ml-1">{ingredient.measureUnit}</span></span>
          </div>
          <div className={`flex items-center gap-1 text-[10px] font-bold ${colorClass}`}>
            <span className="material-icons-round text-[16px]">{iconName}</span>
            {statusText}
          </div>
        </div>
      </div>
      <div className="pt-4 border-t text-[10px] font-bold text-slate-400 uppercase flex justify-between items-center">
        <span>Mín: {ingredient.minQty} {ingredient.measureUnit}</span>
        <button onClick={() => onViewDetails(ingredient)} className="text-primary hover:text-accent transition-colors font-black flex items-center gap-1">
          VER DETALLES <span className="material-icons-round text-sm">chevron_right</span>
        </button>
      </div>
    </div>
  );
};

const InventoryView: React.FC<InventoryViewProps> = ({ ingredients, setIngredients, branchId }) => {
  const [activeTab, setActiveTab] = useState<'stock' | 'batches' | 'expr'>('stock');

  // Tab 1: Stock
  const [selectedIng, setSelectedIng] = useState<Ingredient | null>(null);
  const [editQty, setEditQty] = useState<string>('');

  // Tab 2 & 3: Batches & Expiration
  const [batches, setBatches] = useState<any[]>([]);
  const [expiringBatches, setExpiringBatches] = useState<any[]>([]);
  const [loadingExtras, setLoadingExtras] = useState(false);

  const fetchExtras = useCallback(async () => {
    if (!branchId || branchId === 'GLOBAL') return;
    setLoadingExtras(true);
    try {
      const { data: bData } = await supabase
        .from('inventory_batches')
        .select('*, suppliers(name), ingredients(name)')
        .eq('branch_id', branchId)
        .order('created_at', { ascending: false });
      if (bData) setBatches(bData);

      const { data: eData } = await supabase
        .from('expiring_batches_view')
        .select('*')
        .eq('branch_id', branchId)
        .order('days_remaining', { ascending: true });
      if (eData) setExpiringBatches(eData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingExtras(false);
    }
  }, [branchId]);

  useEffect(() => {
    if (activeTab !== 'stock') fetchExtras();
  }, [activeTab, fetchExtras]);

  const handleUpdateStock = async () => {
    if (!selectedIng || !branchId || !editQty) return;
    const newQty = parseFloat(editQty);
    if (isNaN(newQty)) return;

    try {
      const { error } = await supabase
        .from('inventory')
        .update({ quantity_gr: newQty })
        .match({ branch_id: branchId, ingredient_id: selectedIng.id });

      if (error) throw error;

      setIngredients(prev => prev.map(i => i.id === selectedIng.id ? { ...i, currentQty: newQty } : i));
      setSelectedIng(null);
    } catch (err: any) {
      console.error('Error updating stock', err);
      alert('Error al actualizar stock: ' + err.message);
    }
  };

  return (
    <div className="p-8 space-y-8 animate-fadeIn">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Vista de Inventario</h1>
          <p className="text-slate-500 mt-1">Control logístico total: existencias físicas, histórico de lotes y alertas sanitarias.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-2xl">
          <button onClick={() => setActiveTab('stock')} className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'stock' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}>Resumen Físico</button>
          <button onClick={() => setActiveTab('batches')} className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'batches' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}>Trazabilidad (Lotes)</button>
          <button onClick={() => setActiveTab('expr')} className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'expr' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}>Alertas Sanitarias</button>
        </div>
      </header>

      {activeTab === 'stock' && (
        <div className="animate-fadeIn space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPIItem label="Valor de Stock" value={`$${ingredients.reduce((acc, i) => acc + (i.currentQty * i.unitPrice), 0).toFixed(2)}`} sub="Total Calculado" icon="monetization_on" color="bg-emerald-50 text-emerald-600" />
            <KPIItem label="Items Críticos" value={`${ingredients.filter(i => i.currentQty <= i.criticalQty).length} Ítems`} sub="Riesgo de Agotamiento" icon="priority_high" color="bg-red-50 text-red-600" />
            <KPIItem label="Alertas de Stock" value={`${ingredients.filter(i => i.currentQty <= i.minQty).length} Ítems`} sub="Requieren atención" icon="warning" color="bg-amber-50 text-amber-600" />
            <KPIItem label="Categorías Activas" value={`${new Set(ingredients.map(i => i.category)).size} Activas`} sub="En la bodega" icon="inventory_2" color="bg-primary/5 text-primary" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {ingredients.map(ing => (
              <InventoryCard key={ing.id} ingredient={ing} onViewDetails={(i) => { setSelectedIng(i); setEditQty(i.currentQty.toString()); }} />
            ))}
          </div>

          {selectedIng && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-primary/60 backdrop-blur-sm" onClick={() => setSelectedIng(null)}></div>
              <div className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden animate-scaleUp p-8 space-y-6">
                <header className="flex justify-between items-start">
                  <div>
                    <span className="inline-block px-2 py-1 rounded-lg bg-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">{selectedIng.category}</span>
                    <h2 className="text-2xl font-black text-slate-900">{selectedIng.name}</h2>
                    <p className="text-xs text-slate-400 font-bold">{selectedIng.description || 'Sin descripción'}</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-3xl shadow-inner">{selectedIng.icon}</div>
                </header>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Costo Unitario (PMP)</label>
                    <p className="text-lg font-black text-slate-700">${selectedIng.unitPrice.toFixed(4)} <span className="text-[10px] text-slate-400">/ {selectedIng.measureUnit}</span></p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Valor Total Físico</label>
                    <p className="text-lg font-black text-emerald-600">${(selectedIng.currentQty * selectedIng.unitPrice).toFixed(2)}</p>
                  </div>
                </div>
                {branchId !== 'GLOBAL' ? (
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Editar Stock Actual ({selectedIng.measureUnit})</label>
                    <div className="flex gap-2">
                      <input type="number" className="flex-1 px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:border-accent font-bold text-lg text-slate-900" value={editQty} onChange={(e) => setEditQty(e.target.value)} />
                      <button onClick={handleUpdateStock} className="px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm uppercase shadow-lg shadow-primary/20 hover:bg-primary-light transition-all">
                        Ajustar Físico
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 rounded-2xl text-center"><p className="text-sm font-bold text-slate-500">Solo lectura.</p></div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'batches' && (
        <div className="animate-fadeIn bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          {loadingExtras ? <p className="p-8 text-center text-slate-400 font-bold">Cargando lotes...</p> : (
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Lote ID</th>
                  <th className="px-6 py-4">Ingrediente</th>
                  <th className="px-6 py-4">Proveedor</th>
                  <th className="px-6 py-4 text-right">Costo Unit.</th>
                  <th className="px-6 py-4 text-right">Cant. Restante</th>
                  <th className="px-6 py-4 text-right">Expira</th>
                  <th className="px-6 py-4 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {batches.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-3 text-xs font-mono text-slate-400">{b.id.split('-')[0]}</td>
                    <td className="px-6 py-3 font-bold text-slate-900">{b.ingredients?.name}</td>
                    <td className="px-6 py-3 text-xs text-slate-600">{b.suppliers?.name || '-'}</td>
                    <td className="px-6 py-3 text-right font-mono text-xs">${Number(b.unit_cost).toFixed(4)}</td>
                    <td className="px-6 py-3 text-right font-bold text-primary">{b.quantity_remaining}</td>
                    <td className="px-6 py-3 text-right text-xs text-slate-500 font-bold">{b.expiration_date ? new Date(b.expiration_date).toLocaleDateString() : 'N/A'}</td>
                    <td className="px-6 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${b.quantity_remaining > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                        {b.quantity_remaining > 0 ? 'Activo' : 'Agotado'}
                      </span>
                    </td>
                  </tr>
                ))}
                {batches.length === 0 && <tr><td colSpan={7} className="p-8 justify-center text-center text-slate-400 font-bold">No hay lotes registrados</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'expr' && (
        <div className="animate-fadeIn bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          {loadingExtras ? <p className="p-8 text-center text-slate-400 font-bold">Analizando caducidades...</p> : (
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Alerta</th>
                  <th className="px-6 py-4">Lote ID</th>
                  <th className="px-6 py-4">Ingrediente</th>
                  <th className="px-6 py-4 text-right">Expira en (Días)</th>
                  <th className="px-6 py-4 text-right">Mermas en Riesgo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expiringBatches.map(eb => {
                  const isExpired = eb.days_remaining < 0;
                  const isWarning = eb.days_remaining >= 0 && eb.days_remaining <= 3;
                  return (
                    <tr key={eb.batch_id} className={`hover:bg-slate-50/50 ${isExpired ? 'bg-red-50/30' : isWarning ? 'bg-amber-50/30' : ''}`}>
                      <td className="px-6 py-4">
                        {isExpired ? (
                          <span className="flex items-center gap-1 text-red-600 font-bold text-xs"><span className="material-icons-round text-sm">dangerous</span> Caducado</span>
                        ) : isWarning ? (
                          <span className="flex items-center gap-1 text-amber-600 font-bold text-xs"><span className="material-icons-round text-sm">warning</span> Por Caducar</span>
                        ) : (
                          <span className="flex items-center gap-1 text-emerald-600 font-bold text-xs"><span className="material-icons-round text-sm">check_circle</span> Vigente</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-slate-400">{eb.batch_id.split('-')[0]}</td>
                      <td className="px-6 py-4 font-bold text-slate-900">{eb.ingredient_icon} {eb.ingredient_name}</td>
                      <td className={`px-6 py-4 text-right font-black ${isExpired ? 'text-red-500' : isWarning ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {eb.days_remaining} días
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-slate-600">{eb.quantity_remaining} gr/ml</td>
                    </tr>
                  );
                })}
                {expiringBatches.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-400 font-bold">No se detectaron lotes con alertas de caducidad próximas.</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      )}

    </div>
  );
};

export default InventoryView;
