import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { GranizadoProduct, CategoryType, CustomOrderItem } from '../../types';
import { formatMoney } from '../../utils/format';
import {
  QrCode,
  Smartphone,
  Download,
  Printer,
  Copy,
  Check,
  ExternalLink,
  Store,
  Layers,
  ShoppingBag,
  Sparkles,
  Info,
  CheckCircle2,
  X,
  Plus,
  Minus,
  ChefHat,
  Share2,
} from 'lucide-react';

export const MenuQrManager: React.FC = () => {
  const { products, tables, config, createOrder, setAdminSubTab } = useApp();

  const [selectedTable, setSelectedTable] = useState<string>('all');
  const [allowDirectOrdering, setAllowDirectOrdering] = useState(true);
  const [welcomeMessage, setWelcomeMessage] = useState('¡Bienvenidos a DobleE! Elige tu granizado favorito.');
  const [copiedLink, setCopiedLink] = useState(false);

  // Mobile simulator state
  const [simCategory, setSimCategory] = useState<string>('all');
  const [simCart, setSimCart] = useState<CustomOrderItem[]>([]);
  const [simCustomerName, setSimCustomerName] = useState('Carlos Cliente');
  const [simSelectedProduct, setSimSelectedProduct] = useState<GranizadoProduct | null>(null);
  const [simOrderSentSuccess, setSimOrderSentSuccess] = useState(false);

  const activeProducts = products.filter(p => p.isAvailable);
  const categories = Array.from(new Set(activeProducts.map(p => p.category)));

  const filteredSimProducts = activeProducts.filter(p =>
    simCategory === 'all' ? true : p.category === simCategory
  );

  const qrUrl = selectedTable === 'all'
    ? `${window.location.origin}/?menu=doblee`
    : `${window.location.origin}/?menu=doblee&mesa=${encodeURIComponent(selectedTable)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(qrUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handlePrintQr = () => {
    window.print();
  };

  const handleAddProductToSimCart = (prod: GranizadoProduct) => {
    const item: CustomOrderItem = {
      id: `sim-item-${Date.now()}`,
      productId: prod.id,
      productName: prod.name,
      size: 'Mediano (16oz)',
      flavors: prod.defaultFlavors.length > 0 ? prod.defaultFlavors : ['Mango Biche'],
      sweetness: 'Normal',
      toppings: [],
      unitPrice: prod.basePrice,
      unitCost: prod.baseCost,
      quantity: 1,
      totalPrice: prod.basePrice,
    };
    setSimCart(prev => [...prev, item]);
    setSimSelectedProduct(null);
  };

  const handleSimSendOrder = () => {
    if (simCart.length === 0) return;

    createOrder({
      customerType: 'guest',
      customerName: simCustomerName.trim() || 'Cliente Móvil QR',
      tableName: selectedTable === 'all' ? 'Mesa 1' : selectedTable,
      items: simCart,
      paymentMethod: 'Efectivo',
      channel: 'Web / Pedido Online',
      notes: 'Pedido generado desde el Menú Digital QR',
    });

    setSimOrderSentSuccess(true);
    setSimCart([]);
    setTimeout(() => {
      setSimOrderSentSuccess(false);
    }, 3500);
  };

  const simCartTotal = simCart.reduce((sum, i) => sum + i.totalPrice, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold font-display text-slate-900 tracking-tight">
              Menú Digital & Código QR
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
              Autoservicio para Clientes
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Genera códigos QR para imprimir en las mesas o mostrador, y simula en tiempo real la experiencia del cliente al ordenar desde su smartphone.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? '¡Enlace Copiado!' : 'Copiar Enlace'}</span>
          </button>

          <button
            onClick={handlePrintQr}
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            <span>Imprimir QR</span>
          </button>
        </div>
      </div>

      {/* 2-Column Split: QR Config & Generator + Live Smartphone Interactive Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column (Col 1-5): QR Generation & Customization */}
        <div className="lg:col-span-5 space-y-4">
          {/* QR Generator Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-amber-500" />
                <span>Generador de Código QR</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Sticker de Mesa</span>
            </div>

            {/* Table Selection Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Destino del Código QR:
              </label>
              <select
                value={selectedTable}
                onChange={e => setSelectedTable(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="all">QR General (Mostrador / Barra / Llevar)</option>
                <optgroup label="Mesas del Salón & Terraza">
                  {tables.map(t => (
                    <option key={t.id} value={t.name}>
                      {t.name} ({t.area} · Cap: {t.capacity} pers.)
                    </option>
                  ))}
                </optgroup>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Al escanear un QR con mesa asignada, el pedido llega automáticamente rotulado con esa mesa en cocina.
              </p>
            </div>

            {/* Printable QR Display Board */}
            <div className="p-5 rounded-2xl bg-gradient-to-b from-amber-50/60 to-white border-2 border-dashed border-amber-200/80 text-center flex flex-col items-center justify-center space-y-3">
              <div className="space-y-0.5">
                <span className="text-lg font-black font-display tracking-tight text-slate-900 block">
                  DobleE<span className="text-amber-500">.</span>
                </span>
                <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
                  Granizados Artesanales
                </span>
              </div>

              {/* Real dynamic QR Code */}
              <div className="w-48 h-48 bg-white p-3 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center relative">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrUrl)}`} 
                  alt="QR Code"
                  className="w-full h-full object-contain rounded-lg"
                  crossOrigin="anonymous"
                />
              </div>

              {/* Table Tag Banner */}
              <div className="px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs">
                <Store className="w-3.5 h-3.5 text-amber-400" />
                <span>{selectedTable === 'all' ? 'Mostrador General' : selectedTable}</span>
              </div>

              <p className="text-[11px] text-slate-500 max-w-xs">
                Apunta con la cámara de tu teléfono móvil para abrir la carta digital y ordenar al instante.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={handlePrintQr}
                className="py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-amber-600" />
                <span>Descargar Sticker</span>
              </button>

              <button
                onClick={handleCopyLink}
                className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-slate-600" />
                <span>Compartir Link</span>
              </button>
            </div>
          </div>

          {/* Settings for QR Ordering */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Opciones del Menú Digital
            </h4>

            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <div>
                <span className="text-xs font-semibold text-slate-800 block">
                  Permitir Pedidos Directos
                </span>
                <span className="text-[11px] text-slate-400 block">
                  El cliente puede armar su carrito y enviar la orden a cocina.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowDirectOrdering}
                  onChange={e => setAllowDirectOrdering(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600" />
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mensaje de Bienvenida al Cliente:
              </label>
              <input
                type="text"
                value={welcomeMessage}
                onChange={e => setWelcomeMessage(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Right Column (Col 6-12): Live Interactive Smartphone Simulator */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-amber-500" />
                <span>Simulador del Menú Móvil en Vivo</span>
              </h3>
              <p className="text-xs text-slate-500">
                Así es exactamente como se ve y funciona la carta para un cliente que escanea el QR desde su celular.
              </p>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Simulación Activa</span>
            </div>
          </div>

          {/* Smartphone Frame Simulator */}
          <div className="max-w-md mx-auto bg-slate-900 rounded-[2.5rem] p-3 shadow-xl border-4 border-slate-800">
            {/* Phone Screen Notch & Header */}
            <div className="bg-slate-50 rounded-[2rem] overflow-hidden text-slate-900 min-h-[580px] flex flex-col justify-between relative">
              {/* Top Notch bar */}
              <div className="bg-white px-4 pt-2.5 pb-2 border-b border-slate-100 flex items-center justify-between text-xs sticky top-0 z-20">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-slate-900 font-display">
                    DobleE<span className="text-amber-500">.</span>
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold">
                    {selectedTable === 'all' ? 'Mostrador' : selectedTable}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-[11px] text-slate-500">
                  <span>9:41 AM</span>
                </div>
              </div>

              {/* Order Success Notification Toast inside phone */}
              {simOrderSentSuccess && (
                <div className="absolute top-12 left-3 right-3 z-30 bg-emerald-600 text-white p-3 rounded-2xl shadow-lg flex items-center gap-2 animate-bounce">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <div className="text-xs">
                    <span className="font-bold block">¡Pedido enviado a barra!</span>
                    <span className="text-[11px] opacity-90">Tu mesa recibirá la orden enseguida.</span>
                  </div>
                </div>
              )}

              {/* Main Content inside Phone */}
              <div className="p-3.5 space-y-3.5 overflow-y-auto max-h-[460px]">
                {/* Welcome Card */}
                <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-xs space-y-1">
                  <span className="text-[10px] text-white/90 uppercase font-semibold tracking-wider">
                    Carta Digital DobleE
                  </span>
                  <h4 className="text-sm font-bold font-display">
                    {welcomeMessage}
                  </h4>
                  <p className="text-[11px] text-white/80">
                    Precios en {config.currency} · IVA incluido.
                  </p>
                </div>

                {/* Categories Scroll */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  <button
                    onClick={() => setSimCategory('all')}
                    className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 transition-colors ${
                      simCategory === 'all'
                        ? 'bg-slate-900 text-white'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Todos
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSimCategory(cat)}
                      className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 transition-colors ${
                        simCategory === cat
                          ? 'bg-slate-900 text-white'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Products List */}
                <div className="space-y-2.5">
                  {filteredSimProducts.map(prod => (
                    <div
                      key={prod.id}
                      className="bg-white rounded-xl p-2.5 border border-slate-200/80 shadow-2xs flex gap-3 items-center hover:border-amber-300 transition-colors"
                    >
                      <img
                        src={prod.image}
                        alt={prod.name}
                        className="w-16 h-16 rounded-lg object-cover shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <h5 className="text-xs font-bold text-slate-900 truncate">
                            {prod.name}
                          </h5>
                          <span className="text-xs font-black text-amber-600 shrink-0 font-mono">
                            {formatMoney(prod.basePrice, config.currencySymbol)}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">
                          {prod.description}
                        </p>
                        <div className="mt-1.5 flex items-center justify-between">
                          <span className="text-[9px] text-slate-400 font-semibold">
                            {prod.category}
                          </span>
                          {allowDirectOrdering && (
                            <button
                              onClick={() => handleAddProductToSimCart(prod)}
                              className="px-2 py-0.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Pedir</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Cart Drawer inside Phone */}
              {allowDirectOrdering && (
                <div className="bg-white border-t border-slate-200 p-3 space-y-2 sticky bottom-0 z-20">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <ShoppingBag className="w-4 h-4 text-amber-500" />
                      <span className="font-bold text-slate-900">
                        Tu Carrito ({simCart.reduce((sum, i) => sum + i.quantity, 0)})
                      </span>
                    </div>
                    <span className="font-mono font-black text-sm text-slate-900">
                      {formatMoney(simCartTotal, config.currencySymbol)}
                    </span>
                  </div>

                  {simCart.length > 0 && (
                    <div className="space-y-1.5 pt-1 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Tu Nombre (ej: Carlos)"
                          value={simCustomerName}
                          onChange={e => setSimCustomerName(e.target.value)}
                          className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none"
                        />
                      </div>
                      <button
                        onClick={handleSimSendOrder}
                        className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <ChefHat className="w-3.5 h-3.5 text-amber-400" />
                        <span>Enviar Pedido a Cocina ({formatMoney(simCartTotal, config.currencySymbol)})</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
