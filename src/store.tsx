import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, StandupResponse, Schedule, NotificationLog, CompanySettings } from './types';
import { Project, Program, UserStory, Sprint, Epic, SprintComment, Task } from './types/project';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

interface AppState {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  currentUser: User | null;
  users: User[];
  responses: StandupResponse[];
  programs: Program[];
  projects: Project[];
  userStories: UserStory[];
  sprints: Sprint[];
  epics: Epic[];
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
  createProgram: (program: Omit<Program, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProgram: (id: string, updates: Partial<Program>) => void;
  deleteProgram: (id: string) => void;
  createProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  createSprint: (sprint: Omit<Sprint, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateSprint: (id: string, updates: Partial<Sprint>) => void;
  deleteSprint: (id: string) => void;
  createEpic: (epic: Omit<Epic, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateEpic: (id: string, updates: Partial<Epic>) => void;
  deleteEpic: (id: string) => void;
  addSprintComment: (sprintId: string, comment: Omit<SprintComment, 'id' | 'createdAt' | 'updatedAt'>) => void;
  createUserStory: (userStory: Omit<UserStory, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateUserStory: (id: string, updates: Partial<UserStory>) => void;
  deleteUserStory: (id: string) => void;
  editingUser: User | null;
  setEditingUser: (user: User | null) => void;
  editingResponse: StandupResponse | null;
  setEditingResponse: (response: StandupResponse | null) => void;
  // Sprint Board modal states
  sprintBoardModals: {
    showCreateSprintModal: boolean;
    showCreateEpicModal: boolean;
    showCreateUserStoryModal: boolean;
    showEditUserStoryModal: boolean;
    selectedProject: Project | null;
    selectedSprint: Sprint | null;
    selectedEpic: Epic | null;
    editingUserStory: UserStory | null;
  };
  setSprintBoardModals: (modals: Partial<AppState['sprintBoardModals']>) => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [users, setUsers] = useState<User[]>([]);
  const [responses, setResponses] = useState<StandupResponse[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [userStories, setUserStories] = useState<UserStory[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [epics, setEpics] = useState<Epic[]>([]);
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

  // Sprint Board modal states
  const [sprintBoardModals, setSprintBoardModalsState] = useState({
    showCreateSprintModal: false,
    showCreateEpicModal: false,
    showCreateUserStoryModal: false,
    showEditUserStoryModal: false,
    selectedProject: null,
    selectedSprint: null,
    selectedEpic: null,
    editingUserStory: null,
  });

  const setSprintBoardModals = (modals: Partial<typeof sprintBoardModals>) => {
    setSprintBoardModalsState(prev => ({ ...prev, ...modals }));
  };

  // 1. Real-time Listeners (Responses, Users, Programs, Projects, & User Stories)
  useEffect(() => {
    if (!currentUser) return;
    let unsubResponses: (() => void) | undefined;
    let unsubUsers: (() => void) | undefined;
    let unsubPrograms: (() => void) | undefined;
    let unsubProjects: (() => void) | undefined;
    let unsubUserStories: (() => void) | undefined;
    let unsubSprints: (() => void) | undefined;
    let unsubEpics: (() => void) | undefined;

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

      unsubPrograms = onSnapshot(collection(db, 'programs'), (snapshot) => {
        const data = snapshot.docs.map(doc => {
          const docData = doc.data();
          return {
            id: doc.id,
            name: docData.name || '',
            description: docData.description || '',
            owner: docData.owner || { id: '', name: 'Unknown', email: '', role: 'User' },
            projects: docData.projects || [],
            createdAt: docData.createdAt?.toDate?.() || new Date(),
            updatedAt: docData.updatedAt?.toDate?.() || new Date(),
          } as Program;
        });
        console.log('Programs data loaded:', data);
        setPrograms(data);
      });

      unsubProjects = onSnapshot(collection(db, 'projects'), (snapshot) => {
        const data = snapshot.docs.map(doc => {
          const docData = doc.data();
          return {
            id: doc.id,
            name: docData.name || '',
            description: docData.description || '',
            startDate: docData.startDate?.toDate?.() || new Date(),
            endDate: docData.endDate?.toDate?.() || new Date(),
            status: docData.status || 'Product Backlog',
            owner: docData.owner || { id: '', name: 'Unknown', email: '', role: 'User' },
            teamMembers: docData.teamMembers || [],
            programId: docData.programId || '',
            createdAt: docData.createdAt?.toDate?.() || new Date(),
            updatedAt: docData.updatedAt?.toDate?.() || new Date(),
          } as Project;
        });
        console.log('Projects data loaded:', data);
        setProjects(data);
      });

      unsubUserStories = onSnapshot(collection(db, 'userStories'), (snapshot) => {
        const data = snapshot.docs.map(doc => {
          const docData = doc.data();
          return {
            id: doc.id,
            title: docData.title || '',
            user: docData.user || '',
            action: docData.action || '',
            value: docData.value || '',
            description: docData.description,
            priority: docData.priority || 'Medium',
            estimate: docData.estimate || 1,
            status: docData.status || 'Backlog',
            projectId: docData.projectId || '',
            programId: docData.programId || '',
            epicId: docData.epicId,
            tasks: docData.tasks || [],
            order: docData.order || 1,
            createdAt: docData.createdAt?.toDate?.() || new Date(),
            updatedAt: docData.updatedAt?.toDate?.() || new Date(),
          } as UserStory;
        });
        console.log('User Stories data loaded:', data);
        setUserStories(data);
      });

      unsubSprints = onSnapshot(collection(db, 'sprints'), (snapshot) => {
        const data = snapshot.docs.map(doc => {
          const docData = doc.data();
          return {
            id: doc.id,
            name: docData.name || '',
            description: docData.description || '',
            startDate: docData.startDate?.toDate?.() || new Date(),
            endDate: docData.endDate?.toDate?.() || new Date(),
            projectId: docData.projectId || '',
            programId: docData.programId || '',
            epics: docData.epics || [],
            comments: docData.comments || [],
            createdAt: docData.createdAt?.toDate?.() || new Date(),
            updatedAt: docData.updatedAt?.toDate?.() || new Date(),
          } as Sprint;
        });
        console.log('Sprints data loaded:', data);
        setSprints(data);
      });

      unsubEpics = onSnapshot(collection(db, 'epics'), (snapshot) => {
        const data = snapshot.docs.map(doc => {
          const docData = doc.data();
          return {
            id: doc.id,
            name: docData.name || '',
            description: docData.description || '',
            status: docData.status || 'Product Backlog',
            priority: docData.priority || 'Medium',
            projectId: docData.projectId || '',
            programId: docData.programId || '',
            sprintId: docData.sprintId,
            userStories: docData.userStories || [],
            createdAt: docData.createdAt?.toDate?.() || new Date(),
            updatedAt: docData.updatedAt?.toDate?.() || new Date(),
          } as Epic;
        });
        console.log('Epics data loaded:', data);
        setEpics(data);
      });
    };

    setupListeners();
    return () => { unsubResponses?.(); unsubUsers?.(); unsubPrograms?.(); unsubProjects?.(); unsubUserStories?.(); unsubSprints?.(); unsubEpics?.(); };
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

  const deleteResponse = async (id: string) => {
    // Check if current user is admin
    if (!currentUser || currentUser.role !== 'Admin') {
      showToast('Only admins can delete responses.', 'red');
      return;
    }

    try {
      const { doc, deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'responses', id));
      showToast('Response deleted successfully.', 'green');
    } catch (err) {
      showToast('Failed to delete response.', 'red');
    }
  };

  const createProgram = async (programData: Omit<Program, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
      const docRef = await addDoc(collection(db, 'programs'), {
        ...programData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      showToast('Program created successfully.', 'green');
    } catch (err) {
      showToast('Failed to create program.', 'red');
    }
  };

  const updateProgram = async (id: string, updates: Partial<Program>) => {
    try {
      const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
      await updateDoc(doc(db, 'programs', id), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      showToast('Program updated successfully.', 'green');
    } catch (err) {
      showToast('Failed to update program.', 'red');
    }
  };

  const deleteProgram = async (id: string) => {
    // Check if current user has permission
    if (!currentUser || (currentUser.role !== 'Admin' && currentUser.role !== 'Project Manager/Scrum Master')) {
      showToast('Only admins and project managers can delete programs.', 'red');
      return;
    }

    try {
      const { doc, deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'programs', id));
      showToast('Program deleted successfully.', 'green');
    } catch (err) {
      showToast('Failed to delete program.', 'red');
    }
  };

  // Project Management Functions
  const createProject = async (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
      const docRef = await addDoc(collection(db, 'projects'), {
        ...projectData,
        startDate: new Date(projectData.startDate),
        endDate: new Date(projectData.endDate),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      showToast('Project created successfully.', 'green');
    } catch (err) {
      showToast('Failed to create project.', 'red');
    }
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    try {
      const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
      await updateDoc(doc(db, 'projects', id), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      showToast('Project updated successfully.', 'green');
    } catch (err) {
      showToast('Failed to update project.', 'red');
    }
  };

  const deleteProject = async (id: string) => {
    // Check if current user has permission
    if (!currentUser || (currentUser.role !== 'Admin' && currentUser.role !== 'Project Manager/Scrum Master')) {
      showToast('Only admins and project managers can delete projects.', 'red');
      return;
    }

    try {
      const { doc, deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'projects', id));
      showToast('Project deleted successfully.', 'green');
    } catch (err) {
      showToast('Failed to delete project.', 'red');
    }
  };

  // Sprint Management Functions
  const createSprint = async (sprintData: Omit<Sprint, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
      const docRef = await addDoc(collection(db, 'sprints'), {
        ...sprintData,
        startDate: sprintData.startDate,
        endDate: sprintData.endDate,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      showToast('Sprint created successfully.', 'green');
    } catch (err) {
      showToast('Failed to create sprint.', 'red');
    }
  };

  const updateSprint = async (id: string, updates: Partial<Sprint>) => {
    try {
      const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
      await updateDoc(doc(db, 'sprints', id), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      showToast('Sprint updated successfully.', 'green');
    } catch (err) {
      showToast('Failed to update sprint.', 'red');
    }
  };

  const deleteSprint = async (id: string) => {
    // Check if current user has permission
    if (!currentUser || (currentUser.role !== 'Admin' && currentUser.role !== 'Project Manager/Scrum Master')) {
      showToast('Only admins and project managers can delete sprints.', 'red');
      return;
    }

    try {
      const { doc, deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'sprints', id));
      showToast('Sprint deleted successfully.', 'green');
    } catch (err) {
      showToast('Failed to delete sprint.', 'red');
    }
  };

  // Epic Management Functions
  const createEpic = async (epicData: Omit<Epic, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
      const docRef = await addDoc(collection(db, 'epics'), {
        ...epicData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      showToast('Epic created successfully.', 'green');
    } catch (err) {
      showToast('Failed to create epic.', 'red');
    }
  };

  const updateEpic = async (id: string, updates: Partial<Epic>) => {
    try {
      const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
      await updateDoc(doc(db, 'epics', id), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      showToast('Epic updated successfully.', 'green');
    } catch (err) {
      showToast('Failed to update epic.', 'red');
    }
  };

  const deleteEpic = async (id: string) => {
    // Check if current user has permission
    if (!currentUser || (currentUser.role !== 'Admin' && currentUser.role !== 'Project Manager/Scrum Master')) {
      showToast('Only admins and project managers can delete epics.', 'red');
      return;
    }

    try {
      const { doc, deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'epics', id));
      showToast('Epic deleted successfully.', 'green');
    } catch (err) {
      showToast('Failed to delete epic.', 'red');
    }
  };

  const addSprintComment = async (sprintId: string, commentData: Omit<SprintComment, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const { doc, updateDoc, serverTimestamp, arrayUnion } = await import('firebase/firestore');
      const comment = {
        ...commentData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await updateDoc(doc(db, 'sprints', sprintId), {
        comments: arrayUnion(comment),
        updatedAt: serverTimestamp(),
      });
      showToast('Comment added successfully.', 'green');
    } catch (err) {
      showToast('Failed to add comment.', 'red');
    }
  };

  // User Story Management Functions
  const createUserStory = async (userStoryData: Omit<UserStory, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
      const docRef = await addDoc(collection(db, 'userStories'), {
        ...userStoryData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      showToast('User Story created successfully.', 'green');
    } catch (err) {
      showToast('Failed to create user story.', 'red');
    }
  };

  const updateUserStory = async (id: string, updates: Partial<UserStory>) => {
    try {
      const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
      await updateDoc(doc(db, 'userStories', id), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      showToast('User Story updated successfully.', 'green');
    } catch (err) {
      showToast('Failed to update user story.', 'red');
    }
  };

  const deleteUserStory = async (id: string) => {
    // Check if current user has permission
    if (!currentUser || (currentUser.role !== 'Admin' && currentUser.role !== 'Project Manager/Scrum Master')) {
      showToast('Only admins and project managers can delete user stories.', 'red');
      return;
    }

    try {
      const { doc, deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'userStories', id));
      showToast('User Story deleted successfully.', 'green');
    } catch (err) {
      showToast('Failed to delete user story.', 'red');
    }
  };

  return (
    <AppContext.Provider value={{
      currentPage, setCurrentPage, currentUser, users, programs, projects, userStories, sprints, epics, responses, schedule, companySettings, notifications,
      showToast, toastConfig, addUser: () => { }, updateUser, deleteUser, submitStandup, updateResponse: () => { },
      updateSchedule, updateCompanySettings, deleteResponse, sendReminders, createProgram, updateProgram, deleteProgram, createProject, updateProject, deleteProject, createSprint, updateSprint, deleteSprint, createEpic, updateEpic, deleteEpic, addSprintComment, createUserStory, updateUserStory, deleteUserStory,
      editingUser, setEditingUser, editingResponse, setEditingResponse,
      sprintBoardModals, setSprintBoardModals
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