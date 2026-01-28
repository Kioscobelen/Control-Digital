
import React, { useState, ChangeEvent } from 'react';
import { User, AppDataContextType, Payslip } from '../types';

interface PayslipsTabProps {
  currentUser: User;
  appData: AppDataContextType;
}

const PayslipsTab: React.FC<PayslipsTabProps> = ({ currentUser, appData }) => {
  const { users, payslips, addPayslip, deletePayslip } = appData;
  const isAdmin = currentUser.role === 'administrador';

  // State for upload form
  const [selectedUserId, setSelectedUserId] = useState('');
  const [month, setMonth] = useState('');
  const [fileData, setFileData] = useState<{name: string, data: string, size: number} | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tamaño (máximo 1MB para no saturar localStorage)
      if (file.size > 1024 * 1024) {
        alert('El archivo es demasiado grande. Máximo 1MB para almacenamiento local.');
        e.target.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setFileData({
          name: file.name,
          data: event.target?.result as string,
          size: file.size
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !month || !fileData) {
      alert('Por favor, rellene todos los campos y seleccione un archivo.');
      return;
    }

    setIsUploading(true);
    const targetUser = users.find(u => u.id === parseInt(selectedUserId));

    // Simulamos un delay para feedback visual
    setTimeout(() => {
        addPayslip({
            userId: parseInt(selectedUserId),
            userName: targetUser?.name || 'Usuario',
            month,
            fileName: fileData.name,
            fileData: fileData.data,
            uploadDate: new Date().toLocaleDateString('es-ES')
        });
        setIsUploading(false);
        setFileData(null);
        setMonth('');
        setSelectedUserId('');
        // Limpiar el input de tipo file manualmente si fuera necesario
        alert('Nómina subida y asignada correctamente.');
    }, 600);
  };

  const downloadFile = (payslip: Payslip) => {
    try {
      const link = document.createElement('a');
      link.href = payslip.fileData;
      link.download = payslip.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('Error al descargar el archivo. Puede que sea demasiado grande para la memoria del navegador.');
    }
  };

  // SEGURIDAD: Filtrado estricto. El empleado solo ve lo suyo.
  const filteredPayslips = isAdmin 
    ? payslips 
    : payslips.filter(p => p.userId === currentUser.id);

  // Ordenar por ID descendente (más recientes primero)
  const sortedPayslips = [...filteredPayslips].sort((a, b) => b.id - a.id);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {isAdmin && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800">Cargar Nómina</h3>
          </div>
          
          <form onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Empleado</label>
              <select 
                className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-indigo-500 outline-none transition-all"
                value={selectedUserId}
                onChange={e => setSelectedUserId(e.target.value)}
                required
              >
                <option value="">-- Seleccionar --</option>
                {users.filter(u => u.role === 'empleado').map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Mes de Devengo</label>
              <input 
                type="month" 
                className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-indigo-500 outline-none transition-all"
                value={month}
                onChange={e => setMonth(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Documento (PDF/JPG)</label>
              <input 
                type="file" 
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                onChange={handleFileChange}
                accept=".pdf,image/*"
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={isUploading}
              className="bg-indigo-600 text-white p-3.5 rounded-xl font-bold hover:bg-indigo-700 disabled:bg-gray-300 transition-all shadow-lg shadow-indigo-100 active:scale-95"
            >
              {isUploading ? 'Procesando...' : 'Asignar Nómina'}
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
          <h3 className="text-lg font-bold text-gray-800">
            {isAdmin ? 'Gestión de Documentos' : 'Mis Nóminas Disponibles'}
          </h3>
          <span className="text-xs font-medium text-gray-400 bg-white px-3 py-1 rounded-full border border-gray-100">
            {sortedPayslips.length} archivos encontrados
          </span>
        </div>
        
        {sortedPayslips.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white text-gray-400 text-[10px] uppercase tracking-wider border-b border-gray-50">
                  {isAdmin && <th className="px-6 py-4 font-bold">Empleado</th>}
                  <th className="px-6 py-4 font-bold">Periodo</th>
                  <th className="px-6 py-4 font-bold">Nombre de Archivo</th>
                  <th className="px-6 py-4 font-bold">Fecha Registro</th>
                  <th className="px-6 py-4 font-bold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sortedPayslips.map(p => {
                    const [year, monthNum] = p.month.split('-');
                    const dateObj = new Date(parseInt(year), parseInt(monthNum) - 1);
                    const monthLabel = dateObj.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
                    
                    return (
                        <tr key={p.id} className="hover:bg-indigo-50/30 transition-colors group">
                            {isAdmin && (
                              <td className="px-6 py-4">
                                <span className="text-sm font-semibold text-gray-700">{p.userName}</span>
                              </td>
                            )}
                            <td className="px-6 py-4">
                              <span className="text-sm text-gray-600 capitalize">{monthLabel}</span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <span className="text-xs p-1 bg-red-50 text-red-500 rounded font-bold uppercase">pdf</span>
                                <span className="text-xs text-gray-500 truncate max-w-[120px]">{p.fileName}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-xs text-gray-400">{p.uploadDate}</td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-2">
                                  <button 
                                      onClick={() => downloadFile(p)}
                                      className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all text-xs font-bold"
                                  >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                      </svg>
                                      Descargar
                                  </button>
                                  {isAdmin && (
                                      <button 
                                          onClick={() => {
                                              if(window.confirm('¿Desea eliminar este registro permanentemente?')) deletePayslip(p.id);
                                          }}
                                          className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                                          title="Eliminar"
                                      >
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                          </svg>
                                      </button>
                                  )}
                                </div>
                            </td>
                        </tr>
                    );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-gray-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="font-medium">No hay documentos registrados para este periodo.</p>
          </div>
        )}
      </div>

      <div className="bg-indigo-50 p-5 rounded-2xl flex gap-4 items-start border border-indigo-100">
        <div className="text-indigo-500 mt-0.5">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-indigo-900">Privacidad y Seguridad</h4>
          <p className="text-xs text-indigo-700 leading-relaxed">
            Las nóminas son documentos confidenciales. Este sistema utiliza filtrado por identificador de usuario para asegurar que cada empleado solo acceda a sus propios documentos. Los administradores tienen visibilidad global para fines de gestión.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PayslipsTab;
