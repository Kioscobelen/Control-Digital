
import React, { useState, useEffect, useRef, FormEvent } from 'react';
import { User, Request, RequestStatus, Conversation } from '../../types';

interface RequestDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    request: Request;
    currentUser: User;
    onUpdateRequest: (request: Request) => void;
}

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

const RequestDetailsModal: React.FC<RequestDetailsModalProps> = ({ isOpen, onClose, request, currentUser, onUpdateRequest }) => {
    const [newMessage, setNewMessage] = useState('');
    const conversationEndRef = useRef<null | HTMLDivElement>(null);

    const isAdmin = currentUser.role === 'administrador';

    useEffect(() => {
        conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [request.conversations]);
    
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
           if (event.key === 'Escape') {
              onClose();
           }
        };
        window.addEventListener('keydown', handleEsc);
        return () => {
           window.removeEventListener('keydown', handleEsc);
        };
    }, [onClose]);

    if (!isOpen) return null;

    const handleReply = (e: FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const conversationEntry: Conversation = {
            id: Date.now(),
            userName: currentUser.name,
            fromAdmin: isAdmin,
            message: newMessage,
            date: new Date().toISOString(),
        };

        const newStatus = isAdmin && request.status === 'pendiente' ? 'en_revision' : request.status;

        const updatedRequest: Request = {
            ...request,
            conversations: [...(request.conversations || []), conversationEntry],
            status: newStatus,
        };

        onUpdateRequest(updatedRequest);
        setNewMessage('');
    };
    
    const handleStatusChange = (newStatus: RequestStatus) => {
        const updatedRequest: Request = { ...request, status: newStatus };
        onUpdateRequest(updatedRequest);
    };

    const toggleArchive = () => {
        const newStatus: RequestStatus = request.status === 'archivado' ? 'pendiente' : 'archivado';
        onUpdateRequest({ ...request, status: newStatus });
        onClose();
    };
    
    const reqDate = parseDate(request.date);
    const startDate = parseDate(request.startDate);
    const endDate = parseDate(request.endDate);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-100 animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
                <div className="p-8 border-b border-gray-100 bg-gray-50/50 flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                             <span className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-[9px] font-bold uppercase tracking-widest">
                                {request.type.replace('_', ' ')}
                             </span>
                             <span className={`px-3 py-1 text-[9px] font-bold rounded-lg uppercase tracking-widest border ${
                                request.status === 'aprobado' ? 'bg-green-50 text-green-700 border-green-100' :
                                request.status === 'rechazado' ? 'bg-red-50 text-red-700 border-red-100' :
                                'bg-white text-gray-500 border-gray-200'
                             }`}>
                                {request.status.replace('_', ' ')}
                             </span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">De: {request.userName}</h3>
                        <p className="text-xs font-medium text-gray-400 mt-1">
                            {reqDate ? reqDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : '---'}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={toggleArchive}
                            className="p-3 bg-gray-100 hover:bg-indigo-100 text-gray-500 hover:text-indigo-600 rounded-xl transition-all"
                            title={request.status === 'archivado' ? "Mover a Bandeja de Entrada" : "Archivar Conversación"}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                            </svg>
                        </button>
                        <button onClick={onClose} className="p-3 text-gray-400 hover:text-gray-900 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
                
                <div className="flex-grow overflow-y-auto p-8 space-y-6 bg-white scrollbar-hide">
                    {(startDate || endDate) && (
                        <div className="bg-indigo-50 p-4 rounded-2xl flex items-center justify-between border border-indigo-100 mb-4">
                            <span className="text-[10px] font-bold text-indigo-400 uppercase">Periodo Solicitado</span>
                            <span className="text-sm font-bold text-indigo-700">{startDate?.toLocaleDateString('es-ES')} - {endDate?.toLocaleDateString('es-ES')}</span>
                        </div>
                    )}

                    {request.conversations?.map((conv) => {
                         const convDate = parseDate(conv.date);
                         const isCurrentUser = conv.userName === currentUser.name;
                         return (
                            <div key={conv.id} className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                                <div className={`p-4 rounded-2xl max-w-sm font-medium shadow-sm ${isCurrentUser ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'}`}>
                                    <p className="text-sm leading-relaxed">{conv.message}</p>
                                </div>
                                <span className="text-[10px] font-bold text-gray-400 mt-2 px-1 uppercase tracking-tighter">
                                    {conv.userName} • {convDate?.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                         )
                    })}
                     <div ref={conversationEndRef} />
                </div>
                
                <div className="p-8 border-t border-gray-100 bg-gray-50/30">
                    {request.status !== 'aprobado' && request.status !== 'rechazado' && request.status !== 'archivado' ? (
                        <form onSubmit={handleReply} className="flex gap-4">
                            <textarea 
                                value={newMessage}
                                onChange={e => setNewMessage(e.target.value)}
                                rows={1}
                                className="flex-grow p-4 bg-white border-2 border-gray-200 rounded-2xl font-bold text-gray-900 focus:border-indigo-500 outline-none transition-all resize-none shadow-inner"
                                placeholder="Escribe tu respuesta aquí..."
                            />
                            <button type="submit" className="px-8 bg-indigo-600 text-white rounded-2xl font-bold uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all active:scale-95">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            </button>
                        </form>
                    ) : (
                        <p className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] py-2">
                           {request.status === 'archivado' ? 'Conversación Archivada' : 'Esta solicitud está cerrada'}
                        </p>
                    )}
                    
                    {isAdmin && request.type !== 'comunicado' && request.status !== 'archivado' && (
                        <div className="mt-6 flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-200 shadow-sm">
                            <label className="text-xs font-bold text-gray-900 uppercase tracking-widest">Cambiar Estado:</label>
                            <div className="flex gap-2">
                                <button onClick={() => handleStatusChange('aprobado')} className="px-4 py-2 bg-green-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-green-600 transition-all">Aprobar</button>
                                <button onClick={() => handleStatusChange('rechazado')} className="px-4 py-2 bg-red-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-600 transition-all">Rechazar</button>
                                <button onClick={() => handleStatusChange('pendiente')} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-gray-300 transition-all">Pendiente</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RequestDetailsModal;
