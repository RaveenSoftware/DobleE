import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Expense } from '../../types';
import { formatMoney, formatDateShort } from '../../utils/format';
import {
  TrendingUp,
  DollarSign,
  Wallet,
  Receipt,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  X,
  CreditCard,
  Building,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  ShoppingBag,
  ShieldCheck,
  Minus,
} from 'lucide-react';

export const FinancesAnalytics: React.FC = () => {
  const { orders, expenses, addExpense, deleteExpense, config } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'cashier' | 'expenses' | 'analytics'>('cashier');
  const [timeRange, setTimeRange] = useState<'today' | '7days' | 'month'>('today');

  // Arqueo / Cierre de Caja State
  const [cashOpeningBase, setCashOpeningBase] = useState<number>(100000);
  const [countedCashInHand, setCountedCashInHand] = useState<number>(100000);
  const [isCashClosed, setIsCashClosed] = useState<boolean>(false);
  const [lastClosedReport, setLastClosedReport] = useState<any | null>(null);

  // New Expense Modal State
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [expenseCat, setExpenseCat] = useState<Expense['category']>('Insumos & Frutas');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState<number>(25000);
  const [expenseFromCashDrawer, setExpenseFromCashDrawer] = useState(true);

  // Time calculations
  const todayStr = new Date().toDateString();

  // Orders for selected time range
  const filteredOrders = orders.filter(order => {
    if (order.status === 'Cancelado') return false;
    const orderDate = new Date(order.createdAt);
    if (timeRange === 'today') {
      return orderDate.toDateString() === todayStr;
    }
    if (timeRange === '7days') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(new Date().getDate() - 7);
      return orderDate >= sevenDaysAgo;
    }
    if (timeRange === 'month') {
      const now = new Date();
      return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
    }
    return true;
  });

  // Expenses for selected time range
  const filteredExpenses = expenses.filter(exp => {
    const expDate = new Date(exp.date);
    if (timeRange === 'today') {
      return expDate.toDateString() === todayStr;
    }
    if (timeRange === '7days') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(new Date().getDate() - 7);
      return expDate >= sevenDaysAgo;
    }
    if (timeRange === 'month') {
      const now = new Date();
      return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
    }
    return true;
  });

  // TODAY specifically for Cash Drawer Arqueo
  const todayOrders = orders.filter(
    o => o.status !== 'Cancelado' && new Date(o.createdAt).toDateString() === todayStr
  );
  const todayCashSales = todayOrders
    .filter(o => o.paymentMethod === 'Efectivo')
    .reduce((sum, o) => sum + o.total, 0);

  const todayTransferSales = todayOrders
    .filter(o => o.paymentMethod.includes('Transferencia') || o.paymentMethod.includes('Nequi'))
    .reduce((sum, o) => sum + o.total, 0);

  const todayCardSales = todayOrders
    .filter(o => o.paymentMethod.includes('Tarjeta'))
    .reduce((sum, o) => sum + o.total, 0);

  const todayTotalSales = todayOrders.reduce((sum, o) => sum + o.total, 0);

  const todayCashExpenses = expenses
    .filter(e => new Date(e.date).toDateString() === todayStr)
    .reduce((sum, e) => sum + e.amount, 0);

  // Expected cash in drawer = Base + Cash Sales - Cash Expenses
  const expectedCashInDrawer = cashOpeningBase + todayCashSales - todayCashExpenses;
  const cashDifference = countedCashInHand - expectedCashInDrawer;

  // General Finances Analytics
  const grossSales = filteredOrders.reduce((sum, o) => sum + o.total, 0);
  const productsCost = filteredOrders.reduce((sum, o) => sum + o.totalCost, 0);
  const operationalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalOutflows = productsCost + operationalExpenses;
  const realNetProfit = grossSales - totalOutflows;
  const netMarginPercent = grossSales > 0 ? (realNetProfit / grossSales) * 100 : 0;

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseDesc.trim() || expenseAmount <= 0) return;

    addExpense({
      date: expenseDate,
      category: expenseCat,
      description: expenseDesc.trim(),
      amount: Number(expenseAmount),
    });

    setExpenseDesc('');
    setExpenseAmount(25000);
    setIsAddExpenseOpen(false);
  };

  const handleExecuteArqueo = () => {
    const report = {
      closedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toLocaleDateString(),
      base: cashOpeningBase,
      cashSales: todayCashSales,
      transferSales: todayTransferSales,
      cardSales: todayCardSales,
      totalSales: todayTotalSales,
      cashExpenses: todayCashExpenses,
      expected: expectedCashInDrawer,
      counted: countedCashInHand,
      diff: cashDifference,
    };
    setLastClosedReport(report);
    setIsCashClosed(true);
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold font-display text-slate-900 tracking-tight">
              Finanzas & Caja
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
              Control de Arqueo y Utilidad
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Realiza el arqueo diario de caja, registra gastos operativos y monitorea la ganancia neta en tiempo real.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {activeSubTab === 'expenses' && (
            <button
              onClick={() => setIsAddExpenseOpen(true)}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Registrar Gasto Operativo</span>
            </button>
          )}

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs">
            {(['today', '7days', 'month'] as const).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                  timeRange === range
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {range === 'today' ? 'Hoy' : range === '7days' ? 'Últimos 7 días' : 'Este Mes'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Card 1: Ventas Brutas */}
        <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
              Ventas Brutas
            </span>
            <span className="text-xl font-bold font-display text-slate-900">
              {formatMoney(grossSales, config.currencySymbol)}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              {filteredOrders.length} pedidos facturados
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
            <ShoppingBag className="w-4.5 h-4.5" />
          </div>
        </div>

        {/* Card 2: Gastos Operativos */}
        <div className="bg-white rounded-xl p-3.5 border border-rose-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-rose-800 block uppercase tracking-wider">
              Gastos Registrados
            </span>
            <span className="text-xl font-bold font-display text-rose-600">
              {formatMoney(operationalExpenses, config.currencySymbol)}
            </span>
            <span className="text-[10px] text-rose-700 block mt-0.5">
              {filteredExpenses.length} egresos operativos
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <Wallet className="w-4.5 h-4.5" />
          </div>
        </div>

        {/* Card 3: Utilidad Neta Real */}
        <div className="bg-white rounded-xl p-3.5 border border-emerald-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-emerald-800 block uppercase tracking-wider">
              Utilidad Neta Real
            </span>
            <span className="text-xl font-bold font-display text-emerald-600">
              {formatMoney(realNetProfit, config.currencySymbol)}
            </span>
            <span className="text-[10px] text-emerald-700 block mt-0.5">
              Margen neto: <strong>{netMarginPercent.toFixed(1)}%</strong>
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <TrendingUp className="w-4.5 h-4.5" />
          </div>
        </div>

        {/* Card 4: Efectivo Esperado en Caja */}
        <div className="bg-white rounded-xl p-3.5 border border-amber-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-amber-800 block uppercase tracking-wider">
              Efectivo en Caja Hoy
            </span>
            <span className="text-xl font-bold font-display text-amber-600">
              {formatMoney(expectedCashInDrawer, config.currencySymbol)}
            </span>
            <span className="text-[10px] text-amber-700 block mt-0.5">
              Base + Ventas Efectivo - Gastos
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <DollarSign className="w-4.5 h-4.5" />
          </div>
        </div>
      </div>

      {/* Module Navigation Tabs */}
      <div className="bg-white rounded-2xl p-2.5 border border-slate-200/80 shadow-xs flex items-center gap-1.5 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('cashier')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'cashier'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          Caja Diaria & Arqueo del Turno
        </button>

        <button
          onClick={() => setActiveSubTab('expenses')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'expenses'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          Gastos Operativos ({expenses.length})
        </button>

        <button
          onClick={() => setActiveSubTab('analytics')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'analytics'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          Métricas de Rendimiento & Utilidad
        </button>
      </div>

      {/* 1. CAJA DIARIA & ARQUEO TAB */}
      {activeSubTab === 'cashier' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left Column (Col 1-7): Arqueo Live Calculations */}
            <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <h3 className="text-sm font-bold text-slate-900">
                    {isCashClosed ? 'Turno de Caja Cerrado' : 'Turno de Caja Abierto en Vivo'}
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  Fecha: {new Date().toLocaleDateString()}
                </span>
              </div>

              {/* Step-by-Step Mathematical Flow */}
              <div className="space-y-2.5 text-xs">
                {/* 1. Base Inicial */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 block">1. Fondo Base de Cambio (Apertura)</span>
                    <span className="text-[11px] text-slate-400">Efectivo con el que inició el turno</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500 font-bold">$</span>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={cashOpeningBase}
                      onChange={e => setCashOpeningBase(Number(e.target.value))}
                      className="w-28 px-2.5 py-1 rounded-lg border border-slate-300 font-mono font-bold text-slate-900 bg-white text-right"
                    />
                  </div>
                </div>

                {/* 2. Ventas en Efectivo */}
                <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-emerald-900 block flex items-center gap-1">
                      <Plus className="w-3.5 h-3.5 text-emerald-600" />
                      <span>2. Ventas Cobradas en Efectivo Hoy</span>
                    </span>
                    <span className="text-[11px] text-emerald-700">Total cobrado en billetes y monedas</span>
                  </div>
                  <span className="font-mono font-black text-sm text-emerald-700">
                    +{formatMoney(todayCashSales, config.currencySymbol)}
                  </span>
                </div>

                {/* 3. Gastos Salidos de Caja */}
                <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-rose-900 block flex items-center gap-1">
                      <Minus className="w-3.5 h-3.5 text-rose-600" />
                      <span>3. Gastos Pagados con Efectivo de Caja</span>
                    </span>
                    <span className="text-[11px] text-rose-700">Compras menores, hielo urgente, propinas</span>
                  </div>
                  <span className="font-mono font-black text-sm text-rose-700">
                    -{formatMoney(todayCashExpenses, config.currencySymbol)}
                  </span>
                </div>

                {/* 4. Efectivo Teórico Esperado */}
                <div className="p-3.5 rounded-xl bg-slate-900 text-white flex items-center justify-between shadow-xs">
                  <div>
                    <span className="text-amber-400 font-bold block uppercase text-[10px] tracking-wider">
                      = Total Efectivo Teórico en Gaveta
                    </span>
                    <span className="text-[11px] text-white/80">Base + Ventas Efectivo - Gastos Efectivo</span>
                  </div>
                  <span className="font-mono font-black text-lg text-amber-400">
                    {formatMoney(expectedCashInDrawer, config.currencySymbol)}
                  </span>
                </div>

                {/* 5. Conteo Físico Real */}
                <div className="p-3.5 rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 block">5. Conteo Físico Real (Dinero en Mano)</span>
                      <span className="text-[11px] text-slate-500">¿Cuánto dinero contaste en la gaveta?</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500 font-bold">$</span>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={countedCashInHand}
                        onChange={e => setCountedCashInHand(Number(e.target.value))}
                        className="w-32 px-3 py-1.5 rounded-xl border border-amber-400 font-mono font-black text-slate-900 text-right bg-white shadow-2xs text-sm"
                      />
                    </div>
                  </div>

                  {/* Difference Badge */}
                  <div className="pt-2 border-t border-amber-200/70 flex items-center justify-between">
                    <span className="font-semibold text-slate-700">Diferencia de Arqueo:</span>
                    <span
                      className={`font-mono font-bold text-xs px-2.5 py-0.5 rounded-full ${
                        cashDifference === 0
                          ? 'bg-emerald-100 text-emerald-800'
                          : cashDifference > 0
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {cashDifference === 0
                        ? '✓ Cuadre Exacto ($0)'
                        : cashDifference > 0
                        ? `+ Sobrante: ${formatMoney(cashDifference, config.currencySymbol)}`
                        : `- Faltante: ${formatMoney(Math.abs(cashDifference), config.currencySymbol)}`}
                    </span>
                  </div>
                </div>

                {/* Arqueo Action Button */}
                <div className="pt-2">
                  <button
                    onClick={handleExecuteArqueo}
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span>Realizar Arqueo y Cerrar Turno de Caja</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column (Col 8-12): Breakdown by Payment Method & Last Report */}
            <div className="lg:col-span-5 space-y-4">
              {/* Payment Methods Card */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-amber-500" />
                  <span>Ventas por Medio de Pago (Hoy)</span>
                </h4>

                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                      <span className="font-semibold text-slate-800">Efectivo</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900">
                      {formatMoney(todayCashSales, config.currencySymbol)}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-blue-600" />
                      <span className="font-semibold text-slate-800">Transferencias (Nequi / Daviplata)</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900">
                      {formatMoney(todayTransferSales, config.currencySymbol)}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-purple-600" />
                      <span className="font-semibold text-slate-800">Tarjetas de Débito / Crédito</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900">
                      {formatMoney(todayCardSales, config.currencySymbol)}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between font-bold">
                    <span className="text-slate-900">Total Facturado Hoy:</span>
                    <span className="font-mono text-sm text-slate-900">
                      {formatMoney(todayTotalSales, config.currencySymbol)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Last Closed Report Preview */}
              {lastClosedReport && (
                <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200 shadow-xs space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Comprobante de Cierre Generado</span>
                    </span>
                    <span className="text-[10px] text-emerald-700 font-mono">
                      {lastClosedReport.closedAt}
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-800">
                    Cierre finalizado exitosamente con <strong>{formatMoney(lastClosedReport.counted, config.currencySymbol)}</strong> en efectivo contado.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. GASTOS OPERATIVOS TAB */}
      {activeSubTab === 'expenses' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Registro de Gastos Operativos
                </h3>
                <p className="text-[11px] text-slate-400">
                  Compras de insumos, hielo, servicios y mantenimiento que afectan directamente la utilidad neta.
                </p>
              </div>

              <button
                onClick={() => setIsAddExpenseOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Registrar Gasto</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
                    <th className="py-3 px-4">Fecha</th>
                    <th className="py-3 px-4">Categoría</th>
                    <th className="py-3 px-4">Descripción del Gasto</th>
                    <th className="py-3 px-4 text-right">Monto</th>
                    <th className="py-3 px-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredExpenses.map(exp => (
                    <tr key={exp.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {exp.date}
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold">
                          {exp.category}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-medium text-slate-900">
                        {exp.description}
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-rose-600 text-right">
                        -{formatMoney(exp.amount, config.currencySymbol)}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            if (confirm(`¿Eliminar el gasto "${exp.description}"?`)) {
                              deleteExpense(exp.id);
                            }
                          }}
                          className="p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
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
        </div>
      )}

      {/* 3. METRICAS & UTILIDAD NETA TAB */}
      {activeSubTab === 'analytics' && (
        <div className="space-y-4">
          {/* Executive Net Income Statement */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Estado de Resultados & Margen Neto Real
            </h3>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
              <div className="flex items-center justify-between text-slate-700">
                <span className="font-semibold">(+) Ventas Brutas Totales</span>
                <span className="font-mono font-bold text-slate-900">
                  {formatMoney(grossSales, config.currencySymbol)}
                </span>
              </div>

              <div className="flex items-center justify-between text-rose-700">
                <span>(-) Costo de Productos Vendidos (Insumos directos de cada granizado)</span>
                <span className="font-mono font-semibold">
                  -{formatMoney(productsCost, config.currencySymbol)}
                </span>
              </div>

              <div className="flex items-center justify-between text-rose-700">
                <span>(-) Gastos Operativos de Local (Hielo, empaques, servicios)</span>
                <span className="font-mono font-semibold">
                  -{formatMoney(operationalExpenses, config.currencySymbol)}
                </span>
              </div>

              <div className="pt-3 border-t-2 border-slate-300 flex items-center justify-between text-sm">
                <div>
                  <span className="font-black text-slate-900 block">(=) Utilidad Neta en Bolsillo</span>
                  <span className="text-[11px] text-emerald-700 font-medium">Margen del {netMarginPercent.toFixed(1)}%</span>
                </div>
                <span className="font-mono font-black text-xl text-emerald-600">
                  {formatMoney(realNetProfit, config.currencySymbol)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Registrar Nuevo Gasto */}
      {isAddExpenseOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 border border-slate-200 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">+ Registrar Gasto Operativo</h3>
              <button onClick={() => setIsAddExpenseOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Fecha del Gasto:</label>
                <input
                  type="date"
                  required
                  value={expenseDate}
                  onChange={e => setExpenseDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Categoría del Gasto:</label>
                <select
                  value={expenseCat}
                  onChange={e => setExpenseCat(e.target.value as Expense['category'])}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="Insumos & Frutas">Insumos & Frutas</option>
                  <option value="Hielo & Jarabes">Hielo & Jarabes</option>
                  <option value="Vasos & Empaques">Vasos & Empaques</option>
                  <option value="Servicios & Local">Servicios & Local (Luz, agua, arriendo)</option>
                  <option value="Otros">Otros Imprevistos / Mantenimiento</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Descripción del Gasto:</label>
                <input
                  type="text"
                  required
                  placeholder="ej. 3 bolsas de hielo cristalino 15kg"
                  value={expenseDesc}
                  onChange={e => setExpenseDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Monto ($ COP):</label>
                <input
                  type="number"
                  min="100"
                  step="100"
                  required
                  value={expenseAmount}
                  onChange={e => setExpenseAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-sm font-bold"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddExpenseOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold"
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
