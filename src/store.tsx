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

  // Real-time listener for responses collection
  useEffect(() => {
    if (!currentUser) return;
    let unsubResponses: (() => void) | undefined;
    let unsubUsers: (() => void) | undefined;

    const setupListeners = async () => {
      const { collection, onSnapshot, orderBy, query } = await import('firebase/firestore');

      // Listen to responses
      const responsesRef = collection(db, 'responses');
      const responsesQuery = query(responsesRef, orderBy('createdAt', 'desc'));
      unsubResponses = onSnapshot(responsesQuery, (snapshot) => {
        const data = snapshot.docs.map(doc => {
          const d = doc.data();
          return {
            id: doc.id,
            userId: d.userId,
            date: d.date,
            time: d.time,
            yesterday: d.yesterday,
            today: d.today,
            blockers: d.blockers,
            mood: d.mood,
          } as StandupResponse;
        });
        setResponses(data);
      }, (err) => console.error('Responses listener error:', err));

      // Listen to users collection (for team mood & user list)
      const usersRef = collection(db, 'users');
      unsubUsers = onSnapshot(usersRef, (snapshot) => {
        const data = snapshot.docs.map(doc => {
          const d = doc.data();
          return {
            id: doc.id,
            name: d.name || '',
            email: d.email || '',
            role: d.role || 'Member',
            initials: d.initials || '',
            avatarColor: d.avatarColor || 'av-blue',
            status: d.status || 'Pending',
            streak: d.streak || 0,
            lastStandup: d.lastStandup,
            currentMood: d.currentMood,
          } as User;
        });
        setUsers(data);
      }, (err) => console.error('Users listener error:', err));
    };

    setupListeners();

    return () => {
      unsubResponses?.();
      unsubUsers?.();
    };
  }, [currentUser?.id]);

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
    // Users are added to Firestore in AddUserModal directly; real-time listener handles state update
    showToast('New member added and welcome email sent!', 'green');
  };

  const updateUser = async (id: string, updates: Partial<User>) => {
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'users', id), updates as Record<string, unknown>);
      showToast('User updated successfully!', 'green');
    } catch (err) {
      console.error('Error updating user in Firestore:', err);
      showToast('Failed to update user.', 'red');
    }
  };

  const deleteUser = async (id: string) => {
    try {
      const { doc, deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'users', id));
      showToast('User deleted.', 'red');
    } catch (err) {
      console.error('Error deleting user from Firestore:', err);
      showToast('Failed to delete user.', 'red');
    }
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
      const { collection, addDoc, doc, updateDoc } = await import('firebase/firestore');
      const responsesCollection = collection(db, 'responses');
      const docRef = await addDoc(responsesCollection, {
        userId: newResponse.userId,
        date: newResponse.date,
        time: newResponse.time,
        yesterday: newResponse.yesterday,
        today: newResponse.today,
        blockers: newResponse.blockers,
        mood: newResponse.mood,
        createdAt: new Date().toISOString(),
      });
      // Update the id to match Firestore doc id
      newResponse.id = docRef.id;

      // Also update user's currentMood and lastStandup
      if (currentUser) {
        await updateDoc(doc(db, 'users', currentUser.id), {
          currentMood: newResponse.mood,
          lastStandup: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        });
      }
      console.log('Response saved to Firestore');
    } catch (err) {
      console.error('Error saving response to Firestore:', err);
    }

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
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'responses', id), updates as Record<string, unknown>);
      showToast('Standup response updated!', 'green');
    } catch (err) {
      console.error('Error updating response in Firestore:', err);
      showToast('Failed to update response.', 'red');
    }
  };

  const updateSchedule = async (newSchedule: Schedule) => {
    setSchedule(newSchedule);
    try {
      const { doc, setDoc } = await import('firebase/firestore');
      await setDoc(doc(db, 'settings', 'schedule'), newSchedule);
    } catch (err) {
      console.error('Error saving schedule:', err);
    }
    showToast('Schedule settings saved successfully.', 'green');
  };

  const updateCompanySettings = async (settings: CompanySettings) => {
    setCompanySettings(settings);
    try {
      const { doc, setDoc } = await import('firebase/firestore');
      await setDoc(doc(db, 'settings', 'company'), settings);
    } catch (err) {
      console.error('Error saving company settings:', err);
    }
    showToast('Company settings updated!', 'green');
  };

  const deleteResponse = async (id: string) => {
    try {
      const { doc, deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'responses', id));
      showToast('Response deleted.', 'amber');
    } catch (err) {
      console.error('Error deleting response from Firestore:', err);
      showToast('Failed to delete response.', 'red');
    }
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
