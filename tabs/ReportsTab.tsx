
import React, { useState, useMemo } from 'react';
import { AppDataContextType, Fichaje, User } from '../types';

interface ReportsTabProps {
  currentUser: User;
  appData: AppDataContextType;
}

interface ReportRow {
    userId: number;
    userName: string;
    date: string; // DD/MM/YYYY
    workedHours: string;
    workedMs: number;
    pauseHours: string;
    details: string;
    records: Fichaje[];
}

const formatMilliseconds = (ms: number): string => {
    if (ms < 0) ms = 0;
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
};

const calculateWorkedHoursForPeriod = (fichajes: Fichaje[], userId: number, startDate: Date, endDate: Date): number => {
    const userFichajes = fichajes.filter(f => {
        const [d, m, y] = f.fecha.split('/').map(Number);
        const fDate = new Date(y, m - 1, d);
        return f.userId === userId && fDate >= startDate && fDate <= endDate;
    }).sort((a, b) => a.timestamp - b.timestamp);

    const groupedByDate: Record<string, Fichaje[]> = {};
    userFichajes.forEach(f => {
        if (!groupedByDate[f.fecha]) groupedByDate[f.fecha] = [];
        groupedByDate[f.fecha].push(f);
    });

    let totalMs = 0;
    Object.values(groupedByDate).forEach(dayFichajes => {
        let dayWorkMs = 0;
        let dayPauseMs = 0;
        let lastIn: number | null = null;
        let lastPause: number | null = null;

        dayFichajes.forEach(f => {
            if (f.tipo === 'entrada') lastIn = f.timestamp;
            else if (f.tipo === 'salida' && lastIn) {
                dayWorkMs += f.timestamp - lastIn;
                lastIn = null;
            } else if (f.tipo === 'inicio_pausa') lastPause = f.timestamp;
            else if (f.tipo === 'fin_pausa' && lastPause) {
                dayPauseMs += f.timestamp - lastPause;
                lastPause = null;
            }
        });
        totalMs += (dayWorkMs - dayPauseMs);
    });

    return totalMs / (1000 * 60 * 60);
};

const calculateExpectedHours = (user: User, startDate: Date, endDate: Date): number => {
    if (!user.contractHours || !user.contractType) return 0;
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    if (user.contractType === 'semanal') {
        return (diffDays / 7) * user.contractHours;
    } else {
        return (diffDays / 30.4375) * user.contractHours;
    }
};

const ReportsTab: React.FC<ReportsTabProps> = ({ currentUser, appData }) => {
  const { users, fichajes } = appData;
  const today = new Date();
  const currentMonthValue = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

  const [selectedUserId, setSelectedUserId] = useState(currentUser.role === 'administrador' ? 'all' : String(currentUser.id));
  const [selectedMonth, setSelectedMonth] = useState(currentMonthValue);
  const [reportData, setReportData] = useState<ReportRow[] | null>(null);

  const handleGenerateReport = () => {
      const [year, month] = selectedMonth.split('-').map(Number);

      const filteredFichajes = fichajes.filter(f => {
          const [, fMonth, fYear] = f.fecha.split('/').map(Number);
          const userMatch = selectedUserId === 'all' || f.userId === parseInt(selectedUserId, 10);
          return fYear === year && fMonth === month && userMatch;
      });

      const groupedByUser: Record<number, Record<string, Fichaje[]>> = {};
      for (const fichaje of filteredFichajes) {
          if (!groupedByUser[fichaje.userId]) {
              groupedByUser[fichaje.userId] = {};
          }
          if (!groupedByUser[fichaje.userId][fichaje.fecha]) {
              groupedByUser[fichaje.userId][fichaje.fecha] = [];
          }
          groupedByUser[fichaje.userId][fichaje.fecha].push(fichaje);
      }

      const processedData: ReportRow[] = [];
      for (const userId in groupedByUser) {
          const userData = groupedByUser[userId];
          const user = users.find(u => u.id === parseInt(userId, 10));
          if (!user) continue;

          for (const date in userData) {
              const dayFichajes = userData[date].sort((a, b) => a.timestamp - b.timestamp);
              
              let totalWorkMs = 0;
              let totalPauseMs = 0;
              let lastEntradaTimestamp: number | null = null;
              let lastPausaTimestamp: number | null = null;
              
              for (const f of dayFichajes) {
                  if (f.tipo === 'entrada') {
                      lastEntradaTimestamp = f.timestamp;
                  } else if (f.tipo === 'salida' && lastEntradaTimestamp) {
                      totalWorkMs += f.timestamp - lastEntradaTimestamp;
                      lastEntradaTimestamp = null;
                  } else if (f.tipo === 'inicio_pausa') {
                      lastPausaTimestamp = f.timestamp;
                  } else if (f.tipo === 'fin_pausa' && lastPausaTimestamp) {
                      totalPauseMs += f.timestamp - lastPausaTimestamp;
                      lastPausaTimestamp = null;
                  }
              }
              
              const netWorkMs = totalWorkMs - totalPauseMs;

              processedData.push({
                  userId: user.id,
                  userName: user.name,
                  date,
                  workedHours: formatMilliseconds(netWorkMs),
                  workedMs: netWorkMs,
                  pauseHours: formatMilliseconds(totalPauseMs),
                  details: dayFichajes.map(f => `${f.tipo.replace('_', ' ')}: ${f.hora}`).join(' | '),
                  records: dayFichajes
              });
          }
      }
      
      processedData.sort((a, b) => {
          const dateA = a.date.split('/').reverse().join('-');
          const dateB = b.date.split('/').reverse().join('-');
          return dateB.localeCompare(dateA) || a.userName.localeCompare(b.userName);
      });

      setReportData(processedData);
  };

  const annualSummary = useMemo(() => {
    if (currentUser.role !== 'administrador') return null;
    
    const now = new Date();
    const startYear = new Date(now.getFullYear(), 0, 1);
    
    return users.filter(u => u.contractHours).map(user => {
        const workedYear = calculateWorkedHoursForPeriod(fichajes, user.id, startYear, now);
        const expectedYear = calculateExpectedHours(user, startYear, now);
        const balance = workedYear - expectedYear;
        return { name: user.name, workedYear, expectedYear, balance };
    }).sort((a,b) => b.balance - a.balance);
  }, [fichajes, users, currentUser.role]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* Resumen de Saldo Anual para Admin */}
      {currentUser.role === 'administrador' && annualSummary && annualSummary.length > 0 && (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Auditoría de Saldo Anual Plantilla</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {annualSummary.map(s => (
                    <div key={s.name} className="p-5 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col justify-between">
                        <div>
                            <p className="text-xs font-black text-gray-900 mb-1">{s.name}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase mb-3">Saldo Acumulado</p>
                        </div>
                        <div className="flex justify-between items-end">
                            <p className={`text-2xl font-black ${s.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {s.balance >= 0 ? '+' : ''}{s.balance.toFixed(1)}h
                            </p>
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded ${s.balance >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {s.balance >= 0 ? 'OK' : 'DEBE'}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
            <h3 className="text-2xl font-black text-gray-900 tracking-tight">Informes Mensuales</h3>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Validación de Jornada RD-LEY 8/2019</p>
            </div>
            <div className="flex gap-2">
            <button onClick={handleGenerateReport} className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all text-xs">Consultar Periodo</button>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-100 mb-8">
            {currentUser.role === 'administrador' && (
            <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">Empleado</label>
                <select className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-900" value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)}>
                    <option value="all">Todos</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
            </div>
            )}
            <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">Mes</label>
            <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-900"/>
            </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-100">
            {reportData && reportData.length > 0 ? (
            <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                <tr>
                    <th className="px-6 py-4">Personal</th>
                    <th className="px-6 py-4">Fecha</th>
                    <th className="px-6 py-4 text-center">Horas Netas</th>
                    <th className="px-6 py-4">Seguimiento GPS</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                {reportData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-indigo-50/10 transition-colors group">
                        <td className="px-6 py-4 font-black text-gray-900 text-sm">{row.userName}</td>
                        <td className="px-6 py-4 text-xs font-bold text-gray-500">{row.date}</td>
                        <td className="px-6 py-4 text-center">
                            <span className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-black text-indigo-600">{row.workedHours}</span>
                        </td>
                        <td className="px-6 py-4">
                            {row.records.some(r => r.location) ? (
                                <span className="flex items-center gap-1.5 text-green-600 font-black text-[10px] uppercase">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Localizado
                                </span>
                            ) : <span className="text-[10px] text-gray-300 italic uppercase">Inactivo</span>}
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
            ) : <div className="py-20 text-center text-gray-300 italic">No hay datos</div>}
        </div>
      </div>
    </div>
  );
};

export default ReportsTab;
