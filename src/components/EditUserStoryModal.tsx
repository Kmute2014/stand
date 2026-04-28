import React, { useState, useEffect } from 'react';
import { useAppContext } from '../store';
import { Priority, Status, Task, UserStory } from '../types/project';
import { Trash2 } from 'lucide-react';

// Define the kanban status mapping
const KANBAN_STATUS_MAP = {
  'Backlog': 'Product Backlog' as Status,
  'To Do': 'Refined Backlog' as Status,
  'In Progress': 'In Progress' as Status,
  'Testing': 'Testing' as Status,
  'Done': 'Completed' as Status
};

const REVERSE_STATUS_MAP = {
  'Product Backlog': 'Backlog',
  'Refined Backlog': 'To Do',
  'In Progress': 'In Progress',
  'Testing': 'Testing',
  'Completed': 'Done'
};

interface EditUserStoryModalProps {
  userStory: UserStory | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (storyId: string, updates: Partial<UserStory>) => void;
}

export const EditUserStoryModal: React.FC<EditUserStoryModalProps> = ({
  userStory,
  isOpen,
  onClose,
  onUpdate
}) => {
  const { showToast, currentUser, projects, programs, users } = useAppContext();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [estimate, setEstimate] = useState<number>(1);
  const [status, setStatus] = useState<Status>('Product Backlog');
  const [isLoading, setIsLoading] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAssigneeId, setNewTaskAssigneeId] = useState('');
  const [newTaskEstimate, setNewTaskEstimate] = useState<number>(1);

  // Check if current user has permission to edit user stories
  const canEditUserStory = currentUser?.role === 'Admin' || currentUser?.role === 'Project Manager/Scrum Master';

  // Initialize form when userStory changes
  useEffect(() => {
    if (userStory) {
      setTitle(userStory.title);
      setDescription(userStory.description || '');
      setPriority(userStory.priority);
      setEstimate(userStory.estimate);
      setStatus(userStory.status);
      setTasks(userStory.tasks.map(task => ({
        ...task,
        id: task.id,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt
      })));
    }
  }, [userStory]);

  const handleUpdate = async () => {
    if (!canEditUserStory) {
      showToast('Only admins and project managers can edit user stories.', 'red');
      return;
    }

    if (!title.trim()) {
      showToast('User story title is required.', 'red');
      return;
    }

    if (!userStory) return;

    setIsLoading(true);
    try {
      await onUpdate(userStory.id, {
        title: title.trim(),
        description: description.trim(),
        priority,
        estimate,
        status,
        tasks: tasks.map(task => ({
          ...task,
          id: task.id || crypto.randomUUID(),
          createdAt: task.createdAt || new Date(),
          updatedAt: new Date(),
        })),
      });

      showToast('User Story updated successfully!', 'green');
      onClose();
    } catch (error: any) {
      console.error('Error updating user story:', error);
      const errorMsg = error?.message || 'Unknown error';
      showToast(`Failed to update user story: ${errorMsg}`, 'red');
    } finally {
      setIsLoading(false);
    }
  };

  // Task management functions
  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      setTasks([...tasks, {
        id: crypto.randomUUID(),
        title: newTaskTitle.trim(),
        status: 'Todo',
        assigneeId: newTaskAssigneeId || undefined,
        estimate: newTaskEstimate,
        createdAt: new Date(),
        updatedAt: new Date()
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

  const getStatusColor = (status: Status) => {
    switch (status) {
      case 'Product Backlog': return 'bg-gray-100 text-gray-700 border-gray-300';
      case 'Refined Backlog': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'In Progress': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'Testing': return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'Completed': return 'bg-green-100 text-green-700 border-green-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  if (!isOpen || !userStory) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Edit User Story</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>
        <div className="modal-body">
          {!canEditUserStory && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
              Only admins and project managers can edit user stories. Please contact an admin.
            </div>
          )}

          {/* User Story Title */}
          <div className="form-group mb-4">
            <label className="form-label">User Story Title *</label>
            <textarea
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 ${!title && 'border-red-300'}`}
              placeholder="Enter user story title..."
              rows={3}
              value={title}
              onChange={e => setTitle(e.target.value)}
              disabled={!canEditUserStory || isLoading}
            />
            {!title && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                User story title is required
              </div>
            )}
          </div>

          {/* Description */}
          <div className="form-group mb-4">
            <label className="form-label">Additional Description</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400"
              placeholder="Add any additional details, acceptance criteria, or notes..."
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              disabled={!canEditUserStory || isLoading}
            />
          </div>

          {/* Priority and Status */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="form-group">
              <label className="form-label">Priority *</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                disabled={!canEditUserStory || isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status *</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Status)}
                disabled={!canEditUserStory || isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400"
              >
                <option value="Product Backlog">Backlog</option>
                <option value="Refined Backlog">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="Testing">Testing</option>
                <option value="Completed">Done</option>
              </select>
            </div>
          </div>

          {/* Estimate */}
          <div className="form-group mb-4">
            <label className="form-label">Story Points *</label>
            <input
              type="number"
              min="1"
              max="20"
              value={estimate}
              onChange={(e) => setEstimate(parseInt(e.target.value) || 1)}
              disabled={!canEditUserStory || isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>

          {/* Tasks Section */}
          <div className="form-group mb-4">
            <label className="form-label">Tasks (Optional)</label>
            <div className="space-y-3">
              {/* Existing Tasks */}
              {tasks.map((task, index) => (
                <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="checkbox"
                      checked={task.status === 'Done'}
                      onChange={(e) => handleUpdateTask(index, 'status', e.target.checked ? 'Done' : 'Todo')}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      value={task.title}
                      onChange={(e) => handleUpdateTask(index, 'title', e.target.value)}
                      placeholder="Task title"
                      className={`flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400 ${task.status === 'Done' ? 'line-through text-gray-500' : 'text-gray-900'
                        }`}
                    />
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
            onClick={handleUpdate}
            disabled={isLoading || !canEditUserStory || !title.trim() || estimate <= 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Updating...' : 'Update User Story'}
          </button>
        </div>
      </div>
    </div>
  );
};
