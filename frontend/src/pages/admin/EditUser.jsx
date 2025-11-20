import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { ChevronRight, AlertCircle, Loader2, ChevronDown } from 'lucide-react';
import { userService } from '../../services/userService';
import { stationService } from '../../services/stationService';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';

// Validation Schema
const validationSchema = Yup.object({
  username: Yup.string(),
  role: Yup.string()
    .oneOf(['driver', 'station_staff'], 'Invalid role selected'),
  station_id: Yup.number()
    .nullable()
    .typeError('Station ID must be a number'),
});

export default function EditUser() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [stations, setStations] = useState([]);
  const [loadingStations, setLoadingStations] = useState(false);
  const [showStationDropdown, setShowStationDropdown] = useState(false);

  useEffect(() => {
    fetchUserData();
    fetchStations();
  }, [id]);

  const fetchStations = async () => {
    try {
      setLoadingStations(true);
      const allStations = await stationService.getAllStations();
      // Don't filter - show all stations for editing
      setStations(allStations);
    } catch (err) {
      console.error('Error fetching stations:', err);
      toast.error('Failed to load stations');
    } finally {
      setLoadingStations(false);
    }
  };

  const formik = useFormik({
    initialValues: {
      name: '',
      user_id: '',
      username: '',
      email: '',
      role: 'driver',
      station_id: '',
      created_at: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setSubmitting(true);
        
        // Only send editable fields based on role
        const updateData = {};
        
        // Only station_staff can have station_id edited
        if (values.role === 'station_staff') {
          if (values.station_id) {
            updateData.station_id = Number(values.station_id);
          }
        }
        
        // Admin and Driver: no editable fields, read-only only
        // Station Staff: only station_id is editable

        // Call API to update user
        await userService.updateUser(id, updateData);
        
        toast.success('User updated successfully!');
        navigate(`/admin/users/${id}`);
      } catch (err) {
        console.error('Error updating user:', err);
        toast.error(err.response?.data?.message || 'Failed to update user');
      } finally {
        setSubmitting(false);
      }
    },
  });

  useEffect(() => {
    fetchUserData();
    fetchStations();
  }, [id]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const userData = await userService.getUserById(id);
      
      // Populate form with existing data
      formik.setValues({
        name: userData.name || '',
        user_id: userData.user_id || '',
        username: userData.username || '',
        email: userData.email || '',
        phone: userData.phone || '',
        role: userData.role || 'driver',
        station_id: userData.station_id || '',
        email_verified: userData.email_verified || false,
        created_at: userData.created_at || '',
      });
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError(err.response?.data?.message || 'Failed to load user data');
      toast.error('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(`/admin/users/${id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Loading user data...</p>
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
                <h3 className="font-semibold">Error Loading User</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">{error}</p>
              </div>
            </div>
            <Button onClick={() => navigate('/admin/users-list')} className="w-full">
              Back to Users List
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
              className="text-slate-500 dark:text-slate-400 hover:text-primary transition-colors"
            >
              Dashboard
            </Link>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <Link
              to="/admin/users-list"
              className="text-slate-500 dark:text-slate-400 hover:text-primary transition-colors"
            >
              Users
            </Link>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <Link
              to={`/admin/users/${id}`}
              className="text-slate-500 dark:text-slate-400 hover:text-primary transition-colors"
            >
              {formik.values.name || 'User Detail'}
            </Link>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <span className="text-slate-800 dark:text-slate-200 font-medium">Edit</span>
          </div>

          {/* Page Heading */}
          <div className="mb-8">
            <h1 className="text-slate-900 dark:text-white text-3xl font-bold tracking-tight">
              Edit User: {formik.values.name}
            </h1>
          </div>

          {/* Form Container */}
          <Card>
            <form onSubmit={formik.handleSubmit}>
              {/* General Information Section */}
              <CardContent className="p-6">
                <div className="mb-6">
                  <h3 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-tight mb-1">
                    User Information
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                    Update the user's account details and settings.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* User ID (Read-only) */}
                  <div className="flex flex-col col-span-1">
                    <label className="text-slate-800 dark:text-slate-200 text-sm font-medium leading-normal pb-2">
                      User ID
                    </label>
                    <input
                      type="text"
                      value={formik.values.user_id}
                      className="form-input flex w-full rounded-lg text-slate-500 dark:text-slate-400 focus:outline-0 border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 h-11 p-3 text-sm cursor-not-allowed"
                      readOnly
                    />
                  </div>

                  {/* Username (Read-only) */}
                  <div className="flex flex-col col-span-1">
                    <label className="text-slate-800 dark:text-slate-200 text-sm font-medium leading-normal pb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      value={formik.values.username}
                      className="form-input flex w-full rounded-lg text-slate-500 dark:text-slate-400 focus:outline-0 border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 h-11 p-3 text-sm cursor-not-allowed"
                      readOnly
                    />
                  </div>

                  {/* Email (Read-only) */}
                  <div className="flex flex-col col-span-1">
                    <label className="text-slate-800 dark:text-slate-200 text-sm font-medium leading-normal pb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formik.values.email}
                      className="form-input flex w-full rounded-lg text-slate-500 dark:text-slate-400 focus:outline-0 border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 h-11 p-3 text-sm cursor-not-allowed"
                      readOnly
                    />
                  </div>

                  {/* Role (Read-only) */}
                  <div className="flex flex-col col-span-1">
                    <label className="text-slate-800 dark:text-slate-200 text-sm font-medium leading-normal pb-2">
                      Role
                    </label>
                    <input
                      type="text"
                      value={formik.values.role === 'station_staff' ? 'Station Staff' : formik.values.role === 'driver' ? 'Driver' : formik.values.role}
                      className="form-input flex w-full rounded-lg text-slate-500 dark:text-slate-400 focus:outline-0 border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 h-11 p-3 text-sm cursor-not-allowed"
                      readOnly
                    />
                  </div>
                  {/* Station ID (Editable - only for station_staff) */}
                  {formik.values.role === 'station_staff' && (
                    <div className="flex flex-col col-span-1">
                      <label className="text-slate-800 dark:text-slate-200 text-sm font-medium leading-normal pb-2">
                        Station
                      </label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowStationDropdown(!showStationDropdown)}
                          className={`flex h-11 w-full items-center justify-between rounded-lg border px-4 text-sm font-medium transition-colors ${
                            formik.touched.station_id && formik.errors.station_id
                              ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-slate-900 dark:text-slate-100'
                              : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
                          } ${loadingStations || stations.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                          disabled={loadingStations || stations.length === 0}
                        >
                          <span>
                            {loadingStations 
                              ? 'Loading stations...' 
                              : formik.values.station_id
                              ? stations.find(s => s.station_id === parseInt(formik.values.station_id))?.name || 'Select a station'
                              : 'Select a station'
                            }
                          </span>
                          <ChevronDown className="h-4 w-4" />
                        </button>

                        {showStationDropdown && !loadingStations && stations.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg shadow-lg z-10">
                            {stations.map((station) => (
                              <button
                                key={station.station_id}
                                type="button"
                                onClick={() => {
                                  formik.setFieldValue('station_id', station.station_id);
                                  setShowStationDropdown(false);
                                }}
                                className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                                  formik.values.station_id === station.station_id
                                    ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-blue-100 font-medium'
                                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                                }`}
                              >
                                {station.name}
                              </button>
                            ))}
                          </div>
                        )}

                        {formik.touched.station_id && formik.errors.station_id && (
                          <p className="text-red-500 text-xs mt-1">{formik.errors.station_id}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Created At (Read-only) */}
                  <div className="flex flex-col col-span-1">
                    <label className="text-slate-800 dark:text-slate-200 text-sm font-medium leading-normal pb-2">
                      Created At
                    </label>
                    <input
                      type="text"
                      value={formik.values.created_at ? new Date(formik.values.created_at).toLocaleString() : ''}
                      className="form-input flex w-full rounded-lg text-slate-500 dark:text-slate-400 focus:outline-0 border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 h-11 p-3 text-sm cursor-not-allowed"
                      readOnly
                    />
                  </div>
                </div>
              </CardContent>

              {/* Form Actions */}
              <div className="p-6 flex justify-end gap-3 bg-white border-t border-slate-200 dark:border-slate-800 rounded-b-xl">
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
