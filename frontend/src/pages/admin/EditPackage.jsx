import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { ChevronRight, AlertCircle, Loader2 } from 'lucide-react';
import { packageService } from '../../services/packageService';
import { toast } from 'sonner';

const validationSchema = Yup.object().shape({
  name: Yup.string().min(3, 'Name must be at least 3 characters').max(100, 'Name must not exceed 100 characters').required('Name is required'),
  base_price: Yup.number().positive('Base price must be positive').required('Base price is required'),
  base_distance: Yup.number().positive('Base distance must be positive').required('Base distance is required'),
  swap_count: Yup.number().integer('Swap count must be an integer').positive('Swap count must be positive').required('Swap count is required'),
  duration_days: Yup.number().integer('Duration must be in days').positive('Duration must be positive').required('Duration is required'),
  description: Yup.string().optional(),
  active: Yup.boolean().required('Active status is required'),
});

export default function EditPackage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [packageData, setPackageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchPackageData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchPackageData = async () => {
    try {
      setLoading(true);
      const data = await packageService.getPackageById(id);
      setPackageData(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching package:', err);
      setError(err.response?.data?.message || 'Failed to load package data');
    } finally {
      setLoading(false);
    }
  };

  const formik = useFormik({
    initialValues: packageData
      ? {
          name: packageData.name || '',
          base_price: packageData.base_price || 0,
          base_distance: packageData.base_distance || 0,
          swap_count: packageData.swap_count || 0,
          duration_days: packageData.duration_days || 0,
          description: packageData.description || '',
          active: packageData.active || false,
        }
      : {
          name: '',
          base_price: 0,
          base_distance: 0,
          swap_count: 0,
          duration_days: 0,
          description: '',
          active: false,
        },
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      try {
        setSubmitting(true);
        await packageService.updatePackage(id, values);
        toast.success('Package updated successfully');
        navigate(`/admin/packages/${id}`);
      } catch (err) {
        console.error('Error updating package:', err);
        toast.error(err.response?.data?.message || 'Failed to update package');
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleCancel = () => {
    navigate(`/admin/packages/${id}`);
  };

  useEffect(() => {
    const isDirty = Object.keys(formik.values).some((key) => formik.values[key] !== formik.initialValues[key]);
    setHasChanges(isDirty);
  }, [formik.values, formik.initialValues]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-slate-600 dark:text-slate-400">Loading package...</p>
        </div>
      </div>
    );
  }

  if (error || !packageData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-3" />
          <p className="text-slate-600 dark:text-slate-400 mb-4">{error || 'Package not found'}</p>
          <Button onClick={() => navigate('/admin/packages-list')} variant="outline">
            Back to Packages
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm mb-6">
          <a href="/admin/dashboard" className="text-primary hover:text-primary/80">
            Dashboard
          </a>
          <ChevronRight className="h-4 w-4 text-slate-400" />
          <a href="/admin/packages-list" className="text-primary hover:text-primary/80">
            Packages
          </a>
          <ChevronRight className="h-4 w-4 text-slate-400" />
          <a href={`/admin/packages/${id}`} className="text-slate-600 dark:text-slate-400 hover:text-primary">
            {packageData.name}
          </a>
          <ChevronRight className="h-4 w-4 text-slate-400" />
          <span className="text-slate-900 dark:text-slate-100 font-medium">Edit</span>
        </div>

        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">Edit Package</h1>
          <p className="text-slate-600 dark:text-slate-400">Update package details and configuration</p>
        </div>

        {/* Form Card */}
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
          <CardHeader className="border-b border-slate-200 dark:border-slate-800 p-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{packageData.name}</h2>
          </CardHeader>

          <form onSubmit={formik.handleSubmit}>
            <CardContent className="p-6">
              <div className="grid grid-cols-3 gap-6">
                {/* Package ID (Read-only) */}
                <div className="flex flex-col col-span-1">
                  <label className="text-slate-800 dark:text-slate-200 text-sm font-medium leading-normal pb-2">Package ID</label>
                  <input
                    type="text"
                    value={`${id}`}
                    className="form-input flex w-full rounded-lg text-slate-500 dark:text-slate-400 focus:outline-0 border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 h-11 p-3 text-sm cursor-not-allowed"
                    readOnly
                  />
                </div>

                {/* Package Name */}
                <div className="flex flex-col col-span-2">
                  <label className="text-slate-800 dark:text-slate-200 text-sm font-medium leading-normal pb-2">
                    Package Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formik.values.name}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`form-input flex w-full rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 border bg-slate-50 dark:bg-slate-800/50 h-11 placeholder:text-slate-400 dark:placeholder:text-slate-500 p-3 text-sm ${
                      formik.touched.name && formik.errors.name ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' : 'border-slate-300 dark:border-slate-700 focus:ring-primary/50 focus:border-primary'
                    }`}
                    placeholder="Enter package name"
                  />
                  {formik.touched.name && formik.errors.name && <p className="text-red-500 text-xs mt-1">{formik.errors.name}</p>}
                </div>

                {/* Base Price */}
                <div className="flex flex-col col-span-1">
                  <label className="text-slate-800 dark:text-slate-200 text-sm font-medium leading-normal pb-2">
                    Base Price (₫) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="base_price"
                    value={formik.values.base_price}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    step="0.01"
                    className={`form-input flex w-full rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 border bg-slate-50 dark:bg-slate-800/50 h-11 placeholder:text-slate-400 dark:placeholder:text-slate-500 p-3 text-sm ${
                      formik.touched.base_price && formik.errors.base_price ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' : 'border-slate-300 dark:border-slate-700 focus:ring-primary/50 focus:border-primary'
                    }`}
                    placeholder="0.00"
                  />
                  {formik.touched.base_price && formik.errors.base_price && <p className="text-red-500 text-xs mt-1">{formik.errors.base_price}</p>}
                </div>

                {/* Base Distance */}
                <div className="flex flex-col col-span-1">
                  <label className="text-slate-800 dark:text-slate-200 text-sm font-medium leading-normal pb-2">
                    Base Distance (km) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="base_distance"
                    value={formik.values.base_distance}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    step="0.1"
                    className={`form-input flex w-full rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 border bg-slate-50 dark:bg-slate-800/50 h-11 placeholder:text-slate-400 dark:placeholder:text-slate-500 p-3 text-sm ${
                      formik.touched.base_distance && formik.errors.base_distance ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' : 'border-slate-300 dark:border-slate-700 focus:ring-primary/50 focus:border-primary'
                    }`}
                    placeholder="0.0"
                  />
                  {formik.touched.base_distance && formik.errors.base_distance && <p className="text-red-500 text-xs mt-1">{formik.errors.base_distance}</p>}
                </div>

                {/* Swap Count */}
                <div className="flex flex-col col-span-1">
                  <label className="text-slate-800 dark:text-slate-200 text-sm font-medium leading-normal pb-2">
                    Swap Count <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="swap_count"
                    value={formik.values.swap_count}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    min="1"
                    className={`form-input flex w-full rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 border bg-slate-50 dark:bg-slate-800/50 h-11 placeholder:text-slate-400 dark:placeholder:text-slate-500 p-3 text-sm ${
                      formik.touched.swap_count && formik.errors.swap_count ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' : 'border-slate-300 dark:border-slate-700 focus:ring-primary/50 focus:border-primary'
                    }`}
                    placeholder="1"
                  />
                  {formik.touched.swap_count && formik.errors.swap_count && <p className="text-red-500 text-xs mt-1">{formik.errors.swap_count}</p>}
                </div>

                {/* Duration Days */}
                <div className="flex flex-col col-span-1">
                  <label className="text-slate-800 dark:text-slate-200 text-sm font-medium leading-normal pb-2">
                    Duration (days) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="duration_days"
                    value={formik.values.duration_days}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    min="1"
                    className={`form-input flex w-full rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 border bg-slate-50 dark:bg-slate-800/50 h-11 placeholder:text-slate-400 dark:placeholder:text-slate-500 p-3 text-sm ${
                      formik.touched.duration_days && formik.errors.duration_days ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' : 'border-slate-300 dark:border-slate-700 focus:ring-primary/50 focus:border-primary'
                    }`}
                    placeholder="30"
                  />
                  {formik.touched.duration_days && formik.errors.duration_days && <p className="text-red-500 text-xs mt-1">{formik.errors.duration_days}</p>}
                </div>

                {/* Description */}
                <div className="flex flex-col col-span-3">
                  <label className="text-slate-800 dark:text-slate-200 text-sm font-medium leading-normal pb-2">Description</label>
                  <textarea
                    name="description"
                    value={formik.values.description}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`form-textarea flex w-full rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 border bg-slate-50 dark:bg-slate-800/50 h-24 placeholder:text-slate-400 dark:placeholder:text-slate-500 p-3 text-sm resize-none ${
                      formik.touched.description && formik.errors.description ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' : 'border-slate-300 dark:border-slate-700 focus:ring-primary/50 focus:border-primary'
                    }`}
                    placeholder="Enter package description"
                  />
                  {formik.touched.description && formik.errors.description && <p className="text-red-500 text-xs mt-1">{formik.errors.description}</p>}
                </div>

                {/* Active Status */}
                <div className="flex flex-col col-span-1">
                  <label className="text-slate-800 dark:text-slate-200 text-sm font-medium leading-normal pb-2">
                    Active <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-3 h-11">
                    <input
                      type="checkbox"
                      name="active"
                      checked={formik.values.active}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className="w-5 h-5 rounded border-slate-300 dark:border-slate-700 cursor-pointer accent-primary"
                    />
                    <span className="text-slate-600 dark:text-slate-400 text-sm">{formik.values.active ? 'Active' : 'Inactive'}</span>
                  </div>
                  {formik.touched.active && formik.errors.active && <p className="text-red-500 text-xs mt-1">{formik.errors.active}</p>}
                </div>
              </div>
            </CardContent>

            {/* Form Actions */}
            <div className="p-6 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900/20 border-t border-slate-200 dark:border-slate-800 rounded-b-xl">
              <Button type="button" variant="outline" onClick={handleCancel} disabled={submitting} className="px-4">
                Cancel
              </Button>
              <Button type="submit" disabled={submitting || !formik.isValid} className="px-4">
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
