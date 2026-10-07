import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Customer, Reward, GranizadoProduct } from '../../types';
import { formatMoney, getTierBadge } from '../../utils/format';
import {
  Users,
  Sparkles,
  Gift,
  Search,
  Plus,
  Edit2,
  Trash2,
  Award,
  CheckCircle2,
  X,
  Coins,
  Tag,
  Settings2,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

export const UsersManager: React.FC = () => {
  const {
    customers,
    rewards,
    products,
    config,
    updateConfig,
    adjustCustomerPoints,
    loginOrRegisterCustomer,
    updateProduct,
    addReward,
    updateReward,
    deleteReward,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'customers' | 'product_points' | 'rewards'>('customers');
  const [search, setSearch] = useState('');

  // New Customer Modal
  const [isNewCustModalOpen, setIsNewCustModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');

  // Manual Adjust Modal
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [pointDiff, setPointDiff] = useState<number>(50);
  const [adjustReason, setAdjustReason] = useState('Bono cortesía');

  // Reward Modal
  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);
  const [editingRewardId, setEditingRewardId] = useState<string | null>(null);
  const [rewardTitle, setRewardTitle] = useState('');
  const [rewardDesc, setRewardDesc] = useState('');
  const [rewardPointsCost, setRewardPointsCost] = useState(250);
  const [rewardDiscountAmount, setRewardDiscountAmount] = useState(2500);
  const [rewardMinOrder, setRewardMinOrder] = useState(8000);
  const [rewardSelectedProducts, setRewardSelectedProducts] = useState<string[]>([]);

  // Global Points Rule
  const [pointsPerAmount, setPointsPerAmount] = useState(config.pointsPerAmount || 100);
  const [minPointsToRedeem, setMinPointsToRedeem] = useState(config.minPointsToRedeem || 200);
  const [ruleSavedToast, setRuleSavedToast] = useState(false);

  const filteredCustomers = customers.filter(
    c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  );

  const totalPointsCirculating = customers.reduce((sum, c) => sum + c.points, 0);
  const totalCustomerSpend = customers.reduce((sum, c) => sum + c.totalSpent, 0);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) return;
    await loginOrRegisterCustomer(newName.trim(), newPhone.trim(), newEmail.trim() || undefined);
    setNewName('');
    setNewPhone('');
    setNewEmail('');
    setIsNewCustModalOpen(false);
  };

  const handleAdjustPoints = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    adjustCustomerPoints(selectedCustomer.id, pointDiff, adjustReason);
    setIsAdjustModalOpen(false);
  };

  const handleSaveGlobalRules = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfig({
      pointsPerAmount: Number(pointsPerAmount),
      minPointsToRedeem: Number(minPointsToRedeem),
    });
    setRuleSavedToast(true);
    setTimeout(() => setRuleSavedToast(false), 2500);
  };

  const handleProductPointsChange = (productId: string, points: number) => {
    updateProduct(productId, { pointsEarned: points });
  };

  const openNewRewardModal = () => {
    setEditingRewardId(null);
    setRewardTitle('');
    setRewardDesc('');
    setRewardPointsCost(250);
    setRewardDiscountAmount(2500);
    setRewardMinOrder(8000);
    setRewardSelectedProducts(products.map(p => p.id));
    setIsRewardModalOpen(true);
  };

  const openEditRewardModal = (rew: Reward) => {
    setEditingRewardId(rew.id);
    setRewardTitle(rew.title);
    setRewardDesc(rew.description);
    setRewardPointsCost(rew.pointsCost);
    setRewardDiscountAmount(rew.discountAmount);
    setRewardMinOrder(rew.minOrderValue);
    setRewardSelectedProducts(rew.applicableProductIds || products.map(p => p.id));
    setIsRewardModalOpen(true);
  };

  const handleSaveReward = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rewardTitle.trim()) return;

    if (editingRewardId) {
      updateReward(editingRewardId, {
        title: rewardTitle.trim(),
        description: rewardDesc.trim(),
        pointsCost: Number(rewardPointsCost),
        discountAmount: Number(rewardDiscountAmount),
        minOrderValue: Number(rewardMinOrder),
        applicableProductIds: rewardSelectedProducts,
      });
    } else {
      addReward({
        title: rewardTitle.trim(),
        description: rewardDesc.trim(),
        pointsCost: Number(rewardPointsCost),
        discountAmount: Number(rewardDiscountAmount),
        minOrderValue: Number(rewardMinOrder),
        iconName: 'Gift',
        applicableProductIds: rewardSelectedProducts,
      });
    }

    setIsRewardModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold font-display text-slate-900 tracking-tight">
              Usuarios & Fidelización
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
              {customers.length} clientes registrados
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Administra tus clientes, puntos ganados por cada producto y las recompensas y descuentos aplicables.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeSubTab === 'customers' && (
            <button
              onClick={() => setIsNewCustModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nuevo Cliente</span>
            </button>
          )}

          {activeSubTab === 'rewards' && (
            <button
              onClick={openNewRewardModal}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Crear Recompensa</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
              Clientes Totales
            </span>
            <span className="text-xl font-bold font-display text-slate-900">
              {customers.length}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              Directorio de usuarios
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
            <Users className="w-4.5 h-4.5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-amber-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-amber-800 block uppercase tracking-wider">
              Puntos Activos
            </span>
            <span className="text-xl font-bold font-display text-amber-600">
              {totalPointsCirculating.toLocaleString()}
            </span>
            <span className="text-[10px] text-amber-700 block mt-0.5">
              Disponibles para canjear
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Coins className="w-4.5 h-4.5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-emerald-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-emerald-800 block uppercase tracking-wider">
              Consumo Total
            </span>
            <span className="text-xl font-bold font-display text-emerald-600">
              {formatMoney(totalCustomerSpend, config.currencySymbol)}
            </span>
            <span className="text-[10px] text-emerald-700 block mt-0.5">
              Ventas de miembros
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <TrendingUp className="w-4.5 h-4.5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
              Premios Activos
            </span>
            <span className="text-xl font-bold font-display text-slate-900">
              {rewards.length}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              Descuentos configurados
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
            <Gift className="w-4.5 h-4.5" />
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('customers')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              activeSubTab === 'customers'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Directorio de Usuarios ({customers.length})
          </button>

          <button
            onClick={() => setActiveSubTab('product_points')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              activeSubTab === 'product_points'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Puntos Ganados por Producto ({products.length})
          </button>

          <button
            onClick={() => setActiveSubTab('rewards')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              activeSubTab === 'rewards'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Premios & Descuentos Aplicables ({rewards.length})
          </button>
        </div>

        {activeSubTab === 'customers' && (
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, teléfono o email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 bg-slate-50/50"
            />
          </div>
        )}
      </div>

      {/* 1. DIRECTORY OF CUSTOMERS TAB */}
      {activeSubTab === 'customers' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
                  <th className="py-3 px-4">Cliente / Usuario</th>
                  <th className="py-3 px-4">Teléfono</th>
                  <th className="py-3 px-4">Nivel / Rango</th>
                  <th className="py-3 px-4">Puntos Acumulados</th>
                  <th className="py-3 px-4">Total Comprado</th>
                  <th className="py-3 px-4">Pedidos</th>
                  <th className="py-3 px-4 text-right">Acción Puntos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map(customer => {
                  const badge = getTierBadge(customer.tier);
                  return (
                    <tr key={customer.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{customer.name}</div>
                        <div className="text-[10px] text-slate-400">{customer.email || 'Sin correo registrado'}</div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-700">
                        {customer.phone}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${badge.bg}`}>
                          {customer.tier}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-amber-600 text-sm">
                        {customer.points.toLocaleString()} pts
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-900 font-semibold">
                        {formatMoney(customer.totalSpent, config.currencySymbol)}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        {customer.ordersCount} compras
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setIsAdjustModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 text-[11px] font-bold border border-amber-200 transition-colors cursor-pointer"
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
      )}

      {/* 2. PRODUCT POINTS CONFIGURATION TAB */}
      {activeSubTab === 'product_points' && (
        <div className="space-y-4">
          {/* Global Rule Setting Card */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900">
                  Regla Global de Acumulación de Puntos
                </h3>
              </div>
              {ruleSavedToast && (
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  ¡Configuración guardada!
                </span>
              )}
            </div>

            <form onSubmit={handleSaveGlobalRules} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Gasto para ganar 1 punto ($ {config.currency}):
                </label>
                <input
                  type="number"
                  min="1"
                  value={pointsPerAmount}
                  onChange={e => setPointsPerAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Ej: $100 COP = 1 punto (por una compra de $8.500 gana 85 puntos).
                </span>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Mínimo de puntos para canjear premio:
                </label>
                <input
                  type="number"
                  min="10"
                  value={minPointsToRedeem}
                  onChange={e => setMinPointsToRedeem(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  El cliente necesita al menos este saldo para redimir.
                </span>
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-colors cursor-pointer"
                >
                  Guardar Regla Global
                </button>
              </div>
            </form>
          </div>

          {/* Granizados Individual Points Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Puntos Específicos por Granizado
                </h4>
                <p className="text-[11px] text-slate-400">
                  Puedes personalizar cuántos puntos otorga cada producto de forma individual. Si no se especifica, se calcula según la regla global.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
                    <th className="py-3 px-4">Producto</th>
                    <th className="py-3 px-4">Categoría</th>
                    <th className="py-3 px-4">Precio Venta</th>
                    <th className="py-3 px-4">Puntos que Otorga</th>
                    <th className="py-3 px-4">Aplica Descuento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map(prod => {
                    const currentPts = prod.pointsEarned ?? Math.round(prod.basePrice / pointsPerAmount);
                    return (
                      <tr key={prod.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={prod.image}
                              alt={prod.name}
                              className="w-8 h-8 rounded-lg object-cover"
                            />
                            <span className="font-bold text-slate-900">{prod.name}</span>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-slate-600 font-medium">
                          {prod.category}
                        </td>

                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {formatMoney(prod.basePrice, config.currencySymbol)}
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 max-w-[120px]">
                            <input
                              type="number"
                              min="0"
                              value={currentPts}
                              onChange={e => handleProductPointsChange(prod.id, Number(e.target.value))}
                              className="w-20 px-2 py-1 rounded-lg border border-slate-200 font-mono font-bold text-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs"
                            />
                            <span className="text-[11px] text-slate-400 font-semibold">pts</span>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <button
                            onClick={() => updateProduct(prod.id, { pointsDiscountApplicable: !prod.pointsDiscountApplicable })}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                              prod.pointsDiscountApplicable !== false
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {prod.pointsDiscountApplicable !== false ? '✓ Habilitado' : '✕ Excluido'}
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

      {/* 3. REWARDS & APPLICABLE DISCOUNTS TAB */}
      {activeSubTab === 'rewards' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rewards.map(rew => {
              const applicableProducts = (rew.applicableProductIds && rew.applicableProductIds.length > 0)
                ? products.filter(p => rew.applicableProductIds?.includes(p.id))
                : products;

              return (
                <div
                  key={rew.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-amber-300 transition-colors"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                        <Gift className="w-5 h-5" />
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-amber-500 text-white font-mono font-bold text-xs shadow-2xs">
                        {rew.pointsCost} puntos
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-900 leading-tight">
                        {rew.title}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        {rew.description}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1 text-xs">
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Descuento aplicado:</span>
                        <strong className="text-emerald-700 font-mono">
                          {formatMoney(rew.discountAmount, config.currencySymbol)}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Pedido mínimo:</span>
                        <span className="font-mono text-slate-800">
                          {formatMoney(rew.minOrderValue, config.currencySymbol)}
                        </span>
                      </div>
                    </div>

                    {/* Applicable Products Pill list */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">
                        Aplica a los productos:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {applicableProducts.length === products.length ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                            Todos los granizados del menú
                          </span>
                        ) : (
                          applicableProducts.map(p => (
                            <span key={p.id} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 truncate max-w-[130px]">
                              {p.name}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
                    <button
                      onClick={() => openEditRewardModal(rew)}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 cursor-pointer"
                      title="Editar recompensa"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar la recompensa "${rew.title}"?`)) {
                          deleteReward(rew.id);
                        }
                      }}
                      className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer"
                      title="Eliminar recompensa"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal: Nuevo Cliente */}
      {isNewCustModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 border border-slate-200 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">+ Registrar Nuevo Cliente</h3>
              <button onClick={() => setIsNewCustModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Mariana Vélez"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Número de Teléfono (WhatsApp) *</label>
                <input
                  type="tel"
                  required
                  placeholder="ej. 3154567890"
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Correo Electrónico (Opcional)</label>
                <input
                  type="email"
                  placeholder="ej. mariana@example.com"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewCustModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold"
                >
                  Guardar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Ajustar Puntos Manualmente */}
      {isAdjustModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 border border-slate-200 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Ajustar Puntos a {selectedCustomer.name}</h3>
              <button onClick={() => setIsAdjustModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdjustPoints} className="space-y-3 text-xs">
              <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200">
                <span className="text-[11px] text-amber-800 block">Saldo Actual de Puntos:</span>
                <span className="text-base font-black font-mono text-amber-900">{selectedCustomer.points} pts</span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Puntos a Sumar (+) o Restar (-):
                </label>
                <input
                  type="number"
                  required
                  value={pointDiff}
                  onChange={e => setPointDiff(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-sm font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Motivo del Ajuste:</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Bono de cumpleaños, cortesía por demora, compensación"
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold"
                >
                  Aplicar Ajuste
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Crear / Editar Recompensa y Descuento */}
      {isRewardModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 border border-slate-200 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                {editingRewardId ? 'Editar Recompensa' : '+ Nueva Recompensa & Descuento'}
              </h3>
              <button onClick={() => setIsRewardModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveReward} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Título de la Recompensa *</label>
                <input
                  type="text"
                  required
                  placeholder="ej. $2.000 COP Descuento en Granizados"
                  value={rewardTitle}
                  onChange={e => setRewardTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Descripción</label>
                <textarea
                  rows={2}
                  placeholder="Explica las condiciones de la recompensa..."
                  value={rewardDesc}
                  onChange={e => setRewardDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Costo (Puntos):</label>
                  <input
                    type="number"
                    min="10"
                    required
                    value={rewardPointsCost}
                    onChange={e => setRewardPointsCost(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Descuento ($):</label>
                  <input
                    type="number"
                    min="100"
                    step="100"
                    required
                    value={rewardDiscountAmount}
                    onChange={e => setRewardDiscountAmount(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Pedido Mínimo ($):</label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    required
                    value={rewardMinOrder}
                    onChange={e => setRewardMinOrder(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 font-mono"
                  />
                </div>
              </div>

              {/* Selector de Productos Aplicables */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 block">¿A qué productos aplica el descuento?</label>
                  <button
                    type="button"
                    onClick={() => {
                      if (rewardSelectedProducts.length === products.length) {
                        setRewardSelectedProducts([]);
                      } else {
                        setRewardSelectedProducts(products.map(p => p.id));
                      }
                    }}
                    className="text-[11px] text-amber-600 font-bold hover:underline cursor-pointer"
                  >
                    {rewardSelectedProducts.length === products.length ? 'Desmarcar todos' : 'Marcar todos'}
                  </button>
                </div>
                <div className="max-h-36 overflow-y-auto p-2 border border-slate-200 rounded-xl space-y-1.5 bg-slate-50/50">
                  {products.map(prod => {
                    const isChecked = rewardSelectedProducts.includes(prod.id);
                    return (
                      <label key={prod.id} className="flex items-center gap-2 text-[11px] cursor-pointer hover:bg-slate-100/70 p-1 rounded">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={e => {
                            if (e.target.checked) {
                              setRewardSelectedProducts(prev => [...prev, prod.id]);
                            } else {
                              setRewardSelectedProducts(prev => prev.filter(id => id !== prod.id));
                            }
                          }}
                          className="rounded text-amber-500 accent-amber-500"
                        />
                        <span className="font-medium text-slate-800">{prod.name} ({formatMoney(prod.basePrice, config.currencySymbol)})</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRewardModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold"
                >
                  Guardar Recompensa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
