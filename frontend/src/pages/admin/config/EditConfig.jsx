import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Card, CardContent, CardHeader } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { ChevronRight, AlertCircle, Loader2, Settings } from 'lucide-react';
import { configService } from '../../../services/configService';
import { toast } from 'sonner';

const validationSchema = Yup.object().shape({
  name: Yup.string(),
  type: Yup.string(),
  value: Yup.number().nullable().typeError('Value must be a number'),
  string_value: Yup.string().nullable(),
  description: Yup.string().nullable(),
  is_active: Yup.boolean(),
});

export default function EditConfig() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [configData, setConfigData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchConfigData();
  }, [id]);

  const fetchConfigData = async () => {
    try {
      setLoading(true);
      const data = await configService.getConfigById(id);
      setConfigData(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching config:', err);
      setError(err.response?.data?.message || 'Failed to load configuration data');
    } finally {
      setLoading(false);
    }
  };

  const formik = useFormik({
    initialValues: configData
      ? {
          name: configData.name || '',
          type: configData.type || 'other',
          value: configData.value || 0,
          string_value: configData.string_value || '',
          description: configData.description || '',
          is_active: configData.is_active ?? true,
        }
      : {
          name: '',
          type: 'other',
          value: 0,
          string_value: '',
          description: '',
          is_active: true,
        },
    enableReinitialize: true,
    validationSchema,
    onSubmit: async (values) => {
      try {
        setSubmitting(true);

        // Only allow updating value, string_value, and description
        const payload = {
          value: values.value ? Number(values.value) : null,
          string_value: values.string_value || null,
          description: values.description || null,
        };

        await configService.updateConfig(id, payload);
        toast.success('Configuration updated successfully!');
        setHasChanges(false);
        navigate('/admin/config-list');
      } catch (err) {
        console.error('Error updating config:', err);
        toast.error(err.response?.data?.message || 'Failed to update configuration');
      } finally {
        setSubmitting(false);
      }
    },
  });

  // Track changes
  useEffect(() => {
    if (configData && formik.values) {
      const changed =
        Number(formik.values.value) !== Number(configData.value || 0) ||
        formik.values.string_value !== (configData.string_value || '') ||
        formik.values.description !== (configData.description || '');
      setHasChanges(changed);
    }
  }, [formik.values, configData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2 text-lg text-gray-600 dark:text-gray-400">
          <Loader2 className="h-6 w-6 animate-spin" />
          Loading configuration...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <Card className="w-full max-w-md border-red-200 dark:border-red-900">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-3">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Error</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <Button onClick={() => navigate('/admin/config-list')} className="w-full">
              Back to Configuration List
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent">
      <div className="px-6 py-8 md:px-10 lg:px-12">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumbs */}
          <div className="flex flex-wrap gap-2 items-center mb-4 text-sm">
            <Link
              to="/admin"
              className="text-slate-500 dark:text-slate-400 hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
            >
              Dashboard
            </Link>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <Link
              to="/admin/config-list"
              className="text-slate-500 dark:text-slate-400 hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
            >
              Configuration
            </Link>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <span className="text-slate-900 dark:text-white font-medium">Edit Configuration</span>
          </div>

          {/* Page Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Settings className="h-8 w-8 text-blue-700 dark:text-blue-400" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Edit Configuration</h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Update configuration settings for <span className="font-semibold">{configData?.name}</span>
            </p>
          </div>

          {/* Form Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Configuration Details</h2>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  configData?.is_active
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                }`}>
                  {configData?.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-500 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-500 mb-1">
                      Configuration Settings
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-600">
                      Only value, string value, and description can be modified. Name, type, and active status are locked.
                    </p>
                  </div>
                </div>
              </div>
              <form onSubmit={formik.handleSubmit} className="space-y-6">
                {/* Config Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Configuration Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formik.values.name}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    disabled={true}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                    placeholder="Enter configuration name"
                  />
                  {formik.touched.name && formik.errors.name && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formik.errors.name}</p>
                  )}
                </div>

                {/* Config Type */}
                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="type"
                    name="type"
                    value={formik.values.type}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    disabled={true}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                  >
                    <option value="system">system</option>
                    <option value="deposit">deposit</option>
                    <option value="penalty">penalty</option>
                    <option value="service_fee">service_fee</option>
                    <option value="swap_fee">swap_fee</option>
                    <option value="late_fee">late_fee</option>
                    <option value="damage_fee">damage_fee</option>
                    <option value="other">other</option>
                  </select>
                  {formik.touched.type && formik.errors.type && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formik.errors.type}</p>
                  )}
                </div>

                {/* Value */}
                <div>
                  <label htmlFor="value" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Numeric Value
                  </label>
                  <input
                    type="number"
                    id="value"
                    name="value"
                    value={formik.values.value}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    placeholder="Enter numeric value (optional)"
                  />
                  {formik.touched.value && formik.errors.value && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formik.errors.value}</p>
                  )}
                </div>

                {/* String Value */}
                <div>
                  <label htmlFor="string_value" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    String Value
                  </label>
                  <input
                    type="text"
                    id="string_value"
                    name="string_value"
                    value={formik.values.string_value}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    placeholder="Enter string value (optional)"
                  />
                  {formik.touched.string_value && formik.errors.string_value && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formik.errors.string_value}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formik.values.description}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white resize-none"
                    placeholder="Enter description (optional)"
                  />
                  {formik.touched.description && formik.errors.description && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formik.errors.description}</p>
                  )}
                </div>

                {/* Active Status */}
                <div>
                  <label className="flex items-center gap-3 cursor-not-allowed opacity-60">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formik.values.is_active}
                      onChange={formik.handleChange}
                      disabled={true}
                      className="w-5 h-5 text-blue-700 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Active Configuration (Read-only)
                    </span>
                  </label>
                  <p className="mt-1 ml-8 text-xs text-gray-500 dark:text-gray-400">
                    Active status cannot be changed
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/admin/config-list')}
                    disabled={submitting}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting || !hasChanges}
                    className="flex-1"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Update Configuration'
                    )}
                  </Button>
                </div>

                {!hasChanges && !submitting && (
                  <p className="text-sm text-center text-gray-500 dark:text-gray-400">
                    No changes detected
                  </p>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
