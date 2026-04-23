import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { User, Calendar, Flag, MessageSquare, CheckSquare, MoreVertical, GripVertical } from 'lucide-react';
import { UserStory, Priority } from '../types/project';

interface UserStoryCardProps {
  story: UserStory;
  onEdit: () => void;
  onDelete: () => void;
}

export const UserStoryCard: React.FC<UserStoryCardProps> = ({
  story,
  onEdit,
  onDelete,
}) => {
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
    opacity: isDragging ? 0.5 : 1,
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

  const completedSubtasks = story.subtasks.filter(subtask => subtask.completed).length;
  const totalSubtasks = story.subtasks.length;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-2 flex-1">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded mt-1"
          >
            <GripVertical className="w-4 h-4 text-gray-400" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-gray-900 mb-1">{story.title}</h4>
            {story.description && (
              <p className="text-sm text-gray-600 line-clamp-2">{story.description}</p>
            )}
          </div>
        </div>
        <button className="p-1 hover:bg-gray-100 rounded">
          <MoreVertical className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(story.priority)}`}>
          <Flag className="w-3 h-3 inline mr-1" />
          {story.priority}
        </span>
      </div>

      <div className="space-y-2">
        {story.assignees.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User className="w-4 h-4" />
            <div className="flex -space-x-2">
              {story.assignees.slice(0, 3).map((assignee, index) => (
                <div
                  key={assignee.id}
                  className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-medium border-2 border-white"
                  title={assignee.name}
                >
                  {assignee.name.charAt(0).toUpperCase()}
                </div>
              ))}
              {story.assignees.length > 3 && (
                <div className="w-6 h-6 rounded-full bg-gray-500 text-white flex items-center justify-center text-xs font-medium border-2 border-white">
                  +{story.assignees.length - 3}
                </div>
              )}
            </div>
          </div>
        )}

        {story.dueDate && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>{story.dueDate.toLocaleDateString()}</span>
          </div>
        )}

        {totalSubtasks > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <CheckSquare className="w-4 h-4" />
            <span>{completedSubtasks}/{totalSubtasks} completed</span>
            <div className="flex-1 bg-gray-200 rounded-full h-1.5">
              <div 
                className="bg-green-600 h-1.5 rounded-full"
                style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {story.subtasks.some(subtask => subtask.comments.length > 0) && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MessageSquare className="w-4 h-4" />
            <span>
              {story.subtasks.reduce((acc, subtask) => acc + subtask.comments.length, 0)} comments
            </span>
          </div>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2">
        <button
          onClick={onEdit}
          className="flex-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          className="flex-1 px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
};
