'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';
import { usersApi } from '@/lib/api/users';
import { User } from '@/types/user';
import { PageLoading } from '@/components/ui/loading';
import { toast } from '@/stores/toast-store';

export default function ProfilePage() {
  const router = useRouter();
  const { isAuthenticated, user: authUser, setUser } = useAuthStore();

  const [user, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    loadProfile();
  }, [isAuthenticated]);

  const loadProfile = async () => {
    try {
      const response = await usersApi.getMe();
      setUserData(response.data);
      setEditName(response.data.name || '');
      setEditAvatarUrl(response.data.avatarUrl || '');
    } catch (error) {
      console.error('Failed to load profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSubmitting(true);
    try {
      const response = await usersApi.updateMe({
        name: editName || undefined,
        avatarUrl: editAvatarUrl || undefined,
      });
      setUserData(response.data);
      // Update auth store user
      if (authUser) {
        setUser({
          ...authUser,
          name: response.data.name,
          avatarUrl: response.data.avatarUrl,
        });
      }
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setEditName(user?.name || '');
    setEditAvatarUrl(user?.avatarUrl || '');
    setIsEditing(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!isAuthenticated) return null;
  if (loading) return <PageLoading />;
  if (!user) return <div className="p-8 text-center">Failed to load profile</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/tasks" className="text-gray-500 hover:text-gray-700 dark:text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Profile</h1>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700"
            >
              Edit
            </button>
          )}
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          {/* Avatar Section */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-8">
            <div className="flex items-center gap-6">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-24 h-24 rounded-full border-4 border-white object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full border-4 border-white bg-white/20 flex items-center justify-center text-white text-3xl font-bold">
                  {user.name?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="text-white">
                <h2 className="text-2xl font-bold">{user.name || 'No name set'}</h2>
                <p className="opacity-90">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="p-6">
            {isEditing ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Avatar URL
                  </label>
                  <input
                    type="url"
                    value={editAvatarUrl}
                    onChange={(e) => setEditAvatarUrl(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Enter a URL to an image for your avatar
                  </p>
                </div>

                {editAvatarUrl && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Preview
                    </label>
                    <img
                      src={editAvatarUrl}
                      alt="Avatar preview"
                      className="w-20 h-20 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleSave}
                    disabled={submitting}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-6 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:border-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Email
                    </label>
                    <p className="text-gray-900 dark:text-white">{user.email}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Display Name
                    </label>
                    <p className="text-gray-900 dark:text-white">{user.name || 'Not set'}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Member Since
                    </label>
                    <p className="text-gray-900 dark:text-white">{formatDate(user.createdAt)}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      User ID
                    </label>
                    <p className="text-gray-900 dark:text-white font-mono text-sm">{user.id}</p>
                  </div>
                </div>

                <div className="pt-6 border-t dark:border-gray-700">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Quick Links</h3>
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href="/settings"
                      className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:border-gray-600"
                    >
                      Settings
                    </Link>
                    <Link
                      href="/tasks"
                      className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:border-gray-600"
                    >
                      My Tasks
                    </Link>
                    <Link
                      href="/teams"
                      className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:border-gray-600"
                    >
                      My Teams
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
