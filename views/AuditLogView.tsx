import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { AuditEvent, Branch, User } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface AuditLogViewProps {
    branches: Branch[];
}

const EVENT_TYPE_LABELS: Record<string, string> = {
    'CASH_OPENING_FLOAT': 'Apertura de Caja',
    'CASH_SESSION_CLOSED': 'Cierre de Caja',
    'CASH_SESSION_OPENED': 'Inicio de Sesión de Caja',
    'DAILY_FINANCIAL_SNAPSHOT': 'Corte de Caja Diario',
    'EXPENSE_RECORDED': 'Gasto Registrado',
    'INVENTORY_MOVEMENT_PURCHASE': 'Entrada de Inventario (Compra)',
    'INVENTORY_MOVEMENT_SALE': 'Salida de Inventario (Venta)',
    'INVENTORY_MOVEMENT_WASTE': 'Salida de Inventario (Merma)',
    'INVENTORY_MOVEMENT_ADJUSTMENT': 'Ajuste de Inventario',
    'ORDER_PAYMENT_CASH': 'Pago de Orden (Efectivo)',
    'ORDER_PAYMENT_CARD': 'Pago de Orden (Tarjeta)',
    'ORDER_PAYMENT_TRANSFER': 'Pago de Orden (Transferencia)',
    'ORDER_PAYMENT_OTHER': 'Pago de Orden (Otro)',
    'ORDER_PAYMENT_CREDIT': 'Pago de Orden (Crédito)',
    'SYSTEM_ACTIVITY_CREATE_USER': 'Creación de Usuario',
    'SYSTEM_ACTIVITY_EDIT_USER': 'Edición de Usuario',
    'SYSTEM_ACTIVITY_DELETE_USER': 'Eliminación de Usuario',
    'SYSTEM_ACTIVITY_LOGIN': 'Inicio de Sesión',
    'ACCOUNTS_PAYABLE_PAYMENT': 'Abono a Cuenta CXP',
    'SUPPLIER_PAYMENT': 'Pago a Proveedor',
    'SUPPLIER_INVOICE_REGISTERED': 'Factura de Proveedor',
    'WASTE_RECORDED': 'Merma Registrada',
    'CASH_DISCREPANCY': 'Discrepancia de Caja',
    'INTERNAL_TRANSFER': 'Transferencia Interna',
    'MANUAL_INCOME': 'Ingreso Manual',
    'expense': 'Gasto Operativo',
    'revenue': 'Ingreso Financiero',
    'SALE_REVENUE': 'Ingreso por Venta',
    'inventory_purchase': 'Compra de Inventario',
    'waste_loss': 'Pérdida por Merma'
};

export const AuditLogView: React.FC<AuditLogViewProps> = ({ branches }) => {
    const [events, setEvents] = useState<AuditEvent[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

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

        // Handle Action logs like "Acción: edit_user en UserMgmt"
        if (formatted.startsWith('Acción: ')) {
            formatted = formatted
                .replace('create_user', 'crear usuario')
                .replace('edit_user', 'editar usuario')
                .replace('delete_user', 'eliminar usuario')
                .replace('UserMgmt', 'Gestión de Usuarios');
        }

        return formatted;
    };

    const generateAuditReportPdf = () => {
        const doc = new jsPDF();

        // Config values
        const primaryColor: [number, number, number] = [30, 41, 59]; // slate-800

        // Header
        doc.setFontSize(20);
        doc.setTextColor(...primaryColor);
        doc.text('Reporte de Auditoría Financiera', 14, 22);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Desde: ${startDate} - Hasta: ${endDate}`, 14, 30);
        doc.text(`Sucursal: ${selectedBranch === 'all' ? 'Todas' : getBranchName(selectedBranch)}`, 14, 35);
        doc.text(`Generado el: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}`, 14, 40);

        // Calculate totals
        const totalSales = events.filter(e => e.event_type.startsWith('ORDER_PAYMENT_') || e.event_type === 'DAILY_FINANCIAL_SNAPSHOT').reduce((sum, e) => sum + Number(e.amount), 0);
        const totalExpenses = events.filter(e => e.event_type === 'EXPENSE_RECORDED' || e.event_type === 'ACCOUNTS_PAYABLE_PAYMENT' || e.event_type === 'SUPPLIER_INVOICE_REGISTERED').reduce((sum, e) => sum + Number(e.amount), 0);
        const totalWaste = events.filter(e => e.event_type === 'WASTE_RECORDED').reduce((sum, e) => sum + Number(e.amount), 0);
        const totalDiscrepancies = events.filter(e => e.event_type === 'CASH_SESSION_CLOSED' && e.details?.difference).reduce((sum, e) => sum + Number(e.details.difference), 0);

        // Filter events for table
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
            columnStyles: {
                3: { halign: 'right' }
            }
        });

        // Add totals block
        const finalY = (doc as any).lastAutoTable.finalY || 45;
        if (finalY < 250) {
            doc.setFontSize(10);
            doc.setTextColor(...primaryColor);
            doc.text('Totales del Período', 14, finalY + 10);

            doc.setFontSize(9);
            doc.setTextColor(100);
            doc.text(`Total Ingresos / Ventas: ${formatCurrency(totalSales)}`, 14, finalY + 16);
            doc.text(`Total Egresos / Pagos: ${formatCurrency(totalExpenses)}`, 14, finalY + 21);
            doc.text(`Total Merma: ${formatCurrency(totalWaste)}`, 14, finalY + 26);
            doc.text(`Total Discrepancias: ${formatCurrency(totalDiscrepancies)}`, 14, finalY + 31);
        }

        // Footer
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text('Generado desde ERP Profitability System', 14, doc.internal.pageSize.height - 10);
            doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.width - 25, doc.internal.pageSize.height - 10);
        }

        doc.save(`Auditoria_${startDate}_al_${endDate}.pdf`);
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 p-4 md:p-8 animate-fadeIn">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 shrink-0">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                        <span className="material-icons-round text-primary">policy</span> Auditoría Financiera
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Exportación y revisión de bitácoras del sistema ERP</p>
                </div>
                <button
                    onClick={generateAuditReportPdf}
                    className="bg-primary hover:bg-primary-light text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-primary/30 transition-all active:scale-95 whitespace-nowrap"
                >
                    <span className="material-icons-round">picture_as_pdf</span>
                    Exportar PDF
                </button>
            </header>

            {/* Filters */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6 shrink-0 grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Fecha Inicio</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-primary font-medium text-slate-700"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Fecha Fin</label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-primary font-medium text-slate-700"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Sucursal</label>
                    <select
                        value={selectedBranch}
                        onChange={(e) => setSelectedBranch(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-primary font-medium text-slate-700 appearance-none bg-white"
                    >
                        <option value="all">Todas las Sucursales</option>
                        {branches.map(branch => (
                            <option key={branch.id} value={branch.id}>{branch.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Tipo de Evento</label>
                    <select
                        value={selectedEventType}
                        onChange={(e) => setSelectedEventType(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-primary font-medium text-slate-700 appearance-none bg-white"
                    >
                        <option value="all">Todos los Eventos</option>
                        {getEventTypes().map(type => (
                            <option key={type} value={type}>{getEventName(type)}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Usuario</label>
                    <select
                        value={selectedUser}
                        onChange={(e) => setSelectedUser(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-primary font-medium text-slate-700 appearance-none bg-white"
                    >
                        <option value="all">Todos los Usuarios</option>
                        {users.map(user => (
                            <option key={user.id} value={user.id}>{user.name} ({user.role})</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex-1 overflow-hidden flex flex-col min-h-0">
                {loading ? (
                    <div className="flex-1 flex justify-center items-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                ) : events.length === 0 ? (
                    <div className="flex-1 flex flex-col justify-center items-center text-slate-400 p-8">
                        <span className="material-icons-round text-6xl mb-4 opacity-50">search_off</span>
                        <p className="font-medium text-lg">No se encontraron eventos para los filtros seleccionados.</p>
                    </div>
                ) : (
                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 bg-slate-50 z-10 shadow-sm">
                                <tr>
                                    <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Fecha / Hora</th>
                                    <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Evento</th>
                                    <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Ref / Sucursal</th>
                                    <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 text-right">Monto</th>
                                    <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Usuario</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {events.map((event) => (
                                    <tr
                                        key={event.id}
                                        onClick={() => setSelectedEvent(event)}
                                        className="hover:bg-slate-50 transition-colors cursor-pointer group"
                                    >
                                        <td className="py-3 px-6 whitespace-nowrap">
                                            <div className="font-bold text-slate-700">{format(new Date(event.timestamp), 'dd/MM/yyyy')}</div>
                                            <div className="text-xs text-slate-400 font-mono">{format(new Date(event.timestamp), 'HH:mm:ss')}</div>
                                        </td>
                                        <td className="py-3 px-6">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest bg-slate-100 text-slate-600">
                                                {getEventName(event.event_type)}
                                            </span>
                                            <div className="text-sm text-slate-500 mt-1 truncate max-w-xs">{formatDescription(event.description)}</div>
                                        </td>
                                        <td className="py-3 px-6">
                                            <div className="text-sm font-medium text-slate-700 font-mono truncate max-w-[150px]">{event.reference_id || event.id}</div>
                                            <div className="text-xs text-slate-400">{getBranchName(event.branch_id)}</div>
                                        </td>
                                        <td className="py-3 px-6 text-right">
                                            {event.amount !== 0 ? (
                                                <span className={`font-mono font-bold ${event.amount < 0 ? 'text-red-600' : 'text-slate-800'}`}>
                                                    {formatCurrency(event.amount)}
                                                </span>
                                            ) : (
                                                <span className="text-slate-300 font-medium">-</span>
                                            )}
                                        </td>
                                        <td className="py-3 px-6">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                                                    {getUserName(event.user_id).charAt(0).toUpperCase()}
                                                </div>
                                                <span className="text-sm font-medium text-slate-700">{getUserName(event.user_id)}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {selectedEvent && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedEvent(null)}></div>
                    <div className="relative bg-white rounded-[40px] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scaleUp">
                        <header className="px-6 py-6 md:px-8 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                            <div>
                                <h3 className="font-black text-slate-800 text-xl flex items-center gap-2">
                                    <span className="material-icons-round text-primary">analytics</span>
                                    Detalle de Evento
                                </h3>
                            </div>
                            <button onClick={() => setSelectedEvent(null)} className="text-slate-400 hover:text-slate-600">
                                <span className="material-icons-round">close</span>
                            </button>
                        </header>
                        <div className="p-6 md:p-8 overflow-y-auto flex-1 space-y-6">
                            <div className="grid grid-cols-2 gap-6 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                                <div>
                                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tipo de Evento</span>
                                    <span className="font-bold text-slate-800">{getEventName(selectedEvent.event_type)}</span>
                                </div>
                                <div>
                                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Fecha y Hora</span>
                                    <span className="font-bold text-slate-800">{format(new Date(selectedEvent.timestamp), 'dd/MM/yyyy HH:mm:ss')}</span>
                                </div>
                                <div>
                                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Monto Implicado</span>
                                    <span className="font-mono font-black text-lg text-primary">{formatCurrency(selectedEvent.amount)}</span>
                                </div>
                                <div>
                                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Usuario / Responsable</span>
                                    <span className="font-bold text-slate-800">{getUserName(selectedEvent.user_id)}</span>
                                </div>
                                <div>
                                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">ID de Referencia</span>
                                    <span className="font-mono text-xs font-bold text-slate-500 overflow-hidden text-ellipsis whitespace-nowrap block" title={selectedEvent.reference_id || selectedEvent.id}>{selectedEvent.reference_id || selectedEvent.id}</span>
                                </div>
                                <div>
                                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Descripción de la Operación</span>
                                    <span className="font-medium text-slate-600">{formatDescription(selectedEvent.description)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
