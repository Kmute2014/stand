import React, { useState, useEffect } from 'react';
import { useAppContext } from '../store';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Priority, Status, Task } from '../types/project';
import { Trash2 } from 'lucide-react';


interface CreateUserStoryModalProps {
  epicId?: string;
  projectId?: string;
  programId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const CreateUserStoryModal: React.FC<CreateUserStoryModalProps> = ({
  epicId,
  projectId: defaultProjectId,
  programId: defaultProgramId,
  isOpen,
  onClose
}) => {
  const { showToast, currentUser, projects, programs, users, createUserStory } = useAppContext();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [estimate, setEstimate] = useState<number>(1);
  const [selectedProjectId, setSelectedProjectId] = useState(defaultProjectId || '');
  const [isLoading, setIsLoading] = useState(false);
  const [tasks, setTasks] = useState<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAssigneeId, setNewTaskAssigneeId] = useState('');
  const [newTaskEstimate, setNewTaskEstimate] = useState<number>(1);

  // Check if current user has permission to create user stories
  const canCreateUserStory = currentUser?.role === 'Admin' || currentUser?.role === 'Project Manager/Scrum Master';

  const handleCreate = async () => {
    if (!canCreateUserStory) {
      showToast('Only admins and project managers can create user stories.', 'red');
      return;
    }

    if (!title.trim()) {
      showToast('User story title is required.', 'red');
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
      const selectedProgram = programs.find(p => p.id === selectedProject?.programId) ||
        programs.find(p => p.id === defaultProgramId);

      if (!selectedProject || !selectedProgram) {
        showToast('Invalid project selection.', 'red');
        return;
      }

      // Create user story using context function
      await createUserStory({
        title: title.trim(),
        user: '', // Not parsing format anymore
        action: '', // Not parsing format anymore
        value: '', // Not parsing format anymore
        description: description.trim(),
        priority,
        estimate,
        status: 'Product Backlog' as Status, // Default status
        projectId: selectedProject.id,
        programId: selectedProgram.id,
        epicId,
        tasks: tasks.map(task => ({
          ...task,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
        order: 1, // Will be updated later when multiple stories exist
      });

      showToast('User Story created successfully!', 'green');

      // Reset form and close modal
      setTitle('');
      setDescription('');
      setPriority('Medium');
      setEstimate(1);
      setSelectedProjectId(defaultProjectId || '');
      setTasks([]);
      setNewTaskTitle('');
      setNewTaskAssigneeId('');
      setNewTaskEstimate(1);
      onClose();
    } catch (error: any) {
      console.error('Error creating user story:', error);
      const errorMsg = error?.message || 'Unknown error';
      showToast(`Failed to create user story: ${errorMsg}`, 'red');
    } finally {
      setIsLoading(false);
    }
  };

  // Task management functions
  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      setTasks([...tasks, {
        title: newTaskTitle.trim(),
        status: 'Todo',
        assigneeId: newTaskAssigneeId || undefined,
        estimate: newTaskEstimate
      }]);
      setNewTaskTitle('');
      setNewTaskAssigneeId('');
      setNewTaskEstimate(1);
    }
  };

  const handleRemoveTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const handleUpdateTask = (index: number, field: keyof Omit<Task, 'id' | 'createdAt' | 'updatedAt'>, value: any) => {
    const updatedTasks = [...tasks];
    updatedTasks[index] = { ...updatedTasks[index], [field]: value };
    setTasks(updatedTasks);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{epicId ? 'Create User Story for Epic' : 'Create User Story'}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>
        <div className="modal-body">
          {!canCreateUserStory && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
              Only admins and project managers can create user stories. Please contact an admin.
            </div>
          )}


          {/* User Story Title */}
          <div className="form-group">
            <label className="form-label">User Story Title *</label>
            <textarea
              className={`form-input ${!title && 'border-red-300'}`}
              placeholder="Enter user story title..."
              rows={3}
              value={title}
              onChange={e => setTitle(e.target.value)}
              disabled={!canCreateUserStory || isLoading}
            />
            {!title && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                User story title is required
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
          {!defaultProjectId && (
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
          )}

          {defaultProjectId && (
            <div className="form-group">
              <label className="form-label">Project</label>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                {projects.find(p => p.id === defaultProjectId)?.name || 'Selected Project'}
              </div>
            </div>
          )}

          {/* Tasks Section */}
          <div className="form-group">
            <label className="form-label">Tasks (Optional)</label>
            <div className="space-y-3">
              {/* Existing Tasks */}
              {tasks.map((task, index) => (
                <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={task.status === 'Done'}
                      onChange={(e) => handleUpdateTask(index, 'status', e.target.checked ? 'Done' : 'Todo')}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className={`text-sm ${task.status === 'Done' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                      {task.title}
                    </span>
                  </div>
                  <select
                    value={task.assigneeId || ''}
                    onChange={(e) => handleUpdateTask(index, 'assigneeId', e.target.value || undefined)}
                    className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
                  >
                    <option value="">Unassigned</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={task.estimate}
                    onChange={(e) => handleUpdateTask(index, 'estimate', parseInt(e.target.value) || 1)}
                    className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
                    placeholder="Est"
                  />
                  <button
                    onClick={() => handleRemoveTask(index)}
                    className="p-1 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {/* Add New Task */}
              <div className="flex items-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="New task title..."
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
                <select
                  value={newTaskAssigneeId}
                  onChange={(e) => setNewTaskAssigneeId(e.target.value)}
                  className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
                >
                  <option value="">Unassigned</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={newTaskEstimate}
                  onChange={(e) => setNewTaskEstimate(parseInt(e.target.value) || 1)}
                  className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
                  placeholder="Est"
                />
                <button
                  onClick={handleAddTask}
                  disabled={!newTaskTitle.trim()}
                  className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </div>
            </div>
            {tasks.length > 0 && (
              <div className="text-xs text-gray-500 mt-2">
                <div className="flex justify-between items-center">
                  <span>{tasks.length} task(s) added • Total estimate: {tasks.reduce((sum, task) => sum + (task.estimate || 0), 0)} points</span>
                  <span className="text-green-600 font-medium">
                    {tasks.filter(task => task.status === 'Done').length}/{tasks.length} completed
                  </span>
                </div>
                {tasks.length > 0 && (
                  <div className="mt-1">
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-green-500 h-1.5 rounded-full transition-all duration-200"
                        style={{ width: `${(tasks.filter(task => task.status === 'Done').length / tasks.length) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
        <div className="flex justify-end gap-3 mt-6 border-t pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={isLoading || !canCreateUserStory || !title.trim() || !selectedProjectId || estimate <= 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating...' : 'Create User Story'}
          </button>
        </div>
      </div>
    </div>
  );
};
