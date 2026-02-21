
export enum UserRole {
  ADMIN = 'admin',
  WAITER = 'waiter',
  CASHIER = 'cashier',
  KITCHEN = 'kitchen'
}

export interface User {
  id: string;
  name: string;
  email?: string;
  username?: string;
  role: UserRole;
  pin?: string;
  branchId?: string;
  branchName?: string; // Hydrated
  restaurantId?: string; // New
  isActive?: boolean;
  lastLogin?: string;
}

export interface ActivityLog {
  id: string;
  user_id: string; // matches DB column
  user_name?: string; // hydrated
  action: string;
  module: string;
  reference_id?: string;
  details?: any;
  created_at: string;
}

export interface Ingredient {
  id: string;
  name: string;
  category: string;
  currentQty: number; // in grams
  unitPrice: number; // per gram
  minQty: number;
  criticalQty: number;
  icon: string;
  description?: string;
  measureUnit?: 'gr' | 'ml';
}

export interface PlateIngredient {
  ingredientId: string;
  qty: number; // grams
}

export interface Plate {
  id: string;
  name: string;
  category: string;
  sellingPrice: number;
  ingredients: PlateIngredient[];
  status: 'active' | 'inactive';
  image: string;
}

export interface OrderItem {
  plateId: string;
  qty: number;
  notes?: string;
  costAtSale?: number; // Snapshot of production cost at time of sale
}

export interface Order {
  id: string;
  tableId: string;
  items: OrderItem[];
  status: 'pending' | 'open' | 'preparing' | 'ready' | 'delivered' | 'served' | 'billing' | 'paid' | 'cancelled';
  total: number;
  timestamp: Date;
  waiterId?: string;
  waiterName?: string;
  paymentMethod?: 'cash' | 'card' | 'transfer';
  readyAt?: string | Date;
  servedAt?: string | Date;
  servedBy?: string;
  branchId?: string;
  shiftId?: string;
  cashierId?: string;
  optimistic?: boolean;
}

export interface Table {
  id?: string;
  label: string;
  seats: number;
  status: 'available' | 'occupied' | 'reserved' | 'billing' | 'preparing' | 'ready';
  currentOrderId?: string;
  branchId?: string;
}

export interface Expense {
  id: string;
  branchId?: string;
  date: string; // YYYY-MM-DD
  category: string;
  subcategory?: string;
  amount: number;
  type: 'fixed' | 'variable' | 'semi-variable' | 'extraordinary';
  description?: string;
  paymentMethod?: string;
  isRecurrent?: boolean;
  recurrenceFreq?: string;
  receiptUrl?: string; // or file path
  shiftId?: string;
}

export interface WasteRecord {
  id: string;
  ingredientId: string;
  quantity: number;
  unit: string;
  costAtTime: number;
  totalCost: number;
  reason: 'damaged' | 'expired' | 'kitchen_error' | 'adjustment' | 'other';
  notes?: string;
  userId?: string;
  userName?: string; // hydrated
  branchId?: string;
  created_at: string;
}

export interface CashierShift {
  id: string;
  branchId: string;
  cashierId: string;
  openingCash: number;
  expectedCash: number;
  closingCash?: number;
  cashDifference?: number;
  totalCashSales: number;
  totalCardSales: number;
  totalExpenses: number;
  openedAt: string;
  closedAt?: string;
  status: 'open' | 'closed';
}

export interface Branch {
  id: string;
  restaurantId: string;
  name: string;
  address?: string;
  phone?: string;
  isActive: boolean;
  isMain?: boolean;
  status?: 'active' | 'inactive';
}

export interface CompanyProfile {
  id: string;
  restaurantId: string;
  businessName: string;
  ruc?: string;
  legalRepresentative?: string;
  phone?: string;
  email?: string;
  mainAddress?: string;
  createdAt?: string;
}

export interface Supplier {
  id: string;
  restaurant_id: string;
  name: string;
  contact_name?: string;
  phone?: string;
  email?: string;
  notes?: string;
  status: 'active' | 'inactive';
}

export interface CashSession {
  id: string;
  restaurantId: string;
  branchId: string;
  openedBy: string;
  openedAt: Date;
  initialCash: number;
  status: 'open' | 'closed';
  closedAt?: Date;
  closedBy?: string;
  expectedCash?: number;
  actualCash?: number;
  difference?: number;
  notes?: string;
}

export interface DailyFinancialSnapshot {
  id: string;
  branchId: string;
  snapshotDate: string;
  cashSessionId: string;
  totalSales: number;
  totalCogs: number;
  totalExpenses: number;
  totalWasteCost: number;
  grossProfit: number;
  netProfit: number;
  inventoryValue: number;
  createdAt: string;
  // joined
  branchName?: string;
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  ingredient_id: string;
  ingredient_name?: string;
  ingredient_icon?: string;
  quantity_requested: number;
  quantity_received: number;
  expected_unit_cost: number;
  actual_unit_cost: number | null;
  status: 'pending' | 'received';
  created_at: string;
  // UI state
  receiveMode?: boolean;
}

export interface PurchaseOrder {
  id: string;
  branch_id: string;
  supplier_id: string | null;
  supplier_name?: string;
  created_by: string;
  creator_name?: string;
  status: 'pending' | 'approved' | 'received' | 'cancelled';
  notes: string | null;
  created_at: string;
  updated_at: string;
  items?: PurchaseOrderItem[];
}
