import React, { useState, useEffect } from 'react';
import { useAppContext } from '../store';
import { Plus, Calendar, Users, MessageSquare, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { Sprint, Epic, Project, UserStory } from '../types/project';
import { EpicKanbanBoard } from '../components/EpicKanbanBoard';
import { CreateUserStoryModal } from '../components/CreateUserStoryModal';
import { EditUserStoryModal } from '../components/EditUserStoryModal';

export const SprintBoard: React.FC = () => {
  const {
    currentUser,
    users,
    projects,
    sprints,
    epics,
    userStories,
    createSprint,
    createEpic,
    deleteSprint,
    deleteEpic,
    updateSprint,
    updateEpic,
    updateProject,
    addSprintComment,
    createUserStory,
    updateUserStory,
    deleteUserStory,
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
  const [showCreateUserStoryModal, setShowCreateUserStoryModal] = useState(false);
  const [editingUserStory, setEditingUserStory] = useState<UserStory | null>(null);
  const [showEditUserStoryModal, setShowEditUserStoryModal] = useState(false);

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

  // User Story handlers
  const handleCreateUserStory = () => {
    if (!selectedEpic) return;
    setShowCreateUserStoryModal(true);
  };

  const handleEditUserStory = (story: UserStory) => {
    setEditingUserStory(story);
    setShowEditUserStoryModal(true);
  };

  const handleDeleteUserStory = async (storyId: string) => {
    if (window.confirm('Are you sure you want to delete this user story?')) {
      try {
        await deleteUserStory(storyId);
        showToast('User story deleted successfully!', 'green');
      } catch (error) {
        showToast('Failed to delete user story', 'red');
      }
    }
  };

  const handleUpdateUserStory = async (storyId: string, updates: any) => {
    try {
      await updateUserStory(storyId, updates);
    } catch (error) {
      showToast('Failed to update user story', 'red');
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">Sprint Board</h1>
              <p className="text-gray-600">Manage your sprints, epics, and user stories</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-500">
                {selectedProject ? (
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Active Project: <span className="font-medium text-gray-700">{selectedProject.name}</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    No project selected
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Project Selection */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Select Project</label>
                <p className="text-sm text-gray-600">Choose a project to view and manage its sprints and epics</p>
              </div>
              {projects.length === 0 && (
                <div className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                  No projects available. Create a project first.
                </div>
              )}
            </div>
            <select
              value={selectedProject?.id || ''}
              onChange={(e) => {
                const project = projects.find(p => p.id === e.target.value);
                setSelectedProject(project || null);
                setSelectedSprint(null);
                setSelectedEpic(null);
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900"
            >
              <option value="">Choose a project...</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
          </div>
        </div>

        {selectedProject && (
          <>
            {/* Sprints Section */}
            <div className="mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">Sprints</h2>
                    <p className="text-sm text-gray-600">Manage your project sprints and timelines</p>
                  </div>
                  <button
                    onClick={() => setShowCreateSprintModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all transform hover:scale-105 shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Create Sprint
                  </button>
                </div>

                {projectSprints.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Calendar className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No sprints yet</h3>
                    <p className="text-gray-600 mb-4">Create your first sprint to start organizing your work</p>
                    <button
                      onClick={() => setShowCreateSprintModal(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Create First Sprint
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {projectSprints.map(sprint => (
                      <div
                        key={sprint.id}
                        className={`relative border-2 rounded-xl p-5 cursor-pointer transition-all transform hover:scale-102 ${selectedSprint?.id === sprint.id
                          ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-md bg-white'
                          }`}
                        onClick={() => {
                          setSelectedSprint(sprint);
                          setSelectedEpic(null);
                        }}
                      >
                        {selectedSprint?.id === sprint.id && (
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                        )}

                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-1">{sprint.name}</h3>
                            {sprint.description && (
                              <p className="text-sm text-gray-600 line-clamp-2">{sprint.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 ml-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditSprint(sprint);
                              }}
                              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Edit sprint"
                            >
                              <Edit2 className="w-4 h-4 text-gray-500" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSprint(sprint);
                              }}
                              className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete sprint"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Calendar className="w-3 h-3" />
                            <span>{sprint.startDate.toLocaleDateString()} - {sprint.endDate.toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <MessageSquare className="w-3 h-3" />
                              <span>{sprint.comments.length} comments</span>
                            </div>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${sprint.status === 'Completed' ? 'bg-green-100 text-green-700' :
                              sprint.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                              {sprint.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {selectedSprint && (
              <>
                {/* Epics Section */}
                <div className="mb-8">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900 mb-1">Epics in {selectedSprint.name}</h2>
                        <p className="text-sm text-gray-600">Organize your work into epics and user stories</p>
                      </div>
                      <button
                        onClick={() => setShowCreateEpicModal(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all transform hover:scale-105 shadow-sm"
                      >
                        <Plus className="w-4 h-4" />
                        Create Epic
                      </button>
                    </div>

                    {!selectedEpic && (
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-lg">💡</span>
                          </div>
                          <div>
                            <p className="text-sm text-blue-900 font-medium mb-1">Select an epic to get started</p>
                            <p className="text-sm text-blue-700">Choose an existing epic or create a new one to start adding user stories and track progress.</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {sprintEpics.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Users className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No epics yet</h3>
                        <p className="text-gray-600 mb-4">Create your first epic to start organizing user stories</p>
                        <button
                          onClick={() => setShowCreateEpicModal(true)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          Create First Epic
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {sprintEpics.map(epic => {
                          const epicStories = userStories.filter(story => story.epicId === epic.id);
                          const completedStories = epicStories.filter(story => story.status === 'Completed');
                          const progressPercentage = epicStories.length > 0 ? (completedStories.length / epicStories.length) * 100 : 0;

                          return (
                            <div
                              key={epic.id}
                              className={`relative border-2 rounded-xl p-5 cursor-pointer transition-all transform hover:scale-102 ${selectedEpic?.id === epic.id
                                ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg'
                                : 'border-gray-200 hover:border-gray-300 hover:shadow-md bg-white'
                                }`}
                              onClick={() => setSelectedEpic(epic)}
                            >
                              {selectedEpic?.id === epic.id && (
                                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                  <div className="w-2 h-2 bg-white rounded-full"></div>
                                </div>
                              )}

                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <h3 className="font-semibold text-gray-900 mb-1">{epic.name}</h3>
                                  {epic.description && (
                                    <p className="text-sm text-gray-600 line-clamp-2">{epic.description}</p>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 ml-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditEpic(epic);
                                    }}
                                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                                    title="Edit epic"
                                  >
                                    <Edit2 className="w-4 h-4 text-gray-500" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteEpic(epic);
                                    }}
                                    className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Delete epic"
                                  >
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                  </button>
                                </div>
                              </div>

                              {/* Progress indicator */}
                              {epicStories.length > 0 && (
                                <div className="mb-3">
                                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                                    <span>Progress</span>
                                    <span>{completedStories.length}/{epicStories.length}</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                      style={{ width: `${progressPercentage}%` }}
                                    ></div>
                                  </div>
                                </div>
                              )}

                              <div className="flex items-center justify-between">
                                <span className={`px-3 py-1 text-xs font-medium rounded-full ${epic.priority === 'Critical' ? 'bg-red-100 text-red-700' :
                                  epic.priority === 'High' ? 'bg-orange-100 text-orange-700' :
                                    epic.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                      'bg-green-100 text-green-700'
                                  }`}>
                                  {epic.priority}
                                </span>
                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                  <span>📋</span>
                                  <span>{epicStories.length} stories</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* User Stories Kanban Board - Show when epic is selected */}
                {selectedEpic && (
                  <div className="mb-8">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h2 className="text-xl font-bold text-gray-900 mb-1">User Stories for {selectedEpic.name}</h2>
                          <p className="text-sm text-gray-600">Manage your user stories with drag-and-drop or arrow navigation</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg">
                            💡 Drag stories or use arrows to move between columns
                          </div>
                          <button
                            onClick={handleCreateUserStory}
                            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all transform hover:scale-105 shadow-sm"
                          >
                            <Plus className="w-4 h-4" />
                            Add Story
                          </button>
                        </div>
                      </div>

                      <EpicKanbanBoard
                        epicId={selectedEpic.id}
                        userStories={userStories}
                        users={users}
                        onCreateUserStory={handleCreateUserStory}
                        onEditUserStory={handleEditUserStory}
                        onDeleteUserStory={handleDeleteUserStory}
                        onUpdateUserStory={handleUpdateUserStory}
                      />
                    </div>
                  </div>
                )}

              </>
            )}
          </>
        )}

        {/* Create Sprint Modal */}
        {showCreateSprintModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md transform transition-all">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Create Sprint</h2>
                <button
                  onClick={() => setShowCreateSprintModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <span className="text-gray-400 text-xl">×</span>
                </button>
              </div>
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

        {/* Create User Story Modal */}
        <CreateUserStoryModal
          isOpen={showCreateUserStoryModal && !!selectedEpic}
          onClose={() => setShowCreateUserStoryModal(false)}
          epicId={selectedEpic?.id}
          projectId={selectedProject?.id}
          programId={selectedProject?.programId}
        />

        {/* Edit User Story Modal */}
        <EditUserStoryModal
          isOpen={showEditUserStoryModal}
          onClose={() => setShowEditUserStoryModal(false)}
          userStory={editingUserStory}
          onUpdate={handleUpdateUserStory}
        />

      </div>
    </div>
  );
};
