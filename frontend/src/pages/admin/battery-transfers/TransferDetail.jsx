import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Edit,
  Trash2,
  ChevronRight,
  AlertCircle,
  MapPin,
  Package,
  Zap
} from 'lucide-react';
import { batteryTransferService } from '../../../services/batteryTransferService';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { toast } from 'sonner';

export default function BatteryTransferDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetchTransferDetail();
  }, [id]);

  const fetchTransferDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await batteryTransferService.getRequestById(id);
      setRequest(data);
    } catch (err) {
      console.error('Error fetching transfer request details:', err);
      setError(err.response?.data?.message || 'Failed to load transfer request details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      // Check if service has delete method
      if (!batteryTransferService.deleteRequest) {
        toast.error('Delete functionality not available');
        return;
      }
      
      await batteryTransferService.deleteRequest(id);
      toast.success('Transfer request deleted successfully!');
      navigate('/admin/battery-transfer-requests');
    } catch (err) {
      console.error('Error deleting transfer request:', err);
      toast.error(err.response?.data?.message || 'Failed to delete transfer request');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading transfer request details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <AlertCircle className="h-6 w-6" />
              <div>
                <h3 className="font-semibold">Error Loading Transfer Request</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">{error}</p>
              </div>
            </div>
            <Button onClick={() => navigate('/admin/battery-transfer-requests')} className="w-full">
              Back to Requests
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-600 dark:text-slate-400">Transfer request not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent">
      <div className="mx-auto max-w-7xl p-8">
        {/* Breadcrumbs */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Link
            to="/admin/battery-transfer-requests"
            className="text-slate-500 dark:text-slate-400 text-sm font-medium hover:text-primary transition-colors"
          >
            Transfer Requests
          </Link>
          <ChevronRight className="h-4 w-4 text-slate-400" />
          <span className="text-slate-900 dark:text-slate-50 text-sm font-medium">
            Request #{request.transfer_request_id}
          </span>
        </div>

        {/* Page Header */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex-1 min-w-72">
              <h1 className="text-slate-900 dark:text-white text-3xl font-bold leading-tight tracking-tight mb-2">
                {request.battery_model} Transfer
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Request ID: {request.transfer_request_id}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={() => navigate(`/admin/battery-transfer-requests/edit/${id}`)}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit Request
              </Button>
              <Button
                onClick={() => setShowDeleteModal(true)}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="flex flex-col gap-8 lg:col-span-2">
            {/* Transfer Details Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Transfer Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-500 dark:text-slate-400 text-sm mb-1 flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Battery Model
                    </span>
                    <span className="text-slate-800 dark:text-slate-200 text-base">{request.battery_model}</span>
                  </div>

                  <div className="flex flex-col">
                    <span className="font-medium text-slate-500 dark:text-slate-400 text-sm mb-1">
                      Battery Type
                    </span>
                    <span className="text-slate-800 dark:text-slate-200 text-base">{request.battery_type}</span>
                  </div>

                  <div className="flex flex-col">
                    <span className="font-medium text-slate-500 dark:text-slate-400 text-sm mb-1 flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Quantity
                    </span>
                    <span className="text-slate-800 dark:text-slate-200 text-base">{request.quantity} units</span>
                  </div>

                  <div className="flex flex-col">
                    <span className="font-medium text-slate-500 dark:text-slate-400 text-sm mb-1">
                      Status
                    </span>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(request.status)}`}>
                      {request.status}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Station Transfer Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Station Transfer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* From Station */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      From Station
                    </h3>
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                        {request.fromStation?.name || 'N/A'}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        {request.fromStation?.address || 'No address'}
                      </p>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="flex justify-center">
                    <div className="text-2xl text-slate-400">↓</div>
                  </div>

                  {/* To Station */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      To Station
                    </h3>
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                        {request.toStation?.name || 'N/A'}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        {request.toStation?.address || 'No address'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="max-w-md w-full mx-4">
            <CardContent className="pt-6">
              <div className="flex items-start mb-4">
                <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">Delete Transfer Request</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Are you sure you want to delete this transfer request? This action cannot be undone.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <Button
                  onClick={() => setShowDeleteModal(false)}
                  variant="outline"
                  disabled={deleting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDelete}
                  variant="destructive"
                  disabled={deleting}
                >
                  {deleting ? 'Deleting...' : 'Delete Request'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
