
import React, { useState, useMemo } from 'react';
import { Order, Ingredient, Expense, Plate, WasteRecord } from '../types';
import { usePlanFeatures, isFeatureEnabled } from '../hooks/usePlanFeatures';
import PlanUpgradeFullPage from '../components/PlanUpgradeFullPage';

interface FinanceViewProps {
   orders: Order[];
   ingredients: Ingredient[];
   expenses: Expense[];
   plates: Plate[];
   wasteRecords: WasteRecord[];
   branchId?: string | 'GLOBAL' | null;
   restaurantId?: string | null;
}

const FinanceView: React.FC<FinanceViewProps> = ({ orders, ingredients, expenses, plates, wasteRecords, branchId, restaurantId }) => {
   const [currentDate, setCurrentDate] = useState(new Date());
   const { data: planData, isLoading: featuresLoading } = usePlanFeatures(restaurantId || undefined);
   const canViewFinancials = isFeatureEnabled(planData, 'ENABLE_NET_PROFIT_CALCULATION');

   if (featuresLoading) {
      return (
         <div className="p-8 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
         </div>
      );
   }

   if (!canViewFinancials) {
      return (
         <PlanUpgradeFullPage
            featureName="Análisis Financiero Avanzado"
            description="El resumen de rentabilidad, cálculo de márgenes netos y punto de equilibrio están disponibles en planes superiores. Optimiza tu salud financiera con datos precisos."
         />
      );
   }

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
      <div className="p-8 space-y-10 animate-fade-in max-w-[1600px] mx-auto pb-24 font-sans bg-slate-50/30">
         {/* HEADER */}
         <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-[#136dec] rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <span className="material-icons-round text-white text-2xl">bar_chart</span>
               </div>
               <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">Tablero Financiero</h1>
                  <p className="text-sm font-medium text-slate-400">Análisis de rentabilidad y salud financiera del periodo.</p>
               </div>
            </div>
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-3 bg-white px-5 py-2.5 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="material-icons-round text-slate-400">calendar_today</span>
                  <input
                     type="month"
                     className="bg-transparent border-none outline-none text-sm font-bold text-slate-700 cursor-pointer"
                     value={`${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`}
                     onChange={e => {
                        const [y, m] = e.target.value.split('-');
                        setCurrentDate(new Date(parseInt(y), parseInt(m) - 1, 1));
                     }}
                  />
               </div>
               <button className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 text-slate-600 hover:text-blue-600 transition-colors">
                  <span className="material-icons-round">dark_mode</span>
               </button>
            </div>
         </header>

         {/* ALERTS */}
         {alerts.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {alerts.map((alert, i) => (
                  <div key={i} className={`p-6 rounded-[28px] border flex items-center gap-5 animate-fade-in transition-all hover:scale-[1.01] ${alert.type === 'danger'
                     ? 'bg-red-50/50 border-red-100 text-red-700'
                     : 'bg-amber-50/50 border-amber-100 text-amber-700'
                     }`}>
                     <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${alert.type === 'danger' ? 'bg-red-500 text-white' : 'bg-amber-400 text-white'
                        }`}>
                        <span className="material-icons-round text-2xl">
                           {alert.type === 'danger' ? 'error' : 'warning'}
                        </span>
                     </div>
                     <span className="font-bold text-base tracking-tight">{alert.msg}</span>
                  </div>
               ))}
            </div>
         )}

         {/* MAIN KPIs */}
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <KPICard label="Ingresos Totales" value={currentData.sales} prev={prevData.sales} color="text-slate-900" icon="trending_up" iconBg="bg-slate-900 text-white" />
            <KPICard label="Costos Mercancía (COGS)" value={currentData.cogs} prev={prevData.cogs} inverse color="text-[#f59e0b]" icon="shopping_basket" iconBg="bg-[#fef3c7] text-[#f59e0b]" />
            <KPICard label="Gastos Operativos" value={currentData.opExpenses} prev={prevData.opExpenses} inverse color="text-[#f43f5e]" icon="account_balance" iconBg="bg-[#fff1f2] text-[#f43f5e]" />
            <KPICard label="Margen Bruto" value={currentData.grossProfit} prev={prevData.grossProfit} color="text-[#2563eb]" icon="donut_large" iconBg="bg-[#dbeafe] text-[#2563eb]" />
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            <div className="lg:col-span-4">
               <KPICard label="EBITDA Proyectado" value={currentData.operatingProfit} prev={prevData.operatingProfit} color="text-[#6366f1]" icon="bar_chart" iconBg="bg-[#eef2ff] text-[#6366f1]" isBig />
            </div>
            <div className="lg:col-span-4">
               <KPICard label="Utilidad Neta del Periodo" value={currentData.netProfit} prev={prevData.netProfit} color="text-white" bg="bg-[#0f172a]" isDark icon="stars" isBig />
            </div>
            <div className="lg:col-span-4 bg-white p-10 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col justify-between h-full">
               <div className="flex justify-between items-start mb-6">
                  <div>
                     <p className="text-[10px] uppercase font-black text-slate-400 tracking-[0.2em] mb-3">Punto de Equilibrio</p>
                     <h3 className="text-4xl font-heading font-black text-slate-900 tracking-tighter">{formatMoney(currentData.breakEvenPoint)}</h3>
                     <p className="text-[11px] font-bold text-slate-400 mt-2 max-w-[180px]">Monto necesario para cubrir costos fijos.</p>
                  </div>
                  <div className="text-right">
                     <p className="text-[10px] uppercase font-black text-slate-400 tracking-[0.2em] mb-3">Retorno de Punto</p>
                     <div className="flex items-center justify-end gap-1.5">
                        <h3 className="text-4xl font-heading font-black text-blue-500 tracking-tighter">{currentData.breakEvenDays.toFixed(1)}</h3>
                        <span className="text-[10px] font-black text-slate-400 uppercase pt-2">Días</span>
                     </div>
                  </div>
               </div>
               <div className="mt-auto pt-6 border-t border-slate-50">
                  <div className="flex justify-between text-[11px] font-black uppercase tracking-widest mb-3">
                     <span className="text-slate-400">Progreso Operativo</span>
                     <span className="text-emerald-500">{currentData.breakEvenPoint > 0 ? ((currentData.sales / currentData.breakEvenPoint) * 100).toFixed(0) : 0}% COMPLETADO</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                     <div
                        className={`h-full transition-all duration-1000 ${currentData.sales >= currentData.breakEvenPoint ? 'bg-emerald-500' : 'bg-[#2563eb]'}`}
                        style={{ width: `${Math.min((currentData.sales / currentData.breakEvenPoint) * 100, 100)}%` }}
                     ></div>
                  </div>
               </div>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* DISTRIBUTION: Estructura de Costos */}
            <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col items-center">
               <div className="w-full flex justify-between items-center mb-10">
                  <h3 className="font-heading font-black text-xl text-slate-900 tracking-tight flex items-center gap-2">
                     <span className="material-icons-round text-slate-300">donut_large</span> Estructura de Costos
                  </h3>
               </div>

               {(() => {
                  const totalExpenditure = currentData.cogs + currentData.wasteCost + currentData.payroll + currentData.services + (currentData.otherExpenses || 0);
                  const donutBasis = Math.max(currentData.sales, totalExpenditure) || 1;
                  return (
                     <>
                        <div className="relative w-64 h-64 mb-10">
                           <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                              <circle cx="50" cy="50" r="42" fill="transparent" stroke="#f8fafc" strokeWidth="11" />
                              {/* Segments - Sequential offsets for stacked donut */}
                              <DonutSegment total={donutBasis} value={currentData.cogs} offset={0} color="#f97316" />
                              <DonutSegment total={donutBasis} value={currentData.wasteCost} offset={currentData.cogs} color="#f43f5e" />
                              <DonutSegment total={donutBasis} value={currentData.payroll} offset={currentData.cogs + currentData.wasteCost} color="#3b82f6" />
                              <DonutSegment total={donutBasis} value={currentData.services} offset={currentData.cogs + currentData.wasteCost + currentData.payroll} color="#8b5cf6" />
                              <DonutSegment total={donutBasis} value={currentData.otherExpenses} offset={currentData.cogs + currentData.wasteCost + currentData.payroll + currentData.services} color="#94a3b8" />
                              {currentData.netProfit > 0 && (
                                 <DonutSegment total={donutBasis} value={currentData.netProfit} offset={totalExpenditure} color="#10b981" />
                              )}
                           </svg>
                           <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Facturación</span>
                              <span className="text-2xl font-heading font-black text-slate-900 mt-1">
                                 ${currentData.sales.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
                              </span>
                           </div>
                        </div>

                        <div className="grid grid-cols-1 gap-2 w-full">
                           <LegendItem2 color="bg-[#f97316]" label="Costo de Ventas (COGS)" value={currentData.cogs} total={currentData.sales} />
                           <LegendItem2 color="bg-[#f43f5e]" label="Pérdidas y Mermas" value={currentData.wasteCost} total={currentData.sales} />
                           <LegendItem2 color="bg-[#3b82f6]" label="Gastos de Personal" value={currentData.payroll} total={currentData.sales} />
                           <LegendItem2 color="bg-[#8b5cf6]" label="Servicios Generales" value={currentData.services} total={currentData.sales} />
                           <LegendItem2 color="bg-[#94a3b8]" label="Otros Gastos Operativos" value={currentData.otherExpenses} total={currentData.sales} />
                           {currentData.netProfit > 0 && (
                              <LegendItem2 color="bg-[#10b981]" label="Utilidad Neta del Periodo" value={currentData.netProfit} total={currentData.sales} />
                           )}
                        </div>
                     </>
                  );
               })()}
            </div>

            {/* FINANCIAL HEALTH: Indicadores de Salud */}
            <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col relative overflow-hidden">
               <div className="w-full flex justify-between items-center mb-10">
                  <h3 className="font-heading font-black text-xl text-slate-900 tracking-tight flex items-center gap-2">
                     <span className="material-icons-round text-slate-300">security</span> Indicadores de Salud
                  </h3>
               </div>

               {isFeatureEnabled(planData, 'ENABLE_AUDIT_LOGS') ? (
                  <>
                     <div className="space-y-10 flex-1">
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

                     <div className="mt-10 p-8 bg-[#f0f7ff] rounded-3xl border border-blue-100 relative group transition-all hover:bg-blue-100/50">
                        <div className="absolute top-6 right-6 text-blue-500/10">
                           <span className="material-icons-round text-5xl">psychology</span>
                        </div>
                        <h4 className="font-black text-[11px] text-blue-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                           <span className="material-icons-round text-base">info</span> ANÁLISIS INTELIGENTE
                        </h4>
                        <p className="text-xs text-slate-600 leading-relaxed font-bold">
                           {currentData.netMargin > 20
                              ? 'Tu estructura financiera es excepcionalmente eficiente. El control de gastos y el costo de platos están en niveles óptimos.'
                              : currentData.netMargin > 10
                                 ? 'Tu negocio es autosuficiente, pero existen oportunidades para optimizar la eficiencia operativa.'
                                 : 'Estructura financiera en riesgo. Requiere revisión inmediata de ingeniería de menú y reducción agresiva de gastos fijos.'}
                        </p>
                     </div>
                  </>
               ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                     <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4">
                        <span className="material-icons-round text-slate-300 text-3xl">lock</span>
                     </div>
                     <h4 className="text-sm font-black text-slate-900 mb-2">Análisis de Salud e Inteligencia</h4>
                     <p className="text-[11px] text-slate-500 leading-relaxed font-medium mb-6 max-w-[200px]">
                        La auditoría de salud financiera y sugerencias inteligentes no están disponibles en este plan.
                     </p>
                     <button className="text-[10px] font-black text-[#136dec] uppercase tracking-widest hover:underline">
                        Actualizar para Desbloquear
                     </button>
                  </div>
               )}
            </div>

            {/* TRENDS: Desempeño Histórico */}
            <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col">
               <div className="w-full flex justify-between items-center mb-10">
                  <h3 className="font-heading font-black text-xl text-slate-900 tracking-tight flex items-center gap-2">
                     <span className="material-icons-round text-slate-300">insights</span> Desempeño Histórico
                  </h3>
               </div>

               <div className="flex-1 flex items-end gap-3 min-h-[300px] px-2 relative mb-12">
                  {historyData.map((d, i) => {
                     const maxVal = Math.max(...historyData.map(h => Math.max(h.sales, h.expenses))) || 1;
                     return (
                        <div key={i} className="flex-1 flex flex-col items-center group h-full justify-end">
                           <div className="flex items-end gap-1.5 h-full w-full justify-center">
                              <div
                                 className="w-2.5 bg-[#0f172a] rounded-full transition-all hover:scale-x-110"
                                 style={{ height: `${(d.sales / maxVal) * 85}%` }}
                              />
                              <div
                                 className="w-2.5 bg-[#f43f5e] rounded-full transition-all hover:scale-x-110"
                                 style={{ height: `${(d.expenses / maxVal) * 85}%` }}
                              />
                              <div
                                 className="w-2.5 bg-[#10b981] rounded-full transition-all hover:scale-x-110"
                                 style={{ height: `${Math.max((Math.abs(d.net) / maxVal) * 85, 4)}%` }}
                              />
                           </div>
                           <span className="text-[10px] font-black uppercase text-slate-400 mt-6 tracking-tighter">{d.label}</span>
                        </div>
                     );
                  })}
               </div>

               <div className="flex flex-wrap gap-5 text-[10px] font-black uppercase text-slate-400 justify-center tracking-widest pt-8 border-t border-slate-50">
                  <div className="flex items-center gap-2"><div className="w-2 h-2 bg-[#000] rounded-full"></div> INGRESOS</div>
                  <div className="flex items-center gap-2"><div className="w-2 h-2 bg-[#f43f5e] rounded-full"></div> EGRESOS</div>
                  <div className="flex items-center gap-2"><div className="w-2 h-2 bg-[#10b981] rounded-full"></div> UTILIDAD</div>
               </div>
            </div>
         </div>
      </div>
   );
};

// --- SUBCOMPONENTS ---

const KPICard = ({ label, value, prev, color, inverse, bg = "bg-white", isDark, icon, iconBg, isBig }: any) => {
   const formatMoney = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

   return (
      <div className={`p-10 rounded-[40px] border shadow-xl transition-all duration-300 hover:-translate-y-1 ${isDark ? 'bg-[#0f172a] border-slate-800 shadow-slate-900/40' : 'bg-white border-slate-100 shadow-slate-200/40'
         } ${isBig ? 'h-full flex flex-col justify-center' : ''}`}>
         <div className="flex justify-between items-start mb-8">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${iconBg || (isDark ? 'bg-white/10 text-white' : 'bg-slate-100')}`}>
               <span className="material-icons-round text-2xl">{icon}</span>
            </div>
            {prev !== undefined && (
               <TrendIndicatorWrapper curr={value} prev={prev} inverse={inverse} isDark={isDark} />
            )}
         </div>
         <div className="space-y-2">
            <p className={`text-[11px] uppercase font-black tracking-[0.2em] ${isDark ? 'text-white/40' : 'text-slate-400'}`}>{label}</p>
            <h3 className={`text-4xl font-heading font-black tracking-tighter ${isDark ? 'text-white' : 'text-slate-900'}`}>
               {value < 0 ? '-' : ''}${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </h3>
            {prev !== undefined && (
               <div className={`pt-4 border-t mt-4 flex items-center gap-2 ${isDark ? 'border-white/5' : 'border-slate-50'}`}>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-white/20' : 'text-slate-400'}`}>
                     PREVIO: {formatMoney(prev)}
                  </span>
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

const LegendItem2 = ({ color, label, value, total }: any) => (
   <div className="flex items-center justify-between p-4 group">
      <div className="flex items-center gap-4">
         <div className={`w-3 h-3 rounded-full ${color}`}></div>
         <span className="text-[13px] font-bold text-slate-600 transition-colors group-hover:text-slate-900">{label}</span>
      </div>
      <div className="text-right">
         <span className="block text-[13px] font-black text-slate-900 tracking-tight">{((value / total) * 100).toFixed(1)}%</span>
         <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">${value.toLocaleString('en-US', { minimumFractionDigits: 0 })}</span>
      </div>
   </div>
);

const HealthIndicator = ({ label, value, suffix, status, target }: any) => {
   const barColors = {
      good: 'bg-emerald-500',
      warning: 'bg-amber-400',
      bad: 'bg-red-500'
   };
   const textColors = {
      good: 'text-emerald-500',
      warning: 'text-amber-500',
      bad: 'text-red-500'
   };

   return (
      <div className="flex items-center justify-between group">
         <div className="flex items-center gap-5">
            <div className={`w-1.5 h-12 rounded-full ${barColors[status as keyof typeof barColors]}`}></div>
            <div>
               <h4 className="text-base font-black text-slate-900 tracking-tight">{label}</h4>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">{target}</p>
            </div>
         </div>
         <div className="text-right">
            <span className={`text-4xl font-heading font-black tracking-tighter ${textColors[status as keyof typeof textColors]}`}>
               {value < 0 ? '' : '+'}{value.toFixed(1)}{suffix}
            </span>
         </div>
      </div>
   );
};

export default FinanceView;
