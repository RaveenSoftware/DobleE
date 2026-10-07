import React, { useState, useEffect } from 'react';
import { apiGetUsers, apiCreateUser, apiDeleteUser, apiUpdateUser } from '../services/api';
import {
  Trash2, UserPlus, Edit2, X, Save, Users,
  ShieldCheck, ChefHat, Search, Eye, EyeOff,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface UserManagementProps {
  roleToCreate: 'admin' | 'mesero';
}

const ROLE_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  admin:   { label: 'Administrador', color: 'text-violet-700',  bg: 'bg-violet-50',  border: 'border-violet-200' },
  cajero:  { label: 'Cajero',         color: 'text-indigo-700',  bg: 'bg-indigo-50',  border: 'border-indigo-200' },
  mesero:  { label: 'Mesero',         color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200'  },
};

const getMeta = (r: string) =>
  ROLE_META[r] ?? { label: r, color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200' };

const Avatar: React.FC<{ name: string; role: string }> = ({ name, role }) => {
  const m = getMeta(role);
  return (
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm ${m.bg} ${m.color} border ${m.border}`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
};

export const UserManagement: React.FC<UserManagementProps> = ({ roleToCreate }) => {
  const { currentUser } = useApp();

  const [users, setUsers]       = useState<any[]>([]);
  const [search, setSearch]     = useState('');
  const [isOpen, setIsOpen]     = useState(false);
  const [showPwd, setShowPwd]   = useState(false);

  const [name,      setName]      = useState('');
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [role,      setRole]      = useState(roleToCreate === 'admin' ? 'admin' : 'mesero');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving,    setSaving]    = useState(false);
  const [feedback,  setFeedback]  = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  const load = async () => {
    try { setUsers(await apiGetUsers()); } catch {}
  };

  useEffect(() => { load(); }, []);

  const filtered = users.filter(u =>
    (roleToCreate === 'admin' ? u.role === 'admin' : ['mesero', 'cajero'].includes(u.role)) &&
    (u.name.toLowerCase().includes(search.toLowerCase()) ||
     u.email.toLowerCase().includes(search.toLowerCase()))
  );

  const openCreate = () => {
    setEditingId(null); setName(''); setEmail(''); setPassword('');
    setRole(roleToCreate === 'admin' ? 'admin' : 'mesero');
    setIsOpen(true); setFeedback(null);
  };

  const openEdit = (u: any) => {
    setEditingId(u.id); setName(u.name); setEmail(u.email);
    setRole(u.role); setPassword('');
    setIsOpen(true); setFeedback(null);
  };

  const closeModal = () => { setIsOpen(false); setEditingId(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setFeedback(null);
    try {
      if (editingId) {
        const data: any = { name, email, role };
        if (password) data.password = password;
        await apiUpdateUser(editingId, data);
      } else {
        await apiCreateUser({ name, email, password, role });
      }
      setFeedback({ type: 'ok', msg: editingId ? 'Perfil actualizado.' : 'Perfil creado exitosamente.' });
      await load();
      setTimeout(closeModal, 1200);
    } catch (err: any) {
      setFeedback({ type: 'err', msg: err.message || 'Error al guardar.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este perfil de acceso?')) return;
    try { await apiDeleteUser(id); load(); } catch { alert('Error al eliminar'); }
  };

  return (
    <div className="space-y-4">

      {/* ── Toolbar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 text-xs rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
          />
        </div>

        {/* Stats pills */}
        <div className="flex items-center gap-2 shrink-0">
          {['mesero', 'cajero'].map(r => {
            const count = users.filter(u => u.role === r).length;
            const m = getMeta(r);
            return (
              <span key={r} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-bold ${m.bg} ${m.color} ${m.border}`}>
                {r === 'cajero' ? <ShieldCheck className="w-3 h-3" /> : <ChefHat className="w-3 h-3" />}
                {count} {m.label}{count !== 1 ? 's' : ''}
              </span>
            );
          })}
        </div>

        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-xs shadow-sm shadow-amber-400/30 transition-all cursor-pointer shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          Nuevo Perfil
        </button>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-xs overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <div className="w-14 h-14 rounded-3xl bg-slate-100 flex items-center justify-center">
              <Users className="w-6 h-6 text-slate-400" />
            </div>
            <div>
              <p className="font-bold text-slate-700 text-sm">Sin perfiles</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {search ? 'No coincide ningún resultado.' : 'Crea el primer perfil de acceso.'}
              </p>
            </div>
            {!search && (
              <button onClick={openCreate} className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs cursor-pointer">
                + Nuevo Perfil
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70">
                {['Colaborador', 'Correo / Acceso', 'Rol', 'Acciones'].map(h => (
                  <th key={h} className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(u => {
                const m = getMeta(u.role);
                return (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition-colors group">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.name} role={u.role} />
                        <span className="text-sm font-semibold text-slate-900">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500 font-mono">{u.email}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[11px] font-bold ${m.bg} ${m.color} ${m.border}`}>
                        {u.role === 'cajero' ? <ShieldCheck className="w-3 h-3" /> : <ChefHat className="w-3 h-3" />}
                        {m.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(u)}
                          className="p-2 rounded-xl hover:bg-indigo-50 text-indigo-500 transition cursor-pointer"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(u.id)}
                          className="p-2 rounded-xl hover:bg-red-50 text-red-400 transition cursor-pointer"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Modal ── */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden">
            {/* Modal header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 font-display">
                {editingId ? 'Editar perfil de acceso' : 'Crear nuevo perfil'}
              </h3>
              <button onClick={closeModal} className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              {/* Feedback */}
              {feedback && (
                <div className={`px-4 py-2.5 rounded-xl font-semibold text-xs ${
                  feedback.type === 'ok'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {feedback.msg}
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1.5">Nombre Completo *</label>
                <input
                  type="text" required placeholder="ej. Mateo Restrepo"
                  value={name} onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1.5">Correo Electrónico *</label>
                <input
                  type="email" required placeholder="ej. mateo@doblee.com"
                  value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs font-mono"
                />
              </div>

              {roleToCreate !== 'admin' && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">Rol / Permiso *</label>
                  <select
                    value={role} onChange={e => setRole(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
                  >
                    <option value="mesero">Mesero — Toma pedidos en mesas</option>
                    <option value="cajero">Cajero — Caja POS y cobros</option>
                  </select>
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1.5">
                  {editingId ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña *'}
                </label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required={!editingId}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button" onClick={closeModal}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit" disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {saving ? (
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : editingId ? (
                    <><Save className="w-4 h-4" /> Guardar</>
                  ) : (
                    <><UserPlus className="w-4 h-4" /> Crear Perfil</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
