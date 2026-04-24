import React, { useState, useEffect } from 'react';
import { useAppContext } from '../store';
import {
  CheckCircle2, CircleDashed, AlertTriangle, Smile, TrendingUp,
  Activity, Users, Target, Clock, BarChart3, PieChart, ArrowUp,
  ArrowDown, MoreHorizontal, Calendar, Filter, RefreshCw
} from 'lucide-react';
import { UserStory, Status, Priority, Epic, Sprint } from '../types/project';

export const Dashboard: React.FC = () => {
  const { currentUser, responses, users, programs, sendReminders } = useAppContext();
  const isAdmin = currentUser?.role === 'Admin';
  const canCreateProgram = currentUser?.role === 'Admin' || currentUser?.role === 'Project Manager/Scrum Master';

  // Mock project data - in real app this would come from props or context
  const [mockUserStories] = useState<UserStory[]>([
    { id: '1', title: 'User Authentication', status: 'Completed', priority: 'High', assignees: [], subtasks: [], createdAt: new Date(), updatedAt: new Date() },
    { id: '2', title: 'Dashboard UI', status: 'In Progress', priority: 'Medium', assignees: [], subtasks: [], createdAt: new Date(), updatedAt: new Date() },
    { id: '3', title: 'API Integration', status: 'Refined Backlog', priority: 'Critical', assignees: [], subtasks: [], createdAt: new Date(), updatedAt: new Date() },
    { id: '4', title: 'Testing Framework', status: 'Testing', priority: 'Low', assignees: [], subtasks: [], createdAt: new Date(), updatedAt: new Date() },
    { id: '5', title: 'Documentation', status: 'Product Backlog', priority: 'Medium', assignees: [], subtasks: [], createdAt: new Date(), updatedAt: new Date() },
  ]);

  const [mockEpics] = useState<Epic[]>([
    { id: '1', name: 'Authentication System', description: 'User login and security', order: 1, columns: [], createdAt: new Date(), updatedAt: new Date() },
    { id: '2', name: 'Dashboard Development', description: 'Main dashboard features', order: 2, columns: [], createdAt: new Date(), updatedAt: new Date() },
  ]);

  const [mockSprints] = useState<Sprint[]>([
    { id: '1', name: 'Sprint 1', startDate: new Date(), endDate: new Date(), epics: [], createdAt: new Date(), updatedAt: new Date() },
  ]);

  // Calculate program-level metrics
  const getTotalProjects = () => {
    return programs.reduce((total, program) => total + (program.projects?.length || 0), 0);
  };

  const getActiveSprints = () => {
    // This would be calculated from actual sprint data when projects are implemented
    // For now, return a mock value based on programs
    return programs.length > 0 ? programs.length * 2 : 0;
  };

  const getOverallCompletion = () => {
    // This would be calculated from actual project completion data
    // For now, return a mock completion rate
    return programs.length > 0 ? 65 : 0;
  };

  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const pendingUsers = users.filter(u => u.status === 'Active' && !u.lastStandup?.includes('Today'));
  const activeBlockers = responses.filter(r => r.blockers.toLowerCase() !== 'no' && r.date === today);

  // Calculate average mood
  const moodSum = responses.reduce((acc, curr) => acc + curr.mood.score, 0);
  const avgMood = responses.length > 0 ? (moodSum / responses.length).toFixed(1) : '—';

  // Project Management Metrics
  const getStatusCounts = () => {
    const counts = {
      completed: mockUserStories.filter(s => s.status === 'Completed').length,
      inProgress: mockUserStories.filter(s => s.status === 'In Progress').length,
      refined: mockUserStories.filter(s => s.status === 'Refined Backlog').length,
      testing: mockUserStories.filter(s => s.status === 'Testing').length,
      productBacklog: mockUserStories.filter(s => s.status === 'Product Backlog').length,
    };
    return counts;
  };

  const getPriorityBreakdown = () => {
    const breakdown = {
      critical: mockUserStories.filter(s => s.priority === 'Critical').length,
      high: mockUserStories.filter(s => s.priority === 'High').length,
      medium: mockUserStories.filter(s => s.priority === 'Medium').length,
      low: mockUserStories.filter(s => s.priority === 'Low').length,
    };
    return breakdown;
  };

  const getCompletionRate = () => {
    const total = mockUserStories.length;
    const completed = mockUserStories.filter(s => s.status === 'Completed').length;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const getRecentActivities = () => {
    // Mock recent activities - in real app this would come from actual activity logs
    return [
      { id: '1', type: 'standup', user: 'John Doe', action: 'Submitted daily standup', time: '2 hours ago', icon: <CheckCircle2 className="w-4 h-4" /> },
      { id: '2', type: 'blocker', user: 'Jane Smith', action: 'Reported blocker: API timeout issues', time: '3 hours ago', icon: <AlertTriangle className="w-4 h-4" /> },
      { id: '3', type: 'task', user: 'Mike Johnson', action: 'Moved "User Authentication" to Completed', time: '5 hours ago', icon: <Target className="w-4 h-4" /> },
      { id: '4', type: 'standup', user: 'Sarah Williams', action: 'Submitted daily standup', time: '6 hours ago', icon: <CheckCircle2 className="w-4 h-4" /> },
    ];
  };

  const statusCounts = getStatusCounts();
  const priorityBreakdown = getPriorityBreakdown();
  const completionRate = getCompletionRate();
  const recentActivities = getRecentActivities();

  return (
    <div className="page active">
      <div className="ph">
        <div className="ph-row">
          <div>
            <div className="ph-title">Good morning, {currentUser?.name.split(' ')[0] || 'User'}.</div>
            <div className="ph-sub">// Program Overview · {programs.length} programs · {getTotalProjects()} total projects · {getOverallCompletion()}% completion rate</div>
          </div>
          <div className="flex gap-2">
            {canCreateProgram && (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => document.getElementById('modal-create-program')?.classList.add('show')}
              >
                <Target className="w-4 h-4" />
                Create Program
              </button>
            )}
            {canCreateProgram && programs.length > 0 && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => document.getElementById('modal-create-project')?.classList.add('show')}
              >
                <Activity className="w-4 h-4" />
                Create Project
              </button>
            )}
            <button className="btn btn-ghost btn-sm">
              <Calendar className="w-4 h-4" />
              Today
            </button>
            <button className="btn btn-ghost btn-sm">
              <Filter className="w-4 h-4" />
              Filter
            </button>
            <button className="btn btn-ghost btn-sm">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Top Stats Row - Program Level Metrics */}
      <div className="grid grid-cols-4 gap-6 mb-6">
        <div className="card relative overflow-hidden p-6 border-b-[3px] border-b-blue-600">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mb-4">
            <Target className="w-[20px] h-[20px] text-blue-600" />
          </div>
          <div className="text-4xl font-bold text-slate-800 leading-none mb-2 tracking-tight">{programs.length}</div>
          <div className="text-sm text-slate-600 font-medium">Total Programs</div>
          <div className="text-xs text-slate-400 mt-1">strategic initiatives</div>
        </div>
        <div className="card relative overflow-hidden p-6 border-b-[3px] border-b-amber-500">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center mb-4">
            <Activity className="w-[20px] h-[20px] text-amber-500" />
          </div>
          <div className="text-4xl font-bold text-slate-800 leading-none mb-2 tracking-tight">{getTotalProjects()}</div>
          <div className="text-sm text-slate-600 font-medium">Total Projects</div>
          <div className="text-xs text-slate-400 mt-1">across all programs</div>
        </div>
        <div className="card relative overflow-hidden p-6 border-b-[3px] border-b-purple-500">
          <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center mb-4">
            <Clock className="w-[20px] h-[20px] text-purple-500" />
          </div>
          <div className="text-4xl font-bold text-slate-800 leading-none mb-2 tracking-tight">{getActiveSprints()}</div>
          <div className="text-sm text-slate-600 font-medium">Active Sprints</div>
          <div className="text-xs text-slate-400 mt-1">currently in progress</div>
        </div>
        <div className="card relative overflow-hidden p-6 border-b-[3px] border-b-green-500">
          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center mb-4">
            <TrendingUp className="w-[20px] h-[20px] text-green-500" />
          </div>
          <div className="text-4xl font-bold text-slate-800 leading-none mb-2 tracking-tight">{getOverallCompletion()}%</div>
          <div className="text-sm text-slate-600 font-medium">Overall Completion</div>
          <div className="text-xs text-green-600 font-medium mt-1">↑ 5% from last week</div>
        </div>
      </div>

      {/* Second Row - Priority Breakdown & Recent Activity */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Priority Breakdown */}
        <div className="card">
          <div className="card-h">
            <span className="card-title">
              <BarChart3 className="w-4 h-4 text-[var(--text-3)]" />
              Priority Breakdown
            </span>
            <button className="btn btn-ghost btn-sm">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-sm font-medium">Critical</span>
                </div>
                <span className="text-lg font-bold">{priorityBreakdown.critical}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <span className="text-sm font-medium">High</span>
                </div>
                <span className="text-lg font-bold">{priorityBreakdown.high}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-sm font-medium">Medium</span>
                </div>
                <span className="text-lg font-bold">{priorityBreakdown.medium}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm font-medium">Low</span>
                </div>
                <span className="text-lg font-bold">{priorityBreakdown.low}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card col-span-2">
          <div className="card-h">
            <span className="card-title">
              <Clock className="w-4 h-4 text-[var(--text-3)]" />
              Recent Activity
            </span>
            <span className="badge b-neutral">Last 24 hours</span>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-blue-600">
                    {activity.icon}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{activity.user}</div>
                    <div className="text-xs text-slate-600">{activity.action}</div>
                  </div>
                  <span className="text-xs text-slate-400">{activity.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Third Row - Epic & Sprint Progress */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Epic Progress */}
        <div className="card">
          <div className="card-h">
            <span className="card-title">
              <Target className="w-4 h-4 text-[var(--text-3)]" />
              Epic Progress
            </span>
            <button className="btn btn-sm btn-primary">View All</button>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {mockEpics.map((epic) => (
                <div key={epic.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{epic.name}</h4>
                    <span className="text-sm text-slate-600">75%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">{epic.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sprint Progress */}
        <div className="card">
          <div className="card-h">
            <span className="card-title">
              <Clock className="w-4 h-4 text-[var(--text-3)]" />
              Sprint Progress
            </span>
            <span className="badge b-green">Active</span>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {mockSprints.map((sprint) => (
                <div key={sprint.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{sprint.name}</h4>
                    <span className="text-sm text-slate-600">60%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '60%' }}></div>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 mt-2">
                    <span>Started: {sprint.startDate.toLocaleDateString()}</span>
                    <span>Ends: {sprint.endDate.toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row - Task Distribution & Standup Stats */}
      <div className="grid grid-cols-3 gap-6">
        {/* Task Distribution */}
        <div className="card">
          <div className="card-h">
            <span className="card-title">
              <PieChart className="w-4 h-4 text-[var(--text-3)]" />
              Task Distribution
            </span>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Product Backlog</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-slate-200 rounded-full h-2">
                    <div className="bg-gray-500 h-2 rounded-full" style={{ width: `${(statusCounts.productBacklog / mockUserStories.length) * 100}%` }}></div>
                  </div>
                  <span className="text-sm font-medium w-8">{statusCounts.productBacklog}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Refined Backlog</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-slate-200 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${(statusCounts.refined / mockUserStories.length) * 100}%` }}></div>
                  </div>
                  <span className="text-sm font-medium w-8">{statusCounts.refined}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">In Progress</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-slate-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(statusCounts.inProgress / mockUserStories.length) * 100}%` }}></div>
                  </div>
                  <span className="text-sm font-medium w-8">{statusCounts.inProgress}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Testing</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-slate-200 rounded-full h-2">
                    <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${(statusCounts.testing / mockUserStories.length) * 100}%` }}></div>
                  </div>
                  <span className="text-sm font-medium w-8">{statusCounts.testing}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Completed</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-slate-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(statusCounts.completed / mockUserStories.length) * 100}%` }}></div>
                  </div>
                  <span className="text-sm font-medium w-8">{statusCounts.completed}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Standup Stats */}
        <div className="card col-span-2">
          <div className="card-h">
            <span className="card-title">
              <CheckCircle2 className="w-4 h-4 text-[var(--text-3)]" />
              Today's Standup Summary
            </span>
            <span className="badge b-neutral">{today}</span>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{responses.length}</div>
                <div className="text-xs text-slate-600">Submitted</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600">{pendingUsers.length}</div>
                <div className="text-xs text-slate-600">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{activeBlockers.length}</div>
                <div className="text-xs text-slate-600">Blockers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{avgMood}</div>
                <div className="text-xs text-slate-600">Avg Mood</div>
              </div>
            </div>
            {activeBlockers.length > 0 && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-sm font-medium text-red-800 mb-2">Active Blockers:</div>
                <div className="space-y-1">
                  {activeBlockers.slice(0, 2).map((blocker) => {
                    const user = users.find(u => u.id === blocker.userId);
                    return (
                      <div key={blocker.id} className="text-xs text-red-700">
                        • {user?.name}: {blocker.blockers}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
