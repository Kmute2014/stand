import React, { useState } from 'react';
import { Plus, Calendar, Users, ChevronRight, MoreVertical, ArrowLeft, CheckCircle, AlertCircle, GanttChart } from 'lucide-react';
import { Sprint, Epic, UserStory, Status, SprintCompletionValidation, User } from '../types/project';
import { UserStoryManager } from './UserStoryManager';

interface SprintManagerProps {
  sprint: Sprint;
  projectName: string;
  programName: string;
  currentUser: User;
  onCreateEpic: (epic: Omit<Epic, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onSelectEpic: (epicId: string) => void;
  onBack: () => void;
  onShowGantt: () => void;
  onCompleteSprint: (sprintId: string) => SprintCompletionValidation;
  onCreateUserStory: (userStory: Omit<UserStory, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateUserStory: (userStory: UserStory) => void;
  onDeleteUserStory: (storyId: string) => void;
}

export const SprintManager: React.FC<SprintManagerProps> = ({
  sprint,
  projectName,
  programName,
  currentUser,
  onCreateEpic,
  onSelectEpic,
  onBack,
  onShowGantt,
  onCompleteSprint,
  onCreateUserStory,
  onUpdateUserStory,
  onDeleteUserStory,
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newEpicName, setNewEpicName] = useState('');
  const [newEpicDescription, setNewEpicDescription] = useState('');
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completionValidation, setCompletionValidation] = useState<SprintCompletionValidation | null>(null);
  const [selectedEpic, setSelectedEpic] = useState<Epic | null>(null);

  const handleCreateEpic = (e: React.FormEvent) => {
    e.preventDefault();
    if (newEpicName.trim()) {
      onCreateEpic({
        name: newEpicName.trim(),
        description: newEpicDescription.trim() || undefined,
        order: sprint.epics.length,
        columns: [
          {
            id: `col-${Date.now()}-1`,
            name: 'To Do',
            order: 0,
            epicId: '',
            sprintId: sprint.id,
            projectId: sprint.projectId,
            programId: sprint.programId,
            userStories: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: `col-${Date.now()}-2`,
            name: 'In Progress',
            order: 1,
            epicId: '',
            sprintId: sprint.id,
            projectId: sprint.projectId,
            programId: sprint.programId,
            userStories: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: `col-${Date.now()}-3`,
            name: 'Done',
            order: 2,
            epicId: '',
            sprintId: sprint.id,
            projectId: sprint.projectId,
            programId: sprint.programId,
            userStories: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        sprintId: sprint.id,
        projectId: sprint.projectId,
        programId: sprint.programId,
      });
      setNewEpicName('');
      setNewEpicDescription('');
      setShowCreateForm(false);
    }
  };

  const getStatusColor = (status: Status) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Not Started':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEpicStats = () => {
    const totalStories = sprint.epics.reduce((acc, epic) =>
      acc + epic.columns.reduce((colAcc, col) => colAcc + col.userStories.length, 0), 0);
    const completedStories = sprint.epics.reduce((acc, epic) =>
      acc + epic.columns.reduce((colAcc, col) =>
        colAcc + col.userStories.filter(story => story.status === 'Completed').length, 0), 0);
    const totalSubtasks = sprint.epics.reduce((acc, epic) =>
      acc + epic.columns.reduce((colAcc, col) =>
        colAcc + col.userStories.reduce((storyAcc, story) => storyAcc + story.subtasks.length, 0), 0), 0);
    const completedSubtasks = sprint.epics.reduce((acc, epic) =>
      acc + epic.columns.reduce((colAcc, col) =>
        colAcc + col.userStories.reduce((storyAcc, story) =>
          storyAcc + story.subtasks.filter(subtask => subtask.completed).length, 0), 0), 0);

    return { totalStories, completedStories, totalSubtasks, completedSubtasks };
  };

  const stats = getEpicStats();
  const progress = stats.totalStories > 0 ? (stats.completedStories / stats.totalStories) * 100 : 0;

  const handleCompleteSprint = () => {
    const validation = onCompleteSprint(sprint.id);
    setCompletionValidation(validation);
    if (validation.isValid) {
      setShowCompleteModal(false);
    }
  };

  const getAllUserStories = (): UserStory[] => {
    return sprint.epics.flatMap(epic =>
      epic.columns.flatMap(column => column.userStories)
    );
  };

  const handleCreateUserStoryForEpic = (userStory: Omit<UserStory, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (selectedEpic) {
      // Find the first column (To Do) of the selected epic
      const firstColumn = selectedEpic.columns.find(col => col.order === 0);
      if (firstColumn) {
        onCreateUserStory({
          ...userStory,
          columnId: firstColumn.id,
          epicId: selectedEpic.id,
          sprintId: sprint.id,
          projectId: sprint.projectId,
          programId: sprint.programId,
        });
      }
    }
  };

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <div className="text-sm text-gray-600">
              {programName} / {projectName} / {sprint.name}
            </div>
            <h1 className="text-3xl font-bold text-gray-900">{sprint.name}</h1>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Epic
          </button>
          <button
            onClick={onShowGantt}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <GanttChart className="w-5 h-5" />
            Gantt View
          </button>
        </div>
      </div>

      {sprint.description && (
        <p className="text-gray-600 mb-6">{sprint.description}</p>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{stats.totalStories}</div>
          <div className="text-sm text-gray-600">User Stories</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-green-600">{stats.completedStories}</div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{stats.totalSubtasks}</div>
          <div className="text-sm text-gray-600">Subtasks</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-green-600">{stats.completedSubtasks}</div>
          <div className="text-sm text-gray-600">Subtasks Done</div>
        </div>
      </div>

      {/* Sprint Progress */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Sprint Progress</span>
          <span className="text-sm text-gray-600">{progress.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center gap-6 text-sm text-gray-600 mt-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>{sprint.startDate.toLocaleDateString()} - {sprint.endDate.toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>{sprint.epics.length} Epics</span>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>{progress.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Epic Selection or User Story Management */}
      {selectedEpic ? (
        <div className="flex-1 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedEpic(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-gray-600" />
              </button>
              <h2 className="text-xl font-semibold text-gray-900">{selectedEpic.name}</h2>
              {selectedEpic.description && (
                <p className="text-sm text-gray-600">{selectedEpic.description}</p>
              )}
            </div>
            <button
              onClick={() => setShowCompleteModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <CheckCircle className="w-5 h-5" />
              Complete Sprint
            </button>
          </div>

          <UserStoryManager
            epicName={selectedEpic.name}
            userStories={getAllUserStories().filter(story => story.epicId === selectedEpic.id)}
            currentUser={currentUser}
            onCreateUserStory={handleCreateUserStoryForEpic}
            onUpdateUserStory={onUpdateUserStory}
            onDeleteUserStory={onDeleteUserStory}
          />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="grid gap-4">
            {sprint.epics.map((epic) => {
              const epicStories = getAllUserStories().filter(story => story.epicId === epic.id);
              const epicCompleted = epicStories.filter(story => story.status === 'Completed').length;
              const epicTotal = epicStories.length;

              return (
                <div
                  key={epic.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedEpic(epic)}
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{epic.name}</h3>
                        {epic.description && (
                          <p className="text-gray-600 mb-3">{epic.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center">
                              <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                            </div>
                            <span>{epicTotal} User Stories</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center">
                              <div className="w-2 h-2 rounded-full bg-green-600"></div>
                            </div>
                            <span>{epicCompleted} Completed</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(sprint.status)}`}>
                          {sprint.status}
                        </span>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>

                    {epicTotal > 0 && (
                      <div className="mt-4">
                        <div className="flex justify-between text-sm text-gray-600 mb-2">
                          <span>Epic Progress</span>
                          <span>{epicTotal > 0 ? Math.round((epicCompleted / epicTotal) * 100) : 0}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${epicTotal > 0 ? (epicCompleted / epicTotal) * 100 : 0}%`
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {sprint.epics.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <div className="w-16 h-16 mx-auto border-2 border-gray-300 border-dashed rounded-lg flex items-center justify-center">
                    <Plus className="w-8 h-8 text-gray-400" />
                  </div>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Epics Yet</h3>
                <p className="text-gray-600 mb-4">Create your first epic to start organizing user stories</p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Epic
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Epic Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Create New Epic</h2>
            <form onSubmit={handleCreateEpic}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Epic Name
                </label>
                <input
                  type="text"
                  value={newEpicName}
                  onChange={(e) => setNewEpicName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter epic name"
                  autoFocus
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={newEpicDescription}
                  onChange={(e) => setNewEpicDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter epic description"
                  rows={3}
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Epic
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Sprint Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Complete Sprint</h2>

            {completionValidation && !completionValidation.isValid && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="font-medium text-red-800">Cannot Complete Sprint</span>
                </div>
                <div className="text-sm text-red-700 space-y-1">
                  {completionValidation.errors.map((error, index) => (
                    <div key={index}>• {error}</div>
                  ))}
                </div>
              </div>
            )}

            {completionValidation && completionValidation.isValid && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-800">Sprint Ready for Completion</span>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleCompleteSprint}
                disabled={completionValidation && !completionValidation.isValid}
                className={`flex-1 px-4 py-2 rounded-lg transition-colors ${completionValidation && !completionValidation.isValid
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
              >
                Complete Sprint
              </button>
              <button
                onClick={() => setShowCompleteModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
