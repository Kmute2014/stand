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
