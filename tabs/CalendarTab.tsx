import React, { useState, useMemo } from 'react';
import { User, AppDataContextType } from '../types';
import ShiftAssignmentModal from '../components/modals/ShiftAssignmentModal';

interface CalendarTabProps {
  currentUser: User;
  appData: AppDataContextType;
}

// Helper function to reliably format a Date object to a 'YYYY-MM-DD' string in local time.
const toYYYYMMDD = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const CalendarTab: React.FC<CalendarTabProps> = ({ currentUser, appData }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const handleDayClick = (dateStr: string) => {
    if (currentUser.role !== 'administrador') return;
    setSelectedDate(dateStr);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDate(null);
  };

  const changeMonth = (direction: number) => {
    if (direction === 0) {
      setCurrentMonth(new Date());
    } else {
      setCurrentMonth(prev => {
        const newDate = new Date(prev);
        newDate.setMonth(newDate.getMonth() + direction);
        return newDate;
      });
    }
  };

  const calendarGrid = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7; // 0=Monday, 6=Sunday

    const grid = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      grid.push({ key: `empty-${i}`, type: 'empty' });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      grid.push({ key: `day-${day}`, type: 'day', day });
    }
    return grid;
  }, [currentMonth]);

  const todayStr = toYYYYMMDD(new Date());

  return (
    <>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h3 className="text-2xl font-bold text-gray-800 capitalize">
            {currentMonth.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
          </h3>
          <div className="flex space-x-2">
            <button onClick={() => changeMonth(-1)} className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition-colors">← Anterior</button>
            <button onClick={() => changeMonth(0)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors">Hoy</button>
            <button onClick={() => changeMonth(1)} className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition-colors">Siguiente →</button>
          </div>
        </div>
        
        {currentUser.role === 'administrador' && (
          <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-lg text-sm">
            💡 <strong>Modo Administrador:</strong> Haz clic en cualquier día para asignar turnos.
          </div>
        )}

        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
            <div key={day} className="text-center font-semibold text-gray-600 p-2 text-xs sm:text-base">{day}</div>
          ))}
          {calendarGrid.map(cell => {
            if (cell.type === 'empty') return <div key={cell.key} className="bg-gray-50 rounded-lg"></div>;
            
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), cell.day);
            const dateStr = toYYYYMMDD(date);
            const isToday = dateStr === todayStr;
            
            const dayAssignments = appData.shiftAssignments.filter(a => a.date === dateStr);
            const myAssignment = dayAssignments.find(a => a.userId === currentUser.id);
            const myShift = myAssignment ? appData.shifts.find(s => s.id === myAssignment.shiftId) : null;
            
            const shiftGroups = currentUser.role === 'administrador' ? dayAssignments.reduce((acc, a) => {
              const user = appData.users.find(u => u.id === a.userId);
              if(user) {
                  (acc[a.shiftId] = acc[a.shiftId] || []).push(user.name);
              }
              return acc;
            }, {} as Record<number, string[]>) : {};

            return (
              <div
                key={cell.key}
                className={`border rounded-lg p-2 min-h-[100px] sm:min-h-[120px] flex flex-col relative transition-all duration-200
                  ${isToday ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white'}
                  ${currentUser.role === 'administrador' ? 'cursor-pointer hover:bg-gray-100 hover:shadow-md' : ''}
                `}
                onClick={() => handleDayClick(dateStr)}
              >
                <span className={`font-bold ${isToday ? 'text-indigo-600' : 'text-gray-700'}`}>{cell.day}</span>
                <div className="text-xs mt-1 space-y-1 overflow-y-auto flex-grow">
                  {currentUser.role === 'administrador' ? (
                    Object.entries(shiftGroups).map(([shiftId, names]) => {
                      const shift = appData.shifts.find(s => s.id === Number(shiftId));
                      return shift ? (
                        <div key={shiftId} className="bg-gray-200 p-1 rounded">
                          <p className="font-bold text-gray-800 truncate text-[10px]">{shift.name}</p>
                          <p className="text-gray-600 truncate text-[9px]">{names.join(', ')}</p>
                        </div>
                      ) : null;
                    })
                  ) : myShift ? (
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-2 rounded-md shadow">
                      <p className="font-bold text-[11px]">{myShift.name}</p>
                      <p className='text-[10px]'>{myShift.startTime} - {myShift.endTime}</p>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {isModalOpen && (
        <ShiftAssignmentModal
          isOpen={isModalOpen}
          onClose={closeModal}
          date={selectedDate}
          appData={appData}
        />
      )}
    </>
  );
};

export default CalendarTab;