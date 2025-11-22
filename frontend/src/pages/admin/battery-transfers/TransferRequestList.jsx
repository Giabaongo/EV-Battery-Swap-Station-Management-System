import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Card, CardContent, CardHeader } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { ChevronRight, Loader2 } from 'lucide-react';
import { batteryTransferService } from '../../../services/batteryTransferService';
import { stationService } from '../../../services/stationService';
import { batteryService } from '../../../services/batteryService';
import { cabinetService } from '../../../services/cabinetService';
import { toast } from 'sonner';

const validationSchema = Yup.object().shape({
  battery_model: Yup.string().min(2, 'Model must be at least 2 characters').required('Battery model is required'),
  battery_type: Yup.string().required('Battery type is required'),
  quantity: Yup.number().integer('Quantity must be a whole number').positive('Quantity must be positive').required('Quantity is required'),
  from_station_id: Yup.number().required('Source station is required'),
  to_station_id: Yup.number().required('Destination station is required'),
});

export default function AdminBatteryTransferReq() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [stations, setStations] = useState([]);
  const [loadingStations, setLoadingStations] = useState(true);

  // Fetch stations on mount
  useEffect(() => {
    const fetchStations = async () => {
      try {
        setLoadingStations(true);
        const data = await stationService.getAllStations();
        const stationsArray = Array.isArray(data) ? data : data?.data || [];

        // Fetch full-battery counts and available empty slots for each station in parallel
        const stationsWithCounts = await Promise.all(
          stationsArray.map(async (s) => {
            const stationId = s.station_id || s.id;
            if (!stationId) return { ...s, fullCount: 0, emptySlots: 0 };
            try {
              const [fullCountResp, availableSlotsResp] = await Promise.all([
                batteryService.getFullCountByStationId(stationId),
                // cabinetService returns array of available slots
                // we import cabinetService at top of file
                // if it fails, we fallback to 0
                cabinetService.getAvailableSlots(stationId),
              ]);

              const fullCount = typeof fullCountResp === 'number' ? fullCountResp : (fullCountResp?.fullCount ?? 0);
              const emptySlots = Array.isArray(availableSlotsResp) ? availableSlotsResp.length : (availableSlotsResp?.data?.length ?? 0);

              return { ...s, fullCount, emptySlots };
            } catch (err) {
              // If either request fails, return defaults
              return { ...s, fullCount: s.fullCount ?? 0, emptySlots: s.emptySlots ?? 0 };
            }
          })
        );

        setStations(stationsWithCounts);
      } catch (err) {
        console.error('Error fetching stations:', err);
        toast.error('Failed to load stations');
      } finally {
        setLoadingStations(false);
      }
    };

    fetchStations();
  }, []);

  const formik = useFormik({
    initialValues: {
      battery_model: '',
      battery_type: '',
      quantity: 1,
      from_station_id: '',
      to_station_id: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      // Validate that source and destination are different
      if (values.from_station_id === values.to_station_id) {
        toast.error('Source and destination stations must be different');
        return;
      }

      try {
        setSubmitting(true);
        await batteryTransferService.createRequest({
          battery_model: values.battery_model,
          battery_type: values.battery_type,
          quantity: parseInt(values.quantity),
          from_station_id: parseInt(values.from_station_id),
          to_station_id: parseInt(values.to_station_id),
        });
        toast.success('Transfer request created successfully');
        navigate(`/admin/battery-transfer-requests`);
      } catch (err) {
        console.error('Error creating transfer request:', err);
        toast.error(err.response?.data?.message || 'Failed to create transfer request');
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleCancel = () => {
    if (formik.dirty) {
      toast.warning('You have unsaved changes', {
        description: 'Changes will be lost if you leave without saving',
      });
      return;
    }
    navigate('/admin/battery-transfer-requests');
  };

  if (loadingStations) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-slate-600 dark:text-slate-400">Loading stations...</p>
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
          <a href="/admin/battery-transfer-requests" className="text-primary hover:text-primary/80">
            Battery Transfer
          </a>
          <ChevronRight className="h-4 w-4 text-slate-400" />
          <span className="text-slate-900 dark:text-slate-100 font-medium">Create Request</span>
        </div>

        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">Create Transfer Request</h1>
          <p className="text-slate-600 dark:text-slate-400">Create a new battery transfer request between stations</p>
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
                    className={`form-input flex w-full rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 border bg-slate-50 dark:bg-slate-800/50 h-11 placeholder:text-slate-400 dark:placeholder:text-slate-500 p-3 text-sm ${formik.touched.battery_model && formik.errors.battery_model ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' : 'border-slate-300 dark:border-slate-700 focus:ring-primary/50 focus:border-primary'
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
                    className={`form-input flex w-full rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 border bg-slate-50 dark:bg-slate-800/50 h-11 placeholder:text-slate-400 dark:placeholder:text-slate-500 p-3 text-sm ${formik.touched.battery_type && formik.errors.battery_type ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' : 'border-slate-300 dark:border-slate-700 focus:ring-primary/50 focus:border-primary'
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
                    className={`form-input flex w-full rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 border bg-slate-50 dark:bg-slate-800/50 h-11 placeholder:text-slate-400 dark:placeholder:text-slate-500 p-3 text-sm ${formik.touched.quantity && formik.errors.quantity ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' : 'border-slate-300 dark:border-slate-700 focus:ring-primary/50 focus:border-primary'
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
                    className={`form-select flex w-full rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 border bg-slate-50 dark:bg-slate-800/50 h-11 p-3 text-sm ${formik.touched.from_station_id && formik.errors.from_station_id ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' : 'border-slate-300 dark:border-slate-700 focus:ring-primary/50 focus:border-primary'
                      }`}
                  >
                    <option value="">Select source station</option>
                    {stations.map((station) => (
                      <option key={station.station_id} value={station.station_id}>
                        {station.name}{' '}
                        {station.fullCount !== undefined ? ` - [ ${station.fullCount} full batteries ]` : ''}
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
                    className={`form-select flex w-full rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 border bg-slate-50 dark:bg-slate-800/50 h-11 p-3 text-sm ${formik.touched.to_station_id && formik.errors.to_station_id ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' : 'border-slate-300 dark:border-slate-700 focus:ring-primary/50 focus:border-primary'
                      }`}
                  >
                    <option value="">Select destination station</option>
                    {stations.map((station) => (
                      <option key={station.station_id} value={station.station_id} disabled={String(station.station_id) === String(formik.values.from_station_id)}>
                        {station.name}{' '}{station.emptySlots !== undefined ? ` - [ ${station.emptySlots} empty slots ]` : ''}
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
                    Creating...
                  </>
                ) : (
                  'Create Request'
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
