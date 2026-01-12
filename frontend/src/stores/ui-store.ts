import { create } from 'zustand';
import { TaskStatus, TaskView } from '@/types/task';

interface TaskFilters {
  status: TaskStatus | null;
  startDate: string | null;
  endDate: string | null;
  creatorId: string | null;
  assigneeId: string | null;
}

interface UIState {
  // Sidebar
  sidebarCollapsed: boolean;

  // Current context
  currentTeamId: string | null;
  currentView: TaskView;
  taskViewMode: 'list' | 'board';

  // Filters
  filters: TaskFilters;
  sortBy: 'createdAt' | 'dueDate' | 'id';
  sortOrder: 'ASC' | 'DESC';

  // Modal states
  isTaskFormOpen: boolean;
  editingTaskId: string | null;

  // Actions
  toggleSidebar: () => void;
  setCurrentTeam: (teamId: string | null) => void;
  setCurrentView: (view: TaskView) => void;
  setTaskViewMode: (mode: 'list' | 'board') => void;
  setFilters: (filters: Partial<TaskFilters>) => void;
  setSorting: (sortBy: 'createdAt' | 'dueDate' | 'id', sortOrder: 'ASC' | 'DESC') => void;
  resetFilters: () => void;
  openTaskForm: (taskId?: string) => void;
  closeTaskForm: () => void;
}

const defaultFilters: TaskFilters = {
  status: null,
  startDate: null,
  endDate: null,
  creatorId: null,
  assigneeId: null,
};

export const useUIStore = create<UIState>((set) => ({
  // Initial state
  sidebarCollapsed: false,
  currentTeamId: null,
  currentView: TaskView.ALL,
  taskViewMode: 'list',
  filters: defaultFilters,
  sortBy: 'createdAt',
  sortOrder: 'DESC',
  isTaskFormOpen: false,
  editingTaskId: null,

  // Actions
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  setCurrentTeam: (teamId) => set({ currentTeamId: teamId }),

  setCurrentView: (view) => set({ currentView: view }),

  setTaskViewMode: (mode) => set({ taskViewMode: mode }),

  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),

  setSorting: (sortBy, sortOrder) => set({ sortBy, sortOrder }),

  resetFilters: () => set({ filters: defaultFilters }),

  openTaskForm: (taskId) =>
    set({ isTaskFormOpen: true, editingTaskId: taskId || null }),

  closeTaskForm: () => set({ isTaskFormOpen: false, editingTaskId: null }),
}));
