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
            setOrders(data as Order[]);
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

   const tableTotal = tableOrders.reduce((sum, o) => sum + (o.total || 0), 0);
   const totalPaid = Object.values(splitPayments).reduce((sum: number, val: string) => sum + parseFloat(val || '0'), 0);
   const pendingAmount = Math.max(0, tableTotal - totalPaid);

   const { stats: shiftStats, isLoading: loadingStats, error: statsError } = useShiftPayments(
      currentShift?.id || null,
      currentUser?.restaurantId || null
   );


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

         for (const id of orderIds) {
            const { error: oError } = await supabase
               .from('orders')
               .update({ status: 'paid', paid_at: new Date().toISOString(), cashier_id: currentUser?.id })
               .eq('id', id);
            if (oError) throw oError;
         }

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
               onClick={() => {
                  const amt = prompt('Monto inicial en caja ($):', '0');
                  if (amt !== null) openSession(parseFloat(amt), 'Apertura de turno', currentUser?.id || '');
               }}
               className="px-10 py-5 bg-primary text-white rounded-[24px] font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20 uppercase tracking-widest"
            >
               Abrir Turno Ahora
            </button>
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
                  <h3 className="font-bold text-lg text-primary mb-6">Resumen del Turno Actual</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                     <div className="bg-emerald-50 border-2 border-emerald-100 rounded-3xl p-5 shadow-sm">
                        <p className="text-[9px] sm:text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1.5 sm:mb-2">Ventas Efectivo</p>
                        <p className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono">${shiftStats.cash.toFixed(2)}</p>
                     </div>
                     <div className="bg-blue-50 border-2 border-blue-100 rounded-3xl p-5 shadow-sm">
                        <p className="text-[9px] sm:text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1.5 sm:mb-2">Ventas Tarjeta</p>
                        <p className="text-2xl sm:text-3xl font-black text-blue-700 font-mono">${shiftStats.card.toFixed(2)}</p>
                     </div>
                     <div className="bg-purple-50 border-2 border-purple-100 rounded-3xl p-5 shadow-sm">
                        <p className="text-[9px] sm:text-[10px] font-bold text-purple-600 uppercase tracking-widest mb-1.5 sm:mb-2">Transferencia</p>
                        <p className="text-2xl sm:text-3xl font-black text-purple-700 font-mono">${shiftStats.transfer.toFixed(2)}</p>
                     </div>
                     <div className="bg-primary text-white rounded-3xl p-5 shadow-lg flex flex-col justify-between">
                        <p className="text-[9px] sm:text-[10px] font-bold text-white/50 uppercase tracking-widest">Total Ventas</p>
                        <p className="text-2xl sm:text-3xl font-black font-mono">${shiftStats.total.toFixed(2)}</p>
                     </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-slate-100 flex flex-wrap gap-4 text-[9px] font-mono text-slate-400">
                     <span>Branch: {branchId || 'NULL'}</span>
                     <span>Session: {currentShift?.id || 'NULL'}</span>
                     <span>Loading: {loadingStats ? 'YES' : 'NO'}</span>
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
                     onClick={() => {
                        const confirmClose = window.confirm('¿Está seguro de que desea cerrar el turno de caja?');
                        if (confirmClose) closeSession(0, 0, 0, 0, 'Cierre de turno', currentUser?.id || '');
                     }}
                     className="w-full flex items-center justify-center gap-2 py-3 text-rose-500 font-bold text-xs uppercase tracking-widest hover:bg-rose-50 rounded-xl transition-all"
                  >
                     <span className="material-icons-round text-sm">lock</span>
                     Cerrar Turno Actual
                  </button>
               </div>
            </aside>
         </div>
      </div>
   );
};

export default CashierView;
