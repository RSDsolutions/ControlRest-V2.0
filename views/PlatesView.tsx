
import React, { useState, useMemo } from 'react';
import { Plate, Ingredient, PlateIngredient, Order } from '../types';
import { supabase } from '../supabaseClient';

interface PlatesViewProps {
  plates: Plate[];
  ingredients: Ingredient[];
  setPlates: React.Dispatch<React.SetStateAction<Plate[]>>;
  restaurantId: string | null;
  orders: Order[];
}

const PlatesView: React.FC<PlatesViewProps> = ({ plates, ingredients, setPlates, restaurantId, orders }) => {

  // Helper functions
  const convertToBase = (qty: number, unit: string) => {
    switch (unit) {
      case 'kg': return qty * 1000;
      case 'lb': return qty * 453.592;
      case 'L': return qty * 1000;
      case 'gal': return qty * 3785.41;
      default: return qty;
    }
  };

  const convertFromBase = (qty: number, unit: string) => {
    switch (unit) {
      case 'kg': return qty / 1000;
      case 'lb': return qty / 453.592;
      case 'L': return qty / 1000;
      case 'gal': return qty / 3785.41;
      default: return qty;
    }
  };

  const IngredientRow = ({ item, ingredient, onUpdate, onDelete }: any) => {
    const isLiquid = ingredient?.measureUnit === 'ml';
    const [unit, setUnit] = useState(isLiquid ? 'ml' : 'gr');

    const displayQty = convertFromBase(item.qty, unit);

    const handleQtyChange = (val: number) => {
      onUpdate(item.ingredientId, convertToBase(val, unit));
    };

    const handleUnitChange = (newUnit: string) => {
      setUnit(newUnit);
      // Optional: Round the quantity to nice number? No, keep exact.
    };

    return (
      <tr className="hover:bg-slate-50">
        <td className="px-6 py-4">
          <div className="flex items-center gap-3">
            <span>{ingredient?.icon}</span>
            <span className="text-sm font-bold text-slate-800">{ingredient?.name}</span>
          </div>
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center gap-2">
            <input
              type="number"
              className="w-20 px-2 py-1 text-sm bg-slate-100 rounded font-bold border-none focus:ring-accent"
              value={Number(displayQty.toFixed(3))} // show up to 3 decimals 
              onChange={e => handleQtyChange(parseFloat(e.target.value) || 0)}
            />
            <select
              value={unit}
              onChange={e => handleUnitChange(e.target.value)}
              className="text-xs font-bold bg-transparent border-none focus:ring-0 p-0 text-slate-500 uppercase"
            >
              {isLiquid ? (
                <>
                  <option value="ml">ml</option>
                  <option value="L">L</option>
                  <option value="gal">gal</option>
                </>
              ) : (
                <>
                  <option value="gr">gr</option>
                  <option value="kg">kg</option>
                  <option value="lb">lb</option>
                </>
              )}
            </select>
          </div>
        </td>
        <td className="px-6 py-4 text-right text-sm font-bold text-slate-800 font-mono">
          ${(item.qty * (ingredient?.unitPrice || 0)).toFixed(2)}
        </td>
        <td className="px-6 py-4 text-right">
          <button onClick={() => onDelete(item.ingredientId)} className="text-slate-300 hover:text-red-500 transition-colors">
            <span className="material-icons-round">delete</span>
          </button>
        </td>
      </tr>
    );
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('plates')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('plates')
        .getPublicUrl(filePath);

      setNewPlate(prev => ({ ...prev, image: publicUrl }));
    } catch (err: any) {
      alert('Error uploading image: ' + err.message);
    }
  };

  const getStock = (plateIngs: PlateIngredient[]) => {
    if (!plateIngs || plateIngs.length === 0) return 0;

    let minStock = Infinity;
    for (const item of plateIngs) {
      const ing = ingredients.find(i => i.id === item.ingredientId);
      if (!ing) return 0; // Missing ingredient
      const possible = Math.floor(ing.currentQty / item.qty);
      if (possible < minStock) minStock = possible;
    }
    return minStock === Infinity ? 0 : minStock;
  };

  const [isCreating, setIsCreating] = useState(false);
  const [newPlate, setNewPlate] = useState<Partial<Plate>>({
    name: '',
    category: 'Fuertes',
    sellingPrice: 0,
    ingredients: [],
    status: 'active',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400&auto=format&fit=crop'
  });

  const calculateCost = (plateIngredients: PlateIngredient[]) => plateIngredients.reduce((acc, curr) => {
    const ing = ingredients.find(i => i.id === curr.ingredientId);
    return acc + (curr.qty * (ing?.unitPrice || 0));
  }, 0);

  const handleAddIngredient = (ingId: string) => {
    if (newPlate.ingredients?.find(i => i.ingredientId === ingId)) return;
    setNewPlate(prev => ({
      ...prev,
      ingredients: [...(prev.ingredients || []), { ingredientId: ingId, qty: 100 }]
    }));
  };

  const handleUpdateQty = (ingId: string, qty: number) => {
    setNewPlate(prev => ({
      ...prev,
      ingredients: prev.ingredients?.map(i => i.ingredientId === ingId ? { ...i, qty } : i)
    }));
  };

  const currentCost = useMemo(() => calculateCost(newPlate.ingredients || []), [newPlate.ingredients, ingredients]);
  const currentMargin = useMemo(() => {
    if (!newPlate.sellingPrice || newPlate.sellingPrice <= 0) return 0;
    return ((newPlate.sellingPrice - currentCost) / newPlate.sellingPrice) * 100;
  }, [newPlate.sellingPrice, currentCost]);

  const handleSave = async () => {
    if (!newPlate.name || !newPlate.sellingPrice || !restaurantId) {
      if (!restaurantId) alert("Error: No se ha identificado el restaurante.");
      return;
    }

    try {
      // 1. Insert Recipe
      const { data: recipeData, error: recipeError } = await supabase
        .from('recipes')
        .insert({
          name: newPlate.name,
          category: newPlate.category,
          selling_price: newPlate.sellingPrice,
          image_url: newPlate.image,
          restaurant_id: restaurantId,
          is_active: true
        })
        .select()
        .single();

      if (recipeError) throw recipeError;

      if (recipeData) {
        // 2. Insert Recipe Items
        if (newPlate.ingredients && newPlate.ingredients.length > 0) {
          const itemsToInsert = newPlate.ingredients.map(ing => ({
            recipe_id: recipeData.id,
            ingredient_id: ing.ingredientId,
            quantity_gr: ing.qty
          }));

          const { error: itemsError } = await supabase
            .from('recipe_items')
            .insert(itemsToInsert);

          if (itemsError) throw itemsError;
        }

        // 3. Update Local State
        const plate: Plate = {
          ...newPlate,
          id: recipeData.id,
          sellingPrice: Number(newPlate.sellingPrice),
          ingredients: newPlate.ingredients || [],
          status: 'active'
        } as Plate;

        setPlates([...plates, plate]);
        setIsCreating(false);

        // Reset form
        setNewPlate({
          name: '',
          category: 'Fuertes',
          sellingPrice: 0,
          ingredients: [],
          status: 'active',
          image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400&auto=format&fit=crop'
        });
      }
    } catch (err: any) {
      console.error('Error saving plate:', err);
      alert('Error al guardar el plato: ' + err.message);
    }
  };

  const [selectedPlate, setSelectedPlate] = useState<Plate | null>(null);

  if (isCreating) {
    return (
      <div className="p-8 max-w-6xl mx-auto space-y-8 animate-fadeIn">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Crear Nueva Receta</h1>
            <p className="text-slate-500">Define ingredientes y calcula márgenes óptimos.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setIsCreating(false)} className="px-6 py-2 border border-slate-300 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-all">Cancelar</button>
            <button onClick={handleSave} className="px-6 py-2 bg-primary text-white rounded-xl font-bold hover:bg-primary-light shadow-lg transition-all active:scale-95">Publicar al Menú</button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div
                className="aspect-video w-full bg-slate-100 rounded-xl overflow-hidden relative group cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <img src={newPlate.image} alt="Dish" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="material-icons-round text-white text-4xl">add_a_photo</span>
                  <p className="text-white text-xs font-bold mt-2">Cambiar Imagen</p>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Nombre del Plato</label>
                  <input type="text" className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-accent focus:bg-white rounded-xl transition-all" placeholder="ej. Risotto de Verano" value={newPlate.name} onChange={e => setNewPlate({ ...newPlate, name: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Categoría</label>
                    <select className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-accent focus:bg-white rounded-xl" value={newPlate.category} onChange={e => setNewPlate({ ...newPlate, category: e.target.value })}>
                      <option>Entradas</option>
                      <option>Fuertes</option>
                      <option>Pizza</option>
                      <option>Postres</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Precio Menú</label>
                    <input type="number" className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-accent focus:bg-white rounded-xl font-bold" value={newPlate.sellingPrice} onChange={e => setNewPlate({ ...newPlate, sellingPrice: parseFloat(e.target.value) || 0 })} />
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-primary p-6 rounded-2xl shadow-xl text-white space-y-4">
              <h3 className="font-bold flex items-center gap-2"><span className="material-icons-round text-emerald-400">insights</span>Análisis de Rentabilidad</h3>
              <div className="flex justify-between items-end border-b border-white/10 pb-4">
                <div>
                  <p className="text-xs font-bold text-white/50 uppercase">Costo Alimento</p>
                  <p className="text-3xl font-extrabold">${currentCost.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-white/50 uppercase">Margen Calculado</p>
                  <p className={`text-3xl font-extrabold ${currentMargin > 70 ? 'text-emerald-400' : 'text-amber-400'}`}>{currentMargin.toFixed(0)}%</p>
                </div>
              </div>
              <p className="text-xs text-white/60 italic">{currentMargin > 70 ? "✅ Margen Saludable: Superior al estándar de la industria." : "⚠️ Margen Bajo: Considera ajustar el precio o cantidades."}</p>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-[calc(100vh-20rem)] flex flex-col">
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center"><h3 className="font-bold">Ingredientes de la Receta</h3></div>
              <div className="flex-1 overflow-y-auto p-0">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 text-[10px] uppercase font-bold text-slate-400 sticky top-0 z-10">
                    <tr><th className="px-6 py-3">Ingrediente</th><th className="px-6 py-3">Cant. (gr)</th><th className="px-6 py-3 text-right">Costo</th><th className="px-6 py-3"></th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {newPlate.ingredients?.map((item) => {
                      const ing = ingredients.find(i => i.id === item.ingredientId);
                      if (!ing) return null;
                      return (
                        <IngredientRow
                          key={item.ingredientId}
                          item={item}
                          ingredient={ing}
                          onUpdate={handleUpdateQty}
                          onDelete={(id: string) => setNewPlate(prev => ({ ...prev, ingredients: prev.ingredients?.filter(i => i.ingredientId !== id) }))}
                        />
                      );
                    })}
                    {(newPlate.ingredients?.length || 0) === 0 && (
                      <tr>
                        <td colSpan={4} className="py-20 text-center text-slate-400 italic text-sm">Añada ingredientes desde la sección inferior</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Ingredientes Disponibles</h4>
              <div className="space-y-6 overflow-y-auto max-h-80 pr-2 options-scroll">
                {Array.from(new Set(ingredients.map(i => i.category))).map(category => (
                  <div key={category}>
                    <h5 className="text-xs font-bold text-slate-500 mb-3 sticky top-0 bg-white py-1 uppercase">{category}</h5>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                      {ingredients.filter(i => i.category === category).map(ing => (
                        <button key={ing.id} onClick={() => handleAddIngredient(ing.id)} className="flex flex-col items-center gap-2 p-3 bg-slate-50 border-2 border-transparent hover:border-accent rounded-xl transition-all group">
                          <span className="text-2xl group-hover:scale-125 transition-transform">{ing.icon}</span>
                          <span className="text-[10px] font-bold text-slate-600 truncate w-full text-center uppercase">{ing.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 animate-fadeIn">
      <header className="flex justify-between items-center">
        <div><h1 className="text-3xl font-bold text-slate-900">Ingeniería de Menú</h1><p className="text-slate-500 mt-1">Gestiona tus platos y maximiza la rentabilidad.</p></div>
        <button onClick={() => setIsCreating(true)} className="bg-primary hover:bg-primary-light text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95"><span className="material-icons-round">add</span>Crear Nuevo Plato</button>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {plates.map(plate => {
          const cost = calculateCost(plate.ingredients);
          const margin = ((plate.sellingPrice - cost) / plate.sellingPrice) * 100;
          const currentStock = getStock(plate.ingredients);
          const isAvailable = currentStock > 0;

          return (
            <div key={plate.id} className={`bg-white rounded-2xl border-2 border-transparent hover:border-accent shadow-sm overflow-hidden group hover:shadow-xl transition-all ${!isAvailable ? 'opacity-75 grayscale' : ''}`}>
              <div className="h-40 relative overflow-hidden">
                <img src={plate.image} alt={plate.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                {!isAvailable && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="px-3 py-1 bg-red-500 text-white font-black text-xs uppercase rounded-full tracking-widest">Agotado</span>
                  </div>
                )}
                {isAvailable && (
                  <div className="absolute top-3 right-3">
                    <span className="px-2 py-1 bg-white/90 backdrop-blur text-slate-800 font-bold text-[10px] uppercase rounded-lg shadow-sm">
                      Stock: {currentStock}
                    </span>
                  </div>
                )}
              </div>
              <div className="p-5">
                <h3 className="font-bold text-slate-900 text-lg mb-4 line-clamp-1">{plate.name}</h3>
                <div className="flex justify-between items-end">
                  <div className="space-y-1"><p className="text-[10px] font-bold text-slate-400 uppercase">Margen</p><p className={`text-xl font-black ${margin > 70 ? 'text-emerald-500' : 'text-amber-500'}`}>{margin.toFixed(0)}%</p></div>
                  <div className="text-right space-y-1"><p className="text-[10px] font-bold text-slate-400 uppercase">Precio</p><p className="text-xl font-black text-slate-900 font-mono">${plate.sellingPrice.toFixed(2)}</p></div>
                </div>
                <div className="mt-4 pt-4 border-t flex justify-between items-center">
                  <p className="text-xs text-slate-500">Costo: <span className="font-bold font-mono">${cost.toFixed(2)}</span></p>
                  <button onClick={() => setSelectedPlate(plate)} className="text-primary hover:text-accent font-black text-[10px] uppercase flex items-center gap-1 transition-colors">
                    GESTIONAR <span className="material-icons-round text-sm">chevron_right</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedPlate && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-primary/60 backdrop-blur-sm" onClick={() => setSelectedPlate(null)}></div>
          <div className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-4xl overflow-hidden animate-scaleUp flex flex-col md:flex-row h-[80vh]">

            {/* Left Side: Image & Key Stats */}
            <div className="w-full md:w-1/3 bg-slate-50 border-r border-slate-100 flex flex-col">
              <div className="h-64 relative">
                <img src={selectedPlate.image} alt={selectedPlate.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                  <div>
                    <span className="inline-block px-2 py-1 rounded bg-accent text-white text-[10px] font-black uppercase tracking-widest mb-1">{selectedPlate.category}</span>
                    <h2 className="text-2xl font-black text-white leading-tight">{selectedPlate.name}</h2>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Precio de Venta</p>
                  <p className="text-3xl font-black text-slate-900">${selectedPlate.sellingPrice.toFixed(2)}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Costo</p>
                    <p className="text-lg font-bold text-slate-700">${calculateCost(selectedPlate.ingredients).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Margen</p>
                    <p className={`text-lg font-bold ${((selectedPlate.sellingPrice - calculateCost(selectedPlate.ingredients)) / selectedPlate.sellingPrice * 100) > 70 ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {((selectedPlate.sellingPrice - calculateCost(selectedPlate.ingredients)) / selectedPlate.sellingPrice * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Ventas Totales</p>
                  <div className="flex items-center gap-3">
                    <span className="material-icons-round text-accent text-3xl">sell</span>
                    <div>
                      <p className="text-2xl font-black text-slate-900">
                        {orders ? orders.reduce((acc, order) => {
                          return acc + (order.items?.filter(item => item.plateId === selectedPlate.id).reduce((sum, item) => sum + item.qty, 0) || 0);
                        }, 0) : 0}
                      </p>
                      <p className="text-xs text-slate-500 font-bold">Unidades vendidas</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side: Ingredients & Actions */}
            <div className="flex-1 flex flex-col">
              <header className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
                <h3 className="font-bold text-lg text-slate-800">Composición de Receta</h3>
                <button onClick={() => setSelectedPlate(null)} className="text-slate-400 hover:text-red-500 transition-colors"><span className="material-icons-round">close</span></button>
              </header>

              <div className="flex-1 overflow-y-auto p-0">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest sticky top-0">
                    <tr>
                      <th className="px-6 py-3">Ingrediente</th>
                      <th className="px-6 py-3 text-right">Cantidad</th>
                      <th className="px-6 py-3 text-right">Costo Est.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedPlate.ingredients.map((item, idx) => {
                      const ing = ingredients.find(i => i.id === item.ingredientId);
                      return (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <span className="text-xl">{ing?.icon}</span>
                              <div>
                                <p className="text-sm font-bold text-slate-800">{ing?.name}</p>
                                <p className="text-[10px] text-slate-400">{ing?.category}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right font-mono text-sm font-bold text-slate-600">
                            {item.qty} {ing?.measureUnit}
                          </td>
                          <td className="px-6 py-4 text-right font-mono text-sm font-bold text-slate-800">
                            ${(item.qty * (ing?.unitPrice || 0)).toFixed(3)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <footer className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                <button className="px-6 py-2 border border-slate-300 rounded-xl font-bold text-slate-500 hover:bg-white hover:shadow-sm transition-all" onClick={() => alert("Función de editar en desarrollo")}>Editar Receta</button>
                <button className="px-6 py-2 bg-primary text-white rounded-xl font-bold hover:bg-primary-light shadow-lg active:scale-95 transition-all">Exportar Ficha Técnica</button>
              </footer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlatesView;
