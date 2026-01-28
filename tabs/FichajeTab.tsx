
import React, { useMemo, useState } from 'react';
import { User, AppDataContextType, FichajeType, LocationData, Fichaje } from '../types';

interface FichajeTabProps {
  currentUser: User;
  appData: AppDataContextType;
}

const toYYYYMMDD = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const getFichajeDetails = (tipo: FichajeType) => {
    switch (tipo) {
        case 'entrada': return { label: '🟢 Entrada', color: 'text-green-600', icon: '⏰' };
        case 'salida': return { label: '🔴 Salida', color: 'text-red-600', icon: '🚪' };
        case 'inicio_pausa': return { label: '⏸️ Pausa', color: 'text-yellow-600', icon: '☕' };
        case 'fin_pausa': return { label: '▶️ Volver', color: 'text-blue-600', icon: '💼' };
        default: return { label: 'Desconocido', color: 'text-gray-600', icon: '❓' };
    }
}

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
        return (diffDays / 30.4375) * user.contractHours; // Media de días en un mes
    }
};

const FichajeTab: React.FC<FichajeTabProps> = ({ currentUser, appData }) => {
  const { fichajes, addFichaje, shifts, shiftAssignments } = appData;
  const [loading, setLoading] = useState(false);

  const todayStr = new Date().toLocaleDateString('es-ES');
  const todayDateStr = toYYYYMMDD(new Date());

  const todayFichajes = useMemo(() =>
    fichajes.filter(f => f.userId === currentUser.id && f.fecha === todayStr)
    .sort((a, b) => a.timestamp - b.timestamp),
    [fichajes, currentUser.id, todayStr]
  );
  
  const lastFichaje = todayFichajes.length > 0 ? todayFichajes[todayFichajes.length - 1] : null;

  const canFicharEntrada = !lastFichaje || lastFichaje.tipo === 'salida';
  const canFicharSalida = lastFichaje && (lastFichaje.tipo === 'entrada' || lastFichaje.tipo === 'fin_pausa');
  const canIniciarPausa = lastFichaje && (lastFichaje.tipo === 'entrada' || lastFichaje.tipo === 'fin_pausa');
  const canFinalizarPausa = lastFichaje && lastFichaje.tipo === 'inicio_pausa';

  const handleFichaje = (tipo: FichajeType) => {
    setLoading(true);

    const performAdd = (loc: LocationData | null = null) => {
        const now = new Date();
        addFichaje({
            userId: currentUser.id,
            userName: currentUser.name,
            tipo: tipo,
            fecha: now.toLocaleDateString('es-ES'),
            hora: now.toLocaleTimeString('es-ES'),
            timestamp: now.getTime(),
            location: loc || undefined
        });
        setLoading(false);
    };

    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            (pos) => performAdd({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy }),
            () => performAdd(),
            { enableHighAccuracy: true, timeout: 5000 }
        );
    } else {
        performAdd();
    }
  };

  const balanceData = useMemo(() => {
    if (!currentUser.contractHours || !currentUser.contractType) return null;
    
    const now = new Date();
    // Saldo Período Actual
    let startPeriod = new Date();
    if (currentUser.contractType === 'semanal') {
        const day = now.getDay() || 7;
        startPeriod.setDate(now.getDate() - day + 1);
    } else {
        startPeriod = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    startPeriod.setHours(0,0,0,0);
    const workedPeriod = calculateWorkedHoursForPeriod(fichajes, currentUser.id, startPeriod, now);
    const progress = Math.min(100, (workedPeriod / currentUser.contractHours) * 100);

    // Saldo Anual Acumulado
    const startYear = new Date(now.getFullYear(), 0, 1);
    const workedYear = calculateWorkedHoursForPeriod(fichajes, currentUser.id, startYear, now);
    const expectedYear = calculateExpectedHours(currentUser, startYear, now);
    const annualBalance = workedYear - expectedYear;
    
    return { 
        workedPeriod, 
        totalPeriod: currentUser.contractHours, 
        type: currentUser.contractType, 
        progress,
        annualBalance
    };
  }, [fichajes, currentUser]);

  const todayAssignment = useMemo(() =>
    shiftAssignments.find(a => a.date === todayDateStr && a.userId === currentUser.id),
    [shiftAssignments, todayDateStr, currentUser.id]
  );

  const todayShift = useMemo(() =>
    todayAssignment ? shifts.find(s => s.id === todayAssignment.shiftId) : null,
    [todayAssignment, shifts]
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-8">
          {/* Panel de Fichaje */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-gray-900">Panel de Fichaje</h3>
              <span className="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-black rounded-full border border-green-100 uppercase tracking-widest">GPS Activo</span>
            </div>
            
            {todayShift && (
              <div className="mb-8 p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Turno de Hoy</p>
                  <p className="text-xl font-black text-indigo-900">{todayShift.name}</p>
                </div>
                <p className="text-2xl font-black text-indigo-600">{todayShift.startTime} - {todayShift.endTime}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => handleFichaje('entrada')} disabled={!canFicharEntrada || loading} className="p-6 bg-green-600 text-white rounded-2xl shadow-lg hover:bg-green-700 disabled:opacity-20 transition-all transform active:scale-95 font-black text-lg">ENTRADA</button>
              <button onClick={() => handleFichaje('salida')} disabled={!canFicharSalida || loading} className="p-6 bg-red-600 text-white rounded-2xl shadow-lg hover:bg-red-700 disabled:opacity-20 transition-all transform active:scale-95 font-black text-lg">SALIDA</button>
              <button onClick={() => handleFichaje('inicio_pausa')} disabled={!canIniciarPausa || loading} className="p-4 bg-white border-2 border-yellow-400 text-yellow-600 rounded-2xl font-black hover:bg-yellow-50 disabled:opacity-30 transition-all">PAUSA</button>
              <button onClick={() => handleFichaje('fin_pausa')} disabled={!canFinalizarPausa || loading} className="p-4 bg-white border-2 border-blue-400 text-blue-600 rounded-2xl font-black hover:bg-blue-50 disabled:opacity-30 transition-all">VOLVER</button>
            </div>
          </div>

          {/* Saldo de Horas */}
          {balanceData && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Período Actual */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-end mb-4">
                        <div>
                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Este {balanceData.type === 'semanal' ? 'Semana' : 'Mes'}</h4>
                            <p className="text-2xl font-black text-gray-900">{balanceData.workedPeriod.toFixed(1)} <span className="text-sm text-gray-400">/ {balanceData.totalPeriod}h</span></p>
                        </div>
                    </div>
                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                            className={`h-full transition-all duration-1000 ${balanceData.progress >= 100 ? 'bg-green-500' : 'bg-indigo-600'}`}
                            style={{ width: `${balanceData.progress}%` }}
                        ></div>
                    </div>
                </div>

                {/* Saldo Anual */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Saldo Anual Acumulado</h4>
                    <div className="flex items-center justify-between">
                        <p className={`text-3xl font-black ${balanceData.annualBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {balanceData.annualBalance >= 0 ? '+' : ''}{balanceData.annualBalance.toFixed(1)}h
                        </p>
                        <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${balanceData.annualBalance >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {balanceData.annualBalance >= 0 ? 'A FAVOR' : 'EN CONTRA'}
                        </div>
                    </div>
                    <p className="text-[10px] text-gray-400 font-bold mt-2 uppercase">Desde 1 de Enero</p>
                </div>
            </div>
          )}
        </div>

        {/* Historial rápido lateral */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col h-fit">
          <h4 className="font-black text-gray-900 text-sm mb-6 flex items-center justify-between uppercase tracking-tighter">
            <span>Hoy</span>
            <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-1 rounded">Registros</span>
          </h4>
          <div className="space-y-3">
            {todayFichajes.length > 0 ? (
              todayFichajes.map(f => {
                const { label, color, icon } = getFichajeDetails(f.tipo);
                return (
                  <div key={f.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{icon}</span>
                      <p className={`text-[11px] font-black ${color} uppercase`}>{label}</p>
                    </div>
                    <span className="text-sm font-black text-gray-900">{f.hora}</span>
                  </div>
                );
              })
            ) : (
              <div className="py-10 text-center text-gray-300 font-bold text-xs italic">Sin registros hoy</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FichajeTab;
