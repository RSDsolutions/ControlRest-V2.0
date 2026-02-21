
import React, { useState } from 'react';
import { UserRole, User } from '../types';
import { supabase } from '../supabaseClient';

type LoginMode = 'select' | 'admin' | 'employee' | 'register';

interface LoginViewProps {
  onLogin: (role: UserRole) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<LoginMode>('select');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Admin fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register fields
  const [fullName, setFullName] = useState('');
  const [restaurantName, setRestaurantName] = useState('');

  // Employee fields
  const [staffIdentifier, setStaffIdentifier] = useState('');
  const [staffPassword, setStaffPassword] = useState('');

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
      onLogin(UserRole.ADMIN);
    } catch (err: any) {
      setError(err.message || 'Error de autenticación');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
      if (authError) throw authError;
      if (authData.user) {
        const { error: rpcError } = await supabase.rpc('register_tenant', {
          p_restaurant_name: restaurantName,
          p_admin_name: fullName,
        });
        if (rpcError) throw rpcError;
        onLogin(UserRole.ADMIN);
      }
    } catch (err: any) {
      setError(err.message || 'Error al registrar');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      // 1. Resolve Email (Smart Login)
      const { data: resolvedEmail, error: rpcError } = await supabase.rpc('resolve_staff_email', {
        p_identifier: staffIdentifier.trim().toLowerCase()
      });

      if (rpcError) throw rpcError;

      if (!resolvedEmail) {
        throw new Error('Usuario o correo no encontrado. Verifica tus credenciales.');
      }

      // 2. Sign In with the resolved email
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: resolvedEmail,
        password: staffPassword
      });

      if (authError) throw authError;

      if (authData.user) {
        onLogin(UserRole.WAITER);
      }
    } catch (err: any) {
      setError(err.message || 'Error de autenticación');
    } finally {
      setIsLoading(false);
    }
  };

  const resetFields = () => {
    setEmail(''); setPassword(''); setFullName(''); setRestaurantName('');
    setStaffIdentifier(''); setStaffPassword('');
    setError(null);
  };

  const goTo = (m: LoginMode) => { resetFields(); setMode(m); };

  // --- RENDER ---

  const renderSelect = () => (
    <div className="space-y-4">
      <button onClick={() => goTo('admin')} className="w-full py-4 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3 text-lg">
        <span className="material-icons-round">admin_panel_settings</span> Administrador
      </button>
      <button onClick={() => goTo('employee')} className="w-full py-4 bg-accent hover:bg-accent/90 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3 text-lg">
        <span className="material-icons-round">badge</span> Empleado
      </button>
      <div className="text-center pt-2">
        <button onClick={() => goTo('register')} className="text-sm text-accent font-medium hover:underline">¿Nuevo? Registra tu Restaurante</button>
      </div>
    </div>
  );

  const renderAdminLogin = () => (
    <form onSubmit={handleAdminLogin} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Correo electrónico</label>
        <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
          className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-accent focus:border-transparent outline-none" placeholder="admin@restaurante.com" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
        <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
          className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-accent focus:border-transparent outline-none" placeholder="••••••••" />
      </div>
      <button type="submit" disabled={isLoading} className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl transition-all shadow-lg">
        {isLoading ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mx-auto"></div> : 'Ingresar'}
      </button>
    </form>
  );

  const renderStaffLogin = () => (
    <form onSubmit={handleStaffLogin} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Usuario o Correo</label>
        <input type="text" required value={staffIdentifier} onChange={e => setStaffIdentifier(e.target.value)}
          className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-accent focus:border-transparent outline-none" placeholder="ej: cocinatest1" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
        <input type="password" required value={staffPassword} onChange={e => setStaffPassword(e.target.value)}
          className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-accent focus:border-transparent outline-none" placeholder="••••••••" />
      </div>
      <button type="submit" disabled={isLoading} className="w-full py-3 bg-accent hover:bg-accent/90 text-white font-bold rounded-xl transition-all shadow-lg">
        {isLoading ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mx-auto"></div> : 'Ingresar'}
      </button>
    </form>
  );

  const renderRegister = () => (
    <form onSubmit={handleRegister} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Restaurante</label>
        <input type="text" required value={restaurantName} onChange={e => setRestaurantName(e.target.value)}
          className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-accent focus:border-transparent outline-none" placeholder="La Fogata" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Tu Nombre</label>
        <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)}
          className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-accent focus:border-transparent outline-none" placeholder="Nombre completo" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Correo electrónico</label>
        <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
          className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-accent focus:border-transparent outline-none" placeholder="admin@restaurante.com" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
        <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
          className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-accent focus:border-transparent outline-none" placeholder="Mínimo 6 caracteres" />
      </div>
      <button type="submit" disabled={isLoading} className="w-full py-3 bg-accent hover:bg-accent/90 text-white font-bold rounded-xl transition-all shadow-lg">
        {isLoading ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mx-auto"></div> : 'Registrar Restaurante'}
      </button>
    </form>
  );

  const titles: Record<LoginMode, string> = {
    select: 'Bienvenido a ControlRest',
    admin: '👑 Acceso Administrador',
    employee: '👨‍🍳 Acceso Empleado',
    register: '🚀 Crear Restaurante',
  };

  const subtitles: Record<LoginMode, string> = {
    select: 'Selecciona tu tipo de acceso',
    admin: 'Ingresa con tu correo y contraseña',
    employee: 'Ingresa con tu usuario o correo',
    register: 'Registra tu negocio y comienza gratis',
  };

  return (
    <div className="min-h-screen bg-brand-black flex items-center justify-center relative overflow-hidden font-sans select-none">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none"></div>
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[160px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[160px] animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="relative z-10 w-full max-w-6xl mx-auto px-8 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center py-12">
        {/* Left Side: Brand & Value Prop */}
        <div className="hidden lg:flex flex-col space-y-12 pr-16 text-white animate-slide-right">
          <div className="flex items-center space-x-5">
            <div className="w-16 h-16 bg-primary rounded-[22px] flex items-center justify-center text-white text-4xl font-heading font-black shadow-[0_20px_50px_rgba(15,82,186,0.5)] ring-1 ring-white/20 transform hover:rotate-6 transition-transform cursor-pointer">C</div>
            <div>
              <span className="text-4xl font-heading font-black tracking-tight block">ControlRest</span>
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary-light/60">Financial Intelligence V2.0</span>
            </div>
          </div>

          <div className="space-y-8">
            <h1 className="text-7xl font-heading font-black leading-[0.95] tracking-tight text-white">
              Rentabilidad <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-light to-white/60">Bajo Control.</span>
            </h1>
            <p className="text-xl text-white/40 leading-relaxed font-medium max-w-lg">
              La plataforma definitiva para la gestión de costos, inventarios técnicos y optimización de márgenes en tiempo real.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 pt-6">
            <div className="space-y-2">
              <p className="text-2xl font-heading font-black text-white">100%</p>
              <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Trazabilidad Técnica</p>
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-heading font-black text-white">Real-Time</p>
              <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Sincronización Global</p>
            </div>
          </div>

          <div className="flex items-center gap-6 border-t border-white/10 pt-10">
            <div className="flex -space-x-4">
              {[1, 5, 8, 12].map(i => (
                <img key={i} className="w-12 h-12 rounded-full border-[3px] border-brand-black bg-slate-800 shadow-xl" src={`https://i.pravatar.cc/150?u=${i}`} alt="User" />
              ))}
            </div>
            <p className="text-[11px] font-black text-white/30 uppercase tracking-[0.2em]">Avalado por líderes del sector</p>
          </div>
        </div>

        {/* Right Side: Login Card */}
        <div className="w-full max-w-md mx-auto animate-fade-in group">
          <div className="bg-white rounded-[40px] shadow-[0_50px_100px_rgba(0,0,0,0.3)] overflow-hidden border border-white/10 relative">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-primary-light to-primary"></div>

            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-primary text-3xl font-black mx-auto mb-8 border border-slate-100 shadow-inner group-hover:scale-110 transition-transform duration-500">
                <span className="material-icons-round text-4xl">{mode === 'select' ? 'vibrant_box' : mode === 'admin' ? 'admin_panel_settings' : 'badge'}</span>
              </div>
              <h2 className="text-3xl font-heading font-black text-brand-black tracking-tight">{titles[mode]}</h2>
              <p className="text-slate-400 mt-3 text-[10px] font-black uppercase tracking-[0.2em]">{subtitles[mode]}</p>
            </div>

            <div className="px-12 pb-12">
              {error && (
                <div className="bg-red-50 border-2 border-red-100 text-red-600 px-6 py-4 rounded-2xl flex items-center gap-3 text-xs font-bold mb-8 animate-shake">
                  <span className="material-icons-round text-lg">error_outline</span>
                  {error}
                </div>
              )}

              {mode === 'select' && (
                <div className="space-y-5">
                  <button onClick={() => goTo('admin')} className="w-full py-5 bg-brand-black text-white font-heading font-black rounded-[22px] transition-all shadow-2xl hover:bg-slate-900 flex items-center justify-center gap-4 text-lg group/btn">
                    <span className="material-icons-round group-hover:text-primary transition-colors">rocket_launch</span>
                    Panel de Control
                  </button>
                  <button onClick={() => goTo('employee')} className="w-full py-5 bg-primary text-white font-heading font-black rounded-[22px] transition-all shadow-lg shadow-primary/30 hover:shadow-primary/50 flex items-center justify-center gap-4 text-lg active:scale-95">
                    <span className="material-icons-round">bolt</span>
                    Acceso Operativo
                  </button>
                  <div className="text-center pt-8 border-t border-slate-50 mt-8">
                    <button onClick={() => goTo('register')} className="text-xs text-primary font-black uppercase tracking-widest hover:text-primary-dark transition-colors flex items-center justify-center gap-2 mx-auto">
                      ¿Nuevo Negocio? <span className="underline decoration-2 underline-offset-4">Registrarme Aqui</span>
                    </button>
                  </div>
                </div>
              )}

              {mode === 'admin' && (
                <form onSubmit={handleAdminLogin} className="space-y-6">
                  <div className="space-y-3">
                    <label className="label">Correo Corporativo</label>
                    <div className="relative">
                      <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">alternate_email</span>
                      <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                        className="input pl-12 h-14 bg-slate-50/50 border-slate-100 focus:bg-white transition-all font-bold" placeholder="tu@empresa.com" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="label">Clave de Seguridad</label>
                    <div className="relative">
                      <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">lock_open</span>
                      <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                        className="input pl-12 h-14 bg-slate-50/50 border-slate-100 focus:bg-white transition-all font-bold" placeholder="••••••••" />
                    </div>
                  </div>
                  <button type="submit" disabled={isLoading} className="w-full h-16 bg-brand-black text-white font-heading font-black rounded-[22px] text-lg mt-4 shadow-2xl active:scale-95 transition-all">
                    {isLoading ? <span className="animate-spin material-icons-round">sync</span> : 'Entrar al Sistema'}
                  </button>
                </form>
              )}

              {mode === 'employee' && (
                <form onSubmit={handleStaffLogin} className="space-y-6">
                  <div className="space-y-3">
                    <label className="label">Ficha de Usuario</label>
                    <div className="relative">
                      <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">fingerprint</span>
                      <input type="text" required value={staffIdentifier} onChange={e => setStaffIdentifier(e.target.value)}
                        className="input pl-12 h-14 bg-slate-50/50 border-slate-100 focus:bg-white transition-all font-bold" placeholder="Usuario o alias" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="label">PIN de Acceso</label>
                    <div className="relative">
                      <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">pin</span>
                      <input type="password" required value={staffPassword} onChange={e => setStaffPassword(e.target.value)}
                        className="input pl-12 h-14 bg-slate-50/50 border-slate-100 focus:bg-white transition-all font-bold" placeholder="••••" />
                    </div>
                  </div>
                  <button type="submit" disabled={isLoading} className="w-full h-16 bg-primary text-white font-heading font-black rounded-[22px] text-lg mt-4 shadow-xl shadow-primary/30 active:scale-95 transition-all">
                    {isLoading ? <span className="animate-spin material-icons-round">sync</span> : 'Iniciar Jornada'}
                  </button>
                </form>
              )}

              {mode === 'register' && (
                <form onSubmit={handleRegister} className="space-y-5">
                  <div className="grid grid-cols-1 gap-5">
                    <div className="space-y-2">
                      <label className="label text-[9px]">Nombre del Establecimiento</label>
                      <input type="text" required value={restaurantName} onChange={e => setRestaurantName(e.target.value)}
                        className="input h-12 text-sm font-bold" placeholder="Marca comercial" />
                    </div>
                    <div className="space-y-2">
                      <label className="label text-[9px]">Responsable</label>
                      <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)}
                        className="input h-12 text-sm font-bold" placeholder="Nombre completo" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="label text-[9px]">E-mail Corporativo</label>
                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                      className="input h-12 text-sm font-bold" placeholder="admin@negocio.com" />
                  </div>
                  <div className="space-y-2">
                    <label className="label text-[9px]">Contraseña Maestra</label>
                    <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                      className="input h-12 text-sm font-bold" placeholder="Mínimo 8 caracteres" />
                  </div>
                  <button type="submit" disabled={isLoading} className="w-full h-14 bg-brand-black text-white font-heading font-black rounded-[20px] text-sm mt-4 shadow-2xl active:scale-95 transition-all">
                    {isLoading ? <span className="animate-spin material-icons-round">sync</span> : 'Crear Cuenta Enterprise'}
                  </button>
                </form>
              )}

              {mode !== 'select' && (
                <button onClick={() => goTo('select')} className="w-full text-center mt-10 text-[10px] text-slate-400 hover:text-primary font-black flex items-center justify-center gap-3 transition-colors uppercase tracking-[0.2em]">
                  <span className="material-icons-round text-base">arrow_back</span> Regresar
                </button>
              )}
            </div>
          </div>

          <div className="mt-8 text-center text-white/20 text-[9px] font-black uppercase tracking-[0.4em]">
            Powered by RSA Solutions Digital &copy; 2026
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
