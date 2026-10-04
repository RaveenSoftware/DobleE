import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CustomOrderItem, GranizadoProduct } from '../types';
import { ShoppingBag, Plus } from 'lucide-react';
import { formatMoney } from '../utils/format';

export const CustomerMenu: React.FC = () => {
  const { products, createOrder, config } = useApp();
  const [cart, setCart] = useState<CustomOrderItem[]>([]);
  const [orderSent, setOrderSent] = useState(false);
  const [customerName, setCustomerName] = useState('');

  const searchParams = new URLSearchParams(window.location.search);
  const table = searchParams.get('mesa') || 'Mostrador';

  const activeProducts = products.filter(p => p.isAvailable);

  const addToCart = (prod: GranizadoProduct) => {
    const item: CustomOrderItem = {
      id: `item-${Date.now()}`,
      productId: prod.id,
      productName: prod.name,
      size: 'Mediano (16oz)',
      flavors: prod.defaultFlavors && prod.defaultFlavors.length > 0 ? prod.defaultFlavors : ['Clásico'],
      sweetness: 'Normal',
      toppings: [],
      unitPrice: prod.basePrice,
      unitCost: prod.baseCost,
      quantity: 1,
      totalPrice: prod.basePrice,
    };
    setCart([...cart, item]);
  };

  const handleSendOrder = async () => {
    if (cart.length === 0 || !customerName.trim()) return;
    try {
      await createOrder({
        customerType: 'guest',
        customerName: customerName.trim(),
        tableName: table,
        items: cart,
        paymentMethod: 'Efectivo',
        channel: 'Web / Pedido Online',
        notes: 'Pedido desde Carta Virtual',
      });
      setOrderSent(true);
      setCart([]);
    } catch (e) {
      alert('Error al enviar el pedido');
    }
  };

  if (orderSent) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-sm w-full border border-emerald-100">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2 font-display">¡Pedido Recibido!</h2>
          <p className="text-slate-600 mb-8">Tu pedido ha sido enviado a cocina para la <strong className="text-slate-800">{table}</strong>. ¡En breve te atenderemos!</p>
          <button onClick={() => setOrderSent(false)} className="w-full py-4 bg-amber-500 hover:bg-amber-600 transition-colors text-white font-bold rounded-xl shadow-md">
            Hacer otro pedido
          </button>
        </div>
      </div>
    );
  }

  const total = cart.reduce((sum, item) => sum + item.totalPrice, 0);

  return (
    <div className="min-h-screen bg-[#F8F9FD] pb-40 font-sans">
      {/* Header */}
      <div className="bg-slate-900 text-white p-8 rounded-b-3xl shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col items-center text-center">
          <h1 className="text-4xl font-black font-display tracking-tight">{config.name}<span className="text-amber-400">.</span></h1>
          <div className="mt-4 px-4 py-1.5 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
            <p className="text-white text-sm font-semibold tracking-wide">Carta Digital • {table}</p>
          </div>
        </div>
        <div className="absolute -top-10 -right-10 p-8 opacity-[0.03] transform rotate-12">
          <ShoppingBag className="w-48 h-48" />
        </div>
      </div>

      {/* Product List */}
      <div className="p-5 space-y-4 max-w-lg mx-auto">
        <h2 className="text-xl font-black text-slate-900 px-2 mt-4 font-display">Nuestros Productos</h2>
        {activeProducts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 border-dashed">
            <p className="text-slate-500 font-medium">Cargando menú...</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {activeProducts.map(prod => (
              <div key={prod.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60 flex items-center justify-between gap-4 transition-all hover:shadow-md">
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900 text-lg">{prod.name}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1">{prod.description}</p>
                  <p className="text-amber-600 font-black mt-2.5">{formatMoney(prod.basePrice)}</p>
                </div>
                <button 
                  onClick={() => addToCart(prod)}
                  className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shrink-0 hover:scale-105 active:scale-95 transition-transform shadow-md"
                >
                  <Plus className="w-6 h-6 text-amber-400" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Cart */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-5 shadow-[0_-10px_40px_rgba(0,0,0,0.08)] rounded-t-[2.5rem] z-50">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center justify-between mb-5 px-3">
              <span className="font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full text-sm">{cart.length} productos</span>
              <div className="text-right">
                <span className="text-xs text-slate-500 block uppercase font-bold tracking-wider mb-0.5">Total a pagar</span>
                <span className="text-2xl font-black text-slate-900 font-display leading-none">{formatMoney(total)}</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <input 
                type="text" 
                placeholder="¿Cuál es tu nombre?"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium text-slate-800 placeholder:text-slate-400"
              />
              <button 
                onClick={handleSendOrder}
                disabled={!customerName.trim()}
                className="w-full py-4 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-black rounded-2xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <ShoppingBag className="w-5 h-5" />
                Confirmar y Pedir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
