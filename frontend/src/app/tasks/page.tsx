'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTasksPage } from '@/hooks/use-tasks-page';
import { TaskView, TaskPriority } from '@/types/task';
import { Team } from '@/types/team';
import { TaskFilters } from '@/components/tasks/task-filters';
import { TaskCard } from '@/components/tasks/task-card';
import { AppHeader } from '@/components/layout/app-header';

export default function TasksPage() {
  const router = useRouter();
  const {
    // Auth
    isAuthenticated,
    _hasHydrated,
    // Data
    tasks,
    rawTasks,
    teams,
    teamMembers,
    // Loading
    tasksLoading,
    teamsLoading,
    isCreatingTeam,
    // Error
    error,
    setError,
    // Selection
    selectedTeamId,
    setSelectedTeamId,
    currentView,
    setCurrentView,
    // UI
    showTaskForm,
    setShowTaskForm,
    showTeamForm,
    setShowTeamForm,
    showFilters,
    setShowFilters,
    // Filters
    filters,
    updateFilter,
    clearFilters,
    // Task form
    taskForm,
    updateTaskForm,
    // Team form
    teamForm,
    updateTeamForm,
    // Actions
    createTask,
    completeTask,
    deleteTask,
    createTeam,
    // Helpers
    getViewTitle,
    getSelectedTeamName,
  } = useTasksPage();

  // Redirect if not authenticated
  useEffect(() => {
    if (_hasHydrated && !isAuthenticated) {
      router.push('/login');
    }
  }, [_hasHydrated, isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  const selectedTeamName = getSelectedTeamName();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AppHeader activeNav="tasks" />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          <Sidebar
            currentView={currentView}
            setCurrentView={setCurrentView}
            selectedTeamId={selectedTeamId}
            setSelectedTeamId={setSelectedTeamId}
            teams={teams}
            teamsLoading={teamsLoading}
            showTeamForm={showTeamForm}
            setShowTeamForm={setShowTeamForm}
            teamForm={teamForm}
            updateTeamForm={updateTeamForm}
            createTeam={createTeam}
            isCreatingTeam={isCreatingTeam}
          />

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              {/* Header */}
              <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  {getViewTitle()}
                  {selectedTeamName && (
                    <span className="text-gray-500 font-normal"> in {selectedTeamName}</span>
                  )}
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({tasks.length} {tasks.length === 1 ? 'task' : 'tasks'})
                  </span>
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`px-3 py-2 border rounded text-sm flex items-center gap-2 ${
                      showFilters
                        ? 'bg-blue-50 border-blue-300 text-blue-600'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <FilterIcon />
                    Filters
                  </button>
                  <button
                    onClick={() => setShowTaskForm(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                  >
                    + New Task
                  </button>
                </div>
              </div>

              {/* Filters Panel */}
              {showFilters && (
                <TaskFilters
                  statusFilter={filters.status}
                  priorityFilter={filters.priority}
                  sortField={filters.sortField}
                  sortOrder={filters.sortOrder}
                  searchQuery={filters.searchQuery}
                  dateField={filters.dateField}
                  startDate={filters.startDate}
                  endDate={filters.endDate}
                  creatorId={filters.creatorId}
                  assigneeId={filters.assigneeId}
                  teamMembers={teamMembers}
                  onStatusChange={(v) => updateFilter('status', v)}
                  onPriorityChange={(v) => updateFilter('priority', v)}
                  onSortFieldChange={(v) => updateFilter('sortField', v)}
                  onSortOrderChange={(v) => updateFilter('sortOrder', v)}
                  onSearchChange={(v) => updateFilter('searchQuery', v)}
                  onDateFieldChange={(v) => updateFilter('dateField', v)}
                  onStartDateChange={(v) => updateFilter('startDate', v)}
                  onEndDateChange={(v) => updateFilter('endDate', v)}
                  onCreatorChange={(v) => updateFilter('creatorId', v)}
                  onAssigneeChange={(v) => updateFilter('assigneeId', v)}
                  onClearFilters={clearFilters}
                />
              )}

              {/* Task Form */}
              {showTaskForm && (
                <TaskForm
                  taskForm={taskForm}
                  updateTaskForm={updateTaskForm}
                  onSubmit={createTask}
                  onCancel={() => {
                    setShowTaskForm(false);
                    setError('');
                  }}
                  error={error}
                />
              )}

              {/* Task List */}
              <TaskList
                tasks={tasks}
                rawTasksCount={rawTasks.length}
                loading={tasksLoading}
                onComplete={completeTask}
                onDelete={deleteTask}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

interface SidebarProps {
  currentView: TaskView;
  setCurrentView: (view: TaskView) => void;
  selectedTeamId: string | null;
  setSelectedTeamId: (id: string | null) => void;
  teams: Team[] | undefined;
  teamsLoading: boolean;
  showTeamForm: boolean;
  setShowTeamForm: (show: boolean) => void;
  teamForm: { name: string; description: string };
  updateTeamForm: <K extends 'name' | 'description'>(key: K, value: string) => void;
  createTeam: (e: React.FormEvent) => void;
  isCreatingTeam: boolean;
}

function Sidebar({
  currentView,
  setCurrentView,
  selectedTeamId,
  setSelectedTeamId,
  teams,
  teamsLoading,
  showTeamForm,
  setShowTeamForm,
  teamForm,
  updateTeamForm,
  createTeam,
  isCreatingTeam,
}: SidebarProps) {
  return (
    <div className="w-64 flex-shrink-0 space-y-4">
      {/* Views */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Views</h2>
        <div className="space-y-1">
          <ViewButton
            icon={<ListIcon />}
            label="All Tasks"
            isActive={currentView === TaskView.ALL}
            onClick={() => setCurrentView(TaskView.ALL)}
          />
          <ViewButton
            icon={<UserIcon />}
            label="My Tasks"
            isActive={currentView === TaskView.MY_TASKS}
            onClick={() => setCurrentView(TaskView.MY_TASKS)}
          />
          <ViewButton
            icon={<ClipboardIcon />}
            label="Assigned to Me"
            isActive={currentView === TaskView.ASSIGNED}
            onClick={() => setCurrentView(TaskView.ASSIGNED)}
          />
          <ViewButton
            icon={<EyeIcon />}
            label="Following"
            isActive={currentView === TaskView.FOLLOWING}
            onClick={() => setCurrentView(TaskView.FOLLOWING)}
          />
          <ViewButton
            icon={<CheckCircleIcon />}
            label="Completed"
            isActive={currentView === TaskView.COMPLETED}
            onClick={() => setCurrentView(TaskView.COMPLETED)}
          />
        </div>
      </div>

      {/* Teams */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold text-gray-900 dark:text-white">Teams</h2>
          <button
            onClick={() => setShowTeamForm(true)}
            className="text-blue-600 hover:text-blue-700 text-sm"
          >
            + New
          </button>
        </div>

        {showTeamForm && (
          <form onSubmit={createTeam} className="mb-4 space-y-2">
            <input
              type="text"
              value={teamForm.name}
              onChange={(e) => updateTeamForm('name', e.target.value)}
              placeholder="Team name"
              className="w-full px-3 py-2 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <input
              type="text"
              value={teamForm.description}
              onChange={(e) => updateTeamForm('description', e.target.value)}
              placeholder="Description (optional)"
              className="w-full px-3 py-2 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isCreatingTeam}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setShowTeamForm(false)}
                className="px-3 py-1 text-sm border rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="space-y-1">
          <TeamButton
            label="All Teams"
            isActive={selectedTeamId === null}
            onClick={() => setSelectedTeamId(null)}
          />
          {teamsLoading ? (
            <p className="px-3 py-2 text-sm text-gray-500">Loading...</p>
          ) : (
            teams?.map((team: Team) => (
              <TeamButton
                key={team.id}
                label={team.name}
                isActive={selectedTeamId === team.id}
                onClick={() => setSelectedTeamId(team.id)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

interface TaskFormState {
  title: string;
  description: string;
  priority: TaskPriority;
}

interface TaskFormProps {
  taskForm: TaskFormState;
  updateTaskForm: <K extends keyof TaskFormState>(key: K, value: TaskFormState[K]) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  error: string;
}

function TaskForm({ taskForm, updateTaskForm, onSubmit, onCancel, error }: TaskFormProps) {
  return (
    <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
      <form onSubmit={onSubmit} className="space-y-4">
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <input
          type="text"
          value={taskForm.title}
          onChange={(e) => updateTaskForm('title', e.target.value)}
          placeholder="Task title"
          className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          autoFocus
        />
        <textarea
          value={taskForm.description}
          onChange={(e) => updateTaskForm('description', e.target.value)}
          placeholder="Description (optional)"
          rows={2}
          className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
        <div className="flex gap-4 items-center">
          <select
            value={taskForm.priority}
            onChange={(e) => updateTaskForm('priority', e.target.value as TaskPriority)}
            className="px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value={TaskPriority.LOW}>Low</option>
            <option value={TaskPriority.MEDIUM}>Medium</option>
            <option value={TaskPriority.HIGH}>High</option>
            <option value={TaskPriority.URGENT}>Urgent</option>
          </select>
          <div className="flex gap-2 ml-auto">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Create Task
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

interface TaskListProps {
  tasks: import('@/types/task').Task[];
  rawTasksCount: number;
  loading: boolean;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
}

function TaskList({ tasks, rawTasksCount, loading, onComplete, onDelete }: TaskListProps) {
  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading tasks...</div>;
  }

  if (rawTasksCount === 0) {
    return (
      <div className="p-8 text-center text-gray-500">No tasks yet. Create your first task!</div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        No tasks match your filters. Try adjusting your search criteria.
      </div>
    );
  }

  return (
    <div className="divide-y dark:divide-gray-700">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} onComplete={onComplete} onDelete={onDelete} />
      ))}
    </div>
  );
}

// =============================================================================
// Button Components
// =============================================================================

interface ViewButtonProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

function ViewButton({ icon, label, isActive, onClick }: ViewButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2 rounded text-sm flex items-center gap-2 ${
        isActive
          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

interface TeamButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

function TeamButton({ label, isActive, onClick }: TeamButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2 rounded text-sm ${
        isActive
          ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'
          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
      }`}
    >
      {label}
    </button>
  );
}

// =============================================================================
// Icons
// =============================================================================

function FilterIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
      />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
      />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}
