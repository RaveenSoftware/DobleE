import React, { useState, useEffect } from 'react';
import { formatMoney } from '../../utils/format';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck,
  Building2,
  Users,
  DollarSign,
  Layers,
  CheckCircle,
  ExternalLink,
  TrendingUp,
  LogOut,
  UserPlus,
  Trash2,
  Edit2,
  X,
  Save,
  Plus,
} from 'lucide-react';
import {
  apiGetBranches,
  apiCreateBranch,
  apiUpdateBranch,
  apiDeleteBranch,
} from '../../services/api';

interface Branch {
  id: string;
  name: string;
  city: string;
  ownerName: string;
  ownerEmail: string;
  phone?: string;
  plan: string;
  status: string;
  monthlySales: number;
  ordersMonth: number;
  activeWaiters: number;
}

const emptyBranch = {
  name: '',
  city: '',
  ownerName: '',
  ownerEmail: '',
  phone: '',
  plan: 'Pro Negocio',
};

export const SuperAdminView: React.FC = () => {
  const { config, logout, currentUser } = useApp();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [form, setForm] = useState(emptyBranch);
  const [saving, setSaving] = useState(false);

  const loadBranches = async () => {
    try {
      setLoading(true);
      const data = await apiGetBranches();
      setBranches(data);
    } catch (error) {
      console.error('Error al cargar sucursales:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
  }, []);

  const openCreate = () => {
    setEditingBranch(null);
    setForm(emptyBranch);
    setShowModal(true);
  };

  const openEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setForm({
      name: branch.name,
      city: branch.city,
      ownerName: branch.ownerName,
      ownerEmail: branch.ownerEmail,
      phone: branch.phone || '',
      plan: branch.plan,
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingBranch) {
        await apiUpdateBranch(editingBranch.id, form);
      } else {
        await apiCreateBranch(form);
      }
      setShowModal(false);
      loadBranches();
    } catch (err: any) {
      alert(err.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta sucursal? Esta acción no se puede deshacer.')) return;
    try {
      await apiDeleteBranch(id);
      loadBranches();
    } catch {
      alert('Error al eliminar sucursal');
    }
  };

  const totalRevenue = branches.reduce((s, b) => s + b.monthlySales, 0);
  const totalOrders = branches.reduce((s, b) => s + b.ordersMonth, 0);
  const totalWaiters = branches.reduce((s, b) => s + b.activeWaiters, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 font-sans">

      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              Plataforma SaaS · Super Administrador
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight">
            Control Global — Hola, {currentUser?.name ?? 'Admin'} 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Crea y gestiona las sucursales del sistema. Cada dueño de sucursal tendrá su propio acceso para gestionar su negocio.
          </p>
        </div>
        <div className="flex items-center gap-3 relative z-10">
          <button
            onClick={logout}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-bold transition-all flex items-center gap-2 border border-white/20"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Sucursales', value: `${branches.length}`, icon: Building2, color: 'indigo', sub: 'registradas en la plataforma' },
          { label: 'Facturación (mes)', value: formatMoney(totalRevenue, config.currencySymbol), icon: DollarSign, color: 'emerald', sub: 'consolidado red' },
          { label: 'Comandas (mes)', value: String(totalOrders), icon: Layers, color: 'amber', sub: 'pedidos en red' },
          { label: 'Meseros activos', value: String(totalWaiters), icon: Users, color: 'sky', sub: 'personal operativo' },
        ].map(({ label, value, icon: Icon, color, sub }) => (
          <div key={label} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-bold uppercase tracking-wider text-[10px]">{label}</span>
              <div className={`w-8 h-8 rounded-xl bg-${color}-50 text-${color}-600 flex items-center justify-center`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className={`text-2xl font-black font-display text-${color}-600`}>{value}</div>
            <span className="text-[11px] text-slate-400 block">{sub}</span>
          </div>
        ))}
      </div>

      {/* Branches Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-black font-display text-slate-900">Sucursales del Sistema</h2>
            <p className="text-xs text-slate-500 mt-0.5">Gestiona los negocios y sus dueños desde aquí</p>
          </div>
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Nueva Sucursal
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">Cargando sucursales…</div>
        ) : branches.length === 0 ? (
          <div className="py-16 text-center">
            <Building2 className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 font-semibold text-sm">Aún no hay sucursales registradas.</p>
            <p className="text-slate-400 text-xs mt-1">Haz clic en "Nueva Sucursal" para agregar la primera.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-50/80 text-xs text-slate-500 uppercase tracking-wider">
                  <th className="p-4 font-semibold">Negocio / Ciudad</th>
                  <th className="p-4 font-semibold">Dueño / Contacto</th>
                  <th className="p-4 font-semibold">Plan</th>
                  <th className="p-4 font-semibold text-right">Rendimiento</th>
                  <th className="p-4 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {branches.map((branch) => (
                  <tr key={branch.id} className="hover:bg-indigo-50/30 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-50 text-indigo-600 flex items-center justify-center font-black text-sm border border-indigo-100">
                          {branch.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900">{branch.name}</div>
                          <div className="text-xs text-slate-400">{branch.city}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm font-semibold text-slate-700">{branch.ownerName}</div>
                      <div className="text-xs text-slate-400">{branch.ownerEmail}</div>
                      {branch.phone && <div className="text-xs text-slate-400">{branch.phone}</div>}
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {branch.plan}
                      </span>
                      <div className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                        <CheckCircle className="w-3 h-3" /> {branch.status}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="text-sm font-bold text-emerald-600">
                        {formatMoney(branch.monthlySales, config.currencySymbol)}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 flex items-center justify-end gap-1">
                        <TrendingUp className="w-3 h-3 text-emerald-400" />
                        {branch.ordersMonth} cmd / {branch.activeWaiters} msr
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(branch)}
                          className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(branch.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Gestión de Admins (Dueños) ─── */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
        <h2 className="text-lg font-black font-display mb-1">Gestión de Accesos — Dueños de Sucursal</h2>
        <p className="text-xs text-slate-500 mb-5">Crea las credenciales de acceso para que cada dueño ingrese al sistema con su panel de administración.</p>
        <AdminUsersTable branches={branches} />
      </div>

      {/* Modal Create / Edit Branch */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black font-display">
                {editingBranch ? 'Editar Sucursal' : 'Nueva Sucursal'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-xl">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-3">
              {[
                { label: 'Nombre del negocio', key: 'name', placeholder: 'Ej: Granizados DobleE Centro' },
                { label: 'Ciudad', key: 'city', placeholder: 'Ej: Medellín' },
                { label: 'Nombre del dueño', key: 'ownerName', placeholder: 'Ej: Carlos Pérez' },
                { label: 'Correo del dueño', key: 'ownerEmail', placeholder: 'Ej: carlos@negocio.com', type: 'email' },
                { label: 'Teléfono (opcional)', key: 'phone', placeholder: 'Ej: 3001234567' },
              ].map(({ label, key, placeholder, type }) => (
                <div key={key}>
                  <label className="text-xs font-bold text-slate-600 block mb-1">{label}</label>
                  <input
                    type={type || 'text'}
                    placeholder={placeholder}
                    value={(form as any)[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 text-sm transition-colors"
                    required={key !== 'phone'}
                  />
                </div>
              ))}
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Plan</label>
                <select
                  value={form.plan}
                  onChange={(e) => setForm({ ...form, plan: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 text-sm"
                >
                  <option>Básico</option>
                  <option>Pro Negocio</option>
                  <option>Enterprise</option>
                </select>
              </div>
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Guardando…' : editingBranch ? 'Guardar cambios' : 'Crear sucursal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Sub-component: Admin Users table ──────────────────────────────────────

import { apiGetUsers, apiCreateUser, apiDeleteUser, apiUpdateUser } from '../../services/api';

const AdminUsersTable: React.FC<{ branches: Branch[] }> = ({ branches }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [branchId, setBranchId] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = async () => {
    try { setUsers(await apiGetUsers()); } catch {}
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchId) {
      alert('Por favor, selecciona una sucursal.');
      return;
    }
    try {
      if (editingId) {
        const data: any = { name, email, role: 'admin', branchId };
        if (password) data.password = password;
        await apiUpdateUser(editingId, data);
      } else {
        await apiCreateUser({ name, email, password, role: 'admin', branchId });
      }
      setEditingId(null); setName(''); setEmail(''); setPassword(''); setBranchId('');
      load();
    } catch (err: any) { alert(err.message || 'Error'); }
  };

  const handleEdit = (u: any) => {
    setEditingId(u.id); setName(u.name); setEmail(u.email); setPassword(''); setBranchId(u.branchId || '');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este usuario?')) return;
    try { await apiDeleteUser(id); load(); } catch { alert('Error al eliminar'); }
  };

  const admins = users.filter(u => u.role === 'admin');

  return (
    <div>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-5">
        <input type="text" placeholder="Nombre" value={name} onChange={e => setName(e.target.value)} required
          className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500" />
        <input type="email" placeholder="Correo" value={email} onChange={e => setEmail(e.target.value)} required
          className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500" />
        <input type="password" placeholder={editingId ? 'Nueva contraseña (opcional)' : 'Contraseña'} value={password}
          onChange={e => setPassword(e.target.value)} required={!editingId}
          className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500" />
        <select value={branchId} onChange={e => setBranchId(e.target.value)} required
          className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500"
        >
          <option value="" disabled>Seleccionar Sucursal</option>
          {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <div className="flex gap-2">
          <button type="submit"
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl py-2.5 px-4 text-sm transition flex items-center justify-center gap-2">
            {editingId ? <Save className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            {editingId ? 'Guardar' : 'Crear'}
          </button>
          {editingId && (
            <button type="button" onClick={() => { setEditingId(null); setName(''); setEmail(''); setPassword(''); setBranchId(''); }}
              className="bg-slate-100 hover:bg-slate-200 rounded-xl px-3 transition">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-slate-100 text-xs text-slate-400 uppercase tracking-wider">
            <th className="pb-2 font-semibold">Nombre / Sucursal</th>
            <th className="pb-2 font-semibold">Correo</th>
            <th className="pb-2 font-semibold text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {admins.map(u => {
            const userBranch = branches.find(b => b.id === u.branchId);
            return (
              <tr key={u.id} className="border-b border-slate-50 group hover:bg-slate-50 transition-colors">
                <td className="py-3 text-sm font-semibold text-slate-800">
                  {u.name}
                  {userBranch && <span className="ml-2 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-bold">{userBranch.name}</span>}
                </td>
                <td className="py-3 text-sm text-slate-500">{u.email}</td>
                <td className="py-3 text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(u)} className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(u.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
          {admins.length === 0 && (
            <tr><td colSpan={3} className="py-8 text-center text-slate-400 text-sm">
              No hay dueños de sucursal registrados aún.
            </td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
