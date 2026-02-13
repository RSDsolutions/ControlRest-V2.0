
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { ActivityLog } from '../types';

const AuditLogView: React.FC = () => {
    const [logs, setLogs] = useState<ActivityLog[]>([]);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        const { data, error } = await supabase
            .from('activity_logs')
            .select(`
                *,
                users (full_name)
            `)
            .order('created_at', { ascending: false })
            .limit(100);

        if (data) {
            const formatted: ActivityLog[] = data.map((l: any) => ({
                id: l.id,
                user_id: l.user_id,
                user_name: l.users?.full_name || 'Sistema',
                action: l.action,
                module: l.module,
                details: l.details,
                created_at: l.created_at
            }));
            setLogs(formatted);
        }
    };

    return (
        <div className="p-6 space-y-6 animate-fadeIn max-w-[1200px] mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <span className="material-icons-round text-accent">policy</span> Auditoría
                </h1>
                <p className="text-slate-500 font-medium">Registro de actividades recientes.</p>
            </header>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase">Fecha</th>
                            <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase">Usuario</th>
                            <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase">Módulo</th>
                            <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase">Acción</th>
                            <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase">Detalle</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {logs.map(log => (
                            <tr key={log.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 text-sm text-slate-500">
                                    {new Date(log.created_at).toLocaleString()}
                                </td>
                                <td className="px-6 py-4 font-bold text-slate-800">{log.user_name}</td>
                                <td className="px-6 py-4">
                                    <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold uppercase">{log.module}</span>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-700">{log.action}</td>
                                <td className="px-6 py-4 text-xs font-mono text-slate-500 max-w-xs truncate">
                                    {JSON.stringify(log.details)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AuditLogView;
