'use client';

import Link from 'next/link';
import { Task, TaskStatus } from '@/types/task';
import { Badge, getStatusVariant, getPriorityVariant } from '@/components/ui/badge';

interface TaskCardProps {
  task: Task;
  onComplete: (taskId: string) => void;
  onDelete: (taskId: string) => void;
}

export function TaskCard({ task, onComplete, onDelete }: TaskCardProps) {
  const isCompleted = task.status === TaskStatus.COMPLETED;

  return (
    <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-start gap-4">
      {/* Complete Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onComplete(task.id);
        }}
        disabled={isCompleted}
        className={`mt-1 w-5 h-5 rounded-full border-2 flex-shrink-0 ${
          isCompleted
            ? 'bg-green-500 border-green-500 text-white'
            : 'border-gray-300 hover:border-green-500'
        }`}
        aria-label={isCompleted ? 'Completed' : 'Mark as complete'}
      >
        {isCompleted && (
          <svg className="w-full h-full" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </button>

      {/* Task Content */}
      <Link href={`/tasks/${task.id}`} className="flex-1 min-w-0 cursor-pointer">
        <div className="flex items-center gap-2 mb-1">
          <h3
            className={`font-medium ${
              isCompleted
                ? 'text-gray-400 line-through'
                : 'text-gray-900 dark:text-white'
            }`}
          >
            {task.title}
          </h3>
          <Badge variant={getPriorityVariant(task.priority)}>{task.priority}</Badge>
          <Badge variant={getStatusVariant(task.status)}>{task.status}</Badge>
        </div>
        {task.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
            {task.description}
          </p>
        )}
        <p className="text-xs text-gray-400 mt-1">
          Created {new Date(task.createdAt).toLocaleDateString()}
          {task.dueDate && (
            <span className="ml-2">
              Due {new Date(task.dueDate).toLocaleDateString()}
            </span>
          )}
        </p>
      </Link>

      {/* Delete Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(task.id);
        }}
        className="text-red-500 hover:text-red-700 text-sm"
        aria-label="Delete task"
      >
        Delete
      </button>
    </div>
  );
}
