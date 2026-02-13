
import React, { useState } from 'react';
import { Table, Order, Plate } from '../types';
import { supabase } from '../supabaseClient';

interface CashierViewProps {
   tables: Table[];
   orders: Order[];
   plates: Plate[];
   setTables: React.Dispatch<React.SetStateAction<Table[]>>;
   setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
}

const CashierView: React.FC<CashierViewProps> = ({ tables, orders, plates, setTables, setOrders }) => {
   const [processingTableId, setProcessingTableId] = useState<string | null>(null);
   const [showClosure, setShowClosure] = useState(false);
   const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');

   const activeBills = tables.filter(t => t.status === 'billing' || t.status === 'occupied');

   const handleStartPayment = (t: Table) => {
      setProcessingTableId(t.id || t.label);
   };

   const selectedTable = tables.find(t => (t.id || t.label) === processingTableId);
   const tableOrders = orders.filter(o => o.tableId === (selectedTable?.id || selectedTable?.label) && o.status !== 'paid');

   // Aggregate items and total
   const aggregateItems = tableOrders.flatMap(o => o.items);
   const aggregateTotal = tableOrders.reduce((acc, o) => acc + o.total, 0);

   const confirmPayment = async () => {
      if (!processingTableId || tableOrders.length === 0) return;

      try {
         // Optimistic Update
         setOrders(prev => prev.map(o => o.tableId === (selectedTable?.id || selectedTable?.label) ? { ...o, status: 'paid' } : o));
         setTables(prev => prev.map(t => (t.id || t.label) === processingTableId ? { ...t, status: 'available' } : t));

         const orderIds = tableOrders.map(o => o.id);
         const { error: orderErr } = await supabase.from('orders').update({ status: 'paid' }).in('id', orderIds);
         if (orderErr) throw orderErr;
         const { error: tableErr } = await supabase.from('tables').update({ status: 'available' }).eq('id', processingTableId);

         setProcessingTableId(null);
         setShowClosure(false); // Close if open, though usually not open here
      } catch (err) {
         console.error('Error processing payment:', err);
         // Revert on error would be ideal, but for now just logging
      }
   };

   const paidOrders = orders.filter(o => o.status === 'paid');
   const totalSales = paidOrders.reduce((acc, curr) => acc + curr.total, 0);

   return (
      <div className="p-8 space-y-8 animate-fadeIn">
         <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
               <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Caja y Facturación</h1>
               <p className="text-slate-500 mt-1">Procese cobros y supervise la facturación del turno.</p>
            </div>
            <button
               onClick={() => setShowClosure(true)}
               className="px-6 py-3 bg-white border-2 border-primary text-primary rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-primary hover:text-white transition-all shadow-md active:scale-95"
            >
               <span className="material-icons-round">summarize</span> Realizar Cierre de Turno
            </button>
         </header>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Listado de Mesas para Cobro */}
            <div className="lg:col-span-2 space-y-6">
               <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                     <h3 className="font-bold text-lg text-primary">Cuentas por Cobrar</h3>
                     <span className="text-xs font-bold text-slate-400 uppercase">{activeBills.length} Mesas en servicio</span>
                  </div>
                  <div className="overflow-x-auto">
                     <table className="w-full text-left">
                        <thead className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                           <tr>
                              <th className="px-6 py-4">Mesa</th>
                              <th className="px-6 py-4">Estado Pedido</th>
                              <th className="px-6 py-4 text-right">Total Pedido</th>
                              <th className="px-6 py-4 text-right">Acción</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                           {activeBills.map(table => {
                              const tOrders = orders.filter(o => o.tableId === (table.id || table.label) && o.status !== 'paid');
                              const tTotal = tOrders.reduce((acc, o) => acc + o.total, 0);
                              return (
                                 <tr key={table.id} className="hover:bg-slate-50 transition-all group">
                                    <td className="px-6 py-4">
                                       <div className="flex items-center gap-4">
                                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold shadow-sm border-2 ${table.status === 'billing' ? 'bg-amber-100 border-amber-200 text-amber-600' : 'bg-primary/5 border-primary/10 text-primary'}`}>
                                             {table.label}
                                          </div>
                                          <p className="font-bold text-slate-900 text-sm">{tOrders.length} comanda(s)</p>
                                       </div>
                                    </td>
                                    <td className="px-6 py-4">
                                       <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black border-2 ${table.status === 'billing' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                                          {table.status === 'billing' ? 'SOLICITÓ CUENTA' : 'EN SERVICIO'}
                                       </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-black text-slate-900 font-mono text-lg">${tTotal.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-right">
                                       <button
                                          onClick={() => handleStartPayment(table)}
                                          className="px-5 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary-light transition-all shadow-md group-hover:scale-105 active:scale-95"
                                       >
                                          Cobrar
                                       </button>
                                    </td>
                                 </tr>
                              );
                           })}
                           {activeBills.length === 0 && (
                              <tr><td colSpan={4} className="py-24 text-center opacity-30 flex flex-col items-center gap-4"><span className="material-icons-round text-6xl">check_circle</span><p className="font-bold">No hay mesas por cobrar</p></td></tr>
                           )}
                        </tbody>
                     </table>
                  </div>
               </div>

               <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                  <h3 className="font-bold text-lg text-primary mb-6">Resumen del Turno Actual</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     <div className="bg-emerald-50 border-2 border-emerald-100 rounded-3xl p-5 shadow-sm">
                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-2">Efectivo Proyectado</p>
                        <p className="text-3xl font-black text-emerald-700 font-mono">${(totalSales * 0.45).toFixed(2)}</p>
                     </div>
                     <div className="bg-blue-50 border-2 border-blue-100 rounded-3xl p-5 shadow-sm">
                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2">Tarjeta Proyectado</p>
                        <p className="text-3xl font-black text-blue-700 font-mono">${(totalSales * 0.55).toFixed(2)}</p>
                     </div>
                     <div className="bg-primary text-white rounded-3xl p-5 shadow-lg flex flex-col justify-between">
                        <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Total en Caja</p>
                        <p className="text-3xl font-black font-mono">${totalSales.toFixed(2)}</p>
                     </div>
                  </div>
               </div>
            </div>

            {/* Sidebar de Pago */}
            <aside className="bg-white rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden flex flex-col h-fit sticky top-8">
               <header className="bg-primary p-8 text-white text-center">
                  <h3 className="text-2xl font-black">Facturación</h3>
                  <p className="text-xs text-white/60 mt-2 font-bold uppercase tracking-widest">{processingTableId ? `Mesa ${processingTableId}` : 'ESPERANDO SELECCIÓN'}</p>
               </header>

               <div className="p-8 space-y-8">
                  {processingTableId && tableOrders.length > 0 ? (
                     <>
                        <div className="space-y-4 pb-6 border-b-2 border-dashed border-slate-100">
                           <div className="space-y-2">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Detalle del Pedido</p>
                              {aggregateItems.map((item, idx) => {
                                 const plate = plates.find(p => p.id === item.plateId);
                                 return (
                                    <div key={idx} className="flex justify-between items-start text-xs">
                                       <div className="flex-1">
                                          <p className="font-bold text-slate-700">{item.qty}x {plate?.name || 'Producto'}</p>
                                          {item.notes && <p className="text-[10px] text-amber-600">📝 {item.notes}</p>}
                                       </div>
                                       <span className="font-bold text-slate-800">${((plate?.sellingPrice || 0) * item.qty).toFixed(2)}</span>
                                    </div>
                                 );
                              })}
                           </div>
                           <div className="flex justify-between items-end pt-4 border-t border-slate-50">
                              <span className="font-black text-slate-900 text-lg">TOTAL COBRO</span>
                              <span className="text-4xl font-black text-primary font-mono">${aggregateTotal.toFixed(2)}</span>
                           </div>
                        </div>

                        <div className="space-y-6">
                           <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Método de Pago</label>
                              <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1">
                                 <button onClick={() => setPaymentMethod('cash')} className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${paymentMethod === 'cash' ? 'bg-white text-primary shadow-sm' : 'text-slate-400'}`}>EFECTIVO</button>
                                 <button onClick={() => setPaymentMethod('card')} className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${paymentMethod === 'card' ? 'bg-white text-primary shadow-sm' : 'text-slate-400'}`}>TARJETA</button>
                              </div>
                           </div>

                           <div className="pt-4 space-y-3">
                              <button
                                 onClick={confirmPayment}
                                 className="w-full py-5 bg-accent hover:bg-accent-hover text-white rounded-3xl font-black text-xl shadow-xl shadow-accent/30 transition-all transform active:scale-95 flex items-center justify-center gap-3"
                              >
                                 <span className="material-icons-round">print</span> Finalizar Pago
                              </button>
                              <button onClick={() => setProcessingTableId(null)} className="w-full py-4 text-slate-400 font-bold text-sm hover:text-slate-600 transition-colors uppercase tracking-widest">Cancelar Operación</button>
                           </div>
                        </div>
                     </>
                  ) : (
                     <div className="py-24 text-center space-y-6 opacity-30">
                        <span className="material-icons-round text-7xl text-slate-200">point_of_sale</span>
                        <p className="font-bold text-slate-400 text-sm max-w-[180px] mx-auto">Seleccione una mesa del listado para procesar el pago.</p>
                     </div>
                  )}
               </div>
            </aside>
         </div>

         {/* Modal de Cierre */}
         {showClosure && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
               <div className="absolute inset-0 bg-primary/90 backdrop-blur-md" onClick={() => setShowClosure(false)}></div>
               <div className="relative bg-white rounded-[40px] shadow-2xl w-full max-w-lg overflow-hidden animate-scaleUp">
                  <header className="p-10 text-center bg-slate-50/50">
                     <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner"><span className="material-icons-round text-5xl">fact_check</span></div>
                     <h3 className="text-3xl font-black text-primary">Cierre de Caja Diario</h3>
                     <p className="text-slate-400 font-bold text-xs uppercase mt-3 tracking-widest">Resumen Octubre 24, 2023 • Turno Tarde</p>
                  </header>
                  <div className="px-10 py-8 space-y-8">
                     <div className="grid grid-cols-2 gap-6">
                        <div className="p-6 bg-slate-50 rounded-3xl border-2 border-slate-100"><p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Ventas Netas</p><p className="text-2xl font-black text-primary font-mono">${totalSales.toFixed(2)}</p></div>
                        <div className="p-6 bg-slate-50 rounded-3xl border-2 border-slate-100"><p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Transacciones</p><p className="text-2xl font-black text-primary font-mono">{paidOrders.length}</p></div>
                     </div>
                     <div className="space-y-4">
                        <div className="flex justify-between items-center py-3 border-b-2 border-slate-50"><span className="text-sm font-bold text-slate-500">Tickets Promedio</span><span className="font-mono text-sm font-black text-primary">${paidOrders.length > 0 ? (totalSales / paidOrders.length).toFixed(2) : '0.00'}</span></div>
                        <div className="flex justify-between items-center py-3 border-b-2 border-slate-50"><span className="text-sm font-bold text-slate-500">Total Propinas Est.</span><span className="font-mono text-sm font-black text-primary">${(totalSales * 0.1).toFixed(2)}</span></div>
                     </div>
                  </div>
                  <footer className="p-10 bg-slate-50/80 border-t flex flex-col gap-4">
                     <button className="w-full py-5 bg-primary text-white rounded-[24px] font-black text-lg hover:bg-primary-light transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95"><span className="material-icons-round">cloud_upload</span> Sincronizar y Cerrar Turno</button>
                     <button onClick={() => setShowClosure(false)} className="text-sm font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest">Volver a la Caja</button>
                  </footer>
               </div>
            </div>
         )}
      </div>
   );
};

export default CashierView;
