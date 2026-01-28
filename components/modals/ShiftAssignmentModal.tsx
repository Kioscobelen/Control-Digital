
import React, { useState, useEffect, useMemo } from 'react';
import { AppDataContextType } from '../../types';

interface ShiftAssignmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    date: string | null;
    appData: AppDataContextType;
}

const ShiftAssignmentModal: React.FC<ShiftAssignmentModalProps> = ({ isOpen, onClose, date, appData }) => {
    const { shifts, users, shiftAssignments, saveShiftAssignments, removeShiftAssignments } = appData;
    const [selectedShiftId, setSelectedShiftId] = useState<string>('');
    const [checkedEmployees, setCheckedEmployees] = useState<Set<number>>(new Set());

    const formattedDate = useMemo(() => {
        if (!date) return '';
        const d = new Date(`${date}T12:00:00Z`);
        return d.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
    }, [date]);

    useEffect(() => {
        if (selectedShiftId && date) {
            const shiftIdNum = parseInt(selectedShiftId, 10);
            const assignedUsers = shiftAssignments
                .filter(a => a.date === date && a.shiftId === shiftIdNum)
                .map(a => a.userId);
            setCheckedEmployees(new Set(assignedUsers));
        } else {
            setCheckedEmployees(new Set());
        }
    }, [selectedShiftId, date, shiftAssignments]);

    if (!isOpen || !date) return null;

    const handleEmployeeCheck = (userId: number, isChecked: boolean) => {
        setCheckedEmployees(prev => {
            const newSet = new Set(prev);
            if (isChecked) {
                newSet.add(userId);
            } else {
                newSet.delete(userId);
            }
            return newSet;
        });
    };

    const handleSave = () => {
        if (!selectedShiftId) {
            alert('Por favor, seleccione un turno.');
            return;
        }
        saveShiftAssignments(date, parseInt(selectedShiftId, 10), Array.from(checkedEmployees));
        alert('Asignación guardada correctamente.');
        onClose();
    };

    const handleEdit = (shiftId: number) => {
        setSelectedShiftId(String(shiftId));
    };

    const handleDelete = (shiftId: number) => {
        if(window.confirm('¿Eliminar todas las asignaciones de este turno para este día?')){
            removeShiftAssignments(date, shiftId);
        }
    };
    
    const assignmentsForDay = shiftAssignments.filter(a => a.date === date)
        .reduce((acc, a) => {
            const shift = shifts.find(s => s.id === a.shiftId);
            const user = users.find(u => u.id === a.userId);
            if (shift && user) {
                if (!acc[shift.id]) {
                    acc[shift.id] = { shift, users: [] };
                }
                acc[shift.id].users.push(user);
            }
            return acc;
        }, {} as Record<number, {shift: any, users: any[]}>);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="p-4 border-b">
                    <h3 className="text-xl font-bold text-gray-800">Gestión de Turnos - <span className="text-indigo-600">{formattedDate}</span></h3>
                </div>
                <div className="p-6 overflow-y-auto space-y-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-700 mb-2">Asignar o Editar Turno</h4>
                        <div className="form-group mb-4">
                            <label className="block text-sm font-medium text-gray-600 mb-1">1. Seleccionar Turno:</label>
                            <select 
                                value={selectedShiftId}
                                onChange={e => setSelectedShiftId(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md"
                            >
                                <option value="">Seleccione un turno...</option>
                                {shifts.map(shift => (
                                    <option key={shift.id} value={shift.id}>{shift.name} ({shift.startTime} - {shift.endTime})</option>
                                ))}
                            </select>
                        </div>
                        {selectedShiftId && (
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-2">2. Asignar Empleados:</label>
                                <div className="max-h-48 overflow-y-auto space-y-2 p-3 bg-white border rounded-md">
                                    {users.map(user => (
                                        <label key={user.id} className="flex items-center p-2 rounded-md hover:bg-gray-100 cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={checkedEmployees.has(user.id)}
                                                onChange={e => handleEmployeeCheck(user.id, e.target.checked)}
                                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span className="ml-3 text-sm text-gray-700">{user.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div>
                        <h4 className="font-semibold text-gray-700 mb-3">Turnos ya asignados para este día:</h4>
                        <div className="space-y-3">
                            {Object.values(assignmentsForDay).length > 0 ? Object.values(assignmentsForDay).map(({shift, users}) => (
                                <div key={shift.id} className="p-3 bg-white border rounded-lg flex justify-between items-center">
                                    <div>
                                        <p className="font-bold text-indigo-700">{shift.name} <span className="font-normal text-gray-500 text-sm">({shift.startTime} - {shift.endTime})</span></p>
                                        <p className="text-xs text-gray-600 mt-1">
                                            👥 {users.map(u => u.name).join(', ')}
                                        </p>
                                    </div>
                                    <div className="flex space-x-2">
                                        <button onClick={() => handleEdit(shift.id)} className="px-3 py-1 bg-yellow-400 text-white rounded hover:bg-yellow-500 text-xs font-bold">Editar</button>
                                        <button onClick={() => handleDelete(shift.id)} className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs font-bold">Eliminar</button>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-gray-500 text-center text-sm py-4">No hay turnos asignados.</p>
                            )}
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-gray-50 border-t flex justify-end space-x-3">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold">Cerrar</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-semibold">💾 Guardar Asignación</button>
                </div>
            </div>
        </div>
    );
};

export default ShiftAssignmentModal;
