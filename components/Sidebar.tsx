
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
          { label: 'Facturas de Compra', icon: 'receipt', path: '/supplier-invoices' },
          { label: 'Cuentas por Pagar', icon: 'account_balance_wallet', path: '/accounts-payable' },
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
      { label: 'Facturas de Compra', icon: 'receipt', path: '/supplier-invoices' },
      { label: 'Cuentas por Pagar', icon: 'account_balance_wallet', path: '/accounts-payable' },
    ],
    [UserRole.KITCHEN]: [
      { label: 'Cocina', icon: 'soup_kitchen', path: '/kitchen' },
      { label: 'Recetario', icon: 'menu_book', path: '/kitchen/recipes' },
      { label: 'Solicitar Insumos', icon: 'shopping_cart', path: '/kitchen/purchase-requests' },
      { label: 'Reportar Merma', icon: 'report_problem', path: '/kitchen/waste' },
      { label: 'Historial', icon: 'history', path: '/kitchen-history' },
    ],
  };

  const activeItems = navItems[user.role];

  return (
    <aside className="w-68 bg-brand-black text-white flex flex-col shrink-0 transition-all duration-300 shadow-2xl z-20">
      <div className="h-20 flex flex-col justify-center px-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center font-bold text-xl shadow-lg ring-1 ring-white/20">C</div>
          <span className="text-xl font-heading font-bold tracking-tight text-white/95">ControlRest</span>
        </div>
      </div>

      {/* Branch Switcher for Admin */}
      {user.role === UserRole.ADMIN && branches.length > 0 && onBranchChange && (
        <div className="px-5 pt-6 pb-2">
          <label className="text-[10px] text-white/40 font-bold uppercase tracking-[0.1em] mb-2 block">Sucursal Activa</label>
          <div className="relative group">
            <select
              value={currentBranchId || ''}
              onChange={(e) => onBranchChange && onBranchChange(e.target.value)}
              className="w-full bg-white/5 text-white/90 border border-white/10 rounded-brand px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 appearance-none cursor-pointer transition-all hover:bg-white/10"
            >
              <option value="GLOBAL" className="text-slate-900 font-bold italic">🌍 MODO GLOBAL</option>
              {branches.map(b => (
                <option key={b.id} value={b.id} className="text-slate-900">
                  {b.name} {b.isActive ? '' : '(Inactiva)'}
                </option>
              ))}
            </select>
            <span className="material-icons-round absolute right-3 top-[11px] text-white/30 group-hover:text-white/60 pointer-events-none text-lg transition-colors">expand_more</span>
          </div>
        </div>
      )}

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto no-scrollbar custom-scrollbar">
        {activeItems.map((item: any) => {
          if (item.children) {
            return (
              <div key={item.label} className="mt-4 first:mt-0">
                <p className="px-4 text-[10px] font-bold text-white/30 uppercase tracking-[0.15em] mb-2">{item.label}</p>
                <div className="space-y-0.5">
                  {item.children.map((child: any) => (
                    <NavLink
                      key={child.path}
                      to={child.path}
                      className={({ isActive }) => `
                        flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-brand transition-all duration-200
                        ${isActive
                          ? 'bg-primary text-white shadow-brand ring-1 ring-white/10'
                          : 'text-white/50 hover:bg-white/5 hover:text-white/90'
                        }
                      `}
                    >
                      <span className="material-icons-round text-[20px]">{child.icon}</span>
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
                  flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-brand transition-all duration-200
                  ${isActive
                  ? 'bg-primary text-white shadow-brand ring-1 ring-white/10'
                  : 'text-white/60 hover:bg-white/5 hover:text-white/90'
                }
                `}
            >
              <span className="material-icons-round text-[22px]">{item.icon}</span>
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 bg-white/[0.02] border-t border-white/5 space-y-3">
        {onLock && (
          <button
            onClick={onLock}
            className="flex items-center justify-center gap-2 text-white/60 hover:text-white hover:bg-white/10 w-full py-2.5 rounded-brand border border-white/10 transition-all text-sm font-semibold"
          >
            <span className="material-icons-round text-lg">lock</span>
            Bloquear Sistema
          </button>
        )}
        <div className="flex items-center gap-3 p-2 rounded-brand hover:bg-white/5 transition-all cursor-pointer group" onClick={onLogout}>
          <div className="relative">
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0F52BA&color=fff&bold=true`}
              alt="Perfil"
              className="h-10 w-10 rounded-brand object-cover ring-2 ring-white/10 group-hover:ring-primary/50 transition-all"
            />
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-brand-black rounded-full"></div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white/95 truncate leading-tight">{user.name}</p>
            <p className="text-[11px] text-white/40 truncate font-medium uppercase tracking-wider">
              {branches.find(b => b.id === currentBranchId)?.name || 'MODO GLOBAL'}
            </p>
          </div>
          <span className="material-icons-round text-white/20 group-hover:text-white/90 transition-colors">logout</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
