import React, { useState } from 'react';
import { Plus, Calendar, Users, ChevronRight, MoreVertical } from 'lucide-react';
import { Program, Project, Status } from '../types/project';

interface ProgramManagerProps {
  programs: Program[];
  onCreateProgram: (program: Omit<Program, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onSelectProgram: (programId: string) => void;
  onSelectProject: (projectId: string) => void;
}

export const ProgramManager: React.FC<ProgramManagerProps> = ({
  programs,
  onCreateProgram,
  onSelectProgram,
  onSelectProject,
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProgramName, setNewProgramName] = useState('');
  const [newProgramDescription, setNewProgramDescription] = useState('');

  const handleCreateProgram = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProgramName.trim()) {
      onCreateProgram({
        name: newProgramName.trim(),
        description: newProgramDescription.trim() || undefined,
        projects: [],
      });
      setNewProgramName('');
      setNewProgramDescription('');
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

  const getProjectStats = (projects: Project[]) => {
    const total = projects.length;
    const completed = projects.filter(p => p.status === 'Completed').length;
    const inProgress = projects.filter(p => p.status === 'In Progress').length;
    const notStarted = projects.filter(p => p.status === 'Not Started').length;
    
    return { total, completed, inProgress, notStarted };
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Program Management</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Program
        </button>
      </div>

      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Create New Program</h2>
            <form onSubmit={handleCreateProgram}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Program Name
                </label>
                <input
                  type="text"
                  value={newProgramName}
                  onChange={(e) => setNewProgramName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., WorkPhelo ERP"
                  autoFocus
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={newProgramDescription}
                  onChange={(e) => setNewProgramDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Program description..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Program
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

      <div className="grid gap-6">
        {programs.map((program) => {
          const stats = getProjectStats(program.projects);
          
          return (
            <div
              key={program.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h2 
                      className="text-2xl font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                      onClick={() => onSelectProgram(program.id)}
                    >
                      {program.name}
                    </h2>
                    {program.description && (
                      <p className="text-gray-600 mt-2">{program.description}</p>
                    )}
                  </div>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <MoreVertical className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>{stats.total} Projects</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Created {program.createdAt.toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      stats.completed === stats.total ? 'Completed' : 
                      stats.inProgress > 0 ? 'In Progress' : 'Not Started'
                    )}`}>
                      {stats.completed === stats.total ? 'Completed' : 
                       stats.inProgress > 0 ? 'In Progress' : 'Not Started'}
                    </span>
                  </div>
                  <div className="flex gap-2 text-sm">
                    <span className="text-green-600">{stats.completed} completed</span>
                    <span className="text-blue-600">{stats.inProgress} in progress</span>
                    <span className="text-gray-600">{stats.notStarted} not started</span>
                  </div>
                </div>

                {program.projects.length > 0 && (
                  <div className="border-t pt-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Projects</h3>
                    <div className="space-y-2">
                      {program.projects.map((project) => (
                        <div
                          key={project.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                          onClick={() => onSelectProject(project.id)}
                        >
                          <div className="flex items-center gap-3">
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                            <div>
                              <div className="font-medium text-gray-900">{project.name}</div>
                              <div className="text-sm text-gray-600">
                                {project.startDate.toLocaleDateString()} - {project.endDate.toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                            {project.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {programs.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Users className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Programs Yet</h3>
            <p className="text-gray-600 mb-4">Create your first program to start managing projects</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Program
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
