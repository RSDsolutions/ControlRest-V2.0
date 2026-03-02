import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { User, UserRole } from '../types';

interface SubscriptionGuardProps {
    user: User | null;
    children: React.ReactNode;
}

export const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({ user, children }) => {
    const [loading, setLoading] = useState(true);
    const [daysRemaining, setDaysRemaining] = useState<number | null>(null);

    useEffect(() => {
        let active = true;
        const fetchSubscription = async () => {
            // Superadmin bypassed instantly
            if (!user || user.role === UserRole.SUPERADMIN || !user.restaurantId) {
                if (active) setLoading(false);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('restaurant_subscriptions')
                    .select('ends_at, status')
                    .eq('restaurant_id', user.restaurantId)
                    .order('ends_at', { ascending: false })
                    .limit(1)
                    .single();

                if (error || !data) {
                    // Si no hay subscripción, asume bloqueado
                    if (active) setDaysRemaining(-999);
                    return;
                }

                const endsAt = new Date(data.ends_at).getTime();

                // Use a date reset to midnight to correctly compute full days
                const now = new Date();
                now.setHours(0, 0, 0, 0);
                const endsAtDate = new Date(data.ends_at);
                endsAtDate.setHours(0, 0, 0, 0);

                const diffDays = Math.ceil((endsAtDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                if (active) setDaysRemaining(diffDays);

            } catch (err) {
                console.error('Error fetching subscription in guard:', err);
                if (active) setDaysRemaining(-999); // Bloquear on DB fail para ser seguros
            } finally {
                if (active) setLoading(false);
            }
        };

        fetchSubscription();
        return () => { active = false; };
    }, [user]);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-slate-500 font-medium text-sm animate-pulse">Verificando Licencia...</p>
            </div>
        );
    }

    // Si no hay datos, o es superadmin, no hay logica o ya se controlan por otro lado
    if (!user || user.role === UserRole.SUPERADMIN || daysRemaining === null) {
        return <>{children}</>;
    }

    const isHardLocked = daysRemaining < -5;
    const isWarningPeriod = daysRemaining <= 0 && daysRemaining >= -5;

    if (isHardLocked) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center animate-fade-in select-none">
                <div className="bg-white p-10 rounded-[2rem] max-w-md w-full border border-red-200 shadow-2xl shadow-red-500/10">
                    <div className="w-24 h-24 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <span className="material-icons-round text-5xl">lock</span>
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Acceso Bloqueado</h1>
                    <p className="text-slate-500 mb-8 leading-relaxed font-medium">
                        Tu suscripción expiró y el período de gracia de 5 días ha finalizado. Renueva tu licencia para restablecer el acceso a todo tu sistema.
                    </p>
                    <a
                        href="mailto:soporte@rsdsolutions.com"
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-red-500/20 hover:scale-[1.02] active:scale-95"
                    >
                        <span className="material-icons-round">contact_support</span>
                        Contactar a Soporte
                    </a>
                    <div className="mt-6 flex flex-col items-center gap-4">
                        <button
                            onClick={() => window.location.reload()}
                            className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors inline-flex items-center gap-1"
                        >
                            <span className="material-icons-round text-[16px]">refresh</span>
                            Ya renové, intentar de nuevo
                        </button>
                        <button
                            onClick={async () => {
                                await supabase.auth.signOut();
                                window.location.href = '/';
                            }}
                            className="text-sm font-medium text-slate-400 hover:text-red-500 transition-colors inline-flex items-center gap-1"
                        >
                            <span className="material-icons-round text-[16px]">logout</span>
                            Cerrar sesión
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full h-screen flex flex-col">
            {isWarningPeriod && (
                <div className="bg-orange-600 text-white px-4 py-2.5 text-center text-sm font-bold shadow-md z-[9999] flex flex-col md:flex-row items-center justify-center gap-2">
                    <span className="material-icons-round text-xl animate-pulse">warning_amber</span>
                    <span>Tu suscripción expiró. Tienes <span className="bg-white text-orange-600 px-2 py-0.5 rounded-md mx-1">{5 + daysRemaining} días</span> de gracia para renovar antes de perder el acceso. ¿Renovaste?</span>
                    <a href="mailto:soporte@rsdsolutions.com" className="ml-2 underline hover:text-orange-200 transition-colors">Avisar a soporte</a>
                </div>
            )}
            <div className="flex-1 overflow-hidden relative">
                {children}
            </div>
        </div>
    );
};
