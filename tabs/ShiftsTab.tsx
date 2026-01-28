import React, { useState, FormEvent, ChangeEvent } from 'react';
import { AppDataContextType, Shift } from '../types';

interface ShiftsTabProps {
  appData: AppDataContextType;
}

const ShiftsTab: React.FC<ShiftsTabProps> = ({ appData }) => {
  const { shifts, addShift, updateShift, deleteShift } = appData;

  const initialFormState = { id: null as number | null, name: '', startTime: '', endTime: '' };
  const [shiftForm, setShiftForm] = useState(initialFormState);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setShiftForm(prev => ({ ...prev, [id]: value }));
  };
  
  const handleEditClick = (shift: Shift) => {
    setShiftForm(shift);
  };

  const resetForm = () => {
    setShiftForm(initialFormState);
  };
  
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!shiftForm.name || !shiftForm.startTime || !shiftForm.endTime) {
      alert('Todos los campos son obligatorios.');
      return;
    }
    
    if (shiftForm.id) {
      // Update existing shift
      updateShift({
        id: shiftForm.id,
        name: shiftForm.name,
        startTime: shiftForm.startTime,
        endTime: shiftForm.endTime,
      });
    } else {
      // Add new shift
      addShift({
        name: shiftForm.name,
        startTime: shiftForm.startTime,
        endTime: shiftForm.endTime,
      });
    }
    resetForm();
  };

  const handleDelete = (id: number, name: string) => {
    if (window.confirm(`¿Está seguro de eliminar el turno "${name}"? Se eliminarán todas sus asignaciones.`)) {
      deleteShift(id);
    }
  };
  
  const isEditing = shiftForm.id !== null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          {isEditing ? 'Editar Turno' : 'Crear Turno'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nombre del Turno</label>
            <input 
              type="text" 
              id="name" 
              placeholder="Ej: Mañana, Tarde" 
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={shiftForm.name}
              onChange={handleInputChange}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Horario</label>
            <div className="flex items-center gap-2 mt-1">
              <input 
                type="time" 
                id="startTime" 
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                value={shiftForm.startTime}
                onChange={handleInputChange}
                required
              />
              <span>a</span>
              <input 
                type="time" 
                id="endTime" 
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                value={shiftForm.endTime}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
          <div className="flex space-x-2">
            <button type="submit" className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-semibold">
              {isEditing ? 'Actualizar Turno' : 'Guardar Turno'}
            </button>
            {isEditing && (
              <button type="button" onClick={resetForm} className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold">
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Turnos Disponibles</h3>
        {shifts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {shifts.map(shift => (
              <div key={shift.id} className="p-4 bg-gray-50 rounded-lg border border-l-4 border-indigo-500">
                <h4 className="font-bold text-indigo-700">{shift.name}</h4>
                <p className="text-gray-600 font-mono">{shift.startTime} - {shift.endTime}</p>
                <div className="mt-3 flex space-x-2">
                  <button 
                    onClick={() => handleEditClick(shift)}
                    className="px-3 py-1 bg-yellow-400 text-white rounded-md hover:bg-yellow-500 text-xs font-semibold"
                  >
                    Editar
                  </button>
                  <button 
                    onClick={() => handleDelete(shift.id, shift.name)}
                    className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 text-xs font-semibold"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No hay turnos creados. Crea plantillas de turnos para poder asignarlos en el calendario.</p>
        )}
      </div>
    </div>
  );
};

export default ShiftsTab;