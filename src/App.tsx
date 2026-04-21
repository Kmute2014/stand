import React, { useEffect, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { useAppContext } from './store';
import { auth } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

// Importing Pages
import { Dashboard } from './pages/Dashboard';
import { Responses } from './pages/Responses';
import { TeamMood } from './pages/TeamMood';
import { UsersPage } from './pages/Users';
import { SchedulePage } from './pages/Schedule';
import { StandupForm } from './pages/StandupForm';
import { MyHistory } from './pages/MyHistory';
import { Settings } from './components/Settings';
import { AuthPage } from './pages/AuthPage';
import { AddUserModal } from './components/AddUserModal';
import { EditUserModal } from './components/EditUserModal';
import { EditResponseModal } from './components/EditResponseModal';
import { Toast } from './components/Toast';

export default function App() {
  const { currentPage } = useAppContext();
  const [user, setUser] = useState(auth.currentUser);

  useEffect(() => {
    return onAuthStateChanged(auth, setUser);
  }, []);

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="shell">
      <Sidebar />
      <div className="main">
        <Topbar />
        <div className="content">
          {currentPage === 'dashboard' && <Dashboard />}
          {currentPage === 'responses' && <Responses />}
          {currentPage === 'mood' && <TeamMood />}
          {currentPage === 'users' && <UsersPage />}
          {currentPage === 'schedule' && <SchedulePage />}
          {currentPage === 'standup' && <StandupForm />}
          {currentPage === 'myhistory' && <MyHistory />}
          {currentPage === 'settings' && <Settings />}
        </div>
      </div>
      <AddUserModal />
      <EditUserModal />
      <EditResponseModal />
      <Toast />
    </div>
  );
}
