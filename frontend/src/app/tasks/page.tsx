'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { useTeams, useCreateTeam, useTeamMembers } from '@/hooks/use-teams';
import { getErrorMessage } from '@/lib/utils/error';
import { tasksApi } from '@/lib/api/tasks';
import { Task, TaskStatus, TaskPriority, TaskView, CreateTaskRequest, DateFieldType } from '@/types/task';
import { Team } from '@/types/team';
import { TaskFilters, SortField, SortOrder } from '@/components/tasks/task-filters';
import { TaskCard } from '@/components/tasks/task-card';
import { AppHeader } from '@/components/layout/app-header';

export default function TasksPage() {
  const router = useRouter();
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  const { data: teams, isLoading: teamsLoading } = useTeams();
  const createTeamMutation = useCreateTeam();

  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<TaskView>(TaskView.ALL);
  const { data: teamMembers = [] } = useTeamMembers(selectedTeamId || '');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');
  const [error, setError] = useState('');

  // Filter and sort state
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateField, setDateField] = useState<DateFieldType>('createdAt');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [creatorId, setCreatorId] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Redirect if not authenticated (wait for hydration first)
  useEffect(() => {
    if (_hasHydrated && !isAuthenticated) {
      router.push('/login');
    }
  }, [_hasHydrated, isAuthenticated, router]);

  // Load tasks when team, view, or filters change
  useEffect(() => {
    const loadTasks = async () => {
      setTasksLoading(true);
      try {
        const params: Record<string, string> = {};
        if (selectedTeamId) params.teamId = selectedTeamId;
        params.view = currentView;
        if (statusFilter !== 'all') params.status = statusFilter;
        if (dateField) params.dateField = dateField;
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        if (creatorId) params.creatorId = creatorId;
        if (assigneeId) params.assigneeId = assigneeId;
        // Map frontend sortField to backend sortBy
        const backendSortBy = ['createdAt', 'dueDate', 'id', 'creator'].includes(sortField) ? sortField : 'createdAt';
        params.sortBy = backendSortBy;
        params.sortOrder = sortOrder.toUpperCase();

        const response = await tasksApi.getTasks(params);
        setTasks(response.data.items || []);
      } catch (err) {
        console.error('Failed to load tasks:', err);
        setTasks([]);
      } finally {
        setTasksLoading(false);
      }
    };

    if (isAuthenticated) {
      loadTasks();
    }
  }, [selectedTeamId, currentView, isAuthenticated, statusFilter, dateField, startDate, endDate, creatorId, assigneeId, sortField, sortOrder]);

  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter((task) => task.status === statusFilter);
    }

    // Apply priority filter
    if (priorityFilter !== 'all') {
      result = result.filter((task) => task.priority === priorityFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (task) =>
          task.title.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'priority':
          comparison = (priorityOrder[a.priority] || 0) - (priorityOrder[b.priority] || 0);
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'updatedAt':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
        case 'dueDate':
          if (!a.dueDate && !b.dueDate) comparison = 0;
          else if (!a.dueDate) comparison = 1;
          else if (!b.dueDate) comparison = -1;
          else comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [tasks, statusFilter, priorityFilter, searchQuery, sortField, sortOrder]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newTaskTitle.trim()) {
      setError('Task title is required');
      return;
    }

    try {
      const taskData: CreateTaskRequest = {
        title: newTaskTitle,
        description: newTaskDescription || undefined,
        priority: newTaskPriority,
        teamId: selectedTeamId || undefined,
      } as CreateTaskRequest;

      const response = await tasksApi.createTask(taskData);
      setTasks([response.data, ...tasks]);
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskPriority(TaskPriority.MEDIUM);
      setShowTaskForm(false);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to create task'));
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newTeamName.trim()) {
      setError('Team name is required');
      return;
    }

    try {
      await createTeamMutation.mutateAsync({
        name: newTeamName,
        description: newTeamDescription || undefined,
      });
      setNewTeamName('');
      setNewTeamDescription('');
      setShowTeamForm(false);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to create team'));
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      await tasksApi.completeTask(taskId);
      setTasks(tasks.map(t =>
        t.id === taskId ? { ...t, status: TaskStatus.COMPLETED } : t
      ));
    } catch (err) {
      console.error('Failed to complete task:', err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      await tasksApi.deleteTask(taskId);
      setTasks(tasks.filter(t => t.id !== taskId));
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  const handleClearFilters = () => {
    setStatusFilter('all');
    setPriorityFilter('all');
    setSearchQuery('');
    setDateField('createdAt');
    setStartDate('');
    setEndDate('');
    setCreatorId('');
    setAssigneeId('');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AppHeader activeNav="tasks" />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar - Views & Teams */}
          <div className="w-64 flex-shrink-0 space-y-4">
            {/* Task Views */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Views</h2>
              <div className="space-y-1">
                <button
                  onClick={() => setCurrentView(TaskView.ALL)}
                  className={`w-full text-left px-3 py-2 rounded text-sm flex items-center gap-2 ${
                    currentView === TaskView.ALL
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  All Tasks
                </button>
                <button
                  onClick={() => setCurrentView(TaskView.MY_TASKS)}
                  className={`w-full text-left px-3 py-2 rounded text-sm flex items-center gap-2 ${
                    currentView === TaskView.MY_TASKS
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  My Tasks
                </button>
                <button
                  onClick={() => setCurrentView(TaskView.ASSIGNED)}
                  className={`w-full text-left px-3 py-2 rounded text-sm flex items-center gap-2 ${
                    currentView === TaskView.ASSIGNED
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Assigned to Me
                </button>
                <button
                  onClick={() => setCurrentView(TaskView.FOLLOWING)}
                  className={`w-full text-left px-3 py-2 rounded text-sm flex items-center gap-2 ${
                    currentView === TaskView.FOLLOWING
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Following
                </button>
                <button
                  onClick={() => setCurrentView(TaskView.COMPLETED)}
                  className={`w-full text-left px-3 py-2 rounded text-sm flex items-center gap-2 ${
                    currentView === TaskView.COMPLETED
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Completed
                </button>
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

              {/* Team Form */}
              {showTeamForm && (
                <form onSubmit={handleCreateTeam} className="mb-4 space-y-2">
                  <input
                    type="text"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    placeholder="Team name"
                    className="w-full px-3 py-2 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                  <input
                    type="text"
                    value={newTeamDescription}
                    onChange={(e) => setNewTeamDescription(e.target.value)}
                    placeholder="Description (optional)"
                    className="w-full px-3 py-2 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={createTeamMutation.isPending}
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

              {/* Team List */}
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedTeamId(null)}
                  className={`w-full text-left px-3 py-2 rounded text-sm ${
                    selectedTeamId === null
                      ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  All Teams
                </button>

                {teamsLoading ? (
                  <p className="px-3 py-2 text-sm text-gray-500">Loading...</p>
                ) : (
                  teams?.map((team: Team) => (
                    <button
                      key={team.id}
                      onClick={() => setSelectedTeamId(team.id)}
                      className={`w-full text-left px-3 py-2 rounded text-sm ${
                        selectedTeamId === team.id
                          ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {team.name}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Main Content - Tasks */}
          <div className="flex-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  {currentView === TaskView.ALL && 'All Tasks'}
                  {currentView === TaskView.MY_TASKS && 'My Tasks'}
                  {currentView === TaskView.ASSIGNED && 'Assigned to Me'}
                  {currentView === TaskView.FOLLOWING && 'Following'}
                  {currentView === TaskView.COMPLETED && 'Completed'}
                  {selectedTeamId && (
                    <span className="text-gray-500 font-normal"> in {teams?.find((t: Team) => t.id === selectedTeamId)?.name}</span>
                  )}
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'})
                  </span>
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`px-3 py-2 border rounded text-sm flex items-center gap-2 ${
                      showFilters ? 'bg-blue-50 border-blue-300 text-blue-600' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
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

              {/* Task Filters */}
              {showFilters && (
                <TaskFilters
                  statusFilter={statusFilter}
                  priorityFilter={priorityFilter}
                  sortField={sortField}
                  sortOrder={sortOrder}
                  searchQuery={searchQuery}
                  dateField={dateField}
                  startDate={startDate}
                  endDate={endDate}
                  creatorId={creatorId}
                  assigneeId={assigneeId}
                  teamMembers={teamMembers}
                  onStatusChange={setStatusFilter}
                  onPriorityChange={setPriorityFilter}
                  onSortFieldChange={setSortField}
                  onSortOrderChange={setSortOrder}
                  onSearchChange={setSearchQuery}
                  onDateFieldChange={setDateField}
                  onStartDateChange={setStartDate}
                  onEndDateChange={setEndDate}
                  onCreatorChange={setCreatorId}
                  onAssigneeChange={setAssigneeId}
                  onClearFilters={handleClearFilters}
                />
              )}

              {/* Task Form */}
              {showTaskForm && (
                <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <form onSubmit={handleCreateTask} className="space-y-4">
                    {error && (
                      <div className="text-red-600 text-sm">{error}</div>
                    )}
                    <input
                      type="text"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder="Task title"
                      className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      autoFocus
                    />
                    <textarea
                      value={newTaskDescription}
                      onChange={(e) => setNewTaskDescription(e.target.value)}
                      placeholder="Description (optional)"
                      rows={2}
                      className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                    <div className="flex gap-4 items-center">
                      <select
                        value={newTaskPriority}
                        onChange={(e) => setNewTaskPriority(e.target.value as TaskPriority)}
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
                          onClick={() => {
                            setShowTaskForm(false);
                            setError('');
                          }}
                          className="px-4 py-2 border rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              )}

              {/* Task List */}
              <div className="divide-y dark:divide-gray-700">
                {tasksLoading ? (
                  <div className="p-8 text-center text-gray-500">Loading tasks...</div>
                ) : tasks.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    No tasks yet. Create your first task!
                  </div>
                ) : filteredTasks.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    No tasks match your filters. Try adjusting your search criteria.
                  </div>
                ) : (
                  filteredTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onComplete={handleCompleteTask}
                      onDelete={handleDeleteTask}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
