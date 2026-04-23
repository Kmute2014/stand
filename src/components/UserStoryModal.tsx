import React, { useState, useEffect } from 'react';
import { X, Plus, Calendar, User as UserIcon, Flag, MessageSquare, CheckSquare } from 'lucide-react';
import { UserStory, Subtask, Comment, Priority, Status, User } from '../types/project';
import { User as AppUser } from '../types';

interface UserStoryModalProps {
  userStory: UserStory | null;
  columnId: string;
  epicId: string;
  sprintId: string;
  projectId: string;
  programId: string;
  onCreate: (userStory: Omit<UserStory, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdate: (userStory: UserStory) => void;
  onCancel: () => void;
  appUsers: AppUser[];
}

export const UserStoryModal: React.FC<UserStoryModalProps> = ({
  userStory,
  columnId,
  epicId,
  sprintId,
  projectId,
  programId,
  onCreate,
  onUpdate,
  onCancel,
  appUsers,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'Medium' as Priority,
    status: 'Not Started' as Status,
    assignees: [] as User[],
    dueDate: '',
    subtasks: [] as Subtask[],
  });

  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newSubtaskAssignee, setNewSubtaskAssignee] = useState<User | null>(null);
  const [newSubtaskDueDate, setNewSubtaskDueDate] = useState('');
  const [newComment, setNewComment] = useState('');
  const [selectedSubtaskId, setSelectedSubtaskId] = useState<string | null>(null);

  useEffect(() => {
    if (userStory) {
      setFormData({
        title: userStory.title,
        description: userStory.description,
        priority: userStory.priority,
        status: userStory.status,
        assignees: userStory.assignees,
        dueDate: userStory.dueDate ? userStory.dueDate.toISOString().split('T')[0] : '',
        subtasks: userStory.subtasks,
      });
    }
  }, [userStory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const userStoryData = {
      ...formData,
      dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
      columnId,
      epicId,
      sprintId,
      projectId,
      programId,
    };

    if (userStory) {
      onUpdate({
        ...userStoryData,
        id: userStory.id,
        createdAt: userStory.createdAt,
        updatedAt: new Date(),
      } as UserStory);
    } else {
      onCreate(userStoryData);
    }
  };

  const handleAddSubtask = () => {
    if (newSubtaskTitle.trim()) {
      const newSubtask: Subtask = {
        id: `subtask-${Date.now()}`,
        title: newSubtaskTitle.trim(),
        completed: false,
        assignee: newSubtaskAssignee || undefined,
        dueDate: newSubtaskDueDate ? new Date(newSubtaskDueDate) : undefined,
        comments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setFormData({
        ...formData,
        subtasks: [...formData.subtasks, newSubtask],
      });
      setNewSubtaskTitle('');
      setNewSubtaskAssignee(null);
      setNewSubtaskDueDate('');
    }
  };

  const handleToggleSubtask = (subtaskId: string) => {
    setFormData({
      ...formData,
      subtasks: formData.subtasks.map(subtask =>
        subtask.id === subtaskId
          ? { ...subtask, completed: !subtask.completed, updatedAt: new Date() }
          : subtask
      ),
    });
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    setFormData({
      ...formData,
      subtasks: formData.subtasks.filter(subtask => subtask.id !== subtaskId),
    });
  };

  const handleAddComment = (subtaskId: string) => {
    if (newComment.trim()) {
      const comment: Comment = {
        id: `comment-${Date.now()}`,
        content: newComment.trim(),
        author: { id: 'current-user', name: 'Current User', email: 'user@example.com' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setFormData({
        ...formData,
        subtasks: formData.subtasks.map(subtask =>
          subtask.id === subtaskId
            ? { ...subtask, comments: [...subtask.comments, comment], updatedAt: new Date() }
            : subtask
        ),
      });
      setNewComment('');
      setSelectedSubtaskId(null);
    }
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'Critical':
        return 'bg-red-100 text-red-800';
      case 'High':
        return 'bg-orange-100 text-orange-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {userStory ? 'Edit User Story' : 'Create User Story'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="User story title..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="User story description..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as Status })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subtasks
              </label>
              <div className="space-y-2">
                <div className="grid grid-cols-1 gap-2">
                  <input
                    type="text"
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Add a subtask..."
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSubtask())}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={newSubtaskAssignee?.id || ''}
                      onChange={(e) => {
                        const selectedUser = appUsers.find(u => u.id === e.target.value);
                        if (selectedUser) {
                          const projectUser: User = {
                            id: selectedUser.id,
                            name: selectedUser.name,
                            email: selectedUser.email,
                          };
                          setNewSubtaskAssignee(projectUser);
                        } else {
                          setNewSubtaskAssignee(null);
                        }
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Assign to...</option>
                      {appUsers.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name} ({user.email})
                        </option>
                      ))}
                    </select>
                    <input
                      type="date"
                      value={newSubtaskDueDate}
                      onChange={(e) => setNewSubtaskDueDate(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Due date"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddSubtask}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Add Subtask
                  </button>
                </div>

                {formData.subtasks.map((subtask) => (
                  <div key={subtask.id} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="checkbox"
                          checked={subtask.completed}
                          onChange={() => handleToggleSubtask(subtask.id)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className={`font-medium ${subtask.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                          {subtask.title}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteSubtask(subtask.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    </div>

                    <div className="ml-6 space-y-1 text-sm">
                      {subtask.assignee && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <UserIcon className="w-4 h-4" />
                          <span>Assigned to: {subtask.assignee.name}</span>
                        </div>
                      )}
                      {subtask.dueDate && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>Due: {subtask.dueDate.toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    <div className="ml-6 space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MessageSquare className="w-4 h-4" />
                        <span>{subtask.comments.length} comments</span>
                      </div>

                      {subtask.comments.map((comment) => (
                        <div key={comment.id} className="bg-white rounded p-2 text-sm">
                          <div className="font-medium text-gray-900">{comment.author.name}</div>
                          <div className="text-gray-600">{comment.content}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {comment.createdAt.toLocaleDateString()}
                          </div>
                        </div>
                      ))}

                      {selectedSubtaskId === subtask.id ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Add a comment..."
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleAddComment(subtask.id)}
                            className="px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Add
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSubtaskId(null);
                              setNewComment('');
                            }}
                            className="px-2 py-1 text-sm bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSelectedSubtaskId(subtask.id)}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Add comment
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {userStory ? 'Update User Story' : 'Create User Story'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
