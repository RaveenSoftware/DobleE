import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../../services/api';
import { Shield, RefreshCw, Search, Clock, User, Package, ShoppingBag, LogIn, CreditCard, Trash2, Edit2, AlertCircle } from 'lucide-react';

interface AuditEntry {
  id: string;
  action: string;
  entity?: string;
  entityId?: string;
  userName?: string;
  userEmail?: string;
  details?: string;
  ip?: string;
  createdAt: string;
}

const ACTION_META: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  ORDER_CREATED:    { label: 'Pedido creado',       color: 'bg-emerald-100 text-emerald-700 border-emerald-200',  icon: ShoppingBag },
  ORDER_UPDATED:    { label: 'Pedido actualizado',   color: 'bg-blue-100 text-blue-700 border-blue-200',          icon: Edit2 },
  ORDER_DELETED:    { label: 'Pedido eliminado',     color: 'bg-rose-100 text-rose-700 border-rose-200',          icon: Trash2 },
  PRODUCT_CREATED:  { label: 'Producto creado',      color: 'bg-violet-100 text-violet-700 border-violet-200',    icon: Package },
  PRODUCT_UPDATED:  { label: 'Producto editado',     color: 'bg-violet-100 text-violet-700 border-violet-200',    icon: Package },
  PRODUCT_DELETED:  { label: 'Producto eliminado',   color: 'bg-rose-100 text-rose-700 border-rose-200',          icon: Trash2 },
  USER_LOGIN:       { label: 'Inicio de sesión',     color: 'bg-amber-100 text-amber-700 border-amber-200',       icon: LogIn },
  PAYMENT_RECEIVED: { label: 'Pago recibido',        color: 'bg-teal-100 text-teal-700 border-teal-200',          icon: CreditCard },
  EXPENSE_CREATED:  { label: 'Gasto registrado',     color: 'bg-orange-100 text-orange-700 border-orange-200',   icon: CreditCard },
  CASHSHIFT_OPENED: { label: 'Caja abierta',         color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CreditCard },
  CASHSHIFT_CLOSED: { label: 'Caja cerrada',         color: 'bg-slate-100 text-slate-700 border-slate-200',       icon: CreditCard },
};

function formatTime(dt: string) {
  const d = new Date(dt);
  return d.toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
}

function getActionMeta(action: string) {
  return ACTION_META[action] || { label: action.replace(/_/g, ' '), color: 'bg-slate-100 text-slate-600 border-slate-200', icon: AlertCircle };
}

export const AuditModule: React.FC = () => {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const data = await api.get(`/audit?page=${p}&limit=50`);
      setLogs(data.logs || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
      setPage(p);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLogs(1); }, [fetchLogs]);

  const filtered = search
    ? logs.filter(l =>
        l.action.toLowerCase().includes(search.toLowerCase()) ||
        l.userName?.toLowerCase().includes(search.toLowerCase()) ||
        l.entity?.toLowerCase().includes(search.toLowerCase()) ||
        l.userEmail?.toLowerCase().includes(search.toLowerCase())
      )
    : logs;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 font-display">Auditoría del Sistema</h2>
            <p className="text-xs text-slate-400">{total} eventos registrados</p>
          </div>
        </div>
        <button
          onClick={() => fetchLogs(1)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Actualizar
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por acción, usuario o módulo..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
        />
      </div>

      {/* Log list */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-400">Cargando auditoría...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Shield className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No hay eventos registrados aún</p>
            <p className="text-xs text-slate-300 mt-1">Las acciones aparecerán aquí automáticamente</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filtered.map(log => {
              const meta = getActionMeta(log.action);
              const Icon = meta.icon;
              let detailsObj: any = null;
              try { if (log.details) detailsObj = JSON.parse(log.details); } catch {}
              return (
                <div key={log.id} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50/70 transition-colors">
                  <div className={`mt-0.5 w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${meta.color}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.color}`}>
                        {meta.label}
                      </span>
                      {log.entity && (
                        <span className="text-[10px] text-slate-400 font-medium">{log.entity}</span>
                      )}
                    </div>
                    {detailsObj && (
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        {Object.entries(detailsObj).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {log.userName && (
                        <span className="flex items-center gap-1 text-[10px] text-slate-400">
                          <User className="w-3 h-3" /> {log.userName}
                        </span>
                      )}
                      {log.ip && (
                        <span className="text-[10px] text-slate-300 font-mono">{log.ip}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 shrink-0">
                    <Clock className="w-3 h-3" />
                    {formatTime(log.createdAt)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && !search && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => fetchLogs(page - 1)}
            disabled={page === 1}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
          >
            ← Anterior
          </button>
          <span className="text-xs text-slate-500">Página {page} de {pages}</span>
          <button
            onClick={() => fetchLogs(page + 1)}
            disabled={page === pages}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
};
