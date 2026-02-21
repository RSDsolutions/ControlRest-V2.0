
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { User, UserRole } from '../types';

interface LockScreenProps {
    onUnlock: (user: User) => void;
    branchId: string | null;
}

const LockScreen: React.FC<LockScreenProps> = ({ onUnlock, branchId }) => {
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handlePinSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!branchId) {
            setError('Error: Sucursal no identificada.');
            return;
        }
        setLoading(true);
        setError('');

        try {
            const { data, error } = await supabase.rpc('verify_pin', {
                pin_input: pin,
                branch_id_input: branchId
            });

            if (error) throw error;

            if (data && data.success && data.user) {
                const u = data.user;
                const userObj: User = {
                    id: u.id,
                    name: u.full_name,
                    username: u.username,
                    role: u.role as UserRole,
                    pin: u.pin,
                    isActive: u.is_active,
                    branchId: u.branch_id
                };
                onUnlock(userObj);
            } else {
                setError('PIN incorrecto o usuario inactivo.');
                setPin('');
            }
        } catch (err: any) {
            console.error(err);
            setError('Error de conexión.');
        } finally {
            setLoading(false);
        }
    };

    const handleNumClick = (num: string) => {
        if (pin.length < 6) setPin(prev => prev + num);
    };

    const clear = () => setPin('');
    const backspace = () => setPin(prev => prev.slice(0, -1));

    return (
        <div className="fixed inset-0 bg-slate-900/95 z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-[12px] shadow-modal overflow-hidden w-full max-w-xs">
                <div className="px-8 pt-8 pb-6 text-center border-b border-slate-100">
                    <div className="w-12 h-12 bg-blue-50 rounded-[8px] mx-auto mb-4 flex items-center justify-center">
                        <span className="material-icons-round text-2xl text-[#136dec]">lock_outline</span>
                    </div>
                    <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Terminal Bloqueada</h2>
                    <p className="text-slate-500 text-xs mt-1">Ingresa tu PIN para continuar</p>
                </div>

                <div className="px-8 pb-8 pt-6 flex flex-col items-center">
                    <div className="flex gap-3 mb-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className={`w-3 h-3 rounded-full transition-all duration-150 ${i < pin.length ? 'bg-[#136dec] scale-110' : 'bg-slate-200'}`}></div>
                        ))}
                    </div>

                    {error && <p className="text-rose-500 font-bold text-sm mb-4 animate-pulse">{error}</p>}

                    <div className="grid grid-cols-3 gap-2.5 w-full max-w-[216px]">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                            <button key={n} onClick={() => handleNumClick(n.toString())} className="h-14 rounded-[8px] bg-slate-50 hover:bg-slate-100 font-semibold text-xl text-slate-800 transition-colors focus:bg-slate-200 outline-none active:scale-95">
                                {n}
                            </button>
                        ))}
                        <button onClick={clear} className="h-14 rounded-[8px] hover:bg-red-50 text-red-500 font-semibold text-sm transition-colors flex items-center justify-center active:scale-95">
                            C
                        </button>
                        <button onClick={() => handleNumClick('0')} className="h-14 rounded-[8px] bg-slate-50 hover:bg-slate-100 font-semibold text-xl text-slate-800 transition-colors focus:bg-slate-200 outline-none active:scale-95">
                            0
                        </button>
                        <button onClick={() => backspace()} className="h-14 rounded-[8px] hover:bg-slate-100 text-slate-500 transition-colors flex items-center justify-center active:scale-95">
                            <span className="material-icons-round text-[20px]">backspace</span>
                        </button>
                    </div>

                    <form onSubmit={handlePinSubmit} className="mt-6 w-full">
                        <button type="submit" disabled={pin.length < 4 || loading} className="w-full bg-[#136dec] hover:bg-[#0d5cc7] text-white py-3 rounded-[8px] font-semibold text-sm shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                            {loading ? 'Verificando...' : 'Desbloquear'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LockScreen;
