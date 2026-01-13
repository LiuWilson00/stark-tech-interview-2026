'use client';

import { Task, TaskStatus, TaskPriority } from '@/types/task';
import { Badge, getStatusVariant, getPriorityVariant } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/utils/date';

interface TaskDetailCardProps {
  task: Task;
  isEditing: boolean;
  editForm: {
    title: string;
    description: string;
    priority: TaskPriority;
    status: TaskStatus;
  };
  submitting: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onUpdateForm: <K extends keyof TaskDetailCardProps['editForm']>(
    key: K,
    value: TaskDetailCardProps['editForm'][K]
  ) => void;
  onManageAssignees: () => void;
  onManageFollowers: () => void;
}

export function TaskDetailCard({
  task,
  isEditing,
  editForm,
  submitting,
  onEdit,
  onCancelEdit,
  onSave,
  onUpdateForm,
  onManageAssignees,
  onManageFollowers,
}: TaskDetailCardProps) {
  if (isEditing) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <TaskEditForm
          editForm={editForm}
          submitting={submitting}
          onUpdateForm={onUpdateForm}
          onSave={onSave}
          onCancel={onCancelEdit}
        />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
      {/* Title and Edit Button */}
      <div className="flex items-start justify-between mb-4">
        <h2
          className={`text-2xl font-semibold ${
            task.status === TaskStatus.COMPLETED
              ? 'line-through text-gray-400'
              : 'text-gray-900 dark:text-white'
          }`}
        >
          {task.title}
        </h2>
        <button onClick={onEdit} className="text-blue-600 hover:text-blue-700 text-sm">
          Edit
        </button>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Badge variant={getStatusVariant(task.status)}>{task.status}</Badge>
        <Badge variant={getPriorityVariant(task.priority)}>{task.priority}</Badge>
        {task.team && <Badge variant="info">{task.team.name}</Badge>}
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-gray-600 dark:text-gray-400 mb-4">{task.description}</p>
      )}

      {/* Metadata Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500 dark:text-gray-400">
        <div>
          <span className="font-medium">Created by:</span>
          <p>{task.creator?.name || 'Unknown'}</p>
        </div>
        <div>
          <span className="font-medium">Created at:</span>
          <p>{formatDateTime(task.createdAt)}</p>
        </div>
        {task.dueDate && (
          <div>
            <span className="font-medium">Due date:</span>
            <p>{formatDateTime(task.dueDate)}</p>
          </div>
        )}
        {task.completedAt && (
          <div>
            <span className="font-medium">Completed at:</span>
            <p>{formatDateTime(task.completedAt)}</p>
          </div>
        )}
      </div>

      {/* Assignees & Followers */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Assignees */}
        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Assignees</span>
            <button onClick={onManageAssignees} className="text-xs text-blue-600 hover:text-blue-700">
              Manage
            </button>
          </div>
          {task.assignees && task.assignees.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {task.assignees.map((assignee) => (
                <Badge key={assignee.id} variant={assignee.isCompleted ? 'success' : 'default'}>
                  {assignee.user?.name || 'Unknown'}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No assignees</p>
          )}
        </div>

        {/* Followers */}
        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Followers</span>
            <button onClick={onManageFollowers} className="text-xs text-blue-600 hover:text-blue-700">
              Manage
            </button>
          </div>
          {task.followers && task.followers.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {task.followers.map((follower) => (
                <Badge key={follower.id} variant="default">
                  {follower.user?.name || 'Unknown'}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No followers</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Inline edit form component
interface TaskEditFormProps {
  editForm: {
    title: string;
    description: string;
    priority: TaskPriority;
    status: TaskStatus;
  };
  submitting: boolean;
  onUpdateForm: <K extends keyof TaskEditFormProps['editForm']>(
    key: K,
    value: TaskEditFormProps['editForm'][K]
  ) => void;
  onSave: () => void;
  onCancel: () => void;
}

function TaskEditForm({ editForm, submitting, onUpdateForm, onSave, onCancel }: TaskEditFormProps) {
  return (
    <div className="space-y-4">
      <input
        type="text"
        value={editForm.title}
        onChange={(e) => onUpdateForm('title', e.target.value)}
        className="w-full text-xl font-semibold px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
      />
      <textarea
        value={editForm.description}
        onChange={(e) => onUpdateForm('description', e.target.value)}
        rows={3}
        placeholder="Description (optional)"
        className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
      />
      <div className="flex gap-4">
        <select
          value={editForm.status}
          onChange={(e) => onUpdateForm('status', e.target.value as TaskStatus)}
          className="px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          <option value={TaskStatus.PENDING}>Pending</option>
          <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
          <option value={TaskStatus.COMPLETED}>Completed</option>
        </select>
        <select
          value={editForm.priority}
          onChange={(e) => onUpdateForm('priority', e.target.value as TaskPriority)}
          className="px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          <option value={TaskPriority.LOW}>Low</option>
          <option value={TaskPriority.MEDIUM}>Medium</option>
          <option value={TaskPriority.HIGH}>High</option>
          <option value={TaskPriority.URGENT}>Urgent</option>
        </select>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onSave}
          disabled={submitting}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Saving...' : 'Save'}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 border rounded hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
