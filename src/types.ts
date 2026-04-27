export type Role = 'Admin' | 'User';

export type Mood = {
  score: number;
  emoji: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  initials: string;
  avatarColor: string;
  status: 'Active' | 'Pending';
  streak: number;
  lastStandup?: string;
  currentMood?: Mood;
};

export type StandupResponse = {
  id: string;
  userId: string;
  date: string;
  time: string;
  yesterday: string;
  today: string;
  blockers: string;
  mood: Mood;
  createdAt: string;
};

export type Schedule = {
  activeDays: string[];
  time: string;
  timezone: string;
  autoEnabled: boolean;
};

export type CompanySettings = {
  name: string;
  logo: string | null;
};

export type NotificationLog = {
  id: string;
  time: string;
  type: 'Auto' | 'Alert' | 'Manual';
  text: string;
};

export type Project = {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: 'Product Backlog' | 'Refined Backlog' | 'In Progress' | 'Testing' | 'Completed';
  owner: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
  teamMembers: {
    id: string;
    name: string;
    email: string;
    role: Role;
  }[];
  programId: string;
  createdAt: string;
  updatedAt: string;
};

export type Program = {
  id: string;
  name: string;
  description?: string;
  owner: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
  projects: Project[]; // Will be populated with Project data later
  createdAt: string;
  updatedAt: string;
};
