
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
        <div className="fixed inset-0 bg-slate-900 z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden w-full max-w-sm flex flex-col">
                <div className="p-8 bg-slate-50 text-center border-b border-slate-100">
                    <div className="w-16 h-16 bg-white rounded-full mx-auto mb-4 flex items-center justify-center shadow-sm">
                        <span className="material-icons-round text-3xl text-slate-400">lock</span>
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Terminal Bloqueada</h2>
                    <p className="text-slate-500 text-sm font-medium mt-1">Ingresa tu PIN para continuar</p>
                </div>

                <div className="p-8 bg-white flex flex-col items-center">
                    <div className="flex gap-4 mb-8">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className={`w-4 h-4 rounded-full transition-all ${i < pin.length ? 'bg-slate-900 scale-110' : 'bg-slate-200'}`}></div>
                        ))}
                    </div>

                    {error && <p className="text-rose-500 font-bold text-sm mb-4 animate-pulse">{error}</p>}

                    <div className="grid grid-cols-3 gap-4 w-full max-w-[240px]">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                            <button key={n} onClick={() => handleNumClick(n.toString())} className="h-16 rounded-2xl bg-slate-50 hover:bg-slate-100 font-black text-2xl text-slate-700 transition-colors focus:bg-slate-200 outline-none">
                                {n}
                            </button>
                        ))}
                        <button onClick={clear} className="h-16 rounded-2xl hover:bg-rose-50 text-rose-500 font-bold transition-colors flex items-center justify-center">
                            C
                        </button>
                        <button onClick={() => handleNumClick('0')} className="h-16 rounded-2xl bg-slate-50 hover:bg-slate-100 font-black text-2xl text-slate-700 transition-colors focus:bg-slate-200 outline-none">
                            0
                        </button>
                        <button onClick={() => backspace()} className="h-16 rounded-2xl hover:bg-slate-100 text-slate-500 font-bold transition-colors flex items-center justify-center">
                            <span className="material-icons-round">backspace</span>
                        </button>
                    </div>

                    <form onSubmit={handlePinSubmit} className="mt-8 w-full">
                        <button type="submit" disabled={pin.length < 4 || loading} className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-xl font-black text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                            {loading ? 'Verificando...' : 'Desbloquear'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LockScreen;
