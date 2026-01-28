
import React, { useState, useEffect, FormEvent } from 'react';
import { User, Role, ContractType } from '../../types';

interface EmployeeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (user: Omit<User, 'id'> & { id?: number }) => void;
    employeeToEdit: User | null;
}

const EmployeeModal: React.FC<EmployeeModalProps> = ({ isOpen, onClose, onSave, employeeToEdit }) => {
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<Role>('empleado');
    const [contractHours, setContractHours] = useState<string>('');
    const [contractType, setContractType] = useState<ContractType>('semanal');
    const [error, setError] = useState('');

    useEffect(() => {
        if (employeeToEdit) {
            setName(employeeToEdit.name);
            setPassword(''); 
            setRole(employeeToEdit.role);
            setContractHours(employeeToEdit.contractHours?.toString() || '');
            setContractType(employeeToEdit.contractType || 'semanal');
        } else {
            setName('');
            setPassword('');
            setRole('empleado');
            setContractHours('');
            setContractType('semanal');
        }
        setError('');
    }, [employeeToEdit, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!name || (!password && !employeeToEdit)) {
            setError('Nombre y contraseña son obligatorios.');
            return;
        }
        
        const userData: Omit<User, 'id'> & { id?: number } = {
            name,
            password: employeeToEdit && !password ? employeeToEdit.password : btoa(password),
            role,
            contractHours: contractHours ? parseFloat(contractHours) : undefined,
            contractType: contractHours ? contractType : undefined,
        };
        
        if (employeeToEdit) {
            userData.id = employeeToEdit.id;
        }
        
        onSave(userData);
    };

    const isEditMode = !!employeeToEdit;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-300 border border-gray-100">
                <div className="p-8 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-black text-gray-900">
                            {isEditMode ? 'Editar Perfil' : 'Nuevo Empleado'}
                        </h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Configuración del sistema</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-900 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                <form onSubmit={handleSubmit}>
                    <div className="p-8 space-y-6">
                        {/* Datos Básicos */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-900 uppercase tracking-widest mb-2 ml-1">Nombre Completo</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="w-full p-4 bg-gray-50 border-2 border-gray-200 text-gray-900 rounded-2xl focus:border-indigo-600 focus:bg-white outline-none transition-all font-bold"
                                    placeholder="Nombre y Apellidos"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-900 uppercase tracking-widest mb-2 ml-1">Contraseña de Fichaje</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full p-4 bg-gray-50 border-2 border-gray-200 text-gray-900 rounded-2xl focus:border-indigo-600 focus:bg-white outline-none transition-all font-bold"
                                    placeholder={isEditMode ? '••••' : 'Clave numérica'}
                                    required={!isEditMode}
                                />
                            </div>
                        </div>

                        {/* SECCIÓN CONTRATO - MÁXIMA VISIBILIDAD */}
                        <div className="bg-indigo-600 rounded-3xl p-6 shadow-xl shadow-indigo-100 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                                </svg>
                            </div>
                            <h4 className="text-white text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                                <span className="p-1 bg-white/20 rounded">📄</span> 
                                Horas de Contrato
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="block text-[9px] font-black text-indigo-100 uppercase tracking-tighter">Horas Totales</label>
                                    <input
                                        type="number"
                                        value={contractHours}
                                        onChange={e => setContractHours(e.target.value)}
                                        className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-lg font-black text-white outline-none focus:bg-white/20 transition-all placeholder:text-white/30"
                                        placeholder="0"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-[9px] font-black text-indigo-100 uppercase tracking-tighter">Tipo Periodo</label>
                                    <select
                                        value={contractType}
                                        onChange={e => setContractType(e.target.value as ContractType)}
                                        className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-sm font-black text-white outline-none focus:bg-white/20 transition-all cursor-pointer"
                                    >
                                        <option value="semanal" className="text-gray-900">Semanales</option>
                                        <option value="mensual" className="text-gray-900">Mensuales</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-gray-900 uppercase tracking-widest mb-2 ml-1">Nivel de Acceso</label>
                            <select
                                value={role}
                                onChange={e => setRole(e.target.value as Role)}
                                disabled={employeeToEdit?.id === 1}
                                className="w-full p-4 bg-gray-50 border-2 border-gray-200 text-gray-900 rounded-2xl focus:border-indigo-600 outline-none transition-all font-bold disabled:opacity-50"
                            >
                                <option value="empleado">Empleado (Solo fichaje y consultas)</option>
                                <option value="administrador">Administrador (Control total)</option>
                            </select>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-50 text-red-700 rounded-2xl text-xs font-black border border-red-100 text-center animate-shake">
                                {error}
                            </div>
                        )}
                    </div>
                    
                    <div className="p-8 bg-gray-50 flex gap-4">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="flex-1 py-4 text-gray-500 font-black text-sm uppercase tracking-widest hover:text-gray-900 transition-all"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit" 
                            className="flex-1 py-4 bg-gray-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:bg-black transition-all active:scale-95"
                        >
                            {isEditMode ? 'Actualizar' : 'Crear Perfil'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EmployeeModal;
