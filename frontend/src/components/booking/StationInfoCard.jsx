import React from 'react';
import { MapPin, Battery, Clock, AlertCircle } from 'lucide-react';

export default function StationInfoCard({
  stationName,
  stationAddress,
  availableSlots,
  totalSlots,
  bookingTime
}) {
  // Calculate deadline: scheduled time + 30 minutes
  const calculateDeadline = () => {
    if (!bookingTime) return null;
    try {
      // bookingTime is in format "HH:MM" (e.g., "21:15")
      const [hours, minutes] = bookingTime.split(':').map(Number);
      if (isNaN(hours) || isNaN(minutes)) return null;

      const now = new Date();
      const bookingDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);
      const deadline = new Date(bookingDate.getTime() + 30 * 60 * 1000); // Add 30 minutes

      const deadlineHours = String(deadline.getHours()).padStart(2, '0');
      const deadlineMinutes = String(deadline.getMinutes()).padStart(2, '0');
      return `${deadlineHours}:${deadlineMinutes}`;
    } catch (error) {
      console.error('Error calculating deadline:', error);
      return null;
    }
  };
  const deadline = calculateDeadline();
  return (
    <div className="bg-gray-50 rounded-lg p-5">
      <h3 className="font-bold text-gray-900 mb-4 text-lg">Station Information</h3>

      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-gray-900">{stationName}</p>
            <p className="text-sm text-gray-600">{stationAddress}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Battery className="w-5 h-5 text-green-600" />
          <div>
            <p className="text-sm text-gray-600">Available Batteries:</p>
            <p className="font-semibold text-gray-900">{availableSlots}/{totalSlots}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-orange-600" />
          <div>
            <p className="text-sm text-gray-600">Booking Time:</p>
            <p className="font-semibold text-gray-900">{bookingTime}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2 border-t border-gray-200">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <div>
            <p className="text-sm text-gray-600">Deadline to arrive:</p>
            <p className="font-semibold text-red-600">{deadline || 'N/A'}</p>
            <p className="text-xs text-gray-500 mt-1">Scheduled time + 30 minutes</p>
          </div>
        </div>

        {/* Important Notice */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-2">
          <p className="text-sm text-red-800">
            Please arrive at the station before <strong>{deadline}</strong> to complete your battery swap. After this time, your booking will be automatically cancelled.
          </p>
        </div>
      </div>
    </div>
  );
}
