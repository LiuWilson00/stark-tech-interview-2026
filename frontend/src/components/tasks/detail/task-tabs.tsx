'use client';

import { Task, TaskStatus, TaskPriority, Comment, TaskHistory } from '@/types/task';
import { Badge, getPriorityVariant } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/utils/date';
import { TabType } from '@/hooks/use-task-detail';

interface TaskTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  subtasks: Task[];
  comments: Comment[];
  history: TaskHistory[];
  currentUserId?: string;
  // Subtask props
  newSubtaskTitle: string;
  onSubtaskTitleChange: (title: string) => void;
  onAddSubtask: (e: React.FormEvent) => void;
  onCompleteSubtask: (subtaskId: string) => void;
  // Comment props
  newComment: string;
  onCommentChange: (content: string) => void;
  onAddComment: (e: React.FormEvent) => void;
  editingCommentId: string | null;
  editCommentContent: string;
  onEditCommentContentChange: (content: string) => void;
  onEditComment: (comment: Comment) => void;
  onUpdateComment: () => void;
  onCancelEditComment: () => void;
  onDeleteComment: (commentId: string) => void;
  submitting: boolean;
}

export function TaskTabs({
  activeTab,
  onTabChange,
  subtasks,
  comments,
  history,
  currentUserId,
  newSubtaskTitle,
  onSubtaskTitleChange,
  onAddSubtask,
  onCompleteSubtask,
  newComment,
  onCommentChange,
  onAddComment,
  editingCommentId,
  editCommentContent,
  onEditCommentContentChange,
  onEditComment,
  onUpdateComment,
  onCancelEditComment,
  onDeleteComment,
  submitting,
}: TaskTabsProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      {/* Tab Navigation */}
      <div className="border-b dark:border-gray-700">
        <nav className="flex">
          {(['details', 'comments', 'history'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
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

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'details' && (
          <SubtasksTab
            subtasks={subtasks}
            newSubtaskTitle={newSubtaskTitle}
            onSubtaskTitleChange={onSubtaskTitleChange}
            onAddSubtask={onAddSubtask}
            onCompleteSubtask={onCompleteSubtask}
            submitting={submitting}
          />
        )}

        {activeTab === 'comments' && (
          <CommentsTab
            comments={comments}
            currentUserId={currentUserId}
            newComment={newComment}
            onCommentChange={onCommentChange}
            onAddComment={onAddComment}
            editingCommentId={editingCommentId}
            editCommentContent={editCommentContent}
            onEditCommentContentChange={onEditCommentContentChange}
            onEditComment={onEditComment}
            onUpdateComment={onUpdateComment}
            onCancelEditComment={onCancelEditComment}
            onDeleteComment={onDeleteComment}
            submitting={submitting}
          />
        )}

        {activeTab === 'history' && <HistoryTab history={history} />}
      </div>
    </div>
  );
}

// =============================================================================
// Subtasks Tab
// =============================================================================

interface SubtasksTabProps {
  subtasks: Task[];
  newSubtaskTitle: string;
  onSubtaskTitleChange: (title: string) => void;
  onAddSubtask: (e: React.FormEvent) => void;
  onCompleteSubtask: (subtaskId: string) => void;
  submitting: boolean;
}

function SubtasksTab({
  subtasks,
  newSubtaskTitle,
  onSubtaskTitleChange,
  onAddSubtask,
  onCompleteSubtask,
  submitting,
}: SubtasksTabProps) {
  return (
    <div>
      <form onSubmit={onAddSubtask} className="flex gap-2 mb-4">
        <input
          type="text"
          value={newSubtaskTitle}
          onChange={(e) => onSubtaskTitleChange(e.target.value)}
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
            <SubtaskItem
              key={subtask.id}
              subtask={subtask}
              onComplete={() => onCompleteSubtask(subtask.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface SubtaskItemProps {
  subtask: Task;
  onComplete: () => void;
}

function SubtaskItem({ subtask, onComplete }: SubtaskItemProps) {
  const isCompleted = subtask.status === TaskStatus.COMPLETED;

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded">
      <button
        onClick={onComplete}
        disabled={isCompleted}
        className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${
          isCompleted
            ? 'bg-green-500 border-green-500 text-white'
            : 'border-gray-300 hover:border-green-500'
        }`}
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
      <span className={isCompleted ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}>
        {subtask.title}
      </span>
      <Badge variant={getPriorityVariant(subtask.priority)} size="sm">
        {subtask.priority}
      </Badge>
    </div>
  );
}

// =============================================================================
// Comments Tab
// =============================================================================

interface CommentsTabProps {
  comments: Comment[];
  currentUserId?: string;
  newComment: string;
  onCommentChange: (content: string) => void;
  onAddComment: (e: React.FormEvent) => void;
  editingCommentId: string | null;
  editCommentContent: string;
  onEditCommentContentChange: (content: string) => void;
  onEditComment: (comment: Comment) => void;
  onUpdateComment: () => void;
  onCancelEditComment: () => void;
  onDeleteComment: (commentId: string) => void;
  submitting: boolean;
}

function CommentsTab({
  comments,
  currentUserId,
  newComment,
  onCommentChange,
  onAddComment,
  editingCommentId,
  editCommentContent,
  onEditCommentContentChange,
  onEditComment,
  onUpdateComment,
  onCancelEditComment,
  onDeleteComment,
  submitting,
}: CommentsTabProps) {
  return (
    <div>
      {/* Add Comment Form */}
      <form onSubmit={onAddComment} className="mb-6">
        <textarea
          value={newComment}
          onChange={(e) => onCommentChange(e.target.value)}
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

      {/* Comments List */}
      {comments.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No comments yet</p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              isOwner={comment.userId === currentUserId}
              isEditing={editingCommentId === comment.id}
              editContent={editCommentContent}
              onEditContentChange={onEditCommentContentChange}
              onEdit={() => onEditComment(comment)}
              onUpdate={onUpdateComment}
              onCancelEdit={onCancelEditComment}
              onDelete={() => onDeleteComment(comment.id)}
              submitting={submitting}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface CommentItemProps {
  comment: Comment;
  isOwner: boolean;
  isEditing: boolean;
  editContent: string;
  onEditContentChange: (content: string) => void;
  onEdit: () => void;
  onUpdate: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
  submitting: boolean;
}

function CommentItem({
  comment,
  isOwner,
  isEditing,
  editContent,
  onEditContentChange,
  onEdit,
  onUpdate,
  onCancelEdit,
  onDelete,
  submitting,
}: CommentItemProps) {
  return (
    <div className="border-b dark:border-gray-700 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
            {comment.user?.name?.charAt(0) || '?'}
          </div>
          <div>
            <span className="font-medium text-gray-900 dark:text-white">
              {comment.user?.name || 'Unknown'}
            </span>
            <span className="text-sm text-gray-500 ml-2">{formatDateTime(comment.createdAt)}</span>
          </div>
        </div>
        {isOwner && !isEditing && (
          <div className="flex items-center gap-2">
            <button onClick={onEdit} className="text-sm text-blue-600 hover:text-blue-700">
              Edit
            </button>
            <button onClick={onDelete} className="text-sm text-red-600 hover:text-red-700">
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {isEditing ? (
        <div className="ml-10">
          <textarea
            value={editContent}
            onChange={(e) => onEditContentChange(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white mb-2"
          />
          <div className="flex gap-2">
            <button
              onClick={onUpdate}
              disabled={submitting || !editContent.trim()}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={onCancelEdit}
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
  );
}

// =============================================================================
// History Tab
// =============================================================================

interface HistoryTabProps {
  history: TaskHistory[];
}

function HistoryTab({ history }: HistoryTabProps) {
  const getHistoryIcon = (actionType: string) => {
    switch (actionType) {
      case 'created':
        return '🆕';
      case 'updated':
        return '✏️';
      case 'status_changed':
        return '🔄';
      case 'completed':
        return '✅';
      case 'assignee_added':
        return '👤';
      case 'assignee_removed':
        return '👤';
      case 'follower_added':
        return '👁️';
      case 'follower_removed':
        return '👁️';
      case 'comment_added':
        return '💬';
      default:
        return '📝';
    }
  };

  if (history.length === 0) {
    return <p className="text-gray-500 text-center py-4">No history yet</p>;
  }

  return (
    <div className="space-y-4">
      {history.map((entry) => (
        <div key={entry.id} className="flex gap-3">
          <div className="text-xl">{getHistoryIcon(entry.actionType)}</div>
          <div className="flex-1">
            <p className="text-gray-900 dark:text-white">{entry.description}</p>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>{entry.user?.name || 'Unknown'}</span>
              <span>•</span>
              <span>{formatDateTime(entry.createdAt)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
