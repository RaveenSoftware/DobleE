import React from 'react';
import { Order } from '../types';
import { useApp } from '../context/AppContext';
import { formatMoney, formatDate } from '../utils/format';
import { Printer, X, MessageCircle } from 'lucide-react';

interface ReceiptModalProps {
  order: Order | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ order, onClose }) => {
  const { config } = useApp();

  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsApp = () => {
    if (!order.customerPhone) return;
    const clean = order.customerPhone.replace(/\D/g, '');
    const msg = `¡Hola ${order.customerName}! Tu pedido #${order.id} por un total de ${formatMoney(order.total, config.currencySymbol)} se encuentra en estado: ${order.status}. ¡Gracias por preferir ${config.name}!`;
    window.open(`https://wa.me/${clean}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden relative">
        <button
          onClick={onClose}
          className="print:hidden absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div id="printable-receipt" className="p-6 space-y-4">
          <div className="text-center pb-3 border-b border-dashed border-slate-300 space-y-1">
            <h2 className="text-lg font-bold font-display text-slate-900">{config.name}</h2>
            <p className="text-[11px] text-slate-500">{config.address}</p>
            <p className="text-[11px] text-slate-500">WhatsApp: {config.phoneWhatsApp}</p>
            <span className="inline-block mt-1 font-mono text-xs font-bold bg-slate-100 px-2 py-0.5 rounded">
              Ticket #{order.id}
            </span>
          </div>

          <div className="text-xs space-y-1 text-slate-600 font-mono">
            <div className="flex justify-between">
              <span>Fecha:</span>
              <span>{formatDate(order.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span>Cliente:</span>
              <span className="font-bold text-slate-800">{order.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span>Canal:</span>
              <span>{order.channel}</span>
            </div>
            <div className="flex justify-between">
              <span>Pago:</span>
              <span>{order.paymentMethod}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-dashed border-slate-300 divide-y divide-slate-100 text-xs font-mono">
            {order.items.map((item, idx) => (
              <div key={idx} className="py-1.5 space-y-0.5">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>{item.quantity}x {item.productName}</span>
                  <span>{formatMoney(item.totalPrice, config.currencySymbol)}</span>
                </div>
                <div className="text-[10px] text-slate-500 font-sans">
                  {item.size} · {item.flavors.join('/')}
                  {item.toppings.length > 0 && ` + ${item.toppings.map(t => t.name).join(', ')}`}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-300 space-y-1 text-xs font-mono">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>{formatMoney(order.subtotal, config.currencySymbol)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-teal-700 font-bold">
                <span>Descuento</span>
                <span>-{formatMoney(order.discount, config.currencySymbol)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-200">
              <span>TOTAL</span>
              <span>{formatMoney(order.total, config.currencySymbol)}</span>
            </div>
            {order.pointsEarned > 0 && (
              <div className="text-center text-[11px] text-amber-700 font-sans pt-1">
                ★ Puntos ganados en esta compra: +{order.pointsEarned} pts ★
              </div>
            )}
          </div>

          <div className="text-center text-[10px] text-slate-400 pt-3 border-t border-dashed border-slate-300">
            ¡Gracias por refrescarte con nosotros!
          </div>

          <div className="print:hidden pt-3 flex gap-2">
            <button
              onClick={handlePrint}
              className="flex-1 py-2 px-3 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-xl flex items-center justify-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir Ticket</span>
            </button>
            {order.customerPhone && (
              <button
                onClick={handleWhatsApp}
                className="py-2 px-3 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl flex items-center justify-center gap-1.5"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
