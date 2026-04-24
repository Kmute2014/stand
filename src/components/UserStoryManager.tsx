import React, { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, ChevronRight, MoreVertical, Edit, Trash2, CheckCircle, Clock, AlertCircle, GripVertical } from 'lucide-react';
import { UserStory, Status, Priority, User, hasPermission } from '../types/project';
import { UserStoryModal } from './UserStoryModal';

interface UserStoryManagerProps {
  epicName: string;
  epicId: string;
  sprintId: string;
  projectId: string;
  programId: string;
  userStories: UserStory[];
  currentUser: User;
  onCreateUserStory: (userStory: Omit<UserStory, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateUserStory: (userStory: UserStory) => void;
  onDeleteUserStory: (storyId: string) => void;
}

export const UserStoryManager: React.FC<UserStoryManagerProps> = ({
  epicName,
  epicId,
  sprintId,
  projectId,
  programId,
  userStories,
  currentUser,
  onCreateUserStory,
  onUpdateUserStory,
  onDeleteUserStory,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingStory, setEditingStory] = useState<UserStory | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState<string | null>(null);

  // Debug: Check currentUser and permissions
  console.log('UserStoryManager - currentUser:', currentUser);
  console.log('UserStoryManager - hasPermission update:', hasPermission(currentUser, 'update'));
  console.log('UserStoryManager - userStories count:', userStories.length);
  console.log('UserStoryManager - userStories data:', userStories);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Group stories by status
  const productBacklogStories = userStories.filter(story => story.status === 'Product Backlog');
  const refinedBacklogStories = userStories.filter(story => story.status === 'Refined Backlog');
  const inProgressStories = userStories.filter(story => story.status === 'In Progress');
  const testingStories = userStories.filter(story => story.status === 'Testing');
  const completedStories = userStories.filter(story => story.status === 'Completed');

  console.log('Status column debug:', {
    totalUserStories: userStories.length,
    productBacklogStories: productBacklogStories.length,
    refinedBacklogStories: refinedBacklogStories.length,
    inProgressStories: inProgressStories.length,
    testingStories: testingStories.length,
    completedStories: completedStories.length
  });

  const getStatusIcon = (status: Status) => {
    switch (status) {
      case 'Product Backlog':
        return <Clock className="w-4 h-4 text-gray-500" />;
      case 'Refined Backlog':
        return <AlertCircle className="w-4 h-4 text-purple-500" />;
      case 'In Progress':
        return <AlertCircle className="w-4 h-4 text-blue-500" />;
      case 'Testing':
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case 'Completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: Status) => {
    switch (status) {
      case 'Product Backlog':
        return 'bg-gray-50 border-gray-200';
      case 'Refined Backlog':
        return 'bg-purple-50 border-purple-200';
      case 'In Progress':
        return 'bg-blue-50 border-blue-200';
      case 'Testing':
        return 'bg-orange-50 border-orange-200';
      case 'Completed':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getNextStatus = (currentStatus: Status): Status => {
    switch (currentStatus) {
      case 'Product Backlog':
        return 'Refined Backlog';
      case 'Refined Backlog':
        return 'In Progress';
      case 'In Progress':
        return 'Testing';
      case 'Testing':
        return 'Completed';
      case 'Completed':
        return 'Completed'; // Stay at completed
      default:
        return 'Product Backlog';
    }
  };

  const getPreviousStatus = (currentStatus: Status): Status => {
    switch (currentStatus) {
      case 'Completed':
        return 'Testing';
      case 'Testing':
        return 'In Progress';
      case 'In Progress':
        return 'Refined Backlog';
      case 'Refined Backlog':
        return 'Product Backlog';
      case 'Product Backlog':
        return 'Product Backlog'; // Stay at product backlog
      default:
        return 'Product Backlog';
    }
  };

  const handleStatusChange = (story: UserStory, newStatus: Status) => {
    // Validate: Cannot move to Completed if subtasks are not all completed
    if (newStatus === 'Completed' && !canMoveToCompleted(story)) {
      alert('Cannot move to Completed. All subtasks must be completed first.');
      return;
    }

    const updatedStory = {
      ...story,
      status: newStatus,
      updatedAt: new Date(),
    };
    onUpdateUserStory(updatedStory);
  };

  const handleCreateStory = (userStory: Omit<UserStory, 'id' | 'createdAt' | 'updatedAt'>) => {
    // Ensure new stories start in Product Backlog with proper IDs
    const storyWithStatusAndIds = {
      ...userStory,
      status: 'Product Backlog' as Status,
      epicId,
      sprintId,
      projectId,
      programId,
    };
    onCreateUserStory(storyWithStatusAndIds);
    setShowCreateModal(false);
  };

  const handleUpdateStory = (userStory: UserStory) => {
    onUpdateUserStory(userStory);
    setEditingStory(null);
  };

  const areAllSubtasksCompleted = (story: UserStory): boolean => {
    if (story.subtasks.length === 0) return true; // No subtasks means it can be completed
    return story.subtasks.every(subtask => subtask.completed);
  };

  const canMoveToCompleted = (story: UserStory): boolean => {
    return areAllSubtasksCompleted(story);
  };

  // ── Drag and Drop Handlers ────────────────────────────────────────────────

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    console.log('Drag start triggered for story:', active.id);
    // Story is identified by active.id, no need to track draggedStory state
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (over) {
      setIsDraggingOver(over.id as string);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    // Reset drag state
    setIsDraggingOver(null);

    if (!over) return;

    const draggedStoryId = active.id as string;
    const targetStatus = over.id as string;

    // Find the dragged story
    const story = userStories.find(s => s.id === draggedStoryId);
    if (!story) return;

    // Convert target status to Status type
    let newStatus: Status;
    switch (targetStatus) {
      case 'product-backlog':
        newStatus = 'Product Backlog';
        break;
      case 'refined-backlog':
        newStatus = 'Refined Backlog';
        break;
      case 'in-progress':
        newStatus = 'In Progress';
        break;
      case 'testing':
        newStatus = 'Testing';
        break;
      case 'completed':
        newStatus = 'Completed';
        break;
      default:
        return;
    }

    // Validate: Cannot move to Completed if subtasks are not all completed
    if (newStatus === 'Completed' && !canMoveToCompleted(story)) {
      // Show feedback that subtasks must be completed first
      alert('Cannot move to Completed. All subtasks must be completed first.');
      return;
    }

    // Only update if status actually changed
    if (story.status !== newStatus) {
      const updatedStory = {
        ...story,
        status: newStatus,
        updatedAt: new Date(),
      };
      onUpdateUserStory(updatedStory);
    }
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'Critical':
        return 'bg-red-100 text-red-800';
      case 'High':
        return 'bg-orange-100 text-orange-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const UserStoryCard: React.FC<{ story: UserStory }> = ({ story }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: story.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    const canMoveBackward = story.status !== 'Product Backlog';
    const canMoveForward = story.status !== 'Completed' && canMoveToCompleted(story);

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`border rounded-lg p-4 ${getStatusColor(story.status)} transition-all duration-200 hover:shadow-md ${isDragging ? 'opacity-50 scale-95' : ''
          }`}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3 flex-1">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-white rounded transition-colors"
            >
              <GripVertical className="w-4 h-4 text-gray-400" />
            </div>
            {getStatusIcon(story.status)}
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 mb-1">{story.title}</h4>
              {story.description && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500 mb-1">Acceptance Criteria:</p>
                  <p className="text-sm text-gray-600 line-clamp-2">{story.description}</p>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {hasPermission(currentUser, 'update') && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingStory(story);
                }}
                className="p-1 hover:bg-white rounded transition-colors hover:text-blue-600"
                title="Edit story"
              >
                <Edit className="w-4 h-4 text-gray-500 hover:text-blue-600" />
              </button>
            )}
            {(() => {
              const shouldShowDelete = hasPermission(currentUser, 'delete');
              console.log(`Delete button debug for story "${story.title}":`, {
                storyTitle: story.title,
                currentUser,
                currentUserRole: currentUser?.role,
                hasDeletePermission: shouldShowDelete,
                shouldShowDelete
              });
              return shouldShowDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Delete button clicked for story:', story.id);
                    onDeleteUserStory(story.id);
                  }}
                  className="p-1 hover:bg-white rounded transition-colors"
                  title="Delete story"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              );
            })()}
            <button
              onClick={(e) => e.stopPropagation()}
              className="p-1 hover:bg-white rounded transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(story.priority)}`}>
              {story.priority}
            </span>
            {story.assignees.length > 0 && (
              <div className="flex -space-x-2">
                {story.assignees.slice(0, 3).map((assignee, index) => (
                  <div
                    key={index}
                    className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center border-2 border-white"
                    title={assignee.name}
                  >
                    {assignee.name.charAt(0).toUpperCase()}
                  </div>
                ))}
                {story.assignees.length > 3 && (
                  <div className="w-6 h-6 rounded-full bg-gray-500 text-white text-xs flex items-center justify-center border-2 border-white">
                    +{story.assignees.length - 3}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleStatusChange(story, getPreviousStatus(story.status));
              }}
              disabled={!canMoveBackward}
              className={`p-1 rounded transition-colors ${canMoveBackward
                ? 'hover:bg-white text-gray-600'
                : 'text-gray-300 cursor-not-allowed'
                }`}
              title="Move to previous status"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleStatusChange(story, getNextStatus(story.status));
              }}
              disabled={!canMoveForward}
              className={`p-1 rounded transition-colors ${canMoveForward
                ? 'hover:bg-white text-gray-600'
                : 'text-gray-300 cursor-not-allowed'
                }`}
              title="Move to next status"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {story.subtasks.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
              <span>Subtasks: {story.subtasks.filter(st => st.completed).length}/{story.subtasks.length}</span>
              <div className="w-20 bg-gray-200 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all duration-200 ${areAllSubtasksCompleted(story) ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                  style={{
                    width: `${(story.subtasks.filter(st => st.completed).length / story.subtasks.length) * 100}%`
                  }}
                />
              </div>
            </div>
            {!areAllSubtasksCompleted(story) && story.status !== 'Completed' && (
              <div className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                <AlertCircle className="w-3 h-3" />
                <span>All subtasks must be completed to move to Done</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const StatusColumn: React.FC<{
    title: string;
    stories: UserStory[];
    status: Status;
    color: string;
  }> = ({ title, stories, status, color }) => {
    const getStatusId = (status: Status) => {
      switch (status) {
        case 'Product Backlog':
          return 'product-backlog';
        case 'Refined Backlog':
          return 'refined-backlog';
        case 'In Progress':
          return 'in-progress';
        case 'Testing':
          return 'testing';
        case 'Completed':
          return 'completed';
        default:
          return 'product-backlog';
      }
    };

    const statusId = getStatusId(status);
    const { setNodeRef, isOver } = useDroppable({
      id: statusId,
    });

    const isDropTarget = isOver;

    return (
      <div
        ref={setNodeRef}
        className={`flex-1 min-w-0 transition-colors duration-200 ${isDropTarget ? 'bg-blue-50' : ''
          }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${color}`} />
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <span className="text-sm text-gray-500">({stories.length})</span>
          </div>
          {(() => {
            const shouldShow = status === 'Product Backlog' && hasPermission(currentUser, 'create');
            console.log(`Add Story button debug for column "${title}":`, {
              title,
              status,
              isProductBacklog: status === 'Product Backlog',
              currentUser,
              hasCreatePermission: hasPermission(currentUser, 'create'),
              shouldShow
            });
            return shouldShow && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Story
              </button>
            );
          })()}
        </div>

        <div className={`space-y-3 min-h-[200px] rounded-lg p-2 transition-colors duration-200 ${isDropTarget ? 'border-2 border-dashed border-blue-400 bg-blue-50' : ''
          }`}>
          {stories.map((story) => (
            <UserStoryCard key={story.id} story={story} />
          ))}

          {stories.length === 0 && (
            <div className={`text-center py-8 rounded-lg border-2 border-dashed transition-colors duration-200 ${isDropTarget
              ? 'border-blue-400 bg-blue-50 text-blue-600'
              : 'border-gray-200 text-gray-400'
              }`}>
              <div className="text-sm">
                {isDropTarget ? 'Drop story here' : `No ${title.toLowerCase()} stories`}
              </div>
              {status === 'Product Backlog' && !isDropTarget && hasPermission(currentUser, 'create') && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-2 text-blue-500 hover:text-blue-600 text-sm"
                >
                  Create first story
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{epicName}</h1>
          <p className="text-sm text-gray-600 mt-1">
            {userStories.length} total stories • {completedStories.length} completed
          </p>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Progress</span>
          <span className="text-sm text-gray-600">
            {userStories.length > 0
              ? Math.round((completedStories.length / userStories.length) * 100)
              : 0}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-green-500 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${userStories.length > 0
                ? (completedStories.length / userStories.length) * 100
                : 0}%`
            }}
          />
        </div>
      </div>

      {/* Status Columns */}
      <div className="flex-1 overflow-hidden">
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-6 h-full">
            <StatusColumn
              title="Product Backlog"
              stories={productBacklogStories}
              status="Product Backlog"
              color="bg-gray-400"
            />
            <StatusColumn
              title="Refined Backlog"
              stories={refinedBacklogStories}
              status="Refined Backlog"
              color="bg-purple-400"
            />
            <StatusColumn
              title="In Progress"
              stories={inProgressStories}
              status="In Progress"
              color="bg-blue-400"
            />
            <StatusColumn
              title="Testing"
              stories={testingStories}
              status="Testing"
              color="bg-orange-400"
            />
            <StatusColumn
              title="Completed"
              stories={completedStories}
              status="Completed"
              color="bg-green-400"
            />
          </div>
        </DndContext>
      </div>

      {/* Create Story Modal */}
      {showCreateModal && (
        <UserStoryModal
          userStory={null}
          columnId="" // Will be set by handleCreateStory
          epicId="" // Will be set by handleCreateStory
          sprintId="" // Will be set by handleCreateStory
          projectId="" // Will be set by handleCreateStory
          programId="" // Will be set by handleCreateStory
          onCreate={handleCreateStory}
          onUpdate={handleUpdateStory}
          onCancel={() => setShowCreateModal(false)}
          appUsers={[]} // Empty array for now, can be passed as prop if needed
        />
      )}

      {/* Edit Story Modal */}
      {editingStory && (
        <UserStoryModal
          userStory={editingStory}
          columnId={editingStory.columnId}
          epicId={editingStory.epicId}
          sprintId={editingStory.sprintId}
          projectId={editingStory.projectId}
          programId={editingStory.programId}
          onCreate={handleCreateStory}
          onUpdate={handleUpdateStory}
          onCancel={() => setEditingStory(null)}
          appUsers={[]} // Empty array for now, can be passed as prop if needed
        />
      )}
    </div>
  );
};
