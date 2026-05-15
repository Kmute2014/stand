import React, { useState, useEffect } from 'react';
import { useAppContext } from '../store';
import { Ticket, Plus, Search, Filter, MoreVertical, Edit2, Trash2, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';
import { jiraService } from '../services/jiraService';

interface JiraIssue {
  id: string;
  key: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  assignee: string;
  type: string;
  created: string;
}

export const JiraPage: React.FC = () => {
  const { currentUser, showToast } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [issues, setIssues] = useState<JiraIssue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);
  const [selectedProject, setSelectedProject] = useState('');
  const [projects, setProjects] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkConfiguration();
  }, []);

  const checkConfiguration = () => {
    const baseUrl = (import.meta as any).env.VITE_JIRA_BASE_URL;
    const email = (import.meta as any).env.VITE_JIRA_EMAIL;
    const apiToken = (import.meta as any).env.VITE_JIRA_API_TOKEN;

    if (baseUrl && email && apiToken) {
      setIsConfigured(true);
      jiraService.configure({
        baseUrl,
        email,
        apiToken,
      });
      loadProjects();
    } else {
      setIsConfigured(false);
      setIsLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      const projectList = await jiraService.getProjects();
      setProjects(projectList);
      if (projectList.length > 0) {
        setSelectedProject(projectList[0].key);
        loadIssues(projectList[0].key);
      }
    } catch (err) {
      setError('Failed to load JIRA projects');
      setIsLoading(false);
    }
  };

  const loadIssues = async (projectKey: string) => {
    if (!isConfigured) return;

    setIsLoading(true);
    setError(null);
    try {
      const jql = `project = ${projectKey} ORDER BY created DESC`;
      const jiraIssues = await jiraService.getIssues(jql);

      const formattedIssues: JiraIssue[] = jiraIssues.map(issue => ({
        id: issue.id,
        key: issue.key,
        title: issue.fields.summary,
        description: issue.fields.description?.content?.[0]?.content?.[0]?.text || '',
        status: issue.fields.status.name,
        priority: issue.fields.priority.name,
        assignee: issue.fields.assignee?.displayName || 'Unassigned',
        type: issue.fields.issuetype.name,
        created: new Date(issue.fields.created).toLocaleDateString(),
      }));

      setIssues(formattedIssues);
    } catch (err: any) {
      setError(err.message || 'Failed to load JIRA issues');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedProject && isConfigured) {
      loadIssues(selectedProject);
    }
  }, [selectedProject]);

  const filteredIssues = issues.filter(issue => {
    const matchesSearch = issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || issue.status === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'To Do': return 'bg-gray-100 text-gray-700';
      case 'In Progress': return 'bg-blue-100 text-blue-700';
      case 'Done': return 'bg-green-100 text-green-700';
      case 'Backlog': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'bg-red-100 text-red-700';
      case 'High': return 'bg-orange-100 text-orange-700';
      case 'Medium': return 'bg-yellow-100 text-yellow-700';
      case 'Low': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleCreateIssue = () => {
    setShowCreateModal(true);
  };

  const handleCreateIssueSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedProject) {
      showToast('Please select a project first', 'red');
      return;
    }

    const formData = new FormData(e.currentTarget);
    try {
      await jiraService.createIssue(selectedProject, {
        summary: formData.get('title') as string,
        description: formData.get('description') as string,
        priority: formData.get('priority') as string,
        issuetype: formData.get('type') as string,
      });
      setShowCreateModal(false);
      showToast('Issue created successfully in JIRA!', 'green');
      loadIssues(selectedProject);
    } catch (err: any) {
      showToast('Failed to create issue: ' + (err.message || 'Unknown error'), 'red');
    }
  };

  const handleDeleteIssue = async (issueKey: string) => {
    if (window.confirm('Are you sure you want to delete this issue from JIRA?')) {
      try {
        await jiraService.deleteIssue(issueKey);
        setIssues(issues.filter(issue => issue.key !== issueKey));
        showToast('Issue deleted successfully from JIRA!', 'green');
      } catch (err: any) {
        showToast('Failed to delete issue: ' + (err.message || 'Unknown error'), 'red');
      }
    }
  };

  const handleRefresh = () => {
    if (selectedProject) {
      loadIssues(selectedProject);
    }
  };

  const handleViewInJira = (issueKey: string) => {
    const baseUrl = (import.meta as any).env.VITE_JIRA_BASE_URL;
    if (baseUrl) {
      window.open(`${baseUrl}/browse/${issueKey}`, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">JIRA Integration</h1>
              <p className="text-gray-600">Manage your JIRA issues and track progress</p>
            </div>
            <div className="flex items-center gap-3">
              {isConfigured && (
                <button
                  onClick={handleRefresh}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
                  disabled={isLoading}
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              )}
              <button
                onClick={handleCreateIssue}
                disabled={!isConfigured || isLoading}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all transform hover:scale-105 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                Create Issue
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Configuration Warning */}
      {!isConfigured && (
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-amber-900 mb-2">JIRA Not Configured</h3>
                <p className="text-amber-800 mb-4">
                  To use JIRA integration, you need to configure your JIRA credentials in the environment variables:
                </p>
                <ul className="list-disc list-inside text-amber-800 space-y-1 text-sm">
                  <li><code className="bg-amber-100 px-1 rounded">VITE_JIRA_BASE_URL</code> - Your JIRA instance URL</li>
                  <li><code className="bg-amber-100 px-1 rounded">VITE_JIRA_EMAIL</code> - Your JIRA email</li>
                  <li><code className="bg-amber-100 px-1 rounded">VITE_JIRA_API_TOKEN</code> - Your JIRA API token</li>
                </ul>
                <p className="text-amber-800 mt-4 text-sm">
                  Generate an API token at: <a href="https://id.atlassian.com/manage-profile/security/api-tokens" target="_blank" rel="noopener noreferrer" className="underline">https://id.atlassian.com/manage-profile/security/api-tokens</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      {isConfigured && (
        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* Project Selector */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Project</label>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {projects.map(project => (
                    <option key={project.key} value={project.key}>{project.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search issues..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="To Do">To Do</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Done">Done</option>
                  <option value="Backlog">Backlog</option>
                </select>
              </div>
            </div>
          </div>

          {/* Issues List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Issues</h2>
                <span className="text-sm text-gray-500">{filteredIssues.length} issues</span>
              </div>

              {filteredIssues.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Ticket className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No issues found</h3>
                  <p className="text-gray-600 mb-4">Create your first issue to get started</p>
                  <button
                    onClick={handleCreateIssue}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Create First Issue
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredIssues.map((issue) => (
                    <div
                      key={issue.id}
                      className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-sm font-medium text-blue-600">{issue.id}</span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(issue.status)}`}>
                              {issue.status}
                            </span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(issue.priority)}`}>
                              {issue.priority}
                            </span>
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                              {issue.type}
                            </span>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{issue.title}</h3>
                          <p className="text-sm text-gray-600 mb-3">{issue.description}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>Assignee: {issue.assignee}</span>
                            <span>Created: {issue.created}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="View in JIRA"
                          >
                            <ExternalLink className="w-4 h-4 text-gray-500" />
                          </button>
                          <button
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4 text-gray-500" />
                          </button>
                          <button
                            onClick={() => handleDeleteIssue(issue.id)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Issue Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md transform transition-all">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Create JIRA Issue</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="text-gray-400 text-xl">×</span>
              </button>
            </div>
            <form onSubmit={handleCreateIssueSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    name="title"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    name="priority"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    name="type"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Story">Story</option>
                    <option value="Bug">Bug</option>
                    <option value="Task">Task</option>
                    <option value="Epic">Epic</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Issue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
