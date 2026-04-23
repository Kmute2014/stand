import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Plus, MoreVertical } from 'lucide-react';
import { KanbanColumn, UserStory } from '../types/project';
import { UserStoryCard } from './UserStoryCard';

interface SortableColumnProps {
  column: KanbanColumn;
  onAddStory: () => void;
  onEditStory: (story: UserStory) => void;
  onDeleteStory: (storyId: string) => void;
}

export const SortableColumn: React.FC<SortableColumnProps> = ({
  column,
  onAddStory,
  onEditStory,
  onDeleteStory,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id });

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: column.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="w-72 md:w-80 flex-shrink-0"
    >
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded"
              >
                <div className="w-1 h-6 bg-gray-400 rounded"></div>
              </div>
              <h3 className="font-semibold text-gray-900">{column.name}</h3>
              <span className="text-sm text-gray-500">({column.userStories.length})</span>
            </div>
            <button className="p-1 hover:bg-gray-100 rounded">
              <MoreVertical className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          <button
            onClick={onAddStory}
            className="w-full flex items-center justify-center gap-2 p-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-600 text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add User Story
          </button>
        </div>

        <div
          ref={setDroppableRef}
          className={`flex-1 p-4 overflow-y-auto min-h-[400px] transition-colors ${isOver ? 'bg-blue-50 border-2 border-dashed border-blue-400' : ''
            }`}
        >
          <div className="space-y-3">
            {column.userStories.map((story) => (
              <UserStoryCard
                key={story.id}
                story={story}
                onEdit={() => onEditStory(story)}
                onDelete={() => onDeleteStory(story.id)}
              />
            ))}
          </div>

          {column.userStories.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <div className="text-sm">No user stories yet</div>
              <div className="text-xs mt-1">Click "Add User Story" to create one</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
