import React, { useState } from 'react';
import { DndContext, DragEndEvent, DragOverEvent, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, ArrowLeft, MoreVertical, GripVertical, User, Calendar, Flag, MessageSquare, CheckSquare } from 'lucide-react';
import { Epic, KanbanColumn, UserStory, Priority, Status } from '../types/project';
import { User as AppUser } from '../types';
import { SortableColumn } from './SortableColumn';
import { UserStoryCard } from './UserStoryCard';
import { UserStoryModal } from './UserStoryModal';

interface EpicKanbanBoardProps {
  epic: Epic;
  sprintName: string;
  projectName: string;
  programName: string;
  onBack: () => void;
  onUpdateEpic: (epic: Epic) => void;
  onCreateUserStory: (userStory: Omit<UserStory, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateUserStory: (userStory: UserStory) => void;
  onDeleteUserStory: (userStoryId: string) => void;
  appUsers: AppUser[];
}

export const EpicKanbanBoard: React.FC<EpicKanbanBoardProps> = ({
  epic,
  sprintName,
  projectName,
  programName,
  onBack,
  onUpdateEpic,
  onCreateUserStory,
  onUpdateUserStory,
  onDeleteUserStory,
  appUsers,
}) => {
  const [showCreateColumnModal, setShowCreateColumnModal] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [showUserStoryModal, setShowUserStoryModal] = useState(false);
  const [selectedUserStory, setSelectedUserStory] = useState<UserStory | null>(null);
  const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    // Handle drag start if needed
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    // Handle drag over for column reordering or story movement
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    console.log('Drag end:', { activeId, overId });

    // Handle column reordering
    if (activeId.startsWith('col-') && overId.startsWith('col-')) {
      const oldIndex = epic.columns.findIndex(col => col.id === activeId);
      const newIndex = epic.columns.findIndex(col => col.id === overId);

      if (oldIndex !== newIndex) {
        const newColumns = arrayMove(epic.columns, oldIndex, newIndex);
        onUpdateEpic({
          ...epic,
          columns: newColumns.map((col, index) => ({ ...col, order: index })),
        });
      }
    }

    // Handle user story movement between columns
    // Check if the active item is a user story by looking for it in any column
    const sourceColumn = epic.columns.find(col =>
      col.userStories.some(story => story.id === activeId)
    );

    // Check if the target is a column
    const targetColumn = epic.columns.find(col => col.id === overId);

    console.log('Drag analysis:', { sourceColumn: sourceColumn?.name, targetColumn: targetColumn?.name });

    if (sourceColumn && targetColumn && sourceColumn.id !== targetColumn.id) {
      const story = sourceColumn.userStories.find(s => s.id === activeId);
      if (story) {
        console.log('Moving story:', story.title, 'from', sourceColumn.name, 'to', targetColumn.name);
        const updatedStory = { ...story, columnId: targetColumn.id };

        const newColumns = epic.columns.map(col => {
          if (col.id === sourceColumn.id) {
            return {
              ...col,
              userStories: col.userStories.filter(s => s.id !== activeId),
            };
          }
          if (col.id === targetColumn.id) {
            return {
              ...col,
              userStories: [...col.userStories, updatedStory],
            };
          }
          return col;
        });

        onUpdateEpic({ ...epic, columns: newColumns });
        onUpdateUserStory(updatedStory);
      }
    }
  };

  const handleCreateColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (newColumnName.trim()) {
      const newColumn: KanbanColumn = {
        id: `col-${Date.now()}`,
        name: newColumnName.trim(),
        order: epic.columns.length,
        epicId: epic.id,
        sprintId: epic.sprintId,
        projectId: epic.projectId,
        programId: epic.programId,
        userStories: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      onUpdateEpic({
        ...epic,
        columns: [...epic.columns, newColumn],
      });

      setNewColumnName('');
      setShowCreateColumnModal(false);
    }
  };

  const handleDeleteColumn = (columnId: string) => {
    const newColumns = epic.columns.filter(col => col.id !== columnId);
    onUpdateEpic({ ...epic, columns: newColumns });
  };

  const handleCreateUserStory = (userStory: Omit<UserStory, 'id' | 'createdAt' | 'updatedAt'>) => {
    onCreateUserStory(userStory);
    setShowUserStoryModal(false);
    setSelectedUserStory(null);
    setSelectedColumnId(null);
  };

  const handleUpdateUserStory = (userStory: UserStory) => {
    onUpdateUserStory(userStory);
    setShowUserStoryModal(false);
    setSelectedUserStory(null);
  };

  const openUserStoryModal = (columnId: string, userStory?: UserStory) => {
    setSelectedColumnId(columnId);
    setSelectedUserStory(userStory || null);
    setShowUserStoryModal(true);
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

  const getEpicStats = () => {
    const totalStories = epic.columns.reduce((acc, col) => acc + col.userStories.length, 0);
    const completedStories = epic.columns.reduce((acc, col) =>
      acc + col.userStories.filter(story => story.status === 'Completed').length, 0);
    const totalSubtasks = epic.columns.reduce((acc, col) =>
      acc + col.userStories.reduce((storyAcc, story) => storyAcc + story.subtasks.length, 0), 0);
    const completedSubtasks = epic.columns.reduce((acc, col) =>
      acc + col.userStories.reduce((storyAcc, story) =>
        storyAcc + story.subtasks.filter(subtask => subtask.completed).length, 0), 0);

    return { totalStories, completedStories, totalSubtasks, completedSubtasks };
  };

  const stats = getEpicStats();

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
            <div className="text-sm text-gray-600">{programName} / {projectName} / {sprintName}</div>
            <h1 className="text-3xl font-bold text-gray-900">{epic.name}</h1>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowCreateColumnModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Column
          </button>
        </div>
      </div>

      {epic.description && (
        <p className="text-gray-600 mb-6">{epic.description}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{stats.totalStories}</div>
          <div className="text-sm text-gray-600">User Stories</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-green-600">{stats.completedStories}</div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{stats.totalSubtasks}</div>
          <div className="text-sm text-gray-600">Subtasks</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-green-600">{stats.completedSubtasks}</div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-4 h-full min-w-max">
            <SortableContext items={epic.columns.map(col => col.id)} strategy={horizontalListSortingStrategy}>
              {epic.columns.map((column) => (
                <SortableColumn
                  key={column.id}
                  column={column}
                  onAddStory={() => openUserStoryModal(column.id)}
                  onEditStory={(story) => openUserStoryModal(column.id, story)}
                  onDeleteStory={onDeleteUserStory}
                />
              ))}
            </SortableContext>

            <div className="w-80 flex-shrink-0">
              <div className="bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-300">
                <button
                  onClick={() => setShowCreateColumnModal(true)}
                  className="w-full h-20 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Plus className="w-6 h-6 mr-2" />
                  Add Column
                </button>
              </div>
            </div>
          </div>
        </div>
      </DndContext>

      {showCreateColumnModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Add New Column</h2>
            <form onSubmit={handleCreateColumn}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Column Name
                </label>
                <input
                  type="text"
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., In Review"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Column
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateColumnModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showUserStoryModal && selectedColumnId && (
        <UserStoryModal
          userStory={selectedUserStory}
          columnId={selectedColumnId}
          epicId={epic.id}
          sprintId={epic.sprintId}
          projectId={epic.projectId}
          programId={epic.programId}
          onCreate={handleCreateUserStory}
          onUpdate={handleUpdateUserStory}
          onCancel={() => {
            setShowUserStoryModal(false);
            setSelectedUserStory(null);
            setSelectedColumnId(null);
          }}
          appUsers={appUsers}
        />
      )}
    </div>
  );
};
