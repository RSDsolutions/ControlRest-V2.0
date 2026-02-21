
import React, { useState } from 'react';
import { Ingredient } from '../types';
import { supabase } from '../supabaseClient';

interface IngredientsViewProps {
  ingredients: Ingredient[];
  setIngredients: React.Dispatch<React.SetStateAction<Ingredient[]>>;
  branchId: string | null;
  restaurantId: string | null;
}

const IngredientsView: React.FC<IngredientsViewProps> = ({ ingredients, setIngredients, branchId, restaurantId }) => {
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showNewIngModal, setShowNewIngModal] = useState(false);
  const [selectedIngId, setSelectedIngId] = useState<string | null>(null);
  const [purchaseQty, setPurchaseQty] = useState(1);
  const [purchaseUnit, setPurchaseUnit] = useState<string>('kg');
  const [purchasePrice, setPurchasePrice] = useState(15.00);

  // Batches
  const [batches, setBatches] = useState<any[]>([]);
  const [viewBatchDetailsIngId, setViewBatchDetailsIngId] = useState<string | null>(null);

  React.useEffect(() => {
    if (branchId && branchId !== 'GLOBAL') {
      supabase.from('inventory_batches')
        .select('*, suppliers(name)')
        .eq('branch_id', branchId)
        .order('expiration_date', { ascending: true })
        .then(({ data }) => setBatches(data || []));
    }
  }, [branchId]);

  // Sync purchase unit when ingredient changes
  React.useEffect(() => {
    if (selectedIngId) {
      const ing = ingredients.find(i => i.id === selectedIngId);
      if (ing) {
        setPurchaseUnit(ing.measureUnit === 'ml' ? 'L' : 'kg');
      }
    }
  }, [selectedIngId, ingredients]);

  const [newIng, setNewIng] = useState({
    name: '',
    category: 'Proteínas (Carnes y Sustitutos)',
    minQty: 1000,
    criticalQty: 500,
    icon: '📦',
    description: '',
    initialQty: 0,
    initialPrice: 0,
    unitType: 'solid' as 'solid' | 'liquid',
    measureUnit: 'gr' as 'gr' | 'kg' | 'lb' | 'ml' | 'L' | 'gal'
  });

  const getBaseUnit = (type: 'solid' | 'liquid') => type === 'solid' ? 'gr' : 'ml';

  const convertToBase = (qty: number, unit: string): number => {
    switch (unit) {
      case 'kg': return qty * 1000;
      case 'lb': return qty * 453.592;
      case 'L': return qty * 1000;
      case 'gal': return qty * 3785.41;
      default: return qty; // gr, ml
    }
  };

  const handleRegisterPurchase = async () => {
    if (!selectedIngId || !branchId) return;
    const ing = ingredients.find(i => i.id === selectedIngId);
    if (!ing) return;

    let addedQty = purchaseQty;
    // Standardize to Base Unit (gr or ml)
    switch (purchaseUnit) {
      case 'kg': addedQty *= 1000; break;
      case 'lb': addedQty *= 453.592; break;
      case 'L': addedQty *= 1000; break;
      case 'gal': addedQty *= 3785.41; break;
      default: break; // gr, ml
    }

    // Weighted Average Calculation
    const oldTotalValue = ing.currentQty * ing.unitPrice;
    const newTotalValue = oldTotalValue + purchasePrice;
    const newTotalQty = ing.currentQty + addedQty;
    const updatedUnitPrice = newTotalQty > 0 ? newTotalValue / newTotalQty : 0;

    try {
      // Update inventory in Supabase
      const { error } = await supabase
        .from('inventory')
        .update({
          quantity_gr: newTotalQty,
          unit_cost_gr: updatedUnitPrice
        })
        .match({ branch_id: branchId, ingredient_id: selectedIngId });

      if (error) throw error;

      // Update local state
      setIngredients(prev => prev.map(i => {
        if (i.id === selectedIngId) {
          return { ...i, currentQty: newTotalQty, unitPrice: updatedUnitPrice };
        }
        return i;
      }));
      setShowPurchaseModal(false);
    } catch (err) {
      console.error('Error updating inventory:', err);
      alert('Error al registrar la compra. Intente nuevamente.');
    }
  };

  // Helper for Modal UI
  const selectedIngredient = ingredients.find(i => i.id === selectedIngId);
  const isLiquidType = selectedIngredient?.measureUnit === 'ml';

  const handleCreateIngredient = async () => {
    if (!newIng.name || !branchId || !restaurantId) {
      if (!newIng.name) alert("Por favor, ingresa el nombre del ingrediente.");
      else if (!branchId) alert("Error: No se ha identificado la sucursal del usuario (branchId missing).");
      else if (!restaurantId) alert("Error: No se ha identificado el identificador del restaurante (restaurantId missing). Reintente iniciando sesión.");
      return;
    }

    const baseQty = convertToBase(newIng.initialQty, newIng.measureUnit);
    const unitPrice = baseQty > 0 ? newIng.initialPrice / baseQty : 0;
    const baseUnit = getBaseUnit(newIng.unitType);

    const payload = {
      name: newIng.name,
      unit_base: baseUnit,
      category: newIng.category,
      description: newIng.description,
      icon: newIng.icon,
      restaurant_id: restaurantId,
      is_active: true
    };

    console.log('Inserting Ingredient Payload:', payload);

    try {
      // 1. Insert into ingredients table
      const { data: ingData, error: ingError } = await supabase
        .from('ingredients')
        .insert([payload])
        .select()
        .single();

      if (ingError) {
        console.error('RLS Error details:', {
          message: ingError.message,
          details: ingError.details,
          hint: ingError.hint,
          code: ingError.code
        });
        throw ingError;
      }

      if (ingData) {
        // 2. Insert into inventory table
        const { error: invError } = await supabase
          .from('inventory')
          .insert({
            ingredient_id: ingData.id,
            branch_id: branchId,
            quantity_gr: baseQty,
            unit_cost_gr: unitPrice,
            min_level_gr: newIng.minQty,
            critical_level_gr: newIng.criticalQty
          });

        if (invError) throw invError;

        // 3. Update local state
        const newIngredient: Ingredient = {
          id: ingData.id,
          name: newIng.name,
          category: newIng.category,
          minQty: newIng.minQty,
          criticalQty: newIng.criticalQty,
          currentQty: baseQty,
          unitPrice: unitPrice,
          icon: newIng.icon,
          description: newIng.description,
          measureUnit: baseUnit as 'gr' | 'ml'
        };

        setIngredients([...ingredients, newIngredient]);
        setShowNewIngModal(false);
        setNewIng({
          name: '',
          category: 'Proteínas (Carnes y Sustitutos)',
          minQty: 1000,
          criticalQty: 500,
          icon: '📦',
          description: '',
          initialQty: 0,
          initialPrice: 0,
          unitType: 'solid',
          measureUnit: 'gr'
        });
      }
    } catch (err: any) {
      console.error('Error creating ingredient:', err);
      alert('Error al crear ingrediente: ' + err.message);
    }
  };

  const handleDeleteIngredient = async (id: string) => {
    const ing = ingredients.find(i => i.id === id);
    if (!ing) return;

    if (ing.currentQty > 0) {
      alert(`No se puede eliminar "${ing.name}" porque todavía tiene stock (${ing.currentQty} ${ing.measureUnit}).`);
      return;
    }

    if (!confirm(`¿Estás seguro de eliminar el ingrediente "${ing.name}"? Esta acción no se puede deshacer.`)) return;

    try {
      // 1. Delete from inventory table first
      const { error: invError } = await supabase
        .from('inventory')
        .delete()
        .match({ ingredient_id: id });

      if (invError) throw invError;

      // 2. Delete from ingredients table
      const { error: ingError } = await supabase
        .from('ingredients')
        .delete()
        .match({ id });

      if (ingError) {
        // Handle foreign key constraint (e.g., used in Plate ingredients)
        if (ingError.code === '23503') {
          throw new Error('Este ingrediente está siendo usado en la receta de algún plato. Elimine la receta primero.');
        }
        throw ingError;
      }

      // 3. Update local state
      setIngredients(prev => prev.filter(i => i.id !== id));
    } catch (err: any) {
      console.error('Error deleting ingredient:', err);
      alert('Error al eliminar ingrediente: ' + err.message);
    }
  };

  return (
    <>
      <div className="p-6 space-y-5 animate-fade-in max-w-[1700px] mx-auto font-sans">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-[8px] shadow-card border border-slate-200">
          <div>
            <h1 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <span className="material-icons-round text-[#136dec] text-xl">inventory_2</span>
              Gestión de Insumos
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">Control de inventario técnico, costeo promedio ponderado y trazabilidad de lotes.</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowNewIngModal(true)}
              className="btn btn-outline flex items-center gap-2"
            >
              <span className="material-icons-round text-[18px]">add</span> Nuevo Insumo
            </button>
            <button
              onClick={() => { setSelectedIngId(ingredients[0]?.id); setShowPurchaseModal(true); }}
              className="btn btn-primary flex items-center gap-2"
            >
              <span className="material-icons-round text-[18px]">shopping_cart</span> Registrar Compra
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <KPIItem
            label="Catálogo Activo"
            value={ingredients.length}
            sub="Items registrados"
            icon="inventory_2"
            color="bg-slate-500"
          />
          <KPIItem
            label="Stock Bajo"
            value={ingredients.filter(i => i.currentQty <= i.minQty).length}
            sub="Requieren reposición"
            icon="warning"
            color="bg-amber-500"
          />
          <KPIItem
            label="Nivel Crítico"
            value={ingredients.filter(i => i.currentQty <= i.criticalQty).length}
            sub="Riesgo de quiebre"
            icon="dangerous"
            color="bg-red-500"
          />
          <KPIItem
            label="Valorización de Stock"
            value={`$${ingredients.reduce((acc, ing) => acc + (ing.currentQty * ing.unitPrice), 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
            sub="Costo total en bodega"
            icon="account_balance_wallet"
            color="bg-emerald-500"
          />
        </div>

        <div className="card p-0 overflow-hidden flex flex-col min-h-[600px] shadow-brand border-slate-200">
          <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-50/50">
            <div className="relative w-full md:w-96 group">
              <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">search</span>
              <input
                type="text"
                placeholder="Filtrar catálogo de insumos..."
                className="input pl-12 bg-white border-slate-200 focus:bg-white shadow-sm"
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white px-3 py-1.5 rounded-lg border border-slate-100 shadow-sm">
                Mostrando {ingredients.length} items
              </span>
            </div>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest sticky top-0 z-10 border-b border-slate-100">
                <tr>
                  <th className="px-8 py-5">Insumo / Descripción</th>
                  <th className="px-8 py-5">Categoría</th>
                  <th className="px-8 py-5 text-right">Existencias</th>
                  <th className="px-8 py-5 text-right">Costo Promedio</th>
                  <th className="px-8 py-5 text-right">Lotes</th>
                  <th className="px-8 py-5 text-center">Estado Auditoría</th>
                  <th className="px-8 py-5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ingredients.map(ing => {
                  let status = 'Suficiente';
                  let statusColor = 'bg-emerald-50 text-emerald-600 border-emerald-100';
                  if (ing.currentQty <= ing.criticalQty) {
                    status = 'Crítico';
                    statusColor = 'bg-red-50 text-red-600 border-red-100';
                  } else if (ing.currentQty <= ing.minQty) {
                    status = 'Reorden';
                    statusColor = 'bg-amber-50 text-amber-600 border-amber-100';
                  }
                  const unitLabel = ing.measureUnit === 'ml' ? 'ml' : 'gr';
                  const lotCount = batches.filter(b => b.ingredient_id === ing.id && b.quantity_remaining > 0).length;
                  const expiringSoon = batches.filter(b => b.ingredient_id === ing.id && b.quantity_remaining > 0 && b.expiration_status === 'expiring').length;

                  return (
                    <tr key={ing.id} className="hover:bg-slate-50/50 transition-all group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-3xl transition-transform group-hover:scale-110 duration-300">
                            {ing.icon}
                          </div>
                          <div>
                            <p className="font-heading font-black text-brand-black text-sm uppercase tracking-tight leading-tight">{ing.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 line-clamp-1">
                              {ing.description || `SKU: ${ing.id.split('-')[0]}`}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest bg-slate-100/50 px-2 py-1 rounded-md">
                          {ing.category}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-heading font-black text-brand-black text-sm">
                            {ing.currentQty.toLocaleString()} {unitLabel}
                          </span>
                          <div className="w-20 h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                            <div
                              className={`h-full transition-all duration-1000 ${status === 'Crítico' ? 'bg-red-500' : status === 'Reorden' ? 'bg-amber-500' : 'bg-emerald-500'}`}
                              style={{ width: `${Math.min(100, (ing.currentQty / (ing.minQty * 2)) * 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <p className="text-xs font-black text-primary">${ing.unitPrice.toFixed(4)}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">u/{unitLabel}</p>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="flex flex-col items-end">
                            <span className="text-sm font-black text-brand-black">{lotCount}</span>
                            {expiringSoon > 0 && <span className="text-[9px] text-amber-600 font-bold uppercase tracking-tighter">! {expiringSoon} x Expira</span>}
                          </div>
                          <button onClick={() => setViewBatchDetailsIngId(ing.id)} className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 hover:text-primary hover:bg-white hover:shadow-sm transition-all flex items-center justify-center">
                            <span className="material-icons-round text-lg">history</span>
                          </button>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <span className={`inline-flex px-3 py-1.5 rounded-full text-[9px] font-black border tracking-widest ${statusColor}`}>
                          {status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => { setSelectedIngId(ing.id); setShowPurchaseModal(true); }}
                            className="w-10 h-10 rounded-xl bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all shadow-none flex items-center justify-center group/btn"
                            title="Registrar Compra"
                          >
                            <span className="material-icons-round text-xl transition-transform group-hover/btn:scale-110">add_shopping_cart</span>
                          </button>
                          <button
                            onClick={() => handleDeleteIngredient(ing.id)}
                            disabled={ing.currentQty > 0}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${ing.currentQty > 0
                              ? 'bg-slate-50 text-slate-200 cursor-not-allowed opacity-50'
                              : 'bg-red-50 text-red-400 hover:bg-red-500 hover:text-white'
                              }`}
                            title={ing.currentQty > 0 ? "Bloqueado: Stock detectado" : "Eliminar Insumo"}
                          >
                            <span className="material-icons-round text-xl">delete_outline</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showNewIngModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-3xl p-0 overflow-hidden flex flex-col max-h-[90vh]">
            <header className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <div>
                <h3 className="font-heading font-black text-2xl text-brand-black tracking-tight">Alta de Insumo Maestro</h3>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Configuración técnica de almacén</p>
              </div>
              <button onClick={() => setShowNewIngModal(false)} className="w-10 h-10 rounded-full hover:bg-slate-50 flex items-center justify-center text-slate-400 transition-colors border border-slate-100">
                <span className="material-icons-round">close</span>
              </button>
            </header>

            <div className="p-10 space-y-10 flex-1 overflow-y-auto custom-scrollbar">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="col-span-1 md:col-span-2">
                  <label className="label">Nombre Descriptivo</label>
                  <input type="text" className="input font-bold" placeholder="Ej. Lomo Alto de Res (Angus)" value={newIng.name} onChange={e => setNewIng({ ...newIng, name: e.target.value })} />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="label">Categoría del Insumo</label>
                  <select className="input font-bold" value={newIng.category} onChange={e => setNewIng({ ...newIng, category: e.target.value })}>
                    <option>Proteínas (Carnes y Sustitutos)</option>
                    <option>Verduras y Hortalizas</option>
                    <option>Cereales y Harinas</option>
                    <option>Lácteos</option>
                    <option>Grasas y Aceites</option>
                    <option>Condimentos y Especias</option>
                    <option>Salsas y Bases</option>
                    <option>Azúcares y Endulzantes</option>
                    <option>Frutas</option>
                    <option>Bebidas Base y Otros</option>
                  </select>
                </div>
              </div>

              <div className="space-y-6">
                <h4 className="font-heading font-black text-brand-black text-[11px] uppercase tracking-widest flex items-center gap-2">
                  <span className="material-icons-round text-primary text-lg">straighten</span> Unidades y Costeo Inicial
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50 p-8 rounded-3xl border border-slate-100 shadow-inner">
                  <div className="space-y-3">
                    <label className="label">Estado Físico</label>
                    <div className="flex gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
                      <button onClick={() => setNewIng({ ...newIng, unitType: 'solid', measureUnit: 'kg' })} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${newIng.unitType === 'solid' ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>Sólido</button>
                      <button onClick={() => setNewIng({ ...newIng, unitType: 'liquid', measureUnit: 'L' })} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${newIng.unitType === 'liquid' ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>Líquido</button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="label">Unidad de Gestión</label>
                    <select className="input font-black" value={newIng.measureUnit} onChange={e => setNewIng({ ...newIng, measureUnit: e.target.value as any })}>
                      {newIng.unitType === 'solid' ? (
                        <>
                          <option value="kg">Kilogramos (kg)</option>
                          <option value="lb">Libras (lb)</option>
                          <option value="gr">Gramos (gr)</option>
                        </>
                      ) : (
                        <>
                          <option value="L">Litros (L)</option>
                          <option value="gal">Galones (gal)</option>
                          <option value="ml">Mililitros (ml)</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="label">Cantidad Apertura</label>
                    <input type="number" className="input font-black text-lg" placeholder="0" value={newIng.initialQty || ''} onChange={e => setNewIng({ ...newIng, initialQty: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div className="space-y-2">
                    <label className="label">Valor factura (USD)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                      <input type="number" className="input pl-8 font-black text-lg text-emerald-600" placeholder="0.00" value={newIng.initialPrice || ''} onChange={e => setNewIng({ ...newIng, initialPrice: parseFloat(e.target.value) || 0 })} />
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-center justify-between">
                  <span className="text-[10px] font-black text-primary/60 uppercase tracking-widest">Costo Técnico x {getBaseUnit(newIng.unitType)}</span>
                  <span className="text-sm font-black text-primary">
                    ${newIng.initialQty > 0 ? (newIng.initialPrice / convertToBase(newIng.initialQty, newIng.measureUnit)).toFixed(5) : '0.00000'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="label">Stock de Seguridad ({getBaseUnit(newIng.unitType)})</label>
                  <input type="number" className="input font-bold" value={newIng.minQty} onChange={e => setNewIng({ ...newIng, minQty: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="space-y-2">
                  <label className="label">Alerta Crítica ({getBaseUnit(newIng.unitType)})</label>
                  <input type="number" className="input font-bold border-red-100 bg-red-50/20 text-red-600" value={newIng.criticalQty} onChange={e => setNewIng({ ...newIng, criticalQty: parseInt(e.target.value) || 0 })} />
                </div>
              </div>
            </div>

            <footer className="px-10 py-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-4 shrink-0 shadow-[0_-10px_30px_rgba(0,0,0,0.02)]">
              <button onClick={() => setShowNewIngModal(false)} className="btn btn-outline px-8 py-3 text-[10px] font-black uppercase tracking-widest">Cancelar</button>
              <button onClick={handleCreateIngredient} className="btn btn-primary px-10 py-3 text-[10px] font-black uppercase tracking-widest shadow-primary/20">Registrar en Almacén</button>
            </footer>
          </div>
        </div>
      )}

      {showPurchaseModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-lg p-0 overflow-hidden border border-slate-100 flex flex-col max-h-[90vh] shadow-[0_40px_100px_rgba(0,0,0,0.15)]">
            <header className="px-10 py-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30">
                  <span className="material-icons-round text-2xl">shopping_cart</span>
                </div>
                <div>
                  <h3 className="font-heading font-black text-2xl text-brand-black tracking-tight">Ingreso de Compra</h3>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">Actualización de Stock Maestro</p>
                </div>
              </div>
              <button onClick={() => setShowPurchaseModal(false)} className="w-10 h-10 rounded-full hover:bg-white flex items-center justify-center text-slate-400 transition-colors border border-slate-100">
                <span className="material-icons-round">close</span>
              </button>
            </header>

            <div className="p-10 space-y-10 flex-1 overflow-y-auto custom-scrollbar">
              <div className="space-y-3">
                <label className="label">Insumo a Reponer</label>
                <select className="input font-black text-sm uppercase tracking-tight h-14" value={selectedIngId || ''} onChange={e => {
                  const newId = e.target.value;
                  setSelectedIngId(newId);
                  const newIng = ingredients.find(i => i.id === newId);
                  if (newIng?.measureUnit === 'ml') setPurchaseUnit('L');
                  else setPurchaseUnit('kg');
                }}>
                  {ingredients.map(ing => <option key={ing.id} value={ing.id}>{ing.icon} {ing.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="label">Cantidad Comprada</label>
                  <input type="number" className="input font-black text-lg h-14" value={purchaseQty} onChange={e => setPurchaseQty(parseFloat(e.target.value) || 0)} />
                </div>
                <div className="space-y-3">
                  <label className="label">Unidad Medida</label>
                  <select className="input font-black text-xs uppercase h-14" value={purchaseUnit} onChange={e => setPurchaseUnit(e.target.value as any)}>
                    {isLiquidType ? (
                      <>
                        <option value="L">Litros (L)</option>
                        <option value="gal">Galones (gal)</option>
                        <option value="ml">Mililitros (ml)</option>
                      </>
                    ) : (
                      <>
                        <option value="kg">Kilogramos (kg)</option>
                        <option value="lb">Libras (lb)</option>
                        <option value="gr">Gramos (gr)</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div className="p-6 bg-emerald-50 border-[3px] border-emerald-100 rounded-3xl flex items-center gap-6 shadow-sm">
                <div className="w-14 h-14 shrink-0 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg"><span className="material-icons-round text-2xl">scale</span></div>
                <div>
                  <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest mb-1 leading-none">Neto Entrante</p>
                  <p className="text-xl font-heading font-black text-brand-black leading-tight">
                    {(() => {
                      let val = purchaseQty;
                      if (purchaseUnit === 'kg' || purchaseUnit === 'L') val *= 1000;
                      else if (purchaseUnit === 'lb') val *= 453.592;
                      else if (purchaseUnit === 'gal') val *= 3785.41;
                      return val.toLocaleString(undefined, { maximumFractionDigits: 0 });
                    })()} {isLiquidType ? 'ml' : 'gr'}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <label className="label">Total Inversión Bruta (USD)</label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-400 text-2xl">$</span>
                  <input type="number" className="input pl-12 h-20 text-4xl font-heading font-black text-primary border-slate-200" value={purchasePrice} onChange={e => setPurchasePrice(parseFloat(e.target.value) || 0)} />
                </div>
              </div>
            </div>

            <footer className="px-10 py-10 bg-slate-50 border-t border-slate-100 flex justify-end gap-4 shrink-0">
              <button onClick={() => setShowPurchaseModal(false)} className="btn btn-outline px-8 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Descartar</button>
              <button onClick={handleRegisterPurchase} className="btn btn-primary px-10 py-3 text-[10px] font-black uppercase tracking-widest shadow-primary/30">Confirmar Ingreso</button>
            </footer>
          </div>
        </div>
      )}

      {viewBatchDetailsIngId && (
        <div className="modal-overlay">
          <div className="absolute right-0 top-0 h-full w-full md:w-[600px] bg-white shadow-2xl animate-fade-in p-0 flex flex-col border-l border-slate-100">
            <header className="px-10 py-10 border-b border-slate-100 bg-white sticky top-0 z-20 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-heading font-black text-brand-black tracking-tight">Kardex de Lotes en Almacén</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                  Insumo: {ingredients.find(i => i.id === viewBatchDetailsIngId)?.name}
                </p>
              </div>
              <button onClick={() => setViewBatchDetailsIngId(null)} className="w-12 h-12 rounded-full border border-slate-100 hover:bg-slate-50 text-slate-400 transition-colors flex items-center justify-center">
                <span className="material-icons-round text-2xl">close</span>
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-10 space-y-6 custom-scrollbar bg-slate-50/30">
              {(() => {
                const ingBatches = batches.filter(b => b.ingredient_id === viewBatchDetailsIngId);
                if (ingBatches.length === 0) return (
                  <div className="py-20 text-center space-y-4">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto border border-slate-200">
                      <span className="material-icons-round text-slate-300 text-4xl">inventory</span>
                    </div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No se detectan lotes vigentes para este insumo</p>
                  </div>
                );

                return ingBatches.map(b => (
                  <div key={b.id} className="card p-8 group relative hover:shadow-xl transition-all border-slate-200">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-3">
                        <span className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500 uppercase">Lot</span>
                        <div>
                          <p className="text-sm font-black text-brand-black uppercase tracking-tight">#{b.id.split('-')[0]}</p>
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${b.quantity_remaining > 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                            {b.quantity_remaining > 0 ? 'En Existencias' : 'Agotado'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Costo Unit.</p>
                        <p className="text-lg font-black text-primary">${Number(b.unit_cost).toFixed(4)}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Proveedor</p>
                        <p className="text-xs font-bold text-brand-black">{b.suppliers?.name || 'Distribución Global'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Fecha de Caducidad</p>
                        {b.expiration_date ? (
                          <p className={`text-xs font-black ${b.expiration_status === 'expired' ? 'text-red-500' : b.expiration_status === 'expiring' ? 'text-amber-600' : 'text-emerald-500'}`}>
                            {new Date(b.expiration_date).toLocaleDateString()}
                          </p>
                        ) : <p className="text-xs text-slate-400">Sin vigencia</p>}
                      </div>
                    </div>

                    <div className="mt-6 flex justify-between items-center">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Saldo Restante</p>
                        <p className="text-2xl font-heading font-black text-brand-black">{b.quantity_remaining.toLocaleString()} gr</p>
                      </div>
                      <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: '100%' }}></div>
                      </div>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const KPIItem = ({ label, value, sub, icon, color }: any) => (
  <div className="card p-6 flex flex-col justify-between h-36 relative overflow-hidden group">
    <div className={`absolute -right-4 -top-4 w-24 h-24 ${color} opacity-10 rounded-full blur-2xl transition-all group-hover:scale-150`}></div>
    <div className="relative z-10 flex justify-between items-start">
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <h3 className="text-3xl font-heading font-black text-brand-black tracking-tighter">{value}</h3>
      </div>
      <div className={`w-10 h-10 rounded-xl ${color} bg-opacity-10 flex items-center justify-center`}>
        <span className={`material-icons-round text-xl ${color.replace('bg-', 'text-')}`}>{icon}</span>
      </div>
    </div>
    <div className="relative z-10">
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> {sub}
      </p>
    </div>
  </div>
);

export default IngredientsView;
