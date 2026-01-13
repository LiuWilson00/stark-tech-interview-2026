import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useTeams, useCreateTeam, useTeamMembers } from '@/hooks/use-teams';
import { tasksApi } from '@/lib/api/tasks';
import { getErrorMessage } from '@/lib/utils/error';
import {
  Task,
  TaskStatus,
  TaskPriority,
  TaskView,
  CreateTaskRequest,
  DateFieldType,
} from '@/types/task';
import { Team } from '@/types/team';
import { SortField, SortOrder } from '@/components/tasks/task-filters';

// ============================================================================
// Types
// ============================================================================

interface FilterState {
  status: TaskStatus | 'all';
  priority: TaskPriority | 'all';
  sortField: SortField;
  sortOrder: SortOrder;
  searchQuery: string;
  dateField: DateFieldType;
  startDate: string;
  endDate: string;
  creatorId: string;
  assigneeId: string;
}

interface TaskFormState {
  title: string;
  description: string;
  priority: TaskPriority;
}

interface TeamFormState {
  name: string;
  description: string;
}

const initialFilterState: FilterState = {
  status: 'all',
  priority: 'all',
  sortField: 'createdAt',
  sortOrder: 'desc',
  searchQuery: '',
  dateField: 'createdAt',
  startDate: '',
  endDate: '',
  creatorId: '',
  assigneeId: '',
};

const initialTaskFormState: TaskFormState = {
  title: '',
  description: '',
  priority: TaskPriority.MEDIUM,
};

const initialTeamFormState: TeamFormState = {
  name: '',
  description: '',
};

// ============================================================================
// Hook
// ============================================================================

export function useTasksPage() {
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  const { data: teams, isLoading: teamsLoading } = useTeams();
  const createTeamMutation = useCreateTeam();

  // Core state
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<TaskView>(TaskView.ALL);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [error, setError] = useState('');

  // UI state
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Filter state
  const [filters, setFilters] = useState<FilterState>(initialFilterState);

  // Form state
  const [taskForm, setTaskForm] = useState<TaskFormState>(initialTaskFormState);
  const [teamForm, setTeamForm] = useState<TeamFormState>(initialTeamFormState);

  // Team members for filter dropdown
  const { data: teamMembers = [] } = useTeamMembers(selectedTeamId || '');

  // ---------------------------------------------------------------------------
  // Load tasks when dependencies change
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const loadTasks = async () => {
      setTasksLoading(true);
      try {
        const params: Record<string, string> = {
          view: currentView,
        };

        if (selectedTeamId) params.teamId = selectedTeamId;
        if (filters.status !== 'all') params.status = filters.status;
        if (filters.dateField) params.dateField = filters.dateField;
        if (filters.startDate) params.startDate = filters.startDate;
        if (filters.endDate) params.endDate = filters.endDate;
        if (filters.creatorId) params.creatorId = filters.creatorId;
        if (filters.assigneeId) params.assigneeId = filters.assigneeId;

        // Map frontend sortField to backend sortBy
        const backendSortBy = ['createdAt', 'dueDate', 'id', 'creator'].includes(filters.sortField)
          ? filters.sortField
          : 'createdAt';
        params.sortBy = backendSortBy;
        params.sortOrder = filters.sortOrder.toUpperCase();

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
  }, [
    selectedTeamId,
    currentView,
    isAuthenticated,
    filters.status,
    filters.dateField,
    filters.startDate,
    filters.endDate,
    filters.creatorId,
    filters.assigneeId,
    filters.sortField,
    filters.sortOrder,
  ]);

  // ---------------------------------------------------------------------------
  // Filtered and sorted tasks (client-side)
  // ---------------------------------------------------------------------------
  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    // Apply status filter (already applied server-side, but keeping for consistency)
    if (filters.status !== 'all') {
      result = result.filter((task) => task.status === filters.status);
    }

    // Apply priority filter (client-side only)
    if (filters.priority !== 'all') {
      result = result.filter((task) => task.priority === filters.priority);
    }

    // Apply search filter (client-side)
    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter(
        (task) =>
          task.title.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    const priorityOrder: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
    result.sort((a, b) => {
      let comparison = 0;
      switch (filters.sortField) {
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
      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [tasks, filters]);

  // ---------------------------------------------------------------------------
  // Filter actions
  // ---------------------------------------------------------------------------
  const updateFilter = useCallback(<K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(initialFilterState);
  }, []);

  // ---------------------------------------------------------------------------
  // Task actions
  // ---------------------------------------------------------------------------
  const createTask = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');

      if (!taskForm.title.trim()) {
        setError('Task title is required');
        return;
      }

      try {
        const taskData: CreateTaskRequest = {
          title: taskForm.title,
          description: taskForm.description || undefined,
          priority: taskForm.priority,
          teamId: selectedTeamId || undefined,
        } as CreateTaskRequest;

        const response = await tasksApi.createTask(taskData);
        setTasks((prev) => [response.data, ...prev]);
        setTaskForm(initialTaskFormState);
        setShowTaskForm(false);
      } catch (err) {
        setError(getErrorMessage(err, 'Failed to create task'));
      }
    },
    [taskForm, selectedTeamId]
  );

  const completeTask = useCallback(async (taskId: string) => {
    try {
      await tasksApi.completeTask(taskId);
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: TaskStatus.COMPLETED } : t))
      );
    } catch (err) {
      console.error('Failed to complete task:', err);
    }
  }, []);

  const deleteTask = useCallback(async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      await tasksApi.deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Team actions
  // ---------------------------------------------------------------------------
  const createTeam = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');

      if (!teamForm.name.trim()) {
        setError('Team name is required');
        return;
      }

      try {
        await createTeamMutation.mutateAsync({
          name: teamForm.name,
          description: teamForm.description || undefined,
        });
        setTeamForm(initialTeamFormState);
        setShowTeamForm(false);
      } catch (err) {
        setError(getErrorMessage(err, 'Failed to create team'));
      }
    },
    [teamForm, createTeamMutation]
  );

  // ---------------------------------------------------------------------------
  // Form state updaters
  // ---------------------------------------------------------------------------
  const updateTaskForm = useCallback(<K extends keyof TaskFormState>(key: K, value: TaskFormState[K]) => {
    setTaskForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const updateTeamForm = useCallback(<K extends keyof TeamFormState>(key: K, value: TeamFormState[K]) => {
    setTeamForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  // ---------------------------------------------------------------------------
  // UI helpers
  // ---------------------------------------------------------------------------
  const getViewTitle = useCallback(() => {
    const titles: Record<TaskView, string> = {
      [TaskView.ALL]: 'All Tasks',
      [TaskView.MY_TASKS]: 'My Tasks',
      [TaskView.ASSIGNED]: 'Assigned to Me',
      [TaskView.FOLLOWING]: 'Following',
      [TaskView.COMPLETED]: 'Completed',
    };
    return titles[currentView] || 'All Tasks';
  }, [currentView]);

  const getSelectedTeamName = useCallback(() => {
    if (!selectedTeamId || !teams) return null;
    const team = teams.find((t: Team) => t.id === selectedTeamId);
    return team?.name || null;
  }, [selectedTeamId, teams]);

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------
  return {
    // Auth state
    isAuthenticated,
    _hasHydrated,

    // Core data
    tasks: filteredTasks,
    rawTasks: tasks,
    teams,
    teamMembers,

    // Loading states
    tasksLoading,
    teamsLoading,
    isCreatingTeam: createTeamMutation.isPending,

    // Error state
    error,
    setError,

    // Selection state
    selectedTeamId,
    setSelectedTeamId,
    currentView,
    setCurrentView,

    // UI state
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
  };
}
