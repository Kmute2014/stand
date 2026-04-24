import React, { useState, useMemo } from 'react';
import { useAppContext } from '../store';
import { Target, Activity, Users, Calendar, Plus, Edit2, Trash2, ChevronDown, ChevronRight, MoreHorizontal, Search, Filter, Clock, UserCheck, TrendingUp, AlertCircle } from 'lucide-react';

export const ProjectsPage: React.FC = () => {
  const { programs, projects, users, currentUser, deleteProgram, deleteProject, epics, deleteEpic, userStories, deleteUserStory, showToast } = useAppContext();
  const [expandedPrograms, setExpandedPrograms] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'programs' | 'projects' | 'epics'>('programs');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const isAdmin = currentUser?.role === 'Admin';
  const canManagePrograms = currentUser?.role === 'Admin' || currentUser?.role === 'Project Manager/Scrum Master';

  const toggleProgramExpansion = (programId: string) => {
    setExpandedPrograms(prev => {
      const newSet = new Set(prev);
      if (newSet.has(programId)) {
        newSet.delete(programId);
      } else {
        newSet.add(programId);
      }
      return newSet;
    });
  };

  const getProjectsForProgram = (programId: string) => {
    return projects.filter(project => project.programId === programId);
  };

  const handleDeleteProgram = async (programId: string, programName: string) => {
    if (window.confirm(`Are you sure you want to delete "${programName}"? This will also delete all associated projects.`)) {
      try {
        await deleteProgram(programId);
        showToast('Program deleted successfully.', 'green');
      } catch (error) {
        showToast('Failed to delete program.', 'red');
      }
    }
  };

  const handleDeleteProject = async (projectId: string, projectName: string) => {
    if (window.confirm(`Are you sure you want to delete "${projectName}"?`)) {
      try {
        await deleteProject(projectId);
        showToast('Project deleted successfully.', 'green');
      } catch (error) {
        showToast('Failed to delete project.', 'red');
      }
    }
  };

  const handleDeleteEpic = async (epicId: string, epicName: string) => {
    if (window.confirm(`Are you sure you want to delete "${epicName}"?`)) {
      try {
        await deleteEpic(epicId);
        showToast('Epic deleted successfully.', 'green');
      } catch (error) {
        showToast('Failed to delete epic.', 'red');
      }
    }
  };

  const handleDeleteUserStory = async (userStoryId: string, userStoryTitle: string) => {
    if (window.confirm(`Are you sure you want to delete "${userStoryTitle}"?`)) {
      try {
        await deleteUserStory(userStoryId);
        showToast('User Story deleted successfully.', 'green');
      } catch (error) {
        showToast('Failed to delete user story.', 'red');
      }
    }
  };

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getProjectStatusColor = (status: string) => {
    switch (status) {
      case 'Product Backlog': return 'bg-gray-100 text-gray-700';
      case 'Refined Backlog': return 'bg-blue-100 text-blue-700';
      case 'In Progress': return 'bg-amber-100 text-amber-700';
      case 'Testing': return 'bg-purple-100 text-purple-700';
      case 'Completed': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getProjectStatusIcon = (status: string) => {
    switch (status) {
      case 'Product Backlog': return <Clock className="w-4 h-4" />;
      case 'Refined Backlog': return <Filter className="w-4 h-4" />;
      case 'In Progress': return <TrendingUp className="w-4 h-4" />;
      case 'Testing': return <AlertCircle className="w-4 h-4" />;
      case 'Completed': return <UserCheck className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  // Filter and search functionality
  const filteredPrograms = useMemo(() => {
    if (!programs) return [];
    return programs.filter(program =>
      program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      program.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [programs, searchTerm]);

  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    return projects.filter(project => {
      const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [projects, searchTerm, statusFilter]);

  const filteredEpics = useMemo(() => {
    if (!epics) return [];
    return epics.filter(epic => {
      const matchesSearch = epic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        epic.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPriority = statusFilter === 'all' || epic.priority === statusFilter;
      return matchesSearch && matchesPriority;
    });
  }, [epics, searchTerm, statusFilter]);

  const getFilterOptions = () => {
    if (activeTab === 'epics') {
      return [
        { value: 'all', label: 'All Priorities' },
        { value: 'Critical', label: 'Critical' },
        { value: 'High', label: 'High' },
        { value: 'Medium', label: 'Medium' },
        { value: 'Low', label: 'Low' },
      ];
    } else {
      return [
        { value: 'all', label: 'All Status' },
        { value: 'Product Backlog', label: 'Product Backlog' },
        { value: 'Refined Backlog', label: 'Refined Backlog' },
        { value: 'In Progress', label: 'In Progress' },
        { value: 'Testing', label: 'Testing' },
        { value: 'Completed', label: 'Completed' },
      ];
    }
  };

  return (
    <div className="page active">
      {/* Header */}
      <div className="ph">
        <div className="ph-row">
          <div>
            <div className="ph-title">Programs & Projects</div>
            <div className="ph-sub">Manage your strategic programs and operational projects</div>
          </div>
          <div className="flex gap-2">
            {canManagePrograms && (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => document.getElementById('modal-create-program')?.classList.add('show')}
              >
                <Plus className="w-4 h-4" />
                Create Program
              </button>
            )}
            {canManagePrograms && programs.length > 0 && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => document.getElementById('modal-create-project')?.classList.add('show')}
              >
                <Plus className="w-4 h-4" />
                Create Project
              </button>
            )}
            {canManagePrograms && projects.length > 0 && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => document.getElementById('modal-create-epic')?.classList.add('show')}
              >
                <Plus className="w-4 h-4" />
                Create Epic
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Programs</p>
              <p className="text-2xl font-bold">{programs?.length || 0}</p>
            </div>
            <Target className="w-8 h-8 text-blue-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Total Projects</p>
              <p className="text-2xl font-bold">{projects?.length || 0}</p>
            </div>
            <Activity className="w-8 h-8 text-purple-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Active Projects</p>
              <p className="text-2xl font-bold">{projects?.filter(p => p.status === 'In Progress').length || 0}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-4 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm">Team Members</p>
              <p className="text-2xl font-bold">{users?.length || 0}</p>
            </div>
            <Users className="w-8 h-8 text-amber-200" />
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search programs and projects..."
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="md:w-48">
            <select
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {getFilterOptions().map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
          <button
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'programs'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
              }`}
            onClick={() => setActiveTab('programs')}
          >
            <Target className="w-4 h-4" />
            Programs ({filteredPrograms.length})
          </button>
          <button
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'projects'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
              }`}
            onClick={() => setActiveTab('projects')}
          >
            <Activity className="w-4 h-4" />
            Projects ({filteredProjects.length})
          </button>
          <button
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'epics'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
              }`}
            onClick={() => setActiveTab('epics')}
          >
            <TrendingUp className="w-4 h-4" />
            Epics ({filteredEpics.length})
          </button>
        </div>
      </div>

      {/* Programs View */}
      {activeTab === 'programs' && (
        <div className="space-y-4">
          {filteredPrograms.length === 0 ? (
            <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No Programs Found</h3>
              <p className="text-slate-600 mb-6">
                {searchTerm ? 'Try adjusting your search terms' : 'Create your first strategic program to organize your projects'}
              </p>
              {canManagePrograms && !searchTerm && (
                <button
                  className="btn btn-primary"
                  onClick={() => document.getElementById('modal-create-program')?.classList.add('show')}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Program
                </button>
              )}
            </div>
          ) : (
            filteredPrograms.map(program => {
              const programProjects = getProjectsForProgram(program.id);
              const isExpanded = expandedPrograms.has(program.id);

              return (
                <div key={program.id} className="bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-3">
                          <button
                            onClick={() => toggleProgramExpansion(program.id)}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-5 h-5 text-slate-600" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-slate-600" />
                            )}
                          </button>
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-slate-900 mb-1">{program.name}</h3>
                            {program.description && (
                              <p className="text-slate-600">{program.description}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-6 text-sm text-slate-600 ml-12">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <Users className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-medium text-slate-900">Owner</div>
                              <div>{program.owner?.name || 'Unknown'}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                              <Activity className="w-4 h-4 text-purple-600" />
                            </div>
                            <div>
                              <div className="font-medium text-slate-900">Projects</div>
                              <div>{programProjects.length}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                              <Calendar className="w-4 h-4 text-green-600" />
                            </div>
                            <div>
                              <div className="font-medium text-slate-900">Created</div>
                              <div>{formatDate(program.createdAt)}</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {canManagePrograms && (
                        <div className="flex items-center gap-2 ml-4">
                          <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                            <Edit2 className="w-4 h-4 text-slate-600" />
                          </button>
                          <button
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                            onClick={() => handleDeleteProgram(program.id, program.name)}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Expanded Projects */}
                    {isExpanded && programProjects.length > 0 && (
                      <div className="mt-6 ml-12 space-y-3">
                        <div className="text-sm font-medium text-slate-700 mb-3">Projects in this Program</div>
                        {programProjects.map(project => (
                          <div key={project.id} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className={`p-1 rounded ${getProjectStatusColor(project.status)}`}>
                                    {getProjectStatusIcon(project.status)}
                                  </div>
                                  <h4 className="font-medium text-slate-900">{project.name}</h4>
                                </div>
                                {project.description && (
                                  <p className="text-sm text-slate-600 mb-2">{project.description}</p>
                                )}
                                <div className="flex items-center gap-4 text-xs text-slate-600">
                                  <span>Owner: {project.owner?.name || 'Unknown'}</span>
                                  <span>Team: {project.teamMembers?.length || 0} members</span>
                                  <span>{formatDate(project.startDate)} - {formatDate(project.endDate)}</span>
                                </div>
                              </div>
                              {canManagePrograms && (
                                <div className="flex items-center gap-2">
                                  <button className="p-1 hover:bg-slate-200 rounded transition-colors">
                                    <Edit2 className="w-3 h-3 text-slate-600" />
                                  </button>
                                  <button
                                    className="p-1 hover:bg-red-50 rounded transition-colors"
                                    onClick={() => handleDeleteProject(project.id, project.name)}
                                  >
                                    <Trash2 className="w-3 h-3 text-red-600" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        {programProjects.length === 0 && (
                          <div className="text-center py-6 text-slate-500">
                            <Activity className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                            <p>No projects in this program yet</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Projects View */}
      {activeTab === 'projects' && (
        <div className="space-y-4">
          {filteredProjects.length === 0 ? (
            <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No Projects Found</h3>
              <p className="text-slate-600 mb-6">
                {searchTerm ? 'Try adjusting your search terms or filters' :
                  programs.length === 0 ? 'Create a program first, then add projects to it' :
                    'Create your first project within a program to start managing work'}
              </p>
              {canManagePrograms && programs.length > 0 && !searchTerm && (
                <button
                  className="btn btn-primary"
                  onClick={() => document.getElementById('modal-create-project')?.classList.add('show')}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Project
                </button>
              )}
              {programs.length === 0 && !searchTerm && (
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    <strong>Note:</strong> You need to create a program first before creating projects.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredProjects.map(project => {
                const program = programs.find(p => p.id === project.programId);

                return (
                  <div key={project.id} className="bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-3">
                            <div className={`p-2 rounded-lg ${getProjectStatusColor(project.status)}`}>
                              {getProjectStatusIcon(project.status)}
                            </div>
                            <div className="flex-1">
                              <h3 className="text-xl font-semibold text-slate-900 mb-1">{project.name}</h3>
                              {project.description && (
                                <p className="text-slate-600">{project.description}</p>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ml-12">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Target className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <div className="text-xs text-slate-500">Program</div>
                                <div className="font-medium text-slate-900">{program?.name || 'Unknown'}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                <Users className="w-5 h-5 text-purple-600" />
                              </div>
                              <div>
                                <div className="text-xs text-slate-500">Owner</div>
                                <div className="font-medium text-slate-900">{project.owner?.name || 'Unknown'}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <UserCheck className="w-5 h-5 text-green-600" />
                              </div>
                              <div>
                                <div className="text-xs text-slate-500">Team</div>
                                <div className="font-medium text-slate-900">{project.teamMembers?.length || 0} members</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                                <Calendar className="w-5 h-5 text-amber-600" />
                              </div>
                              <div>
                                <div className="text-xs text-slate-500">Timeline</div>
                                <div className="font-medium text-slate-900 text-sm">
                                  {formatDate(project.startDate)} - {formatDate(project.endDate)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {canManagePrograms && (
                          <div className="flex items-center gap-2 ml-4">
                            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                              <Edit2 className="w-4 h-4 text-slate-600" />
                            </button>
                            <button
                              className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                              onClick={() => handleDeleteProject(project.id, project.name)}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Epics View */}
          {activeTab === 'epics' && (
            <div className="space-y-4">
              {filteredEpics.length === 0 ? (
                <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">No Epics Found</h3>
                  <p className="text-slate-600 mb-6">
                    {searchTerm ? 'Try adjusting your search terms or filters' :
                      projects.length === 0 ? 'Create a project first, then add epics to it' :
                        'Create your first epic to organize user stories within projects'}
                  </p>
                  {canManagePrograms && projects.length > 0 && !searchTerm && (
                    <button
                      className="btn btn-primary"
                      onClick={() => document.getElementById('modal-create-epic')?.classList.add('show')}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Epic
                    </button>
                  )}
                  {projects.length === 0 && !searchTerm && (
                    <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm text-amber-800">
                        <strong>Note:</strong> You need to create a project first before creating epics.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredEpics.map(epic => {
                    const project = projects.find(p => p.id === epic.projectId);
                    const program = programs.find(p => p.id === project?.programId);

                    const getPriorityColor = (priority: string) => {
                      switch (priority) {
                        case 'Critical': return 'bg-red-100 text-red-700 border-red-300';
                        case 'High': return 'bg-orange-100 text-orange-700 border-orange-300';
                        case 'Medium': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
                        case 'Low': return 'bg-green-100 text-green-700 border-green-300';
                        default: return 'bg-gray-100 text-gray-700 border-gray-300';
                      }
                    };

                    return (
                      <div key={epic.id} className="bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-4 mb-3">
                                <div className={`p-2 rounded-lg ${getPriorityColor(epic.priority)}`}>
                                  <TrendingUp className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                  <h3 className="text-xl font-semibold text-slate-900 mb-1">{epic.name}</h3>
                                  {epic.description && (
                                    <p className="text-slate-600">{epic.description}</p>
                                  )}
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ml-12">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <Target className="w-5 h-5 text-blue-600" />
                                  </div>
                                  <div>
                                    <div className="text-xs text-slate-500">Program</div>
                                    <div className="font-medium text-slate-900">{program?.name || 'Unknown'}</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <Activity className="w-5 h-5 text-purple-600" />
                                  </div>
                                  <div>
                                    <div className="text-xs text-slate-500">Project</div>
                                    <div className="font-medium text-slate-900">{project?.name || 'Unknown'}</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                    <AlertCircle className="w-5 h-5 text-orange-600" />
                                  </div>
                                  <div>
                                    <div className="text-xs text-slate-500">Priority</div>
                                    <div className="font-medium text-slate-900">{epic.priority}</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                    <Calendar className="w-5 h-5 text-green-600" />
                                  </div>
                                  <div>
                                    <div className="text-xs text-slate-500">Created</div>
                                    <div className="font-medium text-slate-900 text-sm">
                                      {formatDate(epic.createdAt)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* User Stories Section */}
                            <div className="mt-6 pt-6 border-t border-slate-200">
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                  <Users className="w-5 h-5 text-slate-600" />
                                  <h4 className="text-sm font-semibold text-slate-900">User Stories</h4>
                                  <span className="text-xs text-slate-500">
                                    ({userStories.filter(us => us.epicId === epic.id).length})
                                  </span>
                                </div>
                                {canManagePrograms && (
                                  <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => document.getElementById('modal-create-user-story')?.classList.add('show')}
                                  >
                                    <Plus className="w-4 h-4 mr-1" />
                                    Add Story
                                  </button>
                                )}
                              </div>

                              {/* User Stories List */}
                              <div className="space-y-2">
                                {userStories
                                  .filter(us => us.epicId === epic.id)
                                  .sort((a, b) => a.order - b.order)
                                  .map(userStory => {
                                    const getPriorityColor = (priority: string) => {
                                      switch (priority) {
                                        case 'Critical': return 'bg-red-100 text-red-700 border-red-300';
                                        case 'High': return 'bg-orange-100 text-orange-700 border-orange-300';
                                        case 'Medium': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
                                        case 'Low': return 'bg-green-100 text-green-700 border-green-300';
                                        default: return 'bg-gray-100 text-gray-700 border-gray-300';
                                      }
                                    };

                                    return (
                                      <div key={userStory.id} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                                        <div className="flex items-start justify-between">
                                          <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                              <span className={`px-2 py-1 rounded text-xs font-medium border ${getPriorityColor(userStory.priority)}`}>
                                                {userStory.priority}
                                              </span>
                                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                                {userStory.estimate} pts
                                              </span>
                                              <span className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-xs font-medium">
                                                {userStory.status}
                                              </span>
                                            </div>
                                            <div className="text-sm font-medium text-slate-900 mb-1">
                                              <strong>{userStory.user}</strong> wants <strong>{userStory.action}</strong>, so that <strong>{userStory.value}</strong>
                                            </div>
                                            {userStory.description && (
                                              <div className="text-xs text-slate-600 mt-1">
                                                {userStory.description}
                                              </div>
                                            )}
                                          </div>
                                          {canManagePrograms && (
                                            <div className="flex items-center gap-1 ml-2">
                                              <button className="p-1 hover:bg-slate-200 rounded transition-colors">
                                                <Edit2 className="w-3 h-3 text-slate-600" />
                                              </button>
                                              <button
                                                className="p-1 hover:bg-red-100 rounded transition-colors"
                                                onClick={() => handleDeleteUserStory(userStory.id, userStory.title)}
                                              >
                                                <Trash2 className="w-3 h-3 text-red-600" />
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}

                                {userStories.filter(us => us.epicId === epic.id).length === 0 && (
                                  <div className="text-center py-4 text-slate-500 text-sm">
                                    <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                    <div>No user stories yet</div>
                                    {canManagePrograms && (
                                      <div className="mt-2">
                                        <button
                                          className="btn btn-secondary btn-sm"
                                          onClick={() => document.getElementById('modal-create-user-story')?.classList.add('show')}
                                        >
                                          <Plus className="w-4 h-4 mr-1" />
                                          Create First User Story
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            {canManagePrograms && (
                              <div className="flex items-center gap-2 ml-4 mt-4">
                                <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                  <Edit2 className="w-4 h-4 text-slate-600" />
                                </button>
                                <button
                                  className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                  onClick={() => handleDeleteEpic(epic.id, epic.name)}
                                >
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
