import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { ChevronRight, Loader2 } from 'lucide-react';
import { userService } from '../../services/userService';
import { stationService } from '../../services/stationService';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';

// Validation Schema
const validationSchema = Yup.object({
  username: Yup.string()
    .required('Username is required')
    .min(2, 'Username must be at least 2 characters'),
  password: Yup.string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters'),
  email: Yup.string()
    .required('Email is required')
    .email('Invalid email format'),
  phone: Yup.string()
    .required('Phone is required')
    .matches(/^[\d\s\-\+\(\)]+$/, 'Invalid phone number format'),
  role: Yup.string()
    .required('Role is required')
    .oneOf(['admin', 'driver', 'station_staff'], 'Role must be driver, station_staff, or admin'),
  station_id: Yup.number()
    .nullable()
    .when('role', {
      is: 'station_staff',
      then: (schema) => schema.required('Station ID is required for station staff').typeError('Station ID must be a number'),
      otherwise: (schema) => schema.nullable(),
    }),
});

export default function CreateUser() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [stations, setStations] = useState([]);
  const [loadingStations, setLoadingStations] = useState(true);

  useEffect(() => {
    fetchStations();
  }, []);

  const fetchStations = async () => {
    try {
      setLoadingStations(true);
      const allStations = await stationService.getAllStations();
      // Filter stations that don't have a user_id (available for assignment)
      const availableStations = allStations.filter(station => !station.user_id);
      setStations(availableStations);
    } catch (err) {
      console.error('Error fetching stations:', err);
      toast.error('Failed to load stations');
    } finally {
      setLoadingStations(false);
    }
  };

  const formik = useFormik({
    initialValues: {
      username: '',
      password: '',
      email: '',
      phone: '',
      role: 'driver',
      station_id: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setSubmitting(true);
        
        const createData = {
          username: values.username,
          password: values.password,
          email: values.email,
          phone: values.phone,
          role: values.role,
        };

        // Add station_id if role is station_staff
        if (values.role === 'station_staff' && values.station_id) {
          createData.station_id = Number(values.station_id);
        }

        // Call API to create user
        const newUser = await userService.createUser(createData);
        
        toast.success('User created successfully!');
        navigate(`/admin/users-list`);
      } catch (err) {
        console.error('Error creating user:', err);
        toast.error(err.response?.data?.message || 'Failed to create user');
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleCancel = () => {
    navigate('/admin/users-list');
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
              to="/admin/users-list"
              className="text-slate-500 dark:text-slate-400 hover:text-primary transition-colors"
            >
              Users
            </Link>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <span className="text-slate-800 dark:text-slate-200 font-medium">Create New User</span>
          </div>

          {/* Page Heading */}
          <div className="mb-8">
            <h1 className="text-slate-900 dark:text-white text-3xl font-bold tracking-tight">
              Create New User
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
                    Enter the user's basic details and credentials.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Username */}
                  <div className="flex flex-col col-span-1">
                    <label className="text-slate-800 dark:text-slate-200 text-sm font-medium leading-normal pb-2">
                      Username <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={formik.values.username}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`form-input flex w-full rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 border bg-slate-50 dark:bg-slate-800/50 h-11 placeholder:text-slate-400 dark:placeholder:text-slate-500 p-3 text-sm ${
                        formik.touched.username && formik.errors.username
                          ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500'
                          : 'border-slate-300 dark:border-slate-700 focus:ring-primary/50 focus:border-primary'
                      }`}
                      placeholder="Enter username"
                    />
                    {formik.touched.username && formik.errors.username && (
                      <p className="text-red-500 text-xs mt-1">{formik.errors.username}</p>
                    )}
                  </div>

                  {/* Password */}
                  <div className="flex flex-col col-span-1">
                    <label className="text-slate-800 dark:text-slate-200 text-sm font-medium leading-normal pb-2">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formik.values.password}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`form-input flex w-full rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 border bg-slate-50 dark:bg-slate-800/50 h-11 placeholder:text-slate-400 dark:placeholder:text-slate-500 p-3 text-sm ${
                        formik.touched.password && formik.errors.password
                          ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500'
                          : 'border-slate-300 dark:border-slate-700 focus:ring-primary/50 focus:border-primary'
                      }`}
                      placeholder="Enter password (min 6 characters)"
                    />
                    {formik.touched.password && formik.errors.password && (
                      <p className="text-red-500 text-xs mt-1">{formik.errors.password}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="flex flex-col col-span-1">
                    <label className="text-slate-800 dark:text-slate-200 text-sm font-medium leading-normal pb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formik.values.email}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`form-input flex w-full rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 border bg-slate-50 dark:bg-slate-800/50 h-11 placeholder:text-slate-400 dark:placeholder:text-slate-500 p-3 text-sm ${
                        formik.touched.email && formik.errors.email
                          ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500'
                          : 'border-slate-300 dark:border-slate-700 focus:ring-primary/50 focus:border-primary'
                      }`}
                      placeholder="Enter email address"
                    />
                    {formik.touched.email && formik.errors.email && (
                      <p className="text-red-500 text-xs mt-1">{formik.errors.email}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="flex flex-col col-span-1">
                    <label className="text-slate-800 dark:text-slate-200 text-sm font-medium leading-normal pb-2">
                      Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="phone"
                      value={formik.values.phone}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`form-input flex w-full rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 border bg-slate-50 dark:bg-slate-800/50 h-11 placeholder:text-slate-400 dark:placeholder:text-slate-500 p-3 text-sm ${
                        formik.touched.phone && formik.errors.phone
                          ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500'
                          : 'border-slate-300 dark:border-slate-700 focus:ring-primary/50 focus:border-primary'
                      }`}
                      placeholder="Enter phone number"
                    />
                    {formik.touched.phone && formik.errors.phone && (
                      <p className="text-red-500 text-xs mt-1">{formik.errors.phone}</p>
                    )}
                  </div>

                  {/* Role */}
                  <div className="flex flex-col col-span-2">
                    <label className="text-slate-800 dark:text-slate-200 text-sm font-medium leading-normal pb-2">
                      Role <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="role"
                      value={formik.values.role}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`form-select flex w-full rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 border bg-slate-50 dark:bg-slate-800/50 h-11 p-3 text-sm ${
                        formik.touched.role && formik.errors.role
                          ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500'
                          : 'border-slate-300 dark:border-slate-700 focus:ring-primary/50 focus:border-primary'
                      }`}
                    >
                      <option value="driver">Driver</option>
                      <option value="station_staff">Station Staff</option>
                      <option value="admin">Admin</option>
                    </select>
                    {formik.touched.role && formik.errors.role && (
                      <p className="text-red-500 text-xs mt-1">{formik.errors.role}</p>
                    )}
                  </div>

                  {/* Station ID - Only show when role is station_staff */}
                  {formik.values.role === 'station_staff' && (
                    <div className="flex flex-col col-span-2">
                      <label className="text-slate-800 dark:text-slate-200 text-sm font-medium leading-normal pb-2">
                        Station <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="station_id"
                        value={formik.values.station_id}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        disabled={loadingStations || stations.length === 0}
                        className={`form-select flex w-full rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 border bg-slate-50 dark:bg-slate-800/50 h-11 p-3 text-sm ${
                          formik.touched.station_id && formik.errors.station_id
                            ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500'
                            : 'border-slate-300 dark:border-slate-700 focus:ring-primary/50 focus:border-primary'
                        } ${(loadingStations || stations.length === 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <option value="">
                          {loadingStations ? 'Loading stations...' : 'Select a station'}
                        </option>
                        {stations.map((station) => (
                          <option key={station.station_id} value={station.station_id}>
                            {station.name}
                          </option>
                        ))}
                      </select>
                      {stations.length === 0 && !loadingStations && (
                        <p className="text-yellow-600 dark:text-yellow-400 text-xs mt-1">
                          No available stations (all stations already have staff assigned)
                        </p>
                      )}
                      {formik.touched.station_id && formik.errors.station_id && (
                        <p className="text-red-500 text-xs mt-1">{formik.errors.station_id}</p>
                      )}
                    </div>
                  )}
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
                    'Create User'
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