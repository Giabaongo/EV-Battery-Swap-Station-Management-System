import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import { useStation, useSubscription } from '../hooks/useContext';
import { vehicleService } from '../services/vehicleService';
import DashboardHeader from '../components/user/DashboardHeader';
import VehicleSubscriptionCard from '../components/user/VehicleSubscriptionCard';
import RecentActivityCard from '../components/user/RecentActivityCard';
import NearbyStationsCard from '../components/user/NearbyStationsCard';
import HelpLinksCard from '../components/user/HelpLinksCard';
import SwapSuccessDialog from '../components/dashboard/SwapSuccessDialog';
import AutoSwapDialog from '../components/user/AutoSwapDialog';

export default function User() {
  const navigate = useNavigate();
  const { user } = useOutletContext();
  const { stations } = useStation();
  const { activeSubscription, getActiveSubscription } = useSubscription();
  const [vehicleData, setVehicleData] = useState([]);
  const [showAutoSwap, setShowAutoSwap] = useState(false);
  const [swapResult, setSwapResult] = useState(null);

  // Fetch user's active subscription on component mount
  useEffect(() => {
    const fetchActiveSubscription = async () => {
      if (!user?.user_id) return;

      try {
        await getActiveSubscription(user.user_id);
      } catch (error) {
        console.error('Error fetching active subscription:', error);
      }
    };

    fetchActiveSubscription();
  }, [user?.user_id, getActiveSubscription]);

  // Fetch vehicle data by user ID
  useEffect(() => {
    const fetchVehicleData = async () => {
      if (!user?.user_id) return;

      try {
        console.log('Fetching enriched vehicles for user ID:', user.user_id);
        const vehicles = await vehicleService.getVehiclesByUserIdWithBattery(user.user_id);
        console.log('Enriched vehicle data fetched:', vehicles);
        setVehicleData(Array.isArray(vehicles) ? vehicles : []);
      } catch (error) {
        console.error('Error fetching vehicle data:', error);
        setVehicleData([]);
      }
    };

    fetchVehicleData();

    // Auto-refresh every 5 seconds
    const interval = setInterval(fetchVehicleData, 5000);
    return () => clearInterval(interval);
  }, [user?.user_id]);

  const nearbyStations = useMemo(() => {
    // Wait for stations to be initialized before processing
    if (!Array.isArray(stations) || stations.length === 0) return [];
    // pick first 3 for preview; could be sorted by distance if available
    return stations.slice(0, 3).map((s) => ({
      id: s.station_id ?? s.id,
      name: s.name || 'Unnamed Station',
      address: s.address || '',
      available: s.availableBatteries ?? (Array.isArray(s.batteries) ? s.batteries.filter(b => String(b.status || '').toLowerCase() === 'full').length : 0),
      total: s.totalBatteries ?? (Array.isArray(s.batteries) ? s.batteries.length : 0),
    }));
  }, [stations]);

  const handleAutoSwap = () => {
    setShowAutoSwap(true);
  };

  const handleSwapSuccess = (response) => {
    console.log('✅ Swap successful - Full response:', response);
    console.log('📋 Swap transaction object:', response?.swapTransaction);
    console.log('🔍 Transaction ID:', response?.swapTransaction?.transaction_id);

    // Find the vehicle from vehicleData
    const vehicle = vehicleData.find(v => v.vehicle_id === response.swapTransaction?.vehicle_id);

    // Find the station from stations
    const station = stations.find(s => s.station_id === response.swapTransaction?.station_id);

    // Prepare summary data for success dialog
    const summary = {
      user: user?.username || user?.full_name || 'Driver',
      station: station?.name || 'Unknown Station',
      vehicle: vehicle?.vin || vehicle?.plate || `Vehicle #${response.swapTransaction?.vehicle_id}`,
      plan: activeSubscription?.package?.package_name || activeSubscription?.package_name || 'Active Subscription',
    };

    console.log('📊 Summary for dialog:', summary);
    setSwapResult(summary);

    // Auto-hide success dialog after 5 seconds
    setTimeout(() => {
      setSwapResult(null);
    }, 5000);

    // Refresh vehicle data after swap
    if (user?.user_id) {
      vehicleService.getVehiclesByUserIdWithBattery(user.user_id)
        .then(vehicles => {
          console.log('🔄 Vehicles refreshed after swap:', vehicles);
          setVehicleData(Array.isArray(vehicles) ? vehicles : []);
        })
        .catch(err => console.error('Error refreshing vehicles:', err));
    }
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      {/* Background to match Driver.jsx style */}
      <div
        className="absolute inset-0 z-0 hidden"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 5% 40%, #ffffffdc, transparent 67%),
            radial-gradient(ellipse 70% 60% at 45% 45%, #6699ff69, transparent 67%),
            radial-gradient(ellipse 62% 52% at 83% 76%, #b9e2ffb4, transparent 63%),
            radial-gradient(ellipse 60% 48% at 75% 20%, #eff1f8bc, transparent 66%),
            linear-gradient(45deg, #eaeeffff 0%, #ffffffff 100%)
          `,
        }}
      />

      <div className="min-h-screen relative z-10">
        <Sidebar />
        <main className="px-16 py-5 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <DashboardHeader name={user?.username || 'Driver'} onAutoSwap={handleAutoSwap} />
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Vehicle & Subscription Card - Full Width */}
              <div className="lg:col-span-2">
                <VehicleSubscriptionCard vehicles={vehicleData} onFindStations={() => navigate('/driver/map')} />
              </div>

              {/* Left column */}
              <div className="lg:col-span-1 flex flex-col gap-6">
                <RecentActivityCard onViewAll={() => navigate('/driver/reports')} />
              </div>

              {/* Right column */}
              <div className="lg:col-span-1 flex flex-col gap-6 ml-6">
                <NearbyStationsCard stations={nearbyStations} onViewAll={() => navigate('/driver/map')} />

                <HelpLinksCard
                  onContact={() => navigate('/driver/support')}
                  onFAQ={() => navigate('/driver/support')}
                  onFeedback={() => navigate('/driver/support')}
                />
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Auto Swap Dialog */}
      <AutoSwapDialog
        open={showAutoSwap}
        onOpenChange={setShowAutoSwap}
        userId={user?.user_id}
        onSuccess={handleSwapSuccess}
      />

      {/* Swap Success Notification */}
      {swapResult && (
        <SwapSuccessDialog
          open={Boolean(swapResult)}
          onOpenChange={() => setSwapResult(null)}
          summary={swapResult}
        />
      )}
    </div>
  );
}
