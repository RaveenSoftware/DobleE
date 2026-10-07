import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  GranizadoProduct,
  Flavor,
  Topping,
  Customer,
  Order,
  Reward,
  Expense,
  BusinessConfig,
  CustomOrderItem,
  OrderStatus,
  CustomerTier,
  AppRole,
  AuthUser,
  StaffMember,
  TableItem,
  InventoryItem,
  BranchBusiness,
  CashShift,
} from '../types';
import {
  initialConfig,
  initialFlavors,
  initialCustomers,
  initialRewards,
  initialExpenses,
  initialStaff,
  initialTables,
  initialInventory,
  initialProducts,
  initialToppings,
  initialOrders,
  initialBranches,
} from '../data/initialData';
import * as api from '../services/api';

export type AdminModuleTab =
  | 'dashboard'
  | 'pos'
  | 'orders'
  | 'tables'
  | 'catalog'
  | 'menu_qr'
  | 'finances'
  | 'inventory'
  | 'users'
  | 'staff'
  | 'loyalty'
  | 'expenses'
  | 'settings'
  | 'audit';

interface AppContextType {
  // Authentication & Credentials Separation
  currentUser: AuthUser | null;
  login: (params: {
    role?: AppRole;
    email?: string;
    password?: string;
    pin?: string;
    staffId?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;

  // Role & Perspective (derived from currentUser or synced)
  currentRole: AppRole;
  setCurrentRole: (role: AppRole) => void;

  // Business Configuration
  config: BusinessConfig;
  updateConfig: (newConfig: Partial<BusinessConfig>) => void;

  // Products & Menu
  products: GranizadoProduct[];
  flavors: Flavor[];
  toppings: Topping[];

  // Customers & Loyalty
  customers: Customer[];
  rewards: Reward[];

  // Orders & Sales
  orders: Order[];
  expenses: Expense[];

  // Cash Register Shift Management (Apertura y Cierre de Caja)
  cashShift: CashShift;
  openCashShift: (initialAmount: number, cashierName?: string, notes?: string) => Promise<void>;
  closeCashShift: (countedAmount: number, cashierName?: string, notes?: string) => Promise<CashShift | undefined>;
  clearStaticTestData: () => void;

  // Operations & Staff
  staff: StaffMember[];
  activeWaiter: StaffMember | null;
  setActiveWaiter: (waiter: StaffMember | null) => void;
  tables: TableItem[];
  inventory: InventoryItem[];

  // Super Admin Franchises/Branches
  branches: BranchBusiness[];
  selectedBranchId: string;
  setSelectedBranchId: (id: string) => void;

  // Admin Navigation Subtabs
  adminSubTab: AdminModuleTab;
  setAdminSubTab: (tab: AdminModuleTab) => void;

  // Shopping Cart & Mesero Order building
  cart: CustomOrderItem[];
  addToCart: (item: CustomOrderItem) => void;
  removeFromCart: (itemId: string) => void;
  updateCartItemQty: (itemId: string, delta: number) => void;
  clearCart: () => void;
  appliedReward: Reward | null;
  setAppliedReward: (reward: Reward | null) => void;

  // Customer in Session (Loyalty or Lookup)
  activeCustomer: Customer | null;
  setActiveCustomer: (customer: Customer | null) => void;
  loginOrRegisterCustomer: (name: string, phone: string, email?: string) => Promise<Customer>;
  logoutCustomer: () => void;

  // Order Operations
  createOrder: (orderData: {
    customerType: 'guest' | 'registered';
    customerId?: string;
    customerName: string;
    customerPhone?: string;
    tableName?: string;
    waiterId?: string;
    waiterName?: string;
    items: CustomOrderItem[];
    paymentMethod: Order['paymentMethod'];
    channel: Order['channel'];
    notes?: string;
    appliedReward?: Reward | null;
  }) => Order;
  updateOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
  assignOrderToTable: (orderId: string, tableName: string) => void;
  cancelOrder: (orderId: string) => void;
  latestCreatedOrder: Order | null;
  setLatestCreatedOrder: (order: Order | null) => void;

  // Catalog & Inventory Operations
  addProduct: (product: Omit<GranizadoProduct, 'id'>) => void;
  updateProduct: (id: string, updates: Partial<GranizadoProduct>) => void;
  deleteProduct: (id: string) => void;
  toggleProductStock: (id: string) => void;
  addTopping: (topping: Omit<Topping, 'id'>) => void;
  updateTopping: (id: string, updates: Partial<Topping>) => void;
  toggleToppingStock: (id: string) => void;
  addFlavor: (flavor: Omit<Flavor, 'id'>) => void;
  toggleFlavorStock: (id: string) => void;

  // Inventory Management
  updateInventoryStock: (id: string, delta: number) => void;
  addInventoryItem: (item: Omit<InventoryItem, 'id' | 'lastRestocked'>) => void;

  // Tables Management
  updateTableStatus: (tableId: string, status: TableItem['status'], orderId?: string) => void;
  addTable: (table: Omit<TableItem, 'id'>) => void;
  updateTable: (id: string, updates: Partial<TableItem>) => void;
  deleteTable: (id: string) => void;

  // Staff Management
  addStaffMember: (member: Omit<StaffMember, 'id' | 'totalOrders' | 'totalSales'>) => void;
  updateStaffMember: (id: string, updates: Partial<StaffMember>) => void;
  toggleStaffShift: (staffId: string) => void;

  // Reward Management
  addReward: (reward: Omit<Reward, 'id'>) => void;
  updateReward: (id: string, updates: Partial<Reward>) => void;
  deleteReward: (id: string) => void;

  // Expenses Operations
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  deleteExpense: (id: string) => void;

  // Customer Management
  adjustCustomerPoints: (customerId: string, pointDiff: number, reason?: string) => void;

  // Data Reset & Export
  exportDataJson: () => string;
  importDataJson: (jsonStr: string) => boolean;
  resetAllData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Business config first so login can access name
  const [config, setConfig] = useState<BusinessConfig>(() => {
    const saved = localStorage.getItem('granizados_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.name || parsed.name === 'Granizados Oasis' || parsed.name === 'GranizArt') {
          parsed.name = 'DobleE';
        }
        return parsed;
      } catch {
        return initialConfig;
      }
    }
    return initialConfig;
  });

  // Staff state needed for waiter PIN authentication
  const [staff, setStaff] = useState<StaffMember[]>(() => {
    const saved = localStorage.getItem('granizados_staff');
    return saved ? JSON.parse(saved) : initialStaff;
  });

  // Current authenticated user (separated credentials)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('granizados_auth_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.name === 'Patricia Arango') {
          parsed.name = 'Administrador';
          localStorage.setItem('granizados_auth_user', JSON.stringify(parsed));
        }
        return parsed;
      } catch {
        return null;
      }
    }
    return null;
  });

  const [activeWaiter, setActiveWaiter] = useState<StaffMember | null>(() => {
    const saved = localStorage.getItem('granizados_auth_user');
    if (saved) {
      try {
        const u = JSON.parse(saved);
        if (u.role === 'mesero' && u.staffId) {
          const match = initialStaff.find(s => s.id === u.staffId);
          return match || initialStaff[0];
        }
      } catch {
        return null;
      }
    }
    return null;
  });

  // Current role derived from currentUser or fallback
  const currentRole: AppRole = currentUser?.role || 'admin';
  const setCurrentRole = (role: AppRole) => {
    if (currentUser) {
      const updated = { ...currentUser, role };
      setCurrentUser(updated);
      localStorage.setItem('granizados_auth_user', JSON.stringify(updated));
    }
  };

  const login = async ({
    role,
    email,
    password,
    pin,
    staffId,
  }: {
    role?: AppRole;
    email?: string;
    password?: string;
    pin?: string;
    staffId?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      if (email && password) {
        const data = await api.apiLogin(email, password);
        const user: AuthUser = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role as AppRole,
          branchId: data.user.branchId || null,
          branchName: config.name || 'DobleE',
          loginTime: new Date().toISOString(),
        };
        setCurrentUser(user);
        localStorage.setItem('granizados_auth_user', JSON.stringify(user));
        
        const roleStr = user.role.toLowerCase().trim();
        if (['cajero', 'caja'].includes(roleStr)) {
          setAdminSubTab('pos');
        } else {
          setAdminSubTab('dashboard');
        }

        return { success: true };
      }
      
      // Fallback for PIN (mock for now, could be added to backend)
      if (role === 'mesero' && pin) {
        const found = staff.find(s => s.pin === pin && s.active);
        if (found) {
          const user: AuthUser = {
            id: found.id,
            name: found.name,
            email: `${found.name.toLowerCase().replace(/\s+/g, '.')}@doblee.com`,
            role: 'mesero',
            staffId: found.id,
            branchName: config.name || 'DobleE',
            loginTime: new Date().toISOString(),
          };
          setCurrentUser(user);
          setActiveWaiter(found);
          localStorage.setItem('granizados_auth_user', JSON.stringify(user));
          return { success: true };
        }
        return { success: false, error: 'PIN incorrecto' };
      }

      return { success: false, error: 'Faltan credenciales' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error al iniciar sesión' };
    }
  };

  const logout = () => {
    api.apiLogout();
    setCurrentUser(null);
    localStorage.removeItem('granizados_auth_user');
    setActiveWaiter(null);
  };

  const [adminSubTab, setAdminSubTab] = useState<AdminModuleTab>(() => {
    try {
      const stored = localStorage.getItem('granizados_auth_user');
      if (stored) {
        const user = JSON.parse(stored) as AuthUser;
        const role = user?.role?.toLowerCase()?.trim() || '';
        if (['cajero', 'caja'].includes(role)) return 'pos';
      }
    } catch {}
    return 'dashboard';
  });

  const [products, setProducts] = useState<GranizadoProduct[]>([]);
  const [flavors, setFlavors] = useState<Flavor[]>([]);
  const [toppings, setToppings] = useState<Topping[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [tables, setTables] = useState<TableItem[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [cashShift, setCashShift] = useState<CashShift>({ isOpen: false, initialAmount: 0 });
  const [branches] = useState<BranchBusiness[]>(initialBranches);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('branch-1');

  // UI state for order builder & cart
  const [cart, setCart] = useState<CustomOrderItem[]>([]);
  const [appliedReward, setAppliedReward] = useState<Reward | null>(null);
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);
  const [latestCreatedOrder, setLatestCreatedOrder] = useState<Order | null>(null);

  // Config still persisted locally (cosmetic user preferences)
  useEffect(() => {
    localStorage.setItem('granizados_config', JSON.stringify(config));
  }, [config]);

  // Cleanup handled by server, no localStorage wipe needed

  // Fetch ALL data from API — always scoped to branchId
  useEffect(() => {
    const branchId = currentUser?.branchId || undefined;

    const fetchAllData = () => {
      api.apiGetProducts(branchId).then(data => setProducts(data.map((p: any) => ({ ...p, defaultFlavors: p.flavors || [] })))).catch(console.error);
      api.apiGetToppings(branchId).then(setToppings).catch(console.error);
      api.apiGetFlavors(branchId).then(setFlavors).catch(console.error);

      if (currentUser) {
        api.apiGetOrders(branchId).then(data => setOrders(data.map((o: any) => ({ ...o, items: typeof o.items === 'string' ? JSON.parse(o.items) : o.items })))).catch((e) => {
          // If 401, token expired — auto logout
          if (e.message?.includes('autorizado') || e.message?.includes('Token')) {
            logout();
          }
        });
        api.apiGetCustomers(branchId).then(setCustomers).catch(console.error);
        api.apiGetStaff(branchId).then(setStaff).catch(console.error);
        api.apiGetTables(branchId).then(setTables).catch(console.error);
        api.apiGetExpenses(branchId).then(setExpenses).catch(console.error);
        api.apiGetInventory(branchId).then(setInventory).catch(console.error);
        api.apiGetRewards(branchId).then(setRewards).catch(console.error);
        // Always try to fetch active cash shift — backend resolves branchId from JWT
        api.apiGetActiveCashShift(branchId || '').then(shift => {
          if (shift && shift.isOpen !== undefined) {
            setCashShift(prev => {
              if (prev.isOpen === shift.isOpen && prev.initialAmount === shift.initialAmount && prev.openedAt === shift.openedAt) return prev;
              return { isOpen: shift.isOpen, initialAmount: shift.initialAmount, openedAt: shift.openedAt, openedBy: shift.openedBy, notes: shift.notes };
            });
          }
        }).catch(console.error);
      }
    };

    fetchAllData();
    const intervalId = setInterval(fetchAllData, 10000); // Auto-refresh every 10 segundos

    return () => clearInterval(intervalId);
  }, [currentUser]);

  const updateConfig = (newConfig: Partial<BusinessConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  // Cart actions
  const addToCart = (item: CustomOrderItem) => {
    setCart(prev => {
      const existing = prev.find(
        i =>
          i.productId === item.productId &&
          i.size === item.size &&
          i.flavors.sort().join(',') === item.flavors.sort().join(',') &&
          i.toppings.map(t => t.id).sort().join(',') === item.toppings.map(t => t.id).sort().join(',') &&
          i.sweetness === item.sweetness
      );

      if (existing) {
        return prev.map(i =>
          i.id === existing.id
            ? {
                ...i,
                quantity: i.quantity + item.quantity,
                totalPrice: (i.quantity + item.quantity) * i.unitPrice,
              }
            : i
        );
      }
      return [...prev, item];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(i => i.id !== itemId));
  };

  const updateCartItemQty = (itemId: string, delta: number) => {
    setCart(prev =>
      prev
        .map(i => {
          if (i.id === itemId) {
            const newQty = i.quantity + delta;
            return newQty > 0
              ? { ...i, quantity: newQty, totalPrice: newQty * i.unitPrice }
              : null;
          }
          return i;
        })
        .filter(Boolean) as CustomOrderItem[]
    );
  };

  const clearCart = () => {
    setCart([]);
    setAppliedReward(null);
  };

  // Customer Management
  const calculateTier = (points: number): CustomerTier => {
    if (points >= 2000) return 'Diamante';
    if (points >= 1000) return 'Oro';
    if (points >= 500) return 'Plata';
    return 'Bronce';
  };

  const loginOrRegisterCustomer = async (name: string, phone: string, email?: string): Promise<Customer> => {
    const cleanPhone = phone.trim().replace(/\D/g, '');
    const existing = customers.find(c => c.phone.replace(/\D/g, '') === cleanPhone);

    if (existing) {
      const updated = {
        ...existing,
        name: name.trim() || existing.name,
        email: email?.trim() || existing.email,
      };
      
      try {
        await api.apiUpdateCustomer(existing.id, { name: updated.name, email: updated.email });
      } catch (e) { console.error(e); }

      setCustomers(prev => prev.map(c => (c.id === existing.id ? updated : c)));
      setActiveCustomer(updated);
      return updated;
    }

    // New Customer
    const newCustPayload = {
      name: name.trim(),
      phone: phone.trim(),
      email: email?.trim() || '',
      points: 50, // Welcome bonus
      lifetimePoints: 50,
      totalSpent: 0,
      ordersCount: 0,
      tier: 'Bronce',
      branchId: currentUser?.branchId || selectedBranchId
    };

    try {
      const created = await api.apiCreateCustomer(newCustPayload);
      setCustomers(prev => [created, ...prev]);
      setActiveCustomer(created);
      return created;
    } catch (e) {
      console.error(e);
      // Fallback
      const fakeIdCust = { ...newCustPayload, id: `cust-${Date.now()}`, createdAt: new Date().toISOString() };
      setCustomers(prev => [fakeIdCust, ...prev]);
      setActiveCustomer(fakeIdCust);
      return fakeIdCust;
    }
  };

  const logoutCustomer = () => {
    setActiveCustomer(null);
    setAppliedReward(null);
  };

  // Order Placement
  const createOrder = (orderData: {
    customerType: 'guest' | 'registered';
    customerId?: string;
    customerName: string;
    customerPhone?: string;
    tableName?: string;
    waiterId?: string;
    waiterName?: string;
    items: CustomOrderItem[];
    paymentMethod: Order['paymentMethod'];
    channel: Order['channel'];
    notes?: string;
    appliedReward?: Reward | null;
  }): Order => {
    const subtotal = orderData.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const totalCost = orderData.items.reduce((sum, item) => sum + item.unitCost * item.quantity, 0);

    let discount = 0;
    let pointsUsed = 0;
    let discountReason: string | undefined = undefined;

    if (orderData.appliedReward) {
      discount = orderData.appliedReward.discountAmount;
      pointsUsed = orderData.appliedReward.pointsCost;
      discountReason = `Canje Club: ${orderData.appliedReward.title}`;
    }

    const total = Math.max(0, subtotal - discount);
    const netProfit = total - totalCost;

    const pointsEarned =
      orderData.customerType === 'registered'
        ? Math.floor(total / config.pointsPerAmount)
        : 0;

    const nextOrderNum =
      orders.length > 0 ? Math.max(...orders.map(o => o.orderNumber || 0)) + 1 : 104;

    const newOrder: Order = {
      id: `ORD-${nextOrderNum}`,
      orderNumber: nextOrderNum,
      createdAt: new Date().toISOString(),
      customerType: orderData.customerType,
      customerId: orderData.customerId,
      customerName: orderData.customerName,
      customerPhone: orderData.customerPhone,
      tableName: orderData.tableName,
      waiterId: orderData.waiterId,
      waiterName: orderData.waiterName,
      items: orderData.items,
      subtotal,
      discount,
      discountReason,
      pointsUsed,
      pointsEarned,
      total,
      totalCost,
      netProfit,
      paymentMethod: orderData.paymentMethod,
      status: 'Pendiente',
      channel: orderData.channel,
      notes: orderData.notes,
    };

    // Api call to save to postgres with ALL order fields
    api.apiCreateOrder({
      branchId: currentUser?.branchId || undefined,
      customerType: orderData.customerType,
      customerId: orderData.customerId,
      customerName: orderData.customerName,
      customerPhone: orderData.customerPhone,
      tableName: orderData.tableName,
      waiterId: orderData.waiterId,
      waiterName: orderData.waiterName,
      items: orderData.items,
      subtotal,
      discount,
      discountReason,
      pointsUsed,
      pointsEarned,
      total,
      totalCost,
      netProfit,
      paymentMethod: orderData.paymentMethod,
      channel: orderData.channel,
      notes: orderData.notes,
      status: 'Pendiente',
    }).then(createdOrder => {
      if (createdOrder && createdOrder.id) {
        setOrders(prev => prev.map(o => o.id === newOrder.id ? { ...o, ...createdOrder, items: typeof createdOrder.items === 'string' ? JSON.parse(createdOrder.items) : createdOrder.items } : o));
      }
    }).catch(console.error);

    // Update customer stats if registered
    if (orderData.customerId) {
      let finalPoints = 0;
      let finalLifetime = 0;
      let finalSpent = 0;
      let finalCount = 0;
      let finalTier: CustomerTier = 'Bronce';
      let finalLastOrderDate = new Date().toISOString().split('T')[0];
      
      setCustomers(prev =>
        prev.map(c => {
          if (c.id === orderData.customerId) {
            const newPoints = Math.max(0, c.points - pointsUsed + pointsEarned);
            const newLifetime = c.lifetimePoints + pointsEarned;
            const newSpent = c.totalSpent + total;
            const newCount = c.ordersCount + 1;
            
            finalPoints = newPoints;
            finalLifetime = newLifetime;
            finalSpent = newSpent;
            finalCount = newCount;
            finalTier = calculateTier(newLifetime);
            
            return {
              ...c,
              points: newPoints,
              lifetimePoints: newLifetime,
              totalSpent: newSpent,
              ordersCount: newCount,
              tier: finalTier,
              lastOrderDate: finalLastOrderDate,
            };
          }
          return c;
        })
      );

      if (activeCustomer && activeCustomer.id === orderData.customerId) {
        setActiveCustomer(prev => {
          if (!prev) return null;
          return {
            ...prev,
            points: finalPoints,
            lifetimePoints: finalLifetime,
            totalSpent: finalSpent,
            ordersCount: finalCount,
            tier: finalTier,
            lastOrderDate: finalLastOrderDate,
          };
        });
      }
      
      // Persist to backend
      if (!orderData.customerId.startsWith('cust-')) {
        api.apiUpdateCustomer(orderData.customerId, {
          points: finalPoints,
          lifetimePoints: finalLifetime,
          totalSpent: finalSpent,
          ordersCount: finalCount,
          tier: finalTier,
          lastOrderDate: finalLastOrderDate
        }).catch(console.error);
      }
    }

    // Update Waiter sales stats
    if (orderData.waiterId) {
      setStaff(prev =>
        prev.map(w =>
          w.id === orderData.waiterId
            ? {
                ...w,
                totalOrders: w.totalOrders + 1,
                totalSales: w.totalSales + total,
              }
            : w
        )
      );
    }

    // Update table status if set
    if (orderData.tableName) {
      setTables(prev =>
        prev.map(t =>
          t.name.toLowerCase() === orderData.tableName?.toLowerCase()
            ? { ...t, status: 'ocupada', currentOrderId: newOrder.id }
            : t
        )
      );
    }

    // Deduct rough inventory estimates
    setInventory(prev =>
      prev.map(inv => {
        if (inv.category === 'Hielo & Agua') {
          // ~0.35kg per drink
          const drinksCount = orderData.items.reduce((s, i) => s + i.quantity, 0);
          return { ...inv, currentStock: Math.max(0, inv.currentStock - drinksCount * 0.35) };
        }
        return inv;
      })
    );

    setOrders(prev => [newOrder, ...prev]);
    setLatestCreatedOrder(newOrder);
    clearCart();
    return newOrder;
  };

  const updateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    setOrders(prev =>
      prev.map(o => (o.id === orderId ? { ...o, status: newStatus } : o))
    );

    api.apiUpdateOrderStatus(orderId, newStatus).catch(console.error);

    // If delivered or canceled, free the table
    if (newStatus === 'Entregado' || newStatus === 'Cancelado') {
      const targetOrder = orders.find(o => o.id === orderId);
      if (targetOrder?.tableName) {
        setTables(prev =>
          prev.map(t =>
            t.name.toLowerCase() === targetOrder.tableName?.toLowerCase()
              ? { ...t, status: 'libre', currentOrderId: undefined }
              : t
          )
        );
      }
    }
  };

  const assignOrderToTable = (orderId: string, tableName: string) => {
    const targetOrder = orders.find(o => o.id === orderId);
    if (!targetOrder) return;

    const prevTableName = targetOrder.tableName;

    // Update order tableName
    setOrders(prev =>
      prev.map(o => (o.id === orderId ? { ...o, tableName: tableName || undefined } : o))
    );

    api.apiUpdateOrder(orderId, { tableName: tableName || null }).catch(console.error);

    // If assigning to a valid table
    if (tableName && tableName !== 'Sin mesa' && tableName !== 'none') {
      setTables(prev =>
        prev.map(t => {
          if (t.name.toLowerCase() === tableName.toLowerCase()) {
            return {
              ...t,
              status: 'ocupada' as const,
              currentOrderId: orderId,
              orderTotal: targetOrder.total,
            };
          }
          // If table previously held this order, free it
          if (prevTableName && t.name.toLowerCase() === prevTableName.toLowerCase() && t.currentOrderId === orderId) {
            return {
              ...t,
              status: 'libre' as const,
              currentOrderId: undefined,
              orderTotal: 0,
            };
          }
          return t;
        })
      );
    } else if (prevTableName) {
      // Unassigned from table
      setTables(prev =>
        prev.map(t =>
          t.name.toLowerCase() === prevTableName.toLowerCase() && t.currentOrderId === orderId
            ? { ...t, status: 'libre' as const, currentOrderId: undefined, orderTotal: 0 }
            : t
        )
      );
    }
  };

  const cancelOrder = (orderId: string) => {
    updateOrderStatus(orderId, 'Cancelado');
  };

  // Cash Register Shift Management (Apertura y Cierre de Caja con Base Inicial)
  const openCashShift = async (initialAmount: number, cashierName?: string, notes?: string) => {
    try {
      const shift = await api.apiOpenCashShift({ branchId: currentUser?.branchId, initialAmount, openedBy: cashierName || currentUser?.name || 'Admin', notes });
      setCashShift({ isOpen: true, initialAmount: shift.initialAmount, openedAt: shift.openedAt, openedBy: shift.openedBy, notes: shift.notes });
    } catch (e) { console.error(e); }
  };

  const closeCashShift = async (countedAmount: number, cashierName?: string, notes?: string) => {
    try {
      const closed = await api.apiCloseCashShift({ branchId: currentUser?.branchId, countedAmount, closedBy: cashierName || currentUser?.name || 'Admin', notes });
      setCashShift({ isOpen: false, initialAmount: closed.initialAmount, closedAt: closed.closedAt });
      return closed;
    } catch (e) { console.error(e); }
  };

  // Limpiar todos los datos estáticos de prueba para empezar de cero
  const clearStaticTestData = () => {
    setOrders([]);
    setExpenses([]);
    setTables(prev =>
      prev.map(t => ({
        ...t,
        status: 'libre' as const,
        orderTotal: 0,
        currentOrderId: undefined,
        activeWaiter: undefined,
        notes: undefined,
      }))
    );
    setCustomers(prev =>
      prev.map(c => ({
        ...c,
        points: 0,
        lifetimePoints: 0,
        totalSpent: 0,
        ordersCount: 0,
      }))
    );
    const closed: CashShift = { isOpen: false, initialAmount: 0 };
    setCashShift(closed);
    localStorage.removeItem('granizados_orders');
    localStorage.removeItem('granizados_expenses');
    localStorage.removeItem('granizados_cash_shift');
    localStorage.setItem(
      'granizados_tables',
      JSON.stringify(
        initialTables.map(t => ({
          ...t,
          status: 'libre',
          orderTotal: 0,
          currentOrderId: undefined,
          activeWaiter: undefined,
          notes: undefined,
        }))
      )
    );
  };

  // Catalog actions
  const addProduct = async (p: Omit<GranizadoProduct, 'id'>) => {
    try {
      const payload = { ...p, flavors: p.defaultFlavors, branchId: currentUser?.branchId || undefined };
      const newP = await api.apiCreateProduct(payload);
      setProducts(prev => [{ ...newP, defaultFlavors: newP.flavors || [] }, ...prev]);
    } catch (e) {
      console.error(e);
    }
  };

  const updateProduct = async (id: string, updates: Partial<GranizadoProduct>) => {
    try {
      const payload = { ...updates, flavors: updates.defaultFlavors };
      const updatedP = await api.apiUpdateProduct(id, payload);
      setProducts(prev => prev.map(p => (p.id === id ? { ...updatedP, defaultFlavors: updatedP.flavors || [] } : p)));
    } catch (e) {
      console.error(e);
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await api.apiDeleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const toggleProductStock = async (id: string) => {
    const product = products.find(p => p.id === id);
    if (!product) return;
    try {
      const updatedP = await api.apiUpdateProduct(id, { isAvailable: !product.isAvailable });
      setProducts(prev => prev.map(p => (p.id === id ? { ...updatedP, defaultFlavors: updatedP.flavors || [] } : p)));
    } catch (e) {
      console.error(e);
    }
  };

  const addTopping = async (top: Omit<Topping, 'id'>) => {
    try {
      const newTop = await api.apiCreateTopping({ ...top, branchId: currentUser?.branchId || undefined });
      setToppings(prev => [...prev, newTop]);
    } catch (e) {
      console.error(e);
    }
  };

  const updateTopping = async (id: string, updates: Partial<Topping>) => {
    try {
      const updatedT = await api.apiUpdateTopping(id, updates);
      setToppings(prev => prev.map(t => (t.id === id ? updatedT : t)));
    } catch (e) {
      console.error(e);
    }
  };

  const toggleToppingStock = async (id: string) => {
    const topping = toppings.find(t => t.id === id);
    if (!topping) return;
    try {
      const updatedT = await api.apiUpdateTopping(id, { inStock: !topping.inStock });
      setToppings(prev => prev.map(t => (t.id === id ? updatedT : t)));
    } catch (e) {
      console.error(e);
    }
  };

  const addFlavor = async (flv: Omit<Flavor, 'id'>) => {
    try {
      const newFlv = await api.apiCreateFlavor({ ...flv, branchId: currentUser?.branchId });
      setFlavors(prev => [...prev, newFlv]);
    } catch (e) { console.error(e); }
  };

  const toggleFlavorStock = async (id: string) => {
    const flv = flavors.find(f => f.id === id);
    if (!flv) return;
    try {
      const updated = await api.apiUpdateFlavor(id, { inStock: !flv.inStock });
      setFlavors(prev => prev.map(f => f.id === id ? updated : f));
    } catch (e) { console.error(e); }
  };

  // Inventory actions
  const updateInventoryStock = async (id: string, delta: number) => {
    const item = inventory.find(i => i.id === id);
    if (!item) return;
    const newStock = Math.max(0, Number((item.currentStock + delta).toFixed(1)));
    try {
      const updated = await api.apiUpdateInventoryItem(id, { currentStock: newStock, lastRestocked: delta > 0 ? new Date().toISOString() : undefined });
      setInventory(prev => prev.map(i => i.id === id ? updated : i));
    } catch (e) { console.error(e); }
  };

  const addInventoryItem = async (item: Omit<InventoryItem, 'id' | 'lastRestocked'>) => {
    try {
      const newItem = await api.apiCreateInventoryItem({ ...item, branchId: currentUser?.branchId });
      setInventory(prev => [...prev, newItem]);
    } catch (e) { console.error(e); }
  };

  // Table actions
  const updateTableStatus = async (tableId: string, status: TableItem['status'], orderId?: string) => {
    try {
      const updated = await api.apiUpdateTable(tableId, { status, currentOrderId: orderId });
      setTables(prev => prev.map(t => t.id === tableId ? updated : t));
    } catch (e) { console.error(e); }
  };

  const addTable = async (tableData: Omit<TableItem, 'id'>) => {
    try {
      const newTable = await api.apiCreateTable({ ...tableData, branchId: currentUser?.branchId });
      setTables(prev => [...prev, newTable]);
    } catch (e) { console.error(e); }
  };

  const updateTable = async (id: string, updates: Partial<TableItem>) => {
    try {
      const updated = await api.apiUpdateTable(id, updates);
      setTables(prev => prev.map(t => t.id === id ? updated : t));
    } catch (e) { console.error(e); }
  };

  const deleteTable = async (id: string) => {
    try {
      await api.apiDeleteTable(id);
      setTables(prev => prev.filter(t => t.id !== id));
    } catch (e) { console.error(e); }
  };

  // Staff actions
  const addStaffMember = async (member: Omit<StaffMember, 'id' | 'totalOrders' | 'totalSales'>) => {
    try {
      const newMember = await api.apiCreateStaff({ ...member, branchId: currentUser?.branchId });
      setStaff(prev => [...prev, newMember]);
    } catch (e) { console.error(e); }
  };

  const updateStaffMember = async (id: string, updates: Partial<StaffMember>) => {
    try {
      const updated = await api.apiUpdateStaff(id, updates);
      setStaff(prev => prev.map(s => s.id === id ? updated : s));
    } catch (e) { console.error(e); }
  };

  const toggleStaffShift = async (staffId: string) => {
    const member = staff.find(s => s.id === staffId);
    if (!member) return;
    const nextActive = !member.shiftActive;
    try {
      const updated = await api.apiUpdateStaff(staffId, { shiftStatus: nextActive ? 'activo' : 'fuera' });
      setStaff(prev => prev.map(s => s.id === staffId ? { ...s, ...updated, shiftActive: nextActive } : s));
    } catch (e) { console.error(e); }
  };

  // Reward actions
  const addReward = async (reward: Omit<Reward, 'id'>) => {
    try {
      const newRew = await api.apiCreateReward({ ...reward, branchId: currentUser?.branchId });
      setRewards(prev => [...prev, newRew]);
    } catch (e) { console.error(e); }
  };

  const updateReward = async (id: string, updates: Partial<Reward>) => {
    try {
      const updated = await api.apiUpdateReward(id, updates);
      setRewards(prev => prev.map(r => r.id === id ? updated : r));
    } catch (e) { console.error(e); }
  };

  const deleteReward = async (id: string) => {
    try {
      await api.apiDeleteReward(id);
      setRewards(prev => prev.filter(r => r.id !== id));
    } catch (e) { console.error(e); }
  };

  // Expenses
  const addExpense = async (exp: Omit<Expense, 'id'>) => {
    try {
      const newExp = await api.apiCreateExpense({ ...exp, branchId: currentUser?.branchId });
      setExpenses(prev => [newExp, ...prev]);
    } catch (e) { console.error(e); }
  };

  const deleteExpense = async (id: string) => {
    try {
      await api.apiDeleteExpense(id);
      setExpenses(prev => prev.filter(e => e.id !== id));
    } catch (e) { console.error(e); }
  };

  // Customer points override
  const adjustCustomerPoints = async (customerId: string, pointDiff: number) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;
    const updatedPts = Math.max(0, customer.points + pointDiff);
    try {
      const updated = await api.apiUpdateCustomer(customerId, { points: updatedPts });
      setCustomers(prev => prev.map(c => c.id === customerId ? updated : c));
    } catch (e) { console.error(e); }
    if (activeCustomer && activeCustomer.id === customerId) {
      setActiveCustomer(prev => (prev ? { ...prev, points: updatedPts } : null));
    }
  };

  // Backup & Import
  const exportDataJson = () => {
    const data = {
      config,
      products,
      flavors,
      toppings,
      customers,
      orders,
      expenses,
      staff,
      tables,
      inventory,
      exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(data, null, 2);
  };

  const importDataJson = (jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.products) setProducts(parsed.products);
      if (parsed.flavors) setFlavors(parsed.flavors);
      if (parsed.toppings) setToppings(parsed.toppings);
      if (parsed.customers) setCustomers(parsed.customers);
      if (parsed.orders) setOrders(parsed.orders);
      if (parsed.expenses) setExpenses(parsed.expenses);
      if (parsed.staff) setStaff(parsed.staff);
      if (parsed.tables) setTables(parsed.tables);
      if (parsed.inventory) setInventory(parsed.inventory);
      if (parsed.config) setConfig(parsed.config);
      return true;
    } catch {
      return false;
    }
  };

  const resetAllData = () => {
    localStorage.clear();
    setConfig(initialConfig);
    setProducts(initialProducts);
    setFlavors(initialFlavors);
    setToppings(initialToppings);
    setCustomers(initialCustomers);
    setOrders(initialOrders);
    setExpenses(initialExpenses);
    setStaff(initialStaff);
    setTables(initialTables);
    setInventory(initialInventory);
    setCart([]);
    setActiveCustomer(null);
    setAppliedReward(null);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        login,
        logout,
        currentRole,
        setCurrentRole,
        config,
        updateConfig,
        products,
        flavors,
        toppings,
        customers,
        orders,
        rewards,
        expenses,
        staff,
        activeWaiter,
        setActiveWaiter,
        tables,
        inventory,
        branches,
        selectedBranchId,
        setSelectedBranchId,
        adminSubTab,
        setAdminSubTab,
        cart,
        addToCart,
        removeFromCart,
        updateCartItemQty,
        clearCart,
        appliedReward,
        setAppliedReward,
        activeCustomer,
        setActiveCustomer,
        loginOrRegisterCustomer,
        logoutCustomer,
        createOrder,
        updateOrderStatus,
        assignOrderToTable,
        cancelOrder,
        cashShift,
        openCashShift,
        closeCashShift,
        clearStaticTestData,
        latestCreatedOrder,
        setLatestCreatedOrder,
        addProduct,
        updateProduct,
        deleteProduct,
        toggleProductStock,
        addTopping,
        updateTopping,
        toggleToppingStock,
        addFlavor,
        toggleFlavorStock,
        updateInventoryStock,
        addInventoryItem,
        updateTableStatus,
        addTable,
        updateTable,
        deleteTable,
        addStaffMember,
        updateStaffMember,
        toggleStaffShift,
        addReward,
        updateReward,
        deleteReward,
        addExpense,
        deleteExpense,
        adjustCustomerPoints,
        exportDataJson,
        importDataJson,
        resetAllData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
