
import React, { useState } from 'react';
import { AppDataContextType, User } from '../types';
import EmployeeModal from '../components/modals/EmployeeModal';

interface EmployeesTabProps {
  appData: AppDataContextType;
}

const EmployeesTab: React.FC<EmployeesTabProps> = ({ appData }) => {
  const { users, addUser, updateUser, deleteUser } = appData;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState<User | null>(null);

  const handleOpenAddModal = () => {
    setEmployeeToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: User) => {
    setEmployeeToEdit(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEmployeeToEdit(null);
  };

  const handleSaveEmployee = (userData: Omit<User, 'id'> & { id?: number }) => {
    // CORRECCIÓN: Ahora pasamos el objeto completo userData que incluye contractHours y contractType
    if (userData.id) {
      updateUser(userData as User);
    } else {
      addUser(userData as Omit<User, 'id'>);
    }
    handleCloseModal();
  };

  const handleDelete = (id: number, name: string) => {
    if (id === 1) {
      alert('No se puede eliminar el administrador principal.');
      return;
    }
    if (window.confirm(`¿Está seguro de eliminar a ${name}?`)) {
      deleteUser(id);
    }
  };

  return (
    <>
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <div>
            <h3 className="text-2xl font-black text-gray-900">Gestión de Plantilla</h3>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Configuración de perfiles y contratos</p>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
          >
            <span className="text-xl">+</span>
            <span>Añadir Empleado</span>
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <th className="px-6 py-4">Empleado</th>
                <th className="px-6 py-4">Contrato</th>
                <th className="px-6 py-4">Rol</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                        <span className="text-sm font-black text-gray-900">{user.name}</span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase">ID: #{user.id}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {user.contractHours ? (
                        <div className="inline-flex flex-col">
                            <span className="text-xs font-black text-indigo-600">{user.contractHours}h / {user.contractType}</span>
                        </div>
                    ) : (
                        <span className="text-[10px] font-bold text-gray-300 italic">Sin contrato definido</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${user.role === 'administrador' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                        {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleOpenEditModal(user)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                        title="Editar"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(user.id, user.name)}
                        disabled={user.id === 1}
                        className="p-2 text-gray-300 hover:text-red-500 rounded-xl transition-all disabled:opacity-30"
                        title="Eliminar"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <EmployeeModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveEmployee}
        employeeToEdit={employeeToEdit}
      />
    </>
  );
};

export default EmployeesTab;
