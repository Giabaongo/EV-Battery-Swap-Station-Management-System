import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { batteryTransferService } from '../../services/batteryTransferService';
import { stationService } from '../../services/stationService';
import { toast } from 'sonner';

const validationSchema = Yup.object().shape({
  battery_model: Yup.string().min(2, 'Model must be at least 2 characters').required('Battery model is required'),
  battery_type: Yup.string().required('Battery type is required'),
  quantity: Yup.number().integer('Quantity must be a whole number').positive('Quantity must be positive').required('Quantity is required'),
  from_station_id: Yup.number().required('Source station is required'),
  to_station_id: Yup.number().required('Destination station is required'),
});

export default function EditBatteryTransfer() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [submitting, setSubmitting] = useState(false);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [transferRequest, setTransferRequest] = useState(null);

  // Fetch transfer request and stations on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch transfer request details
        const requestData = await batteryTransferService.getRequestById(id);
        setTransferRequest(requestData);

        // Fetch stations
        const stationsData = await stationService.getAllStations();
        setStations(Array.isArray(stationsData) ? stationsData : stationsData?.data || []);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.response?.data?.message || 'Failed to load transfer request');
        toast.error('Failed to load transfer request details');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const formik = useFormik({
    initialValues: {
      battery_model: transferRequest?.battery_model || '',
      battery_type: transferRequest?.battery_type || '',
      quantity: transferRequest?.quantity || 1,
      from_station_id: transferRequest?.from_station_id || '',
      to_station_id: transferRequest?.to_station_id || '',
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      // Validate that source and destination are different
      if (values.from_station_id === values.to_station_id) {
        toast.error('Source and destination stations must be different');
        return;
      }

      try {
        setSubmitting(true);
        await batteryTransferService.updateRequest(id, {
          battery_model: values.battery_model,
          battery_type: values.battery_type,
          quantity: parseInt(values.quantity),
          from_station_id: parseInt(values.from_station_id),
          to_station_id: parseInt(values.to_station_id),
          status: transferRequest?.status,
        });
        toast.success('Transfer request updated successfully');
        navigate(`/admin/battery-transfer-requests/${id}`);
      } catch (err) {
        console.error('Error updating transfer request:', err);
        toast.error(err.response?.data?.message || 'Failed to update transfer request');
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleCancel = () => {
    navigate(`/admin/battery-transfer-requests/${id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-slate-600 dark:text-slate-400">Loading transfer request...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-6 flex items-center justify-center">
        <Card className="bg-white dark:bg-slate-900 border-red-200 dark:border-red-900 w-full max-w-md">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Error</h2>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mb-4">{error}</p>
            <Button onClick={() => navigate('/admin/battery-transfer-requests')} className="w-full">
              Back to List
            </Button>
          </CardContent>
        </Card>
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
          <a href="/admin/battery-transfer-requests" className="text-primary hover:text-primary/80">
            Battery Transfer
          </a>
          <ChevronRight className="h-4 w-4 text-slate-400" />
          <span className="text-slate-900 dark:text-slate-100 font-medium">Edit Request #{id}</span>
        </div>

        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">Edit Transfer Request</h1>
          <p className="text-slate-600 dark:text-slate-400">Update battery transfer request details</p>
        </div>

        {/* Form Card */}
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
          <CardHeader className="border-b border-slate-200 dark:border-slate-800 p-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Transfer Details</h2>
          </CardHeader>

          <form onSubmit={formik.handleSubmit}>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-6">
                {/* Battery Model */}
                <div className="flex flex-col col-span-1">
                  <label className="text-slate-800 dark:text-slate-200 text-sm font-medium leading-normal pb-2">
                    Battery Model <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="battery_model"
                    value={formik.values.battery_model}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`form-input flex w-full rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 border bg-slate-50 dark:bg-slate-800/50 h-11 placeholder:text-slate-400 dark:placeholder:text-slate-500 p-3 text-sm ${
                      formik.touched.battery_model && formik.errors.battery_model ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' : 'border-slate-300 dark:border-slate-700 focus:ring-primary/50 focus:border-primary'
                    }`}
                    placeholder="e.g., VF8 Battery"
                  />
                  {formik.touched.battery_model && formik.errors.battery_model && <p className="text-red-500 text-xs mt-1">{formik.errors.battery_model}</p>}
                </div>

                {/* Battery Type */}
                <div className="flex flex-col col-span-1">
                  <label className="text-slate-800 dark:text-slate-200 text-sm font-medium leading-normal pb-2">
                    Battery Type <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="battery_type"
                    value={formik.values.battery_type}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`form-input flex w-full rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 border bg-slate-50 dark:bg-slate-800/50 h-11 placeholder:text-slate-400 dark:placeholder:text-slate-500 p-3 text-sm ${
                      formik.touched.battery_type && formik.errors.battery_type ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' : 'border-slate-300 dark:border-slate-700 focus:ring-primary/50 focus:border-primary'
                    }`}
                    placeholder="e.g., Lithium-ion"
                  />
                  {formik.touched.battery_type && formik.errors.battery_type && <p className="text-red-500 text-xs mt-1">{formik.errors.battery_type}</p>}
                </div>

                {/* Quantity */}
                <div className="flex flex-col col-span-1">
                  <label className="text-slate-800 dark:text-slate-200 text-sm font-medium leading-normal pb-2">
                    Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    value={formik.values.quantity}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    min="1"
                    className={`form-input flex w-full rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 border bg-slate-50 dark:bg-slate-800/50 h-11 placeholder:text-slate-400 dark:placeholder:text-slate-500 p-3 text-sm ${
                      formik.touched.quantity && formik.errors.quantity ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' : 'border-slate-300 dark:border-slate-700 focus:ring-primary/50 focus:border-primary'
                    }`}
                    placeholder="1"
                  />
                  {formik.touched.quantity && formik.errors.quantity && <p className="text-red-500 text-xs mt-1">{formik.errors.quantity}</p>}
                </div>

                {/* Source Station */}
                <div className="flex flex-col col-span-1">
                  <label className="text-slate-800 dark:text-slate-200 text-sm font-medium leading-normal pb-2">
                    From Station <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="from_station_id"
                    value={formik.values.from_station_id}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`form-select flex w-full rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 border bg-slate-50 dark:bg-slate-800/50 h-11 p-3 text-sm ${
                      formik.touched.from_station_id && formik.errors.from_station_id ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' : 'border-slate-300 dark:border-slate-700 focus:ring-primary/50 focus:border-primary'
                    }`}
                  >
                    <option value="">Select source station</option>
                    {stations.map((station) => (
                      <option key={station.station_id} value={station.station_id}>
                        {station.name}
                      </option>
                    ))}
                  </select>
                  {formik.touched.from_station_id && formik.errors.from_station_id && <p className="text-red-500 text-xs mt-1">{formik.errors.from_station_id}</p>}
                </div>

                {/* Destination Station */}
                <div className="flex flex-col col-span-1">
                  <label className="text-slate-800 dark:text-slate-200 text-sm font-medium leading-normal pb-2">
                    To Station <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="to_station_id"
                    value={formik.values.to_station_id}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`form-select flex w-full rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 border bg-slate-50 dark:bg-slate-800/50 h-11 p-3 text-sm ${
                      formik.touched.to_station_id && formik.errors.to_station_id ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' : 'border-slate-300 dark:border-slate-700 focus:ring-primary/50 focus:border-primary'
                    }`}
                  >
                    <option value="">Select destination station</option>
                    {stations.map((station) => (
                      <option key={station.station_id} value={station.station_id} disabled={String(station.station_id) === String(formik.values.from_station_id)}>
                        {station.name}
                      </option>
                    ))}
                  </select>
                  {formik.touched.to_station_id && formik.errors.to_station_id && <p className="text-red-500 text-xs mt-1">{formik.errors.to_station_id}</p>}
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
                    Updating...
                  </>
                ) : (
                  'Update Request'
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
