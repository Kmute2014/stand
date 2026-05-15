import React, { useEffect, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { Preloader } from './components/Preloader';
import { PageTransition } from './components/PageTransition';
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
import { Reports } from './pages/Reports';
import { ProjectsPage } from './pages/ProjectsPage';
import { SprintBoard } from './pages/SprintBoard';
import { JiraPage } from './pages/JiraPage';
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
  const { currentPage, currentUser } = useAppContext();
  const [user, setUser] = useState(auth.currentUser);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      // Add a small delay to show the preloader for a better experience
      setTimeout(() => setIsLoading(false), 1500);
    });
    return unsubscribe;
  }, []);

  // Show preloader during initial load, but show auth page if not authenticated
  if (isLoading) {
    return <Preloader />;
  }

  if (!user || !currentUser) {
    return <AuthPage />;
  }

  return (
    <div className="shell">
      <Sidebar />
      <div className="main">
        <Topbar />
        <div className="content">
          <PageTransition pageKey={currentPage}>
            {currentPage === 'dashboard' && <Dashboard />}
            {currentPage === 'projects' && <ProjectsPage />}
            {currentPage === 'sprintboard' && <SprintBoard />}
            {currentPage === 'jira' && <JiraPage />}
            {currentPage === 'responses' && <Responses />}
            {currentPage === 'mood' && <TeamMood />}
            {currentPage === 'users' && <UsersPage />}
            {currentPage === 'schedule' && <SchedulePage />}
            {currentPage === 'myhistory' && <MyHistory />}
            {currentPage === 'reports' && <Reports />}
            {currentPage === 'settings' && <Settings />}
          </PageTransition>
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
        <CreateUserStoryModal isOpen={false} onClose={() => { }} />
      </ErrorBoundary>
      <EditProgramModal />
      <EditProjectModal />
      <MissedStandupReminder />
      <Toast />
    </div>
  );
}
