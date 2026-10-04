import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Order, OrderStatus } from '../../types';
import { formatMoney, formatDate } from '../../utils/format';
import {
  Clock,
  Play,
  CheckCircle2,
  Truck,
  XCircle,
  Search,
  Eye,
  MessageCircle,
  ShoppingBag,
  Layers,
  ChefHat,
  Sparkles,
} from 'lucide-react';

interface OrdersPipelineProps {
  onViewOrderReceipt: (order: Order) => void;
}

export const OrdersPipeline: React.FC<OrdersPipelineProps> = ({ onViewOrderReceipt }) => {
  const { orders, updateOrderStatus, assignOrderToTable, cancelOrder, tables, config } = useApp();
  const [filterStatus, setFilterStatus] = useState<string>('Activos');
  const [searchQuery, setSearchQuery] = useState('');

  // Counts for top KPI cards
  const pendingCount = orders.filter(o => o.status === 'Pendiente').length;
  const preparingCount = orders.filter(o => o.status === 'En preparación').length;
  const readyCount = orders.filter(o => o.status === 'Listo').length;
  const activeTotal = pendingCount + preparingCount + readyCount;

  const filteredOrders = orders.filter(order => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      order.id.toLowerCase().includes(q) ||
      (order.customerName || '').toLowerCase().includes(q) ||
      (order.customerPhone && order.customerPhone.includes(q)) ||
      (order.tableName && order.tableName.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (filterStatus === 'Activos') {
      return order.status === 'Pendiente' || order.status === 'En preparación' || order.status === 'Listo';
    }
    if (filterStatus === 'Todos') return true;
    return order.status === filterStatus;
  });

  const getStatusBadgeConfig = (status: OrderStatus) => {
    switch (status) {
      case 'Pendiente':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-200/90',
          dot: 'bg-amber-500 animate-pulse',
        };
      case 'En preparación':
        return {
          bg: 'bg-blue-50 text-blue-800 border-blue-200/90',
          dot: 'bg-blue-500 animate-ping',
        };
      case 'Listo':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200/90',
          dot: 'bg-emerald-500',
        };
      case 'Entregado':
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-200',
          dot: 'bg-slate-400',
        };
      case 'Cancelado':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          dot: 'bg-rose-500',
        };
      default:
        return {
          bg: 'bg-slate-50 text-slate-600 border-slate-200',
          dot: 'bg-slate-400',
        };
    }
  };

  const handleWhatsAppContact = (order: Order) => {
    if (!order.customerPhone) return;
    const clean = order.customerPhone.replace(/\D/g, '');
    const msg = `¡Hola ${order.customerName}! Te escribimos de ${config.name} para avisarte que tu pedido #${order.id} está en estado: ${order.status}.`;
    window.open(`https://wa.me/${clean}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="space-y-4 font-sans text-slate-800">
      {/* Top Header & Metrics Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setFilterStatus('Activos')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer shadow-xs ${
            filterStatus === 'Activos'
              ? 'bg-amber-500 text-white border-amber-500 shadow-amber-500/20'
              : 'bg-white border-slate-200/80 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${filterStatus === 'Activos' ? 'text-amber-100' : 'text-slate-500'}`}>
              En Curso
            </span>
            <Layers className="w-4 h-4 opacity-80" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-black font-display tracking-tight">{activeTotal}</span>
            <span className={`text-[11px] font-medium ${filterStatus === 'Activos' ? 'text-amber-100' : 'text-slate-400'}`}>pedidos</span>
          </div>
        </button>

        <button
          onClick={() => setFilterStatus('Pendiente')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer shadow-xs ${
            filterStatus === 'Pendiente'
              ? 'bg-amber-600 text-white border-amber-600 shadow-amber-600/20'
              : 'bg-white border-slate-200/80 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${filterStatus === 'Pendiente' ? 'text-amber-100' : 'text-slate-500'}`}>
              Pendientes
            </span>
            <Clock className="w-4 h-4 opacity-80" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-black font-display tracking-tight">{pendingCount}</span>
            <span className={`text-[11px] font-medium ${filterStatus === 'Pendiente' ? 'text-amber-100' : 'text-slate-400'}`}>por confirmar</span>
          </div>
        </button>

        <button
          onClick={() => setFilterStatus('En preparación')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer shadow-xs ${
            filterStatus === 'En preparación'
              ? 'bg-blue-600 text-white border-blue-600 shadow-blue-600/20'
              : 'bg-white border-slate-200/80 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${filterStatus === 'En preparación' ? 'text-blue-100' : 'text-slate-500'}`}>
              En Barra
            </span>
            <ChefHat className="w-4 h-4 opacity-80" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-black font-display tracking-tight">{preparingCount}</span>
            <span className={`text-[11px] font-medium ${filterStatus === 'En preparación' ? 'text-blue-100' : 'text-slate-400'}`}>preparando</span>
          </div>
        </button>

        <button
          onClick={() => setFilterStatus('Listo')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer shadow-xs ${
            filterStatus === 'Listo'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-emerald-600/20'
              : 'bg-white border-slate-200/80 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${filterStatus === 'Listo' ? 'text-emerald-100' : 'text-slate-500'}`}>
              Listos
            </span>
            <CheckCircle2 className="w-4 h-4 opacity-80" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-black font-display tracking-tight">{readyCount}</span>
            <span className={`text-[11px] font-medium ${filterStatus === 'Listo' ? 'text-emerald-100' : 'text-slate-400'}`}>despachar</span>
          </div>
        </button>
      </div>

      {/* Search and Filter Pill Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Field */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por # pedido, cliente, mesa o teléfono..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-800 transition-colors"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {['Activos', 'Todos', 'Pendiente', 'En preparación', 'Listo', 'Entregado'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                filterStatus === status
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">No hay pedidos registrados con este filtro</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Los nuevos pedidos registrados desde la Caja POS o comanda de meseros aparecerán automáticamente aquí.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredOrders.map(order => {
            const badge = getStatusBadgeConfig(order.status);

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all p-4 flex flex-col justify-between space-y-3.5"
              >
                {/* 1. Header with ID, Status & Timestamp */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-slate-900 px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200">
                        #{order.orderNumber || order.id.split('-')[0]}
                      </span>
                      <span className="text-[11px] font-bold text-slate-700 truncate max-w-[130px]">
                        {order.customerName}
                      </span>
                    </div>

                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-extrabold uppercase tracking-wide border ${badge.bg}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                      <span>{order.status}</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-1 flex-wrap text-[11px] text-slate-400 font-medium pt-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-bold truncate max-w-[120px]">
                        {(order.channel || 'Punto de Venta').replace('Punto de Venta (POS)', 'POS').replace('Punto de Venta', 'POS')}
                      </span>
                      <span>·</span>
                      <span className="truncate">{order.paymentMethod}</span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-400 shrink-0">
                      {formatDate(order.createdAt)}
                    </span>
                  </div>

                  {/* WhatsApp contact option if phone exists */}
                  {order.customerPhone && (
                    <div className="pt-0.5">
                      <button
                        onClick={() => handleWhatsAppContact(order)}
                        className="text-[11px] text-emerald-700 hover:text-emerald-800 font-bold inline-flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60"
                      >
                        <MessageCircle className="w-3 h-3 text-emerald-600" />
                        <span>Avisar cliente WhatsApp ({order.customerPhone})</span>
                      </button>
                    </div>
                  )}

                  {/* 2. Mesa / Salón Location Box (Clean stacked layout) */}
                  <div className="bg-slate-50/90 p-2.5 rounded-xl border border-slate-200/80 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[11px] font-bold text-slate-500">Ubicación / Mesa:</span>
                      <span
                        className={`px-2 py-0.5 rounded-lg font-bold text-[10px] ${
                          order.tableName
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : 'bg-slate-200/70 text-slate-600'
                        }`}
                      >
                        {order.tableName ? `🪑 ${order.tableName}` : '🛍️ Sin mesa (Mostrador)'}
                      </span>
                    </div>

                    <select
                      value={order.tableName || ''}
                      onChange={e => assignOrderToTable(order.id, e.target.value)}
                      aria-label={`Asignar ubicación a pedido ${order.id}`}
                      className="w-full text-[11px] font-bold py-1.5 px-2.5 rounded-lg bg-white border border-slate-200/90 text-slate-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-2xs"
                    >
                      <option value="">-- Asignar o cambiar mesa --</option>
                      <option value="Sin mesa">🛍️ Sin mesa (Mostrador / Para llevar)</option>
                      {tables.map(t => (
                        <option key={t.id} value={t.name}>
                          🪑 {t.name} ({t.area || 'Salón Principal'})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 3. Items List Container */}
                <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/80 space-y-2 text-xs divide-y divide-slate-200/60">
                  {order.items.map((item, idx) => (
                    <div key={idx} className={idx > 0 ? 'pt-2' : ''}>
                      <div className="flex items-start justify-between gap-2 font-bold text-slate-800">
                        <span>
                          {item.quantity}x {item.productName}
                        </span>
                        <span className="font-mono tabular-nums text-slate-900 shrink-0">
                          {formatMoney(item.totalPrice, config.currencySymbol)}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                        {item.size.split(' ')[0]} · {item.flavors.join(', ')}
                      </div>
                      {item.toppings && item.toppings.length > 0 && (
                        <div className="text-[10px] text-slate-500 mt-0.5 bg-white/60 p-1 rounded border border-slate-200/40">
                          + {item.toppings.map(t => t.name).join(', ')}
                        </div>
                      )}
                    </div>
                  ))}

                  {order.notes && (
                    <div className="pt-2 text-[11px] text-amber-900 font-medium italic bg-amber-50/60 p-1.5 rounded-lg border border-amber-200/50">
                      &quot;{order.notes}&quot;
                    </div>
                  )}
                </div>

                {/* 4. Financial Totals */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Cobrado</span>
                    <span className="text-base font-black font-mono text-slate-900 tabular-nums">
                      {formatMoney(order.total, config.currencySymbol)}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Ganancia Neta</span>
                    <span className="text-xs font-bold font-mono text-emerald-600 tabular-nums">
                      +{formatMoney(order.netProfit || order.total * 0.65, config.currencySymbol)}
                    </span>
                  </div>
                </div>

                {/* 5. Status Action Buttons */}
                <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                  {order.status === 'Pendiente' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'En preparación')}
                      className="flex-1 py-2 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Iniciar Preparación</span>
                    </button>
                  )}

                  {order.status === 'En preparación' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'Listo')}
                      className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Marcar como Listo</span>
                    </button>
                  )}

                  {order.status === 'Listo' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'Entregado')}
                      className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Entregar a Cliente</span>
                    </button>
                  )}

                  <button
                    onClick={() => onViewOrderReceipt(order)}
                    className="py-2 px-3 bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    title="Ver Ticket Digital"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    <span>Ticket</span>
                  </button>

                  {order.status !== 'Cancelado' && order.status !== 'Entregado' && (
                    <button
                      onClick={() => {
                        if (confirm(`¿Deseas cancelar el pedido ${order.id}?`)) {
                          cancelOrder(order.id);
                        }
                      }}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Cancelar Pedido"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
