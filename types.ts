
export enum UserRole {
  ADMIN = 'admin',
  WAITER = 'waiter',
  CASHIER = 'cashier',
  KITCHEN = 'kitchen'
}

export interface User {
  id: string;
  name: string;
  username?: string;
  role: UserRole;
  pin?: string;
  branchId?: string;
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
}

export interface Order {
  id: string;
  tableId: string;
  items: OrderItem[];
  status: 'pending' | 'open' | 'preparing' | 'ready' | 'delivered' | 'billing' | 'paid' | 'cancelled';
  total: number;
  timestamp: Date;
  waiterId?: string;
  waiterName?: string;
  paymentMethod?: 'cash' | 'card' | 'transfer';
  readyAt?: string | Date;
  servedAt?: string | Date;
  servedBy?: string;
}

export interface Table {
  id?: string;
  label: string;
  seats: number;
  status: 'available' | 'occupied' | 'reserved' | 'billing';
  currentOrderId?: string;
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
}
