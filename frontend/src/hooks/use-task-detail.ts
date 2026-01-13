'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { tasksApi } from '@/lib/api/tasks';
import { Task, TaskStatus, TaskPriority, Comment, TaskHistory } from '@/types/task';
import { toast } from '@/stores/toast-store';
import { UserSummary } from '@/types/user';

export type TabType = 'details' | 'comments' | 'history';

interface EditFormState {
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
}

export function useTaskDetail(taskId: string) {
  const router = useRouter();
  const { isAuthenticated, user, _hasHydrated } = useAuthStore();

  // Data state
  const [task, setTask] = useState<Task | null>(null);
  const [subtasks, setSubtasks] = useState<Task[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [history, setHistory] = useState<TaskHistory[]>([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('details');
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState<EditFormState>({
    title: '',
    description: '',
    priority: TaskPriority.MEDIUM,
    status: TaskStatus.PENDING,
  });

  // Comment editing state
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentContent, setEditCommentContent] = useState('');

  // Input state
  const [newComment, setNewComment] = useState('');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  // Modal state
  const [showAssigneeModal, setShowAssigneeModal] = useState(false);
  const [showFollowerModal, setShowFollowerModal] = useState(false);

  // Load task data
  const loadTaskData = useCallback(async () => {
    setLoading(true);
    try {
      const [taskRes, subtasksRes, commentsRes, historyRes] = await Promise.all([
        tasksApi.getTask(taskId),
        tasksApi.getSubtasks(taskId),
        tasksApi.getComments(taskId),
        tasksApi.getHistory(taskId),
      ]);
      setTask(taskRes.data);
      setSubtasks(subtasksRes.data || []);
      setComments(commentsRes.data || []);
      setHistory(historyRes.data || []);

      // Set edit form values
      setEditForm({
        title: taskRes.data.title,
        description: taskRes.data.description || '',
        priority: taskRes.data.priority,
        status: taskRes.data.status,
      });
    } catch (error) {
      console.error('Failed to load task:', error);
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  // Initial load
  useEffect(() => {
    if (!_hasHydrated) return;

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    loadTaskData();
  }, [taskId, _hasHydrated, isAuthenticated, router, loadTaskData]);

  // Edit form handlers
  const updateEditForm = useCallback(<K extends keyof EditFormState>(
    key: K,
    value: EditFormState[K]
  ) => {
    setEditForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Task actions
  const handleUpdateTask = useCallback(async () => {
    if (!task) return;
    setSubmitting(true);
    try {
      await tasksApi.updateTask(taskId, {
        title: editForm.title,
        description: editForm.description || undefined,
        priority: editForm.priority,
        status: editForm.status,
      });
      await loadTaskData();
      setIsEditing(false);
      toast.success('Task updated successfully');
    } catch (error) {
      console.error('Failed to update task:', error);
      toast.error('Failed to update task');
    } finally {
      setSubmitting(false);
    }
  }, [task, taskId, editForm, loadTaskData]);

  const handleCompleteTask = useCallback(async () => {
    if (!task) return;
    try {
      await tasksApi.completeTask(taskId, true);
      await loadTaskData();
      toast.success('Task completed!');
    } catch (error) {
      console.error('Failed to complete task:', error);
      toast.error('Failed to complete task');
    }
  }, [task, taskId, loadTaskData]);

  const handleDeleteTask = useCallback(async () => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await tasksApi.deleteTask(taskId);
      toast.success('Task deleted');
      router.push('/tasks');
    } catch (error) {
      console.error('Failed to delete task:', error);
      toast.error('Failed to delete task');
    }
  }, [taskId, router]);

  // Comment actions
  const handleAddComment = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      await tasksApi.createComment(taskId, { content: newComment });
      setNewComment('');
      await loadTaskData();
      toast.success('Comment added');
    } catch (error) {
      console.error('Failed to add comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  }, [taskId, newComment, loadTaskData]);

  const handleEditComment = useCallback((comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditCommentContent(comment.content);
  }, []);

  const handleUpdateComment = useCallback(async () => {
    if (!editingCommentId || !editCommentContent.trim()) return;
    setSubmitting(true);
    try {
      await tasksApi.updateComment(taskId, editingCommentId, editCommentContent);
      setEditingCommentId(null);
      setEditCommentContent('');
      await loadTaskData();
      toast.success('Comment updated');
    } catch (error) {
      console.error('Failed to update comment:', error);
      toast.error('Failed to update comment');
    } finally {
      setSubmitting(false);
    }
  }, [taskId, editingCommentId, editCommentContent, loadTaskData]);

  const handleCancelEditComment = useCallback(() => {
    setEditingCommentId(null);
    setEditCommentContent('');
  }, []);

  const handleDeleteComment = useCallback(async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    try {
      await tasksApi.deleteComment(taskId, commentId);
      await loadTaskData();
      toast.success('Comment deleted');
    } catch (error) {
      console.error('Failed to delete comment:', error);
      toast.error('Failed to delete comment');
    }
  }, [taskId, loadTaskData]);

  // Assignee/Follower actions
  const handleAddAssignee = useCallback(async (targetUser: UserSummary) => {
    try {
      await tasksApi.addAssignee(taskId, targetUser.id);
      await loadTaskData();
      toast.success(`${targetUser.name || targetUser.email} added as assignee`);
    } catch (error) {
      console.error('Failed to add assignee:', error);
      toast.error('Failed to add assignee');
    }
  }, [taskId, loadTaskData]);

  const handleRemoveAssignee = useCallback(async (userId: string) => {
    try {
      await tasksApi.removeAssignee(taskId, userId);
      await loadTaskData();
      toast.success('Assignee removed');
    } catch (error) {
      console.error('Failed to remove assignee:', error);
      toast.error('Failed to remove assignee');
    }
  }, [taskId, loadTaskData]);

  const handleAddFollower = useCallback(async (targetUser: UserSummary) => {
    try {
      await tasksApi.addFollower(taskId, targetUser.id);
      await loadTaskData();
      toast.success(`${targetUser.name || targetUser.email} added as follower`);
    } catch (error) {
      console.error('Failed to add follower:', error);
      toast.error('Failed to add follower');
    }
  }, [taskId, loadTaskData]);

  const handleRemoveFollower = useCallback(async (userId: string) => {
    try {
      await tasksApi.removeFollower(taskId, userId);
      await loadTaskData();
      toast.success('Follower removed');
    } catch (error) {
      console.error('Failed to remove follower:', error);
      toast.error('Failed to remove follower');
    }
  }, [taskId, loadTaskData]);

  // Subtask actions
  const handleAddSubtask = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim() || !task) return;
    setSubmitting(true);
    try {
      await tasksApi.createSubtask(taskId, {
        title: newSubtaskTitle,
        teamId: task.teamId,
      });
      setNewSubtaskTitle('');
      await loadTaskData();
    } catch (error) {
      console.error('Failed to add subtask:', error);
    } finally {
      setSubmitting(false);
    }
  }, [taskId, task, newSubtaskTitle, loadTaskData]);

  const handleCompleteSubtask = useCallback(async (subtaskId: string) => {
    try {
      await tasksApi.completeTask(subtaskId);
      await loadTaskData();
    } catch (error) {
      console.error('Failed to complete subtask:', error);
    }
  }, [loadTaskData]);

  return {
    // Auth
    isAuthenticated,
    user,
    _hasHydrated,

    // Data
    task,
    subtasks,
    comments,
    history,

    // UI state
    loading,
    submitting,
    activeTab,
    setActiveTab,
    isEditing,
    setIsEditing,

    // Edit form
    editForm,
    updateEditForm,

    // Comment editing
    editingCommentId,
    editCommentContent,
    setEditCommentContent,

    // Inputs
    newComment,
    setNewComment,
    newSubtaskTitle,
    setNewSubtaskTitle,

    // Modals
    showAssigneeModal,
    setShowAssigneeModal,
    showFollowerModal,
    setShowFollowerModal,

    // Task actions
    handleUpdateTask,
    handleCompleteTask,
    handleDeleteTask,

    // Comment actions
    handleAddComment,
    handleEditComment,
    handleUpdateComment,
    handleCancelEditComment,
    handleDeleteComment,

    // Assignee/Follower actions
    handleAddAssignee,
    handleRemoveAssignee,
    handleAddFollower,
    handleRemoveFollower,

    // Subtask actions
    handleAddSubtask,
    handleCompleteSubtask,
  };
}
