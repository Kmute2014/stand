import React, { useState, useMemo } from 'react';
import { useAppContext } from '../store';
import {
  Plus, Calendar, Search, Filter, ChevronDown, ChevronUp,
  Users, Smile, AlertTriangle, Clock, TrendingUp, BarChart3,
  X, Eye, Download, RefreshCw, Edit, Trash2
} from 'lucide-react';
import { DatePreviewModal } from '../components/DatePreviewModal';
import { StandupResponse } from '../types';

export const Responses: React.FC = () => {
  const { responses, users, deleteResponse, setEditingResponse, setCurrentPage, currentUser } = useAppContext();

  // State management
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewDate, setPreviewDate] = useState<string>('');

  // Group responses by date
  const groupedResponses = useMemo(() => {
    const grouped: { [key: string]: StandupResponse[] } = {};

    responses.forEach(response => {
      if (!grouped[response.date]) {
        grouped[response.date] = [];
      }
      grouped[response.date].push(response);
    });

    // Sort dates in descending order (newest first)
    const sortedEntries = Object.entries(grouped).sort(([a], [b]) => {
      const dateA = new Date(a.split(' ').reverse().join(' '));
      const dateB = new Date(b.split(' ').reverse().join(' '));
      return dateB.getTime() - dateA.getTime();
    });

    return Object.fromEntries(sortedEntries) as { [key: string]: StandupResponse[] };
  }, [responses]);

  // Filter grouped responses
  const filteredGroupedResponses: { [key: string]: StandupResponse[] } = useMemo(() => {
    let filtered: { [key: string]: StandupResponse[] } = { ...groupedResponses };

    // Filter by date - convert date picker format to response format
    if (selectedDate) {
      const dateObj = new Date(selectedDate);
      const formattedDate = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      const entries = Object.entries(filtered).filter(([date]) => date === formattedDate);
      filtered = Object.fromEntries(entries) as { [key: string]: StandupResponse[] };
    }

    // Filter by search term and user
    Object.keys(filtered).forEach(date => {
      filtered[date] = filtered[date].filter(response => {
        const user = users.find(u => u.id === response.userId);
        const matchesSearch = !searchTerm ||
          user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          response.yesterday.toLowerCase().includes(searchTerm.toLowerCase()) ||
          response.today.toLowerCase().includes(searchTerm.toLowerCase()) ||
          response.blockers.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesUser = selectedUser === 'all' || response.userId === selectedUser;

        return matchesSearch && matchesUser;
      });
    });

    // Remove empty dates
    Object.keys(filtered).forEach(date => {
      if (filtered[date].length === 0) {
        delete filtered[date];
      }
    });

    return filtered;
  }, [groupedResponses, selectedDate, searchTerm, selectedUser, users]);

  // Calculate statistics for a date (excluding admin users)
  const getDateStats = (dateResponses: StandupResponse[]) => {
    // Filter out admin responses
    const nonAdminResponses = dateResponses.filter(response => {
      const user = users.find(u => u.id === response.userId);
      return user && user.role !== 'Admin';
    });

    const total = nonAdminResponses.length;
    const blockers = nonAdminResponses.filter(r => r.blockers.toLowerCase() !== 'no').length;
    const avgMood = total > 0 ? (nonAdminResponses.reduce((sum, r) => sum + r.mood.score, 0) / total).toFixed(1) : '0';
    const nonAdminUsers = users.filter(u => u.role !== 'Admin');
    const completionRate = nonAdminUsers.length > 0 ? Math.round((total / nonAdminUsers.length) * 100) : 0;

    return { total, blockers, avgMood, completionRate };
  };

  // Toggle date expansion
  const toggleDateExpansion = (date: string) => {
    const newExpanded = new Set(expandedDates);
    if (newExpanded.has(date)) {
      newExpanded.delete(date);
    } else {
      newExpanded.add(date);
    }
    setExpandedDates(newExpanded);
  };

  // Preview functionality
  const handleDatePreview = (date: string) => {
    setPreviewDate(date);
    setShowPreviewModal(true);
  };

  // Get filtered responses for preview modal
  const getFilteredResponsesForDate = (date: string) => {
    const allDateResponses = responses.filter(r => r.date === date);

    return allDateResponses.filter(response => {
      // Apply search filter
      const user = users.find(u => u.id === response.userId);
      const matchesSearch = !searchTerm ||
        user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        response.yesterday.toLowerCase().includes(searchTerm.toLowerCase()) ||
        response.today.toLowerCase().includes(searchTerm.toLowerCase()) ||
        response.blockers.toLowerCase().includes(searchTerm.toLowerCase());

      // Apply user filter
      const matchesUser = selectedUser === 'all' || response.userId === selectedUser;

      return matchesSearch && matchesUser;
    });
  };

  const closePreviewModal = () => {
    setShowPreviewModal(false);
    setPreviewDate('');
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedDate('');
    setSearchTerm('');
    setSelectedUser('all');
  };

  const hasActiveFilters = selectedDate || searchTerm || selectedUser !== 'all';

  return (
    <div className="page active">
      {/* Header */}
      <div className="ph">
        <div className="ph-row">
          <div>
            <div className="ph-title">Standup Responses</div>
            <div className="ph-sub">// {Object.keys(groupedResponses).length} days · {responses.length} total responses</div>
          </div>
          <div className="ph-actions">
            <button
              className="btn btn-sm btn-primary flex items-center gap-2"
              onClick={() => setEditingResponse({} as any)}
            >
              <Plus className="w-3.5 h-3.5" /> New StandUp Today
            </button>
            <button className="btn btn-sm flex items-center gap-2">
              <Download className="w-3.5 h-3.5" /> Export
            </button>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 shadow-sm">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search responses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg">
            <Calendar className="w-4 h-4 text-slate-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                const date = e.target.value;
                setSelectedDate(date);
              }}
              className="border-none outline-none text-sm"
            />
          </div>

          {/* User Filter */}
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Users</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Date Groups */}
      <div className="space-y-4">
        {Object.keys(filteredGroupedResponses).length === 0 ? (
          <div className="text-center py-20 bg-white border-2 border-dashed border-slate-300 rounded-xl">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-500 text-lg">No responses found</p>
            <p className="text-slate-400 text-sm mt-2">Try adjusting your filters or add a new response</p>
          </div>
        ) : (
          Object.entries(filteredGroupedResponses).map(([date, dateResponses]) => {
            const stats = getDateStats(dateResponses);
            const isExpanded = expandedDates.has(date);
            const isToday = date === new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

            return (
              <div key={date} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                {/* Date Header */}
                <div className="p-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => toggleDateExpansion(date)}
                        className="flex items-center gap-3 text-left hover:bg-slate-50 rounded-lg p-2 -m-2 transition-colors"
                      >
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                            {date}
                            {isToday && <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Today</span>}
                          </h3>
                          <p className="text-sm text-slate-600">{dateResponses.length} responses</p>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="text-lg font-bold text-slate-900">{stats.avgMood}</div>
                        <div className="text-xs text-slate-500">Avg Mood</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-slate-900">{stats.blockers}</div>
                        <div className="text-xs text-slate-500">Blockers</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-slate-900">{stats.completionRate}%</div>
                        <div className="text-xs text-slate-500">Completion</div>
                      </div>
                      <button
                        onClick={() => handleDatePreview(date)}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        Preview All
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="divide-y divide-slate-200">
                    {dateResponses.map(response => {
                      const user = users.find(u => u.id === response.userId);
                      if (!user) return null;

                      return (
                        <div key={response.id} className="p-4 hover:bg-slate-50 transition-colors">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${user.avatarColor}`}>
                                {user.initials}
                              </div>
                              <div>
                                <h4 className="font-medium text-slate-900">{user.name}</h4>
                                <p className="text-sm text-slate-500">{response.time}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{response.mood.emoji}</span>
                              <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-sm">
                                {response.mood.score}/5
                              </span>
                              {response.blockers.toLowerCase() !== 'no' && (
                                <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-sm font-medium">
                                  Blocker
                                </span>
                              )}
                              <button
                                onClick={() => setEditingResponse(response)}
                                className="flex items-center gap-1 px-2 py-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit response"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              {currentUser?.role === 'Admin' && (
                                <button
                                  onClick={() => { if (window.confirm('Delete this standup response?')) deleteResponse(response.id); }}
                                  className="flex items-center gap-1 px-2 py-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete response"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="p-3 bg-blue-50 rounded-lg">
                              <h5 className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">Yesterday</h5>
                              <p className="text-sm text-slate-700 line-clamp-3">{response.yesterday}</p>
                            </div>
                            <div className="p-3 bg-green-50 rounded-lg">
                              <h5 className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-1">Today</h5>
                              <p className="text-sm text-slate-700 line-clamp-3">{response.today}</p>
                            </div>
                            <div className={`p-3 rounded-lg ${response.blockers.toLowerCase() !== 'no' ? 'bg-red-50' : 'bg-slate-50'}`}>
                              <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${response.blockers.toLowerCase() !== 'no' ? 'text-red-700' : 'text-slate-700'}`}>
                                Blockers
                              </h5>
                              <p className={`text-sm line-clamp-3 ${response.blockers.toLowerCase() !== 'no' ? 'text-red-700 font-medium' : 'text-slate-700'}`}>
                                {response.blockers}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Date Preview Modal */}
      <DatePreviewModal
        isOpen={showPreviewModal}
        onClose={closePreviewModal}
        selectedDate={previewDate}
        responses={responses}
        users={users}
        filteredResponses={getFilteredResponsesForDate(previewDate)}
      />
    </div>
  );
};
