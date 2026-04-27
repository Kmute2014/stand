import React, { useState, useEffect } from 'react';
import { useAppContext } from '../store';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Priority, Status } from '../types/project';

interface ParsedUserStory {
  user: string;
  action: string;
  value: string;
  isValid: boolean;
  error?: string;
}

export const CreateUserStoryModal: React.FC = () => {
  const { showToast, currentUser, projects, programs } = useAppContext();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [estimate, setEstimate] = useState<number>(1);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [parsedStory, setParsedStory] = useState<ParsedUserStory>({
    user: '',
    action: '',
    value: '',
    isValid: false
  });

  // Check if current user has permission to create user stories
  const canCreateUserStory = currentUser?.role === 'Admin' || currentUser?.role === 'Project Manager/Scrum Master';

  // Parse and validate user story format
  const parseUserStory = (storyTitle: string): ParsedUserStory => {
    const trimmedTitle = storyTitle.trim();

    if (!trimmedTitle) {
      return { user: '', action: '', value: '', isValid: false, error: 'User story title is required' };
    }

    // Enforced format: "As a [user], I want [action], so that [value]"
    const userStoryPattern = /^As a\s+([^,]+),\s+I want\s+([^,]+),\s+so that\s+(.+)$/i;
    const match = trimmedTitle.match(userStoryPattern);

    if (!match) {
      return {
        user: '',
        action: '',
        value: '',
        isValid: false,
        error: 'Invalid format. Must follow: "As a [user], I want [action], so that [value]"'
      };
    }

    const [, user, action, value] = match;

    return {
      user: user.trim(),
      action: action.trim(),
      value: value.trim(),
      isValid: true
    };
  };

  // Update parsed story when title changes
  useEffect(() => {
    const parsed = parseUserStory(title);
    setParsedStory(parsed);
  }, [title]);

  const handleCreate = async () => {
    if (!canCreateUserStory) {
      showToast('Only admins and project managers can create user stories.', 'red');
      return;
    }

    if (!parsedStory.isValid) {
      showToast('Please fix the user story format before creating.', 'red');
      return;
    }

    if (!selectedProjectId) {
      showToast('Please select a project.', 'red');
      return;
    }

    if (estimate <= 0) {
      showToast('Estimate must be greater than 0.', 'red');
      return;
    }

    setIsLoading(true);
    try {
      const selectedProject = projects.find(p => p.id === selectedProjectId);
      const selectedProgram = programs.find(p => p.id === selectedProject?.programId);

      if (!selectedProject || !selectedProgram) {
        showToast('Invalid project selection.', 'red');
        return;
      }

      // Create user story document in Firestore
      const userStoriesCollection = collection(db, 'userStories');
      const docRef = await addDoc(userStoriesCollection, {
        title: title.trim(),
        user: parsedStory.user,
        action: parsedStory.action,
        value: parsedStory.value,
        description: description.trim(),
        priority,
        estimate,
        status: 'Backlog', // Default status
        projectId: selectedProject.id,
        programId: selectedProgram.id,
        order: 1, // Will be updated later when multiple stories exist
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log(`User Story "${title}" created in Firestore with ID: ${docRef.id}`);

      showToast(`User Story "${parsedStory.user}" created successfully!`, 'green');

      // Reset form
      setTitle('');
      setDescription('');
      setPriority('Medium');
      setEstimate(1);
      setSelectedProjectId('');
      setParsedStory({ user: '', action: '', value: '', isValid: false });
      document.getElementById('modal-create-user-story')?.classList.remove('show');
    } catch (error: any) {
      console.error('Error creating user story:', error);
      const errorMsg = error?.message || 'Unknown error';
      showToast(`Failed to create user story: ${errorMsg}`, 'red');
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'Critical': return 'bg-red-100 text-red-700 border-red-300';
      case 'High': return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'Medium': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'Low': return 'bg-green-100 text-green-700 border-green-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getPriorityExamples = () => [
    'As a new employee, I want an onboarding checklist, so that I can complete all required tasks',
    'As a manager, I want to view team progress, so that I can identify bottlenecks',
    'As a customer, I want to reset my password, so that I can access my account'
  ];

  return (
    <div className="modal-bg" id="modal-create-user-story">
      <div className="modal">
        <div className="modal-h">
          <div className="modal-title">Create User Story</div>
          <div className="modal-close" onClick={() => document.getElementById('modal-create-user-story')?.classList.remove('show')}>×</div>
        </div>
        <div className="modal-body">
          {!canCreateUserStory && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
              Only admins and project managers can create user stories. Please contact an admin.
            </div>
          )}

          {/* Format Instructions */}
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm font-semibold text-blue-800 mb-2">Required Format:</h4>
            <div className="text-sm text-blue-700 font-mono mb-2">
              "As a [user], I want [action], so that [value]"
            </div>
            <div className="text-xs text-blue-600">
              <div className="mb-1"><strong>Examples:</strong></div>
              {getPriorityExamples().map((example, index) => (
                <div key={index} className="mb-1">• {example}</div>
              ))}
            </div>
          </div>

          {/* User Story Title */}
          <div className="form-group">
            <label className="form-label">User Story Title *</label>
            <textarea
              className={`form-input ${!title && 'border-red-300'} ${!parsedStory.isValid && title && 'border-red-500'}`}
              placeholder="As a [user], I want [action], so that [value]"
              rows={3}
              value={title}
              onChange={e => setTitle(e.target.value)}
              disabled={!canCreateUserStory || isLoading}
            />
            {parsedStory.error && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                {parsedStory.error}
              </div>
            )}
            {parsedStory.isValid && (
              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                <div className="font-semibold">✓ Valid format detected:</div>
                <div><strong>User:</strong> {parsedStory.user}</div>
                <div><strong>Action:</strong> {parsedStory.action}</div>
                <div><strong>Value:</strong> {parsedStory.value}</div>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Additional Description</label>
            <textarea
              className="form-input"
              placeholder="Add any additional details, acceptance criteria, or notes..."
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              disabled={!canCreateUserStory || isLoading}
            />
          </div>

          {/* Priority */}
          <div className="form-group">
            <label className="form-label">Priority *</label>
            <select
              className="form-input form-select"
              value={priority}
              onChange={e => setPriority(e.target.value as Priority)}
              disabled={!canCreateUserStory || isLoading}
            >
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            <div className={`mt-2 p-2 rounded border text-sm ${getPriorityColor(priority)}`}>
              <strong>Priority: {priority}</strong> - This determines the story's importance and urgency
            </div>
          </div>

          {/* Estimate */}
          <div className="form-group">
            <label className="form-label">Estimate *</label>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <input
                  type="number"
                  className="form-input"
                  placeholder="Enter estimate"
                  min="1"
                  max="100"
                  value={estimate}
                  onChange={e => setEstimate(Math.max(1, parseInt(e.target.value) || 1))}
                  disabled={!canCreateUserStory || isLoading}
                />
              </div>
              <div className="text-sm text-slate-600">
                <div className="font-medium">Story Points</div>
                <div className="text-xs">1-100 points</div>
              </div>
            </div>
          </div>

          {/* Project Selection */}
          <div className="form-group">
            <label className="form-label">Project *</label>
            <select
              className="form-input form-select"
              value={selectedProjectId}
              onChange={e => setSelectedProjectId(e.target.value)}
              disabled={!canCreateUserStory || isLoading}
            >
              <option value="">Select a project...</option>
              {projects.map(project => {
                const program = programs.find(p => p.id === project.programId);
                return (
                  <option key={project.id} value={project.id}>
                    {project.name} ({program?.name || 'Unknown Program'})
                  </option>
                );
              })}
            </select>
            {projects.length === 0 && (
              <div className="text-xs text-amber-600 mt-1">
                No projects available. Please create a project first.
              </div>
            )}
          </div>

          <div className="divider"></div>
        </div>
        <div className="modal-foot">
          <button
            className="btn"
            onClick={() => document.getElementById('modal-create-user-story')?.classList.remove('show')}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleCreate}
            disabled={isLoading || !canCreateUserStory || !parsedStory.isValid || !selectedProjectId || estimate <= 0}
          >
            {isLoading ? 'Creating...' : 'Create User Story'}
          </button>
        </div>
      </div>
    </div>
  );
};
