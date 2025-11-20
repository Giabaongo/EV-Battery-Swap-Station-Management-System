import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../../hooks/useContext';
import ProfileHeader from '../../components/profile/ProfileHeader';
import PersonalInfoCard from '../../components/profile/PersonalInfoCard';
import VehiclesList from '../../components/profile/VehiclesList';
import { vehicleService } from '../../services/vehicleService';
import { subscriptionService } from '../../services/subscriptionService';

export default function Profile() {
  // Try to get user from outlet context first, fallback to AuthContext
  const outletContext = useOutletContext();
  const { user: authUser } = useAuth();
  const user = outletContext?.user || authUser;

  const [vehicles, setVehicles] = useState([]);

  // Fetch enriched vehicles (with batteryLevel & soh) from service
  // Extract fetch function so child components can trigger refresh
  const fetchVehicles = async () => {
    // Only fetch vehicles if user is a driver
    if (!user?.user_id || (user?.role && user.role !== 'driver')) {
      setVehicles([]);
      return;
    }

    try {
      const [vehicles, subscriptions] = await Promise.all([
        vehicleService.getVehiclesByUserIdWithBattery(user.user_id),
        // fetch subscriptions for user once and map by vehicle_id
        subscriptionService.getSubscriptionsByUserId(user.user_id).catch(() => []),
      ])

      const subsByVehicle = (subscriptions || []).reduce((acc, s) => {
        if (s?.vehicle_id) acc[s.vehicle_id] = acc[s.vehicle_id] || []
        if (s?.vehicle_id) acc[s.vehicle_id].push(s)
        return acc
      }, {})

      const enriched = (vehicles || []).map(v => {
        const vehicleId = v?.vehicle_id || v?.id || null
        const subs = vehicleId ? (subsByVehicle[vehicleId] || []) : []
        const hasActiveSub = subs.some(s => (s.status || '').toLowerCase() === 'active')
        return { ...v, hasActiveSubscription: hasActiveSub }
      })

      setVehicles(Array.isArray(enriched) ? enriched : []);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      setVehicles([]);
    }
  };

  useEffect(() => {
    // Only refetch when user id or role changes
    fetchVehicles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.user_id, user?.role]);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="max-w-5xl ml-8 p-6">
        <ProfileHeader />
        <PersonalInfoCard user={user} />
        {/* Only show vehicles list if user is a driver */}
        {user?.role === 'driver' && (
          <VehiclesList vehicles={vehicles} onAddVehicle={fetchVehicles} />
        )}
      </div>
    </div>
  );
}
