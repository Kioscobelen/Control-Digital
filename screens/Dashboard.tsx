
import React, { useState, useMemo } from 'react';
import { User, Role, AppDataContextType } from '../types';
import Header from '../components/Header';
import NavTabs from '../components/NavTabs';
import FichajeTab from '../tabs/FichajeTab';
import CalendarTab from '../tabs/CalendarTab';
import EmployeesTab from '../tabs/EmployeesTab';
import ShiftsTab from '../tabs/ShiftsTab';
import CommunicationTab from '../tabs/CommunicationTab';
import ReportsTab from '../tabs/ReportsTab';
import PayslipsTab from '../tabs/PayslipsTab';

interface DashboardProps {
  currentUser: User;
  onLogout: () => void;
  appData: AppDataContextType;
}

type TabId = 'fichaje' | 'calendario' | 'empleados' | 'turnos' | 'comunicacion' | 'informes' | 'nominas';

const TABS: { [key in Role]: { id: TabId; label: string }[] } = {
  administrador: [
    { id: 'fichaje', label: '⏰ Fichaje' },
    { id: 'calendario', label: '📅 Calendario' },
    { id: 'empleados', label: '👥 Empleados' },
    { id: 'turnos', label: '🔄 Turnos' },
    { id: 'nominas', label: '📄 Nóminas' },
    { id: 'comunicacion', label: '💬 Comunicación' },
    { id: 'informes', label: '📊 Informes' },
  ],
  empleado: [
    { id: 'fichaje', label: '⏰ Fichaje' },
    { id: 'calendario', label: '📅 Calendario' },
    { id: 'nominas', label: '📄 Nóminas' },
    { id: 'comunicacion', label: '💬 Comunicación' },
    { id: 'informes', label: '📊 Informes' },
  ],
};

const Dashboard: React.FC<DashboardProps> = ({ currentUser, onLogout, appData }) => {
  const userTabs = TABS[currentUser.role];
  const [activeTab, setActiveTab] = useState<TabId>(userTabs[0].id);

  const pendingRequestsCount = useMemo(() => {
    if (currentUser.role === 'administrador') {
      return appData.requests.filter(r => r.status === 'pendiente' && !r.fromAdmin).length;
    }
    return 0;
  }, [appData.requests, currentUser.role]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'fichaje':
        return <FichajeTab currentUser={currentUser} appData={appData} />;
      case 'calendario':
        return <CalendarTab currentUser={currentUser} appData={appData} />;
      case 'empleados':
        return currentUser.role === 'administrador' ? <EmployeesTab appData={appData} /> : null;
      case 'turnos':
        return currentUser.role === 'administrador' ? <ShiftsTab appData={appData} /> : null;
      case 'nominas':
        return <PayslipsTab currentUser={currentUser} appData={appData} />;
      case 'comunicacion':
        return <CommunicationTab currentUser={currentUser} appData={appData} />;
      case 'informes':
        return <ReportsTab currentUser={currentUser} appData={appData} />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden w-full max-w-7xl mx-auto">
      <Header
        currentUser={currentUser}
        onLogout={onLogout}
        pendingRequestsCount={pendingRequestsCount}
      />
      <NavTabs
        tabs={userTabs}
        activeTab={activeTab}
        setActiveTab={(tabId) => setActiveTab(tabId as TabId)}
      />
      <div className="tab-content p-4 sm:p-8 min-h-[60vh] bg-gray-50">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default Dashboard;
