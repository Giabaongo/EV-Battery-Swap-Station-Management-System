import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import Booking from '../../pages/Booking';
import { useAuth, useStation, useReservation, useSubscription, useVehicle } from '../../hooks/useContext';

export default function BookingContainer() {
  const { stationId } = useParams();
  const { user } = useAuth();
  const { getStationById } = useStation();
  const { createReservation } = useReservation();
  const { subscriptions, activeSubscription, getActiveSubscription } = useSubscription();
  const { vehicles, loading: vehiclesLoading } = useVehicle();
  const navigate = useNavigate();

  console.log('BookingContainer render - user:', user, 'user.id:', user?.id, 'vehicles:', vehicles.length, 'vehiclesLoading:', vehiclesLoading, 'subscriptions:', subscriptions.length);

  const [bookingState, setBookingState] = useState('idle');
  const [timeRemaining, setTimeRemaining] = useState(3600);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [bookingTime, setBookingTime] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [selectedVehicleSubscription, setSelectedVehicleSubscription] = useState(null);


  const [stationInfo, setStationInfo] = useState({
    station_id: stationId ? Number(stationId) : null,
    name: '',
    address: '',
    totalSlots: 0,
    availableSlots: 0,
    batteries: []
  });

  // Load station data
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!stationId) return;
      try {
        const res = await getStationById(Number(stationId));
        const st = res?.data ?? res ?? null;
        if (!st) return;
        const batteriesArr = Array.isArray(st.batteries) ? st.batteries : [];
        const total = batteriesArr.length;
        const available = batteriesArr.filter(b => String(b.status || '').toLowerCase() === 'full').length;
        if (mounted) {
          setStationInfo({
            station_id: st.station_id ?? st.id,
            name: st.name ?? '',
            address: st.address ?? '',
            totalSlots: total,
            availableSlots: available,
            batteries: batteriesArr
          });
        }
      } catch (err) {
        console.error('Failed to load station data', err);
      }
    };
    load();
    return () => { mounted = false; };
  }, [stationId, getStationById]);

  // Check user's active subscription on mount
  useEffect(() => {
    if (user?.id) {
      console.log('BookingContainer: Fetching activeSubscription for user:', user.id);
      getActiveSubscription(user.id).catch(err => {
        console.error('BookingContainer: Failed to fetch activeSubscription', err);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Normalize subscriptions with __normalizedVehicleId for easier matching
  const normalizedSubscriptions = useMemo(() => {
    return (subscriptions || []).map(s => {
      const rawVid = s.vehicle_id ?? s.vehicle?.vehicle_id ?? s.vehicle?.id ?? s.vehicleId ?? s.vehicle?.vehicleId;
      const normalizedVid = rawVid !== undefined && rawVid !== null ? Number(rawVid) : undefined;
      return { ...s, __normalizedVehicleId: normalizedVid };
    });
  }, [subscriptions]);

  console.log('BookingContainer: normalizedSubscriptions:', normalizedSubscriptions);

  // Auto-select first vehicle when vehicles load
  useEffect(() => {
    if (vehicles && vehicles.length > 0 && !selectedVehicleId) {
      const firstId = vehicles[0].vehicle_id ?? vehicles[0].id;
      setSelectedVehicleId(firstId);
      console.log('BookingContainer: Auto-selected first vehicle:', firstId, 'from vehicles:', vehicles);
    }
  }, [vehicles, selectedVehicleId]);

  // Match subscription to selected vehicle
  // If multiple subscriptions exist for the same vehicle, prioritize by:
  // 1. Show non-active status first (expired, cancelled, pending_penalty_payment)
  // 2. If all are active, show the most recent one
  useEffect(() => {
    console.log('BookingContainer: Matching subscription - selectedVehicleId:', selectedVehicleId, 'normalizedSubscriptions:', normalizedSubscriptions);
    if (selectedVehicleId && normalizedSubscriptions.length > 0) {
      // Find ALL subscriptions for this vehicle
      const matchedSubscriptions = normalizedSubscriptions.filter(s => {
        const matches = s.__normalizedVehicleId === Number(selectedVehicleId);
        console.log('  - Checking subscription:', s.subscription_id, 'status:', s.status, '__normalizedVehicleId:', s.__normalizedVehicleId, 'matches:', matches);
        return matches;
      });

      if (matchedSubscriptions.length === 0) {
        setSelectedVehicleSubscription(null);
        console.log('BookingContainer: ⚠️ No subscription found for vehicle:', selectedVehicleId);
      } else if (matchedSubscriptions.length === 1) {
        setSelectedVehicleSubscription(matchedSubscriptions[0]);
        console.log('BookingContainer: ✓ Found 1 subscription for vehicle:', selectedVehicleId, '→', matchedSubscriptions[0]);
      } else {
        // Multiple subscriptions for same vehicle
        // Priority: show non-active status first (expired, cancelled, pending_penalty_payment)
        const nonActiveSubscription = matchedSubscriptions.find(s => s.status !== 'active');

        if (nonActiveSubscription) {
          setSelectedVehicleSubscription(nonActiveSubscription);
          console.log('BookingContainer: ✓ Found', matchedSubscriptions.length, 'subscriptions for vehicle:', selectedVehicleId, 'using non-active subscription:', nonActiveSubscription);
        } else {
          // All are active - pick most recent
          const mostRecent = matchedSubscriptions.reduce((latest, current) => {
            const latestTime = new Date(latest.updated_at || latest.created_at).getTime();
            const currentTime = new Date(current.updated_at || current.created_at).getTime();
            return currentTime > latestTime ? current : latest;
          });
          setSelectedVehicleSubscription(mostRecent);
          console.log('BookingContainer: ✓ Found', matchedSubscriptions.length, 'subscriptions for vehicle:', selectedVehicleId, 'all active, using most recent:', mostRecent);
        }
      }
    } else if (selectedVehicleId && normalizedSubscriptions.length === 0) {
      console.log('BookingContainer: ⚠️ No subscriptions available yet for vehicle:', selectedVehicleId);
      setSelectedVehicleSubscription(null);
    }
  }, [selectedVehicleId, normalizedSubscriptions]);

  // Timer for booking countdown
  useEffect(() => {
    if (bookingState === 'booked' && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setBookingState('idle');
            return 3600;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [bookingState, timeRemaining]);

  const handleVehicleChange = (vehicleId) => {
    // ensure id is numeric (select gives string), log for debugging
    const vid = Number(vehicleId);
    setSelectedVehicleId(vid);

    // Find ALL subscriptions for this vehicle and pick the best one
    const matchedSubscriptions = normalizedSubscriptions.filter(
      (s) => s.__normalizedVehicleId === vid || Number(s.vehicle_id) === vid
    );

    if (matchedSubscriptions.length === 0) {
      setSelectedVehicleSubscription(null);
    } else if (matchedSubscriptions.length === 1) {
      setSelectedVehicleSubscription(matchedSubscriptions[0]);
    } else {
      // Multiple subscriptions - prioritize non-active status
      const nonActiveSubscription = matchedSubscriptions.find(s => s.status !== 'active');

      if (nonActiveSubscription) {
        setSelectedVehicleSubscription(nonActiveSubscription);
      } else {
        // All are active - pick most recent
        const mostRecent = matchedSubscriptions.reduce((latest, current) => {
          const latestTime = new Date(latest.updated_at || latest.created_at).getTime();
          const currentTime = new Date(current.updated_at || current.created_at).getTime();
          return currentTime > latestTime ? current : latest;
        });
        setSelectedVehicleSubscription(mostRecent);
      }
    }
  };

  const handleConfirmBooking = async () => {
    // Prefer vehicle-specific subscription when available
    const subscriptionToUse = selectedVehicleSubscription ?? activeSubscription;
    const station_id = stationInfo?.station_id || (stationId ? Number(stationId) : null);
    if (!station_id) {
      console.error('No station selected for booking');
      return;
    }

    // Check if user has selected a vehicle
    if (!selectedVehicleId) {
      toast.error('Please select a vehicle first');
      return;
    }

    // Check if user has subscription for the selected vehicle
    if (!subscriptionToUse) {
      toast.error('You need to subscribe to a plan for the selected vehicle to book a battery swap.');
      navigate('/driver/plans');
      return;
    }

    // Check subscription status - must be 'active'
    if (subscriptionToUse.status !== 'active') {
      let errorMsg = '';
      switch (subscriptionToUse.status) {
        case 'expired':
          errorMsg = 'Your subscription has expired. Please renew your plan to continue.';
          break;
        case 'cancelled':
          errorMsg = 'Your subscription has been cancelled. Please subscribe to a new plan.';
          break;
        case 'pending_penalty_payment':
          errorMsg = 'You have a pending penalty payment. Please complete it before booking a swap.';
          break;
        default:
          errorMsg = `Your subscription status is: ${subscriptionToUse.status}. You cannot book at this time.`;
      }
      toast.error(errorMsg);
      navigate('/driver/plans');
      return;
    }

    // Check if batteries are available
    const availableBatteries = (stationInfo.batteries || []).filter(b => String(b.status || '').toLowerCase() === 'full');
    if (availableBatteries.length === 0) {
      toast.error('No available batteries at this station');
      return;
    }

    // Backend DTO requires: user_id, vehicle_id, station_id, scheduled_time
    try {
      // Schedule time must be in the future - add 5 minutes from now
      const scheduledTime = new Date();
      scheduledTime.setMinutes(scheduledTime.getMinutes() + 5);

      const payload = {
        user_id: user?.id ?? user?.user_id,
        vehicle_id: selectedVehicleId,
        station_id,
        scheduled_time: scheduledTime.toISOString(),
      };

      console.log('Creating reservation with payload:', payload);
      const created = await createReservation(payload);
      console.log('Reservation created successfully:', created);
      console.log('Reservation status should be: scheduled');

      if (created) {
        setBookingState('booked');
        setTimeRemaining(3600);
        const now = new Date();
        const formattedTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        setBookingTime(formattedTime);
      }
    } catch (err) {
      console.error('Failed to create reservation', err);
      console.error('Error response:', err.response?.data);
      // Map some backend messages to friendlier UI flows
      const serverMsg = err.response?.data?.message || '';

      if (typeof serverMsg === 'string' && serverMsg.includes('already have a reservation')) {
        toast.error('You already have an active reservation. Please complete or cancel it first.');
        return;
      }

      if (typeof serverMsg === 'string' && serverMsg.includes('does not have an active subscription')) {
        // Guide user to subscription plans
        toast.warning('Your vehicle does not have an active subscription', {
          description: 'Would you like to view plans?',
        });
        navigate('/driver/plans');
        return;
      }

      if (typeof serverMsg === 'string' && serverMsg.includes('Not found driver vehicle')) {
        toast.error('No active vehicle found for your account. Please register or activate a vehicle before booking.');
        return;
      }

      toast.error('Failed to create reservation: ' + (serverMsg || err.message || 'Unknown error'));
    }
  };

  const handleCancelClick = () => setShowCancelDialog(true);

  const handleConfirmCancel = () => {
    setBookingState('idle');
    setTimeRemaining(3600);
    setShowCancelDialog(false);
    setBookingTime('');
  };

  const handleCancelDialogClose = () => setShowCancelDialog(false);

  const handleBackToMap = () => navigate('/driver/map');

  const handleNavigateToPlans = () => navigate('/driver/plans');

  return (
    <Booking
      // State
      stationInfo={stationInfo}
      bookingState={bookingState}
      timeRemaining={timeRemaining}
      showCancelDialog={showCancelDialog}
      bookingTime={bookingTime}
      subscriptionLoading={false}
      vehiclesLoading={vehiclesLoading}
      activeSubscription={activeSubscription}
      // vehicle related
      vehicles={vehicles}
      selectedVehicleId={selectedVehicleId}
      onVehicleChange={handleVehicleChange}
      selectedVehicleSubscription={selectedVehicleSubscription}

      // Handlers
      onConfirmBooking={handleConfirmBooking}
      onCancelClick={handleCancelClick}
      onConfirmCancel={handleConfirmCancel}
      onCancelDialogClose={handleCancelDialogClose}
      onBackToMap={handleBackToMap}
      onNavigateToPlans={handleNavigateToPlans}
    />
  );
}