import React, { useState, useEffect } from 'react';
import { User, Branch, CompanyProfile, UserRole } from '../types';
import { supabase } from '../supabaseClient';
import { logActivity } from '../services/audit';

interface EnterpriseProfileViewProps {
    currentUser: User | null;
    branches: Branch[];
    setBranches: React.Dispatch<React.SetStateAction<Branch[]>>;
}

const EnterpriseProfileView: React.FC<EnterpriseProfileViewProps> = ({ currentUser, branches, setBranches }) => {
    const [activeTab, setActiveTab] = useState<'profile' | 'company'>('profile');
    const [loading, setLoading] = useState(false);

    // Profile State
    const [profileName, setProfileName] = useState('');
    const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });

    // Company State
    const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
    const [companyForm, setCompanyForm] = useState({
        businessName: '',
        ruc: '',
        legalRepresentative: '',
        phone: '',
        email: '',
        mainAddress: ''
    });

    useEffect(() => {
        if (currentUser) {
            setProfileName(currentUser.name);
            fetchCompanyProfile();
        }
    }, [currentUser]);

    const fetchCompanyProfile = async () => {
        if (!currentUser?.restaurantId) return;
        const { data, error } = await supabase
            .from('company_profile')
            .select('*')
            .eq('restaurant_id', currentUser.restaurantId)
            .single();

        if (data) {
            const profile: CompanyProfile = {
                id: data.id,
                restaurantId: data.restaurant_id,
                businessName: data.business_name,
                ruc: data.ruc,
                legalRepresentative: data.legal_representative,
                phone: data.phone,
                email: data.email,
                mainAddress: data.main_address,
                createdAt: data.created_at
            };
            setCompanyProfile(profile);
            setCompanyForm({
                businessName: profile.businessName,
                ruc: profile.ruc || '',
                legalRepresentative: profile.legalRepresentative || '',
                phone: profile.phone || '',
                email: profile.email || '',
                mainAddress: profile.mainAddress || ''
            });
        }
    };

    // --- Profile Handlers ---
    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;
        setLoading(true);
        try {
            const { error } = await supabase.from('users').update({ full_name: profileName }).eq('id', currentUser.id);
            if (error) throw error;
            alert('Perfil actualizado correctamente.');
        } catch (err: any) {
            alert('Error: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.new !== passwordData.confirm) return alert('Las contraseñas no coinciden.');
        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: passwordData.new });
            if (error) throw error;
            alert('Contraseña actualizada correctamente.');
            setPasswordData({ current: '', new: '', confirm: '' });
        } catch (err: any) {
            alert('Error: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // --- Company Handlers ---
    const handleSaveCompany = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser?.restaurantId) return;
        setLoading(true);

        try {
            const payload = {
                restaurant_id: currentUser.restaurantId,
                business_name: companyForm.businessName,
                ruc: companyForm.ruc,
                legal_representative: companyForm.legalRepresentative,
                phone: companyForm.phone,
                email: companyForm.email,
                main_address: companyForm.mainAddress
            };

            if (companyProfile) {
                const { error } = await supabase.from('company_profile').update(payload).eq('id', companyProfile.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('company_profile').insert(payload);
                if (error) throw error;
            }

            await fetchCompanyProfile();
            alert('Información de empresa guardada.');
        } catch (err: any) {
            alert('Error: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 p-8 animate-fade-in max-w-[1400px] mx-auto space-y-8 font-sans">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                        <span className="material-icons-round text-primary text-2xl">settings</span>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Perfil Empresarial</h1>
                        <p className="text-xs text-slate-400 mt-0.5 font-medium">Gestiona tu perfil y datos de la empresa en RESTOGESTIÓN V2.0.</p>
                    </div>
                </div>
            </header>

            {/* Nav Tabs */}
            <div className="flex bg-slate-200/50 p-1.5 rounded-2xl border border-slate-200 w-fit">
                <button
                    onClick={() => setActiveTab('profile')}
                    className={`px-8 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2.5 ${activeTab === 'profile' ? 'bg-white shadow-lg text-primary scale-105' : 'text-slate-500 hover:text-primary'}`}
                >
                    <span className="material-icons-round text-[18px]">person</span> Mi Perfil
                </button>
                <button
                    onClick={() => setActiveTab('company')}
                    className={`px-8 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2.5 ${activeTab === 'company' ? 'bg-white shadow-lg text-primary scale-105' : 'text-slate-500 hover:text-primary'}`}
                >
                    <span className="material-icons-round text-[18px]">business</span> Empresa
                </button>
            </div>

            <main className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 items-start">
                {/* Main Form Content */}
                <div className="space-y-8">
                    {activeTab === 'profile' ? (
                        <>
                            <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-8">
                                <h2 className="text-lg font-bold text-slate-800 tracking-tight">Información Personal</h2>
                                <form onSubmit={handleUpdateProfile} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Nombre Completo</label>
                                            <input type="text" value={profileName} onChange={e => setProfileName(e.target.value)} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-slate-300 shadow-sm" placeholder="Ej. Admin Robinson" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Email</label>
                                            <input type="text" value={currentUser?.email || ''} disabled className="w-full px-5 py-3.5 bg-slate-50/50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-400 cursor-not-allowed italic" />
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="btn bg-primary text-white hover:bg-primary/90 transition-all px-10 py-3 rounded-full shadow-lg shadow-primary/20 font-bold border border-primary flex items-center gap-2 text-sm"
                                    >
                                        <span className="material-icons-round text-[20px]">check_circle</span> Actualizar Datos
                                    </button>
                                </form>
                            </section>

                            <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-8">
                                <h2 className="text-lg font-bold text-slate-800 tracking-tight">Seguridad y Acceso</h2>
                                <form onSubmit={handleChangePassword} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Nueva Contraseña</label>
                                            <input type="password" value={passwordData.new} onChange={e => setPasswordData({ ...passwordData, new: e.target.value })} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-slate-400 shadow-sm" placeholder="Mínimo 8 caracteres" />
                                            <p className="text-[10px] text-slate-400 font-medium pl-1">Usa una combinación de letras, números y símbolos.</p>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Confirmar Contraseña</label>
                                            <input type="password" value={passwordData.confirm} onChange={e => setPasswordData({ ...passwordData, confirm: e.target.value })} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-slate-400 shadow-sm" placeholder="Repite la contraseña" />
                                        </div>
                                    </div>
                                    <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                                        <button
                                            type="submit"
                                            disabled={loading || !passwordData.new}
                                            className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all px-8 py-3 rounded-2xl shadow-sm font-bold flex items-center gap-2 text-sm"
                                        >
                                            Cambiar Contraseña
                                        </button>
                                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest italic">Último cambio: Hace 3 meses</p>
                                    </div>
                                </form>
                            </section>
                        </>
                    ) : (
                        <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-8">
                            <h2 className="text-lg font-bold text-slate-800 tracking-tight">Datos Corporativos</h2>
                            <form onSubmit={handleSaveCompany} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="col-span-2 space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Razón Social / Nombre Empresa</label>
                                        <input type="text" required value={companyForm.businessName} onChange={e => setCompanyForm({ ...companyForm, businessName: e.target.value })} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all shadow-sm" placeholder="Ej. Gastronomía S.A." />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">RUC / ID Legal</label>
                                        <input type="text" value={companyForm.ruc} onChange={e => setCompanyForm({ ...companyForm, ruc: e.target.value })} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all shadow-sm" placeholder="17900..." />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Representante Legal</label>
                                        <input type="text" value={companyForm.legalRepresentative} onChange={e => setCompanyForm({ ...companyForm, legalRepresentative: e.target.value })} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all shadow-sm" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Teléfono</label>
                                        <input type="text" value={companyForm.phone} onChange={e => setCompanyForm({ ...companyForm, phone: e.target.value })} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all shadow-sm" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Email Corporativo</label>
                                        <input type="email" value={companyForm.email} onChange={e => setCompanyForm({ ...companyForm, email: e.target.value })} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all shadow-sm" />
                                    </div>
                                    <div className="col-span-2 space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Dirección Matriz</label>
                                        <input type="text" value={companyForm.mainAddress} onChange={e => setCompanyForm({ ...companyForm, mainAddress: e.target.value })} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all shadow-sm" />
                                    </div>
                                </div>
                                <button type="submit" disabled={loading} className="btn bg-primary text-white hover:bg-primary/90 transition-all px-10 py-3 rounded-full shadow-lg shadow-primary/20 font-bold border border-primary flex items-center gap-2 text-sm">
                                    <span className="material-icons-round text-[20px]">save</span> {loading ? 'Guardando...' : 'Guardar Información'}
                                </button>
                            </form>
                        </section>
                    )}
                </div>

                {/* Sidebar Info Content */}
                <aside className="space-y-6">
                    {/* Role Status Card */}
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center text-center space-y-4">
                        <div className="w-16 h-16 bg-slate-50/80 rounded-full flex items-center justify-center border border-slate-100 shadow-inner">
                            <span className="material-icons-round text-slate-400 text-3xl">account_circle</span>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rol de Usuario</p>
                            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary text-[11px] font-black uppercase tracking-wider rounded-full border border-primary/20 shadow-sm">
                                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                {currentUser?.role || 'Guest'}
                            </span>
                        </div>
                        <div className="pt-4 border-t border-slate-50 w-full">
                            <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight mb-2">Permisos Totales</h4>
                            <p className="text-xs text-slate-400 font-medium leading-relaxed">
                                Tienes acceso completo a configuraciones financieras, gestión de personal y reportes corporativos.
                            </p>
                        </div>
                    </div>

                    {/* Help Card */}
                    <div className="bg-primary p-8 rounded-3xl shadow-2xl shadow-primary/20 text-white relative overflow-hidden group">
                        <span className="material-icons-round absolute -right-4 -bottom-4 text-[120px] opacity-10 group-hover:scale-110 transition-transform duration-700">help_outline</span>
                        <div className="relative space-y-6">
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                                <span className="material-icons-round text-white">help_outline</span>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-lg font-bold tracking-tight">¿Necesitas ayuda?</h3>
                                <p className="text-xs text-primary-100 leading-relaxed font-medium">
                                    Consulta nuestra base de conocimientos para aprender a configurar tu entorno empresarial.
                                </p>
                            </div>
                            <button className="w-full py-3 bg-white text-primary rounded-xl font-bold text-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-xl shadow-black/10">
                                Ver Documentación <span className="material-icons-round text-lg">open_in_new</span>
                            </button>
                        </div>
                    </div>
                </aside>
            </main>

            <footer className="pt-12 pb-4 text-center">
                <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest">RESTOGESTIÓN V2.0 © 2024 - Sistema de Gestión Gastronómica Profesional</p>
            </footer>
        </div>
    );
};

export default EnterpriseProfileView;
