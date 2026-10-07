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
import { AuditModule } from './AuditModule';
import { Order } from '../../types';
import {
  LayoutDashboard,
  Layers,
  TrendingUp,
  Package,
  QrCode,
  Users,
  Settings,
  Boxes,
  X,
  Store,
  ChefHat,
  ShoppingBag,
  Menu,
  Shield,
  Camera,
  LogOut,
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
    logout,
    updateConfig,
  } = useApp();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [configName, setConfigName] = useState(config.name);
  const [configPhone, setConfigPhone] = useState(config.phoneWhatsApp);
  const [configAddress, setConfigAddress] = useState(config.address);
  const [configLogo, setConfigLogo] = useState(config.logoUrl || '');
  const [configCategories, setConfigCategories] = useState(config.customCategories?.join(', ') || 'Frutales, Cremosos, Cítricos & Chamoy, Especiales');
  const [profileName, setProfileName] = useState(currentUser?.name || '');
  const [profileAvatar, setProfileAvatar] = useState<string | null>(
    () => localStorage.getItem('user_avatar')
  );

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1.5 * 1024 * 1024) {
      alert('La imagen es muy grande. Por favor usa una menor a 1.5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = ev => {
      const result = ev.target?.result as string;
      setProfileAvatar(result);
      try {
        localStorage.setItem('user_avatar', result);
      } catch (err) {
        alert('No se pudo guardar la imagen (es muy pesada o no hay espacio).');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1.5 * 1024 * 1024) {
      alert('La imagen es muy grande. Por favor usa una menor a 1.5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = ev => {
      const result = ev.target?.result as string;
      setConfigLogo(result);
    };
    reader.readAsDataURL(file);
  };

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

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfig({
      name: configName.trim() || 'DobleE',
      phoneWhatsApp: configPhone.trim(),
      address: configAddress.trim(),
      logoUrl: configLogo || undefined,
      customCategories: configCategories.split(',').map(c => c.trim()).filter(Boolean),
    });
    setIsSettingsOpen(false);
  };

  const isCajero = currentUser?.role?.toLowerCase() === 'cajero';

  React.useEffect(() => {
    if (isCajero && adminSubTab === 'dashboard') {
      setAdminSubTab('pos');
    }
  }, [isCajero, adminSubTab, setAdminSubTab]);

  const menuSections = [
    ...(isCajero ? [] : [{
      title: 'Inicio',
      items: [
        { id: 'dashboard', label: 'Resumen General', icon: LayoutDashboard },
      ]
    }]),
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
    ...(isCajero ? [] : [{
      title: 'Catálogo',
      items: [
        { id: 'catalog', label: 'Productos', icon: Package },
        { id: 'menu_qr', label: 'Menú QR', icon: QrCode },
      ]
    }]),
    {
      title: 'Administración',
      items: isCajero ? [
        { id: 'finances', label: 'Finanzas & Caja', icon: TrendingUp }
      ] : [
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
        { id: 'audit', label: 'Auditoría', icon: Shield },
      ]
    }
  ];

  const activeLabel = menuSections.flatMap(s => s.items).find(i => i.id === adminSubTab)?.label || 'Panel';

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-5 py-4 sm:py-5 pb-24 lg:pb-5">
      {/* Mobile Bottom Tab Bar (Apple Style) */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/90 backdrop-blur-xl border-t border-slate-200/50 pb-safe shadow-[0_-8px_30px_rgb(0,0,0,0.08)]">
        <div className="flex items-center justify-around px-2 py-2">
          {!isCajero && (
            <button onClick={() => setAdminSubTab('dashboard')} className={`flex flex-col items-center p-2 rounded-xl transition-colors ${adminSubTab === 'dashboard' ? 'text-amber-500' : 'text-slate-400'}`}>
              <LayoutDashboard className="w-[22px] h-[22px] mb-1" />
              <span className="text-[10px] font-medium">Inicio</span>
            </button>
          )}
          <button onClick={() => setAdminSubTab('pos')} className={`flex flex-col items-center p-2 rounded-xl transition-colors ${adminSubTab === 'pos' ? 'text-amber-500' : 'text-slate-400'}`}>
            <ShoppingBag className="w-[22px] h-[22px] mb-1" />
            <span className="text-[10px] font-medium">POS</span>
          </button>
          <button onClick={() => setAdminSubTab('orders')} className={`relative flex flex-col items-center p-2 rounded-xl transition-colors ${adminSubTab === 'orders' ? 'text-amber-500' : 'text-slate-400'}`}>
            <div className="relative">
              <Layers className="w-[22px] h-[22px] mb-1" />
              {pendingCount.length > 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border border-white"></span>}
            </div>
            <span className="text-[10px] font-medium">Pedidos</span>
          </button>
          <button onClick={() => setAdminSubTab('tables')} className={`flex flex-col items-center p-2 rounded-xl transition-colors ${adminSubTab === 'tables' ? 'text-amber-500' : 'text-slate-400'}`}>
             <Store className="w-[22px] h-[22px] mb-1" />
             <span className="text-[10px] font-medium">Mesas</span>
          </button>
          <button onClick={() => setSidebarOpen(true)} className="flex flex-col items-center p-2 rounded-xl text-slate-400 transition-colors">
            <Menu className="w-[22px] h-[22px] mb-1" />
            <span className="text-[10px] font-medium">Menú</span>
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
        />
      )}

      {/* 2-Column Layout: Sidebar + Main */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-start">
        {/* Left Sidebar (Col 1-3) - Sticky in viewport, elegant scroll */}
        <aside
          className={`
            lg:col-span-3 lg:sticky lg:top-20
            bg-white lg:rounded-2xl lg:border lg:border-slate-200/80 lg:shadow-xs
            fixed top-0 bottom-0 left-0 z-50 w-72 sm:w-80 transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none
            lg:relative lg:z-auto lg:w-auto lg:translate-x-0 flex flex-col
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
          style={{ overflowY: 'auto', scrollbarWidth: 'none' }}
        >
          <div className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-4">
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
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" title="En línea" />
                <button
                  className="lg:hidden p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>
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
                          onClick={() => { setAdminSubTab(item.id as AdminModuleTab); setSidebarOpen(false); }}
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

          {/* Sidebar footer */}
          <div className="pt-3 border-t border-slate-100">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all cursor-pointer"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span>Ajustes del negocio</span>
            </button>
            <button
              onClick={logout}
              className="w-full lg:hidden flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors mt-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar Sesión</span>
            </button>
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
            {adminSubTab === 'audit' && <AuditModule />}
          </div>
        </div>
      </div>

      {/* Settings Modal — with profile photo + business config */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-start sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-5 space-y-5 shadow-2xl border border-slate-100 my-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold font-display text-slate-900">Ajustes</h3>
                <p className="text-xs text-slate-400">Perfil y configuración del negocio</p>
              </div>
              <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Section */}
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Mi Perfil</p>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                    {profileAvatar
                      ? <img src={profileAvatar} alt="Foto" className="w-full h-full object-cover" />
                      : <span className="text-2xl font-black text-white">{(profileName || currentUser?.name || 'A')[0].toUpperCase()}</span>
                    }
                  </div>
                  <label className="absolute -bottom-1 -right-1 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center cursor-pointer shadow-md hover:bg-amber-600 transition-colors">
                    <Camera className="w-3 h-3 text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                  </label>
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Nombre de Usuario</label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={e => setProfileName(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Tu nombre"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">{currentUser?.email}</p>
                </div>
              </div>
            </div>

            {/* Business Config (Restricted to Superadmin) */}
            {currentUser?.role === 'superadmin' && (
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Negocio</p>
              <form onSubmit={handleSaveConfig} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nombre Comercial</label>
                  <input type="text" required value={configName} onChange={e => setConfigName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500" />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">WhatsApp de Atención</label>
                  <input type="text" required value={configPhone} onChange={e => setConfigPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono" />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Dirección del Local</label>
                  <input type="text" required value={configAddress} onChange={e => setConfigAddress(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500" />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Logo del Negocio</label>
                  {/* Logo preview */}
                  {configLogo && (
                    <div className="mb-2 flex items-center gap-2">
                      <img src={configLogo} alt="Logo preview" className="h-10 w-auto max-w-[120px] object-contain rounded-lg border border-slate-200 p-1 bg-slate-50" />
                      <button type="button" onClick={() => setConfigLogo('')} className="text-[10px] text-rose-500 hover:underline cursor-pointer">Quitar</button>
                    </div>
                  )}
                  <label className="flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 border-dashed border-slate-200 hover:border-amber-400 cursor-pointer transition-colors">
                    <Camera className="w-4 h-4 text-slate-400" />
                    <span className="text-[11px] text-slate-500">Subir logo (PNG, SVG, WEBP)</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  </label>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Categorías de Menú (por coma)</label>
                  <textarea rows={2} value={configCategories} onChange={e => setConfigCategories(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-[11px]" />
                </div>
                <div className="pt-2 flex justify-end gap-2">
                  <button type="button" onClick={() => setIsSettingsOpen(false)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 font-semibold text-xs">Cancelar</button>
                  <button type="submit"
                    className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs">Guardar</button>
                </div>
              </form>
            </div>
            )}
            
            {/* Save Profile Button (if not superadmin, the form above is hidden so we need a separate save for profile) */}
            {currentUser?.role !== 'superadmin' && (
              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 mt-4">
                <button type="button" onClick={() => setIsSettingsOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs w-full">Cerrar</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
