import { Sprint, SprintCompletionValidation, UserStory, Subtask } from '../types/project';

export const validateSprintCompletion = (sprint: Sprint): SprintCompletionValidation => {
  const errors: string[] = [];
  const incompleteUserStories: UserStory[] = [];
  const incompleteSubtasks: Subtask[] = [];

  // Collect all user stories from all epics and columns
  const allUserStories: UserStory[] = [];
  sprint.epics.forEach(epic => {
    epic.columns.forEach(column => {
      allUserStories.push(...column.userStories);
    });
  });

  // Check if all user stories are completed
  allUserStories.forEach(story => {
    if (story.status !== 'Completed') {
      incompleteUserStories.push(story);
      errors.push(`User Story "${story.title}" is not completed (Status: ${story.status})`);
    }
  });

  // Check if all subtasks are completed
  allUserStories.forEach(story => {
    story.subtasks.forEach(subtask => {
      if (!subtask.completed) {
        incompleteSubtasks.push(subtask);
        errors.push(`Subtask "${subtask.title}" in User Story "${story.title}" is not completed`);
      }
    });
  });

  // Check if sprint has any user stories at all
  if (allUserStories.length === 0) {
    errors.push('Sprint has no user stories to complete');
  }

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
    incompleteUserStories,
    incompleteSubtasks,
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
  const allUserStories: UserStory[] = [];
  sprint.epics.forEach(epic => {
    epic.columns.forEach(column => {
      allUserStories.push(...column.userStories);
    });
  });

  const totalUserStories = allUserStories.length;
  const completedUserStories = allUserStories.filter(story => story.status === 'Completed').length;

  const allSubtasks = allUserStories.flatMap(story => story.subtasks);
  const totalSubtasks = allSubtasks.length;
  const completedSubtasks = allSubtasks.filter(subtask => subtask.completed).length;

  const userStoryProgress = totalUserStories > 0 ? (completedUserStories / totalUserStories) * 100 : 0;
  const subtaskProgress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;
  const overallProgress = (userStoryProgress + subtaskProgress) / 2;

  return {
    totalUserStories,
    completedUserStories,
    totalSubtasks,
    completedSubtasks,
    userStoryProgress,
    subtaskProgress,
    overallProgress,
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

  // Check if sprint has user stories
  const hasUserStories = sprint.epics.some(epic => 
    epic.columns.some(column => column.userStories.length > 0)
  );

  if (!hasUserStories) {
    errors.push('Sprint must have at least one user story to start');
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
    recommendations.push('Focus on completing critical user stories');
  } else if (daysRemaining <= 7 && progress.overallProgress < 50) {
    issues.push('Low progress for time remaining');
    recommendations.push('Re-prioritize user stories and remove blockers');
  }

  // Check user story completion
  if (progress.totalUserStories > 0 && progress.userStoryProgress < 30) {
    issues.push('Very few user stories completed');
    recommendations.push('Focus on completing at least one user story completely');
  }

  // Check subtask completion
  if (progress.totalSubtasks > 0 && progress.subtaskProgress < progress.userStoryProgress - 20) {
    issues.push('Subtasks lagging behind user story progress');
    recommendations.push('Break down remaining work into smaller subtasks');
  }

  // Check for empty epics or columns
  const emptyEpics = sprint.epics.filter(epic => 
    epic.columns.every(column => column.userStories.length === 0)
  );

  if (emptyEpics.length > 0) {
    issues.push(`${emptyEpics.length} epic(s) have no user stories`);
    recommendations.push('Add user stories to all epics or remove empty epics');
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
