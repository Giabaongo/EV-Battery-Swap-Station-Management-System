import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { ChevronRight, Loader2 } from 'lucide-react';
import { stationService } from '../../services/stationService';
import { Card, CardContent } from '../../components/ui/card';
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
  latitude: Yup.number()
    .required('Latitude is required')
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90')
    .typeError('Latitude must be a valid number'),
  longitude: Yup.number()
    .required('Longitude is required')
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180')
    .typeError('Longitude must be a valid number'),
  status: Yup.string()
    .required('Status is required')
    .oneOf(['active', 'inactive', 'maintenance'], 'Invalid status selected'),
});

export default function CreateStation() {
  const navigate = useNavigate();
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
        
        // Backend expects latitude and longitude as string (Decimal type)
        const createData = {
          name: values.name,
          address: values.address,
          latitude: values.latitude.toString(),
          longitude: values.longitude.toString(),
          status: values.status,
        };

        // Call API to create station
        const newStation = await stationService.createStation(createData);
        
        toast.success('Station created successfully!');
        navigate(`/admin/stations/${newStation.station_id}`);
      } catch (err) {
        console.error('Error creating station:', err);
        toast.error(err.response?.data?.message || 'Failed to create station');
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleCancel = () => {
    navigate('/admin/stations-list');
  };

  return (
    <div className="min-h-screen bg-transparent">
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
            <span className="text-slate-800 dark:text-slate-200 font-medium">Create New Station</span>
          </div>

          {/* Page Heading */}
          <div className="mb-8">
            <h1 className="text-slate-900 dark:text-white text-3xl font-bold tracking-tight">
              Create New Station
            </h1>
          </div>

          {/* Form Container */}
          <Card>
            <form onSubmit={formik.handleSubmit}>
              {/* General Information Section */}
              <CardContent className="p-6">
                <div className="mb-6">
                  <h3 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-tight mb-1">
                    Station Information
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                    Enter the station's basic details and location.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Station Name */}
                  <div className="flex flex-col col-span-2">
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
                      Latitude <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="latitude"
                      value={formik.values.latitude}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`form-input flex w-full rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 border bg-slate-50 dark:bg-slate-800/50 h-11 placeholder:text-slate-400 dark:placeholder:text-slate-500 p-3 text-sm ${
                        formik.touched.latitude && formik.errors.latitude
                          ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500'
                          : 'border-slate-300 dark:border-slate-700 focus:ring-primary/50 focus:border-primary'
                      }`}
                      placeholder="e.g., 14.5547"
                    />
                    {formik.touched.latitude && formik.errors.latitude && (
                      <p className="text-red-500 text-xs mt-1">{formik.errors.latitude}</p>
                    )}
                  </div>

                  {/* Longitude */}
                  <div className="flex flex-col col-span-1">
                    <label className="text-slate-800 dark:text-slate-200 text-sm font-medium leading-normal pb-2">
                      Longitude <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="longitude"
                      value={formik.values.longitude}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`form-input flex w-full rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 border bg-slate-50 dark:bg-slate-800/50 h-11 placeholder:text-slate-400 dark:placeholder:text-slate-500 p-3 text-sm ${
                        formik.touched.longitude && formik.errors.longitude
                          ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500'
                          : 'border-slate-300 dark:border-slate-700 focus:ring-primary/50 focus:border-primary'
                      }`}
                      placeholder="e.g., 121.0244"
                    />
                    {formik.touched.longitude && formik.errors.longitude && (
                      <p className="text-red-500 text-xs mt-1">{formik.errors.longitude}</p>
                    )}
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
              <div className="p-6 flex justify-end gap-3 bg-white dark:bg-white border-t border-slate-200 dark:border-slate-800 rounded-b-xl">
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
                      Creating...
                    </>
                  ) : (
                    'Create Station'
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
