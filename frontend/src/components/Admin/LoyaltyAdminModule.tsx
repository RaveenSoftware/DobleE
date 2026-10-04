import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Customer, Reward } from '../../types';
import { formatMoney, getTierBadge } from '../../utils/format';
import {
  Sparkles,
  Gift,
  Users,
  Search,
  Plus,
  Edit2,
  X,
  Award,
  Percent,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';

export const LoyaltyAdminModule: React.FC = () => {
  const {
    customers,
    rewards,
    config,
    updateConfig,
    adjustCustomerPoints,
    loginOrRegisterCustomer,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'customers' | 'rewards' | 'rules'>('customers');
  const [search, setSearch] = useState('');

  // Rules state
  const [pointsPerAmount, setPointsPerAmount] = useState(config.pointsPerAmount);
  const [minPointsToRedeem, setMinPointsToRedeem] = useState(config.minPointsToRedeem);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Manual Adjust Modal
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [pointDiff, setPointDiff] = useState<number>(50);
  const [adjustReason, setAdjustReason] = useState('Bono cortesía');

  // New Customer Modal
  const [isNewCustModalOpen, setIsNewCustModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');

  const filteredCustomers = customers.filter(
    c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  const totalPointsCirculating = customers.reduce((sum, c) => sum + c.points, 0);

  const handleSaveRules = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfig({
      pointsPerAmount: Number(pointsPerAmount),
      minPointsToRedeem: Number(minPointsToRedeem),
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleAdjustPoints = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    adjustCustomerPoints(selectedCustomer.id, pointDiff, adjustReason);
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
      {/* Header and Summary Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900">
            Club de Fidelización & Puntos
          </h2>
          <p className="text-xs text-slate-500">
            Configura cómo los clientes acumulan puntos por cada compra y los canjean por descuentos o granizados gratis.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-amber-50 border border-amber-200 px-3.5 py-1.5 rounded-xl text-xs">
            <span className="text-amber-800 block text-[10px] font-semibold">Puntos en Circulación</span>
            <span className="font-mono font-bold text-amber-900 text-sm">
              {totalPointsCirculating} pts
            </span>
          </div>

          <button
            onClick={() => setIsNewCustModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-teal-600 text-white rounded-xl text-xs font-semibold transition-colors shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>Afiliar Cliente</span>
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl max-w-fit">
        <button
          onClick={() => setActiveTab('customers')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === 'customers'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Clientes Registrados ({customers.length})
        </button>
        <button
          onClick={() => setActiveTab('rewards')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === 'rewards'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Catálogo de Recompensas ({rewards.length})
        </button>
        <button
          onClick={() => setActiveTab('rules')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === 'rules'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Reglas del Programa
        </button>
      </div>

      {/* 1. Customers Tab */}
      {activeTab === 'customers' && (
        <div className="space-y-4">
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div className="relative max-w-sm flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Buscar por teléfono o nombre..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>
            <span className="text-xs text-slate-500">
              Mostrando {filteredCustomers.length} de {customers.length}
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[11px]">
                    <th className="py-3 px-4">Cliente</th>
                    <th className="py-3 px-4">Teléfono / WhatsApp</th>
                    <th className="py-3 px-4">Nivel Club</th>
                    <th className="py-3 px-4 text-right">Puntos Actuales</th>
                    <th className="py-3 px-4 text-right">Histórico Compras</th>
                    <th className="py-3 px-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCustomers.map(c => {
                    const tier = getTierBadge(c.tier);
                    return (
                      <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {c.name}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-600">
                          {c.phone}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold border ${tier.bg}`}
                          >
                            {tier.name}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-amber-700 tabular-nums">
                          {c.points} pts
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-800 tabular-nums">
                          {formatMoney(c.totalSpent, config.currencySymbol)} ({c.ordersCount} compras)
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedCustomer(c);
                              setPointDiff(50);
                              setAdjustReason('Bono cortesía');
                              setIsAdjustModalOpen(true);
                            }}
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
        </div>
      )}

      {/* 2. Rewards Catalog Tab */}
      {activeTab === 'rewards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {rewards.map(reward => (
            <div
              key={reward.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Gift className="w-5 h-5 text-amber-600" />
                </div>
                <h4 className="text-base font-bold text-slate-900 font-display">
                  {reward.title}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {reward.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Puntos requeridos:</span>
                  <span className="font-mono font-bold text-amber-700 tabular-nums">
                    {reward.pointsCost} pts
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Descuento aplicado:</span>
                  <span className="font-mono font-bold text-teal-700 tabular-nums">
                    {formatMoney(reward.discountAmount, config.currencySymbol)}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Consumo mínimo:</span>
                  <span className="font-mono">
                    {formatMoney(reward.minOrderValue, config.currencySymbol)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. Rules & Mechanics Tab */}
      {activeTab === 'rules' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs max-w-xl space-y-5">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 font-display">
              Reglas de Acumulación y Canje
            </h3>
            <p className="text-xs text-slate-500">
              Define cuánto debe consumir el cliente para ganar 1 punto.
            </p>
          </div>

          <form onSubmit={handleSaveRules} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-800 block mb-1">
                Tasa de acumulación (Valor en pesos por cada 1 Punto)
              </label>
              <div className="flex items-center gap-2">
                <span className="font-mono text-slate-500">$</span>
                <input
                  type="number"
                  required
                  value={pointsPerAmount}
                  onChange={e => setPointsPerAmount(Number(e.target.value))}
                  className="w-36 px-3 py-2 rounded-xl border border-slate-200 font-mono text-sm font-bold"
                />
                <span className="text-slate-600 font-medium">= 1 Punto de recompensa</span>
              </div>
              <span className="text-[11px] text-slate-400 block mt-1">
                Ejemplo: Con $100 COP, un pedido de un granizado de $8.500 acumula 85 puntos.
              </span>
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1">
                Mínimo de puntos para permitir canje
              </label>
              <input
                type="number"
                required
                value={minPointsToRedeem}
                onChange={e => setMinPointsToRedeem(Number(e.target.value))}
                className="w-36 px-3 py-2 rounded-xl border border-slate-200 font-mono text-sm font-bold"
              />
              <span className="text-[11px] text-slate-400 block mt-1">
                Evita canjes insignificantes hasta que el cliente acumule al menos esta cantidad.
              </span>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="submit"
                className="px-5 py-2.5 bg-slate-900 hover:bg-teal-600 text-white rounded-xl font-semibold transition-colors"
              >
                Guardar Reglas
              </button>
              {saveSuccess && (
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  ¡Reglas actualizadas!
                </span>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Modal: Adjust points */}
      {isAdjustModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold font-display text-slate-900">
                Ajuste Manual: {selectedCustomer.name}
              </h3>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustPoints} className="space-y-3 text-xs">
              <div>
                <span className="text-slate-500 block">Saldo Actual:</span>
                <span className="font-mono text-lg font-bold text-amber-700">
                  {selectedCustomer.points} pts
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
                  placeholder="Ej: 50 o -30"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Motivo</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  placeholder="Ej: Bonificación, cortesía por aniversario..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-3.5 py-1.5 border border-slate-200 rounded-lg text-slate-600 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 hover:bg-teal-600 text-white rounded-lg font-semibold transition-colors"
                >
                  Guardar
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
            <h3 className="text-base font-bold font-display text-slate-900">
              Registrar Cliente en el Club
            </h3>
            <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-800 block mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Luisa Fernanda Ruiz"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="font-bold text-slate-800 block mb-1">Celular / WhatsApp *</label>
                <input
                  type="tel"
                  required
                  placeholder="Ej: 315 123 4567"
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="font-bold text-slate-800 block mb-1">Correo (Opcional)</label>
                <input
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewCustModalOpen(false)}
                  className="px-3.5 py-1.5 border border-slate-200 rounded-lg text-slate-600 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 hover:bg-teal-600 text-white rounded-lg font-semibold transition-colors"
                >
                  Registrar con Bono (+50 pts)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
