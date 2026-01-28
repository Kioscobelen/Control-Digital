
export type Role = 'administrador' | 'empleado';
export type ContractType = 'semanal' | 'mensual';

export interface User {
  id: number;
  name: string;
  password: string; // Base64 encoded
  role: Role;
  contractHours?: number;
  contractType?: ContractType;
}

export interface Shift {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
}

export interface ShiftAssignment {
  id: number;
  date: string; // YYYY-MM-DD
  shiftId: number;
  userId: number;
}

export type FichajeType = 'entrada' | 'salida' | 'inicio_pausa' | 'fin_pausa';

export interface LocationData {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
}

export interface Fichaje {
  id: number;
  userId: number;
  userName: string;
  tipo: FichajeType;
  fecha: string; // DD/MM/YYYY
  hora: string; // HH:MM:SS
  timestamp: number;
  location?: LocationData;
}

export type RequestType = 'vacaciones' | 'permiso' | 'cambio_turno' | 'consulta' | 'comunicado' | 'olvido_fichaje';
export type RequestStatus = 'pendiente' | 'aprobado' | 'rechazado' | 'en_revision' | 'comunicado' | 'archivado';

export interface Conversation {
    id: number;
    userName: string;
    fromAdmin: boolean;
    message: string;
    date: string;
}

export interface Request {
  id: number;
  userId: number;
  userName: string;
  recipientId: number | null; // null for admin, 0 for broadcast, or userId
  recipientName: string;
  type: RequestType;
  startDate?: string;
  endDate?: string;
  message: string;
  status: RequestStatus;
  date: string;
  response: string | null;
  responseDate: string | null;
  conversations: Conversation[];
  fromAdmin: boolean;
}

export interface Payslip {
  id: number;
  userId: number;
  userName: string;
  month: string; // YYYY-MM
  fileName: string;
  fileData: string; // Base64
  uploadDate: string;
}

export interface AppData {
  users: User[];
  shifts: Shift[];
  shiftAssignments: ShiftAssignment[];
  fichajes: Fichaje[];
  requests: Request[];
  payslips: Payslip[];
}

export interface AppDataContextType extends AppData {
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (user: User) => void;
  deleteUser: (userId: number) => void;
  addShift: (shift: Omit<Shift, 'id'>) => void;
  updateShift: (shift: Shift) => void;
  deleteShift: (shiftId: number) => void;
  saveShiftAssignments: (date: string, shiftId: number, userIds: number[]) => void;
  removeShiftAssignments: (date: string, shiftId: number) => void;
  addFichaje: (fichaje: Omit<Fichaje, 'id'>) => void;
  addRequest: (request: Omit<Request, 'id'>) => void;
  updateRequest: (request: Request) => void;
  addPayslip: (payslip: Omit<Payslip, 'id'>) => void;
  deletePayslip: (payslipId: number) => void;
}
