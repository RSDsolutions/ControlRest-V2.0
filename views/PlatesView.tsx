
import React, { useState, useMemo } from 'react';
import { Plate, Ingredient, PlateIngredient, Order } from '../types';
import { supabase } from '../supabaseClient';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';


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
  const [isEditing, setIsEditing] = useState(false); // Track if we are editing
  const [editingId, setEditingId] = useState<string | null>(null);

  // Helper to convert image to base64
  const getBase64Image = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.setAttribute('crossOrigin', 'anonymous');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const dataURL = canvas.toDataURL('image/jpeg');
          resolve(dataURL);
        } else {
          reject(new Error('Canvas context failed'));
        }
      };
      img.onerror = error => reject(error);
      img.src = url;
    });
  };

  const generatePDF = async (plate: Plate) => {
    const doc = new jsPDF();
    const cost = calculateCost(plate.ingredients);
    const margin = ((plate.sellingPrice - cost) / plate.sellingPrice) * 100;

    // Title
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text(`Ficha Técnica: ${plate.name}`, 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Categoría: ${plate.category}`, 14, 28);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 32);

    // Image
    if (plate.image) {
      try {
        // Attempt to get base64 image
        const base64Img = await getBase64Image(plate.image);
        doc.addImage(base64Img, 'JPEG', 14, 40, 50, 50);
      } catch (e) {
        console.warn('Could not add image to PDF', e);
        // Fallback text if image fails
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text('(Imagen no disponible en exportación)', 14, 60);
      }
    }

    // Financials - Shift down if image exists (or just keep fixed layout if image is fixed size)
    // We used 14, 40, 50, 50 for image. Value Y ends at 90.
    // Let's position financials to the right of image or below.
    // Let's put them to the right of the image for a nicer layout.

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    const startX = 70;
    doc.text(`Precio Venta: $${plate.sellingPrice.toFixed(2)}`, startX, 50);
    doc.text(`Costo Total: $${cost.toFixed(2)}`, startX, 60);
    doc.text(`Margen: ${margin.toFixed(1)}%`, startX, 70);

    // Ingredients Table
    const tableData = plate.ingredients.map(item => {
      const ing = ingredients.find(i => i.id === item.ingredientId);
      return [
        ing?.name || 'Desconocido',
        `${item.qty} ${ing?.measureUnit || 'un'}`,
        `$${(ing?.unitPrice || 0).toFixed(2)}`,
        `$${(item.qty * (ing?.unitPrice || 0)).toFixed(2)}`
      ];
    });

    autoTable(doc, {
      startY: 100, // Below image area
      head: [['Ingrediente', 'Cantidad', 'Costo Unit.', 'Costo Total']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      foot: [['Totals', '', '', `$${cost.toFixed(2)}`]]
    });

    doc.save(`${plate.name.replace(/\s+/g, '_')}_Ficha_Tecnica.pdf`);
  };

  const handleEditRequest = (plate: Plate) => {
    setNewPlate({
      ...plate,
      ingredients: plate.ingredients.map(pi => ({
        ingredientId: pi.ingredientId,
        qty: pi.qty
      }))
    });
    setEditingId(plate.id);
    setIsEditing(true);
    setIsCreating(true); // Re-use the creation form
    setSelectedPlate(null);
  };
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
      if (isEditing && editingId) {
        // --- UPDATE MODE ---
        // 1. Update Recipe Details
        const { error: updateError } = await supabase
          .from('recipes')
          .update({
            name: newPlate.name,
            category: newPlate.category,
            selling_price: newPlate.sellingPrice,
            image_url: newPlate.image,
          })
          .eq('id', editingId);

        if (updateError) throw updateError;

        // 2. Sync Ingredients (Delete all and re-insert is easiest strategy here)
        const { error: deleteError } = await supabase
          .from('recipe_items')
          .delete()
          .eq('recipe_id', editingId);

        if (deleteError) throw deleteError;

        if (newPlate.ingredients && newPlate.ingredients.length > 0) {
          const itemsToInsert = newPlate.ingredients.map(ing => ({
            recipe_id: editingId,
            ingredient_id: ing.ingredientId,
            quantity_gr: ing.qty
          }));
          const { error: insertItemsError } = await supabase
            .from('recipe_items')
            .insert(itemsToInsert);
          if (insertItemsError) throw insertItemsError;
        }

        // 3. Update Local State
        const updatedPlate: Plate = {
          ...newPlate,
          id: editingId,
          sellingPrice: Number(newPlate.sellingPrice),
          ingredients: newPlate.ingredients || [],
          status: 'active'
        } as Plate;

        setPlates(prev => prev.map(p => p.id === editingId ? updatedPlate : p));
        setIsCreating(false);
        setIsEditing(false);
        setEditingId(null);

        // Reset form
        setNewPlate({
          name: '',
          category: 'Fuertes',
          sellingPrice: 0,
          ingredients: [],
          status: 'active',
          image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400&auto=format&fit=crop'
        });

      } else {
        // --- CREATE MODE ---
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
      }
    } catch (err: any) {
      console.error('Error saving plate:', err);
      alert('Error al guardar el plato: ' + err.message);
    }
  };

  const [selectedPlate, setSelectedPlate] = useState<Plate | null>(null);

  if (isCreating) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-10 animate-fade-in font-sans pb-32">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-[8px] shadow-card border border-slate-200">
          <div>
            <h1 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <span className="material-icons-round text-[#136dec] text-xl">restaurant_menu</span>
              {isEditing ? 'Gestión de Receta Maestra' : 'Ingeniería de Producto'}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">Define el ADN de tu plato: costeo técnico, rentabilidad proyectada y visualización.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => { setIsCreating(false); setIsEditing(false); setEditingId(null); }} className="btn btn-outline">Cancelar</button>
            <button onClick={handleSave} className="btn btn-primary">
              {isEditing ? 'Guardar Cambios' : 'Publicar al Menú'}
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 space-y-8">
            <div className="card p-0 overflow-hidden">
              <div className="p-6 bg-slate-50 border-b border-slate-100"><h3 className="font-heading font-black text-brand-black uppercase tracking-widest text-[11px]">Identidad Visual y Comercial</h3></div>
              <div className="p-8 space-y-8">
                <div
                  className="aspect-video w-full bg-slate-100 rounded-3xl overflow-hidden relative group cursor-pointer border-2 border-dashed border-slate-200 hover:border-primary/30 transition-all shadow-inner"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <img src={newPlate.image} alt="Dish" className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-700" />
                  <div className="absolute inset-0 bg-brand-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white mb-3 shadow-2xl">
                      <span className="material-icons-round text-3xl">photo_camera</span>
                    </div>
                    <p className="text-white text-xs font-black uppercase tracking-[0.2em]">Actualizar Fotografía</p>
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="label">Nombre del Plato en Carta</label>
                    <input type="text" className="input text-lg font-bold" placeholder="ej. Salmón en Crosta de Pistacho" value={newPlate.name} onChange={e => setNewPlate({ ...newPlate, name: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="label">Categoría</label>
                      <select className="input" value={newPlate.category} onChange={e => setNewPlate({ ...newPlate, category: e.target.value })}>
                        <option>Entradas</option>
                        <option>Fuertes</option>
                        <option>Pizza</option>
                        <option>Postres</option>
                        <option>Bebidas</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="label">Precio de Venta</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                        <input type="number" className="input pl-8 font-black text-xl text-brand-black" value={newPlate.sellingPrice} onChange={e => setNewPlate({ ...newPlate, sellingPrice: parseFloat(e.target.value) || 0 })} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={`card p-8 border-l-[6px] transition-all duration-500 ${currentMargin > 70 ? 'border-l-emerald-500 bg-emerald-50/10' : 'border-l-amber-500 bg-amber-50/10'}`}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-heading font-black text-brand-black uppercase tracking-widest text-[11px] flex items-center gap-2">
                  <span className="material-icons-round text-lg">analytics</span> Simulación de Márgenes
                </h3>
                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${currentMargin > 70 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {currentMargin > 70 ? 'Altamente Rentable' : 'Margen Ajustado'}
                </span>
              </div>

              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Costo Técnico Alimento</p>
                  <p className="text-4xl font-heading font-black text-brand-black tracking-tighter">${currentCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rentabilidad Proyectada</p>
                  <p className={`text-4xl font-heading font-black tracking-tighter ${currentMargin > 70 ? 'text-emerald-600' : 'text-amber-600'}`}>{currentMargin.toFixed(1)}%</p>
                </div>
              </div>

              <div className="mt-8 p-4 bg-white/50 rounded-2xl border border-slate-100 flex items-start gap-3">
                <span className={`material-icons-round ${currentMargin > 70 ? 'text-emerald-500' : 'text-amber-500'}`}>
                  {currentMargin > 70 ? 'task_alt' : 'error_outline'}
                </span>
                <p className="text-[11px] leading-relaxed font-bold text-slate-500">
                  {currentMargin > 70
                    ? "Excelente ratio de costo. Este producto contribuye significativamente al EBITDA global de la operación."
                    : "El margen está por debajo del estándar óptimo (75%). Se recomienda auditar el costo de insumos o incrementar el precio de carta."}
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-8">
            <div className="card p-0 overflow-hidden h-[calc(100vh-22rem)] flex flex-col shadow-brand border-slate-200">
              <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-heading font-black text-brand-black uppercase tracking-widest text-[11px]">Estructura de la Receta (Items)</h3>
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
                  {newPlate.ingredients?.length || 0} Insumos
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-0 scroll-smooth">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 sticky top-0 z-10 border-b border-slate-100">
                    <tr>
                      <th className="px-8 py-4">Ingrediente / Insumo</th>
                      <th className="px-8 py-4">Gramaje / Vol.</th>
                      <th className="px-8 py-4 text-right">Costo Proporcional</th>
                      <th className="px-8 py-4 text-right">Acciones</th>
                    </tr>
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
                        <td colSpan={4} className="py-24 text-center">
                          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-200">
                            <span className="material-icons-round text-slate-300 text-3xl">restaurant_menu</span>
                          </div>
                          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Añade insumos al plato para calcular el costeo Técnico</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card p-6">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 px-2">Bodega de Insumos Disponibles</h4>
              <div className="space-y-8 overflow-y-auto max-h-96 pr-2 custom-scrollbar">
                {Array.from(new Set(ingredients.map(i => i.category))).map(category => (
                  <div key={category} className="space-y-4">
                    <h5 className="text-[10px] font-black text-primary/60 border-b border-primary/10 pb-2 uppercase tracking-widest pl-2">{category}</h5>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                      {ingredients.filter(i => i.category === category).map(ing => (
                        <button key={ing.id} onClick={() => handleAddIngredient(ing.id)} className="flex flex-col items-center gap-3 p-4 bg-slate-50 border border-slate-200 hover:border-primary hover:bg-white rounded-2xl transition-all group relative overflow-hidden">
                          <span className="text-3xl group-hover:scale-125 transition-transform duration-300 relative z-10">{ing.icon}</span>
                          <span className="text-[9px] font-black text-slate-600 uppercase tracking-tight text-center leading-tight relative z-10">{ing.name}</span>
                          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
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
    <div className="p-6 space-y-5 animate-fade-in max-w-[1700px] mx-auto font-sans">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-[8px] shadow-card border border-slate-200">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <span className="material-icons-round text-[#136dec] text-xl">menu_book</span>
            Ingeniería de Menú
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Control de rentabilidad unitaria, auditoría de recetas y gestión de carta inteligente.</p>
        </div>
        <button onClick={() => setIsCreating(true)} className="btn btn-primary flex items-center gap-2">
          <span className="material-icons-round text-[18px]">add</span> Crear Nuevo Plato
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {plates.map(plate => {
          const cost = calculateCost(plate.ingredients);
          const margin = ((plate.sellingPrice - cost) / plate.sellingPrice) * 100;
          const currentStock = getStock(plate.ingredients);
          const isAvailable = currentStock > 0;

          return (
            <div key={plate.id} className={`card p-0 overflow-hidden group hover:shadow-2xl transition-all duration-500 border-slate-100 ${!isAvailable ? 'opacity-80' : ''}`}>
              <div className="h-48 relative overflow-hidden">
                <img src={plate.image} alt={plate.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                {!isAvailable && (
                  <div className="absolute inset-0 bg-brand-black/60 backdrop-blur-[2px] flex items-center justify-center">
                    <span className="px-4 py-2 bg-red-600 text-white font-black text-[10px] uppercase rounded-full tracking-widest shadow-xl ring-4 ring-red-600/20">Insumos Agotados</span>
                  </div>
                )}
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-white/95 backdrop-blur text-brand-black font-black text-[9px] uppercase rounded-lg shadow-sm border border-slate-100 tracking-widest">
                    {plate.category}
                  </span>
                </div>
                {isAvailable && (
                  <div className="absolute bottom-4 right-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="px-3 py-1 bg-emerald-500 text-white font-black text-[9px] uppercase rounded-lg shadow-lg flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse"></span>
                      Disponibilidad: {currentStock}
                    </div>
                  </div>
                )}
              </div>
              <div className="p-6 space-y-6">
                <h3 className="font-heading font-black text-brand-black text-xl tracking-tight line-clamp-1 group-hover:text-primary transition-colors">{plate.name}</h3>

                <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Rentabilidad</p>
                    <p className={`text-2xl font-black ${margin > 70 ? 'text-emerald-500' : 'text-amber-500'}`}>{margin.toFixed(0)}%</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Precio Carta</p>
                    <p className="text-2xl font-black text-brand-black">${plate.sellingPrice.toLocaleString('en-US', { minimumFractionDigits: 0 })}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center border-t border-slate-50 pt-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Costo Técnico: <span className="text-brand-black font-bold ml-1">${cost.toFixed(2)}</span></p>
                  <button onClick={() => setSelectedPlate(plate)} className="btn btn-ghost px-3 py-2 text-[10px] group/btn flex items-center gap-1 uppercase tracking-widest">
                    Gestionar <span className="material-icons-round text-base group-hover/btn:translate-x-1 transition-transform">arrow_forward</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedPlate && (
        <div className="modal-overlay">
          <div className="modal-content max-w-5xl p-0 flex flex-col md:flex-row h-[85vh] overflow-hidden">

            {/* Left Column: Visual & Commercial Stats */}
            <div className="w-full md:w-[380px] bg-slate-50 border-r border-slate-100 flex flex-col shadow-inner">
              <div className="h-72 relative">
                <img src={selectedPlate.image} alt={selectedPlate.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-black/90 via- brand-black/20 to-transparent flex items-end p-8">
                  <div>
                    <span className="inline-block px-3 py-1 rounded-full bg-primary text-white text-[9px] font-black uppercase tracking-[0.2em] mb-3 shadow-lg">{selectedPlate.category}</span>
                    <h2 className="text-3xl font-heading font-black text-white leading-tight tracking-tight">{selectedPlate.name}</h2>
                  </div>
                </div>
              </div>

              <div className="p-8 space-y-8 flex-1 overflow-y-auto">
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Precio de Comercialización</p>
                  <p className="text-4xl font-heading font-black text-brand-black tracking-tighter">${selectedPlate.sellingPrice.toFixed(2)}</p>
                </div>

                <div className="grid grid-cols-2 gap-6 p-5 bg-white rounded-3xl border border-slate-200 shadow-sm">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Costo Insumos</p>
                    <p className="text-xl font-black text-brand-black">${calculateCost(selectedPlate.ingredients).toFixed(2)}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Margen Bruto</p>
                    <p className={`text-xl font-black ${((selectedPlate.sellingPrice - calculateCost(selectedPlate.ingredients)) / selectedPlate.sellingPrice * 100) > 70 ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {((selectedPlate.sellingPrice - calculateCost(selectedPlate.ingredients)) / selectedPlate.sellingPrice * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>

                <div className="p-6 bg-brand-black rounded-3xl text-white shadow-xl relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 w-20 h-20 bg-primary opacity-20 rounded-full blur-2xl group-hover:scale-150 transition-transform"></div>
                  <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] mb-4">Métrica de Tráfico</p>
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10">
                      <span className="material-icons-round text-primary text-3xl">trending_up</span>
                    </div>
                    <div>
                      <p className="text-3xl font-heading font-black">
                        {orders ? orders.reduce((acc, order) => {
                          return acc + (order.items?.filter(item => item.plateId === selectedPlate.id).reduce((sum, item) => sum + item.qty, 0) || 0);
                        }, 0) : 0}
                      </p>
                      <p className="text-[10px] text-white/50 font-black uppercase tracking-widest">Órdenes Despachadas</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Technical Details & Actions */}
            <div className="flex-1 flex flex-col bg-white">
              <header className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-20">
                <div>
                  <h3 className="font-heading font-black text-brand-black uppercase tracking-widest text-[11px]">Desglose Técnico de Receta</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5 tracking-tight">Vigencia Ficha: 2024.1</p>
                </div>
                <button onClick={() => setSelectedPlate(null)} className="w-10 h-10 rounded-full hover:bg-slate-50 flex items-center justify-center text-slate-400 transition-colors border border-slate-100">
                  <span className="material-icons-round text-xl">close</span>
                </button>
              </header>

              <div className="flex-1 overflow-y-auto p-0 custom-scrollbar">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest sticky top-0 z-10 border-b border-slate-100">
                    <tr>
                      <th className="px-8 py-5">Insumo</th>
                      <th className="px-8 py-5 text-right">Dosificación</th>
                      <th className="px-8 py-5 text-right">Incidencia Costo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedPlate.ingredients.map((item, idx) => {
                      const ing = ingredients.find(i => i.id === item.ingredientId);
                      return (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-4">
                              <span className="text-2xl bg-white p-2 rounded-xl shadow-sm border border-slate-100">{ing?.icon}</span>
                              <div>
                                <p className="text-sm font-black text-brand-black tracking-tight">{ing?.name}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{ing?.category}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <span className="text-sm font-black text-brand-black">{item.qty}</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase ml-1">{ing?.measureUnit}</span>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <span className="text-sm font-black text-primary">${(item.qty * (ing?.unitPrice || 0)).toFixed(3)}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <footer className="p-8 border-t border-slate-100 bg-slate-50 flex justify-end gap-4 shadow-[0_-10px_30px_rgba(0,0,0,0.02)]">
                <button className="btn btn-outline px-8 py-3 text-sm flex items-center gap-2" onClick={() => handleEditRequest(selectedPlate)}>
                  <span className="material-icons-round text-base">edit</span> Editar Receta
                </button>
                <button className="btn btn-primary px-8 py-3 text-sm flex items-center gap-2 shadow-primary/20" onClick={() => generatePDF(selectedPlate)}>
                  <span className="material-icons-round text-base">picture_as_pdf</span> Exportar Ficha Técnica
                </button>
              </footer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlatesView;
