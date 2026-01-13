'use client';

import { TaskStatus, TaskPriority, DateFieldType } from '@/types/task';
import { TeamMember } from '@/types/team';

export type SortField = 'createdAt' | 'updatedAt' | 'priority' | 'dueDate' | 'title' | 'creator' | 'id';
export type SortOrder = 'asc' | 'desc';

interface TaskFiltersProps {
  statusFilter: TaskStatus | 'all';
  priorityFilter: TaskPriority | 'all';
  sortField: SortField;
  sortOrder: SortOrder;
  searchQuery: string;
  // New filter props
  dateField: DateFieldType;
  startDate: string;
  endDate: string;
  creatorId: string;
  assigneeId: string;
  teamMembers: TeamMember[];
  // Handlers
  onStatusChange: (status: TaskStatus | 'all') => void;
  onPriorityChange: (priority: TaskPriority | 'all') => void;
  onSortFieldChange: (field: SortField) => void;
  onSortOrderChange: (order: SortOrder) => void;
  onSearchChange: (query: string) => void;
  onDateFieldChange: (field: DateFieldType) => void;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onCreatorChange: (creatorId: string) => void;
  onAssigneeChange: (assigneeId: string) => void;
  onClearFilters: () => void;
}

export function TaskFilters({
  statusFilter,
  priorityFilter,
  sortField,
  sortOrder,
  searchQuery,
  dateField,
  startDate,
  endDate,
  creatorId,
  assigneeId,
  teamMembers,
  onStatusChange,
  onPriorityChange,
  onSortFieldChange,
  onSortOrderChange,
  onSearchChange,
  onDateFieldChange,
  onStartDateChange,
  onEndDateChange,
  onCreatorChange,
  onAssigneeChange,
  onClearFilters,
}: TaskFiltersProps) {
  const hasActiveFilters =
    statusFilter !== 'all' ||
    priorityFilter !== 'all' ||
    searchQuery ||
    startDate ||
    endDate ||
    creatorId ||
    assigneeId;

  return (
    <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900 space-y-4">
      {/* Search */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search tasks..."
          className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* Filters Row 1: Status, Priority */}
      <div className="flex flex-wrap gap-4 items-center">
        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 dark:text-gray-400">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value as TaskStatus | 'all')}
            className="px-3 py-1.5 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="all">All</option>
            <option value={TaskStatus.PENDING}>Pending</option>
            <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
            <option value={TaskStatus.COMPLETED}>Completed</option>
          </select>
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 dark:text-gray-400">Priority:</label>
          <select
            value={priorityFilter}
            onChange={(e) => onPriorityChange(e.target.value as TaskPriority | 'all')}
            className="px-3 py-1.5 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="all">All</option>
            <option value={TaskPriority.URGENT}>Urgent</option>
            <option value={TaskPriority.HIGH}>High</option>
            <option value={TaskPriority.MEDIUM}>Medium</option>
            <option value={TaskPriority.LOW}>Low</option>
          </select>
        </div>

        {/* Creator Filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 dark:text-gray-400">Creator:</label>
          <select
            value={creatorId}
            onChange={(e) => onCreatorChange(e.target.value)}
            className="px-3 py-1.5 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="">All</option>
            {teamMembers.map((member) => (
              <option key={member.userId} value={member.userId}>
                {member.user.name}
              </option>
            ))}
          </select>
        </div>

        {/* Assignee Filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 dark:text-gray-400">Assignee:</label>
          <select
            value={assigneeId}
            onChange={(e) => onAssigneeChange(e.target.value)}
            className="px-3 py-1.5 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="">All</option>
            {teamMembers.map((member) => (
              <option key={member.userId} value={member.userId}>
                {member.user.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Filters Row 2: Date Range */}
      <div className="flex flex-wrap gap-4 items-center">
        {/* Date Field Selector */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 dark:text-gray-400">Date Field:</label>
          <select
            value={dateField}
            onChange={(e) => onDateFieldChange(e.target.value as DateFieldType)}
            className="px-3 py-1.5 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="createdAt">Created Date</option>
            <option value="dueDate">Due Date</option>
            <option value="completedAt">Completed Date</option>
            <option value="updatedAt">Updated Date</option>
          </select>
        </div>

        {/* Date Range */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 dark:text-gray-400">Range:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="px-3 py-1.5 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="From"
          />
          <span className="text-gray-400">-</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="px-3 py-1.5 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="To"
          />
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear Filters
          </button>
        )}

        {/* Sort Options */}
        <div className="flex items-center gap-2 ml-auto">
          <label className="text-sm text-gray-600 dark:text-gray-400">Sort by:</label>
          <select
            value={sortField}
            onChange={(e) => onSortFieldChange(e.target.value as SortField)}
            className="px-3 py-1.5 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="createdAt">Created Date</option>
            <option value="dueDate">Due Date</option>
            <option value="creator">Creator</option>
            <option value="id">Task ID</option>
            <option value="priority">Priority</option>
            <option value="title">Title</option>
          </select>
          <button
            onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="p-1.5 border rounded hover:bg-gray-100 dark:hover:bg-gray-700 dark:border-gray-600"
            title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
          >
            {sortOrder === 'asc' ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Compact version for mobile or smaller screens
export function TaskFiltersCompact({
  statusFilter,
  priorityFilter,
  onStatusChange,
  onPriorityChange,
}: Pick<TaskFiltersProps, 'statusFilter' | 'priorityFilter' | 'onStatusChange' | 'onPriorityChange'>) {
  return (
    <div className="flex gap-2 p-2 overflow-x-auto">
      {/* Status Pills */}
      <div className="flex gap-1">
        {(['all', TaskStatus.PENDING, TaskStatus.IN_PROGRESS, TaskStatus.COMPLETED] as const).map((status) => (
          <button
            key={status}
            onClick={() => onStatusChange(status)}
            className={`px-3 py-1 text-xs rounded-full whitespace-nowrap ${
              statusFilter === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            {status === 'all' ? 'All' : status.replace('_', ' ')}
          </button>
        ))}
      </div>
    </div>
  );
}
