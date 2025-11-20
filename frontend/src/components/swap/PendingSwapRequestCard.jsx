import { User } from 'lucide-react';

export default function PendingSwapRequestCard({ reservation, onProcessSwap }) {
    // Get user name from reservation data
    const userName = reservation.user?.username || reservation.user?.name || `User ${reservation.user_id}`;
    const vehicleVin = reservation.vehicle?.vin || `VIN${reservation.vehicle_id}`;

    // Get battery info - show battery_id and slot_number if available
    const batteryInfo = reservation.battery
        ? `Battery ${reservation.battery.battery_id}${reservation.battery.slot_number ? ` - Slot ${reservation.battery.slot_number}` : ''}`
        : reservation.battery_id
            ? `Battery ${reservation.battery_id}`
            : 'Not assigned';

    return (
        <div className="flex flex-col gap-4 rounded-xl bg-white p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            {/* User Info */}
            <div className="flex items-center gap-4">
                <div className="flex items-center justify-center size-12 rounded-full bg-gray-100 flex-shrink-0">
                    <User className="text-gray-600" size={28} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-gray-900 text-lg font-bold truncate">{userName}</p>
                    <p className="text-gray-500 text-sm">Request ID: #{reservation.reservation_id}</p>
                </div>
            </div>

            {/* Details */}
            <div className="text-sm space-y-2 pt-2">
                <p>
                    <strong className="text-gray-600 font-medium">VIN:</strong>{' '}
                    <span className="text-gray-900 font-mono text-xs">{vehicleVin}</span>
                </p>
                <p>
                    <strong className="text-gray-600 font-medium">Reserved:</strong>{' '}
                    <span className="text-gray-900">{batteryInfo}</span>
                </p>
            </div>

            {/* Process Button */}
            <button
                onClick={() => onProcessSwap(reservation)}
                className="mt-auto flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-blue-600 text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-blue-700 transition-colors active:bg-blue-800"
            >
                <span>Process Swap</span>
            </button>
        </div>
    );
}
