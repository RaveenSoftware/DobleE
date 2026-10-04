import {
  GranizadoProduct,
  Flavor,
  Topping,
  Customer,
  Order,
  Reward,
  Expense,
  BusinessConfig,
  StaffMember,
  TableItem,
  InventoryItem,
  BranchBusiness,
} from '../types';

// ─────────────────────────────────────────────────────────────────
// NOTA: Productos, Toppings y Órdenes vienen del backend (PostgreSQL)
// NO hay datos estáticos de usuarios, productos ni credenciales aquí.
// ─────────────────────────────────────────────────────────────────

export const initialConfig: BusinessConfig = {
  name: 'DobleE',
  currency: 'COP',
  currencySymbol: '$',
  phoneWhatsApp: '+57 312 456 7890',
  address: 'Calle del Sol # 45-21, Zona Gastronómica',
  pointsPerAmount: 100,
  pointsValueRate: 0.1,
  minPointsToRedeem: 200,
};

// Vendrán del backend — inicializan vacíos
export const initialProducts: GranizadoProduct[] = [];
export const initialToppings: Topping[] = [];
export const initialOrders: Order[] = [];
export const initialCustomers: Customer[] = [];

export const initialFlavors: Flavor[] = [];

export const sizeModifiers = {
  'Pequeño (12oz)': { price: 0, cost: 0 },
  'Mediano (16oz)': { price: 2000, cost: 700 },
  'Grande (24oz)': { price: 4000, cost: 1300 },
};

export const initialRewards: Reward[] = [];

export const initialExpenses: Expense[] = [];

export const initialStaff: StaffMember[] = [];

export const initialTables: TableItem[] = [];

export const initialInventory: InventoryItem[] = [];

export const initialBranches: BranchBusiness[] = [];
