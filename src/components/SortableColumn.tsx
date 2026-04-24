import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Plus, MoreVertical } from 'lucide-react';
import { KanbanColumn, UserStory } from '../types/project';
import { UserStoryCard } from './UserStoryCard';

const STATUS_COLUMN_COUNT = 3; // must match EpicKanbanBoard

interface SortableColumnProps {
  column: KanbanColumn;
  onAddStory: () => void;
  onEditStory: (story: UserStory) => void;
  onDeleteStory: (storyId: string) => void;
  onMoveStoryToPreviousColumn?: (storyId: string) => void;
  onMoveStoryToNextColumn?: (storyId: string) => void;
  allColumns: KanbanColumn[];
  columnIndex: number;
}

export const SortableColumn: React.FC<SortableColumnProps> = ({
  column,
  onAddStory,
  onEditStory,
  onDeleteStory,
  onMoveStoryToPreviousColumn,
  onMoveStoryToNextColumn,
  allColumns,
  columnIndex,
}) => {
  const [newPoint, setNewPoint] = useState('');
  const [points, setPoints] = useState<string[]>([]);

  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id });

  // Give the droppable a unique id distinct from the sortable id to avoid
  // conflicts when dnd-kit resolves over targets.
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: column.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isStatusColumn = columnIndex < STATUS_COLUMN_COUNT;

  // Previous column exists and is a status column
  const canMoveToPrevious = columnIndex > 0 && columnIndex < STATUS_COLUMN_COUNT;
  // Next column exists and is still within the status range
  const canMoveToNext = columnIndex >= 0 && columnIndex < STATUS_COLUMN_COUNT - 1;

  // ── Points column helpers ─────────────────────────────────────────────────

  const handleAddPoint = () => {
    if (newPoint.trim()) {
      setPoints(prev => [...prev, newPoint.trim()]);
      setNewPoint('');
    }
  };

  const handlePointKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddPoint();
    }
  };

  const handleDeletePoint = (index: number) => {
    setPoints(prev => prev.filter((_, i) => i !== index));
  };

  // ── Status column colours ─────────────────────────────────────────────────

  const statusTopBorder: Record<number, string> = {
    0: 'border-t-gray-400',
    1: 'border-t-blue-400',
    2: 'border-t-green-400',
  };

  // ── STATUS COLUMN (0 · 1 · 2) ─────────────────────────────────────────────

  if (isStatusColumn) {
    return (
      <div
        ref={setSortableRef}
        style={style}
        className="w-72 md:w-80 flex-shrink-0"
      >
        <div
          className={`bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col border-t-4 ${statusTopBorder[columnIndex] ?? 'border-t-gray-300'
            }`}
          style={{ minHeight: '500px' }}
        >
          {/* Column header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {/* Drag handle for column reordering */}
                <div
                  {...attributes}
                  {...listeners}
                  className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded touch-none"
                  style={{ touchAction: 'none' }}
                >
                  <div className="w-1 h-5 bg-gray-400 rounded" />
                </div>
                <h3 className="font-semibold text-gray-900">{column.name}</h3>
                <span className="text-sm text-gray-500">({column.userStories.length})</span>
              </div>
              <button className="p-1 hover:bg-gray-100 rounded">
                <MoreVertical className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Only the first status column shows "Add User Story" */}
            {columnIndex === 0 && (
              <button
                onClick={onAddStory}
                className="w-full flex items-center justify-center gap-2 p-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-600 text-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add User Story
              </button>
            )}
          </div>

          {/* Drop zone — this ref is what dnd-kit's useDroppable registers */}
          <div
            ref={setDroppableRef}
            className={`flex-1 p-4 overflow-y-auto transition-colors rounded-b-lg ${isOver ? 'bg-blue-50 ring-2 ring-inset ring-blue-400' : ''
              }`}
            style={{ minHeight: '400px' }}
          >
            <div className="space-y-3">
              {column.userStories.map((story) => (
                <UserStoryCard
                  key={story.id}
                  story={story}
                  onEdit={() => onEditStory(story)}
                  onDelete={() => onDeleteStory(story.id)}
                  onMoveToPreviousColumn={
                    canMoveToPrevious
                      ? () => onMoveStoryToPreviousColumn?.(story.id)
                      : undefined
                  }
                  onMoveToNextColumn={
                    canMoveToNext
                      ? () => onMoveStoryToNextColumn?.(story.id)
                      : undefined
                  }
                  canMoveToPrevious={canMoveToPrevious}
                  canMoveToNext={canMoveToNext}
                />
              ))}
            </div>

            {column.userStories.length === 0 && (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                <div className="text-sm">
                  {columnIndex === 0 ? 'No user stories yet' : 'Drop stories here'}
                </div>
                {columnIndex === 0 && (
                  <div className="text-xs mt-1">Click "Add User Story" above</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── POINTS COLUMN (index ≥ 3) ─────────────────────────────────────────────

  return (
    <div
      ref={setSortableRef}
      style={style}
      className="w-72 md:w-80 flex-shrink-0"
    >
      <div
        className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col border-t-4 border-t-purple-400"
        style={{ minHeight: '500px' }}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded touch-none"
                style={{ touchAction: 'none' }}
              >
                <div className="w-1 h-5 bg-gray-400 rounded" />
              </div>
              <h3 className="font-semibold text-gray-900">{column.name}</h3>
              <span className="text-sm text-gray-500">({points.length})</span>
            </div>
            <button className="p-1 hover:bg-gray-100 rounded">
              <MoreVertical className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          <p className="text-xs text-purple-500 mt-1 ml-7">Notes / points only</p>
        </div>

        {/* Points body */}
        <div className="flex-1 p-4 flex flex-col gap-3 overflow-y-auto">
          {/* Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newPoint}
              onChange={(e) => setNewPoint(e.target.value)}
              onKeyDown={handlePointKeyDown}
              placeholder="Add a point… (Enter to save)"
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
            <button
              onClick={handleAddPoint}
              className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Points list */}
          <div className="space-y-2">
            {points.map((point, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 bg-purple-50 border border-purple-100 rounded-lg px-3 py-2 text-sm text-gray-800"
              >
                <span className="flex-1 leading-snug">{point}</span>
                <button
                  onClick={() => handleDeletePoint(idx)}
                  className="text-gray-400 hover:text-red-500 transition-colors shrink-0 mt-0.5 text-base leading-none"
                  title="Remove"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {points.length === 0 && (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
              No points yet — type above and press Enter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};