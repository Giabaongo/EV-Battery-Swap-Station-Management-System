import React from 'react';
import { Clock, Battery, Zap, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function StationCard({ station, onClick }) {
  const navigate = useNavigate();

  const handleBookNow = (e) => {
    e.stopPropagation();
    const stationId = station?.station_id ?? station?.id;
    navigate(`/driver/booking/${stationId}`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // If station prop is not provided, render nothing (avoid runtime errors)
  if (!station) return null;

  return (
    <>
      <div
        onClick={() => onClick && onClick(station)}
        className="px-4 py-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <Zap className="text-blue-700" size={24} />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{station.name}</h3>
                <p className="text-sm text-gray-600">{station.address}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1 text-gray-600">
                <Clock size={16} />
                <span>{station.distance}</span>
              </div>
              <div className="flex items-center gap-1 text-gray-600">
                <Battery size={16} />
                <span>{station.availableBatteries ?? 0} available</span>
              </div>
            </div>
          </div>

          <div className="ml-4 flex flex-col items-end gap-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(station.status)}`}>
              {station.status}
            </span>
            {station.status !== 'No Slots' && (
              <button
                onClick={handleBookNow}
                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md transition-colors"
              >
                Book Now
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
