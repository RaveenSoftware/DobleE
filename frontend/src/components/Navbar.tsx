import React from 'react';
import { useApp } from '../context/AppContext';
import { formatMoney } from '../utils/format';
import {
  LogOut,
  Bell,
  Settings,
  Store,
  ChefHat,
  Shield,
  Search,
  Lock,
  Unlock,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    config,
    currentUser,
    logout,
    orders,
    cashShift,
    setAdminSubTab,
  } = useApp();

  const pendingOrders = orders.filter(
    o => o.status === 'Pendiente' || o.status === 'En preparación'
  ).length;

  const roleLabels: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
    admin: { label: 'Dueño / Administrador', icon: Store, color: 'bg-amber-50 text-amber-900 border-amber-200' },
    mesero: { label: 'Mesero en Turno', icon: ChefHat, color: 'bg-orange-50 text-orange-900 border-orange-200' },
    superadmin: { label: 'Super Admin Global', icon: Shield, color: 'bg-indigo-50 text-indigo-900 border-indigo-200' },
  };

  const currentRoleInfo = currentUser?.role ? roleLabels[currentUser.role] : roleLabels.admin;
  const RoleIcon = currentRoleInfo.icon;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Lockup */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2">
            {config.logoUrl ? (
              <img src={config.logoUrl} alt="Logo" className="h-8 w-auto object-contain" />
            ) : (
              <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 font-display">
                {config.name}<span className="text-amber-500">.</span>
              </span>
            )}
          </div>
        </div>

        {/* Center: Search / Context & Cash Status */}
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

        {/* Right: Authenticated User Profile & Logout */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <div className="relative p-2 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors">
            <Bell className="w-4 h-4" />
            {pendingOrders > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white" />
            )}
          </div>

          {/* User profile card */}
          {currentUser && (
            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {currentUser.name.charAt(0)}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-slate-900 leading-tight">
                  {currentUser.name}
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                  <RoleIcon className="w-3 h-3 text-amber-500" />
                  <span>{currentRoleInfo.label}</span>
                </div>
              </div>
            </div>
          )}

          {/* Logout Button */}
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 text-xs font-semibold border border-slate-200 hover:border-rose-200 transition-colors cursor-pointer"
            title="Cerrar Sesión Segura"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </header>
  );
};
