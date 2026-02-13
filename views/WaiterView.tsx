
import React, { useState, useMemo, useEffect } from 'react';
import { Table, Plate, Order, OrderItem, User, Ingredient } from '../types';
import { supabase } from '../supabaseClient';

interface WaiterViewProps {
   tables: Table[];
   plates: Plate[];
   orders: Order[];
   setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
   setTables: React.Dispatch<React.SetStateAction<Table[]>>;
   branchId?: string | null;
   currentUser?: User | null;
   fetchOrders?: () => void;
   ingredients?: Ingredient[];
   restaurantId?: string | null;
   inventoryError?: string | null;
}

type ViewMode = 'tables' | 'order' | 'history' | 'serve' | 'summary';

const WaiterView: React.FC<WaiterViewProps> = ({ tables, plates, orders, setOrders, setTables, branchId, currentUser, fetchOrders, ingredients = [], restaurantId, inventoryError }) => {
   const [viewMode, setViewMode] = useState<ViewMode>('tables');
   const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
   const [cart, setCart] = useState<OrderItem[]>([]);
   const [searchTerm, setSearchTerm] = useState('');
   const [selectedCategory, setSelectedCategory] = useState('Todos');
   const [isLoading, setIsLoading] = useState(false);
   const [notification, setNotification] = useState<string | null>(null);
   const [tableViewType, setTableViewType] = useState<'grid' | 'list'>('grid');

   const selectedTable = tables.find(t => (t.id || t.label) === selectedTableId);
   const tableOrders = orders.filter(o => o.tableId === selectedTableId && !['paid', 'cancelled'].includes(o.status));
   const existingOrder = tableOrders[0];

   useEffect(() => {
      if (ingredients.length > 0) {
         const withStock = ingredients.filter(i => i.currentQty > 0);
         console.log(`[WaiterView] Received ${ingredients.length} ingredients. ${withStock.length} have stock > 0.`);
         if (withStock.length === 0 && ingredients.length > 0) {
            console.warn('[WaiterView] ALL ingredients have 0 stock. This is likely an RLS issue on the inventory table.');
         }
      } else {
         console.log('[WaiterView] No ingredients received.');
      }
   }, [ingredients]);

   // Helper to calculate stock based on ingredients
   const getPlateStock = (plate: Plate) => {
      if (!plate.ingredients || plate.ingredients.length === 0) return 999; // Assume unlimited if no ingredients defined

      let minStock = Infinity;
      plate.ingredients.forEach(pi => {
         const ing = ingredients.find(i => i.id === pi.ingredientId);
         if (!ing) {
            minStock = 0;
            return;
         }
         const possible = Math.floor(ing.currentQty / pi.qty);
         if (possible < minStock) minStock = possible;
      });

      return minStock === Infinity ? 0 : minStock;
   };

   const categories = useMemo(() => {
      const cats = new Set(plates.map(p => p.category));
      return ['Todos', ...Array.from(cats)];
   }, [plates]);

   const filteredPlates = useMemo(() => {
      return plates.filter(p => {
         const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
         const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
         return matchesSearch && matchesCategory && p.status === 'active';
      });
   }, [plates, searchTerm, selectedCategory]);

   const showNotification = (msg: string) => {
      setNotification(msg);
      setTimeout(() => setNotification(null), 4000);
   };

   // Ready orders notification
   const readyOrders = orders.filter(o => o.status === 'ready' && tables.some(t => (t.id || t.label) === o.tableId));

   // Table status helpers
   const getTableStatus = (table: Table) => {
      const activeOrders = orders.filter(o => o.tableId === (table.id || table.label) && !['paid', 'cancelled'].includes(o.status));
      if (activeOrders.length === 0) return 'available';

      // Prioritize "Ready to serve" (Purple)
      if (activeOrders.some(o => o.status === 'ready')) return 'ready';
      // Then "Billing" (Pink)
      if (activeOrders.some(o => o.status === 'billing')) return 'billing';
      // Then "Preparing" (Blue)
      if (activeOrders.some(o => o.status === 'preparing')) return 'preparing';

      // If none of the above but order exists, it is occupied
      return 'occupied';
   };

   const getTableStatusConfig = (status: string) => {
      const configs: Record<string, { label: string; color: string; bg: string; border: string; icon: string }> = {
         available: { label: 'Libre', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-300', icon: 'check_circle' },
         occupied: { label: 'Pedido Activo', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-300', icon: 'restaurant' },
         preparing: { label: 'En Cocina', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-300', icon: 'local_fire_department' },
         ready: { label: 'Listo para Servir', color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-400', icon: 'notifications_active' },
         billing: { label: 'Pendiente Cobro', color: 'text-pink-700', bg: 'bg-pink-50', border: 'border-pink-300', icon: 'point_of_sale' },
      };
      return configs[status] || configs.available;
   };

   const handleTableClick = (t: Table) => {
      const tableId = t.id || t.label;
      setSelectedTableId(tableId);
      const status = getTableStatus(t);
      if (status === 'ready') {
         setViewMode('serve');
      } else {
         setViewMode('order');
      }
      setCart([]);
   };

   const addToCart = (plate: Plate) => {
      const stock = getPlateStock(plate);
      setCart(prev => {
         const existing = prev.find(i => i.plateId === plate.id);
         const currentQty = existing ? existing.qty : 0;

         if (currentQty + 1 > stock) {
            showNotification(`\u26A0\uFE0F Stock insuficiente: solo quedan ${stock} unidades`);
            return prev;
         }

         if (existing) {
            return prev.map(i => i.plateId === plate.id ? { ...i, qty: i.qty + 1 } : i);
         }
         return [...prev, { plateId: plate.id, qty: 1, notes: '' }];
      });
   };

   const removeFromCart = (plateId: string) => {
      setCart(prev => prev.map(i => i.plateId === plateId ? { ...i, qty: i.qty - 1 } : i).filter(i => i.qty > 0));
   };

   const updateItemNote = (plateId: string, notes: string) => {
      setCart(prev => prev.map(i => i.plateId === plateId ? { ...i, notes } : i));
   };

   const calculateTotal = (items: OrderItem[]) => items.reduce((acc, curr) => {
      const plate = plates.find(p => p.id === curr.plateId);
      return acc + ((plate?.sellingPrice || 0) * curr.qty);
   }, 0);

   const getTableLabel = (tId: string) => {
      const t = tables.find(tb => (tb.id || tb.label) === tId);
      return t?.label || tId;
   };

   const handleSendToKitchen = async () => {
      if (!selectedTableId || cart.length === 0) return;

      // Final stock validation
      for (const item of cart) {
         const plate = plates.find(p => p.id === item.plateId);
         if (plate) {
            const stock = getPlateStock(plate);
            if (item.qty > stock) {
               showNotification(`\u274C No se puede enviar: ${plate.name} ahora tiene stock insuficiente (${stock} disp.)`);
               return;
            }
         }
      }

      setIsLoading(true);

      try {
         const total = calculateTotal(cart);
         const tableId = selectedTableId;
         const tableLabel = getTableLabel(tableId);

         // ALWAYS New order \u2192 insert into DB (to create separate kitchen tickets)
         const { data: orderData, error: orderErr } = await supabase.from('orders').insert({
            branch_id: branchId,
            table_id: tableId,
            waiter_id: currentUser?.id || null,
            status: 'pending',
            total,
         }).select().single();

         if (orderErr) throw orderErr;

         const itemInserts = cart.map(item => {
            return {
               order_id: orderData.id,
               recipe_id: item.plateId,
               quantity: item.qty,
               unit_price: plates.find(p => p.id === item.plateId)?.sellingPrice || 0,
               notes: item.notes || null,
            };
         });
         const { error: itemErr } = await supabase.from('order_items').insert(itemInserts);
         if (itemErr) throw itemErr;

         // --- STOCK DEDUCTION ---
         if (branchId && ingredients.length > 0) {
            try {
               // Calculate total deduction for this order
               const deductions: { [ingId: string]: number } = {};
               cart.forEach(item => {
                  const plate = plates.find(p => p.id === item.plateId);
                  if (plate?.ingredients) {
                     plate.ingredients.forEach(pi => {
                        deductions[pi.ingredientId] = (deductions[pi.ingredientId] || 0) + (pi.qty * item.qty);
                     });
                  }
               });

               // Execute deductions in DB
               for (const [ingId, qtyToDeduct] of Object.entries(deductions)) {
                  const currentIng = ingredients.find(i => i.id === ingId);
                  if (!currentIng) continue;

                  const newQty = Math.max(0, currentIng.currentQty - qtyToDeduct);

                  // Update Database
                  const { error: stockErr } = await supabase.from('inventory')
                     .update({ quantity_gr: newQty })
                     .match({ branch_id: branchId, ingredient_id: ingId });

                  if (stockErr) {
                     console.error(`Error updating stock for ${ingId}:`, stockErr);
                     // If it's a permission error, it might not throw but return error
                     if (stockErr.code === '42501') {
                        showNotification('⚠️ Error de permisos: No se pudo descontar del inventario. Ejecuta el SQL.');
                     }
                  }
               }
            } catch (stockErr) {
               console.error('Error during immediate stock deduction:', stockErr);
               showNotification('⚠️ Error al procesar inventario');
            }
         }

         // Update table status in DB to occupied
         await supabase.from('tables').update({ status: 'occupied' }).eq('id', tableId);
         setTables(prev => prev.map(t => (t.id || t.label) === tableId ? { ...t, status: 'occupied' } : t));

         if (fetchOrders) fetchOrders();
         showNotification(`🔥 Comanda enviada a cocina — ${tableLabel}`);

         setCart([]);
      } catch (err) {
         console.error(err);
         showNotification('\u274C Error al enviar pedido');
      } finally {
         setIsLoading(false);
      }
   };


   const handleMarkAsServed = async () => {
      const readyOrders = tableOrders.filter(o => o.status === 'ready');
      if (readyOrders.length === 0) return;
      setIsLoading(true);
      try {
         const orderIds = readyOrders.map(o => o.id);
         const now = new Date().toISOString();

         // First attempt: Standard update with audit fields
         const { error: firstError } = await supabase.from('orders').update({
            status: 'delivered',
            served_at: now,
            served_by: currentUser?.id
         }).in('id', orderIds);

         if (firstError) {
            console.warn('Retrying update without audit fields:', firstError);
            // Second attempt: Only status
            const { error: secondError } = await supabase.from('orders').update({
               status: 'delivered'
            }).in('id', orderIds);

            if (secondError) {
               console.error('Final served update failed:', secondError);
               showNotification('\u274C Error DB: No se puede marcar como entregado');
               if (fetchOrders) fetchOrders();
            } else {
               showNotification(`\u2705 Entregado (Sin datos de auditor\u00EDa)`);
               if (fetchOrders) fetchOrders();
            }
         } else {
            if (fetchOrders) fetchOrders();
            showNotification(`\u2705 Comanda(s) de ${getTableLabel(selectedTableId || '')} entregada(s)`);
            setViewMode('order');
         }
      } catch (err) {
         console.error(err);
         showNotification('\u274C Error al marcar como servido');
      } finally {
         setIsLoading(false);
      }
   };

   // History stats
   const myPaidOrders = orders.filter(o => o.status === 'paid' && o.waiterId === currentUser?.id);
   const totalSold = myPaidOrders.reduce((acc, o) => acc + o.total, 0);
   const myOrders = orders.filter(o => o.waiterId === currentUser?.id);

   // \u2500\u2500\u2500 TABLES VIEW \u2500\u2500\u2500
   const renderTablesView = () => (
      <div className="flex-1 overflow-y-auto bg-slate-50/50 animate-fadeIn text-slate-900">
         {/* Top bar */}
         <div className="bg-white border-b border-slate-200 px-6 py-4">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <span className="material-icons-round text-3xl text-primary">table_restaurant</span>
                  <div>
                     <h1 className="text-2xl font-black text-slate-900">Mis Mesas</h1>
                     <p className="text-xs text-slate-500">Vista de mesas activas</p>
                  </div>
               </div>
               <div className="flex items-center gap-2">
                  {/* View toggle */}
                  <button onClick={() => setTableViewType('grid')} className={`p-2 rounded-lg ${tableViewType === 'grid' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                     <span className="material-icons-round text-lg">grid_view</span>
                  </button>
                  <button onClick={() => setTableViewType('list')} className={`p-2 rounded-lg ${tableViewType === 'list' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                     <span className="material-icons-round text-lg">view_list</span>
                  </button>
                  <div className="w-px h-8 bg-slate-200 mx-2"></div>
                  <button onClick={() => setViewMode('history')} className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-bold text-slate-600 transition-all">
                     <span className="material-icons-round text-lg">history</span> Historial
                  </button>
                  <button onClick={() => setViewMode('summary')} className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 rounded-xl text-sm font-bold text-primary transition-all">
                     <span className="material-icons-round text-lg">analytics</span> Resumen
                  </button>
               </div>
            </div>

            {/* Status legend */}
            <div className="flex items-center gap-4 mt-4 flex-wrap">
               {['available', 'occupied', 'preparing', 'ready', 'billing'].map(status => {
                  const cfg = getTableStatusConfig(status);
                  return (
                     <div key={status} className="flex items-center gap-1.5 text-xs">
                        <span className={`w-3 h-3 rounded-full ${cfg.bg} border ${cfg.border}`}></span>
                        <span className={`font-semibold ${cfg.color}`}>{cfg.label}</span>
                     </div>
                  );
               })}
            </div>
         </div>

         {/* Ready orders notification bar */}
         {readyOrders.length > 0 && (
            <div className="mx-6 mt-4 p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-center gap-3 animate-pulse">
               <span className="material-icons-round text-purple-600 text-xl">notifications_active</span>
               <p className="text-sm font-bold text-purple-800">
                  {readyOrders.length} pedido(s) listo(s) para servir:
                  {[...new Set(readyOrders.map(o => getTableLabel(o.tableId)))].map(label => ` Mesa ${label}`).join(',')}
               </p>
            </div>
         )}

         {/* Tables Grid / List */}
         <div className={`p-6 ${tableViewType === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4' : 'space-y-2'}`}>
            {tables.map(table => {
               const status = getTableStatus(table);
               const cfg = getTableStatusConfig(status);
               const tableId = table.id || table.label;

               // Aggregate all active (unpaid) orders for this table
               const activeTableOrders = orders.filter(o => o.tableId === tableId && !['paid', 'cancelled'].includes(o.status));
               const tableTotal = activeTableOrders.reduce((acc, o) => acc + (o.total || 0), 0);

               if (tableViewType === 'list') {
                  return (
                     <button key={tableId} onClick={() => handleTableClick(table)}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 ${cfg.border} ${cfg.bg} hover:shadow-md transition-all`}>
                        <div className={`w-12 h-12 rounded-xl ${cfg.bg} border ${cfg.border} flex items-center justify-center`}>
                           <span className={`material-icons-round ${cfg.color}`}>{cfg.icon}</span>
                        </div>
                        <div className="flex-1 text-left">
                           <p className="font-black text-slate-800">{table.label}</p>
                           <p className={`text-xs font-bold ${cfg.color}`}>{cfg.label}</p>
                        </div>
                        <div className="text-right">
                           <p className="text-xs text-slate-400">{table.seats} personas</p>
                           {activeTableOrders.length > 0 && <p className="text-sm font-bold text-slate-700">${tableTotal.toFixed(2)}</p>}
                        </div>
                        <div className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap ${status === 'available' ? 'bg-emerald-600 text-white' :
                           status === 'occupied' || status === 'preparing' ? 'bg-blue-600 text-white' :
                              status === 'ready' ? 'bg-purple-600 text-white' :
                                 'bg-pink-600 text-white'
                           }`}>
                           {status === 'available' ? 'Abrir Mesa' :
                              status === 'occupied' ? 'A\u00F1adir' :
                                 status === 'preparing' ? 'Ver' :
                                    status === 'ready' ? 'Servir' :
                                       'Cuenta'}
                        </div>
                     </button>
                  );
               }

               return (
                  <button key={tableId} onClick={() => handleTableClick(table)}
                     className={`relative rounded-2xl border-2 ${cfg.border} ${cfg.bg} p-4 h-40 flex flex-col justify-between hover:shadow-lg transition-all transform active:scale-95`}>
                     {status === 'ready' && (
                        <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-purple-500 rounded-full animate-ping"></div>
                     )}
                     <div className="flex items-start justify-between w-full">
                        <span className="font-black text-lg text-slate-800">{table.label}</span>
                        <span className={`material-icons-round text-lg ${cfg.color}`}>{cfg.icon}</span>
                     </div>
                     <div className="text-left">
                        <p className={`text-xs font-bold ${cfg.color}`}>{cfg.label}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{table.seats} pers.</p>
                        {activeTableOrders.length > 0 && <p className="text-xs font-bold text-slate-700 mt-0.5">${tableTotal.toFixed(2)}</p>}
                     </div>
                     {/* Contextual action label */}
                     <div className={`w-full text-center py-1.5 rounded-xl text-xs font-black mt-1 ${status === 'available' ? 'bg-emerald-600 text-white' :
                        status === 'occupied' || status === 'preparing' ? 'bg-blue-600 text-white' :
                           status === 'ready' ? 'bg-purple-600 text-white' :
                              'bg-pink-600 text-white'
                        }`}>
                        {status === 'available' ? '\uD83D\uDFE2 Abrir Mesa' :
                           status === 'occupied' ? '\uD83D\uDCDD A\u00F1adir Platos' :
                              status === 'preparing' ? '\uD83D\uDC40 Ver Pedido' :
                                 status === 'ready' ? '\uD83D\uDD14 Servir' :
                                    '\uD83D\uDCB0 Ver Cuenta'}
                     </div>
                  </button>
               );
            })}
         </div>
      </div>
   );

   // \u2500\u2500\u2500 ORDER VIEW \u2500\u2500\u2500
   const renderOrderView = () => (
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden animate-fadeIn text-slate-900">
         {/* Menu */}
         <section className="flex-1 bg-slate-50 flex flex-col overflow-hidden">
            <header className="bg-white px-4 py-3 border-b border-slate-200 space-y-3">
               <div className="flex items-center gap-3">
                  <button onClick={() => { setViewMode('tables'); setSelectedTableId(null); setCart([]); }}
                     className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all">
                     <span className="material-icons-round">arrow_back</span>
                  </button>
                  <div className="flex-1">
                     <h2 className="font-black text-slate-800 text-lg">{getTableLabel(selectedTableId || '')}</h2>
                     <p className="text-xs text-slate-400">{tableOrders.length > 0 ? `${tableOrders.length} comanda(s) activas` : 'Nuevo pedido'}</p>
                  </div>
                  {tableOrders.length > 0 && (
                     <div className="flex gap-1.5">
                        {['pending', 'preparing', 'ready'].map(s => {
                           const count = tableOrders.filter(o => o.status === s).length;
                           if (count === 0) return null;
                           return (
                              <div key={s} className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 ${s === 'pending' ? 'bg-amber-100 text-amber-700' :
                                 s === 'preparing' ? 'bg-blue-100 text-blue-700' :
                                    'bg-emerald-100 text-emerald-700'
                                 }`}>
                                 <span className="material-icons-round text-xs">
                                    {s === 'pending' ? 'schedule' : s === 'preparing' ? 'local_fire_department' : 'check_circle'}
                                 </span>
                                 {count} {s === 'pending' ? 'Pend' : s === 'preparing' ? 'Prep' : 'Listo'}
                              </div>
                           );
                        })}
                     </div>
                  )}
               </div>

               {/* Search */}
               <div className="relative">
                  <span className="material-icons-round absolute left-3 top-2.5 text-slate-400 text-lg">search</span>
                  <input type="text" placeholder="Buscar plato..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                     className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/30" />
               </div>

               {/* Categories */}
               <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                  {categories.map(cat => (
                     <button key={cat} onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                        {cat}
                     </button>
                  ))}
               </div>
            </header>

            {/* Plates grid */}
            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
               {filteredPlates.map(plate => {
                  const inCart = cart.find(i => i.plateId === plate.id);
                  const stock = getPlateStock(plate);

                  return (
                     <div key={plate.id} onClick={() => stock > 0 ? addToCart(plate) : showNotification(`\u26A0\uFE0F ${plate.name} agotado`)}
                        className={`bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all border-2 border-transparent hover:border-primary group cursor-pointer transform active:scale-95 relative ${stock <= 0 ? 'opacity-60 grayscale' : ''}`}>
                        {inCart && (
                           <div className="absolute top-2 right-2 bg-primary text-white font-black text-xs w-6 h-6 rounded-full flex items-center justify-center z-10 shadow-md">{inCart.qty}</div>
                        )}
                        <div className="h-28 relative overflow-hidden">
                           <img src={plate.image} alt={plate.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                           <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold text-slate-800 shadow-sm">${plate.sellingPrice.toFixed(2)}</div>

                           {/* Stock badge */}
                           <div className={`absolute top-2 left-2 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-sm border ${stock <= 0 ? 'bg-red-500/90 text-white border-red-400' :
                              stock <= 5 ? 'bg-amber-500/90 text-white border-amber-400' :
                                 'bg-emerald-500/90 text-white border-emerald-400'
                              }`}>
                              {stock <= 0 ? 'Agotado' : `${stock} disp.`}
                           </div>
                        </div>
                        <div className="p-3">
                           <h4 className="font-bold text-slate-800 text-sm line-clamp-1">{plate.name}</h4>
                           <p className="text-[10px] text-slate-400">{plate.category}</p>
                        </div>
                     </div>
                  );
               })}
            </div>
         </section>

         {/* Cart / Order Panel */}
         <section className="w-full lg:w-96 bg-white border-l border-slate-200 flex flex-col shadow-2xl z-20 shrink-0">
            <header className="p-4 border-b border-slate-100 bg-slate-50/50">
               <div className="flex items-center justify-between">
                  <div>
                     <h3 className="font-black text-slate-900 text-lg">Pedido</h3>
                     <p className="text-xs text-slate-400">{getTableLabel(selectedTableId || '')}</p>
                  </div>
                  {cart.length > 0 && (
                     <button onClick={() => setCart([])} className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-all">
                        <span className="material-icons-round text-lg">delete_outline</span>
                     </button>
                  )}
               </div>
            </header>

            <div className="flex-1 overflow-y-auto">
               {/* Aggregate all active orders for the table */}
               {tableOrders.length > 0 && (
                  <div className="p-4 border-b border-slate-100 space-y-4">
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 mb-2">
                        <span className="material-icons-round text-xs">history</span> Comandas en Curso
                     </p>
                     {tableOrders.map((order, oIdx) => (
                        <div key={order.id} className={`rounded-2xl p-4 border-2 ${order.status === 'pending' ? 'bg-amber-50/50 border-amber-100' :
                           order.status === 'preparing' ? 'bg-blue-50/50 border-blue-100' :
                              order.status === 'ready' ? 'bg-emerald-50/50 border-emerald-100' :
                                 'bg-slate-50 border-slate-100'
                           }`}>
                           <div className="flex items-center justify-between mb-3">
                              <span className={`text-[10px] font-black uppercase tracking-wider ${order.status === 'pending' ? 'text-amber-700' :
                                 order.status === 'preparing' ? 'text-blue-700' :
                                    order.status === 'ready' ? 'text-emerald-700' :
                                       'text-slate-500'
                                 }`}>
                                 #{oIdx + 1} \u2022 {
                                    order.status === 'pending' ? '\u23F3 Pendiente' :
                                       order.status === 'preparing' ? '\uD83D\uDD25 Preparando' :
                                          order.status === 'ready' ? '\u2705 \u00A1Servir!' :
                                             order.status === 'served' ? '\uD83D\uDDB4 Servido' :
                                                order.status
                                 }
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">#{order.id.slice(-4).toUpperCase()}</span>
                           </div>

                           <div className="space-y-2">
                              {order.items.map((item, iIdx) => {
                                 const plate = plates.find(p => p.id === item.plateId);
                                 return (
                                    <div key={iIdx} className="flex justify-between items-start text-xs">
                                       <div className="flex-1 min-w-0 pr-2">
                                          <p className="font-bold text-slate-700">
                                             <span className="text-primary font-black mr-1">{item.qty}x</span>
                                             {plate?.name}
                                          </p>
                                          {item.notes && <p className="text-[10px] text-amber-600 leading-tight">\uD83D\uDCDD {item.notes}</p>}
                                       </div>
                                       <span className="font-bold text-slate-800">${((plate?.sellingPrice || 0) * item.qty).toFixed(2)}</span>
                                    </div>
                                 );
                              })}
                           </div>

                           <div className="mt-3 pt-3 border-t border-slate-200/50 flex justify-between items-center text-xs text-slate-400">
                              <span className="font-bold uppercase">Subtotal</span>
                              <span className="font-black text-slate-600">${calculateTotal(order.items).toFixed(2)}</span>
                           </div>
                        </div>
                     ))}
                  </div>
               )}

               {/* New items (cart) */}
               {cart.length > 0 ? (
                  <div className="p-4 space-y-3">
                     <p className="text-xs font-bold text-primary uppercase mb-1 flex items-center gap-1">
                        <span className="material-icons-round text-xs">add_circle</span> Nuevos Platos
                     </p>
                     {cart.map(item => {
                        const plate = plates.find(p => p.id === item.plateId);
                        return (
                           <div key={item.plateId} className="bg-slate-50 rounded-xl p-3 space-y-2">
                              <div className="flex items-center justify-between">
                                 <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <div className="flex items-center gap-1">
                                       <button onClick={(e) => { e.stopPropagation(); removeFromCart(item.plateId); }}
                                          className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all">
                                          <span className="material-icons-round text-sm">remove</span>
                                       </button>
                                       <span className="font-black text-slate-800 text-sm w-6 text-center">{item.qty}</span>
                                       <button onClick={(e) => { e.stopPropagation(); addToCart(plate!); }}
                                          className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-emerald-50 hover:text-emerald-500 hover:border-emerald-200 transition-all">
                                          <span className="material-icons-round text-sm">add</span>
                                       </button>
                                    </div>
                                    <p className="font-bold text-slate-800 text-sm truncate">{plate?.name}</p>
                                 </div>
                                 <span className="font-bold text-sm text-slate-800">${((plate?.sellingPrice || 0) * item.qty).toFixed(2)}</span>
                              </div>
                              {/* Notes input */}
                              <input type="text" placeholder="Nota: sin sal, t\u00E9rmino medio..."
                                 value={item.notes || ''} onChange={e => updateItemNote(item.plateId, e.target.value)}
                                 className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg placeholder:text-slate-300 focus:ring-1 focus:ring-primary/30" />
                           </div>
                        );
                     })}
                  </div>
               ) : tableOrders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-300 p-8">
                     <span className="material-icons-round text-5xl">restaurant_menu</span>
                     <p className="text-sm font-bold mt-3">Selecciona platos del men\u00FA</p>
                  </div>
               ) : null}
            </div>

            {/* Footer actions */}
            <footer className="p-4 border-t border-slate-100 bg-white space-y-3">
               {/* Totals */}
               <div className="space-y-1">
                  {tableOrders.length > 0 && cart.length > 0 && (
                     <div className="flex justify-between text-xs text-slate-400">
                        <span>Nuevos items</span>
                        <span className="font-bold">${calculateTotal(cart).toFixed(2)}</span>
                     </div>
                  )}
                  <div className="flex justify-between text-lg font-black text-primary">
                     <span>Total Mesa</span>
                     <span>${(tableOrders.reduce((acc, o) => acc + o.total, 0) + calculateTotal(cart)).toFixed(2)}</span>
                  </div>
               </div>

               {/* Send to kitchen */}
               {cart.length > 0 && (
                  <button disabled={isLoading} onClick={handleSendToKitchen}
                     className="w-full py-3.5 rounded-2xl font-black text-base bg-primary text-white hover:bg-primary-light transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20">
                     <span className="material-icons-round">local_fire_department</span>
                     {isLoading ? 'Enviando...' : tableOrders.length > 0 ? 'Enviar Adicional a Cocina' : 'Enviar a Cocina'}
                  </button>
               )}
            </footer>
         </section>
      </div>
   );

   // \u2500\u2500\u2500 HISTORY VIEW \u2500\u2500\u2500
   const renderHistoryView = () => (
      <div className="flex-1 overflow-y-auto animate-fadeIn text-slate-900">
         <div className="bg-white border-b border-slate-200 px-6 py-4">
            <div className="flex items-center gap-3">
               <button onClick={() => setViewMode('tables')} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all">
                  <span className="material-icons-round">arrow_back</span>
               </button>
               <div>
                  <h1 className="text-2xl font-black text-slate-900">Mi Historial</h1>
                  <p className="text-xs text-slate-500">Resumen de actividad</p>
               </div>
            </div>
         </div>

         {/* Stats cards */}
         <div className="p-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
               <div className="flex items-center gap-2 mb-2">
                  <span className="material-icons-round text-blue-500">receipt_long</span>
                  <span className="text-xs text-slate-400 font-bold uppercase">Mis Pedidos</span>
               </div>
               <p className="text-3xl font-black text-slate-800">{myOrders.length}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
               <div className="flex items-center gap-2 mb-2">
                  <span className="material-icons-round text-emerald-500">table_restaurant</span>
                  <span className="text-xs text-slate-400 font-bold uppercase">Mesas Atendidas</span>
               </div>
               <p className="text-3xl font-black text-slate-800">{new Set(myOrders.map(o => o.tableId)).size}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
               <div className="flex items-center gap-2 mb-2">
                  <span className="material-icons-round text-amber-500">payments</span>
                  <span className="text-xs text-slate-400 font-bold uppercase">Total Vendido</span>
               </div>
               <p className="text-3xl font-black text-slate-800">${totalSold.toFixed(0)}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
               <div className="flex items-center gap-2 mb-2">
                  <span className="material-icons-round text-purple-500">timer</span>
                  <span className="text-xs text-slate-400 font-bold uppercase">Promedio/Pedido</span>
               </div>
               <p className="text-3xl font-black text-slate-800">{myOrders.length > 0 ? `$${(totalSold / myOrders.length).toFixed(0)}` : '$0'}</p>
            </div>
         </div>

         {/* Orders list */}
         <div className="px-6 pb-6">
            <h2 className="font-black text-slate-700 mb-3">Mis Pedidos Recientes</h2>
            <div className="space-y-2">
               {myOrders.slice().reverse().map(order => (
                  <div key={order.id} className="bg-white rounded-xl p-4 border border-slate-100 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${order.status === 'paid' ? 'bg-emerald-100 text-emerald-600' :
                           order.status === 'preparing' ? 'bg-blue-100 text-blue-600' :
                              'bg-amber-100 text-amber-600'
                           }`}>
                           <span className="material-icons-round text-lg">
                              {order.status === 'paid' ? 'check_circle' : order.status === 'preparing' ? 'local_fire_department' : 'schedule'}
                           </span>
                        </div>
                        <div>
                           <p className="font-bold text-slate-800 text-sm">Mesa {getTableLabel(order.tableId)} \u2014 #{order.id.slice(-4)}</p>
                           <p className="text-xs text-slate-400">{order.items.length} platos \u2022 {new Date(order.timestamp).toLocaleTimeString()}</p>
                        </div>
                     </div>
                     <span className="font-black text-slate-800">${order.total.toFixed(2)}</span>
                  </div>
               ))}
            </div>
         </div>
      </div>
   );

   // \u2500\u2500\u2500 SUMMARY VIEW \u2500\u2500\u2500
   const renderSummaryView = () => {
      const today = new Date();
      const isToday = (date: Date) =>
         date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();

      const userOrders = orders.filter(o => {
         if (!o.timestamp) return false;
         return isToday(new Date(o.timestamp));
      });

      // 1. Total Orders Created by him today
      const createdByMe = userOrders.filter(o => o.waiterId === currentUser?.id);

      // 2. Total Delivered by him today (regardless of current status)
      const deliveredByMe = orders.filter(o => {
         if (o.servedBy !== currentUser?.id || !o.servedAt) return false;
         return isToday(new Date(o.servedAt));
      });

      // 3. Pending Delivery (Ready but not delivered by anyone yet, created by him)
      const pendingDelivery = orders.filter(o => o.status === 'ready' && o.waiterId === currentUser?.id);

      // 4. In Preparation (Created by him)
      const inPreparation = orders.filter(o => o.status === 'preparing' && o.waiterId === currentUser?.id);

      // 5. Avg Delivery Time
      const deliveredWithTime = deliveredByMe.filter(o => o.readyAt && o.servedAt);
      const avgDeliveryTime = deliveredWithTime.length > 0
         ? deliveredWithTime.reduce((acc, o) => {
            const start = new Date(o.readyAt!).getTime();
            const end = new Date(o.servedAt!).getTime();
            if (isNaN(start) || isNaN(end)) return acc;
            return acc + Math.max(0, end - start);
         }, 0) / deliveredWithTime.length / 1000 / 60
         : 0;

      return (
         <div className="flex-1 overflow-y-auto animate-fadeIn text-slate-900 bg-slate-50">
            <div className="bg-white border-b border-slate-200 px-6 py-4">
               <div className="flex items-center gap-3">
                  <button onClick={() => setViewMode('tables')} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all">
                     <span className="material-icons-round">arrow_back</span>
                  </button>
                  <div>
                     <h1 className="text-2xl font-black text-slate-900">Resumen de Actividad</h1>
                     <p className="text-xs text-slate-500">Hoy, {new Date().toLocaleDateString()}</p>
                  </div>
               </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {/* Created Today */}
               <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                     <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                        <span className="material-icons-round">edit_note</span>
                     </div>
                     <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-lg uppercase tracking-wider">Operativo</span>
                  </div>
                  <div>
                     <p className="text-3xl font-black text-slate-800">{createdByMe.length}</p>
                     <h3 className="text-sm font-bold text-slate-500">Pedidos Realizados</h3>
                     <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">Capacidad de toma de pedidos hoy</p>
                  </div>
               </div>

               {/* Delivered Today */}
               <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                     <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <span className="material-icons-round">delivery_dining</span>
                     </div>
                     <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg uppercase tracking-wider">Servicio</span>
                  </div>
                  <div>
                     <p className="text-3xl font-black text-slate-800">{deliveredByMe.length}</p>
                     <h3 className="text-sm font-bold text-slate-500">Pedidos Entregados</h3>
                     <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">Participaci\u00F3n en el servicio directo</p>
                  </div>
               </div>

               {/* Pending Delivery */}
               <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between ring-2 ring-purple-100">
                  <div className="flex items-center justify-between mb-4">
                     <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                        <span className="material-icons-round">notifications_active</span>
                     </div>
                     <span className="text-[10px] font-black text-purple-600 bg-purple-50 px-2 py-1 rounded-lg uppercase tracking-wider">Pendiente</span>
                  </div>
                  <div>
                     <p className="text-3xl font-black text-slate-800">{pendingDelivery.length}</p>
                     <h3 className="text-sm font-bold text-slate-500">Por Entregar</h3>
                     <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">Pedidos listos esperando servicio</p>
                  </div>
               </div>

               {/* In Preparation */}
               <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                     <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <span className="material-icons-round">local_fire_department</span>
                     </div>
                     <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg uppercase tracking-wider">Cocina</span>
                  </div>
                  <div>
                     <p className="text-3xl font-black text-slate-800">{inPreparation.length}</p>
                     <h3 className="text-sm font-bold text-slate-500">En Preparaci\u00F3n</h3>
                     <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">Tus pedidos actualmente en fuego</p>
                  </div>
               </div>

               {/* Avg Delivery Time */}
               <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                     <div className="w-12 h-12 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center">
                        <span className="material-icons-round">timer</span>
                     </div>
                     <span className="text-[10px] font-black text-pink-600 bg-pink-50 px-2 py-1 rounded-lg uppercase tracking-wider">Eficiencia</span>
                  </div>
                  <div>
                     <p className="text-3xl font-black text-slate-800">{avgDeliveryTime.toFixed(1)} <span className="text-sm">min</span></p>
                     <h3 className="text-sm font-bold text-slate-500">Tiempo de Entrega</h3>
                     <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">Promedio desde Cocina \u2192 Mesa</p>
                  </div>
               </div>
            </div>
         </div>
      );
   };

   return (
      <div className="flex flex-col h-full bg-slate-100 relative">
         {/* Notification toast */}
         {notification && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl font-bold text-sm flex items-center gap-2 animate-fadeIn">
               {notification}
            </div>
         )}

         {viewMode === 'tables' && renderTablesView()}
         {viewMode === 'order' && renderOrderView()}
         {viewMode === 'history' && renderHistoryView()}
         {viewMode === 'summary' && renderSummaryView()}
         {viewMode === 'serve' && (
            <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
               <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-slideUp">
                  <header className="p-6 bg-purple-600 text-white flex items-center justify-between">
                     <div>
                        <h2 className="text-2xl font-black">{getTableLabel(selectedTableId || '')}</h2>
                        <p className="text-purple-100 text-sm font-bold">Resumen para servir</p>
                     </div>
                     <button onClick={() => { setViewMode('tables'); setSelectedTableId(null); }} className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-all">
                        <span className="material-icons-round">close</span>
                     </button>
                  </header>
                  <div className="p-6">
                     <div className="space-y-4 max-h-[50vh] overflow-y-auto mb-6 pr-2 text-slate-900">
                        {tableOrders.filter(o => o.status === 'ready').flatMap(o => o.items).map((item, idx) => {
                           const plate = plates.find(p => p.id === item.plateId);
                           return (
                              <div key={idx} className="flex items-start justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                 <div className="flex items-start gap-3">
                                    <span className="bg-purple-100 text-purple-700 font-black text-lg w-10 h-10 rounded-xl flex items-center justify-center shrink-0">{item.qty}</span>
                                    <div>
                                       <p className="font-bold text-slate-800 text-base">{plate?.name}</p>
                                       {item.notes && <p className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-md inline-block mt-1">\uD83D\uDCDD {item.notes}</p>}
                                    </div>
                                 </div>
                                 <span className="font-black text-slate-800">${((plate?.sellingPrice || 0) * item.qty).toFixed(2)}</span>
                              </div>
                           );
                        })}
                     </div>
                     <div className="flex items-center justify-between p-4 bg-slate-900 rounded-2xl text-white mb-6">
                        <span className="text-sm font-bold text-slate-400">TOTAL A SERVIR</span>
                        <span className="text-2xl font-black">
                           ${tableOrders.filter(o => o.status === 'ready').reduce((acc, o) => acc + o.total, 0).toFixed(2)}
                        </span>
                     </div>
                     <button disabled={isLoading} onClick={handleMarkAsServed}
                        className="w-full py-4 rounded-2xl bg-purple-600 text-white font-black text-lg hover:bg-purple-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-purple-600/30">
                        <span className="material-icons-round">check_circle</span>
                        {isLoading ? 'Cargando...' : 'Comanda Entregada'}
                     </button>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default WaiterView;
