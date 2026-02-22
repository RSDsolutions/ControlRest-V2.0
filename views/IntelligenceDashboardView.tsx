import React, { useState } from 'react';
import { useIntelligence } from '../hooks/useIntelligence';
import { AlertSeverity, AlertType, SmartAlert, SmartSuggestion } from '../types';
import SimulationModal from '../components/SimulationModal';

interface IntelligenceDashboardViewProps {
    branchId: string | 'GLOBAL' | null;
}

const IntelligenceDashboardView: React.FC<IntelligenceDashboardViewProps> = ({ branchId }) => {
    const { alerts, suggestions, rawEvents: events, loading } = useIntelligence(branchId);
    const [activeTab, setActiveTab] = useState<'alerts' | 'recommendations'>('alerts');
    const [selectedSuggestion, setSelectedSuggestion] = useState<SmartSuggestion | null>(null);

    // Explicitly show branch context
    const branchLabel = branchId === 'GLOBAL' ? 'Visión Global (Multi-Sucursal)' : `Sucursal: ${branchId}`;

    const severityColors = {
        [AlertSeverity.CRITICAL]: 'bg-red-50 border-red-200 text-red-800',
        [AlertSeverity.WARNING]: 'bg-amber-50 border-amber-200 text-amber-800',
        [AlertSeverity.INFO]: 'bg-blue-50 border-blue-200 text-blue-800',
    };

    const severityIcons = {
        [AlertSeverity.CRITICAL]: 'report',
        [AlertSeverity.WARNING]: 'warning',
        [AlertSeverity.INFO]: 'info',
    };

    const typeIcons = {
        [AlertType.INVENTORY]: 'inventory_2',
        [AlertType.FINANCIAL]: 'payments',
        [AlertType.SUPPLIER]: 'local_shipping',
        [AlertType.CASH]: 'point_of_sale',
        [AlertType.ADMIN]: 'admin_panel_settings',
    };

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="p-6 h-full flex flex-col animate-fade-in max-w-[1400px] mx-auto">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <span className="material-icons-round text-primary">psychology</span>
                        Inteligencia Operativa
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest">{branchLabel}</span>
                        <p className="text-slate-500 font-medium whitespace-nowrap">
                            • Comando Central de Desempeño y Notificaciones.
                        </p>
                    </div>
                </div>
            </header>

            <div className="flex flex-col lg:flex-row gap-8 flex-1 pb-12">

                {/* LEFT COLUMN: 70% Width - Health Report & AI Suggestions */}
                <div className="lg:w-2/3 flex flex-col gap-6">

                    {/* Analytics Summary - Dynamic Health Report */}
                    {(() => {
                        const healthEvent = events.find((e: any) => e.event_type === 'efficiency_leak' && e.resolved === false) ||
                            events.find((e: any) => e.event_type === 'profit_deviation' && e.resolved === false) ||
                            events.find((e: any) => e.event_type === 'margin_drift' && e.resolved === false);

                        if (!healthEvent) return null;

                        const isProfit = healthEvent.event_type === 'profit_deviation';
                        const isLeak = healthEvent.event_type === 'efficiency_leak';
                        let meta: any = {};
                        try { meta = typeof healthEvent.metadata === 'string' ? JSON.parse(healthEvent.metadata) : (healthEvent.metadata || {}); } catch (e) { }

                        let title = "";
                        if (isLeak) {
                            title = `Fuga de eficiencia crítica: Los gastos representan el ${((meta.ratio || 0.5) * 100).toFixed(0)}% de tus ventas.`;
                        } else if (isProfit) {
                            const isExpenseDriven = meta.expenses > meta.avg_expenses;
                            title = isExpenseDriven
                                ? `Incremento de costos operativos detectado (${((meta.expenses / meta.avg_expenses - 1) * 100).toFixed(0)}% s/ promedio).`
                                : `Tu margen operativo está en riesgo de desviación del ${Math.abs(meta.trend_pct || 0).toFixed(0)}%.`;
                        } else {
                            title = `Margen crítico detectado en: ${meta.recipe_name || 'Receta'}.`;
                        }

                        const description = healthEvent.impact_projection || "El aumento en los costos no se ha visto reflejado en los ingresos o hay un desvío en el flujo de caja.";
                        const impactLabel = isLeak ? "GASTO MENSUAL" : (isProfit ? "RIESGO" : "IMPACTO ESTIMADO");
                        const impactColor = isLeak ? "text-amber-400" : "text-red-400";

                        return (
                            <div className="bg-[#0f172a] rounded-[2rem] p-8 text-white relative shadow-2xl flex flex-col md:flex-row gap-8 items-center justify-between border border-white/5">
                                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] -mr-48 -mt-48 pointer-events-none"></div>
                                <div className="relative z-10 flex-1 w-full">
                                    <h4 className="text-[10px] font-black uppercase text-blue-400 tracking-[0.2em] mb-4">REPORTE DE SALUD FINANCIERA</h4>
                                    <h2 className="text-2xl md:text-3xl font-bold mb-4 leading-tight text-white">{title}</h2>
                                    <p className="text-slate-300 text-sm font-medium leading-relaxed">{description} <span className="text-blue-400">{healthEvent.recommended_action}</span></p>
                                </div>
                                <div className="relative z-10 flex flex-col gap-4 w-full md:w-auto shrink-0">
                                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 min-w-[180px]">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{impactLabel}</p>
                                        <p className={`text-3xl font-black ${impactColor}`}>
                                            {isLeak ? `$${meta.expenses.toLocaleString('en-US')}` : `-$${Math.abs(healthEvent.impact_value || 0).toLocaleString('en-US')}`}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    {/* AI Suggestions Grid */}
                    <div className="flex items-center justify-between mt-2">
                        <h2 className="text-lg font-black text-slate-800">Sugerencias Estratégicas</h2>
                        <span className="bg-primary/10 tracking-widest text-primary text-[10px] font-black px-2 py-1 rounded-full">{suggestions.length} ACTIVAS</span>
                    </div>

                    {suggestions.length === 0 ? (
                        <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-16 flex flex-col items-center justify-center text-center">
                            <span className="material-icons-round text-slate-200 text-6xl mb-4">lightbulb</span>
                            <h3 className="text-xl font-bold text-slate-400">Visualizando Datos...</h3>
                            <p className="text-slate-400 max-w-xs mt-2">Nuestra IA está monitoreando tus márgenes e inventarios 24/7.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {suggestions.map(suggestion => (
                                <div key={suggestion.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between hover:shadow-xl hover:border-primary/20 transition-all group overflow-hidden relative">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-primary/10 transition-all"></div>
                                    <div className="relative z-10">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                                                <span className="material-icons-round text-2xl">{suggestion.category === 'inventory' ? 'delete_sweep' : 'timeline'}</span>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{suggestion.category}</p>
                                            </div>
                                        </div>
                                        <h3 className="text-lg font-black text-slate-900 mb-2 leading-tight">{suggestion.title}</h3>
                                        <p className="text-sm text-slate-600 font-medium mb-6 line-clamp-3">{suggestion.description}</p>

                                        {suggestion.impactFinancial && (
                                            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-6">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1 text-center">Recuperación Proyectada</p>
                                                <p className="text-2xl font-black text-emerald-600 text-center">{suggestion.impactFinancial}</p>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => setSelectedSuggestion(suggestion)}
                                        className="relative z-10 w-full bg-primary text-white py-3 rounded-2xl text-xs font-black shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all text-center"
                                    >
                                        {suggestion.actionLabel}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* RIGHT COLUMN: 30% Width - Operational Timeline Feed */}
                <div className="lg:w-1/3 flex flex-col bg-slate-50 border border-slate-200 rounded-[2rem] p-6 h-fit max-h-[calc(100vh-160px)] overflow-y-auto hide-scrollbar sticky top-6">
                    <div className="flex items-center justify-between mb-6 sticky top-0 bg-slate-50 z-10 pb-2">
                        <h2 className="text-lg font-black text-slate-800">Inbox Operativo</h2>
                        <span className="bg-slate-200 text-slate-600 tracking-widest text-[10px] font-black px-2 py-1 rounded-full">{alerts.length} EVENTOS</span>
                    </div>

                    {alerts.length === 0 ? (
                        <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-10 flex flex-col items-center justify-center text-center my-auto">
                            <span className="material-icons-round text-slate-200 text-5xl mb-3">check_circle</span>
                            <h3 className="text-sm font-bold text-slate-400">Cero incidencias</h3>
                        </div>
                    ) : (
                        <div className="relative pl-3 space-y-6">
                            {/* Vertical Timeline Line */}
                            <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-slate-200"></div>

                            {alerts.map(alert => (
                                <div key={alert.id} className="relative pl-10 group">
                                    {/* Timeline Node */}
                                    <div className={`absolute left-0 top-1 w-10 h-10 rounded-full border-[3px] border-slate-50 flex items-center justify-center shadow-sm z-10 ${severityColors[alert.severity].split(' ')[0]} ${severityColors[alert.severity].split(' ')[2]}`}>
                                        <span className="material-icons-round text-[20px]">{severityIcons[alert.severity]}</span>
                                    </div>

                                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm group-hover:shadow-md transition-shadow">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-[0.2em] ${severityColors[alert.severity].replace('text-', 'bg-').replace('100', '10')}`}>
                                                {alert.type}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-400">Justo ahora</span>
                                        </div>
                                        <h3 className="text-[13px] font-black text-slate-800 leading-tight mb-1">{alert.title}</h3>
                                        <p className="text-[12px] text-slate-500 font-medium leading-relaxed">{alert.message}</p>

                                        {alert.actionLabel && alert.actionLabel !== 'Revisar' && (
                                            <button className="mt-3 text-[11px] font-bold text-primary hover:text-primary-dark hover:underline transition-all">
                                                {alert.actionLabel} &rarr;
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Read-Only Simulation Modal Layer */}
            <SimulationModal
                isOpen={!!selectedSuggestion}
                onClose={() => setSelectedSuggestion(null)}
                suggestion={selectedSuggestion}
                branchId={branchId}
            />
        </div>
    );
};

export default IntelligenceDashboardView;
