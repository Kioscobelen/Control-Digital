
import React, { useState, FormEvent } from 'react';
import { User, AppDataContextType, RequestStatus, Request, RequestType } from '../types';
import RequestDetailsModal from '../components/modals/RequestDetailsModal';

interface CommunicationTabProps {
  currentUser: User;
  appData: AppDataContextType;
}

const employeeRequestTypes: { value: RequestType; label: string }[] = [
    { value: 'consulta', label: '🤔 Consulta' },
    { value: 'olvido_fichaje', label: '❓ Olvido de Fichaje' },
    { value: 'vacaciones', label: '🏖️ Vacaciones' },
    { value: 'permiso', label: '📋 Permiso' },
    { value: 'cambio_turno', label: '🔄️ Cambio de Turno' },
];

const parseDate = (dateStr: string | undefined): Date | null => {
    if (!dateStr) return null;
    if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
            const [day, month, year] = parts.map(Number);
            return new Date(year, month - 1, day);
        }
    }
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
};

const CommunicationTab: React.FC<CommunicationTabProps> = ({ currentUser, appData }) => {
  const { requests, users, addRequest, updateRequest } = appData;

  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'active' | 'archived'>('active');
  
  // Form state
  const [requestType, setRequestType] = useState<RequestType>(currentUser.role === 'administrador' ? 'comunicado' : 'consulta');
  const [recipientId, setRecipientId] = useState("0");
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [message, setMessage] = useState('');

  const userVisibleRequests = currentUser.role === 'administrador'
    ? requests
    : requests.filter(r =>
        r.userId === currentUser.id ||
        r.recipientId === currentUser.id ||
        (r.fromAdmin && r.recipientId === 0)
      );

  const filteredRequests = userVisibleRequests.filter(r => 
    viewMode === 'active' ? r.status !== 'archivado' : r.status === 'archivado'
  );

  const getStatusClass = (status: RequestStatus) => {
    switch (status) {
      case 'aprobado':
      case 'comunicado':
        return 'bg-green-100 text-green-800';
      case 'rechazado':
        return 'bg-red-100 text-red-800';
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'en_revision':
        return 'bg-blue-100 text-blue-800';
      case 'archivado':
        return 'bg-gray-100 text-gray-500';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleArchive = (e: React.MouseEvent, req: Request) => {
    e.stopPropagation();
    const newStatus: RequestStatus = req.status === 'archivado' ? 'pendiente' : 'archivado';
    updateRequest({ ...req, status: newStatus });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
        alert("El mensaje no puede estar vacío.");
        return;
    }

    const isAdmin = currentUser.role === 'administrador';
    const targetRecipientId = isAdmin ? parseInt(recipientId, 10) : null;
    let recipientName = 'Administración';
    if (isAdmin) {
        if (targetRecipientId === 0) {
            recipientName = 'Todos';
        } else {
            recipientName = users.find(u => u.id === targetRecipientId)?.name || 'Desconocido';
        }
    }

    const newRequest: Omit<Request, 'id'> = {
        userId: currentUser.id,
        userName: currentUser.name,
        fromAdmin: isAdmin,
        recipientId: targetRecipientId,
        recipientName,
        type: requestType,
        startDate: (requestType === 'vacaciones' || requestType === 'permiso') ? startDate : undefined,
        endDate: (requestType === 'vacaciones' || requestType === 'permiso') ? endDate : undefined,
        message: message,
        status: isAdmin ? 'comunicado' : 'pendiente',
        date: new Date().toISOString(),
        response: null,
        responseDate: null,
        conversations: [{
            id: Date.now(),
            userName: currentUser.name,
            fromAdmin: isAdmin,
            message: message,
            date: new Date().toISOString(),
        }]
    };

    addRequest(newRequest);

    setMessage('');
    setStartDate('');
    setEndDate('');
    setRequestType(isAdmin ? 'comunicado' : 'consulta');
    setRecipientId("0");

    alert('Mensaje enviado con éxito.');
  };
  
  const selectedRequest = selectedRequestId ? requests.find(r => r.id === selectedRequestId) : null;

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span className="p-2 bg-indigo-50 rounded-lg">✍️</span>
            {currentUser.role === 'administrador' ? 'Enviar Comunicado' : 'Nueva Solicitud'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            {currentUser.role === 'administrador' && (
              <div>
                <label htmlFor="recipient" className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 ml-1">Destinatario</label>
                <select 
                    id="recipient" 
                    className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl font-bold text-gray-900 focus:border-indigo-500 outline-none transition-all"
                    value={recipientId}
                    onChange={e => setRecipientId(e.target.value)}
                >
                  <option value="0">Todos los empleados</option>
                  {users.filter(u => u.id !== currentUser.id && u.role === 'empleado').map(user => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label htmlFor="requestType" className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 ml-1">Tipo de Mensaje</label>
              <select 
                id="requestType" 
                className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl font-bold text-gray-900 focus:border-indigo-500 outline-none transition-all"
                value={requestType}
                onChange={e => setRequestType(e.target.value as RequestType)}
              >
                {currentUser.role === 'administrador' ? 
                    <option value="comunicado">📢 Comunicado General</option> :
                    employeeRequestTypes.map(rt => <option key={rt.value} value={rt.value}>{rt.label}</option>)
                }
              </select>
            </div>
             {(requestType === 'vacaciones' || requestType === 'permiso') && (
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 ml-1">Periodo</label>
                    <div className="flex gap-2">
                      <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="flex-1 p-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm font-bold text-gray-900"/>
                      <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="flex-1 p-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm font-bold text-gray-900"/>
                    </div>
                </div>
            )}
            <div>
              <label htmlFor="message" className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 ml-1">Mensaje o Detalle</label>
              <textarea 
                id="message" 
                rows={4} 
                className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-xl font-bold text-gray-900 placeholder:text-gray-300 focus:border-indigo-500 outline-none transition-all" 
                placeholder={requestType === 'olvido_fichaje' ? "Ej: Se me olvidó fichar la entrada a las 09:00" : "Escriba los detalles aquí..."}
                value={message}
                onChange={e => setMessage(e.target.value)}
                required
              ></textarea>
            </div>
            <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all active:scale-95">
              Enviar Mensaje
            </button>
          </form>
        </div>

        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 flex gap-2">
            <button 
              onClick={() => setViewMode('active')}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${viewMode === 'active' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              📥 Entrada
            </button>
            <button 
              onClick={() => setViewMode('archived')}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${viewMode === 'archived' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              📁 Archivo
            </button>
          </div>

          <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2 scrollbar-hide">
            {filteredRequests.length > 0 ? (
              [...filteredRequests].sort((a,b) => (parseDate(b.date)?.getTime() || 0) - (parseDate(a.date)?.getTime() || 0)).map(req => {
                const reqDate = parseDate(req.date);
                const isOlvido = req.type === 'olvido_fichaje';
                return (
                <div 
                  key={req.id} 
                  className={`p-5 bg-white rounded-2xl border-2 transition-all hover:border-indigo-300 cursor-pointer relative group ${isOlvido ? 'border-amber-100' : 'border-gray-50 shadow-sm'}`} 
                  onClick={() => setSelectedRequestId(req.id)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${isOlvido ? 'bg-amber-100 text-amber-600' : 'bg-indigo-50 text-indigo-600'}`}>
                        {req.type === 'comunicado' ? '📢' : isOlvido ? '❓' : '📄'}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{req.fromAdmin ? `De: ${req.userName}` : `Solicitud: ${req.userName}`}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                          {reqDate ? reqDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '---'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 text-[9px] font-bold rounded-lg uppercase tracking-widest ${getStatusClass(req.status)}`}>
                        {req.status.replace('_', ' ')}
                      </span>
                      <button 
                        onClick={(e) => handleArchive(e, req)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-indigo-600 transition-all rounded-lg"
                        title={viewMode === 'active' ? "Archivar" : "Restaurar"}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-600 line-clamp-2 pl-12">{req.message}</p>
                </div>
              )})
            ) : (
              <div className="bg-white p-12 rounded-3xl border border-gray-100 text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-2xl mb-4">
                  {viewMode === 'active' ? '📬' : '📂'}
                </div>
                <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">
                  {viewMode === 'active' ? 'Bandeja de entrada vacía' : 'No hay mensajes archivados'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      {selectedRequest && (
        <RequestDetailsModal
            key={`${selectedRequest.id}-${selectedRequest.conversations.length}`}
            isOpen={!!selectedRequest}
            onClose={() => setSelectedRequestId(null)}
            request={selectedRequest}
            currentUser={currentUser}
            onUpdateRequest={updateRequest}
        />
      )}
    </>
  );
};

export default CommunicationTab;
