import BookingHeader from '../components/booking/BookingHeader';
import StationInfoPanel from '../components/booking/StationInfoPanel';
import BookingSuccessView from '../components/booking/BookingSuccessView';

export default function Booking({
  // State props
  stationInfo,
  bookingState,
  timeRemaining,
  showCancelDialog,
  bookingTime,
  subscriptionLoading,
  vehiclesLoading,
  activeSubscription,
  // vehicle props
  vehicles,
  selectedVehicleId,
  onVehicleChange,
  selectedVehicleSubscription,

  // Handler props
  onConfirmBooking,
  onCancelClick,
  onConfirmCancel,
  onCancelDialogClose,
  onBackToMap,
  onNavigateToPlans
}) {
  if (bookingState === 'booked') {
    return (
      <BookingSuccessView
        stationName={stationInfo.name}
        stationAddress={stationInfo.address}
        availableSlots={stationInfo.availableSlots}
        totalSlots={stationInfo.totalSlots}
        timeRemaining={timeRemaining}
        bookingTime={bookingTime}
        onCancelBooking={onCancelClick}
        showCancelDialog={showCancelDialog}
        onConfirmCancel={onConfirmCancel}
        onCancelDialogClose={onCancelDialogClose}
      />
    );
  }

  // Utility function to check if subscription is active
  const isSubscriptionActive = (subscription) => {
    if (!subscription) return false;
    return subscription.status === 'active';
  };

  // Utility function to get subscription status message
  const getSubscriptionStatusMessage = (subscription) => {
    if (!subscription) {
      return { title: 'No subscription', status: 'none', message: 'You need to subscribe to a plan before booking a battery swap.' };
    }

    const statusMap = {
      'active': { title: 'Active Subscription', status: 'active', message: null },
      'expired': { title: 'Subscription Expired', status: 'expired', message: 'Your subscription has expired. Please renew your plan to continue.' },
      'cancelled': { title: 'Subscription Cancelled', status: 'cancelled', message: 'Your subscription has been cancelled. Please subscribe to a new plan.' },
      'pending_penalty_payment': { title: 'Pending Penalty Payment', status: 'penalty', message: 'You have a pending penalty payment. Please complete it before booking a swap.' }
    };

    return statusMap[subscription.status] || { title: 'Unknown Status', status: 'unknown', message: 'Your subscription status is unknown.' };
  };

  // compute subscription banner and related UI based on selected vehicle vs user-level
  const hasVehicles = Array.isArray(vehicles) && vehicles.length > 0;
  const subscriptionToShow = hasVehicles ? selectedVehicleSubscription : activeSubscription;
  const isSubscriptionValid = isSubscriptionActive(subscriptionToShow);
  const subscriptionStatusInfo = getSubscriptionStatusMessage(subscriptionToShow);

  // determine selected vehicle battery model (if any) so StationInfoPanel can filter compatible batteries
  const selectedVehicleBatteryModel = (() => {
    if (!hasVehicles || !selectedVehicleId) return undefined;
    const veh = vehicles.find(v => (v.vehicle_id ?? v.id) === selectedVehicleId);
    return veh?.battery_model ?? veh?.batteryModel ?? veh?.battery?.battery_model;
  })();

  const getStatusBgColor = (status) => {
    switch (status) {
      case 'active':
        return { bg: 'bg-green-50', border: 'border-green-400', icon: 'text-green-400', text: 'text-green-700', textSecondary: 'text-green-600' };
      case 'expired':
        return { bg: 'bg-red-50', border: 'border-red-400', icon: 'text-red-400', text: 'text-red-700', textSecondary: 'text-red-600' };
      case 'cancelled':
        return { bg: 'bg-orange-50', border: 'border-orange-400', icon: 'text-orange-400', text: 'text-orange-700', textSecondary: 'text-orange-600' };
      case 'penalty':
        return { bg: 'bg-red-50', border: 'border-red-400', icon: 'text-red-400', text: 'text-red-700', textSecondary: 'text-red-600' };
      default:
        return { bg: 'bg-yellow-50', border: 'border-yellow-400', icon: 'text-yellow-400', text: 'text-yellow-700', textSecondary: 'text-yellow-600' };
    }
  };

  const statusColors = getStatusBgColor(subscriptionStatusInfo.status);

  const subscriptionBanner = (() => {
    if (subscriptionLoading) {
      return (
        <div className="px-6 pb-4">
          <div className="bg-gray-100 rounded-lg p-4 text-center">
            <p className="text-gray-600">Checking subscription status...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="px-6 pb-4">
        <div className={`${statusColors.bg} border-l-4 ${statusColors.border} p-4 rounded-lg`}>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {subscriptionStatusInfo.status === 'active' ? (
                <svg className={`h-5 w-5 ${statusColors.icon}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className={`h-5 w-5 ${statusColors.icon}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <p className={`text-sm ${statusColors.text} font-medium`}>
                {subscriptionStatusInfo.status === 'active' && subscriptionToShow
                  ? `Active Subscription: ${subscriptionToShow?.package?.package_name || 'Premium Plan'}`
                  : subscriptionStatusInfo.title
                }
              </p>
              {subscriptionStatusInfo.status === 'active' && subscriptionToShow && (
                <p className={`text-sm ${statusColors.textSecondary} mt-1`}>
                  Swaps remaining: {subscriptionToShow?.remaining_swap_count ?? 'Unlimited'}
                </p>
              )}
              {subscriptionStatusInfo.message && (
                <p className={`text-sm ${statusColors.textSecondary} mt-1`}>{subscriptionStatusInfo.message}</p>
              )}
              {subscriptionStatusInfo.status !== 'active' && (
                <button onClick={onNavigateToPlans} className={`mt-2 text-sm font-medium ${statusColors.text} hover:opacity-80 underline`}>
                  View Plans →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  })();

  return (
    <div className="min-h-screen bg-transparent overflow-y-auto flex items-center justify-center">
      <div className="max-w-5xl mx-auto p-6 w-full">
        <div className="bg-white rounded-b-2xl shadow-xl max-w-2xl w-full p-8 mx-auto">
          <BookingHeader stationName={stationInfo.name} stationAddress={stationInfo.address} onBackToMap={onBackToMap} />

          <div className="relative px-6 pb-6">
            <div className="relative overflow-hidden rounded-xl shadow-lg">
              <img src={stationInfo.image || 'https://selex.vn/wp-content/uploads/2024/11/Group-1000002977-1.png'} alt={stationInfo.name || 'Station'} className="w-full h-72 object-cover transform hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
            </div>
          </div>

          {/* Vehicle chooser - Always show, with loading state if needed */}
          <div className="px-6 pb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Choose vehicle</label>
            {vehiclesLoading ? (
              <div className="w-full rounded-md border border-gray-200 p-2 bg-gray-50 text-gray-500">
                Loading vehicles...
              </div>
            ) : Array.isArray(vehicles) && vehicles.length > 0 ? (
              <select
                value={selectedVehicleId ?? ''}
                onChange={(e) => onVehicleChange(Number(e.target.value))}
                className="w-full rounded-md border border-gray-200 p-2"
              >
                {vehicles.map((v) => {
                  const id = v.vehicle_id ?? v.id;
                  const label = v.vin || v.plate_number || v.name || `Vehicle ${id}`;
                  return (
                    <option key={id} value={id}>{label}</option>
                  );
                })}
              </select>
            ) : (
              <div className="w-full rounded-md border border-gray-200 p-2 bg-gray-50 text-gray-500">
                No vehicles found. Please add a vehicle first.
              </div>
            )}
          </div>

          {subscriptionBanner}

          <StationInfoPanel
            stationInfo={stationInfo}
            bookingState={bookingState}
            timeRemaining={timeRemaining}
            onConfirmBooking={onConfirmBooking}
            onCancelBooking={onCancelClick}
            showCancelDialog={showCancelDialog}
            onConfirmCancel={onConfirmCancel}
            onCancelDialogClose={onCancelDialogClose}
            selectedVehicleHasSubscription={isSubscriptionValid}
            selectedVehicleBatteryModel={selectedVehicleBatteryModel}
          />
        </div>
      </div>
    </div>
  );
}
