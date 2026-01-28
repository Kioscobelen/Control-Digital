
import React, { useState, FormEvent } from 'react';
import { User } from '../types';

interface LoginScreenProps {
  users: User[];
  onLogin: (user: User) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ users, onLogin }) => {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      setError('Seleccione un usuario');
      return;
    }
    if (!password) {
      setError('Ingrese la contraseña');
      return;
    }

    const user = users.find(u => u.id === parseInt(selectedUserId, 10));
    if (user && user.password === btoa(password)) {
      setError('');
      onLogin(user);
    } else {
      setError('Credenciales incorrectas');
    }
  };

  return (
    <div className="bg-white p-8 sm:p-12 rounded-[2.5rem] shadow-2xl max-w-md w-full mx-auto border border-gray-100 transform transition-all overflow-hidden relative">
      {/* Decoración superior */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-600 to-purple-600"></div>
      
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-50 rounded-3xl mb-4 text-4xl shadow-inner">
          🕒
        </div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">
          Kiosco Belén
        </h1>
        <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-2">Control de Presencia</p>
      </div>
      
      <form onSubmit={handleLogin} className="space-y-6">
        <div>
          <label htmlFor="username" className="block mb-2 text-xs font-black text-gray-900 uppercase tracking-widest ml-1">
            Empleado / Usuario
          </label>
          <div className="relative">
            <select
              id="username"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full p-4 bg-gray-50 border-2 border-gray-300 text-gray-900 rounded-2xl focus:outline-none focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all appearance-none font-bold cursor-pointer"
              required
            >
              <option value="" className="text-gray-400">-- Selecciona tu nombre --</option>
              {users.map(user => (
                <option key={user.id} value={user.id} className="text-gray-900 font-bold">
                  {user.name} ({user.role === 'administrador' ? 'Gestión' : 'Empleado'})
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-900">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
        
        <div>
          <label htmlFor="password" className="block mb-2 text-xs font-black text-gray-900 uppercase tracking-widest ml-1">
            Contraseña de Acceso
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-4 bg-gray-50 border-2 border-gray-300 text-gray-900 rounded-2xl focus:outline-none focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold placeholder:text-gray-400"
            placeholder="Clave de 4 dígitos"
            required
          />
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-2xl text-xs font-black text-center border border-red-200 flex items-center justify-center gap-2 animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}
        
        <button
          type="submit"
          className="w-full p-5 bg-gray-900 text-white rounded-2xl font-black text-lg hover:bg-black shadow-2xl hover:shadow-indigo-500/20 transition-all transform active:scale-95 flex items-center justify-center gap-2"
        >
          <span>ENTRAR AL PANEL</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </form>
      
      <div className="mt-8 text-center">
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
          © 2024 Kiosco Belén · Gestión de Personal
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;
