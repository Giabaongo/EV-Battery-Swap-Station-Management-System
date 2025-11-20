import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Mail,
  MessageSquare,
  Trash2,
  Edit,
  ChevronRight,
  AlertCircle,
  Loader2,
  Star,
  Calendar,
  User,
  MapPin
} from 'lucide-react';
import { supportService } from '../../../services/supportService';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { toast } from 'sonner';

export default function SupportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchSupportDetail();
  }, [id]);

  const fetchSupportDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await supportService.getSupportById(id);
      setTicket(data);
    } catch (err) {
      console.error('Error fetching support ticket details:', err);
      setError(err.response?.data?.message || 'Failed to load support ticket details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      open: { label: 'Open', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
      in_progress: { label: 'In Progress', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' },
      resolved: { label: 'Resolved', className: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
      closed: { label: 'Closed', className: 'bg-gray-100 text-gray-700 dark:bg-gray-900/40 dark:text-gray-300' },
    };

    const config = statusMap[status?.toLowerCase()] || { label: status, className: 'bg-gray-100 text-gray-700' };
    return config;
  };

  const getTypeBadge = (type) => {
    const typeMap = {
      battery: { label: 'Battery', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
      station: { label: 'Station', className: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' },
      other: { label: 'Other', className: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300' },
    };

    const config = typeMap[type?.toLowerCase()] || { label: type, className: 'bg-gray-100 text-gray-700' };
    return config;
  };

  const handleDeleteTicket = async () => {
    try {
      setIsDeleting(true);
      await supportService.deleteSupport(id);
      toast.success('Support ticket deleted successfully');
      navigate('/admin/support');
    } catch (err) {
      console.error('Error deleting support ticket:', err);
      toast.error(err.response?.data?.message || 'Failed to delete support ticket');
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
          <p className="text-slate-600 dark:text-slate-400">Loading support ticket details...</p>
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
                <h3 className="font-semibold">Error Loading Ticket</h3>
                <p className="text-sm text-slate-600">{error}</p>
              </div>
            </div>
            <Button onClick={() => navigate('/admin/support')} className="mt-4 w-full">
              Back to Support
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-600 dark:text-slate-400">Support ticket not found</p>
      </div>
    );
  }

  const statusConfig = getStatusBadge(ticket.status);
  const typeConfig = getTypeBadge(ticket.type);

  return (
    <div className="min-h-screen bg-transparent">
      <div className="mx-auto max-w-7xl p-8">
        {/* Breadcrumbs */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Link
            to="/admin/support"
            className="text-slate-500 dark:text-slate-400 text-sm font-medium hover:text-primary transition-colors"
          >
            Support Tickets
          </Link>
          <ChevronRight className="h-4 w-4 text-slate-400" />
          <span className="text-slate-900 dark:text-slate-50 text-sm font-medium">
            Ticket #{ticket.support_id}
          </span>
        </div>

        {/* Page Header */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex-1 min-w-72">
              <h1 className="text-slate-900 dark:text-white text-3xl font-bold leading-tight tracking-tight mb-2">
                Ticket #{ticket.support_id}
              </h1>
              <p className="text-slate-600 dark:text-slate-400">{ticket.description}</p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={() => navigate(`/admin/support/${id}/edit`)}
                className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800"
              >
                <Edit className="h-4 w-4" />
                Update Ticket
              </Button>
              <Button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <Card className="max-w-md">
              <CardHeader>
                <CardTitle>Delete Support Ticket?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  Are you sure you want to delete this support ticket? This action cannot be undone.
                </p>
                <div className="flex gap-3 justify-end">
                  <Button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="bg-slate-200 text-slate-900 hover:bg-slate-300"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleDeleteTicket}
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
            {/* Ticket Status Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Ticket Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4 text-base">
                  <li className="flex flex-col">
                    <span className="font-medium text-slate-500 dark:text-slate-400">Status</span>
                    <div className="mt-1">
                      <Badge className={statusConfig.className}>
                        {statusConfig.label}
                      </Badge>
                    </div>
                  </li>
                  <li className="flex flex-col">
                    <span className="font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Type
                    </span>
                    <div className="mt-1">
                      <Badge className={typeConfig.className}>
                        {typeConfig.label}
                      </Badge>
                    </div>
                  </li>
                  <li className="flex flex-col">
                    <span className="font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      Rating
                    </span>
                    <span className="text-slate-800 dark:text-slate-200">
                      {ticket.rating ? `${ticket.rating.toFixed(1)} ⭐` : 'Not rated'}
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* User Info Card */}
            {ticket.user && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">User Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4 text-base">
                    <li className="flex flex-col">
                      <span className="font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Username
                      </span>
                      <span className="text-slate-800 dark:text-slate-200">{ticket.user.username || 'N/A'}</span>
                    </li>
                    <li className="flex flex-col">
                      <span className="font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email
                      </span>
                      <a
                        href={`mailto:${ticket.user.email}`}
                        className="text-blue-600 dark:text-blue-400 hover:underline break-all"
                      >
                        {ticket.user.email || 'N/A'}
                      </a>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Station Info Card */}
            {ticket.station && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Related Station</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4 text-base">
                    <li className="flex flex-col">
                      <span className="font-medium text-slate-500 dark:text-slate-400">Station Name</span>
                      <span className="text-slate-800 dark:text-slate-200">{ticket.station.name || 'N/A'}</span>
                    </li>
                    <li className="flex flex-col">
                      <span className="font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Address
                      </span>
                      <span className="text-slate-800 dark:text-slate-200">{ticket.station.address || 'N/A'}</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column */}
          <div className="flex flex-col gap-8 lg:col-span-2">
            {/* Description Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {ticket.description || 'No description provided'}
                </p>
              </CardContent>
            </Card>

            {/* Response Card */}
            {ticket.response && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Response</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {ticket.response}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Ticket Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Ticket Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Ticket ID</p>
                      <p className="text-slate-800 dark:text-slate-200">{ticket.support_id}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Type</p>
                      <p className="text-slate-800 dark:text-slate-200">{ticket.type || 'N/A'}</p>
                    </div>
                  </div>

                  {ticket.created_at && (
                    <div>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Created At
                      </p>
                      <p className="text-slate-800 dark:text-slate-200">
                        {new Date(ticket.created_at).toLocaleString('vi-VN')}
                      </p>
                    </div>
                  )}

                  {ticket.updated_at && (
                    <div>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Last Updated
                      </p>
                      <p className="text-slate-800 dark:text-slate-200">
                        {new Date(ticket.updated_at).toLocaleString('vi-VN')}
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
