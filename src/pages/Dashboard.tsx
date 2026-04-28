import React, { useState, useEffect } from 'react';
import { useAppContext } from '../store';
import {
  CheckCircle2, CircleDashed, AlertTriangle, Smile, TrendingUp,
  Activity, Users, Target, Clock, BarChart3, PieChart, ArrowUp,
  ArrowDown, MoreHorizontal, Calendar, Filter, RefreshCw
} from 'lucide-react';
import { UserStory, Status, Priority } from '../types/project';

export const Dashboard: React.FC = () => {
  const {
    currentUser,
    responses,
    users,
    programs,
    projects,
    sprints,
    epics,
    userStories,
    sendReminders
  } = useAppContext();
  const isAdmin = currentUser?.role === 'Admin';
  const canCreateProgram = currentUser?.role === 'Admin' || currentUser?.role === 'Project Manager/Scrum Master';



  // Calculate program-level metrics
  const getTotalProjects = () => {
    return projects.length;
  };

  const getTotalSprints = () => {
    return sprints.length;
  };

  const getTotalEpics = () => {
    return epics.length;
  };

  const getOverallCompletion = () => {
    // Calculate actual completion rate from user stories
    if (userStories.length === 0) return 0;
    const completedStories = userStories.filter(story => story.status === 'Completed').length;
    return Math.round((completedStories / userStories.length) * 100);
  };

  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const pendingUsers = users.filter(u => u.status === 'Active' && !u.lastStandup?.includes('Today'));
  const activeBlockers = responses.filter(r => r.blockers.toLowerCase() !== 'no' && r.date === today);

  // Filter out admin responses
  const getNonAdminResponses = () => {
    return responses.filter(response => {
      const user = users.find(u => u.id === response.userId);
      return user && user.role !== 'Admin';
    });
  };

  const nonAdminResponses = getNonAdminResponses();

  // Calculate average mood (excluding admins)
  const moodSum = nonAdminResponses.reduce((acc, curr) => acc + curr.mood.score, 0);
  const avgMood = nonAdminResponses.length > 0 ? (moodSum / nonAdminResponses.length).toFixed(1) : '—';

  // Project Management Metrics
  const getStatusCounts = () => {
    const counts = {
      backlog: userStories.filter(s => s.status === 'Product Backlog').length,
      todo: userStories.filter(s => s.status === 'Refined Backlog').length,
      inProgress: userStories.filter(s => s.status === 'In Progress').length,
      testing: userStories.filter(s => s.status === 'Testing').length,
      completed: userStories.filter(s => s.status === 'Completed').length,
    };
    return counts;
  };

  const getPriorityBreakdown = () => {
    const breakdown = {
      critical: userStories.filter(s => s.priority === 'Critical').length,
      high: userStories.filter(s => s.priority === 'High').length,
      medium: userStories.filter(s => s.priority === 'Medium').length,
      low: userStories.filter(s => s.priority === 'Low').length,
    };
    return breakdown;
  };

  const getCompletionRate = () => {
    const total = userStories.length;
    const completed = userStories.filter(s => s.status === 'Completed').length;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const getRecentActivities = () => {
    // Create activities from real data
    const activities = [];

    // Add recent responses as activities
    responses.slice(-3).forEach(response => {
      const user = users.find(u => u.id === response.userId);
      if (user) {
        activities.push({
          id: `response-${response.id}`,
          type: 'standup',
          user: user.name,
          action: `Submitted daily standup`,
          time: response.date === today ? 'Today' : `${response.date}`,
          icon: <CheckCircle2 className="w-4 h-4" />
        });
      }
    });

    // Add recent user stories as activities
    userStories.slice(-3).reverse().forEach(story => {
      activities.push({
        id: `story-${story.id}`,
        type: 'task',
        user: 'System',
        action: `Created story: "${story.title.substring(0, 50)}${story.title.length > 50 ? '...' : ''}"`,
        time: story.updatedAt.toLocaleDateString(),
        icon: <Target className="w-4 h-4" />
      });
    });

    return activities.slice(0, 6);
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
          <div className="text-4xl font-bold text-slate-800 leading-none mb-2 tracking-tight">{getTotalSprints()}</div>
          <div className="text-sm text-slate-600 font-medium">Total Sprints</div>
          <div className="text-xs text-slate-400 mt-1">active sprint cycles</div>
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
                <span className="text-sm">Backlog</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-slate-200 rounded-full h-2">
                    <div className="bg-gray-500 h-2 rounded-full" style={{ width: `${userStories.length > 0 ? (statusCounts.backlog / userStories.length) * 100 : 0}%` }}></div>
                  </div>
                  <span className="text-sm font-medium w-8">{statusCounts.backlog}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">To Do</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-slate-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${userStories.length > 0 ? (statusCounts.todo / userStories.length) * 100 : 0}%` }}></div>
                  </div>
                  <span className="text-sm font-medium w-8">{statusCounts.todo}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">In Progress</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-slate-200 rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${userStories.length > 0 ? (statusCounts.inProgress / userStories.length) * 100 : 0}%` }}></div>
                  </div>
                  <span className="text-sm font-medium w-8">{statusCounts.inProgress}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Testing</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-slate-200 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${userStories.length > 0 ? (statusCounts.testing / userStories.length) * 100 : 0}%` }}></div>
                  </div>
                  <span className="text-sm font-medium w-8">{statusCounts.testing}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Completed</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-slate-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${userStories.length > 0 ? (statusCounts.completed / userStories.length) * 100 : 0}%` }}></div>
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
                <div className="text-2xl font-bold text-blue-600">{nonAdminResponses.length}</div>
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
