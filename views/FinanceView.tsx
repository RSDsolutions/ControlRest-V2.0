
import React, { useState, useMemo } from 'react';
import { Order, Ingredient, Expense, Plate, WasteRecord } from '../types';

interface FinanceViewProps {
   orders: Order[];
   ingredients: Ingredient[];
   expenses: Expense[];
   plates: Plate[];
   wasteRecords: WasteRecord[];
   branchId?: string | 'GLOBAL' | null;
}

const FinanceView: React.FC<FinanceViewProps> = ({ orders, ingredients, expenses, plates, wasteRecords, branchId }) => {
   const [currentDate, setCurrentDate] = useState(new Date());

   // --- DATA PROCESSING & CALCULATIONS ---

   const getMonthData = (date: Date) => {
      const month = date.getMonth();
      const year = date.getFullYear();

      // Filter Data
      const monthOrders = orders.filter(o => {
         const d = new Date(o.timestamp);
         return d.getMonth() === month && d.getFullYear() === year;
      });
      const monthExpenses = expenses.filter(e => {
         const d = new Date(e.date);
         return d.getMonth() === month && d.getFullYear() === year;
      });
      const monthWaste = wasteRecords.filter(w => {
         const d = new Date(w.created_at);
         return d.getMonth() === month && d.getFullYear() === year;
      });

      // 1. Sales
      const sales = monthOrders.reduce((acc, o) => acc + (o.total || 0), 0);

      // 2. COGS (Inventory Cost)
      let cogs = 0;
      monthOrders.forEach(o => {
         if (!o.items) return;
         o.items.forEach(item => {
            const plate = plates.find(p => p.id === item.plateId);
            if (plate) {
               const plateCost = plate.ingredients.reduce((sum, pi) => {
                  const ing = ingredients.find(i => i.id === pi.ingredientId);
                  return sum + (pi.qty * (ing?.unitPrice || 0));
               }, 0);
               cogs += (item.qty * plateCost);
            }
         });
      });

      // 3. Waste Cost
      const wasteCost = monthWaste.reduce((acc, w) => acc + Number(w.totalCost), 0);

      // 4. Gross Profit (Sales - COGS - Waste)
      // *Wait*: Does Waste reduce Gross Profit? Yes, it's cost of goods lost.
      // Or should it be an OpEx? Usually it's COGS adjustment.
      // Let's put it as a deduction from Gross Profit for clear visibility, or part of Variable Costs.
      // Net Sales = Sales
      // COGS = COGS Sold + COGS Wasted.

      const totalCOGS = cogs + wasteCost;
      const grossProfit = sales - totalCOGS;
      const grossMargin = sales > 0 ? (grossProfit / sales) * 100 : 0;

      // 5. Expenses Breakdown
      const opExpensesTotal = monthExpenses.reduce((acc, e) => acc + Number(e.amount), 0);

      // Categorize Expenses for Donut & Health
      const payroll = monthExpenses.filter(e => e.category === 'Nómina').reduce((acc, e) => acc + Number(e.amount), 0);
      const services = monthExpenses.filter(e => e.category === 'Servicios Básicos').reduce((acc, e) => acc + Number(e.amount), 0);
      const otherExpenses = opExpensesTotal - payroll - services;

      // Fixed vs Variable for Break-even
      const fixedCosts = monthExpenses.filter(e => e.type === 'fixed' || e.type === 'semi-variable').reduce((acc, e) => acc + Number(e.amount), 0);
      // Variable costs include COGS + waste + variable expenses
      const variableExpensesOnly = monthExpenses.filter(e => e.type === 'variable').reduce((acc, e) => acc + Number(e.amount), 0);
      const variableCosts = totalCOGS + variableExpensesOnly;

      // 6. Operating Profit
      const operatingProfit = grossProfit - opExpensesTotal;

      // 7. Net Profit
      const taxes = monthExpenses.filter(e => e.category === 'Impuestos').reduce((acc, e) => acc + Number(e.amount), 0);
      const financial = monthExpenses.filter(e => e.category === 'Financieros').reduce((acc, e) => acc + Number(e.amount), 0);

      const opExpensesStrict = opExpensesTotal - taxes - financial;
      // Formula: Sales - (COGS + Waste) - OpEx(Strict) = OpProfit(Strict)
      const operatingProfitStrict = sales - totalCOGS - opExpensesStrict;

      const netProfitFinal = operatingProfitStrict - taxes - financial;

      const netMargin = sales > 0 ? (netProfitFinal / sales) * 100 : 0;

      // 8. Break-even
      const contributionMarginRatio = sales > 0 ? (sales - variableCosts) / sales : 0;
      const breakEvenPoint = contributionMarginRatio > 0 ? fixedCosts / contributionMarginRatio : 0;

      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const breakEvenDays = sales > 0 ? (breakEvenPoint / (sales / daysInMonth)) : 0;

      return {
         sales,
         cogs,
         wasteCost,
         totalCOGS,
         opExpenses: opExpensesTotal,
         grossProfit,
         operatingProfit: operatingProfitStrict,
         netProfit: netProfitFinal,
         netMargin,
         breakEvenPoint,
         breakEvenDays,
         payroll,
         services,
         otherExpenses,
         taxes,
         fixedCosts,
         variableCosts
      };
   };

   const currentData = useMemo(() => getMonthData(currentDate), [orders, expenses, plates, ingredients, currentDate]);

   const prevDate = new Date(currentDate);
   prevDate.setMonth(currentDate.getMonth() - 1);
   const prevData = useMemo(() => getMonthData(prevDate), [orders, expenses, plates, ingredients, prevDate]);

   // Historical (6 months)
   const historyData = useMemo(() => {
      const data = [];
      for (let i = 5; i >= 0; i--) {
         const d = new Date(currentDate);
         d.setMonth(currentDate.getMonth() - i);
         const stats = getMonthData(d);
         data.push({
            label: d.toLocaleString('es-ES', { month: 'short' }),
            sales: stats.sales,
            expenses: stats.opExpenses + stats.cogs, // Total Outflow
            net: stats.netProfit
         });
      }
      return data;
   }, [currentDate, orders, expenses]);

   // --- HELPERS ---
   const formatMoney = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
   const formatPercent = (n: number) => `${n.toFixed(1)}%`;

   const getTrend = (curr: number, prev: number) => {
      if (prev === 0) return { val: curr > 0 ? 100 : 0, dir: 'up' };
      const diff = ((curr - prev) / prev) * 100;
      return { val: Math.abs(diff), dir: diff >= 0 ? 'up' : 'down', sign: diff >= 0 ? '+' : '-' };
   };

   const TrendIndicator = ({ curr, prev, inverse = false }: { curr: number, prev: number, inverse?: boolean }) => {
      const { val, dir, sign } = getTrend(curr, prev);
      const isGood = inverse ? dir === 'down' : dir === 'up';
      const color = isGood ? 'text-emerald-500' : 'text-rose-500';
      const icon = dir === 'up' ? 'arrow_upward' : 'arrow_downward';
      return (
         <div className={`flex items-center text-xs font-bold ${color} bg-white/50 px-2 py-1 rounded-lg`}>
            <span className="material-icons-round text-[14px]">{icon}</span>
            <span>{sign}{val.toFixed(1)}%</span>
         </div>
      );
   };

   // --- ALERTS LOGIC ---
   const alerts = [];
   if (currentData.sales < prevData.sales * 0.85) alerts.push({ type: 'danger', msg: 'Las ventas han caído más del 15% vs mes anterior.' });
   if (currentData.opExpenses > prevData.opExpenses * 1.20) alerts.push({ type: 'warning', msg: 'Los gastos operativos subieron más del 20%.' });
   if (currentData.netProfit < 0) alerts.push({ type: 'danger', msg: 'Utilidad Neta Negativa. Revisa costos urgentes.' });
   // if (currentData.netMargin < 10) ... handled by traffic light, specific alert maybe?

   return (
      <div className="p-8 space-y-8 animate-fade-in max-w-[1600px] mx-auto pb-24">
         {/* HEADER */}
         <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-[8px] shadow-card border border-slate-200">
            <div>
               <h1 className="text-lg font-semibold text-slate-900 tracking-tight flex items-center gap-2">
                  <span className="material-icons-round text-[#136dec] text-xl">bar_chart</span>
                  Tablero Financiero
                  {branchId === 'GLOBAL' && (
                     <span className="bg-blue-50 text-[#136dec] text-[10px] px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider border border-blue-100">Consolidado Global</span>
                  )}
               </h1>
               <p className="text-xs text-slate-400 mt-0.5">Análisis de rentabilidad y salud financiera.</p>
            </div>
            <div className="flex items-center gap-3">
               <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-[8px] border border-slate-200 text-sm hover:border-slate-300 transition-colors">
                  <span className="material-icons-round text-[#136dec] text-[18px]">calendar_today</span>
                  <input type="month" className="bg-transparent border-none outline-none text-sm cursor-pointer font-semibold text-slate-700"
                     value={`${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`}
                     onChange={e => {
                        const [y, m] = e.target.value.split('-');
                        setCurrentDate(new Date(parseInt(y), parseInt(m) - 1, 1));
                     }}
                  />
               </div>
            </div>
         </header>

         {/* ALERTS */}
         {alerts.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {alerts.map((alert, i) => (
                  <div key={i} className={`p-5 rounded-brand border-l-4 flex items-center gap-4 shadow-brand animate-fade-in ${alert.type === 'danger' ? 'bg-red-50 border-red-500 text-red-700' : 'bg-amber-50 border-amber-500 text-amber-700'
                     }`}>
                     <div className={`w-10 h-10 rounded-full flex items-center justify-center ${alert.type === 'danger' ? 'bg-red-100' : 'bg-amber-100'
                        }`}>
                        <span className="material-icons-round">{alert.type === 'danger' ? 'error' : 'warning'}</span>
                     </div>
                     <span className="font-bold text-sm tracking-tight">{alert.msg}</span>
                  </div>
               ))}
            </div>
         )}

         {/* MAIN KPIs */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPICard label="Ingresos Totales" value={currentData.sales} prev={prevData.sales} color="text-brand-black" icon="receipt_long" />
            <KPICard label="Costos Mercancía (COGS)" value={currentData.cogs} prev={prevData.cogs} inverse color="text-orange-600" icon="inventory" />
            <KPICard label="Gastos Operativos" value={currentData.opExpenses} prev={prevData.opExpenses} inverse color="text-red-500" icon="account_balance" />
            <KPICard label="Margen Bruto" value={currentData.grossProfit} prev={prevData.grossProfit} color="text-primary" icon="trending_up" />
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPICard label="EBITDA Proyectado" value={currentData.operatingProfit} prev={prevData.operatingProfit} color="text-indigo-600" icon="analytics" />
            <KPICard label="Utilidad Neta del Periodo" value={currentData.netProfit} prev={prevData.netProfit} color="text-emerald-600" bg="bg-brand-black" isDark icon="stars" />

            <div className="card col-span-1 md:col-span-2 flex flex-col justify-between p-8">
               <div className="flex justify-between items-start">
                  <div>
                     <p className="text-[10px] uppercase font-black text-slate-400 tracking-[0.2em] mb-3">Punto de Equilibrio</p>
                     <h3 className="text-4xl font-heading font-black text-brand-black tracking-tighter">{formatMoney(currentData.breakEvenPoint)}</h3>
                     <p className="text-xs font-bold text-slate-400 mt-2">Monto necesario para cubrir todos los costos fijos.</p>
                  </div>
                  <div className="text-right">
                     <p className="text-[10px] uppercase font-black text-slate-400 tracking-[0.2em] mb-3">Retorno de Punto</p>
                     <div className="flex items-center justify-end gap-2">
                        <h3 className="text-4xl font-heading font-black text-primary tracking-tighter">{currentData.breakEvenDays.toFixed(1)}</h3>
                        <span className="text-xs font-black text-slate-400 uppercase">Días</span>
                     </div>
                  </div>
               </div>
               <div className="mt-8">
                  <div className="flex justify-between text-[11px] font-black uppercase tracking-widest mb-3">
                     <span className="text-slate-400">Progreso Operativo</span>
                     <span className={`${currentData.sales >= currentData.breakEvenPoint ? 'text-emerald-500' : 'text-primary'}`}>
                        {currentData.breakEvenPoint > 0 ? ((currentData.sales / currentData.breakEvenPoint) * 100).toFixed(0) : 0}% COMPLETADO
                     </span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                     <div className={`h-full transition-all duration-1000 ${currentData.sales >= currentData.breakEvenPoint ? 'bg-emerald-500' : 'bg-primary'}`}
                        style={{ width: `${Math.min((currentData.sales / currentData.breakEvenPoint) * 100, 100)}%` }}></div>
                  </div>
               </div>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* DISTRIBUTION */}
            <div className="card p-8 flex flex-col items-center relative overflow-hidden">
               <div className="w-full flex justify-between items-center mb-10">
                  <h3 className="font-heading font-black text-xl text-brand-black tracking-tight">Estructura de Costos</h3>
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                     <span className="material-icons-round">pie_chart</span>
                  </div>
               </div>

               <div className="relative w-72 h-72">
                  <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                     <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="15" />
                     {/* Segments */}
                     <DonutSegment total={currentData.sales} value={currentData.cogs} offset={0} color="#f97316" />
                     <DonutSegment total={currentData.sales} value={currentData.wasteCost} offset={currentData.cogs} color="#ef4444" />
                     <DonutSegment total={currentData.sales} value={currentData.payroll} offset={currentData.cogs + currentData.wasteCost} color="#136dec" />
                     <DonutSegment total={currentData.sales} value={currentData.services} offset={currentData.cogs + currentData.wasteCost + currentData.payroll} color="#8b5cf6" />
                     <DonutSegment total={currentData.sales} value={currentData.otherExpenses} offset={currentData.cogs + currentData.wasteCost + currentData.payroll + currentData.services} color="#94a3b8" />
                     <DonutSegment total={currentData.sales} value={currentData.netProfit} offset={currentData.cogs + currentData.wasteCost + currentData.payroll + currentData.services + currentData.otherExpenses} color="#10b981" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Facturación</span>
                     <span className="text-3xl font-heading font-black text-brand-black mt-1">{formatMoney(currentData.sales)}</span>
                  </div>
               </div>

               <div className="grid grid-cols-1 gap-4 w-full mt-10">
                  <LegendItem color="bg-orange-500" label="Costo de Ventas (COGS)" value={currentData.cogs} total={currentData.sales} />
                  <LegendItem color="bg-red-500" label="Pérdidas y Mermas" value={currentData.wasteCost} total={currentData.sales} />
                  <LegendItem color="bg-primary" label="Gastos de Personal" value={currentData.payroll} total={currentData.sales} />
                  <LegendItem color="bg-purple-500" label="Servicios Generales" value={currentData.services} total={currentData.sales} />
                  <LegendItem color="bg-emerald-500" label="Margen Neto Final" value={currentData.netProfit} total={currentData.sales} />
               </div>
            </div>

            {/* FINANCIAL HEALTH */}
            <div className="card p-8 flex flex-col">
               <div className="w-full flex justify-between items-center mb-10">
                  <h3 className="font-heading font-black text-xl text-brand-black tracking-tight">Indicadores de Salud</h3>
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                     <span className="material-icons-round">health_and_safety</span>
                  </div>
               </div>

               <div className="space-y-8 flex-1">
                  <HealthIndicator
                     label="Margen de Utilidad Neta"
                     value={currentData.netMargin}
                     suffix="%"
                     status={currentData.netMargin > 20 ? 'good' : currentData.netMargin > 10 ? 'warning' : 'bad'}
                     target="Objetivo: > 20%"
                  />
                  <HealthIndicator
                     label="Ratio de Nómina / Ventas"
                     value={currentData.sales > 0 ? (currentData.payroll / currentData.sales) * 100 : 0}
                     suffix="%"
                     status={(currentData.payroll / currentData.sales) < 0.35 ? 'good' : (currentData.payroll / currentData.sales) < 0.45 ? 'warning' : 'bad'}
                     target="Límite: < 35%"
                     inverse
                  />
                  <HealthIndicator
                     label="Gastos Operativos / Ingresos"
                     value={currentData.sales > 0 ? (currentData.opExpenses / currentData.sales) * 100 : 0}
                     suffix="%"
                     status={(currentData.opExpenses / currentData.sales) < 0.60 ? 'good' : (currentData.opExpenses / currentData.sales) < 0.75 ? 'warning' : 'bad'}
                     target="Límite: < 60%"
                     inverse
                  />
               </div>

               <div className="mt-10 p-6 bg-slate-50 rounded-2xl border border-slate-100 relative group overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
                     <span className="material-icons-round text-4xl text-primary">psychology</span>
                  </div>
                  <h4 className="font-heading font-black text-sm text-brand-black mb-3">Análisis Inteligente</h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                     {currentData.netMargin > 20
                        ? 'Tu estructura financiera es excepcionalmente eficiente. El control de gastos y el costo de platos están en niveles óptimos.'
                        : currentData.netMargin > 10
                           ? 'Tu negocio es autosuficiente, pero existen oportunidades para optimizar la eficiencia operativa y reducir costos variables.'
                           : 'Estructura financiera en riesgo. Requiere revisión inmediata de ingeniería de menú y reducción agresiva de gastos fijos.'}
                  </p>
               </div>
            </div>

            {/* TRENDS */}
            <div className="card p-8 flex flex-col">
               <div className="w-full flex justify-between items-center mb-10">
                  <h3 className="font-heading font-black text-xl text-brand-black tracking-tight">Desempeño Histórico</h3>
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                     <span className="material-icons-round">timeline</span>
                  </div>
               </div>

               <div className="flex-1 flex items-end gap-3 relative min-h-[250px] px-2">
                  {historyData.map((d, i) => {
                     const max = Math.max(...historyData.map(h => Math.max(h.sales, h.expenses))) || 1;
                     return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-4 h-full justify-end group">
                           <div className="w-full flex items-end gap-[2px] h-full justify-center">
                              {/* Sales Bar */}
                              <div className="w-3 bg-brand-black rounded-t-sm transition-all hover:opacity-80 relative group" style={{ height: `${(d.sales / max) * 75}%` }}>
                                 <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-brand-black text-white text-[9px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">V: {formatMoney(d.sales)}</div>
                              </div>
                              {/* Expenses Bar */}
                              <div className="w-3 bg-red-400 rounded-t-sm transition-all hover:bg-red-500 relative group" style={{ height: `${(d.expenses / max) * 75}%` }}>
                                 <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[9px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">G: {formatMoney(d.expenses)}</div>
                              </div>
                              {/* Net Bar (Positive only for height viz) */}
                              <div className="w-3 bg-emerald-400 rounded-t-sm transition-all hover:bg-emerald-500 relative group" style={{ height: `${Math.max((d.net / max) * 75, 4)}%` }}>
                                 <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[9px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">U: {formatMoney(d.net)}</div>
                              </div>
                           </div>
                           <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">{d.label}</span>
                        </div>
                     )
                  })}
               </div>
               <div className="mt-10 flex flex-wrap gap-6 text-[10px] font-black uppercase text-slate-400 justify-center tracking-widest border-t border-slate-50 pt-6">
                  <div className="flex items-center gap-2"><div className="w-2 h-2 bg-brand-black rounded-full"></div> Ingresos</div>
                  <div className="flex items-center gap-2"><div className="w-2 h-2 bg-red-400 rounded-full"></div> Egresos</div>
                  <div className="flex items-center gap-2"><div className="w-2 h-2 bg-emerald-400 rounded-full"></div> Utilidad</div>
               </div>
            </div>
         </div>
      </div>
   );
};

// --- SUBCOMPONENTS ---

const KPICard = ({ label, value, prev, color, inverse, bg = "bg-white", isDark, icon }: any) => {
   const formatMoney = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

   return (
      <div className={`card group p-6 ${isDark ? 'bg-brand-black border-brand-black shadow-2xl scale-[1.02]' : 'bg-white'}`}>
         <div className="flex justify-between items-start mb-6">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300 ${isDark ? 'bg-white/10 text-white' : `${color.replace('text-', 'bg-').replace('600', '100').replace('500', '100')} ${color}`
               }`}>
               <span className="material-icons-round text-2xl">{icon}</span>
            </div>
            {prev !== undefined && (
               <TrendIndicatorWrapper curr={value} prev={prev} inverse={inverse} isDark={isDark} />
            )}
         </div>
         <div className="space-y-1">
            <p className={`text-[10px] uppercase font-black tracking-[0.2em] ${isDark ? 'text-white/40' : 'text-slate-400'}`}>{label}</p>
            <h3 className={`text-3xl font-heading font-black tracking-tight ${isDark ? 'text-white' : color}`}>{formatMoney(value)}</h3>
            {prev !== undefined && (
               <div className={`flex items-center gap-2 pt-2 border-t mt-3 ${isDark ? 'border-white/10' : 'border-slate-50'}`}>
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-white/30' : 'text-slate-400'}`}>Previo: {formatMoney(prev)}</span>
               </div>
            )}
         </div>
      </div>
   );
};

const TrendIndicatorWrapper = ({ curr, prev, inverse, isDark }: any) => {
   const diff = prev === 0 ? (curr > 0 ? 100 : 0) : ((curr - prev) / prev) * 100;
   const dir = diff >= 0 ? 'up' : 'down';
   const isGood = inverse ? dir === 'down' : dir === 'up';

   const colorClass = isGood
      ? (isDark ? 'text-emerald-400 bg-emerald-500/10' : 'text-emerald-600 bg-emerald-50')
      : (isDark ? 'text-rose-400 bg-rose-500/10' : 'text-rose-600 bg-rose-50');

   const icon = dir === 'up' ? 'expand_less' : 'expand_more';

   return (
      <span className={`flex items-center gap-1 text-[11px] font-black px-2 py-1 rounded-lg ${colorClass}`}>
         <span className="material-icons-round text-base">{icon}</span>
         {Math.abs(diff).toFixed(1)}%
      </span>
   );
};

const DonutSegment = ({ total, value, offset, color }: any) => {
   if (total === 0) return null;
   const circumference = 2 * Math.PI * 40;
   const dash = (value / total) * circumference;
   return (
      <circle
         cx="50" cy="50" r="40"
         fill="transparent"
         stroke={color}
         strokeWidth="11"
         strokeDasharray={`${dash} ${circumference}`}
         strokeDashoffset={-((offset / total) * circumference)}
         strokeLinecap="round"
         className="transition-all duration-1000 ease-out"
      />
   );
};

const LegendItem = ({ color, label, value, total }: any) => (
   <div className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
      <div className="flex items-center gap-3">
         <div className={`w-3 h-3 rounded-full ${color} shadow-sm`}></div>
         <span className="text-xs font-bold text-slate-700">{label}</span>
      </div>
      <div className="text-right">
         <span className="block text-xs font-black text-brand-black">{((value / total) * 100).toFixed(1)}%</span>
         <span className="block text-[10px] font-bold text-slate-400 tracking-tight">${value.toLocaleString('en-US', { minimumFractionDigits: 0 })}</span>
      </div>
   </div>
);

const HealthIndicator = ({ label, value, suffix, status, target, inverse }: any) => {
   const colors = {
      good: 'bg-emerald-500 shadow-emerald-500/30',
      warning: 'bg-amber-400 shadow-amber-400/30',
      bad: 'bg-red-500 shadow-red-500/30'
   };
   const textColors = {
      good: 'text-emerald-700',
      warning: 'text-amber-700',
      bad: 'text-red-700'
   };

   return (
      <div className="flex items-center justify-between group">
         <div className="flex items-center gap-4">
            <div className={`w-4 h-4 rounded-full border-2 border-white ${colors[status as keyof typeof colors]} shadow-lg transition-transform group-hover:scale-125 duration-300`}></div>
            <div>
               <h4 className="text-sm font-heading font-black text-brand-black tracking-tight">{label}</h4>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{target}</p>
            </div>
         </div>
         <div className="text-right">
            <span className={`text-2xl font-heading font-black tracking-tighter ${textColors[status as keyof typeof textColors]}`}>
               {value.toFixed(1)}{suffix}
            </span>
         </div>
      </div>
   );
};

export default FinanceView;
