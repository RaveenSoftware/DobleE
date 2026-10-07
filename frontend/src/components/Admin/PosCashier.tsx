import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { GranizadoProduct, CupSize, CustomOrderItem, PaymentMethod } from '../../types';
import { sizeModifiers } from '../../data/initialData';
import { formatMoney } from '../../utils/format';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  Minus,
  Trash2,
  Search,
  UserCheck,
  Receipt,
  Lock,
  Unlock,
  DollarSign,
  X,
  ShoppingBag,
  CreditCard,
  Banknote,
  Check,
  Smartphone,
  Droplets,
  Star,
  AlertCircle,
} from 'lucide-react';

const springTrans = { type: 'spring' as const, stiffness: 300, damping: 25 };

interface PosCashierProps {
  onOrderCompleted: () => void;
}

const SIZE_ICONS: Record<CupSize, { emoji: string; oz: string }> = {
  'Pequeño (12oz)': { emoji: '🥤', oz: '12oz' },
  'Mediano (16oz)': { emoji: '🥤', oz: '16oz' },
  'Grande (24oz)': { emoji: '🥤', oz: '24oz' },
};

export const PosCashier: React.FC<PosCashierProps> = ({ onOrderCompleted }) => {
  const {
    currentUser,
    products,
    toppings,
    flavors,
    customers,
    config,
    createOrder,
    cashShift,
    openCashShift,
    closeCashShift,
  } = useApp();

  // Cash Register Opening State
  const [isOpeningModalOpen, setIsOpeningModalOpen] = useState(false);
  const [openingBaseAmount, setOpeningBaseAmount] = useState<number>(100000);
  const [openingCashierName, setOpeningCashierName] = useState<string>(currentUser?.name || 'Administrador');
  const [openingNotes, setOpeningNotes] = useState<string>('Base inicial para cambio');

  // POS Order State
  const [posItems, setPosItems] = useState<CustomOrderItem[]>([]);
  const [posSize, setPosSize] = useState<CupSize>('Mediano (16oz)');
  const [posFlavors, setPosFlavors] = useState<string[]>([]);
  const [posToppings, setPosToppings] = useState<string[]>([]);
  const [posSweetness, setPosSweetness] = useState<'Bajo' | 'Medio' | 'Normal'>('Normal');
  const [posNotes, setPosNotes] = useState('');
  const [assignedTable, setAssignedTable] = useState<string>('');

  // Customer Linking in POS
  const [customerSearch, setCustomerSearch] = useState('');
  const [linkedCustomer, setLinkedCustomer] = useState<(typeof customers)[0] | null>(null);
  const [guestName, setGuestName] = useState('');

  // Cash calculation
  const [cashReceived, setCashReceived] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Efectivo');

  const [selectedProduct, setSelectedProduct] = useState<GranizadoProduct | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Customer search filter
  const foundCustomers = customerSearch.trim()
    ? customers.filter(
        c =>
          c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
          c.phone.includes(customerSearch)
      )
    : [];

  const allCategories = Array.from(new Set(products.map(p => p.category)));
  const filteredProducts = categoryFilter === 'all' ? products : products.filter(p => p.category === categoryFilter);

  const handleProductClick = (product: GranizadoProduct) => {
    setSelectedProduct(product);
    setPosSize('Mediano (16oz)');
    setPosSweetness('Normal');
    setPosToppings([]);
    setPosNotes('');
    // Pre-select product's default flavors
    setPosFlavors(product.defaultFlavors?.slice(0, 2) || []);
  };

  const toggleFlavor = (flavorName: string) => {
    setPosFlavors(prev =>
      prev.includes(flavorName)
        ? prev.filter(f => f !== flavorName)
        : [...prev, flavorName]
    );
  };

  const handleConfirmAdd = () => {
    if (!selectedProduct) return;
    const sizeData = sizeModifiers[posSize];
    const chosenToppings = toppings.filter(t => posToppings.includes(t.id));
    const toppingsPrice = chosenToppings.reduce((s, t) => s + t.price, 0);
    const toppingsCost = chosenToppings.reduce((s, t) => s + t.cost, 0);

    const unitPrice = selectedProduct.basePrice + sizeData.price + toppingsPrice;
    const unitCost = selectedProduct.baseCost + sizeData.cost + toppingsCost;

    const finalFlavors = posFlavors.length > 0 ? posFlavors : selectedProduct.defaultFlavors;

    const newItem: CustomOrderItem = {
      id: `pos-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      size: posSize,
      flavors: finalFlavors,
      sweetness: posSweetness,
      toppings: chosenToppings.map(t => ({
        id: t.id,
        name: t.name,
        price: t.price,
        cost: t.cost,
      })),
      notes: posNotes.trim() || undefined,
      unitPrice,
      unitCost,
      quantity: 1,
      totalPrice: unitPrice,
    };

    setPosItems(prev => [...prev, newItem]);
    setSelectedProduct(null);
  };

  const updateQty = (id: string, delta: number) => {
    setPosItems(prev =>
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

  const subtotal = posItems.reduce((s, i) => s + i.totalPrice, 0);
  const numCashReceived = parseFloat(cashReceived) || 0;
  const changeDue = numCashReceived - subtotal;
  const isEnoughCash = paymentMethod !== 'Efectivo' || cashReceived === '' || numCashReceived >= subtotal;

  const QUICK_CASH_AMOUNTS = [5000, 10000, 20000, 50000].map(v => {
    // Find next multiple of v that covers subtotal
    if (subtotal <= 0) return v;
    return Math.ceil(subtotal / v) * v;
  }).filter((v, i, arr) => arr.indexOf(v) === i).slice(0, 4);

  const handleCompleteSale = () => {
    if (posItems.length === 0) return;

    if (!cashShift.isOpen) {
      setIsOpeningModalOpen(true);
      return;
    }

    createOrder({
      customerType: linkedCustomer ? 'registered' : 'guest',
      customerId: linkedCustomer?.id,
      customerName: linkedCustomer ? linkedCustomer.name : guestName || 'Mostrador',
      customerPhone: linkedCustomer ? linkedCustomer.phone : undefined,
      tableName: assignedTable || undefined,
      items: posItems,
      paymentMethod,
      channel: 'Punto de Venta (POS)',
    });

    setPosItems([]);
    setLinkedCustomer(null);
    setCustomerSearch('');
    setCashReceived('');
    setGuestName('');
    setAssignedTable('');
    onOrderCompleted();
  };

  // Available flavors for the product — from DB or product's own defaultFlavors
  const getAvailableFlavors = (product: GranizadoProduct): string[] => {
    const dbFlavors = flavors.filter(f => f.inStock).map(f => f.name);
    const productFlavors = product.defaultFlavors || [];
    // Merge: show product flavors first, then any extra DB flavors
    const merged = [...productFlavors];
    dbFlavors.forEach(f => { if (!merged.includes(f)) merged.push(f); });
    return merged;
  };

  // Calculate live price preview in modal
  const livePrice = selectedProduct
    ? selectedProduct.basePrice + (sizeModifiers[posSize]?.price || 0) + toppings.filter(t => posToppings.includes(t.id)).reduce((s, t) => s + t.price, 0)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-5"
    >
      {/* ─── Cash Register Header ─── */}
      <div className={`p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 border transition-all ${
        cashShift.isOpen
          ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
          : 'bg-amber-50 border-amber-200 text-amber-950'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            cashShift.isOpen ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
          }`}>
            {cashShift.isOpen ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
          </div>
          <div>
            <h2 className="font-black text-base font-display tracking-tight">
              {cashShift.isOpen ? 'Turno en Curso' : 'Caja Cerrada'}
            </h2>
            <p className="text-xs font-medium opacity-70">
              {cashShift.isOpen
                ? `Responsable: ${cashShift.openedBy || 'Admin'} · Base: ${formatMoney(cashShift.initialAmount, config.currencySymbol)}`
                : 'Debes abrir caja para poder registrar ventas.'
              }
            </p>
          </div>
        </div>
        <div>
          {cashShift.isOpen ? (
            <button
              onClick={() => {
                if (confirm('¿Cerrar el turno de caja actual?')) closeCashShift(cashShift.initialAmount);
              }}
              className="px-4 py-2 rounded-xl border border-emerald-300 bg-white/80 hover:bg-white text-emerald-800 font-bold text-sm flex items-center gap-2 transition"
            >
              <Lock className="w-4 h-4" /> Cerrar Caja
            </button>
          ) : (
            <button
              onClick={() => setIsOpeningModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm flex items-center gap-2 transition shadow-md"
            >
              <Unlock className="w-4 h-4" /> Abrir Caja
            </button>
          )}
        </div>
      </div>

      {/* ─── Main Workspace ─── */}
      {!cashShift.isOpen ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white rounded-3xl border border-amber-100 shadow-sm min-h-[50vh]">
          <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-6">
            <Lock className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-black font-display text-slate-900 mb-2">La caja está cerrada</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mb-8">
            Para poder empezar a registrar ventas, tomar pedidos y facturar, necesitas especificar una base inicial (cambio) y abrir el turno.
          </p>
          <button
            onClick={() => setIsOpeningModalOpen(true)}
            className="px-8 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm flex items-center gap-2 transition shadow-lg shadow-amber-500/30"
          >
            <Unlock className="w-5 h-5" /> Abrir Caja Ahora
          </button>
        </div>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* LEFT PANEL: Menu & Products */}
        <div className="lg:col-span-8 space-y-4">
          {/* Category Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${categoryFilter === 'all' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
            >
              Todos
            </button>
            {allCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${categoryFilter === cat ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
              >
                {cat}
              </button>
            ))}
          </div>

          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
              <ShoppingBag className="w-10 h-10 text-slate-200" />
              <p className="text-sm font-medium text-center">No hay productos disponibles.<br />Crea productos en el módulo de Catálogo.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {filteredProducts.filter(p => p.isAvailable).map(p => (
                <motion.button
                  key={p.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleProductClick(p)}
                  className="group relative h-36 rounded-2xl overflow-hidden shadow-sm border border-slate-200/50 hover:shadow-lg hover:border-emerald-300 transition-all bg-white text-left flex flex-col justify-end"
                >
                  {p.image ? (
                    <img src={p.image} alt={p.name} className="absolute inset-0 w-full h-full object-cover opacity-85 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 to-slate-50 flex items-center justify-center">
                      <ShoppingBag className="w-10 h-10 text-slate-200" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  {p.isPopular && (
                    <div className="absolute top-2 right-2 bg-amber-400 text-white rounded-full p-1 shadow-sm">
                      <Star className="w-3 h-3 fill-white" />
                    </div>
                  )}
                  <div className="relative z-10 p-3 w-full">
                    <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider mb-0.5 block">{p.category}</span>
                    <h4 className="text-white font-bold text-sm leading-tight truncate">{p.name}</h4>
                    <div className="font-black text-emerald-400 font-mono text-sm">
                      {formatMoney(p.basePrice, config.currencySymbol)}
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT PANEL: Cart & Checkout */}
        <div className="lg:col-span-4 relative">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xl overflow-hidden sticky top-20 flex flex-col" style={{ maxHeight: 'calc(100vh - 8rem)' }}>

            {/* Cart Header */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between flex-shrink-0">
              <h3 className="font-black text-base font-display tracking-tight flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-500" /> Orden Actual
              </h3>
              <span className="px-2 py-0.5 bg-slate-200 text-slate-600 text-xs font-bold rounded-lg">
                {posItems.length} items
              </span>
            </div>

            {/* Cart Items Scroll */}
            <div className="flex-1 overflow-y-auto">
              {posItems.length === 0 ? (
                <div className="h-32 flex flex-col items-center justify-center text-slate-400 p-4 text-center gap-2">
                  <ShoppingBag className="w-8 h-8 text-slate-200" />
                  <p className="text-xs font-medium">Selecciona un producto del menú.</p>
                </div>
              ) : (
                <ul className="space-y-1.5 p-2">
                  {posItems.map(item => (
                    <li key={item.id} className="p-2.5 bg-white border border-slate-100 shadow-xs rounded-xl flex gap-2 group hover:border-emerald-200 transition">
                      <div className="flex-1 space-y-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-xs text-slate-900 leading-tight">{item.productName}</span>
                          <span className="font-black text-emerald-600 font-mono text-xs ml-2 shrink-0">{formatMoney(item.totalPrice, config.currencySymbol)}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 leading-relaxed">
                          {item.size.split(' ')[0]} · {item.sweetness} · {item.flavors.join(' + ')}
                          {item.toppings.length > 0 && <span className="text-amber-600"> · +{item.toppings.map(t => t.name).join(', ')}</span>}
                        </div>
                      </div>
                      <div className="flex flex-col justify-between items-end shrink-0">
                        <button onClick={() => updateQty(item.id, -item.quantity)} className="text-slate-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <div className="flex items-center gap-1 bg-slate-50 rounded-lg p-0.5 border border-slate-200">
                          <button onClick={() => updateQty(item.id, -1)} className="w-5 h-5 flex items-center justify-center bg-white rounded-md shadow-xs text-slate-600 hover:text-red-500 text-xs"><Minus className="w-2.5 h-2.5" /></button>
                          <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                          <button onClick={() => updateQty(item.id, 1)} className="w-5 h-5 flex items-center justify-center bg-white rounded-md shadow-xs text-slate-600 hover:text-emerald-500 text-xs"><Plus className="w-2.5 h-2.5" /></button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Checkout Area */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3 flex-shrink-0">

              {/* Customer Link */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cliente (Opcional)</label>
                {!linkedCustomer ? (
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Buscar por nombre o teléfono..."
                      value={customerSearch}
                      onChange={e => setCustomerSearch(e.target.value)}
                      className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-emerald-500 transition-colors bg-white"
                    />
                    <AnimatePresence>
                      {foundCustomers.length > 0 && (
                        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-slate-200 shadow-xl rounded-xl z-20 overflow-hidden">
                          {foundCustomers.slice(0, 3).map(c => (
                            <button key={c.id} onClick={() => { setLinkedCustomer(c); setCustomerSearch(''); }} className="w-full p-2.5 text-left hover:bg-emerald-50 text-xs flex justify-between items-center transition border-b border-slate-50 last:border-0">
                              <span className="font-bold text-slate-800">{c.name} <span className="font-normal text-slate-500">{c.phone}</span></span>
                              <span className="font-mono text-emerald-600 text-[10px]">{c.points} pts</span>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-emerald-100/50 border border-emerald-200 rounded-xl p-2 px-3">
                    <div className="flex items-center gap-1.5 text-emerald-800">
                      <UserCheck className="w-3.5 h-3.5" />
                      <span className="text-xs font-bold">{linkedCustomer.name}</span>
                      <span className="text-[10px] text-emerald-600">{linkedCustomer.points} pts</span>
                    </div>
                    <button onClick={() => setLinkedCustomer(null)} className="text-[10px] font-bold text-emerald-600 hover:text-red-500">Quitar</button>
                  </div>
                )}
              </div>

              {/* Payment Methods */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Forma de Pago</label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => { setPaymentMethod('Efectivo'); setCashReceived(''); }}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition ${
                      paymentMethod === 'Efectivo'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <Banknote className={`w-4 h-4 ${paymentMethod === 'Efectivo' ? 'text-emerald-500' : 'text-slate-400'}`} />
                    Efectivo
                  </button>
                  <button
                    onClick={() => { setPaymentMethod('Transferencia (Nequi/Daviplata)'); setCashReceived(''); }}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition ${
                      paymentMethod === 'Transferencia (Nequi/Daviplata)'
                        ? 'bg-fuchsia-50 border-fuchsia-500 text-fuchsia-700'
                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <Smartphone className={`w-4 h-4 ${paymentMethod === 'Transferencia (Nequi/Daviplata)' ? 'text-fuchsia-500' : 'text-slate-400'}`} />
                    Nequi
                  </button>
                  <button
                    onClick={() => { setPaymentMethod('Tarjeta de Crédito/Débito'); setCashReceived(''); }}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition ${
                      paymentMethod === 'Tarjeta de Crédito/Débito'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <CreditCard className={`w-4 h-4 ${paymentMethod === 'Tarjeta de Crédito/Débito' ? 'text-indigo-500' : 'text-slate-400'}`} />
                    Tarjeta
                  </button>
                </div>
              </div>

              {/* Total & Payment Section */}
              <div className="pt-1.5 border-t border-slate-200 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-600">Total a Cobrar</span>
                  <span className="text-2xl font-black font-mono text-emerald-600 tracking-tight">
                    {formatMoney(subtotal, config.currencySymbol)}
                  </span>
                </div>

                {/* Efectivo: cash received + change */}
                {paymentMethod === 'Efectivo' && (
                  <div className="space-y-2">
                    <div className="relative">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-500 absolute left-3 top-2.5" />
                      <input
                        type="number"
                        placeholder="Efectivo recibido..."
                        value={cashReceived}
                        onChange={e => setCashReceived(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 text-sm font-bold rounded-xl border border-emerald-300 focus:border-emerald-500 outline-none bg-white"
                      />
                    </div>
                    {/* Quick amount buttons */}
                    {subtotal > 0 && (
                      <div className="flex gap-1.5 flex-wrap">
                        {QUICK_CASH_AMOUNTS.map(amt => (
                          <button
                            key={amt}
                            onClick={() => setCashReceived(String(amt))}
                            className="px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-700 hover:bg-emerald-100 transition"
                          >
                            {formatMoney(amt, config.currencySymbol)}
                          </button>
                        ))}
                      </div>
                    )}
                    {cashReceived !== '' && (
                      <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                        changeDue >= 0 ? 'bg-emerald-50 border-emerald-300' : 'bg-red-50 border-red-300'
                      }`}>
                        {changeDue >= 0 ? (
                          <>
                            <span className="text-xs font-bold text-emerald-800">💰 Cambio a devolver:</span>
                            <span className="text-lg font-black text-emerald-700 font-mono">{formatMoney(changeDue, config.currencySymbol)}</span>
                          </>
                        ) : (
                          <>
                            <span className="text-xs font-bold text-red-700 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Falta:</span>
                            <span className="text-base font-black text-red-600 font-mono">{formatMoney(Math.abs(changeDue), config.currencySymbol)}</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Nequi/Daviplata */}
                {paymentMethod === 'Transferencia (Nequi/Daviplata)' && (
                  <div className="p-3 bg-fuchsia-50 rounded-xl border border-fuchsia-200 space-y-1">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-fuchsia-600" />
                      <span className="text-xs font-bold text-fuchsia-800">Pago por Transferencia</span>
                    </div>
                    <p className="text-[10px] text-fuchsia-700 font-medium">
                      Solicita al cliente que realice la transferencia por <strong>{formatMoney(subtotal, config.currencySymbol)}</strong> vía Nequi, Daviplata u otro banco digital, y verifica el comprobante antes de confirmar.
                    </p>
                  </div>
                )}

                {/* Tarjeta */}
                {paymentMethod === 'Tarjeta de Crédito/Débito' && (
                  <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200">
                    <span className="text-xs font-bold text-indigo-700 block">
                      Verifica que el pago por tarjeta o datáfono por <strong>{formatMoney(subtotal, config.currencySymbol)}</strong> se haya procesado correctamente.
                    </span>
                  </div>
                )}

                <button
                  disabled={posItems.length === 0 || !cashShift.isOpen || !isEnoughCash}
                  onClick={handleCompleteSale}
                  className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-black text-white font-black text-base shadow-xl shadow-slate-900/20 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                >
                  <Check className="w-5 h-5" />
                  Cobrar {posItems.length > 0 ? formatMoney(subtotal, config.currencySymbol) : ''}
                </button>
              </div>
            </div>
          </div>
        </div>
        </div>
      )}

      {/* ─── Product Customization Modal ─── */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]"
            >
              {/* Product Hero Image */}
              <div className="relative h-48 bg-slate-100 flex-shrink-0">
                {selectedProduct.image ? (
                  <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-50 to-slate-100">
                    <ShoppingBag className="w-16 h-16 text-emerald-200" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="absolute top-3 right-3 p-2 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-4 left-5 right-5">
                  <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider block">{selectedProduct.category}</span>
                  <h3 className="text-xl font-black font-display text-white leading-tight">{selectedProduct.name}</h3>
                  {selectedProduct.description && (
                    <p className="text-xs text-white/70 mt-0.5 line-clamp-1">{selectedProduct.description}</p>
                  )}
                </div>
                {/* Live price badge */}
                <div className="absolute top-3 left-3 bg-emerald-500 text-white px-3 py-1 rounded-xl font-black text-sm shadow-lg">
                  {formatMoney(livePrice, config.currencySymbol)}
                </div>
              </div>

              <div className="overflow-y-auto flex-1 p-5 space-y-5">

                {/* Size Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="text-base">🥤</span> Tamaño
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Pequeño (12oz)', 'Mediano (16oz)', 'Grande (24oz)'] as CupSize[]).map(s => {
                      const mod = sizeModifiers[s];
                      const sizeName = s.split(' ')[0];
                      const isSelected = posSize === s;
                      return (
                        <button
                          key={s}
                          onClick={() => setPosSize(s)}
                          className={`py-2.5 px-2 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 ${
                            isSelected ? 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/20' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                          <span className="text-base">{SIZE_ICONS[s].emoji}</span>
                          <span>{sizeName}</span>
                          <span className="text-[10px] opacity-60">{SIZE_ICONS[s].oz}</span>
                          {mod.price !== 0 && (
                            <span className={`text-[10px] font-mono ${mod.price > 0 ? 'text-red-400' : 'text-emerald-500'}`}>
                              {mod.price > 0 ? '+' : ''}{formatMoney(mod.price, config.currencySymbol)}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Flavor Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Droplets className="w-3.5 h-3.5 text-blue-400" /> Sabores
                    <span className="text-[10px] font-normal text-slate-400 ml-1">(selecciona uno o varios)</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {getAvailableFlavors(selectedProduct).map(flavorName => {
                      const dbFlavor = flavors.find(f => f.name === flavorName);
                      const isSelected = posFlavors.includes(flavorName);
                      return (
                        <button
                          key={flavorName}
                          onClick={() => toggleFlavor(flavorName)}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-blue-500 text-white border-blue-500 shadow-sm'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {dbFlavor && (
                            <span
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ background: dbFlavor.color }}
                            />
                          )}
                          {isSelected && <Check className="w-3 h-3" />}
                          {flavorName}
                        </button>
                      );
                    })}
                  </div>
                  {posFlavors.length === 0 && (
                    <p className="text-[10px] text-slate-400">Se usarán los sabores por defecto del producto.</p>
                  )}
                </div>

                {/* Sweetness */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Nivel de Dulce</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Bajo', 'Medio', 'Normal'] as const).map(s => (
                      <button
                        key={s}
                        onClick={() => setPosSweetness(s)}
                        className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                          posSweetness === s ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {s === 'Bajo' ? '🍃 Bajo' : s === 'Medio' ? '🍯 Medio' : '🍬 Normal'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Toppings / Adiciones */}
                {toppings.filter(t => t.inStock).length > 0 && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Adiciones Extra</label>
                    <div className="grid grid-cols-2 gap-2">
                      {toppings.filter(t => t.inStock).map(t => (
                        <button
                          key={t.id}
                          onClick={() => setPosToppings(prev => prev.includes(t.id) ? prev.filter(id => id !== t.id) : [...prev, t.id])}
                          className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold transition ${
                            posToppings.includes(t.id) ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <span>{t.name}</span>
                          <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded-md ${posToppings.includes(t.id) ? 'bg-white text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                            +{formatMoney(t.price, config.currencySymbol)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Notas para cocina</label>
                  <textarea
                    rows={2}
                    placeholder="Ej. Sin pitillo, extra hielo, alérgico a..."
                    value={posNotes}
                    onChange={e => setPosNotes(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:border-emerald-500 text-xs bg-slate-50 transition resize-none"
                  />
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 bg-white flex-shrink-0">
                <button
                  onClick={handleConfirmAdd}
                  className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-base flex items-center justify-center gap-2 transition-transform active:scale-[0.98] shadow-lg shadow-emerald-500/30"
                >
                  <Plus className="w-5 h-5" />
                  Añadir al Carrito · <span className="font-mono">{formatMoney(livePrice, config.currencySymbol)}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Open Cash Register Modal ─── */}
      <AnimatePresence>
        {isOpeningModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.form
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              onSubmit={(e) => { e.preventDefault(); openCashShift(openingBaseAmount, openingCashierName, openingNotes); setIsOpeningModalOpen(false); }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-7 space-y-5"
            >
              <div className="text-center space-y-2">
                <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto">
                  <Unlock className="w-7 h-7 text-amber-500" />
                </div>
                <h3 className="text-xl font-black font-display text-slate-900">Apertura de Caja</h3>
                <p className="text-xs text-slate-500">Ingresa el saldo en efectivo base para iniciar el turno.</p>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Responsable</label>
                  <input
                    type="text"
                    value={openingCashierName}
                    onChange={e => setOpeningCashierName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-amber-500 text-sm font-medium transition"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Efectivo Base ({config.currencySymbol})</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={openingBaseAmount}
                    onChange={e => setOpeningBaseAmount(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-amber-500 text-lg font-mono font-bold transition"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Notas (Opcional)</label>
                  <input
                    type="text"
                    value={openingNotes}
                    onChange={e => setOpeningNotes(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-amber-500 text-sm transition"
                  />
                </div>
                <button type="submit" className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-base shadow-lg shadow-amber-500/20 transition-transform active:scale-95">
                  Confirmar Apertura de Caja
                </button>
                <button type="button" onClick={() => setIsOpeningModalOpen(false)} className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition text-sm">
                  Cancelar
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
