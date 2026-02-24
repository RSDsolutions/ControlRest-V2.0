import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { AuditEvent, Branch, User } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { usePlanFeatures, isFeatureEnabled } from '../hooks/usePlanFeatures';
import PlanUpgradeFullPage from '../components/PlanUpgradeFullPage';

interface AuditLogViewProps {
    branches: Branch[];
    restaurantId?: string | null;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
    'CASH_OPENING_FLOAT': 'Apertura de Caja',
    'CASH_SESSION_CLOSED': 'Cierre de Caja',
    'CASH_SESSION_OPENED': 'Inicio de Sesión de Caja',
    'DAILY_FINANCIAL_SNAPSHOT': 'Corte de Caja Diario',
    'EXPENSE_RECORDED': 'Gasto Registrado',
    'INVENTORY_MOVEMENT_PURCHASE': 'Entrada por Compra',
    'INVENTORY_MOVEMENT_SALE': 'Salida por Venta',
    'INVENTORY_MOVEMENT_WASTE': 'Salida por Merma',
    'INVENTORY_MOVEMENT_ADJUSTMENT': 'Ajuste de Stock',
    'ORDER_PAYMENT_CASH': 'Pago: Efectivo',
    'ORDER_PAYMENT_CARD': 'Pago: Tarjeta',
    'ORDER_PAYMENT_TRANSFER': 'Pago: Transferencia',
    'ORDER_PAYMENT_OTHER': 'Pago: Otro',
    'ORDER_PAYMENT_CREDIT': 'Pago: Crédito',
    'SYSTEM_ACTIVITY_LOGIN': 'Acceso al Sistema',
    'SYSTEM_ACTIVITY_CREATE_USER': 'Creación de Usuario',
    'SYSTEM_ACTIVITY_EDIT_USER': 'Edición de Usuario',
    'SYSTEM_ACTIVITY_DELETE_USER': 'Eliminación de Usuario',
    'SYSTEM_ACTIVITY_TOGGLE_USER_STATUS': 'Activación/Inact. Usuario',
    'SYSTEM_ACTIVITY_CREATE_BRANCH': 'Creación de Sucursal',
    'SYSTEM_ACTIVITY_EDIT_BRANCH': 'Edición de Sucursal',
    'ACCOUNTS_PAYABLE_PAYMENT': 'Abono CXP',
    'SUPPLIER_PAYMENT': 'Pago a Proveedor',
    'SUPPLIER_INVOICE_REGISTERED': 'Factura de Proveedor',
    'WASTE_RECORDED': 'Merma Registrada',
    'CASH_DISCREPANCY': 'Discrepancia de Caja',
    'INTERNAL_TRANSFER': 'Transferencia Interna',
    'MANUAL_INCOME': 'Ingreso Manual',
    'expense': 'Gasto Operativo',
    'revenue': 'Ingreso Financiero',
    'SALE_REVENUE': 'Venta Realizada',
    'inventory_purchase': 'Compra de Inventario',
    'waste_loss': 'Pérdida por Merma'
};

export const AuditLogView: React.FC<AuditLogViewProps> = ({ branches, restaurantId }) => {
    const [events, setEvents] = useState<AuditEvent[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    const { data: planData } = usePlanFeatures();
    const isPlanOperativo = !isFeatureEnabled(planData, 'ENABLE_NET_PROFIT_CALCULATION');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        const { data, error } = await supabase.from('users').select('id, full_name, role');
        if (data) {
            const formattedUsers: User[] = data.map((u: any) => ({
                id: u.id,
                name: u.full_name,
                role: u.role,
            }));
            setUsers(formattedUsers);
        }
    };

    // Filters
    const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [selectedBranch, setSelectedBranch] = useState<string>('all');
    const [selectedEventType, setSelectedEventType] = useState<string>('all');
    const [selectedUser, setSelectedUser] = useState<string>('all');

    // Detail Modal
    const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);

    useEffect(() => {
        fetchAuditEvents();
    }, [startDate, endDate, selectedBranch, selectedEventType, selectedUser]);

    const fetchAuditEvents = async () => {
        setLoading(true);
        let query = supabase
            .from('audit_events_view')
            .select('*')
            .gte('timestamp', `${startDate}T00:00:00.000Z`)
            .lte('timestamp', `${endDate}T23:59:59.999Z`)
            .order('timestamp', { ascending: false });

        if (selectedBranch !== 'all') {
            query = query.eq('branch_id', selectedBranch);
        }
        if (selectedEventType !== 'all') {
            query = query.eq('event_type', selectedEventType);
        }
        if (selectedUser !== 'all') {
            query = query.eq('user_id', selectedUser);
        }

        if (restaurantId) {
            query = query.eq('restaurant_id', restaurantId);
        }

        const { data, error } = await query;
        if (error) {
            console.error('Error fetching audit events:', error);
        } else {
            setEvents(data as AuditEvent[]);
        }
        setLoading(false);
    };

    const getEventTypes = (): string[] => {
        const types = new Set(events.map(e => e.event_type));
        return Array.from(types) as string[];
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
    };

    const getUserName = (userId?: string) => {
        if (!userId) return 'Sistema';
        const user = users.find(u => u.id === userId);
        return user ? user.name : 'Usuario Desconocido';
    };

    const getEventName = (eventType: string) => {
        return EVENT_TYPE_LABELS[eventType] || eventType;
    };

    const getBranchName = (branchId?: string) => {
        if (!branchId) return 'N/A';
        const branch = branches.find(b => b.id === branchId);
        return branch ? branch.name : 'Sucursal Desconocida';
    };

    const formatDescription = (desc: string) => {
        if (!desc) return '';

        let formatted = desc;

        // Handle "Financial Ledger Entry: <event_type>"
        if (formatted.startsWith('Financial Ledger Entry: ')) {
            const type = formatted.replace('Financial Ledger Entry: ', '');
            formatted = `Registro Financiero: ${EVENT_TYPE_LABELS[type] || type}`;
        }

        // Handle "Emergency closure requested by user"
        if (formatted === 'Emergency closure requested by user') {
            formatted = 'Cierre de emergencia solicitado por el usuario';
        }

        // Handle Action logs mapping
        if (formatted.startsWith('Acción: ')) {
            formatted = formatted
                .replace('Acción:', 'Actividad:')
                .replace('create_user', 'crear usuario')
                .replace('edit_user', 'editar usuario')
                .replace('delete_user', 'eliminar usuario')
                .replace('toggle_user_status', 'cambiar estado de usuario')
                .replace('create_branch', 'crear sucursal')
                .replace('edit_branch', 'editar sucursal')
                .replace('en UserMgmt', 'en Gestión de Personal')
                .replace('en BranchesConfig', 'en Panel de Sucursales');
        }

        return formatted;
    };

    const generateAuditReportCsv = () => {
        const headers = ['Fecha/Hora', 'Tipo de Evento', 'Referencia', 'Monto', 'Usuario', 'Sucursal', 'Descripción'];
        const csvRows = [headers.join(',')];

        events.forEach(event => {
            const row = [
                format(new Date(event.timestamp), 'dd/MM/yyyy HH:mm:ss'),
                `"${getEventName(event.event_type)}"`,
                `"${event.reference_id || 'N/A'}"`,
                event.amount,
                `"${getUserName(event.user_id)}"`,
                `"${getBranchName(event.branch_id)}"`,
                `"${formatDescription(event.description).replace(/"/g, '""')}"`
            ];
            csvRows.push(row.join(','));
        });

        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `Auditoria_${startDate}_al_${endDate}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const generateAuditReportPdf = () => {
        const doc = new jsPDF();
        const primaryColor: [number, number, number] = [30, 41, 59];

        doc.setFontSize(20);
        doc.setTextColor(...primaryColor);
        doc.text('Reporte de Auditoría Financiera', 14, 22);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Desde: ${startDate} - Hasta: ${endDate}`, 14, 30);
        doc.text(`Sucursal: ${selectedBranch === 'all' ? 'Todas' : getBranchName(selectedBranch)}`, 14, 35);
        doc.text(`Generado el: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}`, 14, 40);

        const tableData = events.map(event => [
            format(new Date(event.timestamp), 'dd/MM/yy HH:mm'),
            getEventName(event.event_type),
            event.reference_id?.substring(0, 8) || 'N/A',
            formatCurrency(event.amount),
            getUserName(event.user_id)
        ]);

        autoTable(doc, {
            startY: 45,
            head: [['Fecha/Hora', 'Tipo de Evento', 'Referencia', 'Monto', 'Usuario']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: primaryColor, textColor: 255 },
            styles: { fontSize: 8, cellPadding: 2 },
            columnStyles: { 3: { halign: 'right' } }
        });

        doc.save(`Auditoria_${startDate}_al_${endDate}.pdf`);
    };

    // Pagination logic
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;
    const totalPages = Math.ceil(events.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedEvents = events.slice(startIndex, startIndex + itemsPerPage);

    const getBadgeStyle = (eventType: string) => {
        if (eventType === 'EXPENSE_RECORDED' || eventType === 'expense') return 'bg-amber-50 text-amber-600 border-amber-100';
        if (eventType.includes('INVENTORY_MOVEMENT_PURCHASE') || eventType === 'inventory_purchase') return 'bg-blue-50 text-blue-600 border-blue-100';
        if (eventType.includes('WASTE') || eventType === 'waste_loss') return 'bg-rose-50 text-rose-600 border-rose-100';
        if (eventType === 'COGS' || eventType === 'inventory_movement_sale') return 'bg-slate-50 text-slate-600 border-slate-200';
        return 'bg-slate-50 text-slate-500 border-slate-100';
    };

    if (isPlanOperativo) {
        return <PlanUpgradeFullPage featureName="Auditoría y Seguridad" description="El historial detallado de actividades y la auditoría forense del sistema están disponibles en planes superiores. Protege la integridad de tu información." />;
    }

    return (
        <div className="flex flex-col h-full bg-slate-50 p-8 animate-fade-in max-w-[1400px] mx-auto space-y-8 font-sans">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                        <span className="material-icons-round text-primary text-xl sm:text-2xl">shield</span>
                    </div>
                    <div>
                        <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-tight">Auditoría Financiera</h1>
                        <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 font-medium">RESTOGESTIÓN V2.0 — Bitácoras ERP</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button
                        onClick={generateAuditReportPdf}
                        className="flex-1 md:flex-none bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all px-4 sm:px-6 py-2.5 rounded-xl shadow-sm font-bold flex items-center justify-center gap-2 text-xs sm:text-sm"
                    >
                        <span className="material-icons-round text-[18px]">picture_as_pdf</span> PDF
                    </button>
                    <button
                        onClick={generateAuditReportCsv}
                        className="flex-1 md:flex-none bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all px-4 sm:px-6 py-2.5 rounded-xl shadow-sm font-bold flex items-center justify-center gap-2 text-xs sm:text-sm"
                    >
                        <span className="material-icons-round text-[18px]">file_download</span> CSV
                    </button>
                </div>
            </header>

            {/* Filters */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Fecha Inicio</label>
                    <div className="relative">
                        <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }} className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                        <span className="material-icons-round absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">calendar_today</span>
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Fecha Fin</label>
                    <div className="relative">
                        <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }} className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                        <span className="material-icons-round absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">calendar_today</span>
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Sucursal</label>
                    <select value={selectedBranch} onChange={(e) => { setSelectedBranch(e.target.value); setCurrentPage(1); }} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer">
                        <option value="all">Todas las Sucursales</option>
                        {branches.map(branch => (
                            <option key={branch.id} value={branch.id}>{branch.name}</option>
                        ))}
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Tipo de Evento</label>
                    <select value={selectedEventType} onChange={(e) => { setSelectedEventType(e.target.value); setCurrentPage(1); }} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer">
                        <option value="all">Todos los Eventos</option>
                        {Object.entries(EVENT_TYPE_LABELS)
                            .sort((a, b) => a[1].localeCompare(b[1]))
                            .map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))
                        }
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Usuario</label>
                    <select value={selectedUser} onChange={(e) => { setSelectedUser(e.target.value); setCurrentPage(1); }} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer">
                        <option value="all">Todos los Usuarios</option>
                        {users.map(user => (
                            <option key={user.id} value={user.id}>{user.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col flex-1">
                {loading ? (
                    <div className="flex-1 flex flex-col justify-center items-center py-20 gap-4">
                        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary/20 border-t-primary"></div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Cargando bitácoras...</p>
                    </div>
                ) : events.length === 0 ? (
                    <div className="flex-1 flex flex-col justify-center items-center py-20 text-slate-400">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                            <span className="material-icons-round text-slate-300 text-3xl">policy</span>
                        </div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No se encontraron eventos</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha / Hora</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Evento & Descripción</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ref / Sucursal</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Monto</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Usuario</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginatedEvents.map((event) => {
                                    const isLoss = event.event_type.includes('WASTE') || event.event_type === 'waste_loss' || (event.amount < 0 && event.event_type !== 'INTERNAL_TRANSFER');
                                    return (
                                        <tr
                                            key={event.id}
                                            onClick={() => setSelectedEvent(event)}
                                            className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                                            Tracy-test-id={`audit-row-${event.id}`}
                                        >
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <div className="font-bold text-slate-800 tracking-tight leading-none mb-1">
                                                    {format(new Date(event.timestamp), 'dd/MM/yyyy')}
                                                </div>
                                                <div className="text-[11px] text-slate-400 font-mono font-medium">
                                                    {format(new Date(event.timestamp), 'HH:mm:ss')}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col gap-1.5 align-top">
                                                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider inline-block w-fit border ${getBadgeStyle(event.event_type)}`}>
                                                        {getEventName(event.event_type)}
                                                    </span>
                                                    <div className="text-xs font-medium text-slate-500 max-w-sm italic">
                                                        {formatDescription(event.description)}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="text-[11px] font-mono text-slate-400 truncate max-w-[120px] mb-0.5">
                                                    {event.reference_id || event.id}
                                                </div>
                                                <div className="text-xs font-bold text-slate-500">
                                                    {getBranchName(event.branch_id)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                {event.amount !== 0 ? (
                                                    <span className={`text-[15px] font-black tracking-tight ${isLoss ? 'text-rose-500' : 'text-slate-900'}`}>
                                                        {formatCurrency(event.amount)}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-300 font-medium">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-primary font-bold text-[10px] shadow-sm">
                                                        {getUserName(event.user_id).charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-600">{getUserName(event.user_id)}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination Footer */}
                <div className="px-6 py-5 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                        Mostrando <span className="text-slate-900">{startIndex + 1} a {Math.min(startIndex + itemsPerPage, events.length)}</span> de <span className="text-slate-900">{events.length}</span> resultados
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => p - 1)}
                            className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-primary hover:border-primary disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:border-slate-200 transition-all shadow-sm"
                        >
                            <span className="material-icons-round text-lg">chevron_left</span>
                        </button>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                // Simple sliding window for pagination if many pages
                                let pageNum = i + 1;
                                if (totalPages > 5 && currentPage > 3) {
                                    pageNum = currentPage - 2 + i;
                                    if (pageNum + (5 - i - 1) > totalPages) pageNum = totalPages - 4 + i;
                                }
                                if (pageNum <= 0) return null;
                                if (pageNum > totalPages) return null;

                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-black transition-all ${currentPage === pageNum ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105' : 'bg-white border border-slate-100 text-slate-400 hover:bg-slate-50'
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                        </div>
                        <button
                            disabled={currentPage === totalPages || totalPages === 0}
                            onClick={() => setCurrentPage(p => p + 1)}
                            className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-primary hover:border-primary disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:border-slate-200 transition-all shadow-sm"
                        >
                            <span className="material-icons-round text-lg">chevron_right</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Detail Modal */}
            {selectedEvent && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px] animate-fade-in">
                    <div className="relative bg-white w-full max-w-2xl rounded-2xl border border-slate-200 shadow-2xl animate-fade-in flex flex-col max-h-[90vh] overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
                            <div>
                                <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                                    <span className="material-icons-round text-[#136dec] text-xl">analytics</span>
                                    Detalle de Evento
                                </h3>
                            </div>
                            <button onClick={() => setSelectedEvent(null)} className="p-2 hover:bg-slate-200/50 rounded-full text-slate-400 transition-colors">
                                <span className="material-icons-round text-xl">close</span>
                            </button>
                        </div>
                        <div className="p-8 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
                            <div className="grid grid-cols-2 gap-6 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Tipo de Evento</p>
                                    <p className="font-bold text-slate-800">{getEventName(selectedEvent.event_type)}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Fecha y Hora</p>
                                    <p className="font-bold text-slate-800">{format(new Date(selectedEvent.timestamp), 'dd/MM/yyyy HH:mm:ss')}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Monto Implicado</p>
                                    <p className="font-mono font-black text-lg text-primary">{formatCurrency(selectedEvent.amount)}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Usuario / Responsable</p>
                                    <p className="font-bold text-slate-800">{getUserName(selectedEvent.user_id)}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">ID de Referencia</p>
                                    <p className="font-mono text-xs font-bold text-slate-500 break-all">{selectedEvent.reference_id || selectedEvent.id}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Descripción de la Operación</p>
                                    <p className="font-medium text-slate-600 bg-white p-4 rounded-xl border border-slate-100">{formatDescription(selectedEvent.description)}</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-100 flex justify-end bg-slate-50/50">
                            <button
                                onClick={() => setSelectedEvent(null)}
                                className="btn bg-white border border-slate-200 text-[#136dec] hover:bg-slate-50 transition-all px-10 py-3 rounded-full shadow-lg shadow-slate-100 font-bold"
                            >
                                Cerrar Detalle
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
