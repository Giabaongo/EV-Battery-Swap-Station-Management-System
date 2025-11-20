import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Mail,
  User,
  Trash2,
  Edit,
  ChevronRight,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { userService } from '../../../services/userService';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { toast } from 'sonner';

export default function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchUserDetail();
  }, [id]);

  const fetchUserDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const userData = await userService.getUserById(id);
      setUser(userData);
    } catch (err) {
      console.error('Error fetching user details:', err);
      setError(err.response?.data?.message || 'Failed to load user details');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role) => {
    const roleMap = {
      admin: { label: 'Admin', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
      driver: { label: 'Driver', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
      station_staff: { label: 'Station Staff', className: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
    };

    const config = roleMap[role] || { label: role, className: 'bg-gray-100 text-gray-700' };
    return config;
  };

  const handleDeleteUser = async () => {
    try {
      setIsDeleting(true);
      await userService.deleteUser(id);
      toast.success('User deleted successfully');
      navigate('/admin/users-list');
    } catch (err) {
      console.error('Error deleting user:', err);
      toast.error(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading user details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-red-600">
              <AlertCircle className="h-6 w-6" />
              <div>
                <h3 className="font-semibold">Error Loading User</h3>
                <p className="text-sm text-slate-600">{error}</p>
              </div>
            </div>
            <Button onClick={() => navigate('/admin/users-list')} className="mt-4 w-full">
              Back to Users
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-600 dark:text-slate-400">User not found</p>
      </div>
    );
  }

  const roleConfig = getRoleBadge(user.role);

  return (
    <div className="min-h-screen bg-transparent">
      <div className="mx-auto max-w-7xl p-8">
        {/* Breadcrumbs */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Link
            to="/admin/users-list"
            className="text-slate-500 dark:text-slate-400 text-sm font-medium hover:text-primary transition-colors"
          >
            Users
          </Link>
          <ChevronRight className="h-4 w-4 text-slate-400" />
          <span className="text-slate-900 dark:text-slate-50 text-sm font-medium">
            {user.username}
          </span>
        </div>

        {/* Page Header */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex-1 min-w-72">
              <h1 className="text-slate-900 dark:text-white text-3xl font-bold leading-tight tracking-tight mb-2">
                {user.username}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={() => navigate(`/admin/users/edit/${id}`)}
                className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800"
              >
                <Edit className="h-4 w-4" />
                Edit User
              </Button>
              <Button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4" />
                Delete User
              </Button>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <Card className="max-w-md">
              <CardHeader>
                <CardTitle>Delete User?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  Are you sure you want to delete <strong>{user.name}</strong>? This action cannot be undone.
                </p>
                <div className="flex gap-3 justify-end">
                  <Button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="bg-slate-200 text-slate-900 hover:bg-slate-300"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleDeleteUser}
                    disabled={isDeleting}
                    className="bg-red-600 hover:bg-red-700 flex items-center gap-2"
                  >
                    {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols gap-8 lg:grid-cols-3">
          {/* Left Column */}
          <div className="flex flex-col gap-8 lg:col-span-1">
            {/* User Details Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">User Details</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4 text-base">
                  <li className="flex flex-col">
                    <span className="font-medium text-slate-500 dark:text-slate-400">User ID</span>
                    <span className="text-slate-800 dark:text-slate-200">{user.user_id}</span>
                  </li>
                  <li className="flex flex-col">
                    <span className="font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Username
                    </span>
                    <span className="text-slate-800 dark:text-slate-200">{user.username || 'N/A'}</span>
                  </li>
                  <li className="flex flex-col">
                    <span className="font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </span>
                    <span className="text-slate-800 dark:text-slate-200 break-all">{user.email || 'N/A'}</span>
                  </li>
                  <li className="flex flex-col">
                    <span className="font-medium text-slate-500 dark:text-slate-400">Role</span>
                    <div className="mt-1">
                      <Badge className={roleConfig.className}>
                        {roleConfig.label}
                      </Badge>
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Contact Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Contact Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <span className="font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </span>
                    <a
                      href={`mailto:${user.email}`}
                      className="text-blue-700 dark:text-blue-400 hover:underline break-all"
                    >
                      {user.email}
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="flex flex-col gap-8 lg:col-span-2">
            {/* User Account Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Account Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Email Verified</p>
                      <p className="text-slate-800 dark:text-slate-200">
                        {user.email_verified ? 'Yes' : 'No'}
                      </p>
                    </div>
                  </div>

                  {user.created_at && (
                    <div>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Created At</p>
                      <p className="text-slate-800 dark:text-slate-200">
                        {new Date(user.created_at).toLocaleString()}
                      </p>
                    </div>
                  )}

                  {user.updated_at && (
                    <div>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Last Updated</p>
                      <p className="text-slate-800 dark:text-slate-200">
                        {new Date(user.updated_at).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

