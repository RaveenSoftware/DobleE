import React, { useState, useEffect } from 'react';
import { apiGetUsers, apiCreateUser, apiDeleteUser, apiUpdateUser } from '../services/api';
import { Trash2, UserPlus, Edit2, X, Save } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface UserManagementProps {
  roleToCreate: 'admin' | 'mesero';
}

export const UserManagement: React.FC<UserManagementProps> = ({ roleToCreate }) => {
  const { currentUser } = useApp();
  const [users, setUsers] = useState<any[]>([]);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadUsers = async () => {
    try {
      const data = await apiGetUsers();
      setUsers(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        // En modo edición, la contraseña es opcional
        const data: any = { name, email, role: roleToCreate };
        if (password) data.password = password;
        
        await apiUpdateUser(editingId, data);
        alert(`Usuario ${roleToCreate} actualizado exitosamente.`);
      } else {
        await apiCreateUser({ name, email, password, role: roleToCreate });
        alert(`Usuario ${roleToCreate} creado exitosamente.`);
      }
      resetForm();
      loadUsers();
    } catch (error: any) {
      alert(error.message || 'Error al guardar usuario');
    }
  };

  const handleEdit = (user: any) => {
    setEditingId(user.id);
    setName(user.name);
    setEmail(user.email);
    setPassword(''); // No mostramos la contraseña actual por seguridad
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este usuario?')) {
      try {
        await apiDeleteUser(id);
        loadUsers();
      } catch (error) {
        alert('Error al eliminar');
      }
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setEmail('');
    setPassword('');
  };

  const filteredUsers = users.filter((u) => u.role === roleToCreate);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mt-6 font-sans">
      <h2 className="text-xl font-black font-display mb-4">
        Gestión de {roleToCreate === 'admin' ? 'Dueños de Sucursal (Admins)' : 'Meseros'}
      </h2>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
        <input
          type="text"
          placeholder="Nombre Completo"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 text-sm"
          required
        />
        <input
          type="email"
          placeholder="Correo Electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 text-sm"
          required
        />
        <input
          type="password"
          placeholder={editingId ? 'Nueva contraseña (opcional)' : 'Contraseña'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 text-sm"
          required={!editingId}
        />
        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 bg-indigo-600 text-white font-bold rounded-xl py-2 px-4 hover:bg-indigo-700 transition flex items-center justify-center gap-2 text-sm"
          >
            {editingId ? <Save className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            {editingId ? 'Guardar' : 'Crear'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="bg-slate-200 text-slate-700 font-bold rounded-xl py-2 px-3 hover:bg-slate-300 transition flex items-center justify-center"
              title="Cancelar edición"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 text-sm text-slate-500 uppercase tracking-wider">
              <th className="pb-3 font-semibold">Nombre</th>
              <th className="pb-3 font-semibold">Correo / Acceso</th>
              <th className="pb-3 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => (
              <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50 text-sm transition-colors group">
                <td className="py-3 font-medium text-slate-900">{u.name}</td>
                <td className="py-3 text-slate-500">{u.email}</td>
                <td className="py-3 text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(u)}
                      className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(u.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={3} className="py-8 text-center text-slate-400 text-sm">
                  No hay perfiles registrados. ¡Crea el primero arriba!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
