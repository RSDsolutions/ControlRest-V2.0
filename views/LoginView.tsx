
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
    <div className="min-h-screen bg-primary flex items-center justify-center relative overflow-hidden font-sans">
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>

      <div className="relative z-10 w-full max-w-4xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="hidden lg:flex flex-col space-y-8 pr-8 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center text-white text-2xl font-bold">C</div>
            <span className="text-2xl font-bold">ControlRest</span>
          </div>
          <h1 className="text-5xl font-extrabold leading-tight">Gestión Inteligente para Restaurantes Modernos</h1>
          <p className="text-lg text-white/60">La única solución SaaS que conecta las operaciones de cocina con el crecimiento financiero real.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-white/10 w-full max-w-md mx-auto">
          <div className="p-8 text-center">
            <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center text-white text-xl font-bold mx-auto mb-4">C</div>
            <h2 className="text-2xl font-bold text-slate-900">{titles[mode]}</h2>
            <p className="text-slate-500 mt-2 text-sm">{subtitles[mode]}</p>
          </div>

          <div className="px-8 pb-8">
            {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg mb-4 font-medium">{error}</div>}

            {mode === 'select' && renderSelect()}
            {mode === 'admin' && renderAdminLogin()}
            {mode === 'employee' && renderStaffLogin()}
            {mode === 'register' && renderRegister()}

            {mode !== 'select' && (
              <button onClick={() => goTo('select')} className="w-full text-center mt-4 text-sm text-slate-500 hover:text-accent font-medium flex items-center justify-center gap-1">
                <span className="material-icons-round text-base">arrow_back</span> Volver
              </button>
            )}
          </div>
          <div className="h-1.5 w-full bg-accent"></div>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
