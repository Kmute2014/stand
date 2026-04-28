export type Status = 'Product Backlog' | 'Refined Backlog' | 'In Progress' | 'Testing' | 'Completed';

export type Priority = 'Low' | 'Medium' | 'High' | 'Critical';

export type UserRole = 'Admin' | 'Project Manager/Scrum Master' | 'User';

export type Permission = 'create' | 'read' | 'update' | 'delete';

export interface RolePermissions {
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
}

// Permission checking utility
export const getRolePermissions = (role: UserRole): RolePermissions => {
  switch (role) {
    case 'Admin':
      return {
        canCreate: true,
        canRead: true,
        canUpdate: true,
        canDelete: true,
      };
    case 'Project Manager/Scrum Master':
      return {
        canCreate: true,
        canRead: true,
        canUpdate: true,
        canDelete: true,
      };
    case 'User':
      return {
        canCreate: true,
        canRead: true,
        canUpdate: true,
        canDelete: false,
      };
    default:
      return {
        canCreate: false,
        canRead: false,
        canUpdate: false,
        canDelete: false,
      };
  }
};

export const hasPermission = (user: User | undefined, permission: Permission): boolean => {
  if (!user) {
    return false;
  }
  const permissions = getRolePermissions(user.role);
  switch (permission) {
    case 'create':
      return permissions.canCreate;
    case 'read':
      return permissions.canRead;
    case 'update':
      return permissions.canUpdate;
    case 'delete':
      return permissions.canDelete;
    default:
      return false;
  }
};


export interface KanbanColumn {
  id: string;
  name: string;
  order: number;
  projectId: string;
  programId: string;
  createdAt: Date;
  updatedAt: Date;
}


export interface Epic {
  id: string;
  name: string;
  description?: string;
  status: Status;
  priority: Priority;
  projectId: string;
  programId: string;
  sprintId?: string; // Optional sprint assignment
  createdAt: Date;
  updatedAt: Date;
}

export interface Sprint {
  id: string;
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  status: Status;
  projectId: string;
  programId: string;
  epics: Epic[];
  comments: SprintComment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SprintComment {
  id: string;
  content: string;
  author: User;
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
  owner: User;
  teamMembers: User[];
  programId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Program {
  id: string;
  name: string;
  description?: string;
  owner: User;
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
  type: 'program' | 'project';
  dependencies?: string[];
  assignees?: User[];
}

