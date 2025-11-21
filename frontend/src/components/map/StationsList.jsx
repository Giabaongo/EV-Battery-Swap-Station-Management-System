import React, { useEffect, useCallback } from 'react';
import StationCard from './StationCard';
import { useBatteryWebSocket } from '../../hooks/useBatteryWebSocket';
import { useBattery } from '../../hooks/useContext';

export default function StationsList({ stations, onStationClick }) {
  const { getAllBatteries } = useBattery();

  // Callback when battery status changes (e.g., full -> charging, charging -> full)
  const handleBatteryStatusChanged = useCallback(async (data) => {
    console.log('🔄 Battery status changed, refreshing battery data...', data);
    // Refresh all batteries to update available counts
    try {
      await getAllBatteries();
    } catch (error) {
      console.error('Error refreshing batteries after status change:', error);
    }
  }, [getAllBatteries]);

  // Callback when battery charge updates
  const handleBatteryChargeUpdated = useCallback(async (data) => {
    console.log('⚡ Battery charge updated:', data);

    // If battery reached full charge (>= 80%), refresh to update available count
    if (data.currentCharge >= 80 && data.previousCharge < 80) {
      console.log('🔋 Battery reached full charge, refreshing...');
      try {
        await getAllBatteries();
      } catch (error) {
        console.error('Error refreshing batteries after charge update:', error);
      }
    }
  }, [getAllBatteries]);

  // Connect to battery WebSocket
  const { isConnected, socketId } = useBatteryWebSocket(
    handleBatteryStatusChanged,
    handleBatteryChargeUpdated,
    true // enabled
  );

  // Log connection status
  useEffect(() => {
    if (isConnected) {
      console.log('✅ StationsList: Battery WebSocket connected', socketId);
    } else {
      console.log('🔌 StationsList: Battery WebSocket disconnected');
    }
  }, [isConnected, socketId]);

  return (
    <div className="h-full p-4 bg-transparent rounded-lg">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 h-full">
        <div className="px-4 py-3 border-b border-gray-100 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">Nearby Stations</h2>
              {stations.length > 0 ? (
                <p className="text-sm text-gray-600">{stations.length} stations found</p>
              ) : (
                <p className="text-sm text-gray-600">No stations with suitable batteries found nearby</p>
              )}
            </div>
            {/* WebSocket connection indicator */}
            {isConnected && (
              <div className="flex items-center gap-1 text-xs text-green-600">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span>Live</span>
              </div>
            )}
          </div>
        </div>

        <div className="h-full overflow-y-auto pb-16">
          {stations.map((station) => (
            <StationCard
              key={station.station_id}
              station={station}
              onClick={onStationClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
}