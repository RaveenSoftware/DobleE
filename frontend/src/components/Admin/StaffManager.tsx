import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StaffMember } from '../../types';
import { formatMoney } from '../../utils/format';
import {
  Users,
  Plus,
  KeyRound,
  Phone,
  Clock,
  DollarSign,
  Play,
  Square,
  Edit2,
  X,
  ChefHat,
  ShoppingBag,
  Pencil,
  Trash2,
  UserCheck,
} from 'lucide-react';
import { UserManagement } from '../UserManagement';

const roleColors: Record<string, { bg: string; text: string; border: string; accent: string }> = {
  Mesero: {
    bg: 'bg-amber-50',
    text: 'text-amber-900',
    border: 'border-amber-200',
    accent: 'bg-amber-500',
  },
  Cajero: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-900',
    border: 'border-indigo-200',
    accent: 'bg-indigo-500',
  },
  'Encargado de Barra': {
    bg: 'bg-emerald-50',
    text: 'text-emerald-900',
    border: 'border-emerald-200',
    accent: 'bg-emerald-500',
  },
};

const getRoleStyle = (role: string) =>
  roleColors[role] ?? { bg: 'bg-slate-50', text: 'text-slate-800', border: 'border-slate-200', accent: 'bg-slate-500' };

export const StaffManager: React.FC = () => {
  const {
    staff,
    addStaffMember,
    updateStaffMember,
    toggleStaffShift,
    config,
    login,
    setCurrentRole,
  } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [role, setRole] = useState<StaffMember['role']>('Mesero');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('1234');

  const totalStaffSales = staff.reduce((s, m) => s + m.totalSales, 0);
  const totalStaffOrders = staff.reduce((s, m) => s + m.totalOrders, 0);
  const onShiftCount = staff.filter(m => m.active && m.shiftActive !== false).length;

  const openCreateModal = () => {
    setEditingStaffId(null);
    setName('');
    setRole('Mesero');
    setPhone('');
    setPin(Math.floor(1000 + Math.random() * 9000).toString());
    setIsModalOpen(true);
  };

  const openEditModal = (member: StaffMember) => {
    setEditingStaffId(member.id);
    setName(member.name);
    setRole(member.role);
    setPhone(member.phone);
    setPin(member.pin);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingStaffId) {
      updateStaffMember(editingStaffId, {
        name: name.trim(),
        role,
        phone: phone.trim(),
        pin: pin.trim() || '1234',
      });
    } else {
      addStaffMember({
        name: name.trim(),
        role,
        phone: phone.trim(),
        pin: pin.trim() || '1234',
        active: true,
      });
    }
    setIsModalOpen(false);
  };

  const handleTestLoginAsWaiter = (member: StaffMember) => {
    login({ role: 'mesero', staffId: member.id });
    setCurrentRole('mesero');
  };

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black font-display text-slate-900 tracking-tight">
            Personal & Turnos
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Administra tu equipo de trabajo, turnos y accesos PIN.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="self-start sm:self-auto px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-xs shadow-sm shadow-amber-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nuevo Colaborador
        </button>
      </div>

      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: 'En turno',
            value: onShiftCount,
            sub: 'activos ahora',
            icon: <Clock className="w-4 h-4" />,
            color: 'text-emerald-600',
            iconBg: 'bg-emerald-50 text-emerald-600',
          },
          {
            label: 'Total equipo',
            value: staff.length,
            sub: 'colaboradores',
            icon: <Users className="w-4 h-4" />,
            color: 'text-slate-900',
            iconBg: 'bg-slate-100 text-slate-600',
          },
          {
            label: 'Ventas del equipo',
            value: formatMoney(totalStaffSales, config.currencySymbol),
            sub: `${totalStaffOrders} órdenes`,
            icon: <DollarSign className="w-4 h-4" />,
            color: 'text-amber-600',
            iconBg: 'bg-amber-50 text-amber-600',
          },
          {
            label: 'Promedio por orden',
            value: totalStaffOrders
              ? formatMoney(Math.round(totalStaffSales / totalStaffOrders), config.currencySymbol)
              : '–',
            sub: 'ticket promedio',
            icon: <ShoppingBag className="w-4 h-4" />,
            color: 'text-slate-900',
            iconBg: 'bg-slate-100 text-slate-600',
          },
        ].map(kpi => (
          <div
            key={kpi.label}
            className="bg-white rounded-2xl p-4 border border-slate-200/70 shadow-xs flex items-center justify-between gap-3"
          >
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {kpi.label}
              </span>
              <span className={`text-lg font-black font-display ${kpi.color}`}>
                {kpi.value}
              </span>
              <span className="text-[10px] text-slate-400 block">{kpi.sub}</span>
            </div>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${kpi.iconBg}`}>
              {kpi.icon}
            </div>
          </div>
        ))}
      </div>

      {/* ── Staff Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {staff.map(member => {
          const isOnShift = member.active && member.shiftActive !== false;
          const rs = getRoleStyle(member.role);

          return (
            <div
              key={member.id}
              className={`bg-white rounded-2xl border shadow-xs flex flex-col transition-all ${
                isOnShift
                  ? 'border-emerald-300 ring-1 ring-emerald-100'
                  : 'border-slate-200/80'
              }`}
            >
              {/* Card top accent */}
              <div className={`h-1 rounded-t-2xl ${isOnShift ? 'bg-emerald-400' : 'bg-slate-200'}`} />

              <div className="p-5 flex flex-col gap-4 flex-1">

                {/* ── Identity row ── */}
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-base text-white shadow-sm ${rs.accent}`}>
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 truncate leading-tight">
                      {member.name}
                    </h4>
                    <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${rs.bg} ${rs.text} ${rs.border}`}>
                      {member.role}
                    </span>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                      isOnShift
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isOnShift ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                    {isOnShift ? 'En turno' : 'Inactivo'}
                  </span>
                </div>

                {/* ── Credentials & stats row ── */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Phone */}
                  <div className="flex flex-col gap-0.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Phone className="w-3 h-3" /> Teléfono
                    </span>
                    <span className="text-xs font-mono font-semibold text-slate-800 truncate">
                      {member.phone || '–'}
                    </span>
                  </div>

                  {/* PIN */}
                  <div className="flex flex-col gap-0.5 p-3 rounded-xl bg-amber-50 border border-amber-100">
                    <span className="text-[9px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1">
                      <KeyRound className="w-3 h-3" /> PIN de Acceso
                    </span>
                    <span className="text-sm font-mono font-black text-amber-900 tracking-widest">
                      {member.pin}
                    </span>
                  </div>

                  {/* Sales */}
                  <div className="col-span-2 flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <ShoppingBag className="w-3 h-3" /> Ventas históricas
                    </span>
                    <span className="text-xs font-black text-slate-800 font-mono">
                      {formatMoney(member.totalSales, config.currencySymbol)}
                      <span className="text-[10px] font-normal text-slate-400 ml-1">
                        ({member.totalOrders} órd.)
                      </span>
                    </span>
                  </div>
                </div>

                {/* ── Action buttons ── */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-100 mt-auto">
                  {/* Toggle shift */}
                  <button
                    onClick={() => toggleStaffShift(member.id)}
                    className={`flex-1 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border ${
                      isOnShift
                        ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                    }`}
                  >
                    {isOnShift ? (
                      <><Square className="w-3.5 h-3.5" /> Cerrar turno</>
                    ) : (
                      <><Play className="w-3.5 h-3.5" /> Iniciar turno</>
                    )}
                  </button>

                  {/* Ver POS */}
                  <button
                    onClick={() => handleTestLoginAsWaiter(member)}
                    className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    title="Entrar al POS como este colaborador"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Ver POS</span>
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => openEditModal(member)}
                    className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 cursor-pointer"
                    title="Editar"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Empty state */}
        {staff.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-center gap-3">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center">
              <Users className="w-7 h-7 text-slate-400" />
            </div>
            <div>
              <p className="font-bold text-slate-700 text-sm">Sin colaboradores</p>
              <p className="text-xs text-slate-400 mt-0.5">Agrega tu primer mesero o cajero para comenzar.</p>
            </div>
            <button
              onClick={openCreateModal}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs cursor-pointer"
            >
              + Agregar Colaborador
            </button>
          </div>
        )}
      </div>

      {/* ── Modal: Crear / Editar ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 border border-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 font-display">
                {editingStaffId ? 'Editar colaborador' : 'Nuevo colaborador'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Mateo Restrepo"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Rol / Cargo</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as StaffMember['role'])}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
                >
                  <option value="Mesero">Mesero (Toma pedidos en mesas)</option>
                  <option value="Encargado de Barra">Encargado de Barra (Prepara bebidas)</option>
                  <option value="Cajero">Cajero (Cobra y emite tickets)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Teléfono Móvil</label>
                <input
                  type="tel"
                  placeholder="ej. 3124567890"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">PIN de Acceso (4 dígitos)</label>
                <input
                  type="text"
                  maxLength={4}
                  required
                  placeholder="ej. 4891"
                  value={pin}
                  onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-mono text-center text-base font-bold tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  El colaborador usará este PIN para iniciar sesión rápidamente.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold cursor-pointer"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Credentials panel ── */}
      <UserManagement roleToCreate="mesero" />
    </div>
  );
};
