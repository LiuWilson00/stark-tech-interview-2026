'use client';

import Link from 'next/link';
import { TaskStatus } from '@/types/task';

interface TaskDetailHeaderProps {
  status: TaskStatus;
  onComplete: () => void;
  onDelete: () => void;
}

export function TaskDetailHeader({ status, onComplete, onDelete }: TaskDetailHeaderProps) {
  return (
    <header className="bg-white dark:bg-gray-800 shadow">
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/tasks" className="text-gray-500 hover:text-gray-700 dark:text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Task Details</h1>
        </div>
        <div className="flex items-center gap-2">
          {status !== TaskStatus.COMPLETED && (
            <button
              onClick={onComplete}
              className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700"
            >
              Complete
            </button>
          )}
          <button
            onClick={onDelete}
            className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </header>
  );
}
