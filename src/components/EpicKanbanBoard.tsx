import React, { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus, ArrowLeft } from 'lucide-react';
import { Epic, KanbanColumn, UserStory, Status } from '../types/project';
import { User as AppUser } from '../types';
import { SortableColumn } from './SortableColumn';
import { UserStoryModal } from './UserStoryModal';

const STATUS_COLUMN_COUNT = 3; // To Do, In Progress, Done

interface EpicKanbanBoardProps {
  epic: Epic;
  sprintName: string;
  projectName: string;
  programName: string;
  currentUser: any;
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
  currentUser,
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
      activationConstraint: { distance: 8 },
    })
  );

  // ── helpers ────────────────────────────────────────────────────────────────

  /**
   * `over.id` from dnd-kit can be either a column id (dropped on empty space)
   * or a card id (dropped on top of another card). This resolves either to the
   * owning column.
   */
  const resolveTargetColumn = (overId: string): KanbanColumn | undefined => {
    // Direct column hit
    const directColumn = epic.columns.find(col => col.id === overId);
    if (directColumn) return directColumn;

    // Landed on a card — find which column owns that card
    return epic.columns.find(col =>
      col.userStories.some(story => story.id === overId)
    );
  };

  const getStatusFromColumnIndex = (columnIndex: number): Status => {
    switch (columnIndex) {
      case 0: return 'Not Started';
      case 1: return 'In Progress';
      case 2: return 'Completed';
      default: return 'Not Started';
    }
  };

  // ── drag handlers ──────────────────────────────────────────────────────────

  const handleDragStart = (_event: DragStartEvent) => { };
  const handleDragOver = (_event: DragOverEvent) => { };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // ── column reordering ──────────────────────────────────────────
    const activeIsColumn = epic.columns.some(col => col.id === activeId);
    const overIsColumn = epic.columns.some(col => col.id === overId);

    if (activeIsColumn && overIsColumn) {
      const oldIndex = epic.columns.findIndex(col => col.id === activeId);
      const newIndex = epic.columns.findIndex(col => col.id === overId);
      if (oldIndex !== newIndex) {
        const newColumns = arrayMove(epic.columns, oldIndex, newIndex);
        onUpdateEpic({
          ...epic,
          columns: newColumns.map((col, i) => ({ ...col, order: i })),
        });
      }
      return;
    }

    // ── user story movement ────────────────────────────────────────
    const sourceColumn = epic.columns.find(col =>
      col.userStories.some(story => story.id === activeId)
    );
    if (!sourceColumn) return;

    // Resolve whether the drop landed on a column or on a card inside a column
    const targetColumn = resolveTargetColumn(overId);
    if (!targetColumn) return;
    if (targetColumn.id === sourceColumn.id) return;

    const targetColumnIndex = epic.columns.findIndex(col => col.id === targetColumn.id);

    // Block drops into points columns (index >= 3)
    if (targetColumnIndex >= STATUS_COLUMN_COUNT) return;

    const story = sourceColumn.userStories.find(s => s.id === activeId);
    if (!story) return;

    const newStatus = getStatusFromColumnIndex(targetColumnIndex);
    const updatedStory: UserStory = {
      ...story,
      columnId: targetColumn.id,
      status: newStatus,
      updatedAt: new Date(),
    };

    const newColumns = epic.columns.map(col => {
      if (col.id === sourceColumn.id)
        return { ...col, userStories: col.userStories.filter(s => s.id !== activeId), updatedAt: new Date() };
      if (col.id === targetColumn.id)
        return { ...col, userStories: [...col.userStories, updatedStory], updatedAt: new Date() };
      return col;
    });

    onUpdateEpic({ ...epic, columns: newColumns });
    onUpdateUserStory(updatedStory);
  };

  // ── column CRUD ────────────────────────────────────────────────────────────

  const handleCreateColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColumnName.trim()) return;

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

    onUpdateEpic({ ...epic, columns: [...epic.columns, newColumn] });
    setNewColumnName('');
    setShowCreateColumnModal(false);
  };

  // ── user story CRUD ────────────────────────────────────────────────────────

  const handleCreateUserStory = (
    userStory: Omit<UserStory, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
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

  // ── move-button handlers (Previous / Next) ─────────────────────────────────

  const handleMoveStoryToPreviousColumn = (storyId: string) => {
    const sourceColumn = epic.columns.find(col =>
      col.userStories.some(story => story.id === storyId)
    );
    if (!sourceColumn) return;

    const currentIndex = epic.columns.findIndex(col => col.id === sourceColumn.id);
    const previousIndex = currentIndex - 1;
    if (previousIndex < 0) return;

    const targetColumn = epic.columns[previousIndex];
    const story = sourceColumn.userStories.find(s => s.id === storyId);
    if (!story) return;

    const updatedStory: UserStory = {
      ...story,
      columnId: targetColumn.id,
      status: getStatusFromColumnIndex(previousIndex),
      updatedAt: new Date(),
    };

    const newColumns = epic.columns.map(col => {
      if (col.id === sourceColumn.id)
        return { ...col, userStories: col.userStories.filter(s => s.id !== storyId) };
      if (col.id === targetColumn.id)
        return { ...col, userStories: [...col.userStories, updatedStory] };
      return col;
    });

    onUpdateEpic({ ...epic, columns: newColumns });
    onUpdateUserStory(updatedStory);
  };

  const handleMoveStoryToNextColumn = (storyId: string) => {
    const sourceColumn = epic.columns.find(col =>
      col.userStories.some(story => story.id === storyId)
    );
    if (!sourceColumn) return;

    const currentIndex = epic.columns.findIndex(col => col.id === sourceColumn.id);
    const nextIndex = currentIndex + 1;

    // Stop at the last status column — never bleed into points columns
    if (nextIndex >= STATUS_COLUMN_COUNT) return;

    const targetColumn = epic.columns[nextIndex];
    const story = sourceColumn.userStories.find(s => s.id === storyId);
    if (!story) return;

    const updatedStory: UserStory = {
      ...story,
      columnId: targetColumn.id,
      status: getStatusFromColumnIndex(nextIndex),
      updatedAt: new Date(),
    };

    const newColumns = epic.columns.map(col => {
      if (col.id === sourceColumn.id)
        return { ...col, userStories: col.userStories.filter(s => s.id !== storyId) };
      if (col.id === targetColumn.id)
        return { ...col, userStories: [...col.userStories, updatedStory] };
      return col;
    });

    onUpdateEpic({ ...epic, columns: newColumns });
    onUpdateUserStory(updatedStory);
  };

  // ── stats ──────────────────────────────────────────────────────────────────

  const getEpicStats = () => {
    const totalStories = epic.columns.reduce((acc, col) => acc + col.userStories.length, 0);
    const completedStories = epic.columns.reduce(
      (acc, col) => acc + col.userStories.filter(s => s.status === 'Completed').length, 0
    );
    const totalSubtasks = epic.columns.reduce(
      (acc, col) => acc + col.userStories.reduce((a, s) => a + s.subtasks.length, 0), 0
    );
    const completedSubtasks = epic.columns.reduce(
      (acc, col) =>
        acc + col.userStories.reduce((a, s) => a + s.subtasks.filter(t => t.completed).length, 0),
      0
    );
    return { totalStories, completedStories, totalSubtasks, completedSubtasks };
  };

  const stats = getEpicStats();

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 h-full flex flex-col">

      {/* Header */}
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
              {programName} / {projectName} / {sprintName}
            </div>
            <h1 className="text-3xl font-bold text-gray-900">{epic.name}</h1>
          </div>
        </div>
        <button
          onClick={() => setShowCreateColumnModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Column
        </button>
      </div>

      {epic.description && (
        <p className="text-gray-600 mb-6">{epic.description}</p>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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
          <div className="text-sm text-gray-600">Subtasks Done</div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-gray-400" />
          <span>To Do</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-blue-400" />
          <span>In Progress</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-green-400" />
          <span>Done</span>
        </div>
        {epic.columns.length > STATUS_COLUMN_COUNT && (
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-purple-400" />
            <span>Points (notes only)</span>
          </div>
        )}
      </div>

      {/* Board */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-2 md:gap-4 h-full min-w-max pb-4">
            <SortableContext
              items={epic.columns.map(col => col.id)}
              strategy={horizontalListSortingStrategy}
            >
              {epic.columns.map((column, index) => (
                <SortableColumn
                  key={column.id}
                  column={column}
                  onAddStory={() => openUserStoryModal(column.id)}
                  onEditStory={(story) => openUserStoryModal(column.id, story)}
                  onDeleteStory={onDeleteUserStory}
                  onMoveStoryToPreviousColumn={handleMoveStoryToPreviousColumn}
                  onMoveStoryToNextColumn={handleMoveStoryToNextColumn}
                  allColumns={epic.columns}
                  columnIndex={index}
                />
              ))}
            </SortableContext>

            {/* Add column placeholder */}
            <div className="w-72 md:w-80 flex-shrink-0">
              <div className="bg-gray-50 rounded-lg p-3 md:p-4 border-2 border-dashed border-gray-300">
                <button
                  onClick={() => setShowCreateColumnModal(true)}
                  className="w-full h-16 md:h-20 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-sm md:text-base"
                >
                  <Plus className="w-5 h-5 md:w-6 md:h-6 mr-1 md:mr-2" />
                  <span className="hidden md:inline">Add Column</span>
                  <span className="md:hidden">+</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </DndContext>

      {/* Create Column Modal */}
      {showCreateColumnModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-2">Add New Column</h2>
            <p className="text-sm text-gray-500 mb-4">
              {epic.columns.length < STATUS_COLUMN_COUNT
                ? 'This will be a status column (To Do → In Progress → Done).'
                : 'Columns beyond the first three are points columns — for notes only, not user stories.'}
            </p>
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
                  placeholder={
                    epic.columns.length < STATUS_COLUMN_COUNT
                      ? 'e.g., In Review'
                      : 'e.g., Sprint Points'
                  }
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
                  onClick={() => { setShowCreateColumnModal(false); setNewColumnName(''); }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Story Modal */}
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