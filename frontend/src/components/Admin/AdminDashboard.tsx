import React, { useState } from 'react';
import { useApp, AdminModuleTab } from '../../context/AppContext';
import { AdminDashboardOverview } from './AdminDashboardOverview';
import { OrdersPipeline } from './OrdersPipeline';
import { FinancesAnalytics } from './FinancesAnalytics';
import { CatalogManager } from './CatalogManager';
import { MenuQrManager } from './MenuQrManager';
import { TablesManager } from './TablesManager';
import { InventoryManager } from './InventoryManager';
import { UsersManager } from './UsersManager';
import { StaffManager } from './StaffManager';
import { PosCashier } from './PosCashier';
import { Order } from '../../types';
import { formatMoney } from '../../utils/format';
import {
  LayoutDashboard,
  Layers,
  TrendingUp,
  Package,
  QrCode,
  Users,
  Settings,
  Download,
  Upload,
  RotateCcw,
  Boxes,
  CheckCircle2,
  X,
  Store,
  ChefHat,
  ShoppingBag,
} from 'lucide-react';

interface AdminDashboardProps {
  onViewOrderReceipt: (order: Order) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onViewOrderReceipt }) => {
  const {
    adminSubTab,
    setAdminSubTab,
    orders,
    tables,
    inventory,
    config,
    currentUser,
    updateConfig,
    exportDataJson,
    importDataJson,
    resetAllData,
  } = useApp();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [configName, setConfigName] = useState(config.name);
  const [configPhone, setConfigPhone] = useState(config.phoneWhatsApp);
  const [configAddress, setConfigAddress] = useState(config.address);
  const [configLogo, setConfigLogo] = useState(config.logoUrl || '');
  const [configCategories, setConfigCategories] = useState(config.customCategories?.join(', ') || 'Frutales, Cremosos, Cítricos & Chamoy, Especiales');

  // Today stats
  const todayStr = new Date().toDateString();
  const todayOrders = orders.filter(
    o => o.status !== 'Cancelado' && new Date(o.createdAt).toDateString() === todayStr
  );
  const todaySales = todayOrders.reduce((sum, o) => sum + o.total, 0);

  const pendingCount = orders.filter(
    o => o.status === 'Pendiente' || o.status === 'En preparación'
  );

  const lowStockCount = inventory.filter(i => i.currentStock <= i.minAlertStock).length;
  const occupiedTablesCount = tables.filter(t => t.status === 'ocupada' || t.status === 'cuenta').length;

  const handleExport = () => {
    const jsonStr = exportDataJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `doblee-pos-respaldo-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      const success = importDataJson(content);
      if (success) {
        alert('Datos importados y restaurados exitosamente.');
      } else {
        alert('Error al leer el archivo JSON.');
      }
    };
    reader.readAsText(file);
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfig({
      name: configName.trim() || 'DobleE',
      phoneWhatsApp: configPhone.trim(),
      address: configAddress.trim(),
      logoUrl: configLogo.trim() || undefined,
      customCategories: configCategories.split(',').map(c => c.trim()).filter(Boolean),
    });
    setIsSettingsOpen(false);
  };

  const menuSections = [
    {
      title: 'Inicio',
      items: [
        { id: 'dashboard', label: 'Resumen General', icon: LayoutDashboard },
      ]
    },
    {
      title: 'Ventas',
      items: [
        { id: 'pos', label: 'Caja POS', icon: ShoppingBag },
        {
          id: 'orders',
          label: 'Pedidos',
          icon: Layers,
          badge: pendingCount.length > 0 ? pendingCount.length : undefined,
          badgeColor: 'bg-amber-500 text-white',
        },
        {
          id: 'tables',
          label: 'Salón & Mesas',
          icon: Store,
          badge: occupiedTablesCount > 0 ? occupiedTablesCount : undefined,
          badgeColor: 'bg-rose-500 text-white',
        },
      ]
    },
    {
      title: 'Catálogo',
      items: [
        { id: 'catalog', label: 'Productos', icon: Package },
        { id: 'menu_qr', label: 'Menú QR', icon: QrCode },
      ]
    },
    {
      title: 'Administración',
      items: [
        { id: 'finances', label: 'Finanzas & Caja', icon: TrendingUp },
        {
          id: 'inventory',
          label: 'Inventario',
          icon: Boxes,
          badge: lowStockCount > 0 ? lowStockCount : undefined,
          badgeColor: 'bg-rose-500 text-white',
        },
        { id: 'users', label: 'Clientes Club', icon: Users },
        { id: 'staff', label: 'Personal', icon: ChefHat },
      ]
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-5 py-4 sm:py-5">
      {/* 2-Column High-Density Layout: Left Sidebar (Sticky) + Main Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-start">
        {/* Left Sidebar (Col 1-3) - Sticky in viewport, elegant scroll */}
        <aside className="lg:col-span-3 lg:sticky lg:top-20 bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4" style={{ maxHeight: 'calc(100vh - 6rem)', overflowY: 'auto', scrollbarWidth: 'none' }}>
          <div className="space-y-4">
            {/* Sidebar Brand Header */}
            <div className="px-2 pt-1 flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div>
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Panel de Control
                </span>
                <span className="text-[11px] text-slate-400">
                  Administración y Operaciones
                </span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500" title="En línea" />
            </div>

            {/* Vertical Navigation Links Grouped */}
            <div className="space-y-5">
              {menuSections.map((section, idx) => (
                <div key={idx}>
                  <h3 className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{section.title}</h3>
                  <nav className="space-y-0.5">
                    {section.items.map(item => {
                      const Icon = item.icon;
                      const isActive = adminSubTab === item.id || (item.id === 'users' && adminSubTab === 'loyalty') || (item.id === 'finances' && adminSubTab === 'expenses');
                      return (
                        <button
                          key={item.id}
                          onClick={() => setAdminSubTab(item.id as AdminModuleTab)}
                          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                            isActive
                              ? 'bg-amber-500 text-white shadow-xs font-bold'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                            <span>{item.label}</span>
                          </div>

                          {item.badge !== undefined && item.badge > 0 && (
                            <span
                              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                                isActive
                                  ? 'bg-white text-amber-900'
                                  : item.badgeColor || 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </nav>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Card: Live Cash Drawer / Business Balance */}
          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white space-y-2 relative overflow-hidden shadow-xs">
              <div>
                <span className="text-[10px] text-white/90 block font-medium uppercase tracking-wider">
                  Ventas de Hoy
                </span>
                <div className="text-lg font-black font-display tracking-tight text-white">
                  {formatMoney(todaySales, config.currencySymbol)}
                </div>
              </div>

              <div className="pt-2 border-t border-white/20 flex items-center justify-between text-xs">
                <span className="text-[10px] text-white/80">
                  {todayOrders.length} pedidos hoy
                </span>
                <button
                  onClick={() => setAdminSubTab('finances')}
                  className="px-2 py-0.5 rounded-md bg-white text-amber-900 font-bold text-[10px] hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Caja
                </button>
              </div>
            </div>

            {/* Settings & Backup Footer Actions */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-1.5 rounded-lg hover:bg-slate-100 hover:text-slate-800 transition-colors flex items-center gap-1.5 font-medium cursor-pointer"
                title="Ajustes del Negocio"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Ajustes</span>
              </button>

              <div className="flex items-center gap-1">
                <button
                  onClick={handleExport}
                  className="p-1.5 rounded-lg hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
                  title="Exportar respaldo JSON"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>

                <label
                  className="p-1.5 rounded-lg hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
                  title="Importar respaldo JSON"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                </label>

                <button
                  onClick={() => {
                    if (confirm('¿Deseas reiniciar los datos a los valores de prueba originales?')) {
                      resetAllData();
                    }
                  }}
                  className="p-1.5 rounded-lg hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                  title="Reiniciar Demo"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Center & Main Content Space (Col 4-12) */}
        <div className="lg:col-span-9 space-y-4">
          {/* Module View Content */}
          <div>
            {adminSubTab === 'dashboard' && <AdminDashboardOverview />}
            {adminSubTab === 'pos' && <PosCashier onOrderCompleted={() => setAdminSubTab('orders')} />}
            {adminSubTab === 'orders' && <OrdersPipeline onViewOrderReceipt={onViewOrderReceipt} />}
            {adminSubTab === 'tables' && (
              <TablesManager
                onViewOrderReceipt={(orderId) => {
                  const order = orders.find(o => o.id === orderId);
                  if (order) onViewOrderReceipt(order);
                }}
              />
            )}
            {adminSubTab === 'catalog' && <CatalogManager />}
            {adminSubTab === 'menu_qr' && <MenuQrManager />}
            {(adminSubTab === 'finances' || adminSubTab === 'expenses') && <FinancesAnalytics />}
            {adminSubTab === 'inventory' && <InventoryManager />}
            {(adminSubTab === 'users' || adminSubTab === 'loyalty') && <UsersManager />}
            {adminSubTab === 'staff' && <StaffManager />}
          </div>
        </div>
      </div>

      {/* Business Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold font-display text-slate-900">
                Ajustes de {config.name}
              </h3>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nombre Comercial</label>
                <input
                  type="text"
                  required
                  value={configName}
                  onChange={e => setConfigName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">WhatsApp de Atención</label>
                <input
                  type="text"
                  required
                  value={configPhone}
                  onChange={e => setConfigPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Dirección del Local</label>
                <input
                  type="text"
                  required
                  value={configAddress}
                  onChange={e => setConfigAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">URL Logo (Opcional)</label>
                <input
                  type="url"
                  placeholder="https://ejemplo.com/logo.png"
                  value={configLogo}
                  onChange={e => setConfigLogo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Categorías de Menú (Separadas por coma)</label>
                <textarea
                  rows={2}
                  value={configCategories}
                  onChange={e => setConfigCategories(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-[11px]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold"
                >
                  Guardar Ajustes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
