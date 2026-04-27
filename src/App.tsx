import React, { useEffect, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { useAppContext } from './store';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

// Importing Pages
import { Dashboard } from './pages/Dashboard';
import { Responses } from './pages/Responses';
import { TeamMood } from './pages/TeamMood';
import { UsersPage } from './pages/Users';
import { SchedulePage } from './pages/Schedule';
import { MyHistory } from './pages/MyHistory';
import { ProjectsPage } from './pages/ProjectsPage';
import { SprintBoard } from './pages/SprintBoard';
import { Settings } from './components/Settings';
import { AuthPage } from './pages/AuthPage';
import { AddUserModal } from './components/AddUserModal';
import { EditUserModal } from './components/EditUserModal';
import { EditResponseModal } from './components/EditResponseModal';
import { CreateProgramModal } from './components/CreateProgramModal';
import { CreateProjectModal } from './components/CreateProjectModal';
import { CreateUserStoryModal } from './components/CreateUserStoryModal';
import { EditProgramModal } from './components/EditProgramModal';
import { EditProjectModal } from './components/EditProjectModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { MissedStandupReminder } from './components/MissedStandupReminder';
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
          {currentPage === 'projects' && <ProjectsPage />}
          {currentPage === 'sprintboard' && <SprintBoard />}
          {currentPage === 'responses' && <Responses />}
          {currentPage === 'mood' && <TeamMood />}
          {currentPage === 'users' && <UsersPage />}
          {currentPage === 'schedule' && <SchedulePage />}
          {currentPage === 'myhistory' && <MyHistory />}
          {currentPage === 'settings' && <Settings />}
        </div>
      </div>
      <AddUserModal />
      <EditUserModal />
      <EditResponseModal />
      <CreateProgramModal />
      <ErrorBoundary>
        <CreateProjectModal />
      </ErrorBoundary>
      <ErrorBoundary>
        <CreateUserStoryModal />
      </ErrorBoundary>
      <EditProgramModal />
      <EditProjectModal />
      <MissedStandupReminder />
      <Toast />
    </div>
  );
}
