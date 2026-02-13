
import React from 'react';
import { NavLink } from 'react-router-dom';
import { UserRole } from '../types';

interface SidebarProps {
  user: { name: string; role: UserRole };
  onLogout: () => void;
  onLock?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, onLogout, onLock }) => {
  const navItems = {
    [UserRole.ADMIN]: [
      { label: 'Dashboard', icon: 'dashboard', path: '/admin' },
      { label: 'Mesas', icon: 'table_restaurant', path: '/tables' },
      { label: 'Pedidos', icon: 'receipt_long', path: '/orders-history' },
      { label: 'Personal', icon: 'group', path: '/users' }, // New
      { label: 'Auditoría', icon: 'policy', path: '/audit' }, // New
      { label: 'Ingredientes', icon: 'restaurant', path: '/ingredients' },
      { label: 'Inventario', icon: 'inventory_2', path: '/inventory' },
      { label: 'Platos', icon: 'dinner_dining', path: '/plates' },
      {
        label: 'Finanzas',
        icon: 'analytics',
        path: '/finance', // Keep parent path active if children are active
        children: [
          { label: 'Resumen', icon: 'bar_chart', path: '/finance' },
          { label: 'Gastos Ops.', icon: 'payments', path: '/expenses' }
        ]
      },
    ],
    [UserRole.WAITER]: [
      { label: 'Pedidos POS', icon: 'receipt_long', path: '/waiter' },
    ],
    [UserRole.CASHIER]: [
      { label: 'Caja y Cobros', icon: 'point_of_sale', path: '/cashier' },
    ],
    [UserRole.KITCHEN]: [
      { label: 'Cocina', icon: 'soup_kitchen', path: '/kitchen' },
    ],
  };

  const activeItems = navItems[user.role];

  const roleNames = {
    [UserRole.ADMIN]: 'Administrador',
    [UserRole.WAITER]: 'Mesero',
    [UserRole.CASHIER]: 'Cajero/a',
    [UserRole.KITCHEN]: 'Cocina',
  };

  return (
    <aside className="w-64 bg-primary text-white flex flex-col shrink-0 transition-all duration-300">
      <div className="h-20 flex items-center px-6 border-b border-primary-light">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-bold text-lg">C</div>
          <span className="text-xl font-bold tracking-tight">ControlRest</span>
        </div>
      </div>

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
            <p className="text-xs text-white/50 truncate">{user.name}</p>
          </div>
          <span className="material-icons-round text-white/50 group-hover:text-white">logout</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
