
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
    <div className="p-8 space-y-8 animate-fadeIn">
      {/* Header and Stats ... */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Gestión de Ingredientes</h1>
          <p className="text-slate-500 mt-1">Controla costos por gramo/ml y niveles de stock con precisión financiera.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowNewIngModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-bold text-sm shadow-sm active:scale-95"
          >
            <span className="material-icons-round text-accent">add</span> Nuevo Ingrediente
          </button>
          <button
            onClick={() => { setSelectedIngId(ingredients[0]?.id); setShowPurchaseModal(true); }}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-light transition-all font-bold text-sm shadow-lg shadow-primary/20 active:scale-95"
          >
            <span className="material-icons-round">shopping_cart</span> Registrar Compra
          </button>
        </div>
      </header>

      {/* Grid Stats here (omitted for brevity in replace, but keeping structure if not replaced) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total Ítems" value={ingredients.length} color="text-slate-900" />
        <StatCard label="Stock Bajo" value={ingredients.filter(i => i.currentQty <= i.minQty).length} color="text-amber-500" />
        <StatCard label="Críticos" value={ingredients.filter(i => i.currentQty <= i.criticalQty).length} color="text-red-500" />
        <StatCard label="Valor Est." value={`$${ingredients.reduce((acc, ing) => acc + (ing.currentQty * ing.unitPrice), 0).toFixed(2)}`} color="text-slate-900" />
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        {/* Table Header and Search */}
        <div className="p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/30">
          <div className="relative w-full md:w-80">
            <span className="material-icons-round absolute left-3 top-2.5 text-slate-400 text-lg">search</span>
            <input type="text" placeholder="Buscar ingrediente..." className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border-2 border-slate-100 rounded-xl focus:border-accent focus:ring-0 transition-all" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest sticky top-0 z-10 border-b border-slate-100">
              <tr>
                <th className="px-6 py-5">Ingrediente</th>
                <th className="px-6 py-5">Categoría</th>
                <th className="px-6 py-5 text-right">Stock</th>
                <th className="px-6 py-5 text-right">Costo Base</th>
                <th className="px-6 py-5 text-center">Salud Stock</th>
                <th className="px-6 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ingredients.map(ing => {
                let status = 'Normal';
                let statusColor = 'bg-emerald-100 text-emerald-700 border-emerald-200';
                if (ing.currentQty <= ing.criticalQty) {
                  status = 'Crítico';
                  statusColor = 'bg-red-100 text-red-700 border-red-200';
                } else if (ing.currentQty <= ing.minQty) {
                  status = 'Bajo';
                  statusColor = 'bg-amber-100 text-amber-700 border-amber-200';
                }
                const unitLabel = ing.measureUnit === 'ml' ? 'ml' : 'gr';
                return (
                  <tr key={ing.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-2xl shadow-inner group-hover:bg-white group-hover:shadow-sm transition-all">{ing.icon}</div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm uppercase tracking-tight">{ing.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono tracking-widest line-clamp-1">{ing.description || `ID: #ING-${ing.id}`}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 font-black uppercase tracking-widest">{ing.category}</td>
                    <td className="px-6 py-4 text-right font-black text-slate-800 font-mono text-sm">{ing.currentQty.toLocaleString()} {unitLabel}</td>
                    <td className="px-6 py-4 text-right text-xs font-mono text-slate-400 font-bold">${ing.unitPrice.toFixed(4)} / {unitLabel}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black border-2 tracking-widest ${statusColor}`}>{status.toUpperCase()}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => { setSelectedIngId(ing.id); setShowPurchaseModal(true); }}
                          className="p-2 text-slate-300 hover:text-primary hover:bg-white rounded-xl transition-all active:scale-95 shadow-none hover:shadow-sm"
                          title="Registrar Compra"
                        >
                          <span className="material-icons-round text-xl">add_shopping_cart</span>
                        </button>
                        <button
                          onClick={() => handleDeleteIngredient(ing.id)}
                          disabled={ing.currentQty > 0}
                          className={`p-2 rounded-xl transition-all active:scale-95 shadow-none hover:shadow-sm ${ing.currentQty > 0
                            ? 'text-slate-100 cursor-not-allowed'
                            : 'text-slate-300 hover:text-red-500 hover:bg-white'
                            }`}
                          title={ing.currentQty > 0 ? "No se puede eliminar con stock" : "Eliminar Ingrediente"}
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

      {showNewIngModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-primary/60 backdrop-blur-sm" onClick={() => setShowNewIngModal(false)}></div>
          <div className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden animate-scaleUp overflow-y-auto max-h-[90vh]">
            <header className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-black text-xl text-primary">Nuevo Ingrediente / Insumo</h3>
              <button onClick={() => setShowNewIngModal(false)} className="text-slate-400 hover:text-red-500 transition-colors"><span className="material-icons-round">close</span></button>
            </header>
            <div className="p-8 space-y-6">

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nombre del Producto</label>
                  <input type="text" className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-accent focus:bg-white rounded-2xl transition-all font-bold text-slate-800" placeholder="Ej. Harina de Trigo" value={newIng.name} onChange={e => setNewIng({ ...newIng, name: e.target.value })} />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Categoría</label>
                  <select className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-accent focus:bg-white rounded-2xl transition-all font-bold text-sm text-slate-800" value={newIng.category} onChange={e => setNewIng({ ...newIng, category: e.target.value })}>
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
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Descripción</label>
                  <textarea className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-accent focus:bg-white rounded-2xl transition-all text-sm" placeholder="Detalles adicionales, marca o proveedor..." value={newIng.description} onChange={e => setNewIng({ ...newIng, description: e.target.value })} rows={2}></textarea>
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Configuration: Unit Type & Initial Stock */}
              <div>
                <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <span className="material-icons-round text-accent">scale</span> Configuración de Medida
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tipo de Medida</label>
                    <div className="flex gap-2 bg-slate-50 p-1 rounded-xl">
                      <button onClick={() => setNewIng({ ...newIng, unitType: 'solid', measureUnit: 'kg' })} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${newIng.unitType === 'solid' ? 'bg-white shadow text-primary' : 'text-slate-400 hover:text-slate-600'}`}>Sólido (Masa)</button>
                      <button onClick={() => setNewIng({ ...newIng, unitType: 'liquid', measureUnit: 'L' })} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${newIng.unitType === 'liquid' ? 'bg-white shadow text-primary' : 'text-slate-400 hover:text-slate-600'}`}>Líquido (Volumen)</button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Unidad de Compra</label>
                    <select className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-accent focus:bg-white rounded-2xl transition-all font-bold text-sm" value={newIng.measureUnit} onChange={e => setNewIng({ ...newIng, measureUnit: e.target.value as any })}>
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
                </div>
              </div>

              {/* Initial Stock & Price */}
              <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Cantidad Inicial</label>
                  <input type="number" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent focus:border-transparent font-bold" placeholder="0" value={newIng.initialQty || ''} onChange={e => setNewIng({ ...newIng, initialQty: parseFloat(e.target.value) || 0 })} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Precio Total (USD)</label>
                  <input type="number" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent focus:border-transparent font-bold text-emerald-600" placeholder="0.00" value={newIng.initialPrice || ''} onChange={e => setNewIng({ ...newIng, initialPrice: parseFloat(e.target.value) || 0 })} />
                </div>
                <div className="col-span-2 text-center">
                  <p className="text-xs text-slate-500">
                    Costo Base Calculado: <strong className="text-primary">${newIng.initialQty > 0 ? (newIng.initialPrice / convertToBase(newIng.initialQty, newIng.measureUnit)).toFixed(5) : '0.00'}</strong> por {getBaseUnit(newIng.unitType)}
                  </p>
                </div>
              </div>

              {/* Thresholds */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Alerta Stock Bajo ({getBaseUnit(newIng.unitType)})</label>
                  <input type="number" className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-accent focus:bg-white rounded-2xl transition-all" value={newIng.minQty} onChange={e => setNewIng({ ...newIng, minQty: parseInt(e.target.value) || 0 })} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Alerta Crítica ({getBaseUnit(newIng.unitType)})</label>
                  <input type="number" className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-accent focus:bg-white rounded-2xl transition-all" value={newIng.criticalQty} onChange={e => setNewIng({ ...newIng, criticalQty: parseInt(e.target.value) || 0 })} />
                </div>
              </div>
            </div>
            <footer className="px-8 py-6 bg-slate-50 border-t flex justify-end gap-4">
              <button onClick={() => setShowNewIngModal(false)} className="px-6 py-2 font-black text-[10px] text-slate-400 uppercase tracking-widest">Cancelar</button>
              <button onClick={handleCreateIngredient} className="px-8 py-3 bg-primary text-white rounded-2xl font-black text-xs uppercase shadow-lg shadow-primary/20 active:scale-95 transition-all">Guardar Inventario</button>
            </footer>
          </div>
        </div>
      )}

      {showPurchaseModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-primary/60 backdrop-blur-sm" onClick={() => setShowPurchaseModal(false)}></div>
          <div className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 animate-scaleUp">
            <header className="px-8 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-2xl text-primary flex items-center justify-center"><span className="material-icons-round text-2xl">shopping_bag</span></div>
                <div>
                  <h3 className="font-black text-xl text-primary">Registrar Compra</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Actualización de Almacén</p>
                </div>
              </div>
              <button onClick={() => setShowPurchaseModal(false)} className="text-slate-400 hover:text-red-500 transition-colors"><span className="material-icons-round">close</span></button>
            </header>
            <div className="p-8 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Ingrediente a Reponer</label>
                <select className="w-full px-4 py-4 bg-slate-100 border-none rounded-2xl focus:ring-accent font-black text-sm uppercase" value={selectedIngId || ''} onChange={e => {
                  const newId = e.target.value;
                  setSelectedIngId(newId);
                  // Reset unit to default for type
                  const newIng = ingredients.find(i => i.id === newId);
                  if (newIng?.measureUnit === 'ml') setPurchaseUnit('L');
                  else setPurchaseUnit('kg');
                }}>
                  {ingredients.map(ing => <option key={ing.id} value={ing.id}>{ing.icon} {ing.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Cantidad</label>
                  <input type="number" className="w-full px-4 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-accent focus:ring-0 font-black" value={purchaseQty} onChange={e => setPurchaseQty(parseFloat(e.target.value) || 0)} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Unidad Medida</label>
                  <select className="w-full px-4 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-accent focus:ring-0 font-black uppercase text-xs" value={purchaseUnit} onChange={e => setPurchaseUnit(e.target.value as any)}>
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
              <div className="p-5 bg-emerald-50 border-2 border-emerald-100 rounded-3xl flex items-center gap-5">
                <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg"><span className="material-icons-round">autorenew</span></div>
                <div>
                  <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">Resumen de Conversión</p>
                  <p className="text-sm font-bold text-primary">Ingresando <span className="text-emerald-700 font-black underline">
                    {(() => {
                      let val = purchaseQty;
                      if (purchaseUnit === 'kg' || purchaseUnit === 'L') val *= 1000;
                      else if (purchaseUnit === 'lb') val *= 453.592;
                      else if (purchaseUnit === 'gal') val *= 3785.41;
                      return val.toLocaleString(undefined, { maximumFractionDigits: 0 });
                    })()} {isLiquidType ? 'ml' : 'gr'}
                  </span> al inventario</p>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Precio de Compra Total (USD)</label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-400 text-xl">$</span>
                  <input type="number" className="w-full pl-12 pr-6 py-5 bg-white border-2 border-slate-100 rounded-[24px] focus:border-accent focus:ring-0 font-black text-3xl text-primary" value={purchasePrice} onChange={e => setPurchasePrice(parseFloat(e.target.value) || 0)} />
                </div>
              </div>
            </div>
            <footer className="px-8 py-8 bg-slate-50 border-t flex justify-end gap-4">
              <button onClick={() => setShowPurchaseModal(false)} className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Descartar</button>
              <button onClick={handleRegisterPurchase} className="px-10 py-4 bg-primary text-white rounded-[20px] font-black text-sm uppercase shadow-xl shadow-primary/30 active:scale-95 transition-all">Confirmar y Actualizar</button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ label, value, color }: any) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{label}</p>
    <p className={`text-4xl font-black font-mono ${color}`}>{value}</p>
  </div>
);

export default IngredientsView;
