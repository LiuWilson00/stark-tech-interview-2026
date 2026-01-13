'use client';

import { useParams } from 'next/navigation';
import { PageLoading } from '@/components/ui/loading';
import { UserSelectModal } from '@/components/tasks/user-select-modal';
import { useTaskDetail } from '@/hooks/use-task-detail';
import {
  TaskDetailHeader,
  TaskDetailCard,
  TaskTabs,
} from '@/components/tasks/detail';

export default function TaskDetailPage() {
  const params = useParams();
  const taskId = params.id as string;

  const {
    // Auth
    isAuthenticated,
    user,

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
  } = useTaskDetail(taskId);

  if (!isAuthenticated) return null;
  if (loading) return <PageLoading />;
  if (!task) return <div className="p-8 text-center">Task not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <TaskDetailHeader
        status={task.status}
        onComplete={handleCompleteTask}
        onDelete={handleDeleteTask}
      />

      <div className="max-w-5xl mx-auto px-4 py-6">
        <TaskDetailCard
          task={task}
          isEditing={isEditing}
          editForm={editForm}
          submitting={submitting}
          onEdit={() => setIsEditing(true)}
          onCancelEdit={() => setIsEditing(false)}
          onSave={handleUpdateTask}
          onUpdateForm={updateEditForm}
          onManageAssignees={() => setShowAssigneeModal(true)}
          onManageFollowers={() => setShowFollowerModal(true)}
        />

        <TaskTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          subtasks={subtasks}
          comments={comments}
          history={history}
          currentUserId={user?.id}
          // Subtask props
          newSubtaskTitle={newSubtaskTitle}
          onSubtaskTitleChange={setNewSubtaskTitle}
          onAddSubtask={handleAddSubtask}
          onCompleteSubtask={handleCompleteSubtask}
          // Comment props
          newComment={newComment}
          onCommentChange={setNewComment}
          onAddComment={handleAddComment}
          editingCommentId={editingCommentId}
          editCommentContent={editCommentContent}
          onEditCommentContentChange={setEditCommentContent}
          onEditComment={handleEditComment}
          onUpdateComment={handleUpdateComment}
          onCancelEditComment={handleCancelEditComment}
          onDeleteComment={handleDeleteComment}
          submitting={submitting}
        />
      </div>

      {/* Modals */}
      <UserSelectModal
        isOpen={showAssigneeModal}
        onClose={() => setShowAssigneeModal(false)}
        title="Manage Assignees"
        teamId={task.teamId}
        selectedUserIds={task.assignees?.map((a) => a.userId) || []}
        onSelect={handleAddAssignee}
        onRemove={handleRemoveAssignee}
      />

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
