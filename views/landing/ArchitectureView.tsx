import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LandingHeader from './LandingHeader';
import LandingFooter from './LandingFooter';

const ArchitectureView: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const subsystems = [
        {
            title: "Motor de Cálculo de Rentabilidad",
            description: "Núcleo del sistema que ejecuta el recálculo dinámico de Margen Bruto, Utilidad Neta y Food Cost. A diferencia de sistemas tradicionales, no espera al cierre de mes; procesa cada ticket para actualizar el P&L al instante.",
            icon: "calculate",
            details: ["P&L en Tiempo Real", "Data Warehouse"]
        },
        {
            title: "Inventario Valorizado",
            description: "Gestión de stock basada en valor real (Weighted Average Cost). Detecta variaciones de precio en compras y ajusta el costo de receta automáticamente para mantener márgenes precisos.",
            icon: "inventory_2",
            details: ["Costeo WAC", "Alertas de Desvío"]
        },
        {
            title: "Gastos & Cash Flow",
            description: "Registro granular de egresos operativos. Integra costos fijos prorrateados diariamente para determinar el punto de equilibrio dinámico de cada turno o día operativo.",
            icon: "payments",
            details: ["Punto de Equilibrio", "Flujo de Caja"]
        },
        {
            title: "Consolidación Financiera Multi-Sucursal",
            description: "Estructura jerárquica para holdings gastronómicos. Permite el análisis financiero por unidad de negocio, benchmarking y supervisión centralizada de tesorería bajo estándares corporativos.",
            icon: "account_balance",
            details: ["Multi-Branch View", "Local Drill-down"]
        }
    ];

    const processingSteps = [
        {
            step: "1",
            title: "Evento Trigger: Cierre de Mesa",
            description: "El servidor recibe la señal de cierre. Se bloquea la modificación de comanda y se emite el documento fiscal electrónico.",
            icon: "table_restaurant"
        },
        {
            step: "2",
            title: "Explosión de Insumos & Costeo Real",
            description: "El sistema desglosa los platos vendidos en ingredientes (receta estándar). Calcula el costo real del plato basado en el lote de compra actual (FIFO).",
            icon: "analytics"
        },
        {
            step: "3",
            title: "Asignación de Margen de Contribución",
            description: "Se calcula la diferencia entre el precio de venta neto y el costo de mercadería vendida (CMV) para determinar el margen bruto de la transacción.",
            icon: "add_chart"
        },
        {
            step: "4",
            title: "Devengo en Tesorería",
            description: "Registro del ingreso en la cuenta contable correspondiente (Caja, Banco, Cuentas por Cobrar) según el método de pago, deduciendo comisiones bancarias estimadas.",
            icon: "account_balance_wallet"
        },
        {
            step: "5",
            title: "Actualización de Rentabilidad Dinámica",
            description: "El Dashboard Ejecutivo refleja instantáneamente el nuevo EBITDA proyectado, ajustando las métricas de eficiencia operativa del día.",
            icon: "trending_up"
        }
    ];

    return (
        <div className="min-h-screen bg-[#0B1120] text-slate-300 font-sans selection:bg-blue-500/30">
            <LandingHeader />

            <main className="pt-24 pb-20">
                {/* Hero section */}
                <section className="relative py-20 overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-600/10 via-transparent to-transparent -z-10 blur-3xl opacity-50" />

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold mb-8 animate-pulse">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            MOTOR FINANCIERO V2.1 ACTIVO
                        </div>

                        <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight tracking-tight">
                            Arquitectura de <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">Integración Financiera</span> ERP
                        </h1>

                        <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed font-medium">
                            Redefiniendo la gestión gastronómica mediante la unificación de eventos operativos y contables.
                            Trazabilidad total desde la comanda hasta el estado de resultados en tiempo real.
                        </p>

                    </div>
                </section>

                {/* Modelo Section */}
                <section className="py-24 bg-[#0F172A]/50 border-y border-slate-800/60">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold text-white mb-4">Modelo de Integración Operativa</h2>
                            <p className="text-slate-400 max-w-2xl mx-auto leading-relaxed">
                                Eliminamos la brecha histórica entre operación y finanzas. Nuestra arquitectura conecta automáticamente los flujos de Ventas, Inventario, Costos y Gastos.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center relative">
                            {/* Inputs */}
                            <div className="space-y-4">
                                <div className="bg-[#1E293B] p-4 rounded-xl border border-slate-700 text-center">
                                    <span className="text-[10px] text-blue-400 font-bold block mb-1">INPUT</span>
                                    <span className="text-white font-bold">Ventas (POS)</span>
                                </div>
                                <div className="bg-[#1E293B] p-4 rounded-xl border border-slate-700 text-center">
                                    <span className="text-[10px] text-blue-400 font-bold block mb-1">INPUT</span>
                                    <span className="text-white font-bold">Compras (Inv)</span>
                                </div>
                            </div>

                            {/* Processing Center */}
                            <div className="bg-blue-600 rounded-2xl p-8 border border-blue-400/30 text-center shadow-2xl shadow-blue-600/20 py-12">
                                <span className="material-symbols-outlined text-4xl text-white mb-4">settings_suggest</span>
                                <h3 className="text-xl font-bold text-white mb-2">Motor de Procesamiento Financiero</h3>
                                <p className="text-blue-100 text-sm">Conciliación Automática</p>
                            </div>

                            {/* Outputs */}
                            <div className="bg-[#1E293B] p-6 rounded-xl border border-emerald-500/30 text-center">
                                <span className="text-[10px] text-emerald-400 font-bold block mb-1">OUTPUT</span>
                                <span className="text-white font-bold text-lg">Utilidad Operativa Real</span>
                            </div>

                            {/* Visual connections would go here - simplified for now */}
                        </div>

                        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 gap-8 px-4">
                            <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
                                    <span className="material-symbols-outlined">swap_horiz</span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-white mb-1">Conexión Bidireccional</h4>
                                    <p className="text-sm text-slate-500">Ventas descuentan stock calculado y generan asientos de ingreso simultáneamente.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
                                    <span className="material-symbols-outlined">query_stats</span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-white mb-1">Trazabilidad de Costos</h4>
                                    <p className="text-sm text-slate-500">Asignación precisa de costos directos e indirectos a cada unidad vendida.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Subsystems Section */}
                <section className="py-24">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="mb-16">
                            <h2 className="text-3xl font-bold text-white mb-4">Subsistemas Operativos Integrados</h2>
                            <p className="text-slate-400 max-w-2xl leading-relaxed">
                                Los módulos tradicionales se redefinen como componentes de captura de datos que procesan eventos operativos para alimentar el motor central de utilidad.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {subsystems.map((s, idx) => (
                                <div key={idx} className="bg-[#1E293B]/50 p-8 rounded-2xl border border-slate-700 hover:border-slate-500 transition-colors group">
                                    <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
                                        <span className="material-symbols-outlined text-2xl">{s.icon}</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-4">{s.title}</h3>
                                    <p className="text-slate-400 text-sm leading-relaxed mb-6">{s.description}</p>
                                    <div className="flex gap-3">
                                        {s.details.map((d, dIdx) => (
                                            <span key={dIdx} className="text-[10px] uppercase font-black tracking-widest text-slate-500 flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
                                                {d}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Processing Steps */}
                <section className="py-24 bg-slate-900/40">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col md:flex-row gap-16">
                            <div className="md:w-1/3">
                                <h2 className="text-3xl font-bold text-white mb-6">Procesamiento Financiero de <span className="text-blue-500">Eventos Operativos</span></h2>
                                <p className="text-slate-400 leading-relaxed mb-8">
                                    Cada interacción en el piso de venta desencadena una cadena compleja de procesamiento de datos.
                                    Esta arquitectura asegura que la información financiera sea siempre un reflejo fiel de la realidad operativa.
                                </p>
                                <div className="space-y-4 bg-[#1E293B]/50 p-6 rounded-2xl border border-slate-700">
                                    <h4 className="text-blue-400 font-bold flex items-center gap-2 mb-4">
                                        <span className="material-symbols-outlined">verified_user</span>
                                        Integridad Transaccional
                                    </h4>
                                    {[
                                        "Atomaticidad en transacciones de BD",
                                        "Auditoría inmutable (Ledger)",
                                        "Conciliación automática de medios de pago"
                                    ].map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-3 text-sm text-slate-300">
                                            <span className="material-symbols-outlined text-emerald-500 text-sm">check_circle</span>
                                            {item}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="md:w-2/3 space-y-12">
                                {processingSteps.map((s, idx) => (
                                    <div key={idx} className="flex gap-6 relative">
                                        {idx !== processingSteps.length - 1 && (
                                            <div className="absolute left-6 top-14 bottom-[-48px] w-px bg-slate-800" />
                                        )}
                                        <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white shrink-0 z-10 shadow-lg shadow-blue-600/20">
                                            <span className="material-symbols-outlined text-xl">{s.icon}</span>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white mb-2">{s.step}. {s.title}</h3>
                                            <p className="text-slate-500 text-sm leading-relaxed">{s.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Audit Pills */}
                <section className="py-24 text-center">
                    <h2 className="text-3xl font-bold text-white mb-12">Auditoría Financiera en Tiempo Real</h2>
                    <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto px-4">
                        {[
                            "Control de Merma", "Conciliación Bancaria", "P&L Diario", "Unit Economics", "Forecast Financiero", "EBITDA Proyectado"
                        ].map((pill, idx) => (
                            <span key={idx} className="px-6 py-2 rounded-full bg-slate-800/50 border border-slate-700 text-slate-400 text-sm font-medium">
                                {pill}
                            </span>
                        ))}
                    </div>
                </section>

                {/* Bottom CTA */}
                <section className="py-20 px-4">
                    <div className="max-w-4xl mx-auto bg-gradient-to-b from-[#1E293B] to-[#0F172A] rounded-3xl p-12 border border-slate-800 text-center shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
                        <h2 className="text-3xl font-black text-white mb-6">¿Su ERP actual calcula la utilidad real?</h2>
                        <p className="text-slate-400 mb-10 max-w-xl mx-auto">
                            Solicite un diagnóstico de su arquitectura de datos y descubra cómo integrar sus finanzas y operación hoy mismo.
                        </p>
                        <button
                            onClick={() => navigate('/solicitar-demo')}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-14 px-10 rounded-xl transition-all shadow-xl shadow-blue-600/20"
                        >
                            Solicitar diagnóstico financiero
                        </button>
                    </div>
                </section>
            </main>

            <LandingFooter />
        </div>
    );
};

export default ArchitectureView;
