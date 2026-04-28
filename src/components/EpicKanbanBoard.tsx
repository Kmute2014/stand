import React, { useState } from 'react';
import {
  DndContext, DragEndEvent, DragOverEvent, DragStartEvent,
  closestCenter, CollisionDetection, PointerSensor, useSensor, useSensors
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { Plus, MoreVertical, User, Calendar, MessageSquare, Edit2, Trash2, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { UserStory, User as UserType, Status } from '../types/project';

interface EpicKanbanBoardProps {
  epicId: string;
  userStories: UserStory[];
  users: UserType[];
  onCreateUserStory: () => void;
  onEditUserStory: (story: UserStory) => void;
  onDeleteUserStory: (storyId: string) => void;
  onUpdateUserStory: (storyId: string, updates: Partial<UserStory>) => void;
}

const COLUMNS = [
  { id: 'backlog', name: 'Backlog', color: 'border-t-gray-400' },
  { id: 'todo', name: 'To Do', color: 'border-t-blue-400' },
  { id: 'inprogress', name: 'In Progress', color: 'border-t-yellow-400' },
  { id: 'testing', name: 'Testing', color: 'border-t-purple-400' },
  { id: 'done', name: 'Done', color: 'border-t-green-400' }
] as const;

type ColumnId = typeof COLUMNS[number]['id'];

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const getNextStatus = (currentStatus: Status): Status | null => {
  const statusFlow: Record<Status, Status | null> = {
    'Product Backlog': 'Refined Backlog',
    'Refined Backlog': 'In Progress',
    'In Progress': 'Testing',
    'Testing': 'Completed',
    'Completed': null
  };
  return statusFlow[currentStatus];
};

const getPreviousStatus = (currentStatus: Status): Status | null => {
  const statusFlow: Record<Status, Status | null> = {
    'Product Backlog': null,
    'Refined Backlog': 'Product Backlog',
    'In Progress': 'Refined Backlog',
    'Testing': 'In Progress',
    'Completed': 'Testing'
  };
  return statusFlow[currentStatus];
};

export const EpicKanbanBoard: React.FC<EpicKanbanBoardProps> = ({
  epicId,
  userStories,
  users,
  onCreateUserStory,
  onEditUserStory,
  onDeleteUserStory,
  onUpdateUserStory,
}) => {
  const [draggedStory, setDraggedStory] = useState<UserStory | null>(null);
  const [expandedStories, setExpandedStories] = useState<Set<string>>(new Set());

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Filter stories by epic
  const epicStories = userStories.filter(story => story.epicId === epicId);

  // Group stories by column
  const getStoriesByColumn = (columnId: ColumnId) => {
    const statusMap: Record<ColumnId, UserStory['status']> = {
      backlog: 'Product Backlog' as Status,
      todo: 'Refined Backlog' as Status,
      inprogress: 'In Progress' as Status,
      testing: 'Testing' as Status,
      done: 'Completed' as Status
    };

    return epicStories
      .filter(story => story.status === statusMap[columnId])
      .sort((a, b) => a.order - b.order);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const story = epicStories.find(s => s.id === active.id);
    setDraggedStory(story || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || !draggedStory) return;

    const overId = over.id;
    const activeId = active.id;

    // Find the target column
    const targetColumn = COLUMNS.find(col => col.id === overId);

    if (targetColumn) {
      // Moving to a different column
      const statusMap: Record<ColumnId, UserStory['status']> = {
        backlog: 'Product Backlog' as Status,
        todo: 'Refined Backlog' as Status,
        inprogress: 'In Progress' as Status,
        testing: 'Testing' as Status,
        done: 'Completed' as Status
      };

      const newStatus = statusMap[targetColumn.id];
      if (newStatus !== draggedStory.status) {
        onUpdateUserStory(draggedStory.id, { status: newStatus });
      }
    } else {
      // Reordering within the same column
      const targetStory = epicStories.find(s => s.id === overId);
      if (targetStory && targetStory.status === draggedStory.status) {
        const currentColumnStories = getStoriesByColumn(
          COLUMNS.find(col => {
            const statusMap: Record<ColumnId, UserStory['status']> = {
              backlog: 'Product Backlog' as Status,
              todo: 'Refined Backlog' as Status,
              inprogress: 'In Progress' as Status,
              testing: 'Testing' as Status,
              done: 'Completed' as Status
            };
            return statusMap[col.id] === draggedStory.status;
          })?.id || 'backlog'
        );

        const oldIndex = currentColumnStories.findIndex(s => s.id === activeId);
        const newIndex = currentColumnStories.findIndex(s => s.id === overId);

        if (oldIndex !== newIndex) {
          const reorderedStories = arrayMove(currentColumnStories, oldIndex, newIndex);
          reorderedStories.forEach((story, index) => {
            onUpdateUserStory(story.id, { order: index + 1 });
          });
        }
      }
    }

    setDraggedStory(null);
  };

  const toggleStoryExpansion = (storyId: string) => {
    setExpandedStories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(storyId)) {
        newSet.delete(storyId);
      } else {
        newSet.add(storyId);
      }
      return newSet;
    });
  };

  const getPriorityColor = (priority: UserStory['priority']) => {
    switch (priority) {
      case 'Critical': return 'bg-red-100 text-red-700 border-red-300';
      case 'High': return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'Medium': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'Low': return 'bg-green-100 text-green-700 border-green-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const UserStoryCard: React.FC<{ story: UserStory; isDragging?: boolean }> = ({ story, isDragging }) => {

    const isExpanded = expandedStories.has(story.id);
    const nextStatus = getNextStatus(story.status);
    const previousStatus = getPreviousStatus(story.status);

    const handleMoveToPrevious = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (previousStatus) {
        onUpdateUserStory(story.id, { status: previousStatus });
      }
    };

    const handleMoveToNext = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (nextStatus) {
        onUpdateUserStory(story.id, { status: nextStatus });
      }
    };

    return (
      <div
        className={`bg-white p-3 rounded border border-gray-200 cursor-pointer hover:shadow-sm transition-shadow ${isDragging ? 'opacity-50 rotate-2 scale-105' : ''
          }`}
        onClick={() => onEditUserStory(story)}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm text-gray-900 truncate">{story.title}</div>
            <div className="text-xs text-gray-500 mt-1">
              <span className={`px-2 py-0.5 rounded text-xs border ${getPriorityColor(story.priority)}`}>
                {story.priority}
              </span>
              <span className="ml-2 text-gray-400">{story.estimate} pts</span>
            </div>
          </div>
          <div className="flex items-center gap-1 ml-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleStoryExpansion(story.id);
              }}
              className="p-1 hover:bg-gray-100 rounded text-gray-400"
            >
              <MessageSquare className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteUserStory(story.id);
              }}
              className="p-1 hover:bg-red-100 rounded text-red-400"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Tasks Summary */}
        {story.tasks && story.tasks.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500">Tasks</span>
              <span className="text-xs text-green-600 font-medium">
                {story.tasks.filter(task => task.status === 'Done').length}/{story.tasks.length}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
              <div
                className="bg-green-500 h-1.5 rounded-full transition-all duration-200"
                style={{ width: `${(story.tasks.filter(task => task.status === 'Done').length / story.tasks.length) * 100}%` }}
              ></div>
            </div>
            {/* Task checkboxes */}
            <div className="space-y-1">
              {story.tasks.slice(0, 3).map((task, index) => (
                <div key={index} className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={task.status === 'Done'}
                    onChange={(e) => {
                      e.stopPropagation();
                      const updatedTasks = story.tasks.map((t, i) =>
                        i === story.tasks.indexOf(task)
                          ? { ...t, status: e.target.checked ? 'Done' as const : 'Todo' as const, updatedAt: new Date() }
                          : t
                      );
                      onUpdateUserStory(story.id, { tasks: updatedTasks });
                    }}
                    className="w-3 h-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className={`truncate ${task.status === 'Done' ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                    {task.title}
                  </span>
                </div>
              ))}
              {story.tasks.length > 3 && (
                <div className="text-xs text-gray-500 italic">
                  +{story.tasks.length - 3} more tasks...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation Arrows */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
          <button
            onClick={handleMoveToPrevious}
            disabled={!previousStatus}
            className={`p-1 rounded transition-colors ${previousStatus
              ? 'hover:bg-blue-100 text-blue-600'
              : 'text-gray-300 cursor-not-allowed'
              }`}
            title={`Move to ${previousStatus || 'Previous'}`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="text-xs text-gray-500 font-medium">
            {story.status === 'Product Backlog' && 'Backlog'}
            {story.status === 'Refined Backlog' && 'To Do'}
            {story.status === 'In Progress' && 'In Progress'}
            {story.status === 'Testing' && 'Testing'}
            {story.status === 'Completed' && 'Done'}
          </div>

          <button
            onClick={handleMoveToNext}
            disabled={!nextStatus}
            className={`p-1 rounded transition-colors ${nextStatus
              ? 'hover:bg-blue-100 text-blue-600'
              : 'text-gray-300 cursor-not-allowed'
              }`}
            title={`Move to ${nextStatus || 'Next'}`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    );
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map(column => {
          const stories = getStoriesByColumn(column.id);

          return (
            <div key={column.id} className="w-80 flex-shrink-0">
              <div className={`bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col border-t-4 ${column.color}`} style={{ minHeight: '600px' }}>
                {/* Column header */}
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">{column.name}</h3>
                    <span className="text-sm text-gray-500">({stories.length})</span>
                  </div>

                  {/* Only backlog shows "Add User Story" */}
                  {column.id === 'backlog' && (
                    <button
                      onClick={onCreateUserStory}
                      className="w-full flex items-center justify-center gap-2 p-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-600 text-sm transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add User Story
                    </button>
                  )}
                </div>

                {/* Stories */}
                <div className="flex-1 p-4 overflow-y-auto">
                  <SortableContext items={stories.map(s => s.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-3">
                      {stories.map(story => (
                        <UserStoryCard key={story.id} story={story} />
                      ))}
                    </div>
                  </SortableContext>

                  {stories.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                      <div className="text-sm">
                        {column.id === 'backlog' ? 'No user stories yet' : 'Drop stories here'}
                      </div>
                      {column.id === 'backlog' && (
                        <div className="text-xs mt-1">Click "Add User Story" above</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </DndContext>
  );
};
