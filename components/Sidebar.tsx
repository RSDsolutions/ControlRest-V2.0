
import React from 'react';
import { NavLink } from 'react-router-dom';
import { UserRole, Branch } from '../types';
import { usePlanFeatures, isFeatureEnabled } from '../hooks/usePlanFeatures';

interface SidebarProps {
  user: { name: string; role: UserRole; restaurantName?: string; restaurantId?: string };
  onLogout: () => void;
  branches?: Branch[];
  currentBranchId?: string | null;
  onBranchChange?: (branchId: string) => void;
  isSupportMode?: boolean;
  onExitSupport?: () => void;
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  label: string;
  icon: string;
  path: string;
}

interface NavGroup {
  groupLabel: string;
  items: NavItem[];
}

const Sidebar: React.FC<SidebarProps> = ({ user, onLogout, branches = [], currentBranchId, onBranchChange, isSupportMode, onExitSupport, isOpen, onClose }) => {
  const { data: planData, isLoading: featuresLoading } = usePlanFeatures(user.restaurantId);
  const isPlanOperativo = featuresLoading ? false : !isFeatureEnabled(planData, 'ENABLE_NET_PROFIT_CALCULATION');

  // ─── SUPERADMIN NAV ────────────────────────────────────────────────────────
  const superadminNav: NavGroup[] = [
    {
      groupLabel: 'GLOBAL SaaS',
      items: [
        { label: 'Panel Global', icon: 'admin_panel_settings', path: '/saas-admin' },
        { label: 'Leads (CRM)', icon: 'group_add', path: '/saas-leads' },
        { label: 'Gestión SaaS', icon: 'business_center', path: '/saas-management' },
        { label: 'Sucursales', icon: 'account_tree', path: '/saas-branches' },
        { label: 'Suscripciones', icon: 'card_membership', path: '/saas-subscriptions' },
      ],
    },
  ];

  // ─── ADMIN NAV ───────────────────────────────────────────────────────────────
  const adminNav: NavGroup[] = [
    {
      groupLabel: 'GENERAL',
      items: [
        { label: 'Dashboard', icon: 'dashboard', path: '/admin' },
      ],
    },
    {
      groupLabel: 'OPERACIÓN',
      items: [
        { label: 'Mesas', icon: 'table_restaurant', path: '/tables' },
        { label: 'Pedidos', icon: 'receipt_long', path: '/orders-history' },
        { label: 'Cocina', icon: 'soup_kitchen', path: '/kitchen' },
        { label: 'Caja', icon: 'point_of_sale', path: '/cashier' },
      ],
    },
    {
      groupLabel: 'INVENTARIO & PRODUCCIÓN',
      items: [
        { label: 'Ingredientes', icon: 'restaurant', path: '/ingredients' },
        { label: 'Platos', icon: 'menu_book', path: '/plates' },
        { label: 'Inventario', icon: 'inventory_2', path: '/inventory' },
        { label: 'Lotes FIFO', icon: 'playlist_add_check', path: '/inventory-batches' },
        { label: 'Control Merma', icon: 'delete_forever', path: '/waste' },
      ],
    },
    {
      groupLabel: 'COMPRAS & PROVEEDORES',
      items: [
        { label: 'Solicitudes de Compra', icon: 'shopping_cart', path: '/purchase-requests' },
        { label: 'Proveedores', icon: 'local_shipping', path: '/suppliers' },
        { label: 'Facturas de Compra', icon: 'receipt', path: '/supplier-invoices' },
        { label: 'Cuentas por Pagar', icon: 'account_balance_wallet', path: '/accounts-payable' },
      ],
    },
    {
      groupLabel: 'FINANZAS',
      items: [
        { label: 'Resumen', icon: 'bar_chart', path: '/finance' },
        { label: 'Gastos Operativos', icon: 'payments', path: '/expenses' },
        { label: 'Snapshots Diarios', icon: 'assessment', path: '/snapshots' },
        { label: 'Períodos Bloqueados', icon: 'lock_clock', path: '/period-locks' },
      ],
    },
    {
      groupLabel: 'ADMINISTRACIÓN',
      items: [
        { label: 'Gestión de Usuarios', icon: 'group', path: '/users' },
        { label: 'Perfil Empresarial', icon: 'settings_suggest', path: '/enterprise-profile' },
        { label: 'Config. de Sucursales', icon: 'store', path: '/branches-config' },
      ],
    },
    {
      groupLabel: 'AUDITORÍA & CONTROL',
      items: [
        { label: 'Auditoría', icon: 'policy', path: '/audit' },
      ],
    },
    {
      groupLabel: 'IA & INSIGHTS',
      items: [
        { label: 'Inteligencia Operativa', icon: 'psychology', path: '/intelligence' },
      ],
    },
  ];

  // ─── ROLE-BASED NAV ──────────────────────────────────────────────────────────
  const waiterNav: NavGroup[] = [
    {
      groupLabel: 'OPERACIÓN',
      items: [
        { label: 'Pedidos POS', icon: 'receipt_long', path: '/waiter' },
      ],
    },
  ];

  const cashierNav: NavGroup[] = [
    {
      groupLabel: 'CAJA',
      items: [
        { label: 'Caja y Cobros', icon: 'point_of_sale', path: '/cashier' },
        { label: 'Historial', icon: 'history', path: '/cashier-history' },
      ],
    },
    {
      groupLabel: 'COMPRAS',
      items: [
        { label: 'Facturas de Compra', icon: 'receipt', path: '/supplier-invoices' },
        { label: 'Cuentas por Pagar', icon: 'account_balance_wallet', path: '/accounts-payable' },
      ],
    },
  ];

  const kitchenNav: NavGroup[] = [
    {
      groupLabel: 'COCINA',
      items: [
        { label: 'Cocina', icon: 'soup_kitchen', path: '/kitchen' },
        { label: 'Recetario', icon: 'menu_book', path: '/kitchen/recipes' },
        { label: 'Solicitar Insumos', icon: 'shopping_cart', path: '/kitchen/purchase-requests' },
        { label: 'Reportar Merma', icon: 'report_problem', path: '/kitchen/waste' },
        { label: 'Historial', icon: 'history', path: '/kitchen-history' },
      ],
    },
  ];

  const roleNav: Record<UserRole, NavGroup[]> = {
    [UserRole.SUPERADMIN]: superadminNav,
    [UserRole.ADMIN]: adminNav,
    [UserRole.WAITER]: waiterNav,
    [UserRole.CASHIER]: cashierNav,
    [UserRole.KITCHEN]: kitchenNav,
  };

  let activeGroups = (user.role === UserRole.SUPERADMIN && isSupportMode) ? adminNav : (roleNav[user.role] ?? []);

  // ─── DYNAMIC NAVIGATION FILTERING ──────────────────────────────────────────
  const restrictedPaths: string[] = [];

  // Hide based on specific feature availability
  if (!isFeatureEnabled(planData, 'ENABLE_COST_SNAPSHOT_AT_SALE')) restrictedPaths.push('/inventory-batches');
  if (!isFeatureEnabled(planData, 'ENABLE_DAILY_FINANCIAL_SNAPSHOT')) restrictedPaths.push('/snapshots');
  if (!isFeatureEnabled(planData, 'ENABLE_ACCOUNTING_PERIOD_LOCK')) restrictedPaths.push('/period-locks');
  if (!isFeatureEnabled(planData, 'ENABLE_AUDIT_LOGS')) restrictedPaths.push('/audit');

  // Additional restrictions for Plan Operativo (Plan 1)
  if (isPlanOperativo && user.role === UserRole.ADMIN) {
    restrictedPaths.push(
      '/purchase-requests',
      '/suppliers',
      '/supplier-invoices',
      '/accounts-payable'
    );
  }

  if (user.role === UserRole.ADMIN) {
    activeGroups = activeGroups.map(group => ({
      ...group,
      items: group.items.filter(item => !restrictedPaths.includes(item.path))
    })).filter(group => group.items.length > 0);
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium rounded-[7px] transition-colors duration-150 ${isActive
      ? 'bg-[#136dec] text-white'
      : 'text-white/55 hover:bg-white/[0.07] hover:text-white/90'
    }`;

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 xl:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 w-64 bg-[#0f172a] text-white flex flex-col shrink-0 z-50 border-r border-white/5
        transition-transform duration-300 transform 
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        xl:relative xl:translate-x-0 xl:flex xl:w-60
      `}>
        {/* Logo & Close Button */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[7px] bg-[#136dec] flex items-center justify-center font-bold text-sm shadow-md ring-1 ring-white/20">C</div>
            <div>
              <span className="text-sm font-semibold tracking-tight text-white">
                {user.role === UserRole.SUPERADMIN ? 'RESTOGESTIÓN' : (user.restaurantName || 'RESTOGESTIÓN')}
              </span>
              <span className="block text-[10px] text-white/40 font-medium whitespace-nowrap">
                {user.role === UserRole.SUPERADMIN ? 'V2.0 ERP' : 'RESTOGESTIÓN V2.0'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="xl:hidden p-1 rounded-md text-white/40 hover:text-white/90 hover:bg-white/[0.05]"
          >
            <span className="material-icons-round text-[20px]">close</span>
          </button>
        </div>

        {/* Branch Switcher - Only for PRO Plan (indexed by ENABLE_AUDIT_LOGS) */}
        {isFeatureEnabled(planData, 'ENABLE_AUDIT_LOGS') && (user.role === UserRole.ADMIN || isSupportMode) && branches.length > 0 && onBranchChange && (
          <div className="px-3 pt-3 pb-1">
            <label className="text-[10px] text-white/35 font-semibold uppercase tracking-[0.12em] mb-1 block">Sucursal</label>
            <div className="relative">
              <select
                value={currentBranchId || ''}
                onChange={(e) => onBranchChange && onBranchChange(e.target.value)}
                className="w-full bg-white/[0.06] text-white/85 border border-white/[0.08] rounded-[7px] pl-3 pr-7 py-1.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#136dec]/60 appearance-none cursor-pointer transition-all hover:bg-white/[0.10]"
              >
                <option value="GLOBAL" className="text-slate-900 font-bold">🌍 Modo Global</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id} className="text-slate-900">
                    {b.name} {b.isActive ? '' : '(Inactiva)'}
                  </option>
                ))}
              </select>
              <span className="material-icons-round absolute right-2 top-[6px] text-white/30 pointer-events-none text-[15px]">unfold_more</span>
            </div>
          </div>
        )}

        {/* Navigation Groups */}
        <nav className="flex-1 py-2 px-2 overflow-y-auto no-scrollbar space-y-3">
          {activeGroups.map((group) => (
            <div key={group.groupLabel}>
              <p className="px-3 text-[9px] font-bold text-white/25 uppercase tracking-[0.14em] mb-1">{group.groupLabel}</p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink key={item.path} to={item.path} className={linkClass}>
                    <span className="material-icons-round text-[17px] opacity-80">{item.icon}</span>
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}

        </nav>

        {/* Support Mode Exit */}
        {isSupportMode && onExitSupport && (
          <div className="px-3 py-4 border-t border-white/[0.06] bg-amber-500/10">
            <button
              onClick={onExitSupport}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-all"
            >
              <span className="material-icons-round text-sm">exit_to_app</span>
              Salir de Soporte
            </button>
          </div>
        )}

        {/* User Footer */}
        <div className="p-2.5 border-t border-white/[0.06]">
          <div
            className="flex items-center gap-2.5 p-2 rounded-[7px] hover:bg-white/[0.07] transition-colors cursor-pointer group"
            onClick={onLogout}
          >
            <div className="relative shrink-0">
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=136dec&color=fff&bold=true&size=64`}
                alt="Perfil"
                className="h-7 w-7 rounded-[7px] object-cover"
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-[#16a34a] border-[1.5px] border-[#0f172a] rounded-full"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white/90 truncate leading-tight">{user.name}</p>
              <div className="flex flex-col gap-0.5 mt-0.5">
                <p className="text-[10px] text-white/35 truncate">
                  {branches.find(b => b.id === currentBranchId)?.name || 'Modo Global'}
                </p>
                {planData?.endsAt && (
                  <p className="text-[9px] font-black text-amber-500/80 uppercase tracking-tight flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500/50 animate-pulse" />
                    {Math.ceil((new Date(planData.endsAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} días restantes
                  </p>
                )}
              </div>
            </div>
            <span className="material-icons-round text-[15px] text-white/25 group-hover:text-white/70 transition-colors">logout</span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
