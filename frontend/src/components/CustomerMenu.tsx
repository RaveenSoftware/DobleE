import React, { useState, useEffect, useCallback } from 'react';
import {
  ShoppingBag, Plus, Minus, X, ChevronRight,
  CheckCircle2, Loader2, Star, Sparkles,
} from 'lucide-react';

// ─── Inline helpers ────────────────────────────────────────────────────
const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE = isLocalDev ? 'http://localhost:5000/api' : '/api';

function fmt(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
}

// ─── Types ─────────────────────────────────────────────────────────────
interface Product {
  id: string;
  name: string;
  description?: string;
  basePrice: number;
  category: string;
  image?: string;
  isPopular?: boolean;
  sizePrices?: Record<string, number> | null;
  flavors?: string[];
  allowedToppingIds?: string[] | null;
}

interface Topping {
  id: string;
  name: string;
  price: number;
}

interface Flavor {
  id: string;
  name: string;
}

interface CartItem {
  key: string;
  product: Product;
  quantity: number;
  size: string;
  price: number;
  selectedFlavors: string[];
  selectedToppings: Topping[];
  notes: string;
}

// ─── Size map ──────────────────────────────────────────────────────────
const SIZES = ['Pequeño (12oz)', 'Mediano (16oz)', 'Grande (24oz)', 'Jumbo (32oz)'];

// ─── Main component ────────────────────────────────────────────────────
export const CustomerMenu: React.FC = () => {
  const params = new URLSearchParams(window.location.search);
  const table = params.get('mesa') || null;
  const branchId = params.get('branchId') || undefined;

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [toppings, setToppings] = useState<Topping[]>([]);
  const [flavors, setFlavors] = useState<Flavor[]>([]);
  const [branchName, setBranchName] = useState('DobleE');
  const [branchLogo, setBranchLogo] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('Todos');
  const [cartOpen, setCartOpen] = useState(false);
  const [customizing, setCustomizing] = useState<Product | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');
  const [orderSent, setOrderSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Customizer state
  const [custSize, setCustSize] = useState(SIZES[1]);
  const [custFlavors, setCustFlavors] = useState<string[]>([]);
  const [custToppings, setCustToppings] = useState<Topping[]>([]);
  const [custNotes, setCustNotes] = useState('');

  const fetchMenu = useCallback(async () => {
    setLoading(true);
    try {
      const q = branchId ? `?branchId=${branchId}` : '';
      const res = await fetch(`${API_BASE}/public/menu${q}`);
      const data = await res.json();
      setProducts(data.products || []);
      setToppings(data.toppings || []);
      setFlavors(data.flavors || []);
      setBranchName(data.branch?.name || 'DobleE');
      setBranchLogo(data.branch?.logoUrl || '');
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => { fetchMenu(); }, [fetchMenu]);

  const categories = ['Todos', ...Array.from(new Set(products.map(p => p.category)))];
  const filtered = activeCategory === 'Todos' ? products : products.filter(p => p.category === activeCategory);

  const cartTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  // ── Open customizer ────────────────────────────────────────────────
  const openCustomizer = (prod: Product) => {
    setCustomizing(prod);
    setCustSize(SIZES[1]);
    setCustFlavors([]);
    setCustToppings([]);
    setCustNotes('');
  };

  const custPrice = (): number => {
    let base = customizing?.sizePrices?.[custSize] ?? customizing?.basePrice ?? 0;
    custToppings.forEach(t => { base += t.price; });
    return base;
  };

  const toggleCustFlavor = (name: string) => {
    setCustFlavors(prev =>
      prev.includes(name) ? prev.filter(f => f !== name) : [...prev, name]
    );
  };

  const toggleCustTopping = (t: Topping) => {
    setCustToppings(prev =>
      prev.some(x => x.id === t.id) ? prev.filter(x => x.id !== t.id) : [...prev, t]
    );
  };

  const addToCart = () => {
    if (!customizing) return;
    const key = `${customizing.id}-${Date.now()}`;
    setCart(prev => [...prev, {
      key,
      product: customizing,
      quantity: 1,
      size: custSize,
      price: custPrice(),
      selectedFlavors: custFlavors,
      selectedToppings: [...custToppings],
      notes: custNotes,
    }]);
    setCustomizing(null);
    setCartOpen(true);
  };

  const changeQty = (key: string, delta: number) => {
    setCart(prev =>
      prev.map(i => i.key === key ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i)
    );
  };

  const removeItem = (key: string) => {
    setCart(prev => prev.filter(i => i.key !== key));
  };

  // ── Submit order ────────────────────────────────────────────────────
  const submitOrder = async () => {
    if (!customerName.trim() || cart.length === 0) return;
    setSubmitting(true);
    try {
      const items = cart.map(i => ({
        productId: i.product.id,
        productName: i.product.name,
        size: i.size,
        flavors: i.selectedFlavors,
        toppings: i.selectedToppings.map(t => t.name),
        quantity: i.quantity,
        unitPrice: i.price,
        totalPrice: i.price * i.quantity,
        notes: i.notes,
      }));

      const res = await fetch(`${API_BASE}/public/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerName.trim(),
          tableName: table,
          branchId,
          items,
          notes,
          paymentMethod: 'Efectivo',
        }),
      });

      if (!res.ok) throw new Error('Error');
      setOrderSent(true);
      setCart([]);
    } catch {
      alert('No se pudo enviar el pedido. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Order success ───────────────────────────────────────────────────
  if (orderSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-amber-950 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-10 max-w-sm w-full text-center shadow-2xl">
          <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">¡Pedido Enviado!</h2>
          <p className="text-slate-500 text-sm mb-1">
            Tu pedido está siendo preparado{table ? ` para la <strong>${table}</strong>` : ''}.
          </p>
          <p className="text-slate-400 text-xs mb-8">Te avisamos cuando esté listo 🍧</p>
          <button
            onClick={() => { setOrderSent(false); setCustomerName(''); setNotes(''); }}
            className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-2xl transition-colors"
          >
            Hacer otro pedido
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8FC] pb-44 font-sans">
      {/* ─── Header ─────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white px-5 pt-10 pb-8 rounded-b-[2.5rem] relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-4 right-4 w-40 h-40 border-4 border-white rounded-full" />
          <div className="absolute -bottom-10 -left-10 w-56 h-56 border-4 border-white rounded-full" />
        </div>
        <div className="relative z-10 flex flex-col items-center text-center">
          {branchLogo ? (
            <img src={branchLogo} alt="Logo" className="h-14 w-auto object-contain mb-3 drop-shadow-lg" />
          ) : (
            <h1 className="text-4xl font-black tracking-tight mb-1">
              {branchName}<span className="text-amber-400">.</span>
            </h1>
          )}
          {table ? (
            <div className="mt-3 px-4 py-1.5 bg-amber-500/20 border border-amber-400/30 rounded-full">
              <p className="text-amber-300 text-sm font-semibold">📍 {table}</p>
            </div>
          ) : (
            <p className="text-slate-400 text-sm mt-2">Carta Digital</p>
          )}
        </div>
      </div>

      {/* ─── Categories ─────────────────────────────────────────── */}
      <div className="flex gap-2 px-4 pt-5 pb-2 overflow-x-auto scrollbar-hide">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all ${
              activeCategory === cat
                ? 'bg-amber-500 text-white shadow-md shadow-amber-200'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-amber-300'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ─── Products ───────────────────────────────────────────── */}
      <div className="px-4 pt-2 space-y-3 max-w-lg mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No hay productos disponibles</p>
          </div>
        ) : (
          filtered.map(prod => (
            <div
              key={prod.id}
              className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4 p-4">
                {prod.image ? (
                  <img src={prod.image} alt={prod.name} className="w-20 h-20 rounded-xl object-cover shrink-0 bg-slate-100" />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center shrink-0">
                    <Sparkles className="w-8 h-8 text-amber-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2">
                    <h3 className="font-black text-slate-900 text-base leading-tight">{prod.name}</h3>
                    {prod.isPopular && (
                      <span className="shrink-0 flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-bold rounded-full">
                        <Star className="w-2.5 h-2.5" /> Popular
                      </span>
                    )}
                  </div>
                  {prod.description && (
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{prod.description}</p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-amber-600 font-black text-lg">{fmt(prod.basePrice)}</span>
                    <button
                      onClick={() => openCustomizer(prod)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-amber-500 transition-colors active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" /> Agregar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ─── Floating Cart Button ────────────────────────────────── */}
      {cartCount > 0 && !cartOpen && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-6 py-4 bg-slate-900 text-white rounded-2xl shadow-2xl shadow-slate-900/30 font-bold text-sm hover:bg-amber-500 transition-colors active:scale-95"
        >
          <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-black flex items-center justify-center">{cartCount}</span>
          Ver mi pedido
          <span className="font-black text-amber-300">{fmt(cartTotal)}</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* ─── Customizer Modal ────────────────────────────────────── */}
      {customizing && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-900">{customizing.name}</h3>
                <p className="text-xs text-slate-400">{customizing.category}</p>
              </div>
              <button onClick={() => setCustomizing(null)} className="p-2 hover:bg-slate-100 rounded-full">
                <X className="w-4 h-4 text-slate-600" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Size */}
              {customizing.sizePrices && (
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tamaño</p>
                  <div className="grid grid-cols-2 gap-2">
                    {SIZES.map(s => {
                      const p = customizing.sizePrices?.[s];
                      if (!p && p !== 0) return null;
                      return (
                        <button key={s} onClick={() => setCustSize(s)}
                          className={`px-3 py-2.5 rounded-xl border text-xs font-semibold text-left transition-all ${
                            custSize === s ? 'bg-amber-500 border-amber-500 text-white' : 'border-slate-200 text-slate-700 hover:border-amber-300'
                          }`}>
                          <span className="block font-black">{s.split(' ')[0]}</span>
                          <span className="text-[10px] opacity-80">{fmt(p)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Flavors */}
              {flavors.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Sabor{custFlavors.length > 0 ? ` (${custFlavors.length})` : ''}</p>
                  <div className="flex flex-wrap gap-2">
                    {flavors.map(f => (
                      <button key={f.id} onClick={() => toggleCustFlavor(f.name)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                          custFlavors.includes(f.name) ? 'bg-amber-500 border-amber-500 text-white' : 'border-slate-200 text-slate-600 hover:border-amber-300'
                        }`}>
                        {f.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Toppings */}
              {toppings.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Toppings extra</p>
                  <div className="space-y-2">
                    {toppings.map(t => (
                      <button key={t.id} onClick={() => toggleCustTopping(t)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                          custToppings.some(x => x.id === t.id) ? 'bg-amber-50 border-amber-400 text-amber-900' : 'border-slate-200 text-slate-700 hover:border-amber-200'
                        }`}>
                        <span>{t.name}</span>
                        <span className="text-xs font-bold text-amber-600">{t.price > 0 ? `+${fmt(t.price)}` : 'Gratis'}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Notas (opcional)</p>
                <textarea
                  rows={2}
                  placeholder="Ej: sin azúcar, extra frío..."
                  value={custNotes}
                  onChange={e => setCustNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t border-slate-100 px-5 py-4">
              <button onClick={addToCart}
                className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-2xl transition-colors flex items-center justify-center gap-2 text-sm active:scale-[0.98]">
                <ShoppingBag className="w-4 h-4" />
                Agregar · {fmt(custPrice())}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Cart / Checkout Panel ───────────────────────────────── */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between">
              <h3 className="font-black text-slate-900">Mi Pedido <span className="text-amber-500">({cartCount})</span></h3>
              <button onClick={() => setCartOpen(false)} className="p-2 hover:bg-slate-100 rounded-full">
                <X className="w-4 h-4 text-slate-600" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Cart Items */}
              {cart.map(item => (
                <div key={item.key} className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-slate-900">{item.product.name}</p>
                    <p className="text-[11px] text-slate-500">{item.size}</p>
                    {item.selectedFlavors.length > 0 && (
                      <p className="text-[10px] text-slate-400">🍧 {item.selectedFlavors.join(', ')}</p>
                    )}
                    {item.selectedToppings.length > 0 && (
                      <p className="text-[10px] text-slate-400">+ {item.selectedToppings.map(t => t.name).join(', ')}</p>
                    )}
                    <p className="text-xs font-black text-amber-600 mt-1">{fmt(item.price * item.quantity)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => changeQty(item.key, -1)} className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-300">
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-black text-sm w-4 text-center">{item.quantity}</span>
                    <button onClick={() => changeQty(item.key, 1)} className="w-7 h-7 rounded-full bg-slate-900 flex items-center justify-center text-white hover:bg-amber-500">
                      <Plus className="w-3 h-3" />
                    </button>
                    <button onClick={() => removeItem(item.key)} className="w-7 h-7 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 hover:bg-rose-100 ml-1">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Customer Name */}
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Tu nombre *</label>
                <input
                  type="text"
                  placeholder="¿Cómo te llamas?"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              {/* Order notes */}
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Notas del pedido (opcional)</label>
                <textarea
                  rows={2}
                  placeholder="Indicaciones adicionales..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                />
              </div>

              {/* Total */}
              <div className="flex items-center justify-between py-3 border-t border-slate-100">
                <span className="text-sm font-bold text-slate-600">Total</span>
                <span className="text-xl font-black text-slate-900">{fmt(cartTotal)}</span>
              </div>
            </div>

            {/* Submit */}
            <div className="sticky bottom-0 bg-white border-t border-slate-100 px-5 py-4">
              <button
                onClick={submitOrder}
                disabled={!customerName.trim() || submitting}
                className="w-full py-4 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-black rounded-2xl transition-colors flex items-center justify-center gap-2 text-sm active:scale-[0.98]"
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
                ) : (
                  <><ShoppingBag className="w-4 h-4" /> Confirmar Pedido · {fmt(cartTotal)}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
