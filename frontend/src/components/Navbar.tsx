import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { apiGetRecentAudit } from '../services/api';
import {
  LogOut,
  Bell,
  Store,
  ChefHat,
  Shield,
  Search,
  ShoppingBag,
  Edit2,
  LogIn,
  CreditCard,
  Trash2,
  AlertCircle,
  X,
} from 'lucide-react';

const ACTION_ICON: Record<string, React.ElementType> = {
  ORDER_CREATED:    ShoppingBag,
  ORDER_UPDATED:    Edit2,
  ORDER_DELETED:    Trash2,
  PRODUCT_CREATED:  ShoppingBag,
  PRODUCT_UPDATED:  Edit2,
  USER_LOGIN:       LogIn,
  PAYMENT_RECEIVED: CreditCard,
  CASHSHIFT_OPENED: CreditCard,
  CASHSHIFT_CLOSED: CreditCard,
};

const ACTION_COLOR: Record<string, string> = {
  ORDER_CREATED:    'bg-emerald-100 text-emerald-700',
  ORDER_UPDATED:    'bg-blue-100 text-blue-700',
  ORDER_DELETED:    'bg-rose-100 text-rose-700',
  PRODUCT_CREATED:  'bg-violet-100 text-violet-700',
  PRODUCT_UPDATED:  'bg-violet-100 text-violet-700',
  USER_LOGIN:       'bg-amber-100 text-amber-700',
  PAYMENT_RECEIVED: 'bg-teal-100 text-teal-700',
};

function relativeTime(dt: string) {
  const diff = Math.floor((Date.now() - new Date(dt).getTime()) / 1000);
  if (diff < 60) return 'hace un momento';
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  return new Date(dt).toLocaleDateString('es-CO', { dateStyle: 'short' });
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
}

function getNotifDescription(n: any): { title: string; subtitle: string } {
  let details: any = {};
  try { if (n.details) details = JSON.parse(n.details); } catch { /* ignore */ }
  const by = n.userName ? ` · por ${n.userName}` : '';

  switch (n.action) {
    case 'ORDER_CREATED':
      return {
        title: `Nuevo pedido de ${details.customerName || 'Cliente'}`,
        subtitle: `${details.itemCount || '?'} item(s) · ${details.total ? fmt(details.total) : ''} · ${details.table || 'Mostrador'}${by}`,
      };
    case 'ORDER_UPDATED':
      if (details.status) {
        return { title: `Pedido actualizado → ${details.status}`, subtitle: `Mesa: ${details.tableName || '-'}${by}` };
      }
      return { title: 'Pedido modificado', subtitle: `Campos: ${Object.keys(details).join(', ')}${by}` };
    case 'ORDER_DELETED':
      return { title: 'Pedido eliminado', subtitle: by.trim() };
    case 'PRODUCT_CREATED':
      return { title: `Nuevo producto: "${details.name || '?'}"`, subtitle: `${details.category || ''} · ${details.basePrice ? fmt(details.basePrice) : ''}${by}` };
    case 'PRODUCT_UPDATED':
      return { title: `Producto actualizado: "${details.name || '?'}"`, subtitle: `${details.category || ''}${by}` };
    case 'PRODUCT_DELETED':
      return { title: `Producto eliminado: "${details.name || '?'}"`, subtitle: by.trim() };
    case 'USER_LOGIN':
      return { title: `Inicio de sesión`, subtitle: `${n.userName || 'Usuario'} (${details.role || 'desconocido'}) · ${n.ip || ''}` };
    case 'CASHSHIFT_OPENED':
      return { title: 'Caja abierta', subtitle: `${details.openingCash ? fmt(details.openingCash) : ''} apertura${by}` };
    case 'CASHSHIFT_CLOSED':
      return { title: 'Caja cerrada', subtitle: `${details.closingCash ? fmt(details.closingCash) : ''}${by}` };
    case 'EXPENSE_CREATED':
      return { title: `Gasto: "${details.description || '?'}"`, subtitle: `${details.amount ? fmt(details.amount) : ''}${by}` };
    default:
      return { title: n.action.replace(/_/g, ' '), subtitle: by.trim() };
  }
}

export const Navbar: React.FC = () => {
  const { config, currentUser, logout, orders } = useApp();

  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastSeen, setLastSeen] = useState<string>(() =>
    localStorage.getItem('notif_last_seen') || new Date(0).toISOString()
  );
  const notifRef = useRef<HTMLDivElement>(null);

  // Profile avatar from localStorage
  const profileAvatar = localStorage.getItem('user_avatar');

  const pendingOrders = orders.filter(
    o => o.status === 'Pendiente' || o.status === 'En preparación'
  ).length;

  const fetchNotifications = useCallback(async () => {
    try {
      const logs = await apiGetRecentAudit();
      setNotifications(logs);
      const unseen = logs.filter((l: any) => l.createdAt > lastSeen).length;
      setUnreadCount(unseen + (pendingOrders > 0 ? 1 : 0));
    } catch {
      // Silently fail — maybe not logged in yet or audit not available
    }
  }, [lastSeen, pendingOrders]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const openNotifications = () => {
    setNotifOpen(v => !v);
    const now = new Date().toISOString();
    setLastSeen(now);
    setUnreadCount(0);
    localStorage.setItem('notif_last_seen', now);
  };

  const roleLabels: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; }> = {
    admin:      { label: 'Administrador',    icon: Store },
    mesero:     { label: 'Mesero en Turno',  icon: ChefHat },
    superadmin: { label: 'Super Admin',      icon: Shield },
  };

  const currentRoleInfo = currentUser?.role ? roleLabels[currentUser.role] ?? roleLabels.admin : roleLabels.admin;
  const RoleIcon = currentRoleInfo.icon;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

        {/* Brand Lockup */}
        <div className="flex items-center gap-3 shrink-0">
          {config.logoUrl ? (
            <img src={config.logoUrl} alt="Logo" className="h-10 w-auto max-w-[140px] object-contain" />
          ) : (
            <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 font-display">
              {config.name}<span className="text-amber-500">.</span>
            </span>
          )}
        </div>

        {/* Center: Search Bar */}
        <div className="hidden sm:flex items-center flex-1 max-w-lg mx-4 gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              readOnly
              placeholder="¿Qué granizado, insumo o comanda buscas hoy?..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-full bg-slate-50 border border-slate-200/80 text-slate-600 focus:outline-none"
            />
          </div>
        </div>

        {/* Right: Notifications + Profile + Logout */}
        <div className="flex items-center gap-3">

          {/* Notifications Bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={openNotifications}
              className="relative p-2 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              title="Notificaciones"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[14px] h-[14px] rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center px-0.5 ring-2 ring-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {notifOpen && (
              <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-800">Notificaciones</span>
                  <button onClick={() => setNotifOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Pending orders alert */}
                {pendingOrders > 0 && (
                  <div className="flex items-center gap-3 px-4 py-2.5 bg-amber-50 border-b border-amber-100">
                    <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center shrink-0">
                      <ShoppingBag className="w-3 h-3 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-amber-900">{pendingOrders} pedido{pendingOrders > 1 ? 's' : ''} pendiente{pendingOrders > 1 ? 's' : ''}</p>
                      <p className="text-[10px] text-amber-700">Requieren atención inmediata</p>
                    </div>
                  </div>
                )}

                {/* Audit events */}
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <Bell className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                      <p className="text-xs text-slate-400">Sin notificaciones</p>
                    </div>
                  ) : (
                    notifications.map((n: any) => {
                      const Icon = ACTION_ICON[n.action] || AlertCircle;
                      const color = ACTION_COLOR[n.action] || 'bg-slate-100 text-slate-600';
                      return (
                        <div key={n.id} className="flex items-start gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors">
                          <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${color}`}>
                            <Icon className="w-3 h-3" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-800 truncate">
                              {n.action.replace(/_/g, ' ')}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {n.userName || 'Sistema'} · {relativeTime(n.createdAt)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          {currentUser && (
            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                {profileAvatar
                  ? <img src={profileAvatar} alt="Avatar" className="w-full h-full object-cover" />
                  : <span className="text-white">{currentUser.name.charAt(0).toUpperCase()}</span>
                }
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-slate-900 leading-tight">{currentUser.name}</div>
                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                  <RoleIcon className="w-3 h-3 text-amber-500" />
                  <span>{currentRoleInfo.label}</span>
                </div>
              </div>
            </div>
          )}

          {/* Logout */}
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 text-xs font-semibold border border-slate-200 hover:border-rose-200 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </header>
  );
};
