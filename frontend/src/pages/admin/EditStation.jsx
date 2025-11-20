import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { ChevronRight, AlertCircle, Loader2 } from 'lucide-react';
import { stationService } from '../../services/stationService';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';

// Validation Schema
const validationSchema = Yup.object({
  name: Yup.string()
    .required('Station name is required')
    .min(3, 'Station name must be at least 3 characters')
    .max(100, 'Station name must not exceed 100 characters'),
  address: Yup.string()
    .required('Address is required')
    .min(5, 'Address must be at least 5 characters')
    .max(255, 'Address must not exceed 255 characters'),
  status: Yup.string()
    .required('Status is required')
    .oneOf(['active', 'inactive', 'maintenance'], 'Invalid status selected'),
});

export default function EditStation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const formik = useFormik({
    initialValues: {
      name: '',
      address: '',
      latitude: '',
      longitude: '',
      status: 'active',
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setSubmitting(true);
        
        // Only send editable fields to backend
        const updateData = {
          name: values.name,
          address: values.address,
          status: values.status,
        };

        // Call API to update station
        await stationService.updateStation(id, updateData);
        
        toast.success('Station updated successfully!');
        navigate(`/admin/stations/${id}`);
      } catch (err) {
        console.error('Error updating station:', err);
        toast.error(err.response?.data?.message || 'Failed to update station');
      } finally {
        setSubmitting(false);
      }
    },
  });

  useEffect(() => {
    fetchStationData();
  }, [id]);

  const fetchStationData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const stationData = await stationService.getStationById(id);
      
      // Populate form with existing data
      formik.setValues({
        name: stationData.name || '',
        address: stationData.address || '',
        latitude: stationData.latitude || '',
        longitude: stationData.longitude || '',
        status: stationData.status || 'active',
      });
    } catch (err) {
      console.error('Error fetching station data:', err);
      setError(err.response?.data?.message || 'Failed to load station data');
      toast.error('Failed to load station data');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(`/admin/stations/${id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Loading station data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <AlertCircle className="h-6 w-6 flex-shrink-0" />
              <div>
                <h3 className="font-semibold">Error Loading Station</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">{error}</p>
              </div>
            </div>
            <Button onClick={() => navigate('/admin/stations-list')} className="w-full">
              Back to Stations List
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent ">
      <div className="px-6 py-8 md:px-10 lg:px-12">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumbs */}
          <div className="flex flex-wrap gap-2 items-center mb-4 text-sm">
            <Link
              to="/admin"
              className="text-slate-500 dark:text-slate-400 hover:text-primary transition-colors"
            >
              Dashboard
            </Link>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <Link
              to="/admin/stations-list"
              className="text-slate-500 dark:text-slate-400 hover:text-primary transition-colors"
            >
              Stations
            </Link>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <Link
              to={`/admin/stations/${id}`}
              className="text-slate-500 dark:text-slate-400 hover:text-primary transition-colors"
            >
              {formik.values.name || 'Station Detail'}
            </Link>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <span className="text-slate-800 dark:text-slate-200 font-medium">Edit</span>
          </div>

          {/* Page Heading */}
          <div className="mb-8">
            <h1 className="text-slate-900 dark:text-white text-3xl font-bold tracking-tight">
              Edit Station: {formik.values.name}
            </h1>
          </div>

          {/* Form Container */}
          <Card>
            <form onSubmit={formik.handleSubmit}>
              {/* General Information Section */}
              <CardContent className="p-6">
                <div className="mb-6">
                  <h3 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-tight mb-1">
                    General Information
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                    Update the station's basic details and location.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Station Name */}
                  <div className="flex flex-col col-span-1">
                    <label className="text-slate-800 dark:text-slate-200 text-sm font-medium leading-normal pb-2">
                      Station Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formik.values.name}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`form-input flex w-full rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 border bg-slate-50 dark:bg-slate-800/50 h-11 placeholder:text-slate-400 dark:placeholder:text-slate-500 p-3 text-sm ${
                        formik.touched.name && formik.errors.name
                          ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500'
                          : 'border-slate-300 dark:border-slate-700 focus:ring-primary/50 focus:border-primary'
                      }`}
                      placeholder="Enter station name"
                    />
                    {formik.touched.name && formik.errors.name && (
                      <p className="text-red-500 text-xs mt-1">{formik.errors.name}</p>
                    )}
                  </div>

                  {/* Station ID (Read-only) */}
                  <div className="flex flex-col col-span-1">
                    <label className="text-slate-800 dark:text-slate-200 text-sm font-medium leading-normal pb-2">
                      Station ID
                    </label>
                    <input
                      type="text"
                      value={`${id.toString()}`}
                      className="form-input flex w-full rounded-lg text-slate-500 dark:text-slate-400 focus:outline-0 border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 h-11 p-3 text-sm cursor-not-allowed"
                      readOnly
                    />
                  </div>

                  {/* Address */}
                  <div className="flex flex-col col-span-2">
                    <label className="text-slate-800 dark:text-slate-200 text-sm font-medium leading-normal pb-2">
                      Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formik.values.address}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`form-input flex w-full rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 border bg-slate-50 dark:bg-slate-800/50 h-11 placeholder:text-slate-400 dark:placeholder:text-slate-500 p-3 text-sm ${
                        formik.touched.address && formik.errors.address
                          ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500'
                          : 'border-slate-300 dark:border-slate-700 focus:ring-primary/50 focus:border-primary'
                      }`}
                      placeholder="Enter full address"
                    />
                    {formik.touched.address && formik.errors.address && (
                      <p className="text-red-500 text-xs mt-1">{formik.errors.address}</p>
                    )}
                  </div>

                  {/* Latitude */}
                  <div className="flex flex-col col-span-1">
                    <label className="text-slate-800 dark:text-slate-200 text-sm font-medium leading-normal pb-2">
                      Latitude
                    </label>
                    <input
                      type="text"
                      value={formik.values.latitude}
                      className="form-input flex w-full rounded-lg text-slate-500 dark:text-slate-400 focus:outline-0 border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 h-11 p-3 text-sm cursor-not-allowed"
                      readOnly
                    />
                  </div>

                  {/* Longitude */}
                  <div className="flex flex-col col-span-1">
                    <label className="text-slate-800 dark:text-slate-200 text-sm font-medium leading-normal pb-2">
                      Longitude
                    </label>
                    <input
                      type="text"
                      value={formik.values.longitude}
                      className="form-input flex w-full rounded-lg text-slate-500 dark:text-slate-400 focus:outline-0 border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 h-11 p-3 text-sm cursor-not-allowed"
                      readOnly
                    />
                  </div>

                  {/* Status */}
                  <div className="flex flex-col col-span-2">
                    <label className="text-slate-800 dark:text-slate-200 text-sm font-medium leading-normal pb-2">
                      Status <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="status"
                      value={formik.values.status}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`form-select flex w-full rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 border bg-slate-50 dark:bg-slate-800/50 h-11 p-3 text-sm ${
                        formik.touched.status && formik.errors.status
                          ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500'
                          : 'border-slate-300 dark:border-slate-700 focus:ring-primary/50 focus:border-primary'
                      }`}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                    {formik.touched.status && formik.errors.status && (
                      <p className="text-red-500 text-xs mt-1">{formik.errors.status}</p>
                    )}
                  </div>
                </div>
              </CardContent>

              {/* Form Actions */}
              <div className="p-6 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900/20 border-t border-slate-200 dark:border-slate-800 rounded-b-xl">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={submitting}
                  className="px-4"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || !formik.isValid}
                  className="px-4"
                >
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
    </div>
  );
}
