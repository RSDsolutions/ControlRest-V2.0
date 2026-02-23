import React, { useState, useEffect, useCallback } from 'react';
import { Ingredient } from '../types';
import { supabase } from '../supabaseClient';
import { usePlanFeatures, isFeatureEnabled } from '../hooks/usePlanFeatures';
import PlanUpgradeFullPage from '../components/PlanUpgradeFullPage';

interface InventoryViewProps {
  ingredients: Ingredient[];
  setIngredients: React.Dispatch<React.SetStateAction<Ingredient[]>>;
  branchId: string | null;
  restaurantId?: string | null;
}

const KPIItem = ({ label, value, sub, icon, color }: any) => (
  <div className="card p-6 flex flex-col justify-between h-36 relative overflow-hidden group">
    <div className={`absolute -right-4 -top-4 w-24 h-24 ${color.split(' ')[0]} opacity-10 rounded-full blur-2xl transition-all group-hover:scale-150`}></div>
    <div className="relative z-10">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${color}`}>
        <span className="material-icons-round text-xl">{icon}</span>
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <h3 className="text-3xl font-heading font-black text-brand-black mt-1 tracking-tight">{value}</h3>
    </div>
    <p className="text-[10px] font-bold text-slate-400 mt-2 flex items-center gap-1 uppercase tracking-tight">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span> {sub}
    </p>
  </div>
);

const InventoryCard: React.FC<{ ingredient: Ingredient; onViewDetails: (ing: Ingredient) => void }> = ({ ingredient, onViewDetails }) => {
  const percentage = (ingredient.currentQty / (ingredient.minQty * 2)) * 100;
  const isCritical = ingredient.currentQty <= ingredient.criticalQty;
  const isLow = ingredient.currentQty <= ingredient.minQty;

  let statusText = 'Nivel Óptimo';
  let colorClass = 'text-primary';
  let iconName = 'check_circle';

  if (isCritical) {
    statusText = 'Stock Crítico';
    colorClass = 'text-red-500';
    iconName = 'error_outline';
  } else if (isLow) {
    statusText = 'Stock Bajo';
    colorClass = 'text-amber-500';
    iconName = 'info';
  }

  return (
    <div className="card p-6 group flex flex-col gap-6">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <span className="inline-block px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.1em] bg-slate-100 text-slate-500">{ingredient.category}</span>
          <h3 className="font-heading font-black text-xl text-brand-black leading-tight tracking-tight mt-2">{ingredient.name}</h3>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">
          {ingredient.icon}
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative w-20 h-20 flex-shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="16" fill="transparent" stroke="#f1f5f9" strokeWidth="3" />
            <circle cx="18" cy="18" r="16" fill="transparent" stroke="currentColor" strokeWidth="4"
              className={`${colorClass} transition-all duration-1000`}
              strokeDasharray={`${Math.min(percentage, 100)}, 100`}
              strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-xs font-black ${colorClass}`}>{Math.round(percentage)}%</span>
          </div>
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-heading font-black text-brand-black tracking-tighter">{ingredient.currentQty.toLocaleString()}</span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{ingredient.measureUnit}</span>
          </div>
          <div className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest ${colorClass}`}>
            <span className="material-icons-round text-[14px]">{iconName}</span>
            {statusText}
          </div>
        </div>
      </div>

      <div className="pt-5 border-t border-slate-50 flex justify-between items-center">
        <div className="flex flex-col">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Mínimo Requerido</span>
          <span className="text-xs font-bold text-brand-black">{ingredient.minQty} <span className="text-[10px] text-slate-400">{ingredient.measureUnit}</span></span>
        </div>
        <button onClick={() => onViewDetails(ingredient)} className="btn btn-ghost px-3 py-2 text-[10px] group/btn">
          DETALLES <span className="material-icons-round text-sm ml-1 group-hover/btn:translate-x-1 transition-transform">arrow_forward</span>
        </button>
      </div>
    </div>
  );
};

const InventoryView: React.FC<InventoryViewProps> = ({ ingredients, setIngredients, branchId, restaurantId }) => {
  const [activeTab, setActiveTab] = useState<'stock' | 'batches' | 'expiration'>('stock');

  // Tab 1: Stock
  const [selectedIng, setSelectedIng] = useState<Ingredient | null>(null);
  const [editQty, setEditQty] = useState<string>('');

  // Tab 2 & 3: Batches & Expiration
  const [batches, setBatches] = useState<any[]>([]);
  const [expiringBatches, setExpiringBatches] = useState<any[]>([]);
  const [loadingExtras, setLoadingExtras] = useState(false);

  const { data: planData } = usePlanFeatures(restaurantId || undefined);
  const isPlanOperativo = !isFeatureEnabled(planData, 'ENABLE_NET_PROFIT_CALCULATION');

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

  if (isPlanOperativo) {
    return <PlanUpgradeFullPage featureName="Gestión de Inventario Avanzada" description="El control detallado de inventario, trazabilidad FIFO y gestión de caducidades están disponibles en planes superiores. Optimiza tu stock y evita mermas con nuestras herramientas profesionales." />;
  }

  return (
    <>
      <div className="p-6 space-y-6 animate-fade-in max-w-[1600px] mx-auto font-sans">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-[8px] shadow-card border border-slate-200">
          <div>
            <h1 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <span className="material-icons-round text-[#136dec] text-xl">inventory_2</span>
              Centro Logístico
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">Gestión avanzada de existencias, trazabilidad por lotes y caducidades.</p>
          </div>
          <div className="flex bg-slate-100 p-0.5 rounded-[8px] border border-slate-200">
            <button onClick={() => setActiveTab('stock')} className={`px-4 py-1.5 rounded-[6px] font-semibold text-xs uppercase tracking-wider transition-all ${activeTab === 'stock' ? 'bg-white shadow-sm text-[#136dec]' : 'text-slate-500 hover:text-[#136dec]'}`}>Existencias</button>
            <button onClick={() => setActiveTab('batches')} className={`px-4 py-1.5 rounded-[6px] font-semibold text-xs uppercase tracking-wider transition-all ${activeTab === 'batches' ? 'bg-white shadow-sm text-[#136dec]' : 'text-slate-500 hover:text-[#136dec]'}`}>Trazabilidad</button>
            <button onClick={() => setActiveTab('expr')} className={`px-4 py-1.5 rounded-[6px] font-semibold text-xs uppercase tracking-wider transition-all ${activeTab === 'expr' ? 'bg-white shadow-sm text-[#136dec]' : 'text-slate-500 hover:text-[#136dec]'}`}>Caducidades</button>
          </div>
        </header>

        {activeTab === 'stock' && (
          <div className="animate-fade-in space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <KPIItem label="Valoración de Almacén" value={`$${ingredients.reduce((acc, i) => acc + (i.currentQty * i.unitPrice), 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`} sub="Capital Inmovilizado" icon="account_balance_wallet" color="bg-emerald-50 text-emerald-600" />
              <KPIItem label="Items en Quiebre" value={`${ingredients.filter(i => i.currentQty <= i.criticalQty).length} Ítems`} sub="Riesgo Operativo" icon="history_edu" color="bg-red-50 text-red-600" />
              <KPIItem label="Reposición Pendiente" value={`${ingredients.filter(i => i.currentQty <= i.minQty).length} Ítems`} sub="Bajo Nivel Mínimo" icon="pending_actions" color="bg-amber-50 text-amber-600" />
              <KPIItem label="Tipos de Insumos" value={`${new Set(ingredients.map(i => i.category)).size} Categorías`} sub="Diversidad de Stock" icon="category" color="bg-primary/5 text-primary" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {ingredients.map(ing => (
                <InventoryCard key={ing.id} ingredient={ing} onViewDetails={(i) => { setSelectedIng(i); setEditQty(i.currentQty.toString()); }} />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'batches' && (
          <div className="animate-fade-in card overflow-hidden p-0 border-slate-200">
            <div className="p-8 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-heading font-black text-xl text-brand-black tracking-tight">Histórico de Ingresos y Lotes</h3>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Flujo FIFO Activo
              </div>
            </div>
            {loadingExtras ? (
              <div className="p-20 text-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary mx-auto"></div>
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Auditando Trazabilidad...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <tr>
                      <th className="px-8 py-5">Identificador</th>
                      <th className="px-8 py-5">Insumo</th>
                      <th className="px-8 py-5">Origen / Proveedor</th>
                      <th className="px-8 py-5 text-right">Coste Ingreso</th>
                      <th className="px-8 py-5 text-right">Existencia</th>
                      <th className="px-8 py-5 text-right">Vencimiento</th>
                      <th className="px-8 py-5 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {batches.map(b => (
                      <tr key={b.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-4 text-xs font-mono text-slate-400 group-hover:text-primary transition-colors">#{b.id.split('-')[0]}</td>
                        <td className="px-8 py-4 font-bold text-brand-black">{b.ingredients?.name}</td>
                        <td className="px-8 py-4 text-xs font-medium text-slate-600">{b.suppliers?.name || 'ENTRADA DIRECTA'}</td>
                        <td className="px-8 py-4 text-right font-mono text-xs font-bold text-slate-500">${Number(b.unit_cost).toFixed(4)}</td>
                        <td className="px-8 py-4 text-right font-black text-primary">{b.quantity_remaining}</td>
                        <td className="px-8 py-4 text-right text-xs text-slate-500 font-black">{b.expiration_date ? new Date(b.expiration_date).toLocaleDateString() : 'PERECEDERO'}</td>
                        <td className="px-8 py-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${b.quantity_remaining > 0 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>
                            {b.quantity_remaining > 0 ? 'Disponible' : 'Agotado'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {batches.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-20 text-center">
                          <span className="material-icons-round text-slate-200 text-6xl mb-4">inventory_2</span>
                          <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No se han registrado movimientos de lotes</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'expr' && (
          <div className="animate-fade-in card overflow-hidden p-0 border-slate-200">
            <div className="p-8 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-heading font-black text-xl text-brand-black tracking-tight">Gestión de Riesgo Sanitario</h3>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase text-red-500 tracking-widest">
                <span className="material-icons-round text-sm">notification_important</span> Alertas Críticas Activas
              </div>
            </div>
            {loadingExtras ? (
              <div className="p-20 text-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-red-500 mx-auto"></div>
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Analizando ciclo de vida...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <tr>
                      <th className="px-8 py-5">Estado de Riesgo</th>
                      <th className="px-8 py-5">Lote ID</th>
                      <th className="px-8 py-5">Ingrediente</th>
                      <th className="px-8 py-5 text-right">Tiempo Restante</th>
                      <th className="px-8 py-5 text-right">Mermas en Riesgo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {expiringBatches.map(eb => {
                      const isExpired = eb.days_remaining < 0;
                      const isWarning = eb.days_remaining >= 0 && eb.days_remaining <= 3;
                      return (
                        <tr key={eb.batch_id} className={`hover:bg-slate-50/50 transition-colors ${isExpired ? 'bg-red-50/20' : isWarning ? 'bg-amber-50/20' : ''}`}>
                          <td className="px-8 py-5">
                            {isExpired ? (
                              <div className="flex items-center gap-2 text-red-600 font-black text-[10px] uppercase tracking-widest">
                                <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></div> CADUCADO
                              </div>
                            ) : isWarning ? (
                              <div className="flex items-center gap-2 text-amber-600 font-black text-[10px] uppercase tracking-widest">
                                <span className="material-icons-round text-sm">warning</span> RIESGO ALTO
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase tracking-widest">
                                <span className="material-icons-round text-sm">check_circle</span> VIGENTE
                              </div>
                            )}
                          </td>
                          <td className="px-8 py-5 text-xs font-mono text-slate-400">#{eb.batch_id.split('-')[0]}</td>
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{eb.ingredient_icon}</span>
                              <span className="font-bold text-brand-black">{eb.ingredient_name}</span>
                            </div>
                          </td>
                          <td className={`px-8 py-5 text-right font-heading font-black text-xl tracking-tighter ${isExpired ? 'text-red-600' : isWarning ? 'text-amber-500' : 'text-emerald-500'}`}>
                            {eb.days_remaining} <span className="text-[10px] font-black uppercase tracking-widest ml-1">Días</span>
                          </td>
                          <td className="px-8 py-5 text-right font-black text-brand-black tracking-tight">{eb.quantity_remaining} <span className="text-[10px] text-slate-400 font-bold uppercase">GR/ML</span></td>
                        </tr>
                      );
                    })}
                    {expiringBatches.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-24 text-center">
                          <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="material-icons-round text-3xl">verified_user</span>
                          </div>
                          <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No se detectaron riesgos de caducidad en el inventario actual</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Standardized Inventory Modal — Outside the animated div to ensure viewport fixed positioning */}
      {selectedIng && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-[4px] animate-fade-in">
          <div className="relative bg-white w-full max-w-lg rounded-3xl border border-slate-200 shadow-2xl animate-fade-in flex flex-col max-h-[90vh] overflow-hidden">
            <header className="p-8 border-b border-slate-100 flex justify-between items-start bg-slate-50/50 relative">
              <div className="flex gap-5">
                <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-4xl shadow-md transform -rotate-3 hover:rotate-0 transition-transform">{selectedIng.icon}</div>
                <div className="space-y-1.5 pt-1">
                  <span className="inline-block px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-primary/10 text-primary border border-primary/20">{selectedIng.category}</span>
                  <h2 className="text-2xl font-heading font-black text-brand-black tracking-tight leading-tight">{selectedIng.name}</h2>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{selectedIng.description || 'Sin especificaciones técnicas'}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedIng(null)}
                className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-400 hover:text-primary hover:border-primary transition-all shadow-sm"
              >
                <span className="material-icons-round text-xl">close</span>
              </button>
            </header>

            <div className="p-8 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
              <div className="grid grid-cols-2 gap-6">
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Coste Unitario Promedio</label>
                  <p className="text-xl font-heading font-black text-brand-black tracking-tighter">${selectedIng.unitPrice.toFixed(4)} <span className="text-xs font-bold text-slate-400">/ {selectedIng.measureUnit}</span></p>
                </div>
                <div className="p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                  <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block mb-2">Valoración en Bodega</label>
                  <p className="text-xl font-heading font-black text-emerald-600 tracking-tighter">${(selectedIng.currentQty * selectedIng.unitPrice).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>

              {branchId !== 'GLOBAL' ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="label font-black text-slate-500 text-[11px] uppercase tracking-widest">Ajuste Manual de Existencias ({selectedIng.measureUnit})</label>
                    <input type="number" className="input text-2xl font-black py-4 border-slate-200 bg-slate-50/50 focus:bg-white transition-all shadow-inner" value={editQty} onChange={(e) => setEditQty(e.target.value)} placeholder="0.00" />
                  </div>
                  <button onClick={handleUpdateStock} className="btn btn-primary w-full py-4 text-sm shadow-xl shadow-primary/20 uppercase tracking-[0.2em] font-black">
                    Sincronizar Inventario Físico
                  </button>
                </div>
              ) : (
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                  <span className="material-icons-round text-slate-300 text-4xl mb-2">lock_outline</span>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Acceso Restringido en Vista Global</p>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end bg-slate-50/50">
              <button
                onClick={() => setSelectedIng(null)}
                className="btn bg-white border border-slate-200 text-[#136dec] hover:bg-slate-50 transition-all px-10 py-3 rounded-full shadow-lg shadow-slate-100 font-bold"
              >
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default InventoryView;
