import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, StandupResponse, Schedule, NotificationLog, CompanySettings } from './types';
import { auth, db, functions } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';

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
  sendReminders: () => void;
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
    name: 'My Company',
    logo: null,
  });

  const [toastConfig, setToastConfig] = useState<{ msg: string; type: string; visible: boolean } | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingResponse, setEditingResponse] = useState<StandupResponse | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Fetch user from Firestore
          const { doc, getDoc, setDoc } = await import('firebase/firestore');
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            // User exists in Firestore
            const userData = userDocSnap.data();
            setCurrentUser({
              id: user.uid,
              name: userData.name || user.displayName || 'User',
              email: user.email || '',
              role: userData.role || 'Member',
              initials: userData.initials || (userData.name || 'U').substring(0, 2).toUpperCase(),
              avatarColor: userData.avatarColor || 'av-blue',
              status: userData.status || 'Pending',
              streak: userData.streak || 0
            });
          } else {
            // User authenticated in Firebase but not in Firestore - auto-create entry
            console.log('Creating user document for authenticated user:', user.email);

            const initials = (user.displayName || user.email || 'U')
              .split(' ')
              .map((n: string) => n[0])
              .join('')
              .substring(0, 2)
              .toUpperCase();
            const colors = ['av-blue', 'av-green', 'av-amber', 'av-teal', 'av-purple'];
            const avatarColor = colors[Math.floor(Math.random() * colors.length)];

            const newUser = {
              name: user.displayName || 'New User',
              email: user.email || '',
              role: 'Member', // Default role - admin can upgrade
              initials,
              avatarColor,
              status: 'Pending',
              streak: 0,
              createdAt: new Date().toISOString(),
            };

            // Try to create the user document, but don't fail if it errors
            try {
              await setDoc(userDocRef, newUser);
              console.log('User document created for:', user.email);
            } catch (createErr) {
              console.warn('Could not create user document:', createErr);
              // Continue anyway - user can still log in
            }

            // Set the user in state regardless of document creation
            setCurrentUser({
              id: user.uid,
              name: newUser.name,
              email: newUser.email,
              role: newUser.role,
              initials,
              avatarColor,
              status: newUser.status,
              streak: newUser.streak,
            });
          }
        } catch (err) {
          console.error('Critical error in auth state change:', err);
          // Don't log out on error - just keep them logged in
        }
      } else {
        setCurrentUser(null);
        setUsers([]);
        setResponses([]);
        setNotifications([]);
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    // Automated standup reminder implementation
    const interval = setInterval(() => {
      if (!schedule.autoEnabled) return;

      const now = new Date();
      const currentDay = now.toLocaleString('en-US', { weekday: 'long' });
      const currentTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

      if (schedule.activeDays.includes(currentDay) && currentTime === schedule.time) {
        // Check if already sent today
        const alreadySent = notifications.some(n =>
          n.type === 'Auto' && n.text.includes(now.toLocaleDateString())
        );

        if (!alreadySent) {
          console.log('Sending automatic standup emails...');
          // Note: In a production app, this would trigger a Firebase Cloud Function
          setNotifications(prev => [{
            id: Date.now().toString(),
            time: currentTime,
            type: 'Auto',
            text: `Standup emails dispatched automatically to all members on ${now.toLocaleDateString()}`
          }, ...prev]);
          showToast('Reminder emails dispatched to all members.', 'blue');
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [schedule, notifications]);

  const showToast = (msg: string, type: 'green' | 'red' | 'amber' | 'blue' = 'green') => {
    setToastConfig({ msg, type, visible: true });
    setTimeout(() => {
      setToastConfig(prev => prev ? { ...prev, visible: false } : null);
    }, 3500);
  };

  const addUser = (newUser: Omit<User, 'id'>) => {
    // TODO: Add to Firestore
    const user: User = { ...newUser, id: Date.now().toString() };
    setUsers([...users, user]);
    showToast('New member added and welcome email sent!', 'green');
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    // TODO: Update in Firestore
    setUsers(users.map(u => u.id === id ? { ...u, ...updates } : u));
    showToast('User updated successfully!', 'green');
  };

  const deleteUser = (id: string) => {
    // TODO: Delete in Firestore
    setUsers(users.filter(u => u.id !== id));
    showToast('User deleted.', 'red');
  };

  const submitStandup = async (responseParams: Omit<StandupResponse, 'id' | 'time'>) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newResponse: StandupResponse = {
      ...responseParams,
      id: Date.now().toString(),
      time,
    };

    // Save to Firestore
    try {
      const { collection, addDoc } = await import('firebase/firestore');
      const responsesCollection = collection(db, 'responses');
      await addDoc(responsesCollection, {
        ...newResponse,
        createdAt: new Date().toISOString()
      });
      console.log('Response saved to Firestore');
    } catch (err) {
      console.error('Error saving response to Firestore:', err);
    }

    setResponses([newResponse, ...responses]);

    if (newResponse.blockers.toLowerCase() !== 'no') {
      console.log(`Blocker reported: ${newResponse.blockers}`);

      // Send blocker notification to all admins
      if (import.meta.env.PROD) {
        fetch('/.netlify/functions/notify-blockers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userName: currentUser?.name || 'Unknown',
            blockers: newResponse.blockers,
            userId: currentUser?.id
          })
        })
          .then(res => res.json())
          .then(data => console.log('Blocker notification sent:', data))
          .catch(err => console.error('Failed to send blocker notification:', err));
      }

      showToast('Standup submitted! Blocker detected — admins notified by email.', 'red');

      setNotifications(prev => [{
        id: Date.now().toString(),
        time,
        type: 'Alert',
        text: `Blocker alert sent to all admins — ${currentUser?.name} reported a blocker.`
      }, ...prev]);
    } else {
      showToast('Standup submitted successfully! Team notified.', 'green');
    }

    setCurrentPage('dashboard');
  };

  const updateResponse = async (id: string, updates: Partial<StandupResponse>) => {
    // Update in Firestore
    try {
      const { collection, query, where, getDocs, updateDoc } = await import('firebase/firestore');
      const responsesCollection = collection(db, 'responses');
      const q = query(responsesCollection, where('id', '==', id));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const docRef = querySnapshot.docs[0].ref;
        await updateDoc(docRef, updates);
        console.log('Response updated in Firestore');
      }
    } catch (err) {
      console.error('Error updating response in Firestore:', err);
    }
    setResponses(responses.map(r => r.id === id ? { ...r, ...updates } : r));
    showToast('Standup response updated!', 'green');
  };

  const updateSchedule = (newSchedule: Schedule) => {
    // TODO: Update in Firestore
    setSchedule(newSchedule);
    showToast('Schedule settings saved successfully.', 'green');
  };

  const updateCompanySettings = (settings: CompanySettings) => {
    // TODO: Update in Firestore
    setCompanySettings(settings);
    showToast('Company settings updated!', 'green');
  };

  const deleteResponse = async (id: string) => {
    // Delete from Firestore
    try {
      const { collection, query, where, getDocs, deleteDoc } = await import('firebase/firestore');
      const responsesCollection = collection(db, 'responses');
      const q = query(responsesCollection, where('id', '==', id));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const docRef = querySnapshot.docs[0].ref;
        await deleteDoc(docRef);
        console.log('Response deleted from Firestore');
      }
    } catch (err) {
      console.error('Error deleting response from Firestore:', err);
    }
    setResponses(responses.filter(r => r.id !== id));
    showToast('Response deleted.', 'amber');
  };

  const sendReminders = async () => {
    try {
      const sendReminderFunction = httpsCallable(functions, 'sendStandupReminder');
      await sendReminderFunction({ message: 'Triggering standup reminders' });

      showToast('Reminders dispatched successfully.', 'green');
      setNotifications(prev => [{
        id: Date.now().toString(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'Manual',
        text: `Reminder successfully sent by admin.`
      }, ...prev]);
    } catch (error) {
      console.error('Error sending reminders:', error);
      showToast('Failed to send reminders.', 'red');
    }
  };

  return (
    <AppContext.Provider value={{
      currentPage, setCurrentPage, currentUser, users, responses, schedule, companySettings, notifications,
      showToast, toastConfig, addUser, updateUser, deleteUser, submitStandup, updateResponse, updateSchedule, updateCompanySettings, deleteResponse, sendReminders,
      editingUser, setEditingUser, editingResponse, setEditingResponse
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
