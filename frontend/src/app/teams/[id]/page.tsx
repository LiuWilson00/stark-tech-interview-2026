'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';
import { teamsApi } from '@/lib/api/teams';
import { Team, TeamMember, TeamRole } from '@/types/team';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { PageLoading } from '@/components/ui/loading';
import { AppHeader } from '@/components/layout/app-header';
import { getErrorMessage } from '@/lib/utils/error';

export default function TeamDetailPage() {
  const router = useRouter();
  const params = useParams();
  const teamId = params.id as string;
  const { user, isAuthenticated, _hasHydrated } = useAuthStore();

  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<TeamRole>(TeamRole.MEMBER);

  const isOwner = team?.ownerId === user?.id;
  const currentMember = members.find((m) => m.userId === user?.id);
  const isAdmin = currentMember?.role === TeamRole.ADMIN || isOwner;

  useEffect(() => {
    if (!_hasHydrated) return;

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const loadTeam = async () => {
      setLoading(true);
      try {
        const [teamRes, membersRes] = await Promise.all([
          teamsApi.getTeam(teamId),
          teamsApi.getMembers(teamId),
        ]);
        setTeam(teamRes.data);
        setMembers(membersRes.data);
        setEditName(teamRes.data.name);
        setEditDescription(teamRes.data.description || '');
      } catch (err) {
        console.error('Failed to load team:', err);
        setError('Failed to load team');
      } finally {
        setLoading(false);
      }
    };

    loadTeam();
  }, [teamId, isAuthenticated, router]);

  const handleUpdateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;

    try {
      const response = await teamsApi.updateTeam(teamId, {
        name: editName,
        description: editDescription || undefined,
      });
      setTeam(response.data);
      setShowEditModal(false);
    } catch (err) {
      console.error('Failed to update team:', err);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberEmail.trim()) return;

    try {
      const response = await teamsApi.addMember(teamId, {
        email: newMemberEmail,
        role: newMemberRole,
      });
      setMembers([...members, response.data]);
      setNewMemberEmail('');
      setNewMemberRole(TeamRole.MEMBER);
      setShowAddMemberModal(false);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to add member'));
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;

    try {
      await teamsApi.removeMember(teamId, userId);
      setMembers(members.filter((m) => m.userId !== userId));
    } catch (err) {
      console.error('Failed to remove member:', err);
    }
  };

  const getRoleVariant = (role: TeamRole): 'primary' | 'success' | 'default' => {
    switch (role) {
      case TeamRole.OWNER:
        return 'success';
      case TeamRole.ADMIN:
        return 'primary';
      default:
        return 'default';
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return <PageLoading />;
  }

  if (error || !team) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Team not found'}</p>
          <Link href="/teams" className="text-blue-600 hover:underline">
            Back to Teams
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AppHeader activeNav="teams" />

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/teams" className="hover:text-gray-700 dark:hover:text-gray-300">
            Teams
          </Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-white">{team.name}</span>
        </div>

        {/* Team Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {team.name}
                  </h2>
                  {isOwner && <Badge variant="success">Owner</Badge>}
                </div>
                {team.description && (
                  <p className="text-gray-600 dark:text-gray-400 mt-2">
                    {team.description}
                  </p>
                )}
                <p className="text-sm text-gray-400 mt-4">
                  Created {new Date(team.createdAt).toLocaleDateString()}
                </p>
              </div>
              {isOwner && (
                <button
                  onClick={() => setShowEditModal(true)}
                  className="px-4 py-2 border rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Edit Team
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Team Members */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Members ({members.length})
            </h3>
            {isAdmin && (
              <button
                onClick={() => setShowAddMemberModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              >
                + Add Member
              </button>
            )}
          </div>

          <div className="divide-y dark:divide-gray-700">
            {/* Owner */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {team.owner.name?.[0]?.toUpperCase() || team.owner.email[0].toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {team.owner.name || team.owner.email}
                  </p>
                  <p className="text-sm text-gray-500">{team.owner.email}</p>
                </div>
              </div>
              <Badge variant="success">Owner</Badge>
            </div>

            {/* Members */}
            {members
              .filter((m) => m.userId !== team.ownerId)
              .map((member) => (
                <div key={member.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {member.user.name?.[0]?.toUpperCase() || member.user.email[0].toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {member.user.name || member.user.email}
                      </p>
                      <p className="text-sm text-gray-500">{member.user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getRoleVariant(member.role)}>{member.role}</Badge>
                    {isAdmin && member.userId !== user?.id && (
                      <button
                        onClick={() => handleRemoveMember(member.userId)}
                        className="text-red-500 hover:text-red-700 text-sm ml-2"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Edit Team Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Team"
      >
        <form onSubmit={handleUpdateTeam} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Team Name
            </label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="px-4 py-2 border rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Member Modal */}
      <Modal
        isOpen={showAddMemberModal}
        onClose={() => {
          setShowAddMemberModal(false);
          setError('');
        }}
        title="Add Team Member"
      >
        <form onSubmit={handleAddMember} className="p-6 space-y-4">
          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={newMemberEmail}
              onChange={(e) => setNewMemberEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Role
            </label>
            <select
              value={newMemberRole}
              onChange={(e) => setNewMemberRole(e.target.value as TeamRole)}
              className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value={TeamRole.MEMBER}>Member</option>
              <option value={TeamRole.ADMIN}>Admin</option>
            </select>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => {
                setShowAddMemberModal(false);
                setError('');
              }}
              className="px-4 py-2 border rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Add Member
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
