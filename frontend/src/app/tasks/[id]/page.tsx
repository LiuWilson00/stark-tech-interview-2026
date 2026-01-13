'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';
import { tasksApi } from '@/lib/api/tasks';
import { Task, TaskStatus, TaskPriority, Comment, TaskHistory } from '@/types/task';
import { Badge, getStatusVariant, getPriorityVariant } from '@/components/ui/badge';
import { Loading, PageLoading } from '@/components/ui/loading';
import { toast } from '@/stores/toast-store';
import { UserSelectModal } from '@/components/tasks/user-select-modal';
import { UserSummary } from '@/types/user';

type TabType = 'details' | 'comments' | 'history';

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;
  const { isAuthenticated, user } = useAuthStore();

  const [task, setTask] = useState<Task | null>(null);
  const [subtasks, setSubtasks] = useState<Task[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [history, setHistory] = useState<TaskHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('details');
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPriority, setEditPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [editStatus, setEditStatus] = useState<TaskStatus>(TaskStatus.PENDING);
  const [newComment, setNewComment] = useState('');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentContent, setEditCommentContent] = useState('');
  const [showAssigneeModal, setShowAssigneeModal] = useState(false);
  const [showFollowerModal, setShowFollowerModal] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    loadTaskData();
  }, [taskId, isAuthenticated]);

  const loadTaskData = async () => {
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
      setEditTitle(taskRes.data.title);
      setEditDescription(taskRes.data.description || '');
      setEditPriority(taskRes.data.priority);
      setEditStatus(taskRes.data.status);
    } catch (error) {
      console.error('Failed to load task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTask = async () => {
    if (!task) return;
    setSubmitting(true);
    try {
      await tasksApi.updateTask(taskId, {
        title: editTitle,
        description: editDescription || undefined,
        priority: editPriority,
        status: editStatus,
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
  };

  const handleCompleteTask = async () => {
    if (!task) return;
    try {
      await tasksApi.completeTask(taskId, true);
      await loadTaskData();
      toast.success('Task completed!');
    } catch (error) {
      console.error('Failed to complete task:', error);
      toast.error('Failed to complete task');
    }
  };

  const handleDeleteTask = async () => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await tasksApi.deleteTask(taskId);
      toast.success('Task deleted');
      router.push('/tasks');
    } catch (error) {
      console.error('Failed to delete task:', error);
      toast.error('Failed to delete task');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
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
  };

  const handleEditComment = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditCommentContent(comment.content);
  };

  const handleUpdateComment = async () => {
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
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    try {
      await tasksApi.deleteComment(taskId, commentId);
      await loadTaskData();
      toast.success('Comment deleted');
    } catch (error) {
      console.error('Failed to delete comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  const handleAddAssignee = async (user: UserSummary) => {
    try {
      await tasksApi.addAssignee(taskId, user.id);
      await loadTaskData();
      toast.success(`${user.name || user.email} added as assignee`);
    } catch (error) {
      console.error('Failed to add assignee:', error);
      toast.error('Failed to add assignee');
    }
  };

  const handleRemoveAssignee = async (userId: string) => {
    try {
      await tasksApi.removeAssignee(taskId, userId);
      await loadTaskData();
      toast.success('Assignee removed');
    } catch (error) {
      console.error('Failed to remove assignee:', error);
      toast.error('Failed to remove assignee');
    }
  };

  const handleAddFollower = async (user: UserSummary) => {
    try {
      await tasksApi.addFollower(taskId, user.id);
      await loadTaskData();
      toast.success(`${user.name || user.email} added as follower`);
    } catch (error) {
      console.error('Failed to add follower:', error);
      toast.error('Failed to add follower');
    }
  };

  const handleRemoveFollower = async (userId: string) => {
    try {
      await tasksApi.removeFollower(taskId, userId);
      await loadTaskData();
      toast.success('Follower removed');
    } catch (error) {
      console.error('Failed to remove follower:', error);
      toast.error('Failed to remove follower');
    }
  };

  const handleAddSubtask = async (e: React.FormEvent) => {
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
  };

  const handleCompleteSubtask = async (subtaskId: string) => {
    try {
      await tasksApi.completeTask(subtaskId);
      await loadTaskData();
    } catch (error) {
      console.error('Failed to complete subtask:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getHistoryIcon = (actionType: string) => {
    switch (actionType) {
      case 'created': return '🆕';
      case 'updated': return '✏️';
      case 'status_changed': return '🔄';
      case 'completed': return '✅';
      case 'assignee_added': return '👤';
      case 'assignee_removed': return '👤';
      case 'follower_added': return '👁️';
      case 'follower_removed': return '👁️';
      case 'comment_added': return '💬';
      default: return '📝';
    }
  };

  if (!isAuthenticated) return null;
  if (loading) return <PageLoading />;
  if (!task) return <div className="p-8 text-center">Task not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
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
            {task.status !== TaskStatus.COMPLETED && (
              <button
                onClick={handleCompleteTask}
                className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700"
              >
                Complete
              </button>
            )}
            <button
              onClick={handleDeleteTask}
              className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Task Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          {isEditing ? (
            <div className="space-y-4">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full text-xl font-semibold px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
                placeholder="Description (optional)"
                className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <div className="flex gap-4">
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as TaskStatus)}
                  className="px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value={TaskStatus.PENDING}>Pending</option>
                  <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
                  <option value={TaskStatus.COMPLETED}>Completed</option>
                </select>
                <select
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value as TaskPriority)}
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
                  onClick={handleUpdateTask}
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between mb-4">
                <h2 className={`text-2xl font-semibold ${task.status === TaskStatus.COMPLETED ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                  {task.title}
                </h2>
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  Edit
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant={getStatusVariant(task.status)}>{task.status}</Badge>
                <Badge variant={getPriorityVariant(task.priority)}>{task.priority}</Badge>
                {task.team && <Badge variant="info">{task.team.name}</Badge>}
              </div>

              {task.description && (
                <p className="text-gray-600 dark:text-gray-400 mb-4">{task.description}</p>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500 dark:text-gray-400">
                <div>
                  <span className="font-medium">Created by:</span>
                  <p>{task.creator?.name || 'Unknown'}</p>
                </div>
                <div>
                  <span className="font-medium">Created at:</span>
                  <p>{formatDate(task.createdAt)}</p>
                </div>
                {task.dueDate && (
                  <div>
                    <span className="font-medium">Due date:</span>
                    <p>{formatDate(task.dueDate)}</p>
                  </div>
                )}
                {task.completedAt && (
                  <div>
                    <span className="font-medium">Completed at:</span>
                    <p>{formatDate(task.completedAt)}</p>
                  </div>
                )}
              </div>

              {/* Assignees & Followers */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Assignees */}
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Assignees</span>
                    <button
                      onClick={() => setShowAssigneeModal(true)}
                      className="text-xs text-blue-600 hover:text-blue-700"
                    >
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
                    <button
                      onClick={() => setShowFollowerModal(true)}
                      className="text-xs text-blue-600 hover:text-blue-700"
                    >
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
            </>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="border-b dark:border-gray-700">
            <nav className="flex">
              {(['details', 'comments', 'history'] as TabType[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 text-sm font-medium border-b-2 ${
                    activeTab === tab
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                  }`}
                >
                  {tab === 'details' && `Subtasks (${subtasks.length})`}
                  {tab === 'comments' && `Comments (${comments.length})`}
                  {tab === 'history' && `History (${history.length})`}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Subtasks Tab */}
            {activeTab === 'details' && (
              <div>
                <form onSubmit={handleAddSubtask} className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    placeholder="Add a subtask..."
                    className="flex-1 px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                  <button
                    type="submit"
                    disabled={submitting || !newSubtaskTitle.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    Add
                  </button>
                </form>

                {subtasks.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No subtasks yet</p>
                ) : (
                  <div className="space-y-2">
                    {subtasks.map((subtask) => (
                      <div
                        key={subtask.id}
                        className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded"
                      >
                        <button
                          onClick={() => handleCompleteSubtask(subtask.id)}
                          disabled={subtask.status === TaskStatus.COMPLETED}
                          className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${
                            subtask.status === TaskStatus.COMPLETED
                              ? 'bg-green-500 border-green-500 text-white'
                              : 'border-gray-300 hover:border-green-500'
                          }`}
                        >
                          {subtask.status === TaskStatus.COMPLETED && (
                            <svg className="w-full h-full" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                        <span className={subtask.status === TaskStatus.COMPLETED ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}>
                          {subtask.title}
                        </span>
                        <Badge variant={getPriorityVariant(subtask.priority)} size="sm">
                          {subtask.priority}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Comments Tab */}
            {activeTab === 'comments' && (
              <div>
                <form onSubmit={handleAddComment} className="mb-6">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    rows={3}
                    className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white mb-2"
                  />
                  <button
                    type="submit"
                    disabled={submitting || !newComment.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {submitting ? 'Adding...' : 'Add Comment'}
                  </button>
                </form>

                {comments.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No comments yet</p>
                ) : (
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="border-b dark:border-gray-700 pb-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                              {comment.user?.name?.charAt(0) || '?'}
                            </div>
                            <div>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {comment.user?.name || 'Unknown'}
                              </span>
                              <span className="text-sm text-gray-500 ml-2">
                                {formatDate(comment.createdAt)}
                              </span>
                            </div>
                          </div>
                          {/* Show edit/delete only for own comments */}
                          {comment.userId === user?.id && editingCommentId !== comment.id && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEditComment(comment)}
                                className="text-sm text-blue-600 hover:text-blue-700"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="text-sm text-red-600 hover:text-red-700"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                        {editingCommentId === comment.id ? (
                          <div className="ml-10">
                            <textarea
                              value={editCommentContent}
                              onChange={(e) => setEditCommentContent(e.target.value)}
                              rows={3}
                              className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white mb-2"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={handleUpdateComment}
                                disabled={submitting || !editCommentContent.trim()}
                                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                              >
                                {submitting ? 'Saving...' : 'Save'}
                              </button>
                              <button
                                onClick={() => {
                                  setEditingCommentId(null);
                                  setEditCommentContent('');
                                }}
                                className="px-3 py-1 text-sm border rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-gray-600 dark:text-gray-300 ml-10">{comment.content}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
              <div>
                {history.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No history yet</p>
                ) : (
                  <div className="space-y-4">
                    {history.map((entry) => (
                      <div key={entry.id} className="flex gap-3">
                        <div className="text-xl">{getHistoryIcon(entry.actionType)}</div>
                        <div className="flex-1">
                          <p className="text-gray-900 dark:text-white">{entry.description}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>{entry.user?.name || 'Unknown'}</span>
                            <span>•</span>
                            <span>{formatDate(entry.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Assignee Modal */}
      <UserSelectModal
        isOpen={showAssigneeModal}
        onClose={() => setShowAssigneeModal(false)}
        title="Manage Assignees"
        teamId={task.teamId}
        selectedUserIds={task.assignees?.map((a) => a.userId) || []}
        onSelect={handleAddAssignee}
        onRemove={handleRemoveAssignee}
      />

      {/* Follower Modal */}
      <UserSelectModal
        isOpen={showFollowerModal}
        onClose={() => setShowFollowerModal(false)}
        title="Manage Followers"
        teamId={task.teamId}
        selectedUserIds={task.followers?.map((f) => f.userId) || []}
        onSelect={handleAddFollower}
        onRemove={handleRemoveFollower}
      />
    </div>
  );
}
