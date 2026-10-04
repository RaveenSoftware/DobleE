import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StaffMember } from '../../types';
import { formatMoney } from '../../utils/format';
import {
  Users,
  Plus,
  KeyRound,
  Phone,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  Layers,
  Store,
  Play,
  Square,
  Edit2,
  X,
  ShieldCheck,
  ChefHat,
} from 'lucide-react';
import { UserManagement } from '../UserManagement';

export const StaffManager: React.FC = () => {
  const {
    staff,
    tables,
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
    <div className="space-y-4">
      {/* Header and Summary */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold font-display text-slate-900 tracking-tight">
              Meseros & Turnos
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
              {staff.length} colaboradores
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Supervisa los turnos activos, mesas asignadas a cada mesero, ventas del turno y administración de claves PIN.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>+ Agregar Mesero</span>
        </button>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
              En Turno Activo
            </span>
            <span className="text-xl font-bold font-display text-emerald-600">
              {onShiftCount}
            </span>
            <span className="text-[10px] text-emerald-700 block mt-0.5">
              Atendiendo mesas ahora
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Clock className="w-4.5 h-4.5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
              Total Equipo
            </span>
            <span className="text-xl font-bold font-display text-slate-900">
              {staff.length}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              Personal registrado
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
            <Users className="w-4.5 h-4.5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-amber-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-amber-800 block uppercase tracking-wider">
              Ventas Totales
            </span>
            <span className="text-xl font-bold font-display text-amber-600">
              {formatMoney(totalStaffSales, config.currencySymbol)}
            </span>
            <span className="text-[10px] text-amber-700 block mt-0.5">
              {totalStaffOrders} órdenes atendidas
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <DollarSign className="w-4.5 h-4.5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
              Propinas Estimadas
            </span>
            <span className="text-xl font-bold font-display text-slate-900">
              {formatMoney(Math.round(totalStaffSales * 0.1), config.currencySymbol)}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              10% sugerido promedio
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
            <ChefHat className="w-4.5 h-4.5" />
          </div>
        </div>
      </div>

      {/* Staff & Shifts Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {staff.map(member => {
          const isOnShift = member.active && member.shiftActive !== false;
          // Find tables assigned to this waiter
          const assignedTables = tables.filter(t => t.activeWaiter === member.name);

          return (
            <div
              key={member.id}
              className={`bg-white rounded-2xl border p-5 shadow-xs flex flex-col justify-between space-y-4 transition-all ${
                isOnShift ? 'border-emerald-300 ring-1 ring-emerald-200/60' : 'border-slate-200/80'
              }`}
            >
              <div className="space-y-3">
                {/* Header: Name, Role and Shift Toggle */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-bold text-sm shadow-xs font-display">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 leading-tight">
                        {member.name}
                      </h4>
                      <span className="text-xs font-medium text-slate-500">
                        {member.role}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      isOnShift
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isOnShift ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                    <span>{isOnShift ? 'En Turno' : 'Fuera de Turno'}</span>
                  </span>
                </div>

                {/* Shift Details and Assigned Tables */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>Teléfono:</span>
                    </span>
                    <span className="font-mono font-semibold text-slate-800">{member.phone || 'No registrado'}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                      <span>PIN de Acceso:</span>
                    </span>
                    <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-900">
                      {member.pin}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600 pt-1 border-t border-slate-200/60">
                    <span>Ventas Históricas:</span>
                    <strong className="text-slate-900 font-mono">
                      {formatMoney(member.totalSales, config.currencySymbol)} ({member.totalOrders} órdenes)
                    </strong>
                  </div>
                </div>

                {/* Assigned Tables Live Preview */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase mb-1">
                    Mesas Atendidas en Vivo ({assignedTables.length}):
                  </span>
                  {assignedTables.length === 0 ? (
                    <span className="text-[11px] text-slate-400 italic">
                      Sin mesas asignadas en este momento.
                    </span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {assignedTables.map(t => (
                        <span
                          key={t.id}
                          className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 font-semibold text-[10px] flex items-center gap-1"
                        >
                          <Store className="w-3 h-3 text-amber-600" />
                          <span>{t.name}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Actions: Toggle Shift, Edit & Test POS View */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1 text-xs">
                <button
                  onClick={() => toggleStaffShift(member.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                    isOnShift
                      ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {isOnShift ? (
                    <>
                      <Square className="w-3.5 h-3.5" />
                      <span>Cerrar Turno</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>Iniciar Turno</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleTestLoginAsWaiter(member)}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold flex items-center gap-1"
                    title="Probar comanda como este mesero"
                  >
                    <span>Ver POS</span>
                  </button>

                  <button
                    onClick={() => openEditModal(member)}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
                    title="Editar datos"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Crear / Editar Mesero */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 border border-slate-200 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                {editingStaffId ? 'Editar Colaborador' : '+ Nuevo Mesero / Colaborador'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
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
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Rol / Cargo:</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as StaffMember['role'])}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="Mesero">Mesero (Toma pedidos en mesas)</option>
                  <option value="Encargado de Barra">Encargado de Barra (Prepara bebidas)</option>
                  <option value="Cajero">Cajero (Cobra y emite tickets)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Teléfono Móvil:</label>
                <input
                  type="tel"
                  placeholder="ej. 3124567890"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">PIN de Acceso (4 dígitos):</label>
                <input
                  type="text"
                  maxLength={4}
                  required
                  placeholder="ej. 1234"
                  value={pin}
                  onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-center text-sm font-bold tracking-widest"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  El mesero usará este PIN para iniciar sesión rápidamente en el terminal o celular.
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Nuevo componente real conectado al backend */}
      <UserManagement roleToCreate="mesero" />
    </div>
  );
};
