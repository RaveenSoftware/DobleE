import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Expense } from '../../types';
import { formatMoney, formatDateShort } from '../../utils/format';
import { Plus, Trash2, Wallet, X } from 'lucide-react';

export const ExpensesManager: React.FC = () => {
  const { expenses, addExpense, deleteExpense, config } = useApp();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<Expense['category']>('Insumos & Frutas');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number | ''>(25000);

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount) return;

    addExpense({
      date,
      category,
      description: description.trim(),
      amount: Number(amount),
    });

    setDescription('');
    setAmount(25000);
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header and Total */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900">
            Control de Gastos & Compras Operativas
          </h2>
          <p className="text-xs text-slate-500">
            Registra compras de hielo, frutas en plaza, vasos y servicios para calcular la ganancia neta exacta.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-2">
            <span className="text-[11px] text-rose-800 font-medium block">Gastos Registrados</span>
            <span className="text-base font-bold font-mono text-rose-700 tabular-nums">
              {formatMoney(totalExpenses, config.currencySymbol)}
            </span>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-teal-600 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Gasto</span>
          </button>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[11px]">
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Categoría</th>
                <th className="py-3 px-4">Descripción del Gasto</th>
                <th className="py-3 px-4 text-right">Monto</th>
                <th className="py-3 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.map(e => (
                <tr key={e.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-slate-600">
                    {formatDateShort(e.date)}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-700">
                    {e.category}
                  </td>
                  <td className="py-3.5 px-4 text-slate-800">
                    {e.description}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-700 tabular-nums">
                    {formatMoney(e.amount, config.currencySymbol)}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => deleteExpense(e.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Eliminar gasto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: New Expense */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold font-display text-slate-900">
                Registrar Gasto de Emprendimiento
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-800 block mb-1">Fecha</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Categoría del Gasto</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as Expense['category'])}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="Insumos & Frutas">Insumos & Frutas (Mango, Moras, etc.)</option>
                  <option value="Hielo & Jarabes">Hielo & Jarabes</option>
                  <option value="Vasos & Empaques">Vasos, Domos & Pitillos</option>
                  <option value="Servicios & Local">Servicios & Local / Puesto</option>
                  <option value="Otros">Otros</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Descripción</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: 5 bolsas de hielo + limones"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Monto ($)</label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={e => setAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 hover:bg-teal-600 text-white rounded-lg font-semibold"
                >
                  Guardar Gasto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
