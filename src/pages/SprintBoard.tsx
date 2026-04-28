import React, { useState, useEffect } from 'react';
import { useAppContext } from '../store';
import { Plus, Calendar, Users, MessageSquare, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { Sprint, Epic, Project } from '../types/project';

export const SprintBoard: React.FC = () => {
  const {
    currentUser,
    projects,
    sprints,
    epics,
    createSprint,
    createEpic,
    deleteSprint,
    deleteEpic,
    updateSprint,
    updateEpic,
    updateProject,
    addSprintComment,
    showToast
  } = useAppContext();

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedSprint, setSelectedSprint] = useState<Sprint | null>(null);
  const [showCreateSprintModal, setShowCreateSprintModal] = useState(false);
  const [showCreateEpicModal, setShowCreateEpicModal] = useState(false);
  const [selectedEpic, setSelectedEpic] = useState<Epic | null>(null);
  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null);
  const [editingEpic, setEditingEpic] = useState<Epic | null>(null);
  const [newComment, setNewComment] = useState('');

  // Filter sprints by selected project
  const projectSprints = selectedProject
    ? sprints.filter(sprint => sprint.projectId === selectedProject.id)
    : [];

  // Filter epics by selected sprint
  const sprintEpics = selectedSprint
    ? epics.filter(epic => epic.sprintId === selectedSprint.id)
    : [];


  const handleCreateSprint = async (sprintData: Omit<Sprint, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!selectedProject) return;

    try {
      await createSprint({
        ...sprintData,
        projectId: selectedProject.id,
        programId: selectedProject.programId,
        epics: [],
        comments: []
      });
      showToast('Sprint created successfully!', 'green');
      setShowCreateSprintModal(false);
    } catch (error) {
      showToast('Failed to create sprint', 'red');
    }
  };

  const handleCreateEpic = async (epicData: Omit<Epic, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!selectedSprint) return;

    try {
      await createEpic({
        ...epicData,
        projectId: selectedProject?.id || '',
        programId: selectedProject?.programId || '',
        sprintId: selectedSprint.id
      });
      showToast('Epic created successfully!', 'green');
      setShowCreateEpicModal(false);
    } catch (error) {
      showToast('Failed to create epic', 'red');
    }
  };

  // Edit and delete handlers
  const handleEditSprint = (sprint: Sprint) => {
    setEditingSprint(sprint);
    setShowCreateSprintModal(true);
  };

  const handleDeleteSprint = async (sprint: Sprint) => {
    if (window.confirm(`Are you sure you want to delete "${sprint.name}"?`)) {
      try {
        await deleteSprint(sprint.id);
        showToast('Sprint deleted successfully!', 'green');
      } catch (error) {
        showToast('Failed to delete sprint', 'red');
      }
    }
  };

  const handleEditEpic = (epic: Epic) => {
    setEditingEpic(epic);
    setShowCreateEpicModal(true);
  };

  const handleDeleteEpic = async (epic: Epic) => {
    if (window.confirm(`Are you sure you want to delete "${epic.name}"?`)) {
      try {
        await deleteEpic(epic.id);
        showToast('Epic deleted successfully!', 'green');
      } catch (error) {
        showToast('Failed to delete epic', 'red');
      }
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedSprint || !currentUser) return;

    try {
      await addSprintComment(selectedSprint.id, {
        content: newComment.trim(),
        author: currentUser
      });
      setNewComment('');
      showToast('Comment added successfully!', 'green');
    } catch (error) {
      showToast('Failed to add comment', 'red');
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Sprint Board</h1>
        <p className="text-gray-600">Manage your sprints, epics, and user stories</p>
      </div>

      {/* Project Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Project</label>
        <select
          className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={selectedProject?.id || ''}
          onChange={(e) => {
            const project = projects.find(p => p.id === e.target.value);
            setSelectedProject(project || null);
            setSelectedSprint(null);
            setSelectedEpic(null);
          }}
        >
          <option value="">Choose a project...</option>
          {projects.map(project => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>

      {selectedProject && (
        <>
          {/* Sprints Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Sprints</h2>
              <button
                onClick={() => setShowCreateSprintModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Sprint
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projectSprints.map(sprint => (
                <div
                  key={sprint.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${selectedSprint?.id === sprint.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                    }`}
                  onClick={() => {
                    setSelectedSprint(sprint);
                    setSelectedEpic(null);
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{sprint.name}</h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditSprint(sprint);
                        }}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <Edit2 className="w-4 h-4 text-gray-500" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSprint(sprint);
                        }}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                  {sprint.description && (
                    <p className="text-sm text-gray-600 mb-2">{sprint.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {sprint.startDate.toLocaleDateString()} - {sprint.endDate.toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      {sprint.comments.length} comments
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedSprint && (
            <>
              {/* Epics Section */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Epics in {selectedSprint.name}</h2>
                  <button
                    onClick={() => setShowCreateEpicModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Create Epic
                  </button>
                </div>

                {!selectedEpic && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-blue-700">
                      <strong>💡 Tip:</strong> Select an epic or create a new one to start adding user stories.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sprintEpics.map(epic => (
                    <div
                      key={epic.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${selectedEpic?.id === epic.id
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                        }`}
                      onClick={() => setSelectedEpic(epic)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900">{epic.name}</h3>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditEpic(epic);
                            }}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <Edit2 className="w-4 h-4 text-gray-500" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteEpic(epic);
                            }}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </div>
                      {epic.description && (
                        <p className="text-sm text-gray-600 mb-2">{epic.description}</p>
                      )}
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="px-2 py-1 bg-gray-100 rounded">{epic.priority}</span>
                        <span>Epic</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </>
          )}
        </>
      )}

      {/* Create Sprint Modal */}
      {showCreateSprintModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Create Sprint</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleCreateSprint({
                name: formData.get('name') as string,
                description: formData.get('description') as string,
                startDate: new Date(formData.get('startDate') as string),
                endDate: new Date(formData.get('endDate') as string),
                status: 'Product Backlog',
                projectId: selectedProject.id,
                programId: selectedProject.programId,
                epics: [],
                comments: []
              });
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    name="name"
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    name="startDate"
                    type="date"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    name="endDate"
                    type="date"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateSprintModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Sprint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Epic Modal */}
      {showCreateEpicModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Create Epic</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleCreateEpic({
                name: formData.get('name') as string,
                description: formData.get('description') as string,
                priority: formData.get('priority') as 'Low' | 'Medium' | 'High' | 'Critical',
                status: 'Product Backlog',
                projectId: selectedProject.id,
                programId: selectedProject.programId,
                sprintId: selectedSprint.id
              });
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    name="name"
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    name="priority"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateEpicModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Create Epic
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
