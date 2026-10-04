export type AppRole = 'superadmin' | 'admin' | 'mesero';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  avatar?: string;
  staffId?: string;
  branchId?: string | null;
  branchName?: string;
  loginTime?: string;
}

export type CategoryType = 'Frutales' | 'Cremosos' | 'Cítricos & Chamoy' | 'Especiales' | string;

export type CupSize = 'Pequeño (12oz)' | 'Mediano (16oz)' | 'Grande (24oz)';

export interface SizeOption {
  size: CupSize;
  priceModifier: number; // added to base price
  costModifier: number;
}

export interface GranizadoProduct {
  id: string;
  name: string;
  category: CategoryType;
  description: string;
  basePrice: number;      // precio base (tamaño Mediano)
  baseCost: number;       // costo base (tamaño Mediano)
  image: string;
  isPopular?: boolean;
  isAvailable: boolean;
  defaultFlavors: string[];
  allowedToppingIds?: string[];  // toppings habilitados para este producto (undefined = todos)
  sizePrices?: {                 // precios/costos por tamaño
    small?: { price: number; cost: number };
    large?: { price: number; cost: number };
  };
  pointsEarned?: number;
  pointsDiscountApplicable?: boolean;
}

export interface Flavor {
  id: string;
  name: string;
  color: string;
  category: 'Frutas' | 'Cremosos' | 'Especiales';
  inStock: boolean;
}

export interface Topping {
  id: string;
  name: string;
  category: 'Salsas' | 'Fruta picada' | 'Gomitas & Dulces' | 'Crocante & Lácteos';
  price: number;
  cost: number;
  inStock: boolean;
}

export interface CustomOrderItem {
  id: string;
  productId: string;
  productName: string;
  size: CupSize;
  flavors: string[];
  sweetness: 'Bajo' | 'Medio' | 'Normal';
  toppings: { id: string; name: string; price: number; cost: number }[];
  notes?: string;
  unitPrice: number;
  unitCost: number;
  quantity: number;
  totalPrice: number;
}

export type CustomerTier = 'Bronce' | 'Plata' | 'Oro' | 'Diamante';

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone: string;
  points: number;
  lifetimePoints: number;
  totalSpent: number;
  ordersCount: number;
  tier: CustomerTier;
  createdAt: string;
  lastOrderDate?: string;
}

export type OrderStatus = 'Pendiente' | 'En preparación' | 'Listo' | 'Entregado' | 'Cancelado';
export type PaymentMethod = 'Efectivo' | 'Transferencia (Nequi/Daviplata)' | 'Tarjeta de Crédito/Débito';

export interface Order {
  id: string;
  orderNumber: number;
  createdAt: string;
  customerType: 'guest' | 'registered';
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  tableName?: string;
  waiterId?: string;
  waiterName?: string;
  items: CustomOrderItem[];
  subtotal: number;
  discount: number;
  discountReason?: string;
  pointsUsed: number;
  pointsEarned: number;
  total: number;
  totalCost: number;
  netProfit: number;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  channel: 'Punto de Venta (POS)' | 'Comanda Mesero' | 'Web / Pedido Online';
  notes?: string;
}

export interface Reward {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  discountAmount: number; // In currency
  minOrderValue: number;
  iconName: string;
  rewardType?: 'discount_amount' | 'free_product' | 'percentage';
  applicableProductIds?: string[]; // IDs of products to which this applies, or empty for all
  targetProductId?: string; // If free product
}

export interface Expense {
  id: string;
  date: string;
  category: 'Insumos & Frutas' | 'Vasos & Empaques' | 'Hielo & Jarabes' | 'Servicios & Local' | 'Otros';
  description: string;
  amount: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'Hielo & Agua' | 'Pulpas de Fruta' | 'Vasos & Empaques' | 'Salsas & Dulces' | 'Lácteos & Café';
  currentStock: number;
  minAlertStock: number;
  unit: 'kg' | 'litros' | 'paquetes (50u)' | 'unidades' | 'latas';
  costPerUnit: number;
  lastRestocked: string;
}

export interface StaffMember {
  id: string;
  name: string;
  role: 'Mesero' | 'Encargado de Barra' | 'Cajero';
  phone: string;
  pin: string;
  active: boolean;
  totalOrders: number;
  totalSales: number;
  shiftActive?: boolean;
  shiftStartTime?: string;
  tipsEarned?: number;
}

export type TableArea = 'Salón Principal' | 'Terraza Exterior' | 'Barra' | 'Zona VIP' | string;
export type TableStatus = 'libre' | 'ocupada' | 'cuenta' | 'reservada';
export type TableShape = 'cuadrada' | 'redonda' | 'rectangular';

export interface TableItem {
  id: string;
  name: string;
  area: TableArea;
  capacity: number;
  status: TableStatus;
  shape?: TableShape;
  currentOrderId?: string;
  activeWaiter?: string;
  notes?: string;
  orderTotal?: number;
  occupiedSince?: string;
  isHidden?: boolean;
}

export interface BranchBusiness {
  id: string;
  name: string;
  city: string;
  ownerName: string;
  ownerEmail: string;
  phone: string;
  plan: 'Emprendedor Starter' | 'Pro Negocio' | 'Enterprise Multi-Local';
  status: 'Activo' | 'Demo' | 'Vencido';
  monthlySales: number;
  ordersMonth: number;
  activeWaiters: number;
  joinedAt: string;
}

export interface BusinessConfig {
  name: string;
  currency: string;
  currencySymbol: string;
  phoneWhatsApp: string;
  address: string;
  pointsPerAmount: number; // e.g., 1 point per $100 currency or 1 point per $1
  pointsValueRate: number; // e.g., 100 points = $10 discount
  minPointsToRedeem: number;
  taxRatePercent?: number;
  logoUrl?: string;
  customCategories?: string[];
}

export interface CashShift {
  isOpen: boolean;
  openedAt?: string;
  initialAmount: number; // Base con la que se abre caja
  openedBy?: string;
  closedAt?: string;
  expectedAmount?: number;
  countedAmount?: number;
  difference?: number;
  closedBy?: string;
  notes?: string;
}
