import React from 'react';
import { UserManagement } from '../UserManagement';

export const StaffManager: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black font-display text-slate-900 tracking-tight">
          Gestión de Personal
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Administra las credenciales de acceso de tus meseros y cajeros.
        </p>
      </div>
      <UserManagement roleToCreate="mesero" />
    </div>
  );
};
