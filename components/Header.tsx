
import React from 'react';
import { User } from '../types';
import Clock from './Clock';

interface HeaderProps {
  currentUser: User;
  onLogout: () => void;
  pendingRequestsCount: number;
}

const Header: React.FC<HeaderProps> = ({ currentUser, onLogout, pendingRequestsCount }) => {
  return (
    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4 sm:p-6 flex flex-col md:flex-row justify-between items-center gap-4">
      <h2 className="text-xl sm:text-2xl font-bold">Sistema de Control Horario</h2>
      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5">
        <Clock />
        {currentUser.role === 'administrador' && pendingRequestsCount > 0 && (
          <span className="bg-yellow-400 text-gray-800 text-xs font-bold px-3 py-1 rounded-full">
            {pendingRequestsCount} pendientes
          </span>
        )}
        <span className="font-medium hidden sm:block">
          👤 {currentUser.name} ({currentUser.role})
        </span>
        <button
          onClick={onLogout}
          className="bg-white/20 hover:bg-white/30 text-white font-semibold py-2 px-4 border border-white/50 rounded-lg transition-colors"
        >
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
};

export default Header;
