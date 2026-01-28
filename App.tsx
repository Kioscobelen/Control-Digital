
import React, { useState } from 'react';
import { useAppData } from './hooks/useAppData';
import { User } from './types';
import LoginScreen from './screens/LoginScreen';
import Dashboard from './screens/Dashboard';

const App: React.FC = () => {
  const appData = useAppData();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  return (
    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 min-h-screen flex items-center justify-center p-4 font-sans antialiased">
      <div className="container mx-auto">
        {!currentUser ? (
          <LoginScreen users={appData.users} onLogin={handleLogin} />
        ) : (
          <Dashboard
            currentUser={currentUser}
            onLogout={handleLogout}
            appData={appData}
          />
        )}
      </div>
    </div>
  );
};

export default App;
