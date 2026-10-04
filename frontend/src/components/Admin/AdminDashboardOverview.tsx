import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatMoney } from '../../utils/format';
import {
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  Clock,
  Sparkles,
  Users,
  Layers,
  ArrowRight,
  Plus,
  Store,
  DollarSign,
  Coffee,
  CheckCircle2,
  Lock,
  Unlock,
  RotateCcw,
  BarChart3,
  Calendar,
  Wallet,
  AlertTriangle,
  X,
  CreditCard,
  Banknote,
  SendHorizontal,
  ChevronRight,
  Check,
} from 'lucide-react';

export const AdminDashboardOverview: React.FC = () => {
  const {
    config,
    orders,
    expenses,
    inventory,
    products,
    tables,
    setAdminSubTab,
    cashShift,
    openCashShift,
    closeCashShift,
    clearStaticTestData,
    currentUser,
  } = useApp();

  // Modals for Cash Register
  const [isOpeningModalOpen, setIsOpeningModalOpen] = useState(false);
  const [isClosingModalOpen, setIsClosingModalOpen] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [clearSuccessToast, setClearSuccessToast] = useState(false);

  // Cash shift form state
  const [openingBaseAmount, setOpeningBaseAmount] = useState<number>(100000);
  const [openingCashierName, setOpeningCashierName] = useState<string>(currentUser?.name || 'Administrador');
  const [openingNotes, setOpeningNotes] = useState<string>('Base inicial para cambio');

  // Cash shift close form state
  const [countedCash, setCountedCash] = useState<string>('');
  const [closingNotes, setClosingNotes] = useState<string>('');

  // ----------------------------------------------------------------------
  // 1. DATE CALCULATIONS & TODAY VS YESTERDAY METRICS
  // ----------------------------------------------------------------------
  const now = new Date();
  const todayStr = now.toDateString();

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();

  // Orders today
  const todayOrders = orders.filter(
    o => o.status !== 'Cancelado' && new Date(o.createdAt).toDateString() === todayStr
  );
  const todaySales = todayOrders.reduce((sum, o) => sum + o.total, 0);
  const todayProductCosts = todayOrders.reduce((sum, o) => sum + o.totalCost, 0);
  const todayExpenses = expenses
    .filter(e => new Date(e.date).toDateString() === todayStr)
    .reduce((sum, e) => sum + e.amount, 0);
  const todayNetProfit = todaySales - (todayProductCosts + todayExpenses);
  const todayProfitMargin = todaySales > 0 ? (todayNetProfit / todaySales) * 100 : 0;

  // Orders yesterday
  const yesterdayOrders = orders.filter(
    o => o.status !== 'Cancelado' && new Date(o.createdAt).toDateString() === yesterdayStr
  );
  const yesterdaySales = yesterdayOrders.reduce((sum, o) => sum + o.total, 0);

  // Growth comparison (¿Ha vendido más hoy que ayer?)
  const salesDiff = todaySales - yesterdaySales;
  const hasSoldMore = todaySales > yesterdaySales;
  const isEqualSales = todaySales === yesterdaySales;
  let growthPercent = 0;
  if (yesterdaySales > 0) {
    growthPercent = ((todaySales - yesterdaySales) / yesterdaySales) * 100;
  } else if (todaySales > 0) {
    growthPercent = 100;
  }

  // ----------------------------------------------------------------------
  // 2. CASH REGISTER CURRENT TOTALS
  // ----------------------------------------------------------------------
  const todayCashSales = todayOrders
    .filter(o => o.paymentMethod === 'Efectivo')
    .reduce((s, o) => s + o.total, 0);

  const todayDigitalSales = todayOrders
    .filter(o => o.paymentMethod !== 'Efectivo')
    .reduce((s, o) => s + o.total, 0);

  const todayCashExpenses = todayExpenses;
  const expectedCashInDrawer = (cashShift.isOpen ? cashShift.initialAmount : 0) + todayCashSales - todayCashExpenses;

  // ----------------------------------------------------------------------
  // 3. HOURLY BREAKDOWN (HOY VS AYER) FOR CHART
  // ----------------------------------------------------------------------
  const timeSlots = [
    { label: 'Mañana (8a-12p)', minH: 8, maxH: 12 },
    { label: 'Almuerzo (12p-4p)', minH: 12, maxH: 16 },
    { label: 'Tarde Granizados (4p-7p)', minH: 16, maxH: 19 },
    { label: 'Noche (7p-11p)', minH: 19, maxH: 23 },
  ];

  const hourlyChartData = timeSlots.map(slot => {
    const todaySlotSales = todayOrders.filter(o => {
      const h = new Date(o.createdAt).getHours();
      return h >= slot.minH && h < slot.maxH;
    }).reduce((s, o) => s + o.total, 0);

    const yesterdaySlotSales = yesterdayOrders.filter(o => {
      const h = new Date(o.createdAt).getHours();
      return h >= slot.minH && h < slot.maxH;
    }).reduce((s, o) => s + o.total, 0);

    return {
      label: slot.label,
      today: todaySlotSales,
      yesterday: yesterdaySlotSales,
    };
  });

  const maxSlotValue = Math.max(
    ...hourlyChartData.map(d => Math.max(d.today, d.yesterday)),
    10000
  );

  // ----------------------------------------------------------------------
  // 4. LAST 7 DAYS TREND CHART DATA
  // ----------------------------------------------------------------------
  const last7DaysData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    const dStr = d.toDateString();
    const dayOrders = orders.filter(
      o => o.status !== 'Cancelado' && new Date(o.createdAt).toDateString() === dStr
    );
    const daySales = dayOrders.reduce((s, o) => s + o.total, 0);
    const dayName = i === 6 ? 'Hoy' : i === 5 ? 'Ayer' : d.toLocaleDateString('es-ES', { weekday: 'short' });
    return {
      dateStr: d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
      dayName: dayName.charAt(0).toUpperCase() + dayName.slice(1),
      sales: daySales,
      ordersCount: dayOrders.length,
      isToday: i === 6,
    };
  });

  const max7DaysSales = Math.max(...last7DaysData.map(d => d.sales), 20000);

  // ----------------------------------------------------------------------
  // 5. TOP PRODUCTS RANKING WITH REVENUE & VOLUME
  // ----------------------------------------------------------------------
  const productCountMap: { [name: string]: { units: number; revenue: number } } = {};
  orders
    .filter(o => o.status !== 'Cancelado')
    .forEach(o => {
      o.items.forEach(item => {
        if (!productCountMap[item.productName]) {
          productCountMap[item.productName] = { units: 0, revenue: 0 };
        }
        productCountMap[item.productName].units += item.quantity;
        productCountMap[item.productName].revenue += item.totalPrice;
      });
    });

  const topProductsList = Object.entries(productCountMap)
    .map(([name, data]) => {
      const matchProd = products.find(p => p.name === name);
      return {
        name,
        image: matchProd?.image || '/src/assets/images/granizado_mango_chamoy_1790537433959.jpg',
        category: matchProd?.category || 'Especiales',
        ...data,
      };
    })
    .sort((a, b) => b.units - a.units);

  const maxProdUnits = topProductsList.length > 0 ? Math.max(...topProductsList.map(p => p.units)) : 1;

  // ----------------------------------------------------------------------
  // 6. PAYMENT METHODS BREAKDOWN
  // ----------------------------------------------------------------------
  const paymentBreakdown = {
    efectivo: todayOrders.filter(o => o.paymentMethod === 'Efectivo').reduce((s, o) => s + o.total, 0),
    transferencia: todayOrders.filter(o => o.paymentMethod.includes('Transferencia')).reduce((s, o) => s + o.total, 0),
    tarjeta: todayOrders.filter(o => o.paymentMethod.includes('Tarjeta')).reduce((s, o) => s + o.total, 0),
  };
  const totalPayAmount = paymentBreakdown.efectivo + paymentBreakdown.transferencia + paymentBreakdown.tarjeta;

  // Salon & Kitchen status
  const pendingOrders = orders.filter(
    o => o.status === 'Pendiente' || o.status === 'En preparación'
  );
  const occupiedTables = tables.filter(t => t.status === 'ocupada' || t.status === 'cuenta').length;
  const freeTables = tables.filter(t => t.status === 'libre').length;
  const lowStockItems = inventory.filter(i => i.currentStock <= i.minAlertStock);

  // ----------------------------------------------------------------------
  // HANDLERS
  // ----------------------------------------------------------------------
  const handleOpenCashSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    openCashShift(openingBaseAmount, openingCashierName, openingNotes);
    setIsOpeningModalOpen(false);
  };

  const handleCloseCashSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const counted = parseFloat(countedCash) || 0;
    closeCashShift(counted, currentUser?.name, closingNotes);
    setIsClosingModalOpen(false);
    setCountedCash('');
    setClosingNotes('');
  };

  const handleClearStaticData = () => {
    clearStaticTestData();
    setIsClearConfirmOpen(false);
    setClearSuccessToast(true);
    setTimeout(() => setClearSuccessToast(false), 4000);
  };

  return (
    <div className="space-y-5">
      {/* Toast Notification for Clean Slate */}
      {clearSuccessToast && (
        <div className="bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-lg flex items-center justify-between gap-3 text-xs font-semibold animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-200" />
            <span>
              ¡Sistema completamente limpio! Todos los datos estáticos de prueba fueron eliminados. Puedes iniciar pruebas desde cero.
            </span>
          </div>
          <button
            onClick={() => setClearSuccessToast(false)}
            className="text-emerald-200 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* CASH REGISTER STATUS & APERTURA DE CAJA MODULE                   */}
      {/* ---------------------------------------------------------------- */}
      <div
        className={`p-5 rounded-2xl border transition-all shadow-xs ${
          cashShift.isOpen
            ? 'bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-white border-emerald-200'
            : 'bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-white border-amber-300'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white shadow-xs shrink-0 ${
                cashShift.isOpen
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                  : 'bg-gradient-to-br from-amber-500 to-orange-500 animate-pulse'
              }`}
            >
              {cashShift.isOpen ? <Unlock className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 font-display">
                  {cashShift.isOpen ? 'Caja Abierta & Facturación en Curso' : 'Caja Cerrada — Requiere Apertura'}
                </h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold tracking-wide uppercase ${
                    cashShift.isOpen
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}
                >
                  {cashShift.isOpen ? '● Turno Activo' : '○ Caja Cerrada'}
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {cashShift.isOpen ? (
                  <>
                    Iniciaste turno con una <strong>base en efectivo de {formatMoney(cashShift.initialAmount, config.currencySymbol)}</strong>
                    {cashShift.openedBy && ` · Responsable: ${cashShift.openedBy}`}
                    {cashShift.openedAt && ` (${new Date(cashShift.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`}.
                  </>
                ) : (
                  'Para registrar comandas y ventas en efectivo con arqueo exacto, abre caja indicando la base en efectivo con la que comienzas.'
                )}
              </p>
            </div>
          </div>

          {/* Action Buttons for Cash Shift */}
          <div className="flex items-center gap-2 shrink-0">
            {cashShift.isOpen ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsClosingModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold text-xs shadow-2xs hover:shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5 text-rose-500" />
                  <span>Cerrar Caja & Arqueo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAdminSubTab('pos')}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs hover:shadow transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Cobrar en POS</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsOpeningModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-sm hover:shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Unlock className="w-4 h-4" />
                <span>Abrir Caja con Saldo Base</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Drawer Breakdown when Open */}
        {cashShift.isOpen && (
          <div className="mt-4 pt-4 border-t border-emerald-100/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 rounded-xl bg-white/80 border border-emerald-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Base de Apertura</span>
              <span className="text-sm font-extrabold font-mono text-slate-800">
                {formatMoney(cashShift.initialAmount, config.currencySymbol)}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-white/80 border border-emerald-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">+ Ventas Efectivo</span>
              <span className="text-sm font-extrabold font-mono text-emerald-600">
                +{formatMoney(todayCashSales, config.currencySymbol)}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-white/80 border border-emerald-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">- Gastos en Efectivo</span>
              <span className="text-sm font-extrabold font-mono text-rose-500">
                -{formatMoney(todayCashExpenses, config.currencySymbol)}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="text-[10px] uppercase font-bold text-emerald-800 block">= Efectivo en Gaveta</span>
              <span className="text-sm font-black font-mono text-emerald-900">
                {formatMoney(expectedCashInDrawer, config.currencySymbol)}
              </span>
            </div>
          </div>
        )}
      </div>


      {/* 4 COMPACT EXECUTIVE METRICS                                      */}
      {/* ---------------------------------------------------------------- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Ventas Hoy */}
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-xs hover:shadow-sm transition-shadow space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Ventas Hoy
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="text-xl font-bold text-slate-900 font-display">
              {formatMoney(todaySales, config.currencySymbol)}
            </div>
            <div className="text-[11px] text-slate-400">
              {todayOrders.length} comandas procesadas
            </div>
          </div>

          <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
            <span>Ticket promedio:</span>
            <span className="font-mono font-semibold">
              {todayOrders.length > 0
                ? formatMoney(Math.round(todaySales / todayOrders.length), config.currencySymbol)
                : '$0'}
            </span>
          </div>
        </div>

        {/* Card 2: Utilidad Neta */}
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-xs hover:shadow-sm transition-shadow space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Utilidad Neta
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="text-xl font-bold text-emerald-600 font-display">
              {formatMoney(todayNetProfit, config.currencySymbol)}
            </div>
            <div className="text-[11px] text-slate-400">
              Margen neto: <strong className="text-emerald-700">{todayProfitMargin.toFixed(1)}%</strong>
            </div>
          </div>

          <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Costos e insumos:</span>
            <span className="font-mono font-medium">
              {formatMoney(todayProductCosts + todayExpenses, config.currencySymbol)}
            </span>
          </div>
        </div>

        {/* Card 3: Salón & Mesas Ocupación */}
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-xs hover:shadow-sm transition-shadow space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Salón & Mesas
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Store className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="text-xl font-bold text-slate-900 font-display flex items-center gap-1.5">
              <span>{occupiedTables}/{tables.length}</span>
              <span className="text-xs font-semibold text-indigo-600">
                ({tables.length > 0 ? Math.round((occupiedTables / tables.length) * 100) : 0}%)
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              {freeTables} mesas listas para recibir clientes
            </div>
          </div>

          <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <button
              onClick={() => setAdminSubTab('tables')}
              className="text-amber-600 hover:text-amber-700 font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>Ver salón en vivo</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Card 4: Comandas & Insumos */}
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-xs hover:shadow-sm transition-shadow space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Cocina & Insumos
            </span>
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="text-xl font-bold text-slate-900 font-display flex items-center gap-2">
              <span>{pendingOrders.length}</span>
              <span className="text-xs font-semibold text-slate-500">en cocina</span>
            </div>
            <div className="text-[11px] text-slate-400">
              {lowStockItems.length} insumos en nivel bajo
            </div>
          </div>

          <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <button
              onClick={() => setAdminSubTab('orders')}
              className="text-amber-600 hover:text-amber-700 font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>Atender comandas</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* GRÁFICAS DEL DASHBOARD DEL ADMIN                                 */}
      {/* 1. ¿Ha vendido más hoy que ayer? (Comparativa Gráfica Hoy vs Ayer)*/}
      {/* 2. Tendencia de Ventas (Últimos 7 días)                           */}
      {/* ---------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Gráfica 1: COMPARATIVA HOY VS AYER (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-100 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm sm:text-base font-bold text-slate-900 font-display">
                  Comparativa de Ventas: Hoy vs Ayer
                </h3>
              </div>
              <p className="text-xs text-slate-400">
                Visualiza gráficamente si estás vendiendo más hoy respecto al día anterior.
              </p>
            </div>

            {/* Verdict Badge */}
            <div
              className={`px-3 py-1 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 self-start sm:self-auto ${
                hasSoldMore
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : isEqualSales && todaySales === 0
                  ? 'bg-slate-100 text-slate-600'
                  : isEqualSales
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-rose-100 text-rose-800 border border-rose-200'
              }`}
            >
              {hasSoldMore ? (
                <>
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  <span>+{growthPercent.toFixed(0)}% Más vendido hoy</span>
                </>
              ) : isEqualSales && todaySales === 0 ? (
                <span>Sin ventas hoy ni ayer</span>
              ) : isEqualSales ? (
                <span>Mismo nivel que ayer</span>
              ) : (
                <>
                  <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
                  <span>{growthPercent.toFixed(0)}% vs ayer</span>
                </>
              )}
            </div>
          </div>

          {/* Quick Summary Cards (Hoy vs Ayer side-by-side) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200">
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                Total Ventas Hoy
              </span>
              <div className="text-lg sm:text-xl font-black font-mono text-amber-950 mt-0.5">
                {formatMoney(todaySales, config.currencySymbol)}
              </div>
              <div className="text-[11px] text-amber-700 mt-1 flex items-center justify-between">
                <span>{todayOrders.length} comandas</span>
                <span className="font-semibold">
                  Prom: {todayOrders.length > 0 ? formatMoney(Math.round(todaySales / todayOrders.length), config.currencySymbol) : '$0'}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Total Ventas Ayer
              </span>
              <div className="text-lg sm:text-xl font-black font-mono text-slate-700 mt-0.5">
                {formatMoney(yesterdaySales, config.currencySymbol)}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                <span>{yesterdayOrders.length} comandas</span>
                <span className="font-semibold">
                  Prom: {yesterdayOrders.length > 0 ? formatMoney(Math.round(yesterdaySales / yesterdayOrders.length), config.currencySymbol) : '$0'}
                </span>
              </div>
            </div>
          </div>

          {/* Visual Dual-Bar Graphic: Hoy vs Ayer por Franja Horaria */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-bold">Distribución Horaria de Ventas</span>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-amber-500 inline-block" />
                  <strong>Hoy</strong>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-slate-300 inline-block" />
                  <span>Ayer</span>
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {hourlyChartData.map(slot => {
                const todayWidth = maxSlotValue > 0 ? Math.round((slot.today / maxSlotValue) * 100) : 0;
                const yesterdayWidth = maxSlotValue > 0 ? Math.round((slot.yesterday / maxSlotValue) * 100) : 0;

                return (
                  <div key={slot.label} className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-medium text-slate-700">{slot.label}</span>
                      <div className="space-x-2 font-mono">
                        <span className="font-bold text-amber-600">
                          {formatMoney(slot.today, config.currencySymbol)}
                        </span>
                        <span className="text-slate-400">/</span>
                        <span className="text-slate-500">
                          {formatMoney(slot.yesterday, config.currencySymbol)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      {/* Bar Hoy */}
                      <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                        <div
                          className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(todayWidth, slot.today > 0 ? 3 : 0)}%` }}
                        />
                      </div>
                      {/* Bar Ayer */}
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                        <div
                          className="h-full bg-slate-400 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(yesterdayWidth, slot.yesterday > 0 ? 3 : 0)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Gráfica 2: TENDENCIA ÚLTIMOS 7 DÍAS (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-100 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-500" />
                <h3 className="text-sm sm:text-base font-bold text-slate-900 font-display">
                  Evolución (Últimos 7 Días)
                </h3>
              </div>
              <p className="text-xs text-slate-400">
                Historial continuo de ingresos diarios.
              </p>
            </div>
          </div>

          {/* Interactive SVG / CSS Bar Chart */}
          <div className="h-44 flex items-end justify-between gap-2 pt-6 pb-2 px-1">
            {last7DaysData.map((day, idx) => {
              const heightPercent = max7DaysSales > 0 ? Math.round((day.sales / max7DaysSales) * 100) : 0;
              const barHeight = Math.max(heightPercent, day.sales > 0 ? 10 : 4);

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group relative">
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-10 bg-slate-900 text-white text-[10px] py-1 px-2 rounded-lg pointer-events-none whitespace-nowrap z-20 shadow-md font-mono">
                    {formatMoney(day.sales, config.currencySymbol)} ({day.ordersCount} ped)
                  </div>

                  {/* Bar Value text if significant */}
                  <span className={`text-[9px] font-mono font-bold truncate max-w-full ${
                    day.isToday ? 'text-amber-600' : 'text-slate-400'
                  }`}>
                    {day.sales > 0 ? `$${(day.sales / 1000).toFixed(0)}k` : '$0'}
                  </span>

                  {/* Column Bar */}
                  <div className="w-full bg-slate-100 rounded-t-lg h-28 flex items-end overflow-hidden p-0.5">
                    <div
                      className={`w-full rounded-t-md transition-all duration-500 ${
                        day.isToday
                          ? 'bg-gradient-to-t from-amber-500 to-amber-400 shadow-xs'
                          : day.sales > 0
                          ? 'bg-indigo-400 group-hover:bg-indigo-500'
                          : 'bg-slate-200'
                      }`}
                      style={{ height: `${barHeight}%` }}
                    />
                  </div>

                  {/* Day Label */}
                  <span className={`text-[10px] font-bold ${
                    day.isToday ? 'text-amber-600 underline' : 'text-slate-500'
                  }`}>
                    {day.dayName}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Payment Methods Distribution Widget */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <span className="text-[11px] font-bold text-slate-700 block">
              Medios de Pago Hoy ({formatMoney(todaySales, config.currencySymbol)})
            </span>

            {todaySales > 0 ? (
              <div className="space-y-1.5">
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-2xs">
                  {paymentBreakdown.efectivo > 0 && (
                    <div
                      className="bg-emerald-500 h-full transition-all"
                      style={{ width: `${(paymentBreakdown.efectivo / totalPayAmount) * 100}%` }}
                      title={`Efectivo: ${formatMoney(paymentBreakdown.efectivo, config.currencySymbol)}`}
                    />
                  )}
                  {paymentBreakdown.transferencia > 0 && (
                    <div
                      className="bg-purple-500 h-full transition-all"
                      style={{ width: `${(paymentBreakdown.transferencia / totalPayAmount) * 100}%` }}
                      title={`Transferencia: ${formatMoney(paymentBreakdown.transferencia, config.currencySymbol)}`}
                    />
                  )}
                  {paymentBreakdown.tarjeta > 0 && (
                    <div
                      className="bg-sky-500 h-full transition-all"
                      style={{ width: `${(paymentBreakdown.tarjeta / totalPayAmount) * 100}%` }}
                      title={`Tarjeta: ${formatMoney(paymentBreakdown.tarjeta, config.currencySymbol)}`}
                    />
                  )}
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Efectivo: {formatMoney(paymentBreakdown.efectivo, config.currencySymbol)}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    <span>Nequi/Davi: {formatMoney(paymentBreakdown.transferencia, config.currencySymbol)}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-sky-500" />
                    <span>Tarjeta: {formatMoney(paymentBreakdown.tarjeta, config.currencySymbol)}</span>
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-slate-50 text-center text-xs text-slate-400">
                Aún no hay cobros registrados hoy.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* GRÁFICA DE PRODUCTOS MÁS VENDIDOS & SALÓN EN VIVO                */}
      {/* ---------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left (7 cols): TOP PRODUCTOS MÁS VENDIDOS RANKING GRÁFICO */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Coffee className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm sm:text-base font-bold text-slate-900 font-display">
                  Ranking Gráfico: Granizados Más Vendidos
                </h3>
              </div>
              <p className="text-xs text-slate-400">
                ¿Qué producto es el más vendido? Consulta volumen de copas y facturación generada.
              </p>
            </div>

            <button
              onClick={() => setAdminSubTab('catalog')}
              className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>Ver Menú</span>
            </button>
          </div>

          {topProductsList.length > 0 ? (
            <div className="space-y-3">
              {topProductsList.slice(0, 5).map((prod, idx) => {
                const percent = Math.round((prod.units / maxProdUnits) * 100);

                return (
                  <div
                    key={prod.name}
                    className="p-3 rounded-xl border border-slate-100 bg-[#FBFBFE] hover:bg-white hover:border-amber-300 transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 bg-slate-100 relative">
                          <img
                            src={prod.image}
                            alt={prod.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-amber-500 text-white font-bold text-[8px] flex items-center justify-center shadow-xs">
                            #{idx + 1}
                          </div>
                        </div>

                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {prod.name}
                          </h4>
                          <span className="text-[10px] text-amber-600 font-semibold block truncate">
                            {prod.category}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-extrabold font-mono text-slate-900 block">
                          {formatMoney(prod.revenue, config.currencySymbol)}
                        </span>
                        <span className="text-[11px] font-bold text-amber-600">
                          {prod.units} {prod.units === 1 ? 'copa' : 'copas'}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar Visual Representation */}
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                      <div
                        className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
                <Coffee className="w-6 h-6" />
              </div>
              <div className="max-w-sm mx-auto space-y-1">
                <h4 className="text-sm font-bold text-slate-800">
                  Aún no hay comandas registradas
                </h4>
                <p className="text-xs text-slate-500">
                  El sistema está limpio y listo para tus pruebas. Realiza tu primera venta en el módulo <strong>Caja POS</strong> o abre una mesa en <strong>Salón</strong> para ver esta gráfica actualizarse en vivo.
                </p>
              </div>
              <button
                onClick={() => setAdminSubTab('pos')}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
              >
                Hacer Pedido de Prueba en POS
              </button>
            </div>
          )}
        </div>

        {/* Right (5 cols): SALÓN DE MESAS EN VIVO */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-display">
                  Salón & Mesas en Tiempo Real
                </h3>
                <p className="text-xs text-slate-400">
                  {tables.length} mesas configuradas ({freeTables} libres · {occupiedTables} ocupadas)
                </p>
              </div>
              <button
                onClick={() => setAdminSubTab('tables')}
                className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 cursor-pointer"
              >
                <span>Plano Salón</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick visual table grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {tables.slice(0, 12).map(table => (
                <div
                  key={table.id}
                  onClick={() => setAdminSubTab('tables')}
                  className={`p-2 rounded-xl border text-center transition-all cursor-pointer hover:scale-105 ${
                    table.status === 'ocupada'
                      ? 'bg-amber-50 border-amber-300 text-amber-900'
                      : table.status === 'cuenta'
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-900'
                      : table.status === 'reservada'
                      ? 'bg-purple-50 border-purple-300 text-purple-900'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  }`}
                >
                  <span className="text-[10px] font-bold block truncate">{table.name}</span>
                  <span className="text-[9px] uppercase font-semibold opacity-80">
                    {table.status === 'libre' ? 'Libre' : table.status === 'ocupada' ? 'Ocupada' : table.status}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setAdminSubTab('tables')}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Store className="w-3.5 h-3.5 text-amber-600" />
              <span>Gestionar Mapa de Mesas y Comandas</span>
            </button>
          </div>

          {/* Quick Inventory alert */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900 font-display">
                Insumos & Inventario
              </h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                lowStockItems.length > 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
              }`}>
                {lowStockItems.length} insumos bajos
              </span>
            </div>

            <div className="space-y-1.5">
              {lowStockItems.slice(0, 3).map(item => (
                <div
                  key={item.id}
                  className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                >
                  <span className="font-semibold text-slate-800 truncate mr-2">{item.name}</span>
                  <span className="font-mono font-bold text-rose-600 shrink-0">
                    {item.currentStock} {item.unit}
                  </span>
                </div>
              ))}

              {lowStockItems.length === 0 && (
                <div className="p-3 text-center text-xs text-emerald-700 bg-emerald-50 rounded-xl">
                  ✓ Todos los insumos cuentan con stock disponible
                </div>
              )}
            </div>

            <button
              onClick={() => setAdminSubTab('inventory')}
              className="w-full text-center text-xs font-semibold text-amber-600 hover:text-amber-700 pt-1 block cursor-pointer"
            >
              Ver inventario completo →
            </button>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* MODAL 1: APERTURA DE CAJA CON BASE INICIAL                       */}
      {/* ---------------------------------------------------------------- */}
      {isOpeningModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
                  <Unlock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-display">
                    Apertura de Caja & Saldo Base
                  </h3>
                  <p className="text-xs text-slate-500">
                    Ingresa el monto con el que se abre la caja para cambio
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpeningModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleOpenCashSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Valor con el que se abre caja (Base Inicial en Efectivo) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                    {config.currencySymbol}
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    required
                    value={openingBaseAmount}
                    onChange={e => setOpeningBaseAmount(Number(e.target.value))}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-300 font-mono font-bold text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="100000"
                  />
                </div>

                {/* Quick amount shortcut pills */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[50000, 100000, 150000, 200000, 300000].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setOpeningBaseAmount(val)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                        openingBaseAmount === val
                          ? 'bg-amber-500 text-white border-amber-500'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {formatMoney(val, config.currencySymbol)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cajero / Responsable del Turno
                </label>
                <input
                  type="text"
                  required
                  value={openingCashierName}
                  onChange={e => setOpeningCashierName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Nombre del cajero"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Observaciones / Desglose de billetes (Opcional)
                </label>
                <input
                  type="text"
                  value={openingNotes}
                  onChange={e => setOpeningNotes(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Ej: Billetes de $2k, $5k y monedas para cambio"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpeningModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Confirmar Apertura de Caja
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* MODAL 2: CIERRE DE CAJA & ARQUEO DE EFECTIVO                     */}
      {/* ---------------------------------------------------------------- */}
      {isClosingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center font-bold">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-display">
                    Cierre de Caja & Cuadre de Arqueo
                  </h3>
                  <p className="text-xs text-slate-500">
                    Compara el efectivo esperado con el efectivo contado en gaveta
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsClosingModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-2 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Base con la que se abrió:</span>
                <span className="font-mono font-semibold">
                  {formatMoney(cashShift.initialAmount, config.currencySymbol)}
                </span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>+ Ventas del turno en Efectivo:</span>
                <span className="font-mono font-semibold">
                  +{formatMoney(todayCashSales, config.currencySymbol)}
                </span>
              </div>
              <div className="flex justify-between text-rose-600">
                <span>- Gastos/Salidas registradas:</span>
                <span className="font-mono font-semibold">
                  -{formatMoney(todayCashExpenses, config.currencySymbol)}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900 text-sm">
                <span>Efectivo Esperado en Gaveta:</span>
                <span className="font-mono text-emerald-800">
                  {formatMoney(expectedCashInDrawer, config.currencySymbol)}
                </span>
              </div>
            </div>

            <form onSubmit={handleCloseCashSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Efectivo Real Contado en Gaveta *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                    {config.currencySymbol}
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    required
                    value={countedCash}
                    onChange={e => setCountedCash(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-300 font-mono font-bold text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    placeholder="Ingresa el dinero físico contado"
                  />
                </div>

                {/* Instant Difference Indicator */}
                {countedCash !== '' && (
                  <div className="mt-2">
                    {Number(countedCash) === expectedCashInDrawer ? (
                      <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>¡Caja perfectamente cuadrada! Sin diferencias.</span>
                      </div>
                    ) : Number(countedCash) > expectedCashInDrawer ? (
                      <div className="p-2 rounded-lg bg-sky-50 border border-sky-200 text-sky-800 text-xs font-bold flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-sky-600 shrink-0" />
                        <span>
                          Sobrante en caja de +{formatMoney(Number(countedCash) - expectedCashInDrawer, config.currencySymbol)}
                        </span>
                      </div>
                    ) : (
                      <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>
                          Faltante en caja de -{formatMoney(expectedCashInDrawer - Number(countedCash), config.currencySymbol)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Notas de Cierre de Turno
                </label>
                <input
                  type="text"
                  value={closingNotes}
                  onChange={e => setClosingNotes(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  placeholder="Ej: Billetes entregados a administración"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsClosingModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Confirmar Cierre de Caja
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* MODAL 3: CONFIRMAR LIMPIAR DATOS ESTÁTICOS                       */}
      {/* ---------------------------------------------------------------- */}
      {isClearConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <RotateCcw className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 font-display">
                ¿Limpiar todos los datos estáticos del sistema?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Esta acción restablecerá el sistema a cero para que puedas probar todo desde limpio:
              </p>
            </div>

            <ul className="text-xs text-slate-600 space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>Se borrarán todos los pedidos y comandas previas (0 ventas).</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>Se liberarán todas las 14 mesas (todas en estado "libre").</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>Se cerrará la caja (para probar el flujo de apertura con base).</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>Se mantendrán intactos los productos del catálogo y usuarios.</span>
              </li>
            </ul>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsClearConfirmOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleClearStaticData}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Sí, Limpiar a Cero
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
