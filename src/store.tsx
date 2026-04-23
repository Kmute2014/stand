import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, StandupResponse, Schedule, NotificationLog, CompanySettings } from './types';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

interface AppState {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  currentUser: User | null;
  users: User[];
  responses: StandupResponse[];
  schedule: Schedule;
  companySettings: CompanySettings;
  notifications: NotificationLog[];
  showToast: (msg: string, type?: 'green' | 'red' | 'amber' | 'blue') => void;
  toastConfig: { msg: string; type: string; visible: boolean } | null;
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  submitStandup: (response: Omit<StandupResponse, 'id' | 'time'>) => void;
  updateResponse: (id: string, updates: Partial<StandupResponse>) => void;
  updateSchedule: (schedule: Schedule) => void;
  updateCompanySettings: (settings: CompanySettings) => void;
  deleteResponse: (id: string) => void;
  sendReminders: (userIds?: string[]) => void;
  editingUser: User | null;
  setEditingUser: (user: User | null) => void;
  editingResponse: StandupResponse | null;
  setEditingResponse: (response: StandupResponse | null) => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [users, setUsers] = useState<User[]>([]);
  const [responses, setResponses] = useState<StandupResponse[]>([]);
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [schedule, setSchedule] = useState<Schedule>({
    activeDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    time: '08:30',
    timezone: 'Africa/Accra (GMT+0)',
    autoEnabled: true,
  });
  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    name: 'Datrix Tech Solutions',
    logo: null,
  });

  const [toastConfig, setToastConfig] = useState<{ msg: string; type: string; visible: boolean } | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingResponse, setEditingResponse] = useState<StandupResponse | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // 1. Real-time Listeners (Responses & Users)
  useEffect(() => {
    if (!currentUser) return;
    let unsubResponses: (() => void) | undefined;
    let unsubUsers: (() => void) | undefined;

    const setupListeners = async () => {
      const { collection, onSnapshot, orderBy, query } = await import('firebase/firestore');

      unsubResponses = onSnapshot(query(collection(db, 'responses'), orderBy('createdAt', 'desc')), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StandupResponse));
        setResponses(data);
      });

      unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        setUsers(data);
      });
    };

    setupListeners();
    return () => { unsubResponses?.(); unsubUsers?.(); };
  }, [currentUser?.id]);

  // 2. Fetch Global Settings (Schedule & Company) on Load
  useEffect(() => {
    if (!currentUser) return;
    const fetchSettings = async () => {
      const { doc, getDoc } = await import('firebase/firestore');

      const scheduleSnap = await getDoc(doc(db, 'settings', 'schedule'));
      if (scheduleSnap.exists()) setSchedule(scheduleSnap.data() as Schedule);

      const companySnap = await getDoc(doc(db, 'settings', 'company'));
      if (companySnap.exists()) setCompanySettings(companySnap.data() as CompanySettings);
    };
    fetchSettings();
  }, [currentUser?.id]);

  // 3. Auth State Observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const { doc, getDoc, setDoc, updateDoc } = await import('firebase/firestore');
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);

          const isAdminEmail = user.email === 'dsarkodie@datrixtechsolutions.com';

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            const role = isAdminEmail ? 'Admin' : (userData.role || 'User');

            // Sync status and role in background
            await updateDoc(userDocRef, { status: 'Active', role });

            setCurrentUser({
              id: user.uid,
              name: userData.name || user.displayName || 'User',
              email: user.email || '',
              role: role as any,
              initials: userData.initials || 'U',
              avatarColor: userData.avatarColor || 'av-blue',
              status: 'Active',
              streak: userData.streak || 0
            });
          } else {
            // New User Registration in Firestore
            const newUser = {
              name: user.displayName || 'New User',
              email: user.email || '',
              role: isAdminEmail ? 'Admin' : 'User',
              initials: (user.displayName || user.email || 'U').substring(0, 2).toUpperCase(),
              avatarColor: 'av-blue',
              status: 'Active',
              streak: 0,
              createdAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, newUser);
            setCurrentUser({ id: user.uid, ...newUser } as User);
          }
        } catch (err) { console.error('Auth sync error:', err); }
      } else {
        setCurrentUser(null);
      }
    });
    return unsubscribe;
  }, []);

  // 4. Helper: Show Toast
  const showToast = (msg: string, type: 'green' | 'red' | 'amber' | 'blue' = 'green') => {
    setToastConfig({ msg, type, visible: true });
    setTimeout(() => setToastConfig(prev => prev ? { ...prev, visible: false } : null), 3500);
  };

  // 5. Action: Submit Standup
  const submitStandup = async (responseParams: Omit<StandupResponse, 'id' | 'time'>) => {
    try {
      const { collection, addDoc, doc, updateDoc } = await import('firebase/firestore');
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const todayMarker = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

      await addDoc(collection(db, 'responses'), {
        ...responseParams,
        time,
        createdAt: new Date().toISOString(),
      });

      if (currentUser) {
        await updateDoc(doc(db, 'users', currentUser.id), {
          currentMood: responseParams.mood,
          lastStandup: todayMarker,
        });
      }

      if (responseParams.blockers.toLowerCase() !== 'no' && responseParams.blockers.trim() !== '') {
        fetch('/.netlify/functions/notify-blockers', {
          method: 'POST',
          body: JSON.stringify({ userName: currentUser?.name, blockers: responseParams.blockers })
        });
        showToast('Standup submitted! Admins notified of blockers.', 'red');
      } else {
        showToast('Standup submitted successfully!', 'green');
      }
      setCurrentPage('dashboard');
    } catch (err) { showToast('Failed to submit standup.', 'red'); }
  };

  // 6. Action: Update Schedule
  const updateSchedule = async (newSchedule: Schedule) => {
    setSchedule(newSchedule);
    try {
      const { doc, setDoc } = await import('firebase/firestore');
      await setDoc(doc(db, 'settings', 'schedule'), newSchedule);
      showToast('Schedule settings saved successfully.', 'green');
    } catch (err) { showToast('Failed to save schedule.', 'red'); }
  };

  // 7. Action: Send Reminders (Manual Trigger)
  const sendReminders = async (userIds?: string[]) => {
    try {
      const resp = await fetch('/.netlify/functions/send-reminder', {
        method: 'POST',
        body: JSON.stringify({ userIds: userIds || [] }),
      });
      if (resp.ok) {
        showToast('Reminders dispatched successfully.', 'green');
        setNotifications(prev => [{
          id: Date.now().toString(),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'Manual',
          text: `Reminders sent by admin.`
        }, ...prev]);
      }
    } catch (err) { showToast('Error triggering reminders.', 'red'); }
  };

  // Generic Handlers
  const updateUser = async (id: string, updates: Partial<User>) => {
    const { doc, updateDoc } = await import('firebase/firestore');
    await updateDoc(doc(db, 'users', id), updates as any);
    showToast('User updated.', 'green');
  };

  const deleteUser = async (id: string) => {
    const { doc, deleteDoc } = await import('firebase/firestore');
    await deleteDoc(doc(db, 'users', id));
    showToast('User removed.', 'red');
  };

  const updateCompanySettings = async (settings: CompanySettings) => {
    const { doc, setDoc } = await import('firebase/firestore');
    await setDoc(doc(db, 'settings', 'company'), settings);
    setCompanySettings(settings);
    showToast('Settings updated.', 'green');
  };

  return (
    <AppContext.Provider value={{
      currentPage, setCurrentPage, currentUser, users, responses, schedule, companySettings, notifications,
      showToast, toastConfig, addUser: () => { }, updateUser, deleteUser, submitStandup, updateResponse: () => { },
      updateSchedule, updateCompanySettings, deleteResponse: () => { }, sendReminders,
      editingUser, setEditingUser, editingResponse, setEditingResponse
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within an AppProvider');
  return context;
};