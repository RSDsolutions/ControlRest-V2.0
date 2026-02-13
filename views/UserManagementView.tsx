
import React, { useState, useEffect } from 'react';
import { User, UserRole, Order } from '../types';
import { supabase } from '../supabaseClient';
import { logActivity } from '../services/audit';

interface UserManagementViewProps {
    currentUser: User | null;
}

const UserManagementView: React.FC<UserManagementViewProps> = ({ currentUser }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({ name: '', username: '', password: '', pin: '', role: UserRole.WAITER });
    const [loading, setLoading] = useState(false);
    const [metrics, setMetrics] = useState<any>(null); // For selected user metrics

    useEffect(() => {
        fetchUsers();
    }, [currentUser]);

    const fetchUsers = async () => {
        if (!currentUser?.branchId) return;
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('branch_id', currentUser.branchId)
            .neq('role', UserRole.ADMIN); // Only manage staff, not other admins (optional rule)

        if (data) {
            const formatted: User[] = data.map((u: any) => ({
                id: u.id,
                name: u.full_name,
                username: u.username,
                role: u.role as UserRole,
                pin: u.pin,
                isActive: u.is_active,
                branchId: u.branch_id
            }));
            setUsers(formatted);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser?.branchId) return;
        setLoading(true);

        try {
            const payload = {
                full_name: formData.name,
                username: formData.username,
                pin: formData.pin,
                role: formData.role,
                branch_id: currentUser.branchId,
                restaurant_id: currentUser.restaurantId,
                is_active: true
            };

            if (editingUser) {
                const { error } = await supabase.from('users').update(payload).eq('id', editingUser.id);
                if (error) throw error;
                // If password was changed, update it via RPC (bcrypt hash)
                if (formData.password.trim()) {
                    const { error: pwError } = await supabase.rpc('update_staff_password', {
                        p_user_id: editingUser.id,
                        p_password: formData.password
                    });
                    if (pwError) throw pwError;
                }
                await logActivity(currentUser.id, 'edit_user', 'UserMgmt', { id: editingUser.id, ...payload });
            } else {
                // Use RPC to create user with hashed password
                const { data, error } = await supabase.rpc('create_staff_user', {
                    p_name: formData.name,
                    p_username: formData.username,
                    p_password: formData.password,
                    p_pin: formData.pin || null,
                    p_role: formData.role,
                    p_branch_id: currentUser.branchId || null,
                    p_restaurant_id: currentUser.restaurantId || null
                });

                if (error) throw error;
                await logActivity(currentUser.id, 'create_user', 'UserMgmt', { username: formData.username, role: formData.role });
            }

            fetchUsers();
            closeModal();
        } catch (err: any) {
            console.error(err);
            alert('Error: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (user: User) => {
        try {
            const newStatus = !user.isActive;
            const { error } = await supabase.from('users').update({ is_active: newStatus }).eq('id', user.id);
            if (error) throw error;
            setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isActive: newStatus } : u));
            await logActivity(currentUser?.id || '', 'toggle_user_status', 'UserMgmt', { id: user.id, status: newStatus });
        } catch (err) {
            console.error(err);
        }
    };

    const deleteUser = async (user: User) => {
        if (!confirm(`¿Eliminar permanentemente a ${user.name}? Esta acción no se puede deshacer.`)) return;
        try {
            const { error } = await supabase.from('users').delete().eq('id', user.id);
            if (error) throw error;
            setUsers(prev => prev.filter(u => u.id !== user.id));
            await logActivity(currentUser?.id || '', 'delete_user', 'UserMgmt', { id: user.id, name: user.name });
        } catch (err) {
            console.error(err);
        }
    };

    const openModal = (user?: User) => {
        if (user) {
            setEditingUser(user);
            setFormData({ name: user.name, username: user.username || '', password: '', pin: user.pin || '', role: user.role });
        } else {
            setEditingUser(null);
            setFormData({ name: '', username: '', password: '', pin: '', role: UserRole.WAITER });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingUser(null);
    };

    // Metrics logic could go here or separate component
    // For brevity, basic list now.

    return (
        <div className="p-6 space-y-6 animate-fadeIn max-w-[1200px] mx-auto pb-20">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <span className="material-icons-round text-accent">group</span> Gestión de Personal
                    </h1>
                    <p className="text-slate-500 font-medium">Administra meseros y cajeros.</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                >
                    <span className="material-icons-round">person_add</span> Nuevo Usuario
                </button>
            </header>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-wider">Nombre</th>
                            <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-wider">Rol</th>
                            <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-wider">PIN</th>
                            <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-wider">Estado</th>
                            <th className="px-6 py-4 text-right text-xs font-black text-slate-400 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {users.map(u => (
                            <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 font-bold text-slate-800">{u.name} <span className="text-xs text-slate-400 font-normal">({u.username})</span></td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-xs font-black uppercase ${u.role === UserRole.WAITER ? 'bg-orange-100 text-orange-700' : u.role === UserRole.KITCHEN ? 'bg-red-100 text-red-700' : 'bg-purple-100 text-purple-700'}`}>
                                        {u.role === UserRole.WAITER ? 'Mesero' : u.role === UserRole.KITCHEN ? 'Cocina' : 'Cajero'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 font-mono text-slate-500">****</td>
                                <td className="px-6 py-4">
                                    <span className={`w-2 h-2 rounded-full inline-block mr-2 ${u.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                                    <span className="text-sm font-medium text-slate-600">{u.isActive ? 'Activo' : 'Inactivo'}</span>
                                </td>
                                <td className="px-6 py-4 text-right space-x-2">
                                    <button onClick={() => openModal(u)} className="text-blue-600 font-bold text-xs hover:bg-blue-50 px-2 py-1 rounded">EDITAR</button>
                                    <button onClick={() => toggleStatus(u)} className={`${u.isActive ? 'text-rose-600 hover:bg-rose-50' : 'text-emerald-600 hover:bg-emerald-50'} font-bold text-xs px-2 py-1 rounded`}>
                                        {u.isActive ? 'DESACTIVAR' : 'ACTIVAR'}
                                    </button>
                                    {!u.isActive && (
                                        <button onClick={() => deleteUser(u)} className="text-red-700 font-bold text-xs hover:bg-red-100 px-2 py-1 rounded">ELIMINAR</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-black text-xl text-slate-800">{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
                            <button onClick={closeModal} className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors">
                                <span className="material-icons-round text-lg">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nombre Completo</label>
                                <input type="text" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Usuario (Login)</label>
                                <input type="text" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Contraseña {editingUser ? '(dejar vacío para no cambiar)' : ''}</label>
                                <input type="password" required={!editingUser} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder={editingUser ? '••••••••' : ''} />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">PIN de Bloqueo (4-6 dígitos)</label>
                                <input type="password" required maxLength={6} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700" value={formData.pin} onChange={e => setFormData({ ...formData, pin: e.target.value })} placeholder="Para desbloquear pantalla" />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Rol</label>
                                <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}>
                                    <option value={UserRole.WAITER}>Mesero</option>
                                    <option value={UserRole.CASHIER}>Cajero</option>
                                    <option value={UserRole.KITCHEN}>Cocina</option>
                                </select>
                            </div>
                            <button type="submit" disabled={loading} className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-xl font-black text-lg shadow-lg hover:shadow-xl transition-all mt-4">
                                {loading ? 'Guardando...' : 'Guardar'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagementView;
