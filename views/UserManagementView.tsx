
import React, { useState, useEffect } from 'react';
import { User, UserRole, Order, Branch } from '../types';
import { supabase } from '../supabaseClient';
import { logActivity } from '../services/audit';

interface UserManagementViewProps {
    currentUser: User | null;
    branches?: Branch[];
}

const UserManagementView: React.FC<UserManagementViewProps> = ({ currentUser, branches = [] }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        username: '',
        password: '',
        pin: '',
        role: UserRole.WAITER,
        branchId: ''
    });
    const [loading, setLoading] = useState(false);
    const [metrics, setMetrics] = useState<any>(null); // For selected user metrics

    useEffect(() => {
        fetchUsers();

        // Realtime subscription
        const channel = supabase
            .channel('users-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
                fetchUsers();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentUser]);

    const fetchUsers = async () => {
        if (!currentUser?.restaurantId) return;
        const controller = new AbortController();

        // Fetch users from the entire restaurant associated with the admin's restaurant_id
        // Join with branches to get the name
        const { data, error } = await supabase
            .from('users')
            .select('*, branches(name)')
            .eq('restaurant_id', currentUser.restaurantId)
            .neq('role', UserRole.ADMIN)
            .abortSignal(controller.signal)
            .order('full_name');

        if (data) {
            const formatted: User[] = data.map((u: any) => ({
                id: u.id,
                name: u.full_name,
                email: u.email,
                username: u.username,
                role: u.role as UserRole,
                pin: u.pin,
                isActive: u.is_active,
                branchId: u.branch_id,
                branchName: u.branches?.name // Map branch name
            }));
            setUsers(formatted);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        // ... (existing save logic needs to check branch selection if we allow changing it)
        // For now, let's keep it simple, or allow picking branch in modal?
        // The user verified "assign employees" via script, so editing might not be strictly required "right now" to change branch in UI
        // But preventing regression: existing logic uses currentUser.branchId for new users.
        // We might want to add Branch Selector in Modal later, but for now let's stick to the viewing requirement.

        e.preventDefault();
        // Fallback to currentUser.branchId if no specific branch selected (though we should enforce selection if branches > 0)
        const targetBranchId = formData.branchId || currentUser?.branchId;

        if (!targetBranchId) return alert('Debe seleccionar una sucursal');

        // ... rest of logic uses targetBranchId instead of currentUser.branchId
        // ...
        setLoading(true);

        try {
            const payload = {
                full_name: formData.name,
                email: formData.email,
                username: formData.username,
                pin: formData.pin,
                role: formData.role,
                branch_id: targetBranchId,
                restaurant_id: currentUser?.restaurantId,
                is_active: true
            };

            if (editingUser) {
                const { error } = await supabase.from('users').update(payload).eq('id', editingUser.id);
                if (error) throw error;
                if (formData.password.trim()) {
                    const { error: pwError } = await supabase.rpc('update_staff_password', {
                        p_user_id: editingUser.id,
                        p_password: formData.password
                    });
                    if (pwError) throw pwError;
                }
                await logActivity(currentUser?.id || '', 'edit_user', 'UserMgmt', { id: editingUser.id, ...payload });
            } else {
                const { data, error } = await supabase.rpc('create_staff_user', {
                    p_name: formData.name,
                    p_username: formData.username,
                    p_password: formData.password,
                    p_pin: formData.pin || null,
                    p_role: formData.role,
                    p_branch_id: targetBranchId,
                    p_restaurant_id: currentUser?.restaurantId || null
                });

                if (error) throw error;
                await logActivity(currentUser?.id || '', 'create_user', 'UserMgmt', { username: formData.username, role: formData.role });
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

    // ... (toggleStatus, deleteUser, openModal, closeModal remain same)

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
            setFormData({
                name: user.name,
                email: user.email || '',
                username: user.username || '',
                password: '',
                pin: user.pin || '',
                role: user.role,
                branchId: user.branchId || currentUser?.branchId || ''
            });
        } else {
            setEditingUser(null);
            setFormData({
                name: '',
                email: '',
                username: '',
                password: '',
                pin: '',
                role: UserRole.WAITER,
                branchId: currentUser?.branchId || ''
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingUser(null);
    };


    return (
        <div className="p-6 space-y-5 animate-fade-in max-w-[1200px] mx-auto">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                        <span className="material-icons-round text-[#136dec] text-xl">group</span>
                        Gestión de Personal
                    </h1>
                    <p className="text-xs text-slate-400 mt-0.5">Administra meseros y cajeros de la sucursal.</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="btn btn-primary flex items-center gap-2 text-sm"
                >
                    <span className="material-icons-round text-[18px]">person_add</span> Nuevo Usuario
                </button>
            </header>

            <div className="table-wrapper">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Rol</th>
                            <th>Sucursal</th>
                            <th>PIN</th>
                            <th>Estado</th>
                            <th className="text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.id}>
                                <td>
                                    <p className="font-semibold text-slate-800">{u.name}</p>
                                    <p className="text-xs text-slate-400">{u.email}</p>
                                </td>
                                <td>
                                    <span className={`badge ${u.role === UserRole.WAITER ? 'badge-warning' : u.role === UserRole.KITCHEN ? 'badge-error' : 'badge-purple'}`}>
                                        {u.role === UserRole.WAITER ? 'Mesero' : u.role === UserRole.KITCHEN ? 'Cocina' : 'Cajero'}
                                    </span>
                                </td>
                                <td>
                                    {u.branchName ? (
                                        <span className="badge badge-neutral">{u.branchName}</span>
                                    ) : (
                                        <span className="text-xs italic text-slate-400">Sin Asignar</span>
                                    )}
                                </td>
                                <td className="font-mono text-slate-400 tracking-widest">••••</td>
                                <td>
                                    <span className={`badge ${u.isActive ? 'badge-success' : 'badge-neutral'}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-green-500' : 'bg-slate-400'}`}></span>
                                        {u.isActive ? 'Activo' : 'Inactivo'}
                                    </span>
                                </td>
                                <td className="text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                        <button onClick={() => openModal(u)} className="btn btn-outline btn-sm">Editar</button>
                                        <button onClick={() => toggleStatus(u)} className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-success'}`}>
                                            {u.isActive ? 'Desactivar' : 'Activar'}
                                        </button>
                                        {!u.isActive && (
                                            <button onClick={() => deleteUser(u)} className="btn btn-danger btn-sm">Eliminar</button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3 className="text-base font-semibold text-slate-900">{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
                            <button onClick={closeModal} className="btn btn-ghost btn-icon text-slate-400">
                                <span className="material-icons-round text-[20px]">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleSave}>
                            <div className="modal-body space-y-4">
                                <div className="form-group">
                                    <label className="label">Nombre Completo</label>
                                    <input type="text" required className="input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="label">Correo Electrónico (Login)</label>
                                    <input type="email" required className="input" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="ej: cocina1@gmail.com" />
                                </div>
                                <div className="form-group opacity-50 pointer-events-none">
                                    <label className="label">Usuario (Referencia)</label>
                                    <input type="text" className="input" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="label">Contraseña {editingUser ? '(dejar vacío para no cambiar)' : ''}</label>
                                    <input type="password" required={!editingUser} className="input" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="label">PIN de Bloqueo (4-6 dígitos)</label>
                                    <input type="password" required maxLength={6} className="input" value={formData.pin} onChange={e => setFormData({ ...formData, pin: e.target.value })} placeholder="Para desbloquear pantalla" />
                                </div>
                                <div className="form-group">
                                    <label className="label">Sucursal</label>
                                    <select className="input" value={formData.branchId} onChange={e => setFormData({ ...formData, branchId: e.target.value })}>
                                        <option value="" disabled>Seleccionar Sucursal</option>
                                        {branches.map(b => (
                                            <option key={b.id} value={b.id}>
                                                {b.name} {b.isActive ? '' : '(Inactiva)'} {b.isMain ? '(Matriz)' : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="label">Rol</label>
                                    <select className="input" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}>
                                        <option value={UserRole.WAITER}>Mesero</option>
                                        <option value={UserRole.CASHIER}>Cajero</option>
                                        <option value={UserRole.KITCHEN}>Cocina</option>
                                    </select>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={closeModal} className="btn btn-outline">Cancelar</button>
                                <button type="submit" disabled={loading} className="btn btn-primary">
                                    {loading ? 'Guardando...' : 'Guardar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagementView;
