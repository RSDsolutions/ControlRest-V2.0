import React, { useState, useEffect, useMemo } from 'react';
import { Table, Order, Plate, User } from '../types';
import { supabase } from '../supabaseClient';
import { useRealtimeOrders } from '../hooks/useRealtimeOrders';
import { useCashSession } from '../hooks/useCashSession';
import { useCloseOrderMutation, useCloseOrderSplitMutation } from '../hooks/useOrderMutations';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface CashierViewProps {
   tables: Table[];
   orders: Order[]; // Keep for prop compatibility but prefer hook data
   plates: Plate[];
   setTables: React.Dispatch<React.SetStateAction<Table[]>>;
   setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
   branchId?: string | null;
   currentUser: User | null;
}

const CashierView: React.FC<CashierViewProps> = ({ tables, plates, setTables, branchId, currentUser }) => {
   // 1. HYBRID REALTIME: Use the hook to get orders + polling
   const { orders, refresh: refreshOrders } = useRealtimeOrders(branchId || null);
   const { isOnline } = useOnlineStatus();
   const closeOrderMutation = useCloseOrderMutation(branchId || null);
   const closeOrderSplitMutation = useCloseOrderSplitMutation(branchId || null);

   // 2. CASH SESSION HOOK
   const { session, loading: loadingSession, openSession, closeSession, refreshSession } = useCashSession(branchId || null);

   const [processingTableId, setProcessingTableId] = useState<string | null>(null);
   const [showClosure, setShowClosure] = useState(false);
   const [showSplitPayment, setShowSplitPayment] = useState(false);

   // Payment split state (Using strings to allow easy manual entry of decimals)
   const [splitPayments, setSplitPayments] = useState({
      CASH: '',
      CARD: '',
      TRANSFER: '',
      OTHER: ''
   });

   // Form states
   const [openingCash, setOpeningCash] = useState<string>('');
   const [openingComment, setOpeningComment] = useState<string>('');

   const [countedCash, setCountedCash] = useState<string>('');
   const [countedCard, setCountedCard] = useState<string>('');
   const [countedTransfer, setCountedTransfer] = useState<string>('');
   const [countedOther, setCountedOther] = useState<string>('');
   const [closingComment, setClosingComment] = useState<string>('');

   const [closingSummary, setClosingSummary] = useState<any>(null);

   // Derived state from session
   const currentShift = session;
   const loadingShift = loadingSession;

   const handleOpenShift = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
         if (!currentUser) return alert('No hay usuario activo.');

         const targetBranchId = branchId || currentUser.branchId;
         if (!targetBranchId) return alert('No tienes una sucursal asignada.');

         await openSession(parseFloat(openingCash), openingComment, currentUser.id);
         setOpeningCash('');
         setOpeningComment('');

      } catch (err: any) {
         alert('Error abriendo caja: ' + err.message);
      }
   };

   const handleCloseShiftCalculation = async () => {
      if (!currentShift) return;

      try {
         const result: any = await closeSession(
            parseFloat(countedCash || '0'),
            parseFloat(countedCard || '0'),
            parseFloat(countedTransfer || '0'),
            parseFloat(countedOther || '0'),
            closingComment,
            currentUser?.id || ''
         );

         // === ACCOUNTING PERIOD LOCK ===
         // After the session is closed, lock the date for this branch so no
         // retroactive financial data can be inserted or modified for that date.
         const lockDate = new Date(currentShift.openedAt).toISOString().split('T')[0];
         const { error: lockError } = await supabase
            .from('accounting_period_locks')
            .upsert(
               {
                  branch_id: currentShift.branchId,
                  lock_date: lockDate,
                  cash_session_id: currentShift.id,
                  locked_by: currentUser?.id ?? null,
               },
               { onConflict: 'branch_id,lock_date', ignoreDuplicates: true }
            );
         if (lockError) {
            // Non-fatal: lock table write failure should not block the cashier UI
            console.warn('[AccountingLock] Could not write period lock:', lockError.message);
         }
         // ==============================

         // Result contains { id, expected_cash, difference }
         setClosingSummary({
            expected: result.expected_cash,
            difference: result.difference
         });
         // The hook usually updates 'session' to null or closed status after refresh
         // But here we want to show the specific summary of THIS closure.
      } catch (err: any) {
         alert('Error cerrando turno: ' + err.message);
      }
   };

   const activeBills = tables.filter(t => (t.status === 'billing' || t.status === 'occupied') && orders.some(o => !o.optimistic && o.tableId === (t.id || t.label) && o.status !== 'paid'));

   const handleStartPayment = (t: Table) => {
      setProcessingTableId(t.id || t.label);
      setSplitPayments({ CASH: '', CARD: '', TRANSFER: '', OTHER: '' });
   };

   const selectedTable = tables.find(t => (t.id || t.label) === processingTableId);
   const tableOrders = orders.filter(o => !o.optimistic && o.tableId === (selectedTable?.id || selectedTable?.label) && o.status !== 'paid');

   // Aggregate items and total
   const aggregateItems = tableOrders.flatMap(o => o.items);
   const aggregateTotal = tableOrders.reduce((acc, o) => acc + o.total, 0);

   const confirmPayment = async () => {
      if (!processingTableId || tableOrders.length === 0) return;
      if (!currentShift) {
         alert('No hay turno de caja abierto.');
         return;
      }

      const totalPaid = (Object.values(splitPayments) as string[]).reduce((a, b) => a + parseFloat(b || '0'), 0);
      if (Math.abs(totalPaid - aggregateTotal) > 0.01) {
         alert(`El monto total ($${totalPaid.toFixed(2)}) no coincide con el total de la orden ($${aggregateTotal.toFixed(2)})`);
         return;
      }

      try {
         const orderIds = tableOrders.map(o => o.id);
         const paymentsPayload = Object.entries(splitPayments)
            .filter(([_, amount]) => parseFloat((amount as string) || '0') > 0)
            .map(([method, amount]) => ({ method: method as any, amount: parseFloat((amount as string) || '0') }));

         const result = await closeOrderSplitMutation.mutateAsync({
            p_order_ids: orderIds,
            p_payments: paymentsPayload,
            p_cash_session_id: currentShift.id
         });

         setProcessingTableId(null);
         setShowSplitPayment(false);
         setSplitPayments({ CASH: '', CARD: '', TRANSFER: '', OTHER: '' });

         if (result?.isOffline) {
            alert('📴 Sin conexión — el pago se guardó localmente y se procesará automáticamente al reconectar.');
         }
      } catch (err: any) {
         alert('Error al procesar pago: ' + err.message);
      }
   };

   // Calculate Shift Stats from loaded orders (approximate if pagination)
   const currentShiftOrders = useMemo(() =>
      orders.filter(o => o.shiftId === currentShift?.id && o.status === 'paid'), // Assuming we add shiftId to Order type in frontend or it comes from DB
      [orders, currentShift]);

   const dailyCashSales = currentShiftOrders.filter(o => o.paymentMethod === 'cash').reduce((acc, curr) => acc + curr.total, 0);
   const dailyCardSales = currentShiftOrders.filter(o => o.paymentMethod === 'card').reduce((acc, curr) => acc + curr.total, 0);
   const totalSales = dailyCashSales + dailyCardSales;

   if (loadingShift) return <div className="p-10 text-center">Cargando estado de caja...</div>;

   // BLOCKING MODAL: Open Shift
   if (!currentShift && !closingSummary) {
      return (
         <div className="flex flex-col items-center justify-center h-full min-h-[500px] animate-fadeIn">
            <div className="bg-white p-10 rounded-[40px] shadow-2xl w-full max-w-md text-center border border-slate-100">
               <div className="w-24 h-24 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="material-icons-round text-5xl">lock_open</span>
               </div>
               <h2 className="text-3xl font-black text-slate-800 mb-2">Apertura de Caja</h2>
               <p className="text-slate-500 mb-8">Inicia tu turno ingresando el monto base en efectivo.</p>

               <form onSubmit={handleOpenShift} className="text-left space-y-6">
                  <div>
                     <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">opening_cash_amount (required)</label>
                     <div className="relative">
                        <input
                           type="number"
                           min="0"
                           step="0.01"
                           required
                           autoFocus
                           className="w-full pl-10 pr-4 py-4 rounded-xl border border-slate-200 font-bold text-xl text-slate-800 focus:ring-4 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                           placeholder="0.00"
                           value={openingCash}
                           onChange={e => setOpeningCash(e.target.value)}
                        />
                        <span className="absolute left-4 top-4.5 text-slate-400 text-lg">$</span>
                     </div>
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">opening_comment (optional)</label>
                     <textarea
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 font-medium text-slate-700 focus:ring-4 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        rows={2}
                        placeholder="Ej. Dinero para cambio..."
                        value={openingComment}
                        onChange={e => setOpeningComment(e.target.value)}
                     />
                  </div>
                  <button type="submit" className="w-full py-4 bg-primary text-white font-black rounded-xl text-lg shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all">
                     → Abrir Caja
                  </button>
               </form>
            </div>
         </div>
      );
   }

   // CLOSING SUMMARY
   if (closingSummary) {
      return (
         <div className="flex flex-col items-center justify-center h-full min-h-[500px] animate-fadeIn">
            <div className="bg-white p-10 rounded-[40px] shadow-2xl w-full max-w-lg text-center border border-slate-100 relative overflow-hidden">
               <div className={`absolute top-0 left-0 w-full h-2 ${closingSummary.difference === 0 ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
               <div className="w-24 h-24 bg-slate-50 text-slate-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="material-icons-round text-5xl">check_circle</span>
               </div>
               <h2 className="text-3xl font-black text-slate-800 mb-2">Turno Cerrado Correctamente</h2>
               <p className="text-slate-500 mb-8">Resumen de la operación de cierre.</p>

               <div className="space-y-4 bg-slate-50 p-6 rounded-3xl border border-slate-200 mb-8">
                  <div className="flex justify-between items-center">
                     <span className="text-slate-500 font-bold">Efectivo Esperado</span>
                     <span className="text-xl font-mono font-black text-slate-700">${closingSummary.expected.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                     <span className="text-slate-500 font-bold">Diferencia</span>
                     <span className={`text-xl font-mono font-black ${closingSummary.difference === 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        ${closingSummary.difference.toFixed(2)}
                     </span>
                  </div>
               </div>

               <button onClick={() => setClosingSummary(null)} className="text-slate-400 font-bold hover:text-slate-600 uppercase tracking-widest text-sm">
                  Volver al inicio
               </button>
            </div>
         </div>
      );
   }
   console.log('[CashierView] Render - Orders:', orders.length);

   return (
      <div className="p-8 space-y-8 animate-fadeIn">
         <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
               <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Caja y Facturación</h1>
               <div className="flex items-center gap-2 mt-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <p className="text-slate-500 text-sm font-bold">Turno Abierto • {new Date(currentShift!.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
               </div>
            </div>
            <button
               onClick={() => setShowClosure(true)}
               className="px-6 py-3 bg-white border-2 border-primary text-primary rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-primary hover:text-white transition-all shadow-md active:scale-95"
            >
               <span className="material-icons-round">lock_clock</span> Cerrar Turno
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
                                       {tOrders.every(o => o.status === 'delivered' || o.status === 'paid') ? (
                                          <button
                                             onClick={() => handleStartPayment(table)}
                                             className="px-5 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary-light transition-all shadow-md group-hover:scale-105 active:scale-95"
                                          >
                                             Cobrar
                                          </button>
                                       ) : (
                                          <span className="px-3 py-1.5 bg-slate-100 text-slate-400 rounded-lg text-[10px] font-bold uppercase tracking-wide cursor-not-allowed" title="Hay pedidos pendientes de entrega">
                                             En Servicio
                                          </span>
                                       )}
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
                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-2">Ventas Efectivo</p>
                        <p className="text-3xl font-black text-emerald-700 font-mono">${dailyCashSales.toFixed(2)}</p>
                     </div>
                     <div className="bg-blue-50 border-2 border-blue-100 rounded-3xl p-5 shadow-sm">
                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2">Ventas Tarjeta</p>
                        <p className="text-3xl font-black text-blue-700 font-mono">${dailyCardSales.toFixed(2)}</p>
                     </div>
                     <div className="bg-primary text-white rounded-3xl p-5 shadow-lg flex flex-col justify-between">
                        <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Total Ventas</p>
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
                           <div className="pt-4 space-y-3">
                              <button
                                 onClick={() => setShowSplitPayment(true)}
                                 className="w-full py-5 bg-accent hover:bg-accent-hover text-white rounded-3xl font-black text-xl shadow-xl shadow-accent/30 transition-all transform active:scale-95 flex items-center justify-center gap-3"
                              >
                                 <span className="material-icons-round">payments</span> Procesar Pago
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
                     <h3 className="text-3xl font-black text-primary">Cierre de Caja</h3>
                     <p className="text-slate-400 font-bold text-xs uppercase mt-3 tracking-widest">Confirme el efectivo en caja para cerrar.</p>
                  </header>
                  <div className="px-10 py-8 space-y-6 max-h-[400px] overflow-y-auto">
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">counted_cash_efectivo</label>
                           <div className="relative">
                              <input
                                 type="number" min="0" step="0.01" className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-200 font-bold text-slate-800 outline-none"
                                 value={countedCash} onChange={e => setCountedCash(e.target.value)}
                              />
                              <span className="absolute left-3 top-3.5 text-slate-400">$</span>
                           </div>
                        </div>
                        <div>
                           <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">counted_cash_tarjeta</label>
                           <div className="relative">
                              <input
                                 type="number" min="0" step="0.01" className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-200 font-bold text-slate-800 outline-none"
                                 value={countedCard} onChange={e => setCountedCard(e.target.value)}
                              />
                              <span className="absolute left-3 top-3.5 text-slate-400">$</span>
                           </div>
                        </div>
                        <div>
                           <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">counted_cash_transferencia</label>
                           <div className="relative">
                              <input
                                 type="number" min="0" step="0.01" className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-200 font-bold text-slate-800 outline-none"
                                 value={countedTransfer} onChange={e => setCountedTransfer(e.target.value)}
                              />
                              <span className="absolute left-3 top-3.5 text-slate-400">$</span>
                           </div>
                        </div>
                        <div>
                           <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">counted_cash_otro</label>
                           <div className="relative">
                              <input
                                 type="number" min="0" step="0.01" className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-200 font-bold text-slate-800 outline-none"
                                 value={countedOther} onChange={e => setCountedOther(e.target.value)}
                              />
                              <span className="absolute left-3 top-3.5 text-slate-400">$</span>
                           </div>
                        </div>
                     </div>
                     <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">closing_comment</label>
                        <textarea
                           className="w-full px-4 py-3 rounded-xl border border-slate-200 font-medium text-slate-700 outline-none"
                           rows={2}
                           value={closingComment} onChange={e => setClosingComment(e.target.value)}
                        />
                     </div>
                  </div>
                  <footer className="p-10 bg-slate-50/80 border-t flex flex-col gap-4">
                     <button
                        onClick={handleCloseShiftCalculation}
                        className="w-full py-5 bg-primary text-white rounded-[24px] font-black text-lg hover:bg-primary-light transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95"
                     >
                        <span className="material-icons-round">lock</span> → Cerrar Caja
                     </button>
                     <button onClick={() => setShowClosure(false)} className="text-sm font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest">Cancelar</button>
                  </footer>
               </div>
            </div>
         )}

         {/* Modal de Pago Dividido */}
         {showSplitPayment && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
               <div className="absolute inset-0 bg-primary/90 backdrop-blur-md" onClick={() => setShowSplitPayment(false)}></div>
               <div className="relative bg-white rounded-[40px] shadow-2xl w-full max-w-lg overflow-hidden animate-scaleUp">
                  <header className="p-10 text-center bg-accent/90 text-white">
                     <div className="w-24 h-24 bg-white/10 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner"><span className="material-icons-round text-5xl">payments</span></div>
                     <h3 className="text-3xl font-black">Pago Dividido</h3>
                     <p className="text-white/70 font-bold text-xs uppercase mt-3 tracking-widest">Mesa {processingTableId} • Total: ${aggregateTotal.toFixed(2)}</p>
                  </header>
                  <div className="px-10 py-8 space-y-6">
                     {Object.entries(splitPayments).map(([method, amount]) => (
                        <div key={method}>
                           <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                              {method === 'CASH' ? 'efectivo' : method === 'CARD' ? 'tarjeta' : method === 'TRANSFER' ? 'transferencia' : 'otro'}
                           </label>
                           <div className="relative">
                              <input
                                 type="number"
                                 min="0"
                                 step="0.01"
                                 className="w-full pl-10 pr-4 py-4 rounded-xl border border-slate-200 font-bold text-xl text-slate-800 focus:ring-4 focus:ring-accent/20 focus:border-accent outline-none transition-all"
                                 placeholder="0.00"
                                 value={amount}
                                 onChange={e => setSplitPayments(prev => ({ ...prev, [method]: e.target.value }))}
                              />
                              <span className="absolute left-4 top-4.5 text-slate-400 text-lg">$</span>
                           </div>
                        </div>
                     ))}
                     <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                        <span className="font-black text-slate-900 text-lg">Monto Pendiente</span>
                        <span className={`text-3xl font-black font-mono ${aggregateTotal - (Object.values(splitPayments) as string[]).reduce((a, b) => a + parseFloat(b || '0'), 0) > 0.01 ? 'text-red-500' : 'text-emerald-500'}`}>
                           ${(aggregateTotal - (Object.values(splitPayments) as string[]).reduce((a, b) => a + parseFloat(b || '0'), 0)).toFixed(2)}
                        </span>
                     </div>
                  </div>
                  <footer className="p-10 bg-slate-50/80 border-t flex flex-col gap-4">
                     <button
                        onClick={confirmPayment}
                        disabled={Math.abs((Object.values(splitPayments) as string[]).reduce((a, b) => a + parseFloat(b || '0'), 0) - aggregateTotal) > 0.01}
                        className="w-full py-5 bg-accent text-white rounded-[24px] font-black text-lg hover:bg-accent-hover transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                        <span className="material-icons-round">check_circle</span> Confirmar Pago
                     </button>
                     <button onClick={() => setShowSplitPayment(false)} className="text-sm font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest">Cancelar</button>
                  </footer>
               </div>
            </div>
         )}
      </div>
   );
};

export default CashierView;
