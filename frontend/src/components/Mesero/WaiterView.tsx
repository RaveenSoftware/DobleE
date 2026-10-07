import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  GranizadoProduct,
  CupSize,
  CustomOrderItem,
  PaymentMethod,
  Reward,
  CategoryType,
} from '../../types';
import { sizeModifiers } from '../../data/initialData';
import { formatMoney } from '../../utils/format';
import {
  Plus,
  Minus,
  Trash2,
  Send,
  User,
  Sparkles,
  Check,
  AlertCircle,
  Clock,
  CheckCircle,
  X,
  CreditCard,
  Banknote,
  Smartphone,
  ChevronRight,
  UserCheck,
  Search,
  Bell,
  Settings,
  Heart,
  Star,
  MapPin,
  Utensils,
  Layers,
  ArrowRight,
  Coffee,
  CheckCircle2,
  QrCode,
} from 'lucide-react';

import { MenuQrManager } from '../Admin/MenuQrManager';

export const WaiterView: React.FC = () => {
  const {
    products,
    flavors,
    toppings,
    tables,
    staff,
    activeWaiter,
    setActiveWaiter,
    currentUser,
    config,
    createOrder,
    orders,
    customers,
    loginOrRegisterCustomer,
    rewards,
  } = useApp();

  // Active navigation tab inside Waiter View
  const [waiterTab, setWaiterTab] = useState<'pos' | 'tables' | 'history' | 'club' | 'qr'>('pos');

  // Active table selected
  const [selectedTable, setSelectedTable] = useState<string>('Mesa 1');
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);

  // Category filter
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');

  // Customer identification for this table
  const [customerMode, setCustomerMode] = useState<'guest' | 'club'>('guest');
  const [guestName, setGuestName] = useState('Cliente Mesa');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [matchedCustomer, setMatchedCustomer] = useState<(typeof customers)[0] | null>(null);
  const [appliedReward, setAppliedReward] = useState<Reward | null>(null);

  // Cart/Comanda Items
  const [comandaItems, setComandaItems] = useState<CustomOrderItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Efectivo');
  const [tableNotes, setTableNotes] = useState('');
  const [serviceFeeIncluded, setServiceFeeIncluded] = useState(true);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Granizado Customizer Modal State
  const [customizingProduct, setCustomizingProduct] = useState<GranizadoProduct | null>(null);
  const [customSize, setCustomSize] = useState<CupSize>('Mediano (16oz)');
  const [customFlavors, setCustomFlavors] = useState<string[]>([]);
  const [customSweetness, setCustomSweetness] = useState<'Bajo' | 'Medio' | 'Normal'>('Normal');
  const [customToppings, setCustomToppings] = useState<string[]>([]);
  const [customNotes, setCustomNotes] = useState('');
  const [customQty, setCustomQty] = useState(1);

  // Success Notice State
  const [lastSentOrderId, setLastSentOrderId] = useState<string | null>(null);

  // Lookup customer when phone changes
  const handlePhoneLookup = (phoneVal: string) => {
    setCustomerPhone(phoneVal);
    const clean = phoneVal.replace(/\D/g, '');
    if (clean.length >= 7) {
      const found = customers.find(c => c.phone.replace(/\D/g, '').includes(clean));
      if (found) {
        setMatchedCustomer(found);
        setCustomerName(found.name);
      } else {
        setMatchedCustomer(null);
      }
    } else {
      setMatchedCustomer(null);
    }
  };

  const openCustomizer = (product: GranizadoProduct) => {
    if (!product.isAvailable) return;
    setCustomizingProduct(product);
    setCustomSize('Mediano (16oz)');
    setCustomFlavors(product.defaultFlavors);
    setCustomSweetness('Normal');
    setCustomToppings(['top-1']); // chamoy by default
    setCustomNotes('');
    setCustomQty(1);
  };

  const handleAddCustomizedItem = () => {
    if (!customizingProduct) return;

    const sizeData = sizeModifiers[customSize];
    const chosenToppings = toppings.filter(t => customToppings.includes(t.id));
    const toppingsPrice = chosenToppings.reduce((s, t) => s + t.price, 0);
    const toppingsCost = chosenToppings.reduce((s, t) => s + t.cost, 0);

    const unitPrice = customizingProduct.basePrice + sizeData.price + toppingsPrice;
    const unitCost = customizingProduct.baseCost + sizeData.cost + toppingsCost;

    const newItem: CustomOrderItem = {
      id: `mesero-item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      productId: customizingProduct.id,
      productName: customizingProduct.name,
      size: customSize,
      flavors: customFlavors,
      sweetness: customSweetness,
      toppings: chosenToppings.map(t => ({
        id: t.id,
        name: t.name,
        price: t.price,
        cost: t.cost,
      })),
      notes: customNotes.trim() || undefined,
      unitPrice,
      unitCost,
      quantity: customQty,
      totalPrice: unitPrice * customQty,
    };

    setComandaItems(prev => [...prev, newItem]);
    setCustomizingProduct(null);
  };

  const updateItemQty = (id: string, delta: number) => {
    setComandaItems(prev =>
      prev
        .map(i => {
          if (i.id === id) {
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

  const removeItem = (id: string) => {
    setComandaItems(prev => prev.filter(i => i.id !== id));
  };

  // Calculations
  const rawSubtotal = comandaItems.reduce((s, i) => s + i.totalPrice, 0);
  const discount = appliedReward ? appliedReward.discountAmount : 0;
  const serviceFee = serviceFeeIncluded && rawSubtotal > 0 ? 1000 : 0;
  const total = Math.max(0, rawSubtotal - discount + serviceFee);

  const pointsToEarn =
    customerMode === 'club' ? Math.floor(total / config.pointsPerAmount) : 0;

  // Send comanda to kitchen/bartender
  const handleSendComanda = () => {
    if (comandaItems.length === 0) return;

    let finalCustomer = matchedCustomer;
    if (customerMode === 'club' && !finalCustomer && customerPhone.trim()) {
      finalCustomer = loginOrRegisterCustomer(
        customerName.trim() || 'Cliente Frecuente',
        customerPhone.trim()
      );
    }

    const newOrder = createOrder({
      customerType: customerMode === 'club' ? 'registered' : 'guest',
      customerId: finalCustomer?.id,
      customerName:
        customerMode === 'club'
          ? finalCustomer?.name || customerName.trim() || 'Cliente Club'
          : guestName.trim() || `Cliente ${selectedTable}`,
      customerPhone: finalCustomer?.phone || (customerMode === 'club' ? customerPhone : undefined),
      tableName: selectedTable,
      waiterId: activeWaiter?.id,
      waiterName: activeWaiter?.name,
      items: comandaItems,
      paymentMethod,
      channel: 'Comanda Mesero',
      notes: tableNotes.trim() || undefined,
      appliedReward,
    });

    setLastSentOrderId(newOrder.id);
    // Reset table order state
    setComandaItems([]);
    setAppliedReward(null);
    setTableNotes('');
    setGuestName('Cliente Mesa');
    setCustomerPhone('');
    setCustomerName('');
    setMatchedCustomer(null);
  };

  // Filtered products
  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
    const matchesQuery =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  // Categories list
  const categories = ['Todos', 'Frutales', 'Cítricos & Chamoy', 'Cremosos', 'Especiales'];

  // Orders taken by this waiter
  const myRecentOrders = orders.filter(
    o => o.waiterId === activeWaiter?.id || o.channel === 'Comanda Mesero'
  );
  const myTodaySales = myRecentOrders
    .filter(o => o.status !== 'Cancelado')
    .reduce((s, o) => s + o.total, 0);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 font-sans">
      {/* 3-Column GoMeal Style App Layout: Left Sidebar + Center Showcase + Right Balance & Cart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* 1. Left Sidebar Navigation (2 cols on lg, or compact) */}
        <aside className="lg:col-span-2 bg-white rounded-3xl p-4 border border-slate-100 shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-6">
            <div className="px-2 pt-1">
              <span className="text-xl font-black text-slate-900 font-display tracking-tight">
                DobleE<span className="text-amber-500">.</span>
              </span>
              <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">
                POS Mesero
              </span>
            </div>

            <nav className="space-y-1.5">
              <button
                onClick={() => setWaiterTab('pos')}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                  waiterTab === 'pos'
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Utensils className="w-4 h-4" />
                <span>Comandas</span>
              </button>

              <button
                onClick={() => setWaiterTab('tables')}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                  waiterTab === 'tables'
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <MapPin className="w-4 h-4" />
                <span>Mesas</span>
              </button>

              <button
                onClick={() => setWaiterTab('history')}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                  waiterTab === 'history'
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>Mi Turno</span>
              </button>

              <button
                onClick={() => setWaiterTab('club')}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                  waiterTab === 'club'
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Club Puntos</span>
              </button>

              <button
                onClick={() => setWaiterTab('qr')}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                  waiterTab === 'qr'
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span>Menú QR</span>
              </button>
            </nav>
          </div>

          {/* Active Waiter Badge Card in Sidebar */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-white space-y-2 shadow-xs">
            <span className="text-[10px] uppercase font-bold text-white/80 block">
              Mesero en Turno
            </span>
            <div className="font-black text-sm text-white font-display truncate">
              {activeWaiter?.name || currentUser?.name || 'Mesero Activo'}
            </div>
            <div className="text-[10px] text-white/90">
              PIN Asignado: <strong className="font-mono">{activeWaiter?.pin || '1234'}</strong>
            </div>
          </div>
        </aside>

          {/* Center Content: Menu Showcase & Category Cards (6 cols) */}
        {waiterTab === 'qr' ? (
          <div className="lg:col-span-10">
            <MenuQrManager />
          </div>
        ) : (
          <div className="lg:col-span-6 space-y-6">
            {/* Top Bar: "Hello, Patricia" Style Header + Search */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-display tracking-tight flex items-center gap-2">
                <span>Hola, {activeWaiter?.name || currentUser?.name || 'Mesero'}</span>
                <span>👋</span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Mesa actual: <strong className="text-amber-600 font-bold">{selectedTable}</strong> · {tables.find(t => t.name === selectedTable)?.area || 'Salón'}
              </p>
            </div>

            {/* Search Input (GoMeal style) */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar sabor o producto..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-2xl bg-slate-50 border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Yellow Promotional Hero Banner (Directly inspired by GoMeal image.png) */}
          <div className="bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 rounded-3xl p-6 text-white relative overflow-hidden shadow-sm flex items-center justify-between gap-4">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/20 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-amber-600/30 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 space-y-2 max-w-sm">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/25 text-[10px] font-bold uppercase tracking-wider">
                Especial de la Casa
              </span>
              <h2 className="text-xl sm:text-2xl font-black font-display tracking-tight leading-tight text-white">
                ¡Granizados Artesanales con Chamoy & Fruta Natural!
              </h2>
              <p className="text-xs text-white/90 leading-relaxed">
                Nieve de mango biche, tajín mexicano, lechera y toppings crujientes.
              </p>
            </div>

            <div className="relative z-10 hidden sm:block shrink-0 w-32 h-24 rounded-2xl overflow-hidden shadow-md border-2 border-white/40">
              <img
                src="/src/assets/images/granizados_hero_banner_1790537423050.jpg"
                alt="Banner Granizados"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          {/* Categories Horizontal Bar (GoMeal Category selector) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 font-display">Categorías</h3>
              <span className="text-xs text-amber-600 font-semibold cursor-pointer">
                {products.length} productos
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {categories.map(cat => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`p-3 rounded-2xl border transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer text-center ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/70 text-amber-950 font-bold shadow-xs'
                        : 'border-slate-100 bg-white hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <span className="text-lg">
                      {cat === 'Todos' ? '🍧' : cat === 'Frutales' ? '🍓' : cat === 'Cítricos & Chamoy' ? '🥭' : cat === 'Cremosos' ? '☕' : '✨'}
                    </span>
                    <span className="text-[11px] truncate w-full font-medium">{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Popular Dishes / Products Grid (Matching image.png product cards) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 font-display">
                Granizados Disponibles
              </h3>
              <span className="text-xs text-slate-400">
                Mostrando {filteredProducts.length} recetas
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredProducts.map(product => (
                <div
                  key={product.id}
                  className="bg-white rounded-3xl p-3.5 border border-slate-100 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group relative"
                >
                  {/* Top discount or popular tag */}
                  <div className="relative rounded-2xl overflow-hidden aspect-4/3 bg-slate-100 mb-3">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />

                    {product.isPopular && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold shadow-xs">
                        Top Venta
                      </span>
                    )}

                    {!product.isAvailable && (
                      <span className="absolute inset-0 bg-slate-900/60 backdrop-blur-2xs text-white text-xs font-bold flex items-center justify-center">
                        Agotado
                      </span>
                    )}

                    <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/80 backdrop-blur-xs flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors">
                      <Heart className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-1 text-amber-500 text-xs mb-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-slate-700 font-bold text-[11px]">4.9</span>
                    <span className="text-slate-400 text-[10px]">(+120)</span>
                  </div>

                  {/* Product Title & Category */}
                  <div className="space-y-1 mb-3">
                    <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-1 group-hover:text-amber-600 transition-colors">
                      {product.name}
                    </h4>
                    <p className="text-[11px] text-slate-400 line-clamp-1">
                      {product.description}
                    </p>
                  </div>

                  {/* Price & Golden "+" Button (matching GoMeal) */}
                  <div className="pt-2 border-t border-slate-50 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Precio Base</span>
                      <span className="text-sm font-black font-mono text-slate-900">
                        {formatMoney(product.basePrice, config.currencySymbol)}
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={!product.isAvailable}
                      onClick={() => openCustomizer(product)}
                      className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold transition-all cursor-pointer shadow-sm ${
                        product.isAvailable
                          ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20 active:scale-95'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                      title="Personalizar y Agregar a Comanda"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          </div>
        )}

        {/* 3. Right Sidebar: "Your Balance" & "Order Menu" (4 cols - matching image.png right column) */}
        {waiterTab !== 'qr' && (
          <div className="lg:col-span-4 space-y-5">
            {/* Top Icons & User Status Row */}
          <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {activeWaiter?.name?.charAt(0) || 'M'}
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block truncate max-w-[120px]">
                  {activeWaiter?.name || 'Mesero Activo'}
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Turno Abierto
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-slate-400">
              <button
                onClick={() => setIsTableModalOpen(true)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 text-xs font-semibold flex items-center gap-1 border border-slate-200"
              >
                <MapPin className="w-3.5 h-3.5 text-amber-500" />
                <span>{selectedTable}</span>
              </button>
            </div>
          </div>

          {/* Your Balance Card (GoMeal style orange gradient balance widget) */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-3xl p-5 text-white shadow-sm space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-white/90">
              <span className="font-semibold uppercase tracking-wider text-[10px]">
                Tu Balance en Turno
              </span>
              <span className="font-mono text-[11px] bg-white/20 px-2 py-0.5 rounded-full">
                {myRecentOrders.length} pedidos
              </span>
            </div>

            {/* White inner balance card */}
            <div className="bg-white rounded-2xl p-4 text-slate-900 flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                  Ventas Acumuladas
                </span>
                <div className="text-xl font-black font-display text-slate-900">
                  {formatMoney(myTodaySales, config.currencySymbol)}
                </div>
              </div>

              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Utensils className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setCustomerMode(customerMode === 'guest' ? 'club' : 'guest')}
                className="flex-1 py-2 px-3 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-xs text-white text-xs font-bold transition-colors text-center cursor-pointer"
              >
                {customerMode === 'club' ? '★ Modo Club Activo' : '+ Asociar Club Puntos'}
              </button>
            </div>
          </div>

          {/* Mesa & Cliente Context (Your Address in GoMeal) */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Mesa Asignada
              </span>
              <button
                onClick={() => setIsTableModalOpen(true)}
                className="text-xs font-bold text-amber-600 hover:text-amber-700 underline"
              >
                Cambiar Mesa
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-slate-900 truncate">
                  {selectedTable}
                </h4>
                <p className="text-[11px] text-slate-400">
                  {customerMode === 'club' && matchedCustomer
                    ? `Cliente: ${matchedCustomer.name} (${matchedCustomer.tier})`
                    : 'Cliente Ocasional / Invitado'}
                </p>
              </div>
            </div>

            {/* Club Points Phone Quick Search if in club mode */}
            {customerMode === 'club' && (
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <label className="text-[11px] font-bold text-slate-700 block">
                  WhatsApp del Cliente (para acumular puntos):
                </label>
                <div className="relative">
                  <Smartphone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    placeholder="Ej: 3124567890"
                    value={customerPhone}
                    onChange={e => handlePhoneLookup(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>

                {matchedCustomer ? (
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs flex items-center justify-between">
                    <div>
                      <strong className="text-slate-900 block font-bold">{matchedCustomer.name}</strong>
                      <span className="text-[10px] text-amber-800">
                        {matchedCustomer.points} pts acumulados ({matchedCustomer.tier})
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-200 text-amber-900 rounded-full">
                      +{pointsToEarn} pts hoy
                    </span>
                  </div>
                ) : customerPhone.length >= 7 ? (
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      placeholder="Nombre del nuevo cliente..."
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200"
                    />
                    <span className="text-[10px] text-slate-400 block">
                      Se registrará automáticamente al enviar la comanda.
                    </span>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Order Menu (Comanda Activa - matches GoMeal Order Menu) */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 font-display">
                Comanda de la Mesa
              </h3>
              <span className="text-xs font-mono font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full">
                {comandaItems.reduce((s, i) => s + i.quantity, 0)} items
              </span>
            </div>

            {/* Items list */}
            {comandaItems.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs space-y-2">
                <Coffee className="w-8 h-8 mx-auto text-slate-300" />
                <p>No hay granizados en la comanda aún.</p>
                <p className="text-[11px] text-slate-400">
                  Presiona el botón "+" en cualquier granizado para agregarlo.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {comandaItems.map(item => {
                  const matchProd = products.find(p => p.id === item.productId);
                  return (
                    <div
                      key={item.id}
                      className="p-3 rounded-2xl border border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-slate-200">
                        <img
                          src={matchProd?.image || '/src/assets/images/granizado_mango_chamoy_1790537433959.jpg'}
                          alt={item.productName}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-900 truncate">
                          {item.productName}
                        </h4>
                        <span className="text-[10px] text-slate-400 block truncate">
                          {item.size} · {item.flavors.join(' + ')}
                        </span>
                        <span className="text-[11px] font-mono font-bold text-amber-600">
                          {formatMoney(item.totalPrice, config.currencySymbol)}
                        </span>
                      </div>

                      {/* Stepper +/- */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => updateItemQty(item.id, -1)}
                          className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center justify-center font-bold"
                        >
                          <Minus className="w-3 h-3" />
                        </button>

                        <span className="w-5 text-center font-bold font-mono text-xs">
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() => updateItemQty(item.id, 1)}
                          className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center justify-center font-bold"
                        >
                          <Plus className="w-3 h-3" />
                        </button>

                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="p-1 text-slate-300 hover:text-rose-600 ml-1"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Financial Totals Breakdown (Matching GoMeal breakdown) */}
            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-500">
                <span>Subtotal</span>
                <span className="font-mono font-semibold text-slate-800">
                  {formatMoney(rawSubtotal, config.currencySymbol)}
                </span>
              </div>

              {discount > 0 && (
                <div className="flex items-center justify-between text-emerald-600 font-semibold">
                  <span>Descuento Club Puntos</span>
                  <span className="font-mono">
                    -{formatMoney(discount, config.currencySymbol)}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between text-slate-500">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={serviceFeeIncluded}
                    onChange={e => setServiceFeeIncluded(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-amber-500"
                  />
                  <span>Servicio / Propina sugerida</span>
                </label>
                <span className="font-mono font-semibold text-slate-800">
                  +{formatMoney(serviceFee, config.currencySymbol)}
                </span>
              </div>

              {/* Payment Method Selector */}
              <div className="pt-2">
                <span className="text-[11px] font-bold text-slate-700 block mb-1">
                  Método de Pago Acordado
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['Efectivo', 'Transferencia (Nequi/Daviplata)', 'Tarjeta de Crédito/Débito'] as PaymentMethod[]).map(
                    pm => (
                      <button
                        key={pm}
                        type="button"
                        onClick={() => setPaymentMethod(pm)}
                        className={`p-1.5 rounded-xl border text-[10px] font-bold text-center truncate transition-colors ${
                          paymentMethod === pm
                            ? 'bg-amber-500 text-white border-amber-500'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        {pm.includes('Efectivo')
                          ? 'Efectivo'
                          : pm.includes('Transferencia')
                          ? 'Nequi / Transf.'
                          : 'Tarjeta'}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Total Display */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 font-bold uppercase block">
                    Total a Cobrar
                  </span>
                  {customerMode === 'club' && pointsToEarn > 0 && (
                    <span className="text-[10px] text-amber-600 font-bold">
                      +{pointsToEarn} pts para el cliente
                    </span>
                  )}
                </div>
                <div className="text-2xl font-black font-display font-mono text-slate-900">
                  {formatMoney(total, config.currencySymbol)}
                </div>
              </div>

              {/* Action Button (GoMeal golden checkout button) */}
              <button
                type="button"
                disabled={comandaItems.length === 0}
                onClick={handleSendComanda}
                className={`w-full py-3.5 px-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
                  comandaItems.length > 0
                    ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/25 active:scale-95'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>Confirmar & Enviar a Preparación</span>
              </button>
            </div>
          </div>
          </div>
        )}
      </div>

      {/* Product Customizer Modal */}
      {customizingProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-100">
                  <img
                    src={customizingProduct.image}
                    alt={customizingProduct.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-amber-600">
                    {customizingProduct.category}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 font-display">
                    {customizingProduct.name}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setCustomizingProduct(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Size Options */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 block">
                1. Selecciona el Tamaño de Copa
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Pequeño (12oz)', 'Mediano (16oz)', 'Grande (24oz)'] as CupSize[]).map(sz => {
                  const mod = sizeModifiers[sz];
                  const isSelected = customSize === sz;
                  return (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setCustomSize(sz)}
                      className={`p-2.5 rounded-2xl border text-center transition-all ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50 text-amber-950 font-bold'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="text-xs font-bold">{sz.split(' ')[0]}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {sz.match(/\((.*?)\)/)?.[1]}
                      </div>
                      <div className="text-[11px] font-bold text-amber-600 font-mono mt-1">
                        {mod.price > 0 ? `+${formatMoney(mod.price, config.currencySymbol)}` : 'Base'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Flavor Combinations */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 block">
                2. Sabores de Nieve en Máquina
              </label>
              <div className="flex flex-wrap gap-2">
                {flavors.map(f => {
                  const isSelected = customFlavors.includes(f.name);
                  return (
                    <button
                      key={f.id}
                      type="button"
                      disabled={!f.inStock}
                      onClick={() => {
                        if (isSelected) {
                          setCustomFlavors(prev => prev.filter(fl => fl !== f.name));
                        } else {
                          setCustomFlavors(prev => [...prev, f.name]);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl border text-xs flex items-center gap-1.5 transition-all ${
                        isSelected
                          ? 'border-amber-500 bg-amber-500 text-white font-bold shadow-xs'
                          : f.inStock
                          ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                          : 'border-slate-200 bg-slate-100 text-slate-400 line-through opacity-60'
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: f.color }}
                      />
                      <span>{f.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Toppings Multi-Select */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 block">
                3. Toppings & Adiciones
              </label>
              <div className="grid grid-cols-2 gap-2">
                {toppings.map(t => {
                  const isChecked = customToppings.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        if (isChecked) {
                          setCustomToppings(prev => prev.filter(id => id !== t.id));
                        } else {
                          setCustomToppings(prev => [...prev, t.id]);
                        }
                      }}
                      className={`p-2 rounded-xl border text-left flex items-center justify-between text-xs transition-all ${
                        isChecked
                          ? 'border-amber-500 bg-amber-50/70 text-amber-950 font-bold'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="truncate">{t.name}</span>
                      <span className="font-mono text-[10px] text-amber-600 font-bold ml-1 shrink-0">
                        +{formatMoney(t.price, config.currencySymbol)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sweetness */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 block">
                4. Nivel de Dulzura
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Bajo', 'Medio', 'Normal'] as const).map(lvl => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setCustomSweetness(lvl)}
                    className={`py-1.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                      customSweetness === lvl
                        ? 'border-amber-500 bg-amber-500 text-white shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity and Add Button */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCustomQty(Math.max(1, customQty - 1))}
                  className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center font-bold"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-6 text-center font-bold font-mono text-sm">{customQty}</span>
                <button
                  type="button"
                  onClick={() => setCustomQty(customQty + 1)}
                  className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center font-bold"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddCustomizedItem}
                className="flex-1 py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Agregar a Comanda</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table Selection Modal */}
      {isTableModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold font-display text-slate-900">
                Seleccionar Mesa o Ubicación
              </h3>
              <button
                onClick={() => setIsTableModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 max-h-[60vh] overflow-y-auto p-1">
              {tables.map(tbl => (
                <button
                  key={tbl.id}
                  onClick={() => {
                    setSelectedTable(tbl.name);
                    setIsTableModalOpen(false);
                  }}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedTable === tbl.name
                      ? 'border-amber-500 bg-amber-50 font-bold text-amber-950 ring-1 ring-amber-300'
                      : tbl.status === 'ocupada'
                      ? 'border-amber-200 bg-amber-50/40 text-amber-900'
                      : tbl.status === 'cuenta'
                      ? 'border-indigo-200 bg-indigo-50/40 text-indigo-900'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">{tbl.name}</span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        tbl.status === 'libre'
                          ? 'bg-emerald-500'
                          : tbl.status === 'ocupada'
                          ? 'bg-amber-500'
                          : tbl.status === 'cuenta'
                          ? 'bg-indigo-500'
                          : 'bg-purple-500'
                      }`}
                    />
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {tbl.area} · {tbl.capacity || 4}p ({tbl.status})
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sent Order Confirmation Banner / Modal */}
      {lastSentOrderId && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white rounded-3xl p-5 shadow-2xl border border-slate-800 max-w-sm w-full flex items-center justify-between gap-4 animate-in slide-in-from-bottom">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold block">
                ¡Comanda {lastSentOrderId} Enviada!
              </span>
              <span className="text-[11px] text-slate-300">
                Enviada a preparación para {selectedTable}.
              </span>
            </div>
          </div>

          <button
            onClick={() => setLastSentOrderId(null)}
            className="p-1 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
