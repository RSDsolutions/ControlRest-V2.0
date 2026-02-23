import React, { useState } from 'react';
import { Ingredient } from '../types';
import { supabase } from '../supabaseClient';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { usePlanFeatures, isFeatureEnabled } from '../hooks/usePlanFeatures';

interface IngredientsViewProps {
  ingredients: Ingredient[];
  setIngredients: React.Dispatch<React.SetStateAction<Ingredient[]>>;
  branchId: string | null;
  restaurantId: string | null;
}

const INGREDIENT_ICONS = [
  '🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑',
  '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠', '🫘', '🍄', '🥜', '🌰', '🍞', '🥐', '🥖', '🫓',
  '🥨', '🥯', '🥞', '🧇', '🧀', '🍖', '🍗', '🥩', '🥓', '🍔', '🍟', '🍕', '🌭', '🥪', '🌮', '🌯', '🫔', '🥙', '🧆', '🥚',
  '🍳', '🥘', '🍲', '🥣', '🥗', '🍿', '🧈', '🧂', '🥫', '🥛', '🍼', '☕', '🫖', '🍵', '🍶', '🧃', '🥤', '🧋', '🧉', '🍺',
  '🍻', '🥂', '🍷', '🥃', '🍸', '🍹', '🏺', '🍨', '🍧', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍩', '🍪',
  '🥠', '🥮', '🧊', '🧂', '🥢', '🍽️', '🍴', '🥄', '🔪', '🫙', '🏺', '📦', '🥡', '🧴', '🧼', '🧻', '🧺', '🕯️', '🧯', '🧹'
];

const IngredientsView: React.FC<IngredientsViewProps> = ({ ingredients, setIngredients, branchId, restaurantId }) => {
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showNewIngModal, setShowNewIngModal] = useState(false);
  const [selectedIngId, setSelectedIngId] = useState<string | null>(null);
  const [purchaseQty, setPurchaseQty] = useState(1);
  const [purchaseUnit, setPurchaseUnit] = useState<string>('kg');
  const [purchasePrice, setPurchasePrice] = useState(15.00);
  const [purchaseExpiration, setPurchaseExpiration] = useState('');

  // Batches
  const [batches, setBatches] = useState<any[]>([]);
  const [viewBatchDetailsIngId, setViewBatchDetailsIngId] = useState<string | null>(null);
  const [showIconPicker, setShowIconPicker] = useState(false);

  const { data: planData } = usePlanFeatures(restaurantId || undefined);
  const isPlanOperativo = !isFeatureEnabled(planData, 'ENABLE_NET_PROFIT_CALCULATION');

  const generateIngredientPDF = (ing: Ingredient) => {
    const doc = new jsPDF();
    const ingBatches = batches.filter(b => b.ingredient_id === ing.id);

    // Header
    doc.setFontSize(22);
    doc.setTextColor(40, 40, 40);
    doc.text(`Ficha Técnica de Insumo`, 14, 25);

    doc.setFontSize(18);
    doc.text(ing.name, 14, 45);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Categoría: ${ing.category}`, 14, 55);
    doc.text(`ID Insumo: ${ing.id.split('-')[0]}`, 14, 60);
    doc.text(`Fecha de Reporte: ${new Date().toLocaleString()}`, 14, 65);

    // Summary Box
    doc.setDrawColor(230, 230, 230);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 75, 182, 30, 2, 2, 'FD');

    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('EXISTENCIAS TOTALES', 20, 85);
    doc.text('COSTO PROMEDIO', 80, 85);
    doc.text('TIPO DE UNIDAD', 140, 85);

    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text(`${ing.currentQty.toLocaleString()} ${ing.measureUnit === 'ml' ? 'ml' : 'gr'}`, 20, 95);
    doc.text(`$${(ing.unitPrice || 0).toFixed(4)}`, 80, 95);
    doc.text(ing.measureUnit === 'ml' ? 'Líquido' : 'Sólido', 140, 95);

    // Batches Table
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text('Trazabilidad de Lotes en Almacén', 14, 120);

    const tableData = ingBatches.map(b => [
      `#${b.id.split('-')[0]}`,
      `${b.quantity_remaining.toLocaleString()} gr`,
      `$${Number(b.unit_cost).toFixed(4)}`,
      b.suppliers?.name || 'Distribución Global',
      b.expiration_date ? new Date(b.expiration_date).toLocaleDateString() : 'N/A'
    ]);

    autoTable(doc, {
      startY: 125,
      head: [['Lote ID', 'Saldo Restante', 'Costo Unit.', 'Proveedor', 'Vencimiento']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [19, 109, 236], textColor: 255, fontSize: 10 },
      bodyStyles: { fontSize: 9 },
      columnStyles: {
        0: { fontStyle: 'bold' },
        2: { textColor: [19, 109, 236], fontStyle: 'bold' }
      }
    });

    doc.save(`${ing.name.replace(/\s+/g, '_')}_Ficha_Tecnica.pdf`);
  };

  React.useEffect(() => {
    if (branchId && branchId !== 'GLOBAL') {
      supabase.from('inventory_batches')
        .select('*, suppliers(name)')
        .eq('branch_id', branchId)
        .order('expiration_date', { ascending: true })
        .then(({ data }) => setBatches(data || []));
    }
  }, [branchId]);

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
    measureUnit: 'gr' as 'gr' | 'kg' | 'lb' | 'ml' | 'L' | 'gal',
    expirationDate: ''
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

    try {
      const { data, error } = await supabase.rpc('receive_ingredient_stock', {
        p_ingredient_id: selectedIngId,
        p_branch_id: branchId,
        p_quantity: addedQty,
        p_unit_cost: addedQty > 0 ? purchasePrice / addedQty : 0,
        p_expiration_date: purchaseExpiration || null,
        p_reference: `Compra Directa - ${new Date().toLocaleDateString()}`
      });

      if (error) throw error;

      // Update local state with returned values from RPC
      setIngredients(prev => prev.map(i => {
        if (i.id === selectedIngId) {
          return {
            ...i,
            currentQty: data.new_total_qty,
            unitPrice: data.new_avg_cost
          };
        }
        return i;
      }));

      setShowPurchaseModal(false);
      setPurchaseExpiration('');
    } catch (err) {
      console.error('Error updating inventory:', err);
      alert('Error al registrar la compra. Intente nuevamente.');
    }
  };

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

    try {
      const { data: ingData, error: ingError } = await supabase
        .from('ingredients')
        .insert([payload])
        .select()
        .single();

      if (ingError) throw ingError;

      if (ingData) {
        if (baseQty > 0) {
          const { error: invError } = await supabase.rpc('receive_ingredient_stock', {
            p_ingredient_id: ingData.id,
            p_branch_id: branchId,
            p_quantity: baseQty,
            p_unit_cost: unitPrice,
            p_expiration_date: newIng.expirationDate || null,
            p_reference: 'Saldo Inicial de Apertura'
          });

          if (invError) throw invError;

          await supabase.from('inventory').update({
            min_level_gr: newIng.minQty,
            critical_level_gr: newIng.criticalQty
          }).match({ branch_id: branchId, ingredient_id: ingData.id });

        } else {
          const { error: invError } = await supabase
            .from('inventory')
            .insert({
              ingredient_id: ingData.id,
              branch_id: branchId,
              quantity_gr: 0,
              unit_cost_gr: 0,
              min_level_gr: newIng.minQty,
              critical_level_gr: newIng.criticalQty
            });

          if (invError) throw invError;
        }

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
          measureUnit: 'gr',
          expirationDate: ''
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
      alert(`No se puede eliminar "${ing.name}" porque todavía tiene stock.`);
      return;
    }

    if (!confirm(`¿Estás seguro de eliminar el ingrediente "${ing.name}"?`)) return;

    try {
      const { error: invError } = await supabase.from('inventory').delete().match({ ingredient_id: id });
      if (invError) throw invError;

      const { error: ingError } = await supabase.from('ingredients').delete().match({ id });
      if (ingError) throw ingError;

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
          <div className="flex gap-4">
            <button
              onClick={() => setShowNewIngModal(true)}
              className="btn bg-white border border-slate-200 text-[#136dec] hover:bg-slate-50 transition-all flex items-center gap-2 px-10 py-3 rounded-full shadow-lg shadow-slate-100 font-bold"
            >
              <span className="material-icons-round text-[18px]">add</span> Nuevo Insumo
            </button>
            <button
              onClick={() => { setSelectedIngId(ingredients[0]?.id || null); setShowPurchaseModal(true); }}
              className="btn bg-[#136dec] text-white hover:bg-[#0d5cc7] transition-all flex items-center gap-2 px-10 py-3 rounded-full shadow-lg shadow-blue-100 font-bold border border-[#136dec]"
            >
              <span className="material-icons-round text-[18px]">shopping_cart</span> Registrar Compra
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <KPIItem label="Catálogo Activo" value={ingredients.length} sub="Items registrados" icon="inventory_2" color="bg-slate-500" />
          <KPIItem label="Stock Bajo" value={ingredients.filter(i => i.currentQty <= i.minQty).length} sub="Requieren reposición" icon="warning" color="bg-amber-500" />
          <KPIItem label="Nivel Crítico" value={ingredients.filter(i => i.currentQty <= i.criticalQty).length} sub="Riesgo de quiebre" icon="dangerous" color="bg-red-500" />
          <KPIItem label="Valorización de Stock" value={`$${ingredients.reduce((acc, ing) => acc + (ing.currentQty * (ing.unitPrice || 0)), 0).toLocaleString()}`} sub="Costo total en bodega" icon="account_balance_wallet" color="bg-emerald-500" />
        </div>

        <div className="card p-0 overflow-hidden flex flex-col min-h-[600px] shadow-brand border-slate-200 mt-8">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest sticky top-0 z-10 border-b border-slate-100">
                <tr>
                  <th className="px-8 py-5">Insumo / Descripción</th>
                  <th className="px-8 py-5">Categoría</th>
                  <th className="px-8 py-5 text-right">Existencias</th>
                  <th className="px-8 py-5 text-right">Costo Promedio</th>
                  <th className="px-8 py-5 text-right">Lotes</th>
                  <th className="px-8 py-5 text-center">Estado</th>
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
                  const lotCount = batches.filter(b => b.ingredient_id === ing.id && b.quantity_remaining > 0).length;
                  const expiringSoon = batches.filter(b => b.ingredient_id === ing.id && b.quantity_remaining > 0 && b.expiration_status === 'expiring').length;

                  return (
                    <tr key={ing.id} className="hover:bg-slate-50/50 transition-all group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-2xl">{ing.icon}</div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm uppercase">{ing.name}</p>
                            <p className="text-[10px] text-slate-400">SKU: {ing.id.split('-')[0]}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-[10px] font-bold text-slate-500 uppercase bg-slate-100 px-2 py-1 rounded">{ing.category}</span>
                      </td>
                      <td className="px-8 py-5 text-right font-bold text-slate-900">
                        {ing.currentQty.toLocaleString()} {ing.measureUnit}
                      </td>
                      <td className="px-8 py-5 text-right text-primary font-bold">
                        ${(ing.unitPrice || 0).toFixed(4)}
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-sm font-bold text-slate-900">{lotCount}</span>
                          {expiringSoon > 0 && <span className="text-[10px] text-amber-600 font-bold">! {expiringSoon}</span>}
                          {!isPlanOperativo && (
                            <button onClick={() => setViewBatchDetailsIngId(ing.id)} className="p-1.5 rounded-lg bg-slate-50 border hover:bg-white text-slate-400 hover:text-primary transition-all">
                              <span className="material-icons-round text-lg">history</span>
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black border uppercase tracking-wider ${statusColor}`}>{status}</span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-2 text-slate-400">
                          {!isPlanOperativo && (
                            <button onClick={() => generateIngredientPDF(ing)} className="p-2 hover:bg-emerald-50 hover:text-emerald-500 rounded-lg transition-all" title="Exportar PDF">
                              <span className="material-icons-round text-xl">picture_as_pdf</span>
                            </button>
                          )}
                          <button onClick={() => { setSelectedIngId(ing.id); setShowPurchaseModal(true); }} className="p-2 hover:bg-primary/5 hover:text-primary rounded-lg transition-all" title="Registrar Compra"><span className="material-icons-round text-xl">add_shopping_cart</span></button>
                          <button onClick={() => handleDeleteIngredient(ing.id)} disabled={ing.currentQty > 0} className={`p-2 rounded-lg transition-all ${ing.currentQty > 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-red-50 hover:text-red-500'}`}><span className="material-icons-round text-xl">delete_outline</span></button>
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={() => setShowNewIngModal(false)}></div>
          <div className="relative bg-white w-full max-w-2xl rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <header className="px-8 py-6 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Configuración de Nuevo Insumo</h3>
                <p className="text-[11px] text-slate-400 uppercase font-black tracking-widest mt-1">Gestión Técnica Almacén</p>
              </div>
              <button onClick={() => setShowNewIngModal(false)} className="w-8 h-8 rounded-full hover:bg-slate-50 flex items-center justify-center border text-slate-400"><span className="material-icons-round text-lg">close</span></button>
            </header>
            <div className="p-8 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2 flex gap-4">
                  <button onClick={() => setShowIconPicker(!showIconPicker)} className="w-[52px] h-[52px] rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-2xl hover:bg-white transition-all shadow-sm relative">
                    {newIng.icon}
                  </button>
                  <div className="flex-1 space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase">Nombre Insumo</label>
                    <input type="text" className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 font-bold" value={newIng.name} onChange={e => setNewIng({ ...newIng, name: e.target.value })} placeholder="Ej: Pechuga de Pollo" />
                  </div>
                </div>

                <div className="col-span-2 grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase block">Categoría</label>
                    <select className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 font-bold" value={newIng.category} onChange={e => setNewIng({ ...newIng, category: e.target.value })}>
                      <option>Proteínas (Carnes y Sustitutos)</option>
                      <option>Verduras y Hortalizas</option>
                      <option>Cereales y Harinas</option>
                      <option>Lácteos</option>
                      <option>Grasas y Aceites</option>
                      <option>Condimentos y Especias</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase block">Tipo de Insumo</label>
                    <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                      <button
                        onClick={() => setNewIng({ ...newIng, unitType: 'solid', measureUnit: 'gr' })}
                        className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${newIng.unitType === 'solid' ? 'bg-white text-primary shadow-sm' : 'text-slate-400'}`}
                      >Sólido</button>
                      <button
                        onClick={() => setNewIng({ ...newIng, unitType: 'liquid', measureUnit: 'ml' })}
                        className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${newIng.unitType === 'liquid' ? 'bg-white text-primary shadow-sm' : 'text-slate-400'}`}
                      >Líquido</button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 col-span-2 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase">Cant. Apertura</label>
                    <input type="number" className="w-full px-4 py-3 text-lg font-black rounded-lg border border-slate-200" value={newIng.initialQty || ''} onChange={e => setNewIng({ ...newIng, initialQty: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase">Unidad</label>
                    <select
                      className="w-full px-4 py-3 text-sm font-bold rounded-lg border border-slate-200 bg-white"
                      value={newIng.measureUnit}
                      onChange={e => setNewIng({ ...newIng, measureUnit: e.target.value as any })}
                    >
                      {newIng.unitType === 'solid' ? (
                        <>
                          <option value="gr">Gramos (gr)</option>
                          <option value="kg">Kilos (kg)</option>
                          <option value="lb">Libras (lb)</option>
                        </>
                      ) : (
                        <>
                          <option value="ml">Mililitros (ml)</option>
                          <option value="L">Litros (L)</option>
                          <option value="gal">Galones (gal)</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase">Costo Total</label>
                    <input type="number" className="w-full px-4 py-3 text-lg font-black rounded-lg border border-slate-200" value={newIng.initialPrice || ''} onChange={e => setNewIng({ ...newIng, initialPrice: parseFloat(e.target.value) || 0 })} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 col-span-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase">Stock Mínimo ({newIng.unitType === 'solid' ? 'gr' : 'ml'})</label>
                    <input type="number" className="w-full px-4 py-3 text-sm font-bold rounded-lg border border-slate-200" value={newIng.minQty} onChange={e => setNewIng({ ...newIng, minQty: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase">Stock Crítico ({newIng.unitType === 'solid' ? 'gr' : 'ml'})</label>
                    <input type="number" className="w-full px-4 py-3 text-sm font-bold rounded-lg border border-slate-200" value={newIng.criticalQty} onChange={e => setNewIng({ ...newIng, criticalQty: parseFloat(e.target.value) || 0 })} />
                  </div>
                </div>

                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Vencimiento Lote Inicial</label>
                  <input type="date" className="w-full px-4 py-3 text-sm font-bold rounded-lg border border-slate-200" value={newIng.expirationDate} onChange={e => setNewIng({ ...newIng, expirationDate: e.target.value })} />
                </div>
              </div>
            </div>
            <footer className="px-8 py-6 bg-slate-50 border-t flex justify-between shrink-0">
              <button onClick={() => setShowNewIngModal(false)} className="px-8 py-3 rounded-full font-bold border hover:bg-white transition-all">Cancelar</button>
              <button onClick={handleCreateIngredient} className="px-8 py-3 rounded-full font-bold bg-[#136dec] text-white hover:bg-[#0d5cc7] shadow-lg shadow-blue-100 transition-all border border-[#136dec]">Crear Insumo</button>
            </footer>
          </div>
        </div>
      )}

      {showPurchaseModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={() => setShowPurchaseModal(false)}></div>
          <div className="relative bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <header className="px-8 py-6 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="text-xl font-bold text-slate-900">Registro de Compra</h3>
              <button onClick={() => setShowPurchaseModal(false)} className="w-8 h-8 rounded-full hover:bg-slate-50 flex items-center justify-center border text-slate-400"><span className="material-icons-round text-lg">close</span></button>
            </header>
            <div className="p-8 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-700 uppercase block">Insumo Seleccionado</label>
                <select className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 font-bold" value={selectedIngId || ''} onChange={e => setSelectedIngId(e.target.value)}>
                  {ingredients.map(ing => <option key={ing.id} value={ing.id}>{ing.icon} {ing.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-6">
                <div className="col-span-1">
                  <label className="text-xs font-bold text-slate-700 uppercase block">Cantidad</label>
                  <input type="number" className="w-full px-4 py-3 text-lg font-black rounded-lg border border-slate-200" value={purchaseQty} onChange={e => setPurchaseQty(parseFloat(e.target.value) || 0)} />
                </div>
                <div className="col-span-1">
                  <label className="text-xs font-bold text-slate-700 uppercase block">Unidad</label>
                  <select
                    className="w-full px-4 py-3 text-sm font-bold rounded-lg border border-slate-200 bg-white"
                    value={purchaseUnit}
                    onChange={e => setPurchaseUnit(e.target.value)}
                  >
                    {ingredients.find(i => i.id === selectedIngId)?.measureUnit === 'ml' ? (
                      <>
                        <option value="ml">ml</option>
                        <option value="L">Litros (L)</option>
                        <option value="gal">Galones (gal)</option>
                      </>
                    ) : (
                      <>
                        <option value="gr">gr</option>
                        <option value="kg">Kilos (kg)</option>
                        <option value="lb">Libras (lb)</option>
                      </>
                    )}
                  </select>
                </div>
                <div className="col-span-1">
                  <label className="text-xs font-bold text-slate-700 uppercase block">Total USD</label>
                  <input type="number" className="w-full px-4 py-3 text-lg font-black rounded-lg border border-slate-200" value={purchasePrice} onChange={e => setPurchasePrice(parseFloat(e.target.value) || 0)} />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-700 uppercase block">Fecha de Vencimiento de Lote</label>
                <input type="date" className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 font-bold" value={purchaseExpiration} onChange={e => setPurchaseExpiration(e.target.value)} />
              </div>
            </div>
            <footer className="px-8 py-6 bg-slate-50 border-t flex justify-between shrink-0">
              <button onClick={() => setShowPurchaseModal(false)} className="px-8 py-3 rounded-full font-bold border">Cancelar</button>
              <button onClick={handleRegisterPurchase} className="px-8 py-3 rounded-full font-bold bg-[#136dec] text-white">Ingresar Stock</button>
            </footer>
          </div>
        </div>
      )}

      {viewBatchDetailsIngId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={() => setViewBatchDetailsIngId(null)}></div>
          <div className="relative bg-white w-full max-w-2xl rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <header className="px-8 py-6 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Kardex de Lotes Técnicos</h2>
              <button onClick={() => setViewBatchDetailsIngId(null)} className="w-8 h-8 rounded-full hover:bg-slate-50 border text-slate-400">
                <span className="material-icons-round text-lg">close</span>
              </button>
            </header>
            <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar bg-slate-50/10">
              {batches.filter(b => b.ingredient_id === viewBatchDetailsIngId).map(b => (
                <div key={b.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <p className="text-sm font-bold text-slate-900 uppercase">Lote: {b.id.split('-')[0]}</p>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${b.expiration_status === 'valid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                      b.expiration_status === 'expiring' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                        'bg-red-50 text-red-600 border-red-100'
                      }`}>
                      {b.expiration_status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Saldo Disponible</p>
                      <p className="text-lg font-black text-slate-900">{b.quantity_remaining.toLocaleString()} gr</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Costo Unit.</p>
                      <p className="text-lg font-black text-primary">${Number(b.unit_cost).toFixed(4)}</p>
                    </div>
                    {b.expiration_date && (
                      <div className="col-span-2 mt-2 pt-2 border-t border-slate-50 flex items-center gap-2">
                        <span className="material-icons-round text-slate-300 text-lg">calendar_today</span>
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Caducidad: {new Date(b.expiration_date).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showIconPicker && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]" onClick={() => setShowIconPicker(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 border border-slate-200">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 border-b pb-4">Seleccionar Icono de Insumo</h4>
            <div className="grid grid-cols-6 gap-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
              {INGREDIENT_ICONS.map(icon => (
                <button
                  key={icon}
                  onClick={() => { setNewIng({ ...newIng, icon }); setShowIconPicker(false); }}
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200"
                >
                  {icon}
                </button>
              ))}
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
