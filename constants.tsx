
import { Ingredient, Plate, Table } from './types';

export const INITIAL_INGREDIENTS: Ingredient[] = [
  { id: '1', name: 'Tomates Roma', category: 'Vegetales', currentQty: 5400, unitPrice: 0.005, minQty: 1000, criticalQty: 500, icon: '🍅' },
  { id: '2', name: 'Queso Mozzarella', category: 'Lácteos', currentQty: 450, unitPrice: 0.012, minQty: 1000, criticalQty: 300, icon: '🧀' },
  { id: '3', name: 'Harina Tipo 00', category: 'Secos', currentQty: 2200, unitPrice: 0.003, minQty: 5000, criticalQty: 1000, icon: '🌾' },
  { id: '4', name: 'Hojas de Albahaca', category: 'Hierbas', currentQty: 350, unitPrice: 0.045, minQty: 500, criticalQty: 100, icon: '🥬' },
  { id: '5', name: 'Prosciutto', category: 'Carnes', currentQty: 1100, unitPrice: 0.080, minQty: 500, criticalQty: 200, icon: '🥩' },
];

export const INITIAL_PLATES: Plate[] = [
  { 
    id: 'p1', 
    name: 'Carbonara con Trufa', 
    category: 'Fuertes', 
    sellingPrice: 24.0, 
    status: 'active',
    image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?q=80&w=400&auto=format&fit=crop',
    ingredients: [
      { ingredientId: '3', qty: 150 },
      { ingredientId: '5', qty: 50 }
    ] 
  },
  { 
    id: 'p2', 
    name: 'Hamburguesa Wagyu', 
    category: 'Fuertes', 
    sellingPrice: 22.0, 
    status: 'active',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=400&auto=format&fit=crop',
    ingredients: [
      { ingredientId: '5', qty: 200 }
    ] 
  },
  { 
    id: 'p3', 
    name: 'Pizza Margherita', 
    category: 'Pizza', 
    sellingPrice: 16.0, 
    status: 'active',
    image: 'https://images.unsplash.com/photo-1574071318508-1cdbad80ad50?q=80&w=400&auto=format&fit=crop',
    ingredients: [
      { ingredientId: '3', qty: 250 },
      { ingredientId: '1', qty: 100 },
      { ingredientId: '2', qty: 120 }
    ] 
  }
];

export const INITIAL_TABLES: Table[] = [
  { id: 'M-01', seats: 4, status: 'available' },
  { id: 'M-02', seats: 2, status: 'occupied', currentOrderId: 'o1' },
  { id: 'M-03', seats: 4, status: 'billing', currentOrderId: 'o2' },
  { id: 'M-04', seats: 6, status: 'available' },
  { id: 'M-05', seats: 4, status: 'occupied', currentOrderId: 'o3' },
  { id: 'M-06', seats: 2, status: 'reserved' },
];
