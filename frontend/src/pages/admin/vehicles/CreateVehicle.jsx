import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { vehicleService } from '../../../services/vehicleService';
import { toast } from 'sonner';

// Validation Schema
const validationSchema = Yup.object({
  vin: Yup.string()
    .required('VIN is required')
    .length(18, 'VIN must be exactly 18 characters'),
  battery_model: Yup.string()
    .required('Battery model is required'),
});

export default function CreateVehicle() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formik = useFormik({
    initialValues: {
      vin: '',
      battery_model: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setIsSubmitting(true);
        await vehicleService.createVehicle({
          vin: values.vin.toUpperCase().trim(),
          battery_model: values.battery_model.trim(),
        });
        toast.success('Vehicle created successfully!');
        navigate('/admin/vehicles/create');
      } catch (error) {
        console.error('Error creating vehicle:', error);
        toast.error(error.response?.data?.message || 'Failed to create vehicle');
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark p-6 lg:p-8 ml-64">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            Create Vehicle
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Add a new vehicle to the system
          </p>
        </div>

        {/* Form Card */}
        <Card className="border border-gray-200 dark:border-gray-800 shadow-md">
          <CardHeader className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
            <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">
              Vehicle Information
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6">
            <form onSubmit={formik.handleSubmit} className="space-y-6">
              {/* VIN Field */}
              <div>
                <label htmlFor="vin" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  VIN <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  id="vin"
                  placeholder="e.g., VIN1234567890ABCD5"
                  maxLength="18"
                  {...formik.getFieldProps('vin')}
                  className={`w-full px-4 py-2 rounded-lg border ${formik.touched.vin && formik.errors.vin
                      ? 'border-danger bg-danger/5'
                      : 'border-gray-300 dark:border-gray-600'
                    } bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all`}
                />
                {formik.touched.vin && formik.errors.vin && (
                  <div className="mt-2 flex items-start gap-2 text-danger text-sm">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{formik.errors.vin}</span>
                  </div>
                )}
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  VIN must be exactly 18 characters
                </p>
              </div>

              {/* Battery Model Field */}
              <div>
                <label htmlFor="battery_model" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Battery Model <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  id="battery_model"
                  placeholder="e.g., VinFast Standard"
                  {...formik.getFieldProps('battery_model')}
                  className={`w-full px-4 py-2 rounded-lg border ${formik.touched.battery_model && formik.errors.battery_model
                      ? 'border-danger bg-danger/5'
                      : 'border-gray-300 dark:border-gray-600'
                    } bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all`}
                />
                {formik.touched.battery_model && formik.errors.battery_model && (
                  <div className="mt-2 flex items-start gap-2 text-danger text-sm">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{formik.errors.battery_model}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-6 border-t border-gray-200 dark:border-gray-800">
                <Button
                  type="submit"
                  disabled={isSubmitting || !formik.isValid}
                  className="flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Vehicle</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/admin')}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
