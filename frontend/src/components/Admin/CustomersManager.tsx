import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Customer } from '../../types';
import { formatMoney, formatDate, getTierBadge } from '../../utils/format';
import {
  Users,
  Search,
  Plus,
  Sparkles,
  Award,
  ArrowUpDown,
  Edit3,
  X,
  Phone,
} from 'lucide-react';

export const CustomersManager: React.FC = () => {
  const { customers, config, adjustCustomerPoints, loginOrRegisterCustomer } = useApp();
  const [search, setSearch] = useState('');
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedCust, setSelectedCust] = useState<Customer | null>(null);
  const [pointDiff, setPointDiff] = useState(50);
  const [adjustReason, setAdjustReason] = useState('Bono cortesía');

  // New customer quick add
  const [isNewCustModalOpen, setIsNewCustModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');

  const filtered = customers.filter(
    c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  );

  const openAdjust = (c: Customer) => {
    setSelectedCust(c);
    setPointDiff(50);
    setAdjustReason('Bono cortesía');
    setIsAdjustModalOpen(true);
  };

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCust) return;
    adjustCustomerPoints(selectedCust.id, pointDiff, adjustReason);
    setIsAdjustModalOpen(false);
  };

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) return;
    loginOrRegisterCustomer(newName.trim(), newPhone.trim(), newEmail.trim() || undefined);
    setNewName('');
    setNewPhone('');
    setNewEmail('');
    setIsNewCustModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900">
            Clientes & Club de Fidelización
          </h2>
          <p className="text-xs text-slate-500">
            Directorio de clientes registrados, balance de puntos y niveles de recompensa.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar cliente por teléfono..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="text-xs pl-8 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          <button
            onClick={() => setIsNewCustModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-teal-600 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Cliente</span>
          </button>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[11px]">
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Nivel Club</th>
                <th className="py-3 px-4 text-right">Puntos Disponibles</th>
                <th className="py-3 px-4 text-right">Total Compras</th>
                <th className="py-3 px-4 text-right">Pedidos</th>
                <th className="py-3 px-4">Último Pedido</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(c => {
                const tier = getTierBadge(c.tier);
                return (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 block">{c.name}</span>
                      <span className="text-[11px] text-slate-500 font-mono">{c.phone}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold border ${tier.bg}`}>
                        {tier.name}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-amber-700 tabular-nums">
                      {c.points} pts
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-800 tabular-nums">
                      {formatMoney(c.totalSpent, config.currencySymbol)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-700 tabular-nums">
                      {c.ordersCount}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {c.lastOrderDate || 'Sin compras'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => openAdjust(c)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg border border-teal-200 transition-colors"
                      >
                        Ajustar Puntos
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Adjust points */}
      {isAdjustModalOpen && selectedCust && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold font-display text-slate-900">
                Ajustar Puntos - {selectedCust.name}
              </h3>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-3 text-xs">
              <div>
                <span className="text-slate-500 block">Puntos Actuales:</span>
                <span className="font-mono text-lg font-bold text-amber-700 tabular-nums">
                  {selectedCust.points} pts
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Cantidad de Puntos a Sumar o Restar
                </label>
                <input
                  type="number"
                  required
                  value={pointDiff}
                  onChange={e => setPointDiff(Number(e.target.value))}
                  placeholder="Ej: 50 o -20"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
                />
                <span className="text-[11px] text-slate-400">
                  Usa números negativos (ej: -50) para descontar puntos.
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Motivo / Nota</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  placeholder="Ej: Compensación por demora, cumpleaños..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 hover:bg-teal-600 text-white rounded-lg font-semibold"
                >
                  Guardar Ajuste
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Customer */}
      {isNewCustModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold font-display text-slate-900">Registrar Cliente en Club</h3>
            <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-800 block mb-1">Nombre y Apellido *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Ej: Daniel Ortega"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="font-bold text-slate-800 block mb-1">Teléfono / WhatsApp *</label>
                <input
                  type="tel"
                  required
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value)}
                  placeholder="Ej: 3001234567"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="font-bold text-slate-800 block mb-1">Correo Electrónico (Opcional)</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewCustModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 hover:bg-teal-600 text-white rounded-lg font-semibold"
                >
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
