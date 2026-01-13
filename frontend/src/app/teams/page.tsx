'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';
import { useTeams, useCreateTeam } from '@/hooks/use-teams';
import { Team } from '@/types/team';
import { getErrorMessage } from '@/lib/utils/error';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { AppHeader } from '@/components/layout/app-header';

export default function TeamsPage() {
  const router = useRouter();
  const { user, isAuthenticated, _hasHydrated } = useAuthStore();
  const { data: teams, isLoading } = useTeams();
  const createTeamMutation = useCreateTeam();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (_hasHydrated && !isAuthenticated) {
      router.push('/login');
    }
  }, [_hasHydrated, isAuthenticated, router]);

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
      setShowCreateModal(false);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to create team'));
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AppHeader activeNav="teams" />

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">My Teams</h2>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              + Create Team
            </button>
          </div>

          <div className="divide-y dark:divide-gray-700">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">Loading teams...</div>
            ) : !teams || teams.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No teams yet. Create your first team!
              </div>
            ) : (
              teams.map((team: Team) => (
                <Link
                  key={team.id}
                  href={`/teams/${team.id}`}
                  className="block p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {team.name}
                      </h3>
                      {team.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {team.description}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        Created {new Date(team.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {team.ownerId === user?.id && (
                        <Badge variant="primary">Owner</Badge>
                      )}
                      <svg
                        className="w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Create Team Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setError('');
        }}
        title="Create New Team"
      >
        <form onSubmit={handleCreateTeam} className="p-6 space-y-4">
          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Team Name
            </label>
            <input
              type="text"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              placeholder="Enter team name"
              className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description (optional)
            </label>
            <textarea
              value={newTeamDescription}
              onChange={(e) => setNewTeamDescription(e.target.value)}
              placeholder="Enter team description"
              rows={3}
              className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => {
                setShowCreateModal(false);
                setError('');
              }}
              className="px-4 py-2 border rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createTeamMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {createTeamMutation.isPending ? 'Creating...' : 'Create Team'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
