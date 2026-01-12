'use client';

import { useState, useEffect, useCallback } from 'react';
import { Modal } from '@/components/ui/modal';
import { Loading } from '@/components/ui/loading';
import { usersApi } from '@/lib/api/users';
import { teamsApi } from '@/lib/api/teams';
import { UserSummary } from '@/types/user';
import { TeamMember } from '@/types/team';

interface UserSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  teamId?: string | null;
  selectedUserIds: string[];
  onSelect: (user: UserSummary) => void;
  onRemove: (userId: string) => void;
}

export function UserSelectModal({
  isOpen,
  onClose,
  title,
  teamId,
  selectedUserIds,
  onSelect,
  onRemove,
}: UserSelectModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSummary[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'team' | 'search'>('team');

  // Load team members when modal opens
  useEffect(() => {
    if (isOpen && teamId) {
      loadTeamMembers();
    }
  }, [isOpen, teamId]);

  const loadTeamMembers = async () => {
    if (!teamId) return;
    setLoading(true);
    try {
      const response = await teamsApi.getMembers(teamId);
      setTeamMembers(response.data || []);
    } catch (error) {
      console.error('Failed to load team members:', error);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await usersApi.searchUsers(searchQuery);
        setSearchResults(response.data || []);
      } catch (error) {
        console.error('Failed to search users:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleClose = () => {
    setSearchQuery('');
    setSearchResults([]);
    setActiveTab('team');
    onClose();
  };

  const isSelected = (userId: string) => selectedUserIds.includes(userId);

  const renderUserItem = (user: UserSummary) => {
    const selected = isSelected(user.id);
    return (
      <div
        key={user.id}
        className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
            {user.name?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{user.name || 'No name'}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>
        {selected ? (
          <button
            onClick={() => onRemove(user.id)}
            className="px-3 py-1 text-sm text-red-600 hover:text-red-700 border border-red-300 rounded"
          >
            Remove
          </button>
        ) : (
          <button
            onClick={() => onSelect(user)}
            className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 border border-blue-300 rounded"
          >
            Add
          </button>
        )}
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} size="lg">
      <div className="p-4">
        {/* Tabs */}
        <div className="flex border-b dark:border-gray-700 mb-4">
          {teamId && (
            <button
              onClick={() => setActiveTab('team')}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
                activeTab === 'team'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Team Members
            </button>
          )}
          <button
            onClick={() => setActiveTab('search')}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              activeTab === 'search'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Search All Users
          </button>
        </div>

        {/* Team Members Tab */}
        {activeTab === 'team' && teamId && (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="py-8"><Loading /></div>
            ) : teamMembers.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No team members found</p>
            ) : (
              teamMembers.map((member) => renderUserItem(member.user))
            )}
          </div>
        )}

        {/* Search Tab */}
        {activeTab === 'search' && (
          <div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white mb-4"
              autoFocus
            />
            <div className="space-y-2 max-h-[350px] overflow-y-auto">
              {loading ? (
                <div className="py-8"><Loading /></div>
              ) : searchQuery && searchResults.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No users found</p>
              ) : !searchQuery ? (
                <p className="text-center text-gray-500 py-4">Start typing to search users</p>
              ) : (
                searchResults.map((user) => renderUserItem(user))
              )}
            </div>
          </div>
        )}

        {/* Selected Users Summary */}
        {selectedUserIds.length > 0 && (
          <div className="mt-4 pt-4 border-t dark:border-gray-700">
            <p className="text-sm text-gray-500">
              {selectedUserIds.length} user{selectedUserIds.length > 1 ? 's' : ''} selected
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
