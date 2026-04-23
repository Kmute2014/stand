export type Status = 'Not Started' | 'In Progress' | 'Completed';

export type Priority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  assignee?: User;
  dueDate?: Date;
  comments: Comment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Comment {
  id: string;
  content: string;
  author: User;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserStory {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: Status;
  assignees: User[];
  dueDate?: Date;
  subtasks: Subtask[];
  columnId: string;
  epicId: string;
  sprintId: string;
  projectId: string;
  programId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface KanbanColumn {
  id: string;
  name: string;
  order: number;
  epicId: string;
  sprintId: string;
  projectId: string;
  programId: string;
  userStories: UserStory[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Epic {
  id: string;
  name: string;
  description?: string;
  order: number;
  columns: KanbanColumn[];
  sprintId: string;
  projectId: string;
  programId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Sprint {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  status: Status;
  epics: Epic[];
  projectId: string;
  programId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  status: Status;
  sprints: Sprint[];
  programId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Program {
  id: string;
  name: string;
  description?: string;
  projects: Project[];
  createdAt: Date;
  updatedAt: Date;
}

export interface GanttTask {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  progress: number;
  status: Status;
  type: 'program' | 'project' | 'sprint' | 'userStory';
  dependencies?: string[];
  assignees?: User[];
}

export interface SprintCompletionValidation {
  isValid: boolean;
  incompleteUserStories: UserStory[];
  incompleteSubtasks: Subtask[];
  errors: string[];
}
