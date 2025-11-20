import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../hooks/useContext';
import { batteryService } from '../../services/batteryService';
import { stationService } from '../../services/stationService';
import { toast } from 'sonner';
import { ChevronRight, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

// Zod validation schema based on batteries table structure
const batterySchema = z.object({
    model: z.string().min(2, 'Model must be at least 2 characters').max(100, 'Model must not exceed 100 characters').optional().default('Tesla Model 3'),
    type: z.string().min(2, 'Type must be at least 2 characters').max(50, 'Type must not exceed 50 characters').optional().default('Lithium-ion'),
    capacity: z.coerce.number().positive('Capacity must be positive').finite('Capacity must be a valid number').refine(val => {
        const str = val.toString();
        const decimalPlaces = str.includes('.') ? str.split('.')[1].length : 0;
        return decimalPlaces <= 2;
    }, 'Capacity must have at most 2 decimal places'),
    current_charge: z.coerce.number().min(0, 'Current charge cannot be negative').max(100, 'Current charge cannot exceed 100%').optional().default(100),
    soh: z.coerce.number().min(0, 'SOH cannot be negative').max(100, 'SOH cannot exceed 100%').optional().default(100),
    status: z.enum(['full', 'charging', 'in_use', 'in_transit', 'booked'], {
        errorMap: () => ({ message: 'Please select a valid status' })
    }).optional().default('full'),
    quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1').max(100, 'Maximum 100 batteries per batch').default(1),
});

export default function CreateBattery() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [submitting, setSubmitting] = useState(false);
    const [stationName, setStationName] = useState('');

    React.useEffect(() => {
        const fetchStationName = async () => {
            if (user?.station_id) {
                try {
                    const station = await stationService.getStationById(user.station_id);
                    setStationName(station?.name || 'N/A');
                } catch (err) {
                    setStationName('N/A');
                }
            } else {
                setStationName('N/A');
            }
        };
        fetchStationName();
    }, [user?.station_id]);

    const {
        register,
        handleSubmit,
        formState: { errors, isValid },
    } = useForm({
        resolver: zodResolver(batterySchema),
        mode: 'onBlur',
        defaultValues: {
            model: 'Tesla Model 3',
            type: 'Lithium-ion',
            capacity: 100,
            current_charge: 100,
            soh: 100,
            status: 'full',
            quantity: 1,
        },
    });

    const onSubmit = async (values) => {
        if (!user?.station_id) {
            toast.error('No station assigned to this staff');
            return;
        }

        try {
            setSubmitting(true);
            const batteryData = {
                station_id: parseInt(user.station_id),
                model: values.model || 'Tesla Model 3',
                type: values.type || 'Lithium-ion',
                capacity: parseFloat(values.capacity),
                current_charge: parseFloat(values.current_charge),
                soh: parseFloat(values.soh),
                status: values.status || 'full',
            };

            for (let i = 0; i < values.quantity; i++) {
                // eslint-disable-next-line no-await-in-loop
                await batteryService.createBattery(batteryData);
            }
            toast.success(`Successfully created ${values.quantity} batteries!`);
            navigate('/staff/inventory');
        } catch (err) {
            console.error('Error creating battery:', err);
            const errorMsg = err.response?.data?.message || err.message || 'Failed to create battery';
            toast.error(errorMsg);
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = () => {
        navigate('/staff/inventory');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm mb-6">
                    <a href="/staff" className="text-primary hover:text-primary/80">
                        Dashboard
                    </a>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                    <a href="/staff/inventory" className="text-primary hover:text-primary/80">
                        Battery Inventory
                    </a>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-900 dark:text-slate-100 font-medium">Create New</span>
                </div>

                {/* Page Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">Create Battery</h1>
                    <p className="text-slate-600 dark:text-slate-400">Add a new battery to your station inventory</p>
                </div>

                {/* Form Card */}
                <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
                    <CardHeader className="border-b border-slate-200 dark:border-slate-800 p-6">
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Battery Information</h2>
                    </CardHeader>

                    <form onSubmit={handleSubmit(onSubmit)}>
                        <CardContent className="p-6">
                            {/* Station Information Display */}
                            <div className="mb-6 p-4 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Station ID</p>
                                        <p className="text-lg font-semibold text-slate-900 dark:text-white">{user?.station_id}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Station Name</p>
                                        <p className="text-lg font-semibold text-slate-900 dark:text-white">{stationName}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {/* Số lượng */}
                                <div className="flex flex-col col-span-1">
                                    <label className="text-slate-800 dark:text-slate-200 text-sm font-medium leading-normal pb-2">
                                        Quantity <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        {...register('quantity')}
                                        min={1}
                                        max={100}
                                        className={`form-input flex w-full rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 border bg-slate-50 dark:bg-slate-800/50 h-11 placeholder:text-slate-400 dark:placeholder:text-slate-500 p-3 text-sm ${errors.quantity ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' : 'border-slate-300 dark:border-slate-700 focus:ring-primary/50 focus:border-primary'
                                            }`}
                                        placeholder="Enter quantity"
                                    />
                                    {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity.message}</p>}
                                </div>
                                {/* Model */}
                                <div className="flex flex-col col-span-1">
                                    <label className="text-slate-800 dark:text-slate-200 text-sm font-medium leading-normal pb-2">
                                        Model <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        {...register('model')}
                                        className={`form-input flex w-full rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 border bg-slate-50 dark:bg-slate-800/50 h-11 placeholder:text-slate-400 dark:placeholder:text-slate-500 p-3 text-sm ${errors.model ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' : 'border-slate-300 dark:border-slate-700 focus:ring-primary/50 focus:border-primary'
                                            }`}
                                        placeholder="e.g., Tesla Model 3"
                                    />
                                    {errors.model && <p className="text-red-500 text-xs mt-1">{errors.model.message}</p>}
                                </div>

                                {/* Type */}
                                <div className="flex flex-col col-span-1">
                                    <label className="text-slate-800 dark:text-slate-200 text-sm font-medium leading-normal pb-2">
                                        Type <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        {...register('type')}
                                        className={`form-input flex w-full rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 border bg-slate-50 dark:bg-slate-800/50 h-11 placeholder:text-slate-400 dark:placeholder:text-slate-500 p-3 text-sm ${errors.type ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' : 'border-slate-300 dark:border-slate-700 focus:ring-primary/50 focus:border-primary'
                                            }`}
                                        placeholder="e.g., Lithium-ion"
                                    />
                                    {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type.message}</p>}
                                </div>

                                {/* Capacity (kWh) */}
                                <div className="flex flex-col col-span-1">
                                    <label className="text-slate-800 dark:text-slate-200 text-sm font-medium leading-normal pb-2">
                                        Capacity (kWh) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        {...register('capacity')}
                                        step="0.01"
                                        className={`form-input flex w-full rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 border bg-slate-50 dark:bg-slate-800/50 h-11 placeholder:text-slate-400 dark:placeholder:text-slate-500 p-3 text-sm ${errors.capacity ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' : 'border-slate-300 dark:border-slate-700 focus:ring-primary/50 focus:border-primary'
                                            }`}
                                        placeholder="100.00"
                                    />
                                    {errors.capacity && <p className="text-red-500 text-xs mt-1">{errors.capacity.message}</p>}
                                </div>

                                {/* Current Charge (%) */}
                                <div className="flex flex-col col-span-1">
                                    <label className="text-slate-800 dark:text-slate-200 text-sm font-medium leading-normal pb-2">
                                        Current Charge (%) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        {...register('current_charge')}
                                        step="0.01"
                                        min="0"
                                        max="100"
                                        className={`form-input flex w-full rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 border bg-slate-50 dark:bg-slate-800/50 h-11 placeholder:text-slate-400 dark:placeholder:text-slate-500 p-3 text-sm ${errors.current_charge ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' : 'border-slate-300 dark:border-slate-700 focus:ring-primary/50 focus:border-primary'
                                            }`}
                                        placeholder="100"
                                    />
                                    {errors.current_charge && <p className="text-red-500 text-xs mt-1">{errors.current_charge.message}</p>}
                                </div>

                                {/* SOH (State of Health %) */}
                                <div className="flex flex-col col-span-1">
                                    <label className="text-slate-800 dark:text-slate-200 text-sm font-medium leading-normal pb-2">
                                        SOH - State of Health (%) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        {...register('soh')}
                                        step="0.01"
                                        min="0"
                                        max="100"
                                        className={`form-input flex w-full rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 border bg-slate-50 dark:bg-slate-800/50 h-11 placeholder:text-slate-400 dark:placeholder:text-slate-500 p-3 text-sm ${errors.soh ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' : 'border-slate-300 dark:border-slate-700 focus:ring-primary/50 focus:border-primary'
                                            }`}
                                        placeholder="100"
                                    />
                                    {errors.soh && <p className="text-red-500 text-xs mt-1">{errors.soh.message}</p>}
                                </div>

                                {/* Status */}
                                <div className="flex flex-col col-span-1">
                                    <label className="text-slate-800 dark:text-slate-200 text-sm font-medium leading-normal pb-2">
                                        Status <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        {...register('status')}
                                        className={`form-select flex w-full rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 border bg-slate-50 dark:bg-slate-800/50 h-11 placeholder:text-slate-400 dark:placeholder:text-slate-500 p-3 text-sm ${errors.status ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' : 'border-slate-300 dark:border-slate-700 focus:ring-primary/50 focus:border-primary'
                                            }`}
                                    >
                                        <option value="">Select a status</option>
                                        <option value="full">Full</option>
                                        <option value="charging">Charging</option>
                                        <option value="in_use">In Use</option>
                                        <option value="in_transit">In Transit</option>
                                        <option value="booked">Booked</option>
                                    </select>
                                    {errors.status && <p className="text-red-500 text-xs mt-1">{errors.status.message}</p>}
                                </div>
                            </div>

                            {/* Info Box */}
                            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                <p className="text-sm text-blue-800 dark:text-blue-200">
                                    <strong>Note:</strong> This battery will be created at your assigned station. All fields are required.
                                </p>
                            </div>
                        </CardContent>

                        {/* Form Actions */}
                        <div className="p-6 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900/20 border-t border-slate-200 dark:border-slate-800 rounded-b-xl">
                            <Button type="button" variant="outline" onClick={handleCancel} disabled={submitting} className="px-4">
                                Cancel
                            </Button>
                            <Button type="submit" disabled={submitting || !isValid} className="px-4">
                                {submitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    'Create Battery'
                                )}
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
}