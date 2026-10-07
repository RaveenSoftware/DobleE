import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TableItem, TableArea, TableStatus, TableShape } from '../../types';
import { formatMoney } from '../../utils/format';
import {
  Users,
  CheckCircle2,
  Receipt,
  X,
  Search,
  Eye,
  EyeOff,
  Calendar,
  DollarSign,
  Utensils,
  Plus,
  PlusCircle,
  Sparkles,
  Settings,
  ChevronDown,
  RotateCcw,
  Printer,
  Trash2,
  Clock,
  Layers,
} from 'lucide-react';

interface TablesManagerProps {
  onViewOrderReceipt?: (orderId: string) => void;
}

interface TableReservation {
  id: string;
  tableName: string;
  customerName: string;
  phone: string;
  guests: number;
  time: string;
  date: string;
  notes?: string;
}

export const TablesManager: React.FC<TablesManagerProps> = ({ onViewOrderReceipt }) => {
  const {
    currentUser,
    tables,
    orders,
    products,
    staff,
    config,
    addTable,
    updateTable,
    deleteTable,
    updateTableStatus,
    createOrder,
    updateOrderStatus,
    assignOrderToTable,
  } = useApp();

  // Active Salon / Area
  const isCajero = ['cajero', 'caja'].includes(currentUser?.role?.toLowerCase()?.trim() || '');
  const [activeArea, setActiveArea] = useState<string>('Salón Principal');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | TableStatus>('all');
  const [onlyActiveFilter, setOnlyActiveFilter] = useState(false);
  const [isCompactView, setIsCompactView] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
  const [selectedTableForOptions, setSelectedTableForOptions] = useState<TableItem | null>(null);

  // Take Order / Comanda Modal
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderModalTab, setOrderModalTab] = useState<'new' | 'existing'>('new');
  const [existingOrderSearch, setExistingOrderSearch] = useState('');
  const [targetTableForOrder, setTargetTableForOrder] = useState<TableItem | null>(null);
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [selectedOrderItems, setSelectedOrderItems] = useState<{ [productId: string]: number }>({});
  const [orderCustomerName, setOrderCustomerName] = useState('');
  const [orderWaiterName, setOrderWaiterName] = useState('');
  const [orderNotes, setOrderNotes] = useState('');

  // Cobrar / Checkout Modal
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [targetTableForCheckout, setTargetTableForCheckout] = useState<TableItem | null>(null);
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState<'Efectivo' | 'Tarjeta' | 'Transferencia (Nequi/Daviplata)'>('Efectivo');
  const [cashAmountGiven, setCashAmountGiven] = useState<number>(0);

  // Agenda / Reservations Modal
  const [isAgendaModalOpen, setIsAgendaModalOpen] = useState(false);
  const [reservations, setReservations] = useState<TableReservation[]>([
    {
      id: 'res-1',
      tableName: 'Mesa 16 (Terraza 2)',
      customerName: 'Familia Salazar',
      phone: '3157891234',
      guests: 6,
      date: '2026-09-27',
      time: '17:00',
      notes: 'Celebración de Cumpleaños, desean mesa decorada.',
    },
    {
      id: 'res-2',
      tableName: 'VIP Lounge',
      customerName: 'Carolina Morales',
      phone: '3206549871',
      guests: 8,
      date: '2026-09-27',
      time: '19:30',
      notes: 'Reunión ejecutiva, combo especial de granizados.',
    },
  ]);
  const [newResName, setNewResName] = useState('');
  const [newResPhone, setNewResPhone] = useState('');
  const [newResGuests, setNewResGuests] = useState(4);
  const [newResTime, setNewResTime] = useState('18:00');
  const [newResTable, setNewResTable] = useState('Mesa 1');
  const [newResNotes, setNewResNotes] = useState('');

  // Hidden Tables Modal
  const [isHiddenTablesModalOpen, setIsHiddenTablesModalOpen] = useState(false);

  // Salon Manager Modal
  const [isSalonManagerModalOpen, setIsSalonManagerModalOpen] = useState(false);
  const [newSalonName, setNewSalonName] = useState('');

  // Form fields for New Table
  const [newTableName, setNewTableName] = useState('');
  const [newTableArea, setNewTableArea] = useState<TableArea>('Salón Principal');
  const [newTableCapacity, setNewTableCapacity] = useState(4);
  const [newTableShape, setNewTableShape] = useState<TableShape>('cuadrada');
  const [newTableStatus, setNewTableStatus] = useState<TableStatus>('libre');

  // Extract all unique areas safely
  const allAreas = Array.from(new Set(['Salón Principal', ...tables.map(t => t?.area || 'Salón Principal').filter(Boolean)]));

  // Compute table statistics for the 5 top cards
  // Note: We compute across all tables or active area to match the photo
  const tablesInOperation = tables.filter(t => t && !t.isHidden);
  const totalTablesCount = tablesInOperation.length;
  const freeTablesCount = tablesInOperation.filter(t => (t.status || 'libre') === 'libre').length;
  const occupiedTablesCount = tablesInOperation.filter(t => t.status === 'ocupada').length;
  const billTablesCount = tablesInOperation.filter(t => t.status === 'cuenta').length;
  const reservedTablesCount = tablesInOperation.filter(t => t.status === 'reservada').length;
  const activeTablesCount = occupiedTablesCount + billTablesCount;

  // Filtered tables for current view
  const visibleTables = tables.filter(table => {
    if (!table) return false;
    if (table.isHidden) return false;
    const tableArea = table.area || 'Salón Principal';
    if (activeArea !== 'all' && tableArea !== activeArea) return false;
    const tableStatus = table.status || 'libre';
    if (selectedStatusFilter !== 'all' && tableStatus !== selectedStatusFilter) return false;
    if (onlyActiveFilter && tableStatus !== 'ocupada' && tableStatus !== 'cuenta') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (table.name || '').toLowerCase().includes(q);
      const matchWaiter = (table.activeWaiter || '').toLowerCase().includes(q);
      if (!matchName && !matchWaiter) return false;
    }
    return true;
  });

  const hiddenTablesCount = tables.filter(t => t?.isHidden).length;

  // Helper to extract table number from name e.g. "Mesa 1" -> 1
  const getTableDisplayNumber = (table: TableItem, index: number): string => {
    const match = table.name.match(/\d+/);
    if (match) return match[0];
    return String(index + 1);
  };

  // Helper to get active consumption / order for table
  const getTableOrderData = (table: TableItem) => {
    // 1. Direct orderTotal if set on table
    if (table.orderTotal && table.orderTotal > 0) {
      return {
        total: table.orderTotal,
        itemsCount: table.status === 'ocupada' ? 1 : 2,
        orderId: table.currentOrderId,
      };
    }
    // 2. Search in orders array
    const foundOrder = orders.find(
      o => (o.id === table.currentOrderId || o.tableName === table.name) &&
        o.status !== 'Entregado' &&
        o.status !== 'Cancelado'
    );
    if (foundOrder) {
      return {
        total: foundOrder.total,
        itemsCount: foundOrder.items.reduce((s, i) => s + i.quantity, 0),
        orderId: foundOrder.id,
      };
    }
    return {
      total: 0,
      itemsCount: 0,
      orderId: undefined,
    };
  };

  // Open Take Order / Comanda Modal
  const handleOpenOrderModal = (table: TableItem) => {
    setTargetTableForOrder(table);
    setSelectedOrderItems({});
    setOrderCustomerName('');
    setOrderWaiterName(table.activeWaiter || (staff[0]?.name || 'Mateo Restrepo'));
    setOrderNotes(table.notes || '');
    setIsOrderModalOpen(true);
  };

  // Confirm order and assign to table
  const handleConfirmOrder = () => {
    if (!targetTableForOrder) return;

    const itemsToAdd = Object.entries(selectedOrderItems)
      .filter(([_, qty]) => qty > 0)
      .map(([productId, quantity]) => {
        const prod = products.find(p => p.id === productId);
        return {
          id: `item-${Date.now()}-${productId}`,
          productId,
          productName: prod ? prod.name : 'Granizado Personalizado',
          size: 'Mediano (16oz)' as const,
          flavors: ['Fresa & Limón'],
          sweetness: 'Normal' as const,
          toppings: [],
          unitPrice: prod?.basePrice || 12000,
          unitCost: prod?.baseCost || 3500,
          quantity,
          totalPrice: (prod?.basePrice || 12000) * quantity,
        };
      });

    const calculatedTotal = itemsToAdd.reduce((sum, item) => sum + item.totalPrice, 0);
    const finalTotal = calculatedTotal > 0 ? calculatedTotal : 18500;

    const newOrder = createOrder({
      customerType: 'guest',
      customerName: orderCustomerName.trim() || `Comensal ${targetTableForOrder.name}`,
      tableName: targetTableForOrder.name,
      waiterName: orderWaiterName,
      items: itemsToAdd.length > 0 ? itemsToAdd : [
        {
          id: `item-${Date.now()}`,
          productId: products[0]?.id || 'prod-1',
          productName: products[0]?.name || 'Granizado Especial Oasis',
          size: 'Mediano (16oz)' as const,
          flavors: ['Mango Biche', 'Limón'],
          sweetness: 'Normal' as const,
          toppings: [],
          unitPrice: 12500,
          unitCost: 3800,
          quantity: 1,
          totalPrice: 12500,
        }
      ],
      paymentMethod: 'Efectivo',
      channel: 'Comanda Mesero',
      notes: orderNotes.trim() || undefined,
    });

    // Update table status to ocupada with the order total
    updateTable(targetTableForOrder.id, {
      status: 'ocupada',
      currentOrderId: newOrder.id,
      activeWaiter: orderWaiterName,
      orderTotal: finalTotal,
    });

    setIsOrderModalOpen(false);
  };

  // Open Checkout / Cobrar Modal
  const handleOpenCheckoutModal = (table: TableItem) => {
    setTargetTableForCheckout(table);
    const orderData = getTableOrderData(table);
    setCashAmountGiven(orderData.total > 0 ? orderData.total : 15000);
    setIsCheckoutModalOpen(true);
  };

  // Complete checkout & free table
  const handleCompleteCheckout = () => {
    if (!targetTableForCheckout) return;

    const orderData = getTableOrderData(targetTableForCheckout);
    if (orderData.orderId) {
      updateOrderStatus(orderData.orderId, 'Entregado');
    }

    // Set table back to free & reset balance
    updateTable(targetTableForCheckout.id, {
      status: 'libre',
      currentOrderId: undefined,
      orderTotal: 0,
      notes: undefined,
    });

    setIsCheckoutModalOpen(false);
  };

  // Open Quick Options Modal
  const handleOpenTableOptions = (table: TableItem) => {
    setSelectedTableForOptions(table);
    setIsOptionsModalOpen(true);
  };

  // Handle Quick Status Change in Options Modal
  const handleUpdateStatus = (status: TableStatus) => {
    if (!selectedTableForOptions) return;
    updateTableStatus(selectedTableForOptions.id, status);
    setSelectedTableForOptions(prev => prev ? { ...prev, status } : null);
  };

  // Toggle Table Hidden
  const handleToggleHidden = (table: TableItem) => {
    updateTable(table.id, { isHidden: !table.isHidden });
    setIsOptionsModalOpen(false);
  };

  // Create Table Handler
  const handleCreateTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableName.trim()) return;

    addTable({
      name: newTableName.trim(),
      area: newTableArea,
      capacity: Number(newTableCapacity),
      shape: newTableShape,
      status: newTableStatus,
      orderTotal: 0,
    });

    setIsCreateModalOpen(false);
  };

  // Add Reservation Handler
  const handleCreateReservation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResName.trim()) return;

    const newRes: TableReservation = {
      id: `res-${Date.now()}`,
      tableName: newResTable,
      customerName: newResName.trim(),
      phone: newResPhone.trim(),
      guests: Number(newResGuests),
      date: '2026-09-27',
      time: newResTime,
      notes: newResNotes.trim() || undefined,
    };

    setReservations(prev => [newRes, ...prev]);

    // Optionally mark the table as 'reservada'
    const target = tables.find(t => t.name === newResTable);
    if (target) {
      updateTableStatus(target.id, 'reservada');
    }

    setNewResName('');
    setNewResPhone('');
    setNewResNotes('');
  };

  return (
    <div className="space-y-4 font-sans text-slate-800">
      {/* 1. TOP METRICS CARDS (5 exact cards as in the user photo) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Card 1: MESAS TOTALES */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 tracking-wider uppercase">
              MESAS TOTALES
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50/80 text-indigo-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <span className="text-3xl font-black font-display text-slate-900 tracking-tight">
              {totalTablesCount}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium leading-tight">
            Configuradas y detectadas en operación.
          </span>
        </div>

        {/* Card 2: LIBRES */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 tracking-wider uppercase">
              LIBRES
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <span className="text-3xl font-black font-display text-emerald-600 tracking-tight">
              {freeTablesCount}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium leading-tight">
            Disponibles para tomar pedido.
          </span>
        </div>

        {/* Card 3: OCUPADAS */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 tracking-wider uppercase">
              OCUPADAS
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
              <Utensils className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <span className="text-3xl font-black font-display text-rose-500 tracking-tight">
              {occupiedTablesCount}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium leading-tight">
            Con pedidos activos en curso.
          </span>
        </div>

        {/* Card 4: POR COBRAR */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 tracking-wider uppercase">
              POR COBRAR
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <span className="text-3xl font-black font-display text-amber-500 tracking-tight">
              {billTablesCount}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium leading-tight">
            Listas para cierre de cuenta.
          </span>
        </div>

        {/* Card 5: RESERVADAS */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 tracking-wider uppercase">
              RESERVADAS
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <span className="text-3xl font-black font-display text-blue-500 tracking-tight">
              {reservedTablesCount}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium leading-tight">
            Reservas próximas registradas.
          </span>
        </div>
      </div>

      {/* 2. STATUS PILLS / LEGEND ROW (Clickable filters) */}
      <div className="flex items-center gap-2 overflow-x-auto py-1">
        <button
          onClick={() => setSelectedStatusFilter(selectedStatusFilter === 'libre' ? 'all' : 'libre')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
            selectedStatusFilter === 'libre'
              ? 'bg-emerald-50 text-emerald-800 border-2 border-emerald-500 shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200/80 hover:bg-slate-50 shadow-2xs'
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
          <span>Libre</span>
          {selectedStatusFilter === 'libre' && <span className="text-[10px] text-emerald-600">({freeTablesCount})</span>}
        </button>

        <button
          onClick={() => setSelectedStatusFilter(selectedStatusFilter === 'ocupada' ? 'all' : 'ocupada')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
            selectedStatusFilter === 'ocupada'
              ? 'bg-rose-50 text-rose-800 border-2 border-rose-500 shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200/80 hover:bg-slate-50 shadow-2xs'
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
          <span>Ocupada</span>
          {selectedStatusFilter === 'ocupada' && <span className="text-[10px] text-rose-600">({occupiedTablesCount})</span>}
        </button>

        <button
          onClick={() => setSelectedStatusFilter(selectedStatusFilter === 'cuenta' ? 'all' : 'cuenta')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
            selectedStatusFilter === 'cuenta'
              ? 'bg-amber-50 text-amber-800 border-2 border-amber-500 shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200/80 hover:bg-slate-50 shadow-2xs'
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
          <span>Por cobrar</span>
          {selectedStatusFilter === 'cuenta' && <span className="text-[10px] text-amber-600">({billTablesCount})</span>}
        </button>

        <button
          onClick={() => setSelectedStatusFilter(selectedStatusFilter === 'reservada' ? 'all' : 'reservada')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
            selectedStatusFilter === 'reservada'
              ? 'bg-blue-50 text-blue-800 border-2 border-blue-500 shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200/80 hover:bg-slate-50 shadow-2xs'
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
          <span>Reservada</span>
          {selectedStatusFilter === 'reservada' && <span className="text-[10px] text-blue-600">({reservedTablesCount})</span>}
        </button>

        {selectedStatusFilter !== 'all' && (
          <button
            onClick={() => setSelectedStatusFilter('all')}
            className="text-xs text-slate-500 hover:text-slate-800 underline ml-2 cursor-pointer font-medium"
          >
            Ver todas ({totalTablesCount})
          </button>
        )}
      </div>

      {/* 3. MAIN FLOOR MAP SECTION CONTAINER */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-5">
        {/* Header of Map */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            {/* Top Pill Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-[10px] font-bold tracking-wider uppercase mb-2">
              <Layers className="w-3.5 h-3.5" />
              <span>SALONES ACTIVOS</span>
            </div>

            <h2 className="text-2xl font-black font-display text-slate-900 tracking-tight">
              Mapa de salones y mesas
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Un plano mas denso y visual para leer estados, cobrar y abrir pedidos sin sentirlo como otro dashboard.
            </p>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* Checkbox: Solo activas */}
            <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer select-none transition-colors shadow-2xs">
              <input
                type="checkbox"
                checked={onlyActiveFilter}
                onChange={e => setOnlyActiveFilter(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
              />
              <span>Solo activas</span>
            </label>

            {/* Mesas ocultas Button */}
            {!isCajero && (
              <button
                onClick={() => setIsHiddenTablesModalOpen(true)}
                className="px-3.5 py-2 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
              >
                <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                <span>Mesas ocultas</span>
                {hiddenTablesCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 text-[10px] flex items-center justify-center font-bold">
                    {hiddenTablesCount}
                  </span>
                )}
              </button>
            )}

            {/* Agenda Button */}
            {!isCajero && (
              <button
                onClick={() => setIsAgendaModalOpen(true)}
                className="px-3.5 py-2 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Agenda</span>
              </button>
            )}
          </div>
        </div>

        {/* 4. SALON HEADER SUB-BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Active Salon Pill / Selector */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={activeArea}
                onChange={e => setActiveArea(e.target.value)}
                className="appearance-none pl-6 pr-8 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 font-bold text-xs uppercase tracking-wider text-slate-800 cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                {allAreas.map(area => (
                  <option key={area} value={area}>
                    {(area || 'Salón Principal').toUpperCase()}
                  </option>
                ))}
                <option value="all">TODAS LAS ZONAS</option>
              </select>
              {/* Colored status dot inside select */}
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Search within tables */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar mesa o mesero..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1 rounded-xl border border-slate-200 text-xs bg-slate-50/70 focus:outline-none focus:ring-1 focus:ring-amber-500 w-40 sm:w-48"
              />
            </div>
          </div>

          {/* Counter and Salon Action Buttons */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-500">
              {visibleTables.length} mesa(s) · {visibleTables.filter(t => t.status === 'ocupada' || t.status === 'cuenta').length} activas
            </span>

            {/* Crear Mesa Button */}
            {!isCajero && (
              <button
                onClick={() => {
                  setNewTableName(`Mesa ${tables.length + 1}`);
                  setNewTableArea(activeArea !== 'all' ? activeArea : 'Salón Principal');
                  setNewTableCapacity(4);
                  setNewTableShape('cuadrada');
                  setNewTableStatus('libre');
                  setIsCreateModalOpen(true);
                }}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-slate-500" />
                <span>Crear mesa</span>
              </button>
            )}

            {/* Salon Options Button */}
            {!isCajero && (
              <button
                onClick={() => setIsSalonManagerModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span>Opciones</span>
              </button>
            )}
          </div>
        </div>

        {/* 5. ARCHITECTURAL FLOOR CANVAS & TABLE GRID */}
        <div
          className="rounded-3xl border border-slate-200/80 p-4 sm:p-6 relative overflow-hidden"
          style={{
            backgroundColor: '#FBFBFE',
            backgroundImage: 'radial-gradient(rgba(148, 163, 184, 0.28) 1px, transparent 1px)',
            backgroundSize: '18px 18px',
          }}
        >
          {/* Top Right "PLANO COMPACTO" Toggle Badge */}
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setIsCompactView(!isCompactView)}
              className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border transition-all cursor-pointer shadow-2xs ${
                isCompactView
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {isCompactView ? 'VISTA EXPANDIDA' : 'PLANO COMPACTO'}
            </button>
          </div>

          {/* Table Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {visibleTables.map((table, index) => {
              const displayNumber = getTableDisplayNumber(table, index);
              const orderData = getTableOrderData(table);

              // Status styles and labels matching photo
              const statusConfig = {
                libre: {
                  label: 'LIBRE',
                  textColor: 'text-emerald-600',
                  badgeBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
                  accentBar: 'bg-emerald-500',
                  chairDot: 'bg-emerald-400',
                  icon: <CheckCircle2 className="w-3 h-3" />,
                },
                ocupada: {
                  label: 'OCUPADA',
                  textColor: 'text-rose-600',
                  badgeBg: 'bg-rose-50 text-rose-600 border-rose-100',
                  accentBar: 'bg-rose-500',
                  chairDot: 'bg-rose-400',
                  icon: <Utensils className="w-3 h-3" />,
                },
                cuenta: {
                  label: 'POR COBRAR',
                  textColor: 'text-amber-600',
                  badgeBg: 'bg-amber-50 text-amber-700 border-amber-100',
                  accentBar: 'bg-amber-500',
                  chairDot: 'bg-amber-400',
                  icon: <DollarSign className="w-3 h-3" />,
                },
                reservada: {
                  label: 'RESERVADA',
                  textColor: 'text-blue-600',
                  badgeBg: 'bg-blue-50 text-blue-700 border-blue-100',
                  accentBar: 'bg-blue-500',
                  chairDot: 'bg-blue-400',
                  icon: <Calendar className="w-3 h-3" />,
                },
              }[table.status];

              return (
                <div
                  key={table.id}
                  className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group p-4"
                >
                  {/* Top Status Accent Bar */}
                  <div className={`absolute top-0 left-0 right-0 h-1.5 ${statusConfig.accentBar}`} />

                  {/* Header Row: Table Name & Status Badge */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5 text-slate-800">
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-extrabold text-[11px] uppercase tracking-wider text-slate-900 font-display">
                        {table.name.toUpperCase()}
                      </span>
                    </div>

                    {/* Status badge pill */}
                    <div className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusConfig.badgeBg}`}>
                      {statusConfig.icon}
                      <span>{statusConfig.label}</span>
                    </div>
                  </div>

                  {/* Center Architectural Table & Chairs Graphic */}
                  {!isCompactView ? (
                    <div className="my-3 sm:my-4 flex items-center justify-center relative w-full h-24 sm:h-28">
                      {/* Main Table Body Base (Soft Stadium Pill with gradient) */}
                      <div className="w-40 sm:w-44 h-18 sm:h-20 rounded-full bg-gradient-to-b from-slate-100/90 via-slate-100/70 to-slate-200/70 border border-slate-200/90 relative flex items-center justify-center shadow-inner">
                        {/* Chairs surrounding table */}
                        {/* Top Chairs */}
                        <div className="absolute -top-2 left-[28%] -translate-x-1/2 w-4.5 h-3 rounded-full bg-white border border-slate-300 shadow-2xs flex items-center justify-center">
                          <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.chairDot}`} />
                        </div>
                        <div className="absolute -top-2 right-[28%] translate-x-1/2 w-4.5 h-3 rounded-full bg-white border border-slate-300 shadow-2xs flex items-center justify-center">
                          <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.chairDot}`} />
                        </div>

                        {/* Bottom Chairs */}
                        <div className="absolute -bottom-2 left-[28%] -translate-x-1/2 w-4.5 h-3 rounded-full bg-white border border-slate-300 shadow-2xs flex items-center justify-center">
                          <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.chairDot}`} />
                        </div>
                        <div className="absolute -bottom-2 right-[28%] translate-x-1/2 w-4.5 h-3 rounded-full bg-white border border-slate-300 shadow-2xs flex items-center justify-center">
                          <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.chairDot}`} />
                        </div>

                        {/* Left & Right Chairs for tables with 5+ capacity */}
                        {table.capacity >= 5 && (
                          <>
                            <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-3 h-4.5 rounded-full bg-white border border-slate-300 shadow-2xs flex items-center justify-center">
                              <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.chairDot}`} />
                            </div>
                            <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-3 h-4.5 rounded-full bg-white border border-slate-300 shadow-2xs flex items-center justify-center">
                              <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.chairDot}`} />
                            </div>
                          </>
                        )}

                        {/* Central Prominent Number Disc */}
                        <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-white shadow-md border border-slate-100/90 flex items-center justify-center text-slate-900 font-display font-black text-xl sm:text-2xl transition-transform group-hover:scale-105">
                          {displayNumber}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Compact mode center summary */
                    <div className="my-2 p-2 bg-slate-50 rounded-xl text-center">
                      <span className="text-xl font-black font-display text-slate-900">
                        {displayNumber}
                      </span>
                    </div>
                  )}

                  {/* Metadata Rows (Capacity & Orders count, Total spent) */}
                  <div className="space-y-1.5 mb-3">
                    {/* Two Side-by-Side Pill Capsules */}
                    <div className="grid grid-cols-2 gap-2">
                      {/* Left: Capacity */}
                      <div className="bg-slate-100/80 rounded-xl py-1.5 px-2 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-700">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>{table.capacity}</span>
                      </div>

                      {/* Right: Active Order Items */}
                      <div className="bg-slate-100/80 rounded-xl py-1.5 px-2 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-700">
                        <Receipt className="w-3.5 h-3.5 text-slate-400" />
                        <span>{orderData.itemsCount}</span>
                      </div>
                    </div>

                    {/* Full-width Amount Balance Pill */}
                    <div className="bg-slate-100/80 rounded-xl py-1.5 px-3 flex items-center justify-center gap-1 text-xs font-bold text-slate-800 font-mono">
                      <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                      <span>{orderData.total > 0 ? formatMoney(orderData.total, config.currencySymbol) : '$ 0'}</span>
                    </div>
                  </div>

                  {/* Bottom Action Buttons (Exact Match to Photo) */}
                  <div className="space-y-1.5 pt-1">
                    {/* Primary Button Row: [Pedido] & [Cobrar] */}
                    <div className="grid grid-cols-2 gap-2">
                      {/* Pedido Button (Royal Blue / Indigo) */}
                      <button
                        onClick={() => handleOpenOrderModal(table)}
                        className="bg-[#4338CA] hover:bg-[#3730A3] active:scale-95 text-white font-bold text-xs py-2 px-2.5 rounded-xl shadow-xs hover:shadow flex items-center justify-center gap-1 transition-all cursor-pointer"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Pedido</span>
                      </button>

                      {/* Cobrar Button (White with subtle border) */}
                      <button
                        onClick={() => handleOpenCheckoutModal(table)}
                        className="bg-white hover:bg-slate-50 active:scale-95 border border-slate-200 text-slate-800 font-bold text-xs py-2 px-2.5 rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs"
                      >
                        <DollarSign className="w-3.5 h-3.5 text-slate-500" />
                        <span>Cobrar</span>
                      </button>
                    </div>

                    {/* Opciones Button (Light lavender / soft purple full-width) */}
                    {!isCajero && (
                      <button
                        onClick={() => handleOpenTableOptions(table)}
                        className="bg-[#EEF2FF] hover:bg-[#E0E7FF] active:scale-98 text-[#4F46E5] font-bold text-xs py-1.5 px-3 rounded-xl flex items-center justify-center gap-1.5 w-full transition-all cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3 text-[#4F46E5]" />
                        <span>Opciones</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Empty state when filters return nothing */}
          {visibleTables.length === 0 && (
            <div className="py-12 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-700 text-sm">No se encontraron mesas</h3>
              <p className="text-xs text-slate-400">
                Prueba ajustando los filtros de zona o estado seleccionado.
              </p>
              <button
                onClick={() => {
                  setSelectedStatusFilter('all');
                  setOnlyActiveFilter(false);
                  setSearchQuery('');
                }}
                className="mt-2 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold cursor-pointer"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ---------------- MODALS SECTION ---------------- */}

      {/* 1. TAKE ORDER / COMANDA MODAL */}
      {isOrderModalOpen && targetTableForOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center font-bold">
                  <PlusCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 font-display">
                    Tomar Pedido — {targetTableForOrder.name}
                  </h3>
                  <span className="text-xs text-slate-400">{targetTableForOrder.area}</span>
                </div>
              </div>
              <button
                onClick={() => setIsOrderModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab Selector: Tomar Nuevo Pedido vs Asignar Pedido Existente */}
            <div className="flex border-b border-slate-100 text-xs font-bold gap-2">
              <button
                type="button"
                onClick={() => setOrderModalTab('new')}
                className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer ${
                  orderModalTab === 'new'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                + Tomar Nuevo Pedido
              </button>
              <button
                type="button"
                onClick={() => setOrderModalTab('existing')}
                className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  orderModalTab === 'existing'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Asignar Pedido Existente ({orders.filter(o => o.status !== 'Entregado' && o.status !== 'Cancelado').length})</span>
              </button>
            </div>

            {orderModalTab === 'new' ? (
              <>
                {/* Waiter & Customer inputs */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Mesero Asignado</label>
                    <select
                      value={orderWaiterName}
                      onChange={e => setOrderWaiterName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      {staff.map(s => (
                        <option key={s.id} value={s.name}>
                          {s.name} ({s.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Nombre Comensal (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Ej: Carlos"
                      value={orderCustomerName}
                      onChange={e => setOrderCustomerName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Product selection search */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-xs text-slate-800">Seleccionar Granizados / Productos</label>
                    <span className="text-[11px] text-slate-400">Toca + para agregar a la comanda</span>
                  </div>
                  <input
                    type="text"
                    placeholder="Buscar granizado o sabor..."
                    value={orderSearchQuery}
                    onChange={e => setOrderSearchQuery(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50/50"
                  />

                  {/* Products list with stepper */}
                  <div className="max-h-48 overflow-y-auto space-y-1.5 divide-y divide-slate-50 pr-1">
                    {products
                      .filter(p => p.name.toLowerCase().includes(orderSearchQuery.toLowerCase()))
                      .map(product => {
                        const qty = selectedOrderItems[product.id] || 0;
                        return (
                          <div key={product.id} className="pt-1.5 flex items-center justify-between text-xs">
                            <div>
                              <span className="font-semibold text-slate-800 block">{product.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {formatMoney(product.basePrice, config.currencySymbol)}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              {qty > 0 && (
                                <button
                                  onClick={() => setSelectedOrderItems(prev => ({ ...prev, [product.id]: Math.max(0, qty - 1) }))}
                                  className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 flex items-center justify-center cursor-pointer"
                                >
                                  -
                                </button>
                              )}
                              {qty > 0 && <span className="font-bold font-mono text-xs">{qty}</span>}
                              <button
                                onClick={() => setSelectedOrderItems(prev => ({ ...prev, [product.id]: qty + 1 }))}
                                className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold flex items-center justify-center cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="font-semibold text-xs text-slate-700 block mb-1">Notas especiales de preparación</label>
                  <input
                    type="text"
                    placeholder="Ej: Con poco chamoy, sin pitillo..."
                    value={orderNotes}
                    onChange={e => setOrderNotes(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs"
                  />
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsOrderModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmOrder}
                    className="px-5 py-2 rounded-xl bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer"
                  >
                    Guardar y Enviar Comanda
                  </button>
                </div>
              </>
            ) : (
              /* TAB: Asignar Pedido Existente */
              <div className="space-y-3 text-xs">
                <p className="text-slate-500 text-xs">
                  Selecciona cualquier pedido activo registrado en caja o mostrador para vincularlo a <strong>{targetTableForOrder.name}</strong>:
                </p>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar por # pedido o nombre del cliente..."
                    value={existingOrderSearch}
                    onChange={e => setExistingOrderSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50/50"
                  />
                </div>

                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                  {orders
                    .filter(
                      o =>
                        o.status !== 'Entregado' &&
                        o.status !== 'Cancelado' &&
                        (o.id.toLowerCase().includes(existingOrderSearch.toLowerCase()) ||
                          o.customerName.toLowerCase().includes(existingOrderSearch.toLowerCase()))
                    )
                    .map(order => {
                      const isCurrentTable = order.tableName === targetTableForOrder.name;
                      return (
                        <div
                          key={order.id}
                          className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                            isCurrentTable
                              ? 'bg-indigo-50/60 border-indigo-200'
                              : 'bg-white border-slate-200/90 hover:border-slate-300'
                          }`}
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-900">{order.id}</span>
                              <span className="font-semibold text-slate-700">· {order.customerName}</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                order.tableName ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {order.tableName ? `Mesa actual: ${order.tableName}` : 'Sin mesa / Mostrador'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {order.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}
                            </div>
                            <div className="font-mono font-bold text-slate-900 text-[11px]">
                              {formatMoney(order.total, config.currencySymbol)} · {order.paymentMethod}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              assignOrderToTable(order.id, targetTableForOrder.name);
                              setIsOrderModalOpen(false);
                            }}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap cursor-pointer transition-all ${
                              isCurrentTable
                                ? 'bg-indigo-600 text-white'
                                : 'bg-[#4338CA] hover:bg-[#3730A3] text-white shadow-2xs hover:shadow'
                            }`}
                          >
                            {isCurrentTable ? '✓ Ya en esta mesa' : `Asignar a ${targetTableForOrder.name}`}
                          </button>
                        </div>
                      );
                    })}

                  {orders.filter(o => o.status !== 'Entregado' && o.status !== 'Cancelado').length === 0 && (
                    <div className="p-6 text-center text-slate-400">
                      No hay pedidos pendientes para asignar.
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsOrderModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. COBRAR / CHECKOUT MODAL */}
      {isCheckoutModalOpen && targetTableForCheckout && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 font-display">
                    Cobro de Mesa — {targetTableForCheckout.name}
                  </h3>
                  <span className="text-xs text-slate-400">Totalizar cuenta y liberar mesa</span>
                </div>
              </div>
              <button
                onClick={() => setIsCheckoutModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Amount Summary */}
            <div className="bg-slate-50 rounded-2xl p-4 text-center space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Total a Cobrar
              </span>
              <span className="text-3xl font-black font-display text-slate-900 font-mono">
                {formatMoney(
                  getTableOrderData(targetTableForCheckout).total > 0
                    ? getTableOrderData(targetTableForCheckout).total
                    : 18500,
                  config.currencySymbol
                )}
              </span>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-1.5">
              <label className="font-bold text-xs text-slate-700 block">Medio de Pago</label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {(['Efectivo', 'Tarjeta', 'Transferencia (Nequi/Daviplata)'] as const).map(method => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setCheckoutPaymentMethod(method)}
                    className={`py-2 px-2 rounded-xl font-bold text-center border transition-all cursor-pointer ${
                      checkoutPaymentMethod === method
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {method === 'Transferencia (Nequi/Daviplata)' ? 'Nequi / Davi' : method}
                  </button>
                ))}
              </div>
            </div>

            {/* Cash given & change calculation */}
            {checkoutPaymentMethod === 'Efectivo' && (
              <div className="space-y-2 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-200/60">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-700">Monto Recibido</label>
                  <input
                    type="number"
                    value={cashAmountGiven}
                    onChange={e => setCashAmountGiven(Number(e.target.value))}
                    className="w-32 px-2.5 py-1 rounded-lg border border-slate-200 text-right font-mono font-bold bg-white text-xs"
                  />
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 font-semibold text-slate-700">
                  <span>Cambio / Vueltas:</span>
                  <span className="font-bold font-mono text-emerald-600 text-sm">
                    {formatMoney(
                      Math.max(
                        0,
                        cashAmountGiven -
                          (getTableOrderData(targetTableForCheckout).total > 0
                            ? getTableOrderData(targetTableForCheckout).total
                            : 18500)
                      ),
                      config.currencySymbol
                    )}
                  </span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCheckoutModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCompleteCheckout}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer"
              >
                Cobrar y Liberar Mesa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. QUICK TABLE OPTIONS MODAL */}
      {isOptionsModalOpen && selectedTableForOptions && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900 font-display">
                  Opciones — {selectedTableForOptions.name}
                </h3>
                <span className="text-xs text-slate-400">
                  Capacidad: {selectedTableForOptions.capacity} personas · {selectedTableForOptions.area}
                </span>
              </div>
              <button
                onClick={() => setIsOptionsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Status Pills */}
            <div className="space-y-1.5">
              <label className="font-bold text-xs text-slate-700 block">Cambiar Estado</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleUpdateStatus('libre')}
                  className={`p-2 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                    selectedTableForOptions.status === 'libre'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-500 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Libre</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleUpdateStatus('ocupada')}
                  className={`p-2 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                    selectedTableForOptions.status === 'ocupada'
                      ? 'bg-rose-50 text-rose-800 border-rose-500 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>Ocupada</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleUpdateStatus('cuenta')}
                  className={`p-2 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                    selectedTableForOptions.status === 'cuenta'
                      ? 'bg-amber-50 text-amber-800 border-amber-500 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Por cobrar</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleUpdateStatus('reservada')}
                  className={`p-2 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                    selectedTableForOptions.status === 'reservada'
                      ? 'bg-blue-50 text-blue-800 border-blue-500 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>Reservada</span>
                </button>
              </div>
            </div>

            {/* Quick Actions List */}
            <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs">
              {/* Asignar pedido existente button */}
              <button
                type="button"
                onClick={() => {
                  setTargetTableForOrder(selectedTableForOptions);
                  setOrderModalTab('existing');
                  setIsOptionsModalOpen(false);
                  setIsOrderModalOpen(true);
                }}
                className="w-full py-2 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold flex items-center gap-2 cursor-pointer transition-colors text-left"
              >
                <Receipt className="w-3.5 h-3.5 text-indigo-600" />
                <span>Asignar o vincular pedido existente a esta mesa</span>
              </button>

              {/* Liberar mesa button */}
              <button
                type="button"
                onClick={() => {
                  updateTable(selectedTableForOptions.id, {
                    status: 'libre',
                    currentOrderId: undefined,
                    orderTotal: 0,
                    notes: undefined,
                  });
                  setIsOptionsModalOpen(false);
                }}
                className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold flex items-center gap-2 cursor-pointer transition-colors text-left"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Liberar y reiniciar cuenta de mesa</span>
              </button>

              {/* Ocultar mesa button */}
              <button
                type="button"
                onClick={() => handleToggleHidden(selectedTableForOptions)}
                className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold flex items-center gap-2 cursor-pointer transition-colors text-left"
              >
                <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                <span>{selectedTableForOptions.isHidden ? 'Mostrar mesa en plano' : 'Ocultar mesa temporalmente'}</span>
              </button>

              {/* Eliminar mesa button */}
              <button
                type="button"
                onClick={() => {
                  if (confirm(`¿Estás seguro de eliminar la ${selectedTableForOptions.name}?`)) {
                    deleteTable(selectedTableForOptions.id);
                    setIsOptionsModalOpen(false);
                  }
                }}
                className="w-full py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold flex items-center gap-2 cursor-pointer transition-colors text-left"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span>Eliminar mesa permanentemente</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. CREATE NEW TABLE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 font-display">
                Crear Nueva Mesa
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTable} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nombre / Identificador</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Mesa 15"
                  value={newTableName}
                  onChange={e => setNewTableName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Salón / Área</label>
                <select
                  value={newTableArea}
                  onChange={e => setNewTableArea(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white"
                >
                  {allAreas.map(area => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Capacidad (personas)</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    required
                    value={newTableCapacity}
                    onChange={e => setNewTableCapacity(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Forma</label>
                  <select
                    value={newTableShape}
                    onChange={e => setNewTableShape(e.target.value as TableShape)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="cuadrada">Cuadrada</option>
                    <option value="redonda">Redonda</option>
                    <option value="rectangular">Rectangular</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-colors cursor-pointer"
                >
                  Guardar Mesa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. AGENDA & RESERVACIONES MODAL */}
      {isAgendaModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 font-display">
                    Agenda y Reservas de Mesas
                  </h3>
                  <span className="text-xs text-slate-400">Control de asistencia y reservas del día</span>
                </div>
              </div>
              <button
                onClick={() => setIsAgendaModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List of active reservations */}
            <div className="space-y-2">
              <span className="font-bold text-xs text-slate-700 block">Reservas Registradas</span>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {reservations.map(res => (
                  <div key={res.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{res.customerName}</span>
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold">
                          {res.tableName}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-3">
                        <span>🕒 {res.time}</span>
                        <span>👥 {res.guests} comensales</span>
                        <span>📞 {res.phone}</span>
                      </div>
                      {res.notes && <p className="text-[10px] text-slate-400 italic mt-0.5">"{res.notes}"</p>}
                    </div>

                    <button
                      onClick={() => setReservations(prev => prev.filter(r => r.id !== res.id))}
                      className="text-rose-500 hover:text-rose-700 p-1.5 text-xs font-semibold cursor-pointer"
                      title="Eliminar reserva"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {reservations.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-4">No hay reservas agendadas.</p>
                )}
              </div>
            </div>

            {/* Add new reservation form */}
            <form onSubmit={handleCreateReservation} className="pt-3 border-t border-slate-100 space-y-3 text-xs">
              <span className="font-bold text-xs text-slate-800 block">Registrar Nueva Reserva</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Nombre Cliente</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Laura Vargas"
                    value={newResName}
                    onChange={e => setNewResName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Teléfono</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: 3101234567"
                    value={newResPhone}
                    onChange={e => setNewResPhone(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Mesa</label>
                  <select
                    value={newResTable}
                    onChange={e => setNewResTable(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    {tables.map(t => (
                      <option key={t.id} value={t.name}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Comensales</label>
                  <input
                    type="number"
                    min="1"
                    value={newResGuests}
                    onChange={e => setNewResGuests(Number(e.target.value))}
                    className="w-full px-2 py-1.5 rounded-xl border border-slate-200 text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Hora</label>
                  <input
                    type="time"
                    value={newResTime}
                    onChange={e => setNewResTime(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Notas especiales</label>
                <input
                  type="text"
                  placeholder="Ej: Aniversario, mesa decorada..."
                  value={newResNotes}
                  onChange={e => setNewResNotes(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                >
                  Guardar Reserva
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MESAS OCULTAS MODAL */}
      {isHiddenTablesModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 font-display">
                Mesas Ocultas
              </h3>
              <button
                onClick={() => setIsHiddenTablesModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {tables
                .filter(t => t.isHidden)
                .map(table => (
                  <div key={table.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800 block">{table.name}</span>
                      <span className="text-[10px] text-slate-400">{table.area}</span>
                    </div>
                    <button
                      onClick={() => handleToggleHidden(table)}
                      className="px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-bold hover:bg-indigo-100 cursor-pointer"
                    >
                      Mostrar
                    </button>
                  </div>
                ))}

              {tables.filter(t => t.isHidden).length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">No hay mesas ocultas en este momento.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 7. SALON MANAGER / OPCIONES MODAL */}
      {isSalonManagerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 font-display">
                Opciones de Salón y Áreas
              </h3>
              <button
                onClick={() => setIsSalonManagerModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Agregar Nueva Zona / Salón</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ej: Terraza 2, Zona Infantil"
                    value={newSalonName}
                    onChange={e => setNewSalonName(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newSalonName.trim()) return;
                      setActiveArea(newSalonName.trim());
                      // Create a starter table in the new area
                      addTable({
                        name: `${newSalonName.trim()} 1`,
                        area: newSalonName.trim(),
                        capacity: 4,
                        shape: 'cuadrada',
                        status: 'libre',
                        orderTotal: 0,
                      });
                      setNewSalonName('');
                      setIsSalonManagerModalOpen(false);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold cursor-pointer"
                  >
                    Crear
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="font-bold text-slate-700 block mb-1.5">Zonas Existentes</span>
                <div className="space-y-1">
                  {allAreas.map(area => (
                    <div key={area} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 text-slate-700">
                      <span className="font-medium">{area}</span>
                      <span className="text-slate-400 font-mono text-[11px]">
                        {tables.filter(t => t.area === area).length} mesas
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
