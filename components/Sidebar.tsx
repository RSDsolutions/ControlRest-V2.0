
import React from 'react';
import { NavLink } from 'react-router-dom';
import { UserRole, Branch } from '../types';

interface SidebarProps {
  user: { name: string; role: UserRole };
  onLogout: () => void;
  onLock?: () => void;
  branches?: Branch[];
  currentBranchId?: string | null;
  onBranchChange?: (branchId: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, onLogout, onLock, branches = [], currentBranchId, onBranchChange }) => {
  const navItems = {
    [UserRole.ADMIN]: [
      { label: 'Dashboard', icon: 'dashboard', path: '/admin' },
      { label: 'Mesas', icon: 'table_restaurant', path: '/tables' },
      { label: 'Pedidos', icon: 'receipt_long', path: '/orders-history' },
      { label: 'Gestión de Usuarios', path: '/users', icon: 'group' },
      { label: 'Perfil Empresarial', path: '/enterprise-profile', icon: 'settings_suggest' },
      { label: 'Auditoría', path: '/audit', icon: 'history' },
      { label: 'Ingredientes', icon: 'restaurant', path: '/ingredients' },
      { label: 'Solicitudes Compra', icon: 'shopping_cart', path: '/purchase-requests' },
      { label: 'Proveedores', icon: 'local_shipping', path: '/suppliers' },
      { label: 'Inventario', icon: 'inventory_2', path: '/inventory' },
      { label: 'Lotes FIFO', icon: 'playlist_add_check', path: '/inventory-batches' },
      { label: 'Control Merma', icon: 'delete_forever', path: '/waste' },
      { label: 'Platos', icon: 'dinner_dining', path: '/plates' },
      {
        label: 'Finanzas',
        icon: 'analytics',
        path: '/finance',
        children: [
          { label: 'Resumen', icon: 'bar_chart', path: '/finance' },
          { label: 'Gastos Ops.', icon: 'payments', path: '/expenses' },
          { label: 'Períodos Bloqueados', icon: 'lock_clock', path: '/period-locks' },
          { label: 'Snapshots Diarios', icon: 'assessment', path: '/snapshots' }
        ]
      },
    ],
    [UserRole.WAITER]: [
      { label: 'Pedidos POS', icon: 'receipt_long', path: '/waiter' },
    ],
    [UserRole.CASHIER]: [
      { label: 'Caja y Cobros', icon: 'point_of_sale', path: '/cashier' },
      { label: 'Historial', icon: 'history', path: '/cashier-history' },
    ],
    [UserRole.KITCHEN]: [
      { label: 'Cocina', icon: 'soup_kitchen', path: '/kitchen' },
      { label: 'Recetario', icon: 'menu_book', path: '/kitchen/recipes' },
      { label: 'Reportar Merma', icon: 'report_problem', path: '/kitchen/waste' },
      { label: 'Historial', icon: 'history', path: '/kitchen-history' },
    ],
  };

  const activeItems = navItems[user.role];

  return (
    <aside className="w-64 bg-primary text-white flex flex-col shrink-0 transition-all duration-300">
      <div className="h-20 flex flex-col justify-center px-6 border-b border-primary-light">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-bold text-lg">C</div>
          <span className="text-xl font-bold tracking-tight">ControlRest</span>
        </div>
      </div>

      {/* Branch Switcher for Admin */}
      {user.role === UserRole.ADMIN && branches.length > 0 && onBranchChange && (
        <div className="px-4 pt-4">
          <label className="text-xs text-white/50 font-bold uppercase tracking-wider mb-1 block">Sucursal Activa</label>
          <div className="relative">
            <select
              value={currentBranchId || ''}
              onChange={(e) => onBranchChange && onBranchChange(e.target.value)}
              className="w-full bg-white/10 text-white border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 appearance-none cursor-pointer"
            >
              <option value="GLOBAL" className="text-slate-900 font-bold">🌍 GLOBAL (Todas)</option>
              {branches.map(b => (
                <option key={b.id} value={b.id} className="text-slate-900">
                  {b.name} {b.isActive ? '' : '(Inactiva)'}
                </option>
              ))}
            </select>
            <span className="material-icons-round absolute right-3 top-2.5 text-white/50 pointer-events-none text-sm">expand_more</span>
          </div>
        </div>
      )}

      <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto no-scrollbar">
        <p className="px-4 text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Menú Principal</p>
        {activeItems.map((item: any) => {
          if (item.children) {
            return (
              <div key={item.label} className="space-y-1">
                <div className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-white/70">
                  <span className="material-icons-round text-[20px]">{item.icon}</span>
                  {item.label}
                </div>
                <div className="pl-4 space-y-1">
                  {item.children.map((child: any) => (
                    <NavLink
                      key={child.path}
                      to={child.path}
                      className={({ isActive }) => `
                                      flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-xl transition-all
                                      ${isActive
                          ? 'bg-white/10 text-white shadow-sm ring-1 ring-white/5'
                          : 'text-white/50 hover:bg-white/5 hover:text-white'
                        }
                                    `}
                    >
                      <span className="material-icons-round text-[18px]">{child.icon}</span>
                      {child.label}
                    </NavLink>
                  ))}
                </div>
              </div>
            );
          }
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all
                  ${isActive
                  ? 'bg-white/10 text-white shadow-sm ring-1 ring-white/5'
                  : 'text-white/70 hover:bg-white/5 hover:text-white'
                }
                `}
            >
              <span className="material-icons-round text-[20px]">{item.icon}</span>
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-primary-light space-y-2">
        {onLock && (
          <button
            onClick={onLock}
            className="flex items-center gap-3 text-white/70 hover:text-white hover:bg-white/10 w-full p-2 rounded-xl transition-all mb-2"
          >
            <span className="material-icons-round">lock</span>
            <span className="font-bold text-sm">Bloquear</span>
          </button>
        )}
        <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group" onClick={onLogout}>
          <img
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=1FAA59&color=fff`}
            alt="Perfil"
            className="h-9 w-9 rounded-full object-cover ring-2 ring-white/20"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user.name}</p>
            <p className="text-xs text-white/50 truncate block">
              {branches.find(b => b.id === currentBranchId)?.name || 'Sin Sucursal'}
            </p>
          </div>
          <span className="material-icons-round text-white/50 group-hover:text-white">logout</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
