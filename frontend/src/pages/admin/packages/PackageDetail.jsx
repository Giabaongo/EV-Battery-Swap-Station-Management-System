import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Edit,
  Trash2,
  ChevronRight,
  AlertCircle,
  DollarSign,
  FileText
} from 'lucide-react';
import { packageService } from '../../../services/packageService';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { toast } from 'sonner';

export default function PackageDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetchPackageDetail();
  }, [id]);

  const fetchPackageDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await packageService.getPackageById(id);
      setPkg(data);
    } catch (err) {
      console.error('Error fetching package details:', err);
      setError(err.response?.data?.message || 'Failed to load package details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      // Check if packageService has a deletePackage method
      if (!packageService.deletePackage) {
        toast.error('Delete functionality not available');
        return;
      }
      
      await packageService.deletePackage(id);
      toast.success('Package deleted successfully!');
      navigate('/admin/packages-list');
    } catch (err) {
      console.error('Error deleting package:', err);
      toast.error(err.response?.data?.message || 'Failed to delete package');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading package details...</p>
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
                <h3 className="font-semibold">Error Loading Package</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">{error}</p>
              </div>
            </div>
            <Button onClick={() => navigate('/admin/packages-list')} className="w-full">
              Back to Packages
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-600 dark:text-slate-400">Package not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent">
      <div className="mx-auto max-w-7xl p-8">
        {/* Breadcrumbs */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Link
            to="/admin/packages-list"
            className="text-slate-500 dark:text-slate-400 text-sm font-medium hover:text-primary transition-colors"
          >
            Packages
          </Link>
          <ChevronRight className="h-4 w-4 text-slate-400" />
          <span className="text-slate-900 dark:text-slate-50 text-sm font-medium">
            {pkg.name}
          </span>
        </div>

        {/* Page Header */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex-1 min-w-72">
              <h1 className="text-slate-900 dark:text-white text-3xl font-bold leading-tight tracking-tight mb-2">
                {pkg.name}
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Package ID: {pkg.package_id}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={() => navigate(`/admin/packages/edit/${id}`)}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit Package
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
          <div className="flex flex-col gap-8">
            {/* Package Details Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Package Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-12 pr-12 gap-4 ">
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-500 dark:text-slate-400 text-sm mb-1">
                      Package Name
                    </span>
                    <span className="text-slate-800 dark:text-slate-200 text-base">{pkg.name}</span>
                  </div>

                  <div className="flex flex-col">
                    <span className="font-medium text-slate-500 dark:text-slate-400 text-sm mb-1 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Base Price
                    </span>
                    <span className="text-slate-800 dark:text-slate-200 text-base">
                      ₫{Number(pkg.base_price).toLocaleString('vi-VN')}
                    </span>
                  </div>

                  <div className="flex flex-col">
                    <span className="font-medium text-slate-500 dark:text-slate-400 text-sm mb-1">
                      Base Distance
                    </span>
                    <span className="text-slate-800 dark:text-slate-200 text-base">
                      {pkg.base_distance?.toLocaleString()} km
                    </span>
                  </div>

                  <div className="flex flex-col">
                    <span className="font-medium text-slate-500 dark:text-slate-400 text-sm mb-1">
                      Battery Count
                    </span>
                    <span className="text-slate-800 dark:text-slate-200 text-base">
                      {pkg.battery_count} battery/batteries
                    </span>
                  </div>

                  <div className="flex flex-col">
                    <span className="font-medium text-slate-500 dark:text-slate-400 text-sm mb-1">
                      Swap Count
                    </span>
                    <span className="text-slate-800 dark:text-slate-200 text-base">
                      {pkg.swap_count} swaps
                    </span>
                  </div>

                  <div className="flex flex-col">
                    <span className="font-medium text-slate-500 dark:text-slate-400 text-sm mb-1">
                      Duration
                    </span>
                    <span className="text-slate-800 dark:text-slate-200 text-base">
                      {pkg.duration_days} days
                    </span>
                  </div>

                  <div className="flex flex-col">
                    <span className="font-medium text-slate-500 dark:text-slate-400 text-sm mb-1">
                      Status
                    </span>
                    <span className={`text-base font-medium ${pkg.active ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {pkg.active ? '✓ Active' : '✗ Inactive'}
                    </span>
                  </div>

                  <div className="flex flex-col md:col-span-2">
                    <span className="font-medium text-slate-500 dark:text-slate-400 text-sm mb-1 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Description
                    </span>
                    <span className="text-slate-800 dark:text-slate-200 text-base leading-relaxed">
                      {pkg.description || 'No description provided'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="flex flex-col gap-8">
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
                  <h3 className="font-semibold text-slate-900 dark:text-white">Delete Package</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Are you sure you want to delete "{pkg.name}"? This action cannot be undone.
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
                  {deleting ? 'Deleting...' : 'Delete Package'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}