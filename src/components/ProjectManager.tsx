import React, { useState } from 'react';
import { Plus, Calendar, Users, ChevronRight, MoreVertical, ArrowLeft, GanttChart } from 'lucide-react';
import { Project, Sprint, Status } from '../types/project';

interface ProjectManagerProps {
  project: Project;
  programName: string;
  onCreateSprint: (sprint: Omit<Sprint, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onSelectSprint: (sprintId: string) => void;
  onBack: () => void;
  onShowGantt: () => void;
}

export const ProjectManager: React.FC<ProjectManagerProps> = ({
  project,
  programName,
  onCreateSprint,
  onSelectSprint,
  onBack,
  onShowGantt,
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSprintName, setNewSprintName] = useState('');
  const [newSprintDescription, setNewSprintDescription] = useState('');
  const [newSprintStartDate, setNewSprintStartDate] = useState('');
  const [newSprintEndDate, setNewSprintEndDate] = useState('');

  const handleCreateSprint = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSprintName.trim() && newSprintStartDate && newSprintEndDate) {
      onCreateSprint({
        name: newSprintName.trim(),
        description: newSprintDescription.trim(),
        startDate: new Date(newSprintStartDate),
        endDate: new Date(newSprintEndDate),
        status: 'Not Started',
        epics: [],
        projectId: project.id,
        programId: project.programId,
      });
      setNewSprintName('');
      setNewSprintDescription('');
      setNewSprintStartDate('');
      setNewSprintEndDate('');
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

  const getSprintStats = (sprints: Sprint[]) => {
    const total = sprints.length;
    const completed = sprints.filter(s => s.status === 'Completed').length;
    const inProgress = sprints.filter(s => s.status === 'In Progress').length;
    const notStarted = sprints.filter(s => s.status === 'Not Started').length;
    
    return { total, completed, inProgress, notStarted };
  };

  const isSprintActive = (sprint: Sprint) => {
    const now = new Date();
    return sprint.startDate <= now && sprint.endDate >= now && sprint.status === 'In Progress';
  };

  const stats = getSprintStats(project.sprints);
  const activeSprint = project.sprints.find(isSprintActive);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <div className="text-sm text-gray-600">{programName}</div>
            <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onShowGantt}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <GanttChart className="w-5 h-5" />
            Gantt View
          </button>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Sprint
          </button>
        </div>
      </div>

      {project.description && (
        <p className="text-gray-600 mb-6">{project.description}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Timeline</span>
          </div>
          <div className="text-lg font-semibold text-gray-900">
            {project.startDate.toLocaleDateString()} - {project.endDate.toLocaleDateString()}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-blue-600"></div>
            </div>
            <span className="text-sm font-medium text-gray-700">Status</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
              {project.status}
            </span>
            {activeSprint && (
              <span className="text-sm text-gray-600">Active: {activeSprint.name}</span>
            )}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Sprints</span>
          </div>
          <div className="text-lg font-semibold text-gray-900">
            {stats.completed}/{stats.total} Completed
          </div>
          <div className="text-sm text-gray-600">
            {stats.inProgress} in progress, {stats.notStarted} not started
          </div>
        </div>
      </div>

      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Create New Sprint</h2>
            <form onSubmit={handleCreateSprint}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sprint Name
                </label>
                <input
                  type="text"
                  value={newSprintName}
                  onChange={(e) => setNewSprintName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Sprint 1"
                  autoFocus
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sprint Goal/Description
                </label>
                <textarea
                  value={newSprintDescription}
                  onChange={(e) => setNewSprintDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Sprint goal..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={newSprintStartDate}
                    onChange={(e) => setNewSprintStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={newSprintEndDate}
                    onChange={(e) => setNewSprintEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Sprint
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

      <div className="space-y-4">
        {project.sprints.map((sprint) => (
          <div
            key={sprint.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
          >
            <div
              className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => onSelectSprint(sprint.id)}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{sprint.name}</h3>
                    {isSprintActive(sprint) && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600">{sprint.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(sprint.status)}`}>
                    {sprint.status}
                  </span>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <MoreVertical className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{sprint.startDate.toLocaleDateString()} - {sprint.endDate.toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-gray-600"></div>
                  </div>
                  <span>{sprint.epics.length} Epics</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>
        ))}

        {project.sprints.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Calendar className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Sprints Yet</h3>
            <p className="text-gray-600 mb-4">Create your first sprint to start organizing work</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Sprint
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
