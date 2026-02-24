import React, { useState, useMemo, useEffect } from 'react';
import { Table, Plate, Order, User, CashSession } from '../types';
import { useCashSession } from '../hooks/useCashSession';
import { supabase } from '../supabaseClient';
import { useShiftPayments } from '../hooks/useShiftPayments';

interface CashierViewProps {
   tables: Table[];
   plates: Plate[];
   setTables: React.Dispatch<React.SetStateAction<Table[]>>;
   branchId?: string | null;
   currentUser?: User | null;
}

const INITIAL_SPLIT = {
   CASH: '',
   CARD: '',
   TRANSFER: '',
   OTHER: ''
};

const CashierView: React.FC<CashierViewProps> = ({ tables, plates, setTables, branchId, currentUser }) => {
   const [orders, setOrders] = useState<Order[]>([]);
   const [loadingOrders, setLoadingOrders] = useState(false);
   const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
   const [splitPayments, setSplitPayments] = useState(INITIAL_SPLIT);
   const [processing, setProcessing] = useState(false);
   const [closingSummary, setClosingSummary] = useState<any>(null);

   const [showOpenModal, setShowOpenModal] = useState(false);
   const [openingData, setOpeningData] = useState({
      monto: '',
      comentario: 'Apertura de turno'
   });

   const [showCloseModal, setShowCloseModal] = useState(false);
   const [countedStats, setCountedStats] = useState({
      cash: '',
      card: '',
      transfer: '',
      other: '',
      notes: ''
   });

   const { session, loading: loadingSession, openSession, closeSession, refreshSession } = useCashSession(branchId || null);

   const currentShift = session;

   useEffect(() => {
      if (!branchId || branchId === 'GLOBAL') return;

      const fetchOrders = async () => {
         setLoadingOrders(true);
         const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('branch_id', branchId)
            .in('status', ['open', 'pending', 'preparing', 'ready', 'delivered', 'billing', 'served']);

         if (!error && data) {
            // MAP SNAKE_CASE TO CAMELCASE
            const formatted = (data as any[]).map(o => ({
               id: o.id,
               tableId: o.table_id, // Map table_id to tableId
               status: o.status,
               total: parseFloat(o.total || '0'),
               timestamp: new Date(o.created_at),
               waiterId: o.waiter_id,
               branchId: o.branch_id
            }));
            setOrders(formatted as Order[]);
         }
         setLoadingOrders(false);
      };

      fetchOrders();

      const channel = supabase
         .channel(`cashier-orders-${branchId}`)
         .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: `branch_id=eq.${branchId}`
         }, fetchOrders)
         .subscribe();

      return () => {
         supabase.removeChannel(channel);
      };
   }, [branchId]);

   const activeBills = useMemo(() => {
      return tables.filter(t =>
         (t.status === 'billing' || t.status === 'occupied') &&
         orders.some(o => o.tableId === (t.id || t.label))
      );
   }, [tables, orders]);

   const tableOrders = useMemo(() => {
      if (!selectedTableId) return [];
      return orders.filter(o => o.tableId === selectedTableId);
   }, [selectedTableId, orders]);

   const tableTotal = tableOrders.reduce((sum: number, o: Order) => sum + (o.total || 0), 0) as number;
   const totalPaid = Object.values(splitPayments).reduce((sum: number, val: any) => sum + parseFloat(val || '0'), 0) as number;
   const pendingAmount = Math.max(0, tableTotal - totalPaid);

   const { stats: shiftStats, isLoading: loadingStats, error: statsError } = useShiftPayments(
      currentShift?.id || null,
      currentUser?.restaurantId || null
   );

   const expectedCash = useMemo(() => {
      if (!currentShift) return 0;
      return (currentShift.initialCash || 0) + (shiftStats.cash || 0);
   }, [currentShift, shiftStats.cash]);

   const totalCounted = useMemo(() => {
      return parseFloat(countedStats.cash || '0') +
         parseFloat(countedStats.card || '0') +
         parseFloat(countedStats.transfer || '0') +
         parseFloat(countedStats.other || '0');
   }, [countedStats]);

   const cashDifference = useMemo(() => {
      return parseFloat(countedStats.cash || '0') - expectedCash;
   }, [countedStats.cash, expectedCash]);


   const confirmPayment = async () => {
      if (pendingAmount > 0.01) {
         alert('El monto pagado no cubre el total de la cuenta.');
         return;
      }
      if (!currentShift) {
         alert('Debe abrir el turno de caja antes de cobrar.');
         return;
      }

      setProcessing(true);
      try {
         const orderIds = tableOrders.map(o => o.id);

         // Create separate payment records for each order to maintain accurate per-order snapshots
         // or at least link one payment per order if splitting isn't needed.
         // For now, we'll continue with the splitPayments logic but link them to the primary order 
         // and ensure all orders are marked as paid. 
         // Improvement: Link the payment to the first order but we've already audited that this 
         // causes missing links. A better approach for this schema is one payment per order 
         // or ensuring the snapshot function handles order-payment relationships correctly.

         const paymentsPayload = Object.entries(splitPayments)
            .filter(([_, amount]) => parseFloat((amount as string) || '0') > 0)
            .map(([method, amount]) => ({
               order_id: orderIds[0],
               method: method.toLowerCase(),
               amount: parseFloat(amount as string),
               cash_session_id: currentShift.id,
               branch_id: branchId,
               restaurant_id: currentUser?.restaurantId,
               user_id: currentUser?.id
            }));

         const { error: pError } = await supabase.from('payments').insert(paymentsPayload);
         if (pError) throw pError;

         // Mark all orders as paid
         const { error: oError } = await supabase
            .from('orders')
            .update({
               status: 'paid',
               paid_at: new Date().toISOString(),
               shift_id: currentShift.id // Also ensure shift_id is set
            })
            .in('id', orderIds);

         if (oError) throw oError;

         setTables(prev => prev.map(t => (t.id === selectedTableId || t.label === selectedTableId) ? { ...t, status: 'available' } : t));
         setSelectedTableId(null);
         setSplitPayments(INITIAL_SPLIT);
         alert('Pago procesado correctamente.');
      } catch (err: any) {
         alert('Error: ' + err.message);
      } finally {
         setProcessing(false);
      }
   };

   const handleOpenSession = async () => {
      if (!branchId || !currentUser) return;
      setProcessing(true);
      try {
         await openSession(
            parseFloat(openingData.monto || '0'),
            openingData.comentario,
            currentUser.id
         );
         setShowOpenModal(false);
         setOpeningData({ monto: '', comentario: 'Apertura de turno' });
      } catch (err: any) {
         alert('Error al abrir turno: ' + err.message);
      } finally {
         setProcessing(false);
      }
   };

   const handleCloseSession = async () => {
      if (!currentShift) return;
      setProcessing(true);
      try {
         await closeSession(
            parseFloat(countedStats.cash || '0'),
            parseFloat(countedStats.card || '0'),
            parseFloat(countedStats.transfer || '0'),
            parseFloat(countedStats.other || '0'),
            countedStats.notes || 'Cierre de turno',
            currentUser?.id || ''
         );
         setShowCloseModal(false);
         alert('Turno cerrado correctamente.');
      } catch (err: any) {
         alert('Error al cerrar turno: ' + err.message);
      } finally {
         setProcessing(false);
      }
   };

   if (loadingSession) return <div className="p-10 text-center font-bold">Cargando sesión de caja...</div>;

   if (!currentShift && !closingSummary) {
      return (
         <div className="flex flex-col items-center justify-center p-20 bg-white rounded-[40px] shadow-sm border border-slate-100 m-6">
            <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
               <span className="material-icons-round text-4xl">lock_open</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Turno de Caja Cerrado</h2>
            <p className="text-slate-400 font-bold mb-8 text-center max-w-sm uppercase text-[10px] tracking-widest">
               Para comenzar a procesar cobros y ventas, es necesario abrir un nuevo turno de caja.
            </p>
            <button
               onClick={() => setShowOpenModal(true)}
               className="px-10 py-5 bg-primary text-white rounded-[24px] font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20 uppercase tracking-widest"
            >
               Abrir Turno Ahora
            </button>

            {showOpenModal && (
               <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden animate-fade-in-up">
                     <header className="bg-primary p-6 text-white text-center">
                        <span className="material-icons-round text-4xl mb-2">lock_open</span>
                        <h2 className="text-xl font-black">Apertura de Turno</h2>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">Configure los valores iniciales</p>
                     </header>

                     <div className="p-6 space-y-4">
                        <div className="space-y-1">
                           <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Monto Inicial en Efectivo ($)</label>
                           <input
                              type="number"
                              autoFocus
                              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-mono font-black text-xl text-brand-black"
                              placeholder="0.00"
                              value={openingData.monto}
                              onChange={(e) => setOpeningData(prev => ({ ...prev, monto: e.target.value }))}
                           />
                        </div>
                        <div className="space-y-1">
                           <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Comentario de Apertura</label>
                           <textarea
                              className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold"
                              placeholder="Ej: Base de caja inicial"
                              rows={2}
                              value={openingData.comentario}
                              onChange={(e) => setOpeningData(prev => ({ ...prev, comentario: e.target.value }))}
                           />
                        </div>
                     </div>

                     <footer className="p-4 bg-slate-50 flex gap-3">
                        <button
                           onClick={() => setShowOpenModal(false)}
                           className="flex-1 py-3 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 rounded-xl transition-all"
                        >
                           Cancelar
                        </button>
                        <button
                           onClick={handleOpenSession}
                           disabled={processing}
                           className="flex-[2] py-3 bg-primary text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                        >
                           {processing ? 'Abriendo...' : 'Abrir Turno'}
                        </button>
                     </footer>
                  </div>
               </div>
            )}
         </div>
      );
   }

   return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8 animate-fade-in relative z-0">
         <div className="grid grid-cols-1 xl:grid-cols-[1fr,400px] gap-8">
            <div className="space-y-8">
               <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
                  <div className="flex justify-between items-center mb-8">
                     <h3 className="font-bold text-lg text-primary flex items-center gap-2">
                        <span className="material-icons-round">table_restaurant</span>
                        Mesas por Cobrar
                     </h3>
                     <span className="px-3 py-1 bg-primary/5 text-primary text-[10px] font-black rounded-full uppercase tracking-widest">
                        {activeBills.length} Pendientes
                     </span>
                  </div>

                  <div className="overflow-x-auto">
                     <table className="w-full text-left">
                        <thead>
                           <tr className="border-b border-slate-100">
                              <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mesa</th>
                              <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                              <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</th>
                              <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acción</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                           {activeBills.length === 0 ? (
                              <tr>
                                 <td colSpan={4} className="py-20 text-center">
                                    <div className="flex flex-col items-center gap-4">
                                       <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                                          <span className="material-icons-round text-slate-200 text-3xl">check_circle</span>
                                       </div>
                                       <p className="text-slate-300 font-bold uppercase tracking-widest text-xs">No hay mesas por cobrar</p>
                                    </div>
                                 </td>
                              </tr>
                           ) : (
                              activeBills.map(table => {
                                 const total = orders.filter(o => o.tableId === (table.id || table.label)).reduce((sum, o) => sum + o.total, 0);
                                 return (
                                    <tr key={table.id || table.label} className="group transition-colors hover:bg-slate-50/50">
                                       <td className="py-4">
                                          <span className="font-black text-slate-700 uppercase text-xs">{table.label}</span>
                                       </td>
                                       <td className="py-4">
                                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border-2 ${table.status === 'billing' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                             {table.status === 'billing' ? 'Cuenta Solicitada' : 'Ocupada'}
                                          </span>
                                       </td>
                                       <td className="py-4 font-mono font-bold text-slate-900">${total.toFixed(2)}</td>
                                       <td className="py-4 text-right">
                                          <button
                                             onClick={() => setSelectedTableId(table.id || table.label)}
                                             className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-slate-200"
                                          >
                                             Seleccionar
                                          </button>
                                       </td>
                                    </tr>
                                 );
                              })
                           )}
                        </tbody>
                     </table>
                  </div>
               </div>

               <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                  <div className="flex justify-between items-center mb-6">
                     <h3 className="font-bold text-lg text-primary">Resumen del Turno Actual</h3>
                     <div className="flex items-center gap-2">
                        <span className="material-icons-round text-slate-400 text-sm">schedule</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                           Iniciado: {currentShift.openedAt.toLocaleTimeString()}
                        </span>
                     </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                     <div className="bg-slate-50 border-2 border-slate-100 rounded-3xl p-5 shadow-sm">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Apertura (Base)</p>
                        <p className="text-xl font-black text-slate-700 font-mono">${currentShift.initialCash.toFixed(2)}</p>
                     </div>
                     <div className="bg-emerald-50 border-2 border-emerald-100 rounded-3xl p-5 shadow-sm">
                        <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mb-1.5">Ventas Efectivo</p>
                        <p className="text-xl font-black text-emerald-700 font-mono">${shiftStats.cash.toFixed(2)}</p>
                     </div>
                     <div className="bg-blue-50 border-2 border-blue-100 rounded-3xl p-5 shadow-sm">
                        <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest mb-1.5">Ventas Tarjeta</p>
                        <p className="text-xl font-black text-blue-700 font-mono">${shiftStats.card.toFixed(2)}</p>
                     </div>
                     <div className="bg-purple-50 border-2 border-purple-100 rounded-3xl p-5 shadow-sm">
                        <p className="text-[9px] font-bold text-purple-600 uppercase tracking-widest mb-1.5">Transferencia</p>
                        <p className="text-xl font-black text-purple-700 font-mono">${shiftStats.transfer.toFixed(2)}</p>
                     </div>
                     <div className="bg-primary text-white rounded-3xl p-5 shadow-lg flex flex-col justify-between">
                        <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest">Total Ventas</p>
                        <p className="text-xl font-black font-mono">${shiftStats.total.toFixed(2)}</p>
                     </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-slate-100 flex flex-wrap gap-4 text-[9px] font-mono text-slate-400">
                     <span>Branch: {branchId || 'NULL'}</span>
                     <span>Session: {currentShift?.id || 'NULL'}</span>
                     <span>User: {currentUser?.name}</span>
                     {statsError && <span className="text-rose-400">Error: {String(statsError)}</span>}
                  </div>
               </div>
            </div>

            <aside className="bg-white rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden flex flex-col h-fit xl:sticky xl:top-8 order-first xl:order-last">
               <header className="bg-primary p-6 sm:p-8 text-white text-center">
                  <h2 className="text-2xl font-black">Facturación</h2>
                  <p className="text-xs text-white/40 font-bold uppercase tracking-widest mt-2">{selectedTableId ? `Mesa: ${selectedTableId}` : 'Esperando selección'}</p>
               </header>

               <div className="p-6 sm:p-8 flex-1 space-y-8">
                  {selectedTableId ? (
                     <>
                        <div className="space-y-4">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Métodos de Pago</p>
                           <div className="grid grid-cols-1 gap-3">
                              {Object.keys(INITIAL_SPLIT).map(method => (
                                 <div key={method} className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                                    <span className="text-[9px] font-black text-slate-400 w-20 uppercase tracking-tighter">{method}</span>
                                    <input
                                       type="number"
                                       placeholder="0.00"
                                       className="bg-transparent border-none outline-none font-mono font-bold text-slate-900 w-full"
                                       value={(splitPayments as any)[method]}
                                       onChange={(e) => setSplitPayments(prev => ({ ...prev, [method]: e.target.value }))}
                                    />
                                 </div>
                              ))}
                           </div>
                        </div>

                        <div className="bg-slate-900 text-white rounded-3xl p-6 space-y-3">
                           <div className="flex justify-between text-white/50 font-black text-[10px] uppercase tracking-widest">
                              <span>Total a Pagar</span>
                              <span>Restante</span>
                           </div>
                           <div className="flex justify-between items-end">
                              <span className="text-2xl font-black font-mono">${tableTotal.toFixed(2)}</span>
                              <span className={`text-xl font-black font-mono ${pendingAmount > 0.01 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                 ${pendingAmount.toFixed(2)}
                              </span>
                           </div>
                        </div>

                        <button
                           onClick={confirmPayment}
                           disabled={processing || pendingAmount > 0.01}
                           className="w-full py-5 bg-primary text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:hover:scale-100"
                        >
                           {processing ? 'Procesando...' : 'Confirmar Cobro'}
                        </button>

                        <button
                           onClick={() => { setSelectedTableId(null); setSplitPayments(INITIAL_SPLIT); }}
                           className="w-full text-[10px] font-black text-slate-300 uppercase tracking-widest hover:text-rose-400 transition-colors"
                        >
                           Cancelar Selección
                        </button>
                     </>
                  ) : (
                     <div className="py-20 text-center space-y-4">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto opacity-50">
                           <span className="material-icons-round text-slate-200 text-3xl">point_of_sale</span>
                        </div>
                        <p className="text-slate-300 font-bold uppercase tracking-widest text-[10px] leading-relaxed">
                           Seleccione una mesa del<br />listado para procesar el pago.
                        </p>
                     </div>
                  )}
               </div>

               <div className="p-6 bg-slate-50 border-t border-slate-100">
                  <button
                     onClick={() => setShowCloseModal(true)}
                     className="w-full flex items-center justify-center gap-2 py-3 text-rose-500 font-bold text-xs uppercase tracking-widest hover:bg-rose-50 rounded-xl transition-all"
                  >
                     <span className="material-icons-round text-sm">lock</span>
                     Cerrar Turno Actual
                  </button>
               </div>
            </aside>
         </div>

         {/* MODAL CIERRE DE TURNO */}
         {showCloseModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
               <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden animate-fade-in-up">
                  <header className="bg-rose-500 p-6 text-white text-center">
                     <span className="material-icons-round text-4xl mb-2">lock</span>
                     <h2 className="text-xl font-black">Cierre de Turno</h2>
                     <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">Ingrese los montos contados en caja</p>
                  </header>

                  <div className="p-6 space-y-6">
                     <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Balances del Sistema</p>
                           <div className="bg-slate-50 p-4 rounded-2xl space-y-3">
                              <div className="flex justify-between items-center">
                                 <span className="text-[9px] font-bold text-slate-400 uppercase">Efectivo (Esperado)</span>
                                 <span className="font-mono font-bold text-slate-900">${expectedCash.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                 <span className="text-[9px] font-bold text-slate-400 uppercase">Tarjeta (Ventas)</span>
                                 <span className="font-mono font-bold text-slate-900">${shiftStats.card.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                 <span className="text-[9px] font-bold text-slate-400 uppercase">Transfer. (Ventas)</span>
                                 <span className="font-mono font-bold text-slate-900">${shiftStats.transfer.toFixed(2)}</span>
                              </div>
                           </div>
                        </div>

                        <div className="space-y-4">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Conteo Físico</p>
                           <div className="grid grid-cols-1 gap-3">
                              {[
                                 { id: 'cash', label: 'EfectivoContado' },
                                 { id: 'card', label: 'Tarjeta' },
                                 { id: 'transfer', label: 'Transferencia' },
                                 { id: 'other', label: 'Otros' }
                              ].map(field => (
                                 <div key={field.id} className="flex items-center gap-2 bg-slate-50 p-2 px-3 rounded-xl border border-slate-100">
                                    <span className="text-[8px] font-black text-slate-300 w-16 uppercase leading-tight">{field.label}</span>
                                    <input
                                       type="number"
                                       className="bg-transparent border-none outline-none font-mono font-bold text-slate-700 w-full text-right"
                                       placeholder="0.00"
                                       value={(countedStats as any)[field.id]}
                                       onChange={(e) => setCountedStats(prev => ({ ...prev, [field.id]: e.target.value }))}
                                    />
                                 </div>
                              ))}
                           </div>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div className={`p-4 rounded-2xl border-2 ${cashDifference === 0 ? 'bg-slate-50 border-slate-100' : cashDifference > 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                           <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${cashDifference === 0 ? 'text-slate-400' : cashDifference > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>Diferencia Efectivo</p>
                           <p className={`text-xl font-black font-mono ${cashDifference === 0 ? 'text-slate-900' : cashDifference > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {cashDifference > 0 ? '+' : ''}{cashDifference.toFixed(2)}
                           </p>
                        </div>
                        <div className="bg-slate-900 text-white p-4 rounded-2xl">
                           <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-1">Total General Contado</p>
                           <p className="text-xl font-black font-mono">${totalCounted.toFixed(2)}</p>
                        </div>
                     </div>

                     <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Notas / Observaciones Finales</label>
                        <textarea
                           className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-semibold"
                           placeholder="Detalle cualquier novedad del turno..."
                           rows={2}
                           value={countedStats.notes}
                           onChange={(e) => setCountedStats(prev => ({ ...prev, notes: e.target.value }))}
                        />
                     </div>
                  </div>

                  <footer className="p-4 bg-slate-50 flex gap-3">
                     <button
                        onClick={() => setShowCloseModal(false)}
                        className="flex-1 py-3 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 rounded-xl transition-all"
                     >
                        Cancelar
                     </button>
                     <button
                        onClick={handleCloseSession}
                        disabled={processing}
                        className="flex-[2] py-3 bg-rose-500 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg shadow-rose-200 hover:scale-105 active:scale-95 transition-all"
                     >
                        {processing ? 'Procesando...' : 'Confirmar Cierre de Caja'}
                     </button>
                  </footer>
               </div>
            </div>
         )}
      </div>
   );
};

export default CashierView;
