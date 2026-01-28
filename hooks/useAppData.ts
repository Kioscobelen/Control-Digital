
import { useState, useEffect, useCallback } from 'react';
import { AppData, User, Shift, Fichaje, Request, Payslip } from '../types';

const defaultData: AppData = {
    users: [
        { id: 1, name: 'Guti', password: btoa('0000'), role: 'administrador' },
        { id: 2, name: 'María', password: btoa('1234'), role: 'empleado' },
        { id: 3, name: 'Juan', password: btoa('1234'), role: 'empleado' }
    ],
    shifts: [
        { id: 1001, name: 'Mañana', startTime: '06:00', endTime: '14:00' },
        { id: 1002, name: 'Tarde', startTime: '14:00', endTime: '22:00' },
        { id: 1003, name: 'Noche', startTime: '22:00', endTime: '06:00' }
    ],
    shiftAssignments: [],
    fichajes: [],
    requests: [],
    payslips: []
};

export const useAppData = () => {
  const [data, setData] = useState<AppData>(defaultData);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    try {
      const savedData = localStorage.getItem('controlHorarioData_v2');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        // Migración básica si faltan campos
        setData({
            ...defaultData,
            ...parsed,
            payslips: parsed.payslips || []
        });
      } else {
        setData(defaultData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setData(defaultData);
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('controlHorarioData_v2', JSON.stringify(data));
    }
  }, [data, isInitialized]);

  const addUser = useCallback((user: Omit<User, 'id'>) => {
    setData(prev => ({ ...prev, users: [...prev.users, { ...user, id: Date.now() }] }));
  }, []);

  const updateUser = useCallback((updatedUser: User) => {
    setData(prev => ({ ...prev, users: prev.users.map(u => u.id === updatedUser.id ? updatedUser : u) }));
  }, []);

  const deleteUser = useCallback((userId: number) => {
    setData(prev => ({
      ...prev,
      users: prev.users.filter(u => u.id !== userId),
      shiftAssignments: prev.shiftAssignments.filter(sa => sa.userId !== userId),
    }));
  }, []);
  
  const addShift = useCallback((shift: Omit<Shift, 'id'>) => {
    setData(prev => ({ ...prev, shifts: [...prev.shifts, { ...shift, id: Date.now() }] }));
  }, []);

  const updateShift = useCallback((updatedShift: Shift) => {
    setData(prev => ({ ...prev, shifts: prev.shifts.map(s => s.id === updatedShift.id ? updatedShift : s) }));
  }, []);

  const deleteShift = useCallback((shiftId: number) => {
    setData(prev => ({
        ...prev,
        shifts: prev.shifts.filter(s => s.id !== shiftId),
        shiftAssignments: prev.shiftAssignments.filter(sa => sa.shiftId !== shiftId),
    }));
  }, []);
  
  const saveShiftAssignments = useCallback((date: string, shiftId: number, userIds: number[]) => {
    setData(prev => {
        const otherAssignments = prev.shiftAssignments.filter(a => !(a.date === date && a.shiftId === shiftId));
        const newAssignments = userIds.map(userId => ({ id: Date.now() + Math.random(), date, shiftId, userId }));
        return { ...prev, shiftAssignments: [...otherAssignments, ...newAssignments] };
    });
  }, []);

  const removeShiftAssignments = useCallback((date: string, shiftId: number) => {
    setData(prev => ({
      ...prev,
      shiftAssignments: prev.shiftAssignments.filter(a => !(a.date === date && a.shiftId === shiftId)),
    }));
  }, []);

  const addFichaje = useCallback((fichaje: Omit<Fichaje, 'id'>) => {
    setData(prev => ({ ...prev, fichajes: [...prev.fichajes, { ...fichaje, id: Date.now() }] }));
  }, []);

  const addRequest = useCallback((request: Omit<Request, 'id'>) => {
    setData(prev => {
        const maxId = prev.requests.reduce((max, r) => Math.max(r.id, max), 1000);
        return { ...prev, requests: [...prev.requests, { ...request, id: maxId + 1 }] };
    });
  }, []);

  const updateRequest = useCallback((updatedRequest: Request) => {
    setData(prev => ({ ...prev, requests: prev.requests.map(r => r.id === updatedRequest.id ? updatedRequest : r) }));
  }, []);

  const addPayslip = useCallback((payslip: Omit<Payslip, 'id'>) => {
    setData(prev => ({ ...prev, payslips: [...prev.payslips, { ...payslip, id: Date.now() }] }));
  }, []);

  const deletePayslip = useCallback((payslipId: number) => {
    setData(prev => ({ ...prev, payslips: prev.payslips.filter(p => p.id !== payslipId) }));
  }, []);

  return {
    ...data,
    addUser,
    updateUser,
    deleteUser,
    addShift,
    updateShift,
    deleteShift,
    saveShiftAssignments,
    removeShiftAssignments,
    addFichaje,
    addRequest,
    updateRequest,
    addPayslip,
    deletePayslip
  };
};
