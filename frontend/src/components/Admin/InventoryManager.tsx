import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { InventoryItem } from '../../types';
import { formatMoney } from '../../utils/format';
import {
  Boxes,
  AlertTriangle,
  Plus,
  Minus,
  CheckCircle2,
  XCircle,
  X,
  Search,
  ShoppingCart,
  TrendingDown,
  Info,
  BookOpen,
  ArrowDownRight,
  ArrowUpRight,
} from 'lucide-react';

export const InventoryManager: React.FC = () => {
  const { inventory, updateInventoryStock, addInventoryItem, config } = useApp();
  const [filterCategory, setFilterCategory] = useState<string>('Todos');
  const [filterStatus, setFilterStatus] = useState<'all' | 'optimal' | 'low' | 'empty'>('all');
  const [search, setSearch] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isInflowModalOpen, setIsInflowModalOpen] = useState(false);
  const [isOutflowModalOpen, setIsOutflowModalOpen] = useState(false);
  const [showRecipesGuide, setShowRecipesGuide] = useState(false);

  // New Item Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<InventoryItem['category']>('Pulpas de Fruta');
  const [currentStock, setCurrentStock] = useState<number>(10);
  const [minAlertStock, setMinAlertStock] = useState<number>(5);
  const [unit, setUnit] = useState<InventoryItem['unit']>('kg');
  const [costPerUnit, setCostPerUnit] = useState<number>(8500);

  // Inflow / Outflow Quick Operations
  const [selectedItemId, setSelectedItemId] = useState<string>(inventory[0]?.id || '');
  const [adjustAmount, setAdjustAmount] = useState<number>(5);
  const [adjustNote, setAdjustNote] = useState('');

  const categories = [
    'Todos',
    'Hielo & Agua',
    'Pulpas de Fruta',
    'Vasos & Empaques',
    'Salsas & Dulces',
    'Lácteos & Café',
  ];

  // Calculated metrics
  const totalItems = inventory.length;
  const emptyStockItems = inventory.filter(i => i.currentStock <= 0);
  const lowStockItems = inventory.filter(i => i.currentStock > 0 && i.currentStock <= i.minAlertStock);
  const optimalStockItems = inventory.filter(i => i.currentStock > i.minAlertStock);
  const totalInventoryValuation = inventory.reduce(
    (sum, i) => sum + i.currentStock * i.costPerUnit,
    0
  );

  const filtered = inventory.filter(item => {
    const matchesCat = filterCategory === 'Todos' || item.category === filterCategory;
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());

    let matchesStatus = true;
    if (filterStatus === 'optimal') matchesStatus = item.currentStock > item.minAlertStock;
    if (filterStatus === 'low') matchesStatus = item.currentStock > 0 && item.currentStock <= item.minAlertStock;
    if (filterStatus === 'empty') matchesStatus = item.currentStock <= 0;

    return matchesCat && matchesSearch && matchesStatus;
  });

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addInventoryItem({
      name: name.trim(),
      category,
      currentStock: Number(currentStock),
      minAlertStock: Number(minAlertStock),
      unit,
      costPerUnit: Number(costPerUnit),
    });

    setName('');
    setIsAddModalOpen(false);
  };

  const handleInflow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId || adjustAmount <= 0) return;
    updateInventoryStock(selectedItemId, Number(adjustAmount));
    setAdjustAmount(5);
    setAdjustNote('');
    setIsInflowModalOpen(false);
  };

  const handleOutflow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId || adjustAmount <= 0) return;
    updateInventoryStock(selectedItemId, -Math.abs(Number(adjustAmount)));
    setAdjustAmount(2);
    setAdjustNote('');
    setIsOutflowModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Header and Fast Actions */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold font-display text-slate-900 tracking-tight">
              Insumos & Stock
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
              {totalItems} insumos en bodega
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Supervisa en tiempo real las existencias de pulpas, hielo, vasos domo y salsas para evitar desabastecimientos.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowRecipesGuide(!showRecipesGuide)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-600" />
            <span>{showRecipesGuide ? 'Ocultar Recetario' : 'Ver Recetario & Consumo'}</span>
          </button>

          <button
            onClick={() => {
              if (inventory.length > 0) setSelectedItemId(inventory[0].id);
              setIsInflowModalOpen(true);
            }}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
            <span>+ Entrada de Compra</span>
          </button>

          <button
            onClick={() => {
              if (inventory.length > 0) setSelectedItemId(inventory[0].id);
              setIsOutflowModalOpen(true);
            }}
            className="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowDownRight className="w-3.5 h-3.5 text-rose-600" />
            <span>− Salida / Merma</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nuevo Insumo</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Card 1: Valoración de Bodega */}
        <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
              Valoración Bodega
            </span>
            <span className="text-xl font-bold font-display text-slate-900">
              {formatMoney(totalInventoryValuation, config.currencySymbol)}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              Costo total almacenado
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
            <Boxes className="w-4.5 h-4.5" />
          </div>
        </div>

        {/* Card 2: Stock Óptimo */}
        <div
          onClick={() => setFilterStatus(filterStatus === 'optimal' ? 'all' : 'optimal')}
          className={`bg-white rounded-xl p-3.5 border shadow-xs flex items-center justify-between cursor-pointer transition-all ${
            filterStatus === 'optimal' ? 'border-emerald-500 ring-2 ring-emerald-200' : 'border-slate-200/80 hover:border-emerald-300'
          }`}
        >
          <div>
            <span className="text-[10px] font-bold text-emerald-800 block uppercase tracking-wider">
              Stock Óptimo
            </span>
            <span className="text-xl font-bold font-display text-emerald-600">
              {optimalStockItems.length}
            </span>
            <span className="text-[10px] text-emerald-700 block mt-0.5">
              Niveles seguros
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-4.5 h-4.5" />
          </div>
        </div>

        {/* Card 3: Stock Bajo */}
        <div
          onClick={() => setFilterStatus(filterStatus === 'low' ? 'all' : 'low')}
          className={`bg-white rounded-xl p-3.5 border shadow-xs flex items-center justify-between cursor-pointer transition-all ${
            filterStatus === 'low' ? 'border-amber-500 ring-2 ring-amber-200' : 'border-slate-200/80 hover:border-amber-300'
          }`}
        >
          <div>
            <span className="text-[10px] font-bold text-amber-800 block uppercase tracking-wider">
              Stock Bajo
            </span>
            <span className="text-xl font-bold font-display text-amber-600">
              {lowStockItems.length}
            </span>
            <span className="text-[10px] text-amber-700 block mt-0.5">
              Por debajo del mínimo
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <AlertTriangle className="w-4.5 h-4.5" />
          </div>
        </div>

        {/* Card 4: Agotados */}
        <div
          onClick={() => setFilterStatus(filterStatus === 'empty' ? 'all' : 'empty')}
          className={`bg-white rounded-xl p-3.5 border shadow-xs flex items-center justify-between cursor-pointer transition-all ${
            filterStatus === 'empty' ? 'border-rose-500 ring-2 ring-rose-200' : 'border-slate-200/80 hover:border-rose-300'
          }`}
        >
          <div>
            <span className="text-[10px] font-bold text-rose-800 block uppercase tracking-wider">
              Agotados / Cero
            </span>
            <span className="text-xl font-bold font-display text-rose-600">
              {emptyStockItems.length}
            </span>
            <span className="text-[10px] text-rose-700 block mt-0.5">
              Reponer urgente
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <XCircle className="w-4.5 h-4.5" />
          </div>
        </div>
      </div>

      {/* Recetario & Guía de Consumo por Granizado (Collapsible) */}
      {showRecipesGuide && (
        <div className="bg-amber-50/70 rounded-2xl p-4 border border-amber-200/80 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-amber-950 flex items-center gap-1.5 uppercase tracking-wider">
              <Info className="w-4 h-4 text-amber-600" />
              <span>¿Cómo se descuenta el inventario con cada granizado vendido?</span>
            </h4>
            <button
              onClick={() => setShowRecipesGuide(false)}
              className="text-amber-800 hover:text-amber-950 text-xs font-semibold"
            >
              ✕ Cerrar
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
            <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-2xs">
              <span className="font-bold text-slate-900 block">Granizado Mediano (16oz)</span>
              <ul className="text-slate-600 space-y-1 mt-1 text-[11px]">
                <li>• 250g Hielo cristalino escarchado</li>
                <li>• 60g Pulpa pura de fruta</li>
                <li>• 1 Vaso domo transparente + 1 Pitillo</li>
                <li>• 25g Salsa chamoy o lechera</li>
              </ul>
            </div>
            <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-2xs">
              <span className="font-bold text-slate-900 block">Granizado Grande (24oz)</span>
              <ul className="text-slate-600 space-y-1 mt-1 text-[11px]">
                <li>• 380g Hielo cristalino escarchado</li>
                <li>• 90g Pulpa pura de fruta</li>
                <li>• 1 Vaso domo grande + 1 Pitillo</li>
                <li>• 35g Salsas y toppings dobles</li>
              </ul>
            </div>
            <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-2xs">
              <span className="font-bold text-slate-900 block">Control de Mermas</span>
              <p className="text-slate-500 text-[11px] mt-1 leading-relaxed">
                Utiliza el botón <strong>"− Salida / Merma"</strong> cuando el hielo se derrita en la máquina o haya desperdicios de pulpa para mantener el costo y stock al 100% exactos.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por insumo, pulpa o vaso..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto p-1 bg-slate-100 rounded-xl">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                filterCategory === cat
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Table of Inventory Items */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Insumo / Materia Prima</th>
                <th className="py-3 px-4">Categoría</th>
                <th className="py-3 px-4">Stock Actual</th>
                <th className="py-3 px-4">Mínimo Alerta</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4">Costo Unitario</th>
                <th className="py-3 px-4">Valor Total</th>
                <th className="py-3 px-4 text-right">Ajuste Rápido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(item => {
                const isLow = item.currentStock <= item.minAlertStock && item.currentStock > 0;
                const isEmpty = item.currentStock <= 0;
                const totalItemCost = item.currentStock * item.costPerUnit;

                return (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{item.name}</div>
                      <div className="text-[10px] text-slate-400">Última reposición: {item.lastRestocked}</div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold">
                        {item.category}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      <span className="text-sm">{item.currentStock}</span>{' '}
                      <span className="text-[11px] text-slate-500 font-normal">{item.unit}</span>
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-500">
                      {item.minAlertStock} {item.unit}
                    </td>

                    <td className="py-3 px-4">
                      {isEmpty ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                          <XCircle className="w-3 h-3" />
                          <span>Agotado</span>
                        </span>
                      ) : isLow ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Bajo Stock</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Óptimo</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-700">
                      {formatMoney(item.costPerUnit, config.currencySymbol)}
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {formatMoney(totalItemCost, config.currencySymbol)}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => updateInventoryStock(item.id, -1)}
                          disabled={item.currentStock <= 0}
                          title="Descontar 1 unidad"
                          className="w-7 h-7 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold disabled:opacity-40 cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => updateInventoryStock(item.id, 1)}
                          title="Añadir 1 unidad"
                          className="w-7 h-7 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-900 flex items-center justify-center text-xs font-bold cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Entrada de Mercancía / Compra */}
      {isInflowModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 border border-slate-200 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                <span>Registrar Entrada / Compra</span>
              </h3>
              <button
                onClick={() => setIsInflowModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInflow} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Selecciona el Insumo:</label>
                <select
                  value={selectedItemId}
                  onChange={e => setSelectedItemId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  {inventory.map(i => (
                    <option key={i.id} value={i.id}>
                      {i.name} (Actual: {i.currentStock} {i.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Cantidad Comprada / Ingresada:</label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  required
                  value={adjustAmount}
                  onChange={e => setAdjustAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nota o Proveedor (Opcional):</label>
                <input
                  type="text"
                  placeholder="ej. Plaza Mayorista / Factura #410"
                  value={adjustNote}
                  onChange={e => setAdjustNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsInflowModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 text-white font-bold"
                >
                  Confirmar Entrada
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Salida / Merma */}
      {isOutflowModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 border border-slate-200 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <ArrowDownRight className="w-4 h-4 text-rose-600" />
                <span>Registrar Salida / Merma</span>
              </h3>
              <button
                onClick={() => setIsOutflowModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleOutflow} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Selecciona el Insumo:</label>
                <select
                  value={selectedItemId}
                  onChange={e => setSelectedItemId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  {inventory.map(i => (
                    <option key={i.id} value={i.id}>
                      {i.name} (Actual: {i.currentStock} {i.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Cantidad a Descontar:</label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  required
                  value={adjustAmount}
                  onChange={e => setAdjustAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Motivo de Merma:</label>
                <select
                  value={adjustNote}
                  onChange={e => setAdjustNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="Hielo derretido en máquina">Hielo derretido en máquina</option>
                  <option value="Vaso o pitillo roto / dañado">Vaso o pitillo roto / dañado</option>
                  <option value="Pulpa vencida o en mal estado">Pulpa vencida o en mal estado</option>
                  <option value="Degustación / Muestra cliente">Degustación / Muestra cliente</option>
                  <option value="Ajuste de conteo físico">Ajuste de conteo físico</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOutflowModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-rose-600 text-white font-bold"
                >
                  Descontar Merma
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Crear Nuevo Insumo */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 border border-slate-200 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                + Crear Nuevo Insumo de Bodega
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateItem} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nombre del Insumo:</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Pulpa Guanábana, Pitillos de Tamarindo"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Categoría:</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as InventoryItem['category'])}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="Hielo & Agua">Hielo & Agua</option>
                    <option value="Pulpas de Fruta">Pulpas de Fruta</option>
                    <option value="Vasos & Empaques">Vasos & Empaques</option>
                    <option value="Salsas & Dulces">Salsas & Dulces</option>
                    <option value="Lácteos & Café">Lácteos & Café</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Unidad de Medida:</label>
                  <select
                    value={unit}
                    onChange={e => setUnit(e.target.value as InventoryItem['unit'])}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="kg">kg (Kilogramos)</option>
                    <option value="litros">litros</option>
                    <option value="unidades">unidades</option>
                    <option value="paquetes (50u)">paquetes (50u)</option>
                    <option value="latas">latas</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Stock Inicial:</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    required
                    value={currentStock}
                    onChange={e => setCurrentStock(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Stock Mínimo:</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    required
                    value={minAlertStock}
                    onChange={e => setMinAlertStock(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Costo Unitario ($):</label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    required
                    value={costPerUnit}
                    onChange={e => setCostPerUnit(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold"
                >
                  Guardar Insumo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
