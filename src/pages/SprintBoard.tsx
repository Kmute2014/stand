import React, { useState } from 'react';
import { useAppContext } from '../store';
import { Plus, Calendar, Users, Target, Clock } from 'lucide-react';

export const SprintBoard: React.FC = () => {
  const { currentUser, programs, projects } = useAppContext();
  const [selectedProject, setSelectedProject] = useState<string>('');

  const canManageSprints = currentUser?.role === 'Admin' || currentUser?.role === 'Project Manager/Scrum Master';

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Sprint Board</h1>
        <p className="text-gray-600">Manage and track sprint progress across projects</p>
      </div>

      {/* Project Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Project
        </label>
        <select
          className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
        >
          <option value="">Choose a project...</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>

      {/* Sprint Board Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {selectedProject ? (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {projects.find(p => p.id === selectedProject)?.name} - Sprint Board
              </h2>
              {canManageSprints && (
                <button className="btn btn-primary flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Create Sprint
                </button>
              )}
            </div>

            {/* Sprint Placeholder */}
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Sprints Yet</h3>
              <p className="text-gray-600 mb-6">
                Create your first sprint to start tracking progress
              </p>
              {canManageSprints && (
                <button className="btn btn-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Sprint
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a Project</h3>
            <p className="text-gray-600">
              Choose a project from the dropdown above to view its sprint board
            </p>
          </div>
        )}
      </div>

      {/* Sprint Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">0</div>
              <div className="text-sm text-gray-600">Active Sprints</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <Target className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">0</div>
              <div className="text-sm text-gray-600">Completed Sprints</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">0</div>
              <div className="text-sm text-gray-600">Team Members</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
