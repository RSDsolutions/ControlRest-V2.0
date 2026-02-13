
import React, { useState, useMemo } from 'react';
import { Order, Ingredient, Expense, Plate } from '../types';

interface FinanceViewProps {
   orders: Order[];
   ingredients: Ingredient[];
   expenses: Expense[];
   plates: Plate[];
}

const FinanceView: React.FC<FinanceViewProps> = ({ orders, ingredients, expenses, plates }) => {
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

      // 3. Gross Profit
      const grossProfit = sales - cogs;
      const grossMargin = sales > 0 ? (grossProfit / sales) * 100 : 0;

      // 4. Expenses Breakdown
      const opExpensesTotal = monthExpenses.reduce((acc, e) => acc + Number(e.amount), 0);

      // Categorize Expenses for Donut & Health
      const payroll = monthExpenses.filter(e => e.category === 'Nómina').reduce((acc, e) => acc + Number(e.amount), 0);
      const services = monthExpenses.filter(e => e.category === 'Servicios Básicos').reduce((acc, e) => acc + Number(e.amount), 0);
      const otherExpenses = opExpensesTotal - payroll - services;

      // Fixed vs Variable for Break-even
      const fixedCosts = monthExpenses.filter(e => e.type === 'fixed' || e.type === 'semi-variable').reduce((acc, e) => acc + Number(e.amount), 0);
      // Variable costs include COGS + variable expenses
      const variableExpensesOnly = monthExpenses.filter(e => e.type === 'variable').reduce((acc, e) => acc + Number(e.amount), 0);
      const variableCosts = cogs + variableExpensesOnly;

      // 5. Operating Profit
      const operatingProfit = grossProfit - opExpensesTotal;

      // 6. Net Profit (Simplified: Op Profit - Taxes/Financial if any, assuming they are in expenses for now or 0)
      // If taxes are a category, subtract them? Let's assume OpProfit = NetProfit for basic view unless specific tax logic added.
      // User asked for "Utilidad Neta = Utilidad Operativa - Impuestos". Let's look for 'Impuestos'.
      const taxes = monthExpenses.filter(e => e.category === 'Impuestos').reduce((acc, e) => acc + Number(e.amount), 0);
      const financial = monthExpenses.filter(e => e.category === 'Financieros').reduce((acc, e) => acc + Number(e.amount), 0);
      const netProfit = operatingProfit - taxes - financial; // Wait, if taxes were in opExpensesTotal, we double subtract? 
      // Usually Op Expenses include rent, payroll. Taxes/Interests are below the line.
      // Let's assume opExpensesTotal INCLUDES taxes/financial if they are in the list. 
      // So Operating Profit should EXCLUDE Taxes/Financial.

      // RE-CALCULATE OpEx excluding Taxes/Financial for strict Operating Profit
      const opExpensesStrict = opExpensesTotal - taxes - financial;
      const operatingProfitStrict = grossProfit - opExpensesStrict;
      const netProfitFinal = operatingProfitStrict - taxes - financial; // This equals (Gross - OpExTotal)

      const netMargin = sales > 0 ? (netProfitFinal / sales) * 100 : 0;

      // 7. Break-even
      // BE = Fixed / (1 - (Variable / Sales))
      // Contribution Margin Ratio = (Sales - Variable) / Sales
      const contributionMarginRatio = sales > 0 ? (sales - variableCosts) / sales : 0;
      const breakEvenPoint = contributionMarginRatio > 0 ? fixedCosts / contributionMarginRatio : 0;

      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const breakEvenDays = sales > 0 ? (breakEvenPoint / (sales / daysInMonth)) : 0; // Days to reach BE volume based on current daily avg

      return {
         sales,
         cogs,
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
      <div className="p-8 space-y-8 animate-fadeIn max-w-[1600px] mx-auto">
         {/* HEADER */}
         <header className="flex justify-between items-center mb-8">
            <div>
               <h1 className="text-3xl font-black text-slate-900 tracking-tight">Tablero de Mando</h1>
               <p className="text-slate-500 font-medium">Visión consolidada de la salud financiera del negocio.</p>
            </div>
            <div className="flex items-center gap-4">
               <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-700 flex items-center gap-2 shadow-sm">
                  <span className="material-icons-round text-slate-400">calendar_today</span>
                  <input type="month" className="bg-transparent border-none outline-none text-sm cursor-pointer"
                     value={`${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`}
                     onChange={e => {
                        const [y, m] = e.target.value.split('-');
                        setCurrentDate(new Date(parseInt(y), parseInt(m) - 1, 1));
                     }}
                  />
               </div>
            </div>
         </header>

         {/* BLOCK 5: ALERTS (Top priority) */}
         {alerts.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {alerts.map((alert, i) => (
                  <div key={i} className={`p-4 rounded-xl border-l-4 flex items-center gap-3 shadow-sm ${alert.type === 'danger' ? 'bg-red-50 border-red-500 text-red-700' : 'bg-amber-50 border-amber-500 text-amber-700'}`}>
                     <span className="material-icons-round">{alert.type === 'danger' ? 'error' : 'warning'}</span>
                     <span className="font-bold text-sm">{alert.msg}</span>
                  </div>
               ))}
            </div>
         )}

         {/* BLOCK 1: MAIN KPIs */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4">
            <KPICard label="Ventas Totales" value={currentData.sales} prev={prevData.sales} color="text-slate-800" icon="point_of_sale" />
            <KPICard label="Costo Inventario (COGS)" value={currentData.cogs} prev={prevData.cogs} inverse color="text-orange-600" icon="inventory_2" />
            <KPICard label="Gastos Operativos" value={currentData.opExpenses} prev={prevData.opExpenses} inverse color="text-red-500" icon="payments" />
            <KPICard label="Utilidad Bruta" value={currentData.grossProfit} prev={prevData.grossProfit} color="text-blue-600" icon="account_balance_wallet" />

            <KPICard label="Utilidad Operativa" value={currentData.operatingProfit} prev={prevData.operatingProfit} color="text-indigo-600" icon="settings_accessibility" />
            <KPICard label="Utilidad Neta" value={currentData.netProfit} prev={prevData.netProfit} color="text-emerald-600" bg="bg-emerald-50 border-emerald-100" icon="monetization_on" />

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm col-span-1 md:col-span-2 flex flex-col justify-center">
               <div className="flex justify-between items-start">
                  <div>
                     <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Punto de Equilibrio</p>
                     <h3 className="text-3xl font-black text-slate-800 tracking-tight">{formatMoney(currentData.breakEvenPoint)}</h3>
                  </div>
                  <div className="text-right">
                     <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Días para cubrir</p>
                     <h3 className="text-3xl font-black text-blue-600 tracking-tight">{currentData.breakEvenDays.toFixed(1)} <span className="text-sm text-slate-400 font-bold">días</span></h3>
                  </div>
               </div>
               <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="flex justify-between text-xs font-bold mb-1">
                     <span className="text-slate-500">Progreso actual</span>
                     <span className={`${currentData.sales >= currentData.breakEvenPoint ? 'text-emerald-500' : 'text-slate-400'}`}>
                        {currentData.breakEvenPoint > 0 ? ((currentData.sales / currentData.breakEvenPoint) * 100).toFixed(0) : 0}%
                     </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                     <div className={`h-full ${currentData.sales >= currentData.breakEvenPoint ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${Math.min((currentData.sales / currentData.breakEvenPoint) * 100, 100)}%` }}></div>
                  </div>
               </div>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* BLOCK 2: MONEY DISTRIBUTION */}
            <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
               <h3 className="font-bold text-lg text-slate-900 absolute top-8 left-8">Distribución de Ingresos</h3>

               <div className="mt-12 relative w-64 h-64">
                  <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                     <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="20" />
                     {/* Segments - Simplified calculation for demo (segments need cumulative offsets) */}
                     <DonutSegment total={currentData.sales} value={currentData.cogs} offset={0} color="#f97316" />
                     <DonutSegment total={currentData.sales} value={currentData.payroll} offset={currentData.cogs} color="#3b82f6" />
                     <DonutSegment total={currentData.sales} value={currentData.services} offset={currentData.cogs + currentData.payroll} color="#a855f7" />
                     <DonutSegment total={currentData.sales} value={currentData.otherExpenses} offset={currentData.cogs + currentData.payroll + currentData.services} color="#cbd5e1" />
                     <DonutSegment total={currentData.sales} value={currentData.netProfit} offset={currentData.cogs + currentData.payroll + currentData.services + currentData.otherExpenses} color="#10b981" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                     <span className="text-xs font-bold text-slate-400 uppercase">Ventas</span>
                     <span className="text-2xl font-black text-slate-900">{formatMoney(currentData.sales)}</span>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-x-8 gap-y-3 w-full mt-8 px-4">
                  <LegendItem color="bg-orange-500" label="Inventario" value={currentData.cogs} total={currentData.sales} />
                  <LegendItem color="bg-blue-500" label="Nómina" value={currentData.payroll} total={currentData.sales} />
                  <LegendItem color="bg-purple-500" label="Servicios" value={currentData.services} total={currentData.sales} />
                  <LegendItem color="bg-slate-300" label="Otros" value={currentData.otherExpenses} total={currentData.sales} />
                  <LegendItem color="bg-emerald-500" label="Utilidad" value={currentData.netProfit} total={currentData.sales} />
               </div>
            </div>

            {/* BLOCK 3: FINANCIAL HEALTH */}
            <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm flex flex-col">
               <h3 className="font-bold text-lg text-slate-900 mb-8">Salud Financiera</h3>
               <div className="space-y-6 flex-1">
                  <HealthIndicator
                     label="Margen Neto"
                     value={currentData.netMargin}
                     suffix="%"
                     status={currentData.netMargin > 20 ? 'good' : currentData.netMargin > 10 ? 'warning' : 'bad'}
                     target="> 20%"
                  />
                  <HealthIndicator
                     label="Nómina / Ventas"
                     value={currentData.sales > 0 ? (currentData.payroll / currentData.sales) * 100 : 0}
                     suffix="%"
                     status={(currentData.payroll / currentData.sales) < 0.35 ? 'good' : (currentData.payroll / currentData.sales) < 0.45 ? 'warning' : 'bad'}
                     target="< 35%"
                     inverse
                  />
                  <HealthIndicator
                     label="Gastos Ops / Ventas"
                     value={currentData.sales > 0 ? (currentData.opExpenses / currentData.sales) * 100 : 0}
                     suffix="%"
                     status={(currentData.opExpenses / currentData.sales) < 0.60 ? 'good' : (currentData.opExpenses / currentData.sales) < 0.75 ? 'warning' : 'bad'}
                     target="< 60%"
                     inverse
                  />
               </div>
               <div className="mt-8 p-4 bg-slate-50 rounded-2xl">
                  <h4 className="font-bold text-sm text-slate-800 mb-2">Diagnóstico Rápido</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                     {currentData.netMargin > 20
                        ? 'Tu estructura financiera es sólida. Excelente gestión de costos.'
                        : currentData.netMargin > 10
                           ? 'Estable, pero vigila los gastos hormiga y el costo de inventario.'
                           : 'Atención crítica requerida. Revisa el costo de platos y reduce gastos fijos.'}
                  </p>
               </div>
            </div>

            {/* BLOCK 4: TRENDS */}
            <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm lg:col-span-1 flex flex-col">
               <h3 className="font-bold text-lg text-slate-900 mb-8">Tendencia (6 Meses)</h3>
               <div className="flex-1 flex items-end gap-2 relative min-h-[200px]">
                  {historyData.map((d, i) => {
                     const max = Math.max(...historyData.map(h => Math.max(h.sales, h.expenses))) || 1;
                     return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                           <div className="w-full flex items-end gap-[1px] h-full justify-center">
                              {/* Sales Bar */}
                              <div className="w-2 bg-slate-800 rounded-t-sm transition-all hover:bg-slate-700" style={{ height: `${(d.sales / max) * 60}%` }} title={`Ventas: ${formatMoney(d.sales)}`}></div>
                              {/* Expenses Bar */}
                              <div className="w-2 bg-red-400 rounded-t-sm transition-all hover:bg-red-500" style={{ height: `${(d.expenses / max) * 60}%` }} title={`Gastos: ${formatMoney(d.expenses)}`}></div>
                              {/* Net Bar (Positive only for height viz) */}
                              <div className="w-2 bg-emerald-400 rounded-t-sm transition-all hover:bg-emerald-500" style={{ height: `${Math.max((d.net / max) * 60, 2)}%` }} title={`Utilidad: ${formatMoney(d.net)}`}></div>
                           </div>
                           <span className="text-[9px] font-black uppercase text-slate-400">{d.label}</span>
                        </div>
                     )
                  })}
               </div>
               <div className="mt-6 flex flex-wrap gap-4 text-[10px] font-black uppercase text-slate-400 justify-center">
                  <div className="flex items-center gap-1"><div className="w-2 h-2 bg-slate-800 rounded-full"></div> Ventas</div>
                  <div className="flex items-center gap-1"><div className="w-2 h-2 bg-red-400 rounded-full"></div> Egresos</div>
                  <div className="flex items-center gap-1"><div className="w-2 h-2 bg-emerald-400 rounded-full"></div> Utilidad</div>
               </div>
            </div>
         </div>
      </div>
   );
};

// --- SUBCOMPONENTS ---

const KPICard = ({ label, value, prev, color, inverse, bg = "bg-white", icon }: any) => {
   const formatMoney = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
   return (
      <div className={`${bg} p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between transition-hover hover:shadow-md`}>
         <div className="flex justify-between items-start mb-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color.replace('text-', 'bg-').replace('600', '100').replace('500', '100')} ${color}`}>
               <span className="material-icons-round">{icon}</span>
            </div>
            {/* Trend here */}
         </div>
         <div>
            <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">{label}</p>
            <div className="flex items-end gap-3 justify-between">
               <h3 className={`text-2xl font-black ${color} tracking-tight leading-none`}>{formatMoney(value)}</h3>
               {/* Render helper locally or passed props */}
            </div>
            {prev !== undefined && (
               <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">{formatMoney(prev)} prev.</span>
                  <TrendIndicatorWrapper curr={value} prev={prev} inverse={inverse} />
               </div>
            )}
         </div>
      </div>
   );
};

const TrendIndicatorWrapper = ({ curr, prev, inverse }: any) => {
   const diff = prev === 0 ? (curr > 0 ? 100 : 0) : ((curr - prev) / prev) * 100;
   const dir = diff >= 0 ? 'up' : 'down';
   const isGood = inverse ? dir === 'down' : dir === 'up';
   const color = isGood ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50';
   const icon = dir === 'up' ? 'arrow_upward' : 'arrow_downward';
   return (
      <span className={`flex items-center gap-1 text-[10px] font-black px-1.5 py-0.5 rounded ${color}`}>
         <span className="material-icons-round text-[10px]">{icon}</span>
         {Math.abs(diff).toFixed(0)}%
      </span>
   );
};

const DonutSegment = ({ total, value, offset, color }: any) => {
   if (total === 0) return null;
   const circumference = 2 * Math.PI * 40; // r=40
   const dash = (value / total) * circumference;
   const gap = circumference - dash;
   const dashOffset = -((offset / total) * circumference); // Negative for clockwise? Svg coordinate system...

   // transform-rotate-90 in parent makes it start at top.
   // stroke-dasharray="dash gap"
   // stroke-dashoffset needs to accumulate.

   return (
      <circle
         cx="50" cy="50" r="40"
         fill="transparent"
         stroke={color}
         strokeWidth="10"
         strokeDasharray={`${dash} ${circumference}`}
         strokeDashoffset={-((offset / total) * circumference)}
         className="transition-all duration-1000 ease-out"
      />
   );
};

const LegendItem = ({ color, label, value, total }: any) => (
   <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
         <div className={`w-2 h-2 rounded-full ${color}`}></div>
         <span className="text-xs font-bold text-slate-600 truncate">{label}</span>
      </div>
      <div className="text-right">
         <span className="block text-xs font-black text-slate-800">{((value / total) * 100).toFixed(0)}%</span>
         <span className="block text-[8px] font-bold text-slate-400">${value.toLocaleString('en-US', { notation: "compact" })}</span>
      </div>
   </div>
);

const HealthIndicator = ({ label, value, suffix, status, target, inverse }: any) => {
   const colors = {
      good: 'bg-emerald-500',
      warning: 'bg-amber-400',
      bad: 'bg-red-500'
   };
   const textColors = {
      good: 'text-emerald-700',
      warning: 'text-amber-700',
      bad: 'text-red-700'
   };

   return (
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${colors[status as keyof typeof colors]} shadow-sm`}></div>
            <div>
               <h4 className="text-sm font-bold text-slate-700">{label}</h4>
               <p className="text-[10px] font-bold text-slate-400">Meta: {target}</p>
            </div>
         </div>
         <div className="text-right">
            <span className={`text-lg font-black ${textColors[status as keyof typeof textColors]}`}>
               {value.toFixed(1)}{suffix}
            </span>
         </div>
      </div>
   );
};

export default FinanceView;
