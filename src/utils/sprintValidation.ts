import { Sprint, SprintCompletionValidation } from '../types/project';

export const validateSprintCompletion = (sprint: Sprint): SprintCompletionValidation => {
  const errors: string[] = [];

  // Check if sprint is currently in progress
  if (sprint.status !== 'In Progress') {
    errors.push(`Sprint must be "In Progress" to complete. Current status: ${sprint.status}`);
  }

  // Check if sprint end date has passed or is today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sprintEndDate = new Date(sprint.endDate);
  sprintEndDate.setHours(0, 0, 0, 0);

  if (sprintEndDate > today) {
    errors.push(`Sprint end date (${sprint.endDate.toLocaleDateString()}) has not arrived yet`);
  }

  const isValid = errors.length === 0;

  return {
    isValid,
    incompleteUserStories: [],
    incompleteSubtasks: [],
    errors,
  };
};

export const getSprintProgress = (sprint: Sprint): {
  totalUserStories: number;
  completedUserStories: number;
  totalSubtasks: number;
  completedSubtasks: number;
  userStoryProgress: number;
  subtaskProgress: number;
  overallProgress: number;
} => {
  return {
    totalUserStories: 0,
    completedUserStories: 0,
    totalSubtasks: 0,
    completedSubtasks: 0,
    userStoryProgress: 0,
    subtaskProgress: 0,
    overallProgress: 0,
  };
};

export const canStartSprint = (sprint: Sprint): {
  canStart: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  // Check if sprint is not started
  if (sprint.status !== 'Not Started') {
    errors.push(`Sprint must be "Not Started" to begin. Current status: ${sprint.status}`);
  }

  // Check if start date has arrived or is today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sprintStartDate = new Date(sprint.startDate);
  sprintStartDate.setHours(0, 0, 0, 0);

  if (sprintStartDate > today) {
    errors.push(`Sprint start date (${sprint.startDate.toLocaleDateString()}) has not arrived yet`);
  }

  // Check if sprint has at least one epic
  if (sprint.epics.length === 0) {
    errors.push('Sprint must have at least one epic to start');
  }

  return {
    canStart: errors.length === 0,
    errors,
  };
};

export const getSprintHealthStatus = (sprint: Sprint): {
  health: 'excellent' | 'good' | 'concerning' | 'critical';
  issues: string[];
  recommendations: string[];
} => {
  const issues: string[] = [];
  const recommendations: string[] = [];
  const progress = getSprintProgress(sprint);

  const today = new Date();
  const sprintEndDate = new Date(sprint.endDate);
  const daysRemaining = Math.ceil((sprintEndDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  // Check progress vs time remaining
  if (daysRemaining < 0) {
    issues.push('Sprint has ended but is not completed');
    recommendations.push('Complete the sprint or extend the timeline');
  } else if (daysRemaining <= 2 && progress.overallProgress < 80) {
    issues.push('Sprint ending soon with low progress');
    recommendations.push('Focus on completing critical tasks');
  } else if (daysRemaining <= 7 && progress.overallProgress < 50) {
    issues.push('Low progress for time remaining');
    recommendations.push('Re-prioritize tasks and remove blockers');
  }

  // Determine health status
  let health: 'excellent' | 'good' | 'concerning' | 'critical';

  if (issues.length === 0) {
    health = 'excellent';
  } else if (issues.length <= 2) {
    health = 'good';
  } else if (issues.length <= 4) {
    health = 'concerning';
  } else {
    health = 'critical';
  }

  return {
    health,
    issues,
    recommendations,
  };
};
