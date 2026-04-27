import React, { useState, useMemo } from 'react';
import { ArrowLeft, Calendar, Users, MoreVertical, ChevronRight } from 'lucide-react';
import { Project, UserStory, Status, GanttTask } from '../types/project';
import { format, differenceInDays, addDays, isWithinInterval, parseISO } from 'date-fns';

interface GanttChartProps {
  data: Project;
  type: 'project';
  projectName?: string;
  programName?: string;
  onBack: () => void;
}

export const GanttChart: React.FC<GanttChartProps> = ({
  data,
  type,
  projectName,
  programName,
  onBack,
}) => {
  const [selectedTask, setSelectedTask] = useState<GanttTask | null>(null);

  const ganttData = useMemo(() => {
    const tasks: GanttTask[] = [];

    if (type === 'project') {
      const project = data as Project;

      // Add project as main task
      tasks.push({
        id: project.id,
        name: project.name,
        startDate: project.startDate,
        endDate: project.endDate,
        progress: project.status === 'Completed' ? 100 : project.status === 'In Progress' ? 50 : 0,
        status: project.status,
        type: 'project',
      });

      // Note: Sprint functionality removed - projects now contain user stories directly
    }

    return tasks;
  }, [data, type]);

  const { startDate, endDate, totalDays } = useMemo(() => {
    const allDates = ganttData.flatMap(task => [task.startDate, task.endDate]);
    const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
    const days = differenceInDays(maxDate, minDate) + 1;

    return {
      startDate: minDate,
      endDate: maxDate,
      totalDays: days,
    };
  }, [ganttData]);

  const getStatusColor = (status: Status) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-500';
      case 'In Progress':
        return 'bg-blue-500';
      case 'Product Backlog':
        return 'bg-gray-400';
      default:
        return 'bg-gray-400';
    }
  };

  const getTaskTypeColor = (type: string) => {
    switch (type) {
      case 'project':
        return 'border-purple-500';
      case 'userStory':
        return 'border-orange-500';
      default:
        return 'border-gray-500';
    }
  };

  const getTaskPosition = (task: GanttTask) => {
    const startOffset = differenceInDays(task.startDate, startDate);
    const duration = differenceInDays(task.endDate, task.startDate) + 1;

    return {
      left: `${(startOffset / totalDays) * 100}%`,
      width: `${(duration / totalDays) * 100}%`,
    };
  };

  const generateMonthHeaders = () => {
    const headers = [];
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      const monthDays = Math.min(differenceInDays(monthEnd, currentDate) + 1, differenceInDays(endDate, currentDate) + 1);

      headers.push({
        name: format(currentDate, 'MMM yyyy'),
        days: monthDays,
        width: `${(monthDays / totalDays) * 100}%`,
      });

      currentDate = addDays(currentDate, monthDays);
    }

    return headers;
  };

  const monthHeaders = generateMonthHeaders();

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <div className="text-sm text-gray-600">
              {programName && `${programName} / `}
              {projectName && projectName}
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Gantt Chart - {(data as Project).name}
            </h1>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-white rounded-lg border border-gray-200">
        <div className="min-w-[1200px]">
          {/* Header with timeline */}
          <div className="border-b border-gray-200">
            <div className="grid grid-cols-[300px_1fr]">
              <div className="p-4 border-r border-gray-200 bg-gray-50">
                <h3 className="font-semibold text-gray-900">Tasks</h3>
              </div>
              <div className="relative">
                <div className="flex border-b border-gray-200">
                  {monthHeaders.map((header, index) => (
                    <div
                      key={index}
                      className="p-4 text-center border-r border-gray-200 bg-gray-50"
                      style={{ width: header.width }}
                    >
                      <div className="font-semibold text-gray-900">{header.name}</div>
                      <div className="text-sm text-gray-600">{header.days} days</div>
                    </div>
                  ))}
                </div>

                {/* Day markers */}
                <div className="flex">
                  {Array.from({ length: totalDays }, (_, i) => (
                    <div
                      key={i}
                      className="border-r border-gray-100 text-xs text-center py-1 text-gray-500"
                      style={{ width: `${(1 / totalDays) * 100}%` }}
                    >
                      {format(addDays(startDate, i), 'd')}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Task rows */}
          <div className="divide-y divide-gray-200">
            {ganttData.map((task) => (
              <div key={task.id} className="grid grid-cols-[300px_1fr] hover:bg-gray-50">
                <div className="p-4 border-r border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{task.name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)} text-white`}>
                          {task.status}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800`}>
                          {task.type}
                        </span>
                      </div>
                      {task.assignees && task.assignees.length > 0 && (
                        <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                          <Users className="w-4 h-4" />
                          <div className="flex -space-x-2">
                            {task.assignees.slice(0, 3).map((assignee, index) => (
                              <div
                                key={assignee.id}
                                className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-medium border-2 border-white"
                                title={assignee.name}
                              >
                                {assignee.name.charAt(0).toUpperCase()}
                              </div>
                            ))}
                            {task.assignees.length > 3 && (
                              <div className="w-5 h-5 rounded-full bg-gray-500 text-white flex items-center justify-center text-xs font-medium border-2 border-white">
                                +{task.assignees.length - 3}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <MoreVertical className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </div>

                <div className="p-4 relative">
                  <div className="relative h-8">
                    <div
                      className={`absolute top-1 h-6 rounded ${getStatusColor(task.status)} ${getTaskTypeColor(task.type)} border-2 cursor-pointer hover:opacity-80 transition-opacity`}
                      style={getTaskPosition(task)}
                      onClick={() => setSelectedTask(task)}
                    >
                      <div
                        className="h-full bg-white bg-opacity-30 rounded"
                        style={{ width: `${task.progress}%` }}
                      ></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-medium text-white drop-shadow">
                          {task.progress}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Task detail modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{selectedTask.name}</h3>
              <button
                onClick={() => setSelectedTask(null)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Type:</span>
                <span className="text-sm font-medium text-gray-900">{selectedTask.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedTask.status)} text-white`}>
                  {selectedTask.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Start Date:</span>
                <span className="text-sm font-medium text-gray-900">
                  {format(selectedTask.startDate, 'MMM d, yyyy')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">End Date:</span>
                <span className="text-sm font-medium text-gray-900">
                  {format(selectedTask.endDate, 'MMM d, yyyy')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Progress:</span>
                <span className="text-sm font-medium text-gray-900">{selectedTask.progress}%</span>
              </div>

              {selectedTask.assignees && selectedTask.assignees.length > 0 && (
                <div>
                  <span className="text-sm text-gray-600">Assignees:</span>
                  <div className="flex gap-2 mt-1">
                    {selectedTask.assignees.map((assignee) => (
                      <div
                        key={assignee.id}
                        className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-sm"
                      >
                        <div className="w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-medium">
                          {assignee.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-gray-700">{assignee.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => setSelectedTask(null)}
                className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
