import { useState } from 'react';
import { Eye, Calendar, CreditCard, Car, MapPin, Zap, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import SubscriptionDetailModal from './SubscriptionDetailModal';
import { paymentService } from '../../services/paymentService';

export default function SubscribedList({ subscriptions, onRefresh }) {
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [renewingId, setRenewingId] = useState(null);
  const [renewingDirectId, setRenewingDirectId] = useState(null);

  const handleViewDetails = (subscription) => {
    setSelectedSubscription(subscription);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSubscription(null);
  };

  const handleSubscriptionCancelled = () => {
    // Refresh subscription list after cancellation
    if (onRefresh) {
      onRefresh();
    }
  };

  // Handle renew subscription - Gọi API renewSubscription
  const handleRenewSubscription = async (subscription) => {
    setRenewingId(subscription.subscription_id);
    try {
      const res = await paymentService.renewSubscription({
        subscription_id: subscription.subscription_id
      });
      
      if (res?.paymentUrl) {
        // Redirect to VNPAY
        window.location.href = res.paymentUrl;
      } else {
        toast.error('Renewal failed');
      }
    } catch (error) {
      console.error('Error renewing subscription:', error);
      toast.error('Error renewing subscription');
    } finally {
      setRenewingId(null);
    }
  };

  // Handle renew subscription directly (không qua VNPAY) - Gọi API renewSubscriptionDirect
  const handleRenewSubscriptionDirect = async (subscription) => {
    setRenewingDirectId(subscription.subscription_id);
    try {
      const res = await paymentService.renewSubscriptionDirect({
        subscription_id: subscription.subscription_id
      });
      
      // Success - API trả về data object với payment info
      if (res && !res.error) {
        // Success - show toast and reload page
        toast.success('Subscription renewed successfully!');
        // Reload page after 1s
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast.error(res?.message || 'Renewal failed');
      }
    } catch (error) {
      console.error('Error renewing subscription directly:', error);
      toast.error(error.response?.data?.message || 'Error renewing subscription');
    } finally {
      setRenewingDirectId(null);
    }
  };

  // Calculate days remaining
  const getDaysRemaining = (endDate) => {
    if (!endDate) return 0;
    const end = new Date(endDate);
    const today = new Date();
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  // Calculate remaining distance
  const getRemainingDistance = (baseDistance, traveled) => {
    return Math.max(0, (baseDistance || 0) - (traveled || 0));
  };

  // Calculate remaining swaps
  const getRemainingSwaps = (totalSwaps, used) => {
    return Math.max(0, (totalSwaps || 0) - (used || 0));
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const statusConfig = {
      active: {
        bg: 'bg-green-100 dark:bg-green-900',
        text: 'text-green-800 dark:text-green-300',
      },
      expired: {
        bg: 'bg-red-100 dark:bg-red-900',
        text: 'text-red-800 dark:text-red-300',
      },
      cancelled: {
        bg: 'bg-red-100 dark:bg-red-900',
        text: 'text-red-800 dark:text-red-300',
      }
    };

    const config = statusConfig[status?.toLowerCase()] || statusConfig.active;

    return (
      <span className={`inline-flex items-center rounded-full ${config.bg} px-2.5 py-1 text-xs font-medium ${config.text}`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    );
  };

  if (!subscriptions || subscriptions.length === 0) {
    return (
      <div className="bg-white border border-dashed border-gray-200 rounded-lg p-6 text-center">
        <p className="text-gray-600">You don't have any active packages.</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {subscriptions.map((subscription, i) => {
          const pkg = subscription.package;
          const vehicle = subscription.vehicle;
          const daysRemaining = getDaysRemaining(subscription.end_date);
          const remainingDistance = getRemainingDistance(pkg?.base_distance, subscription.distance_traveled);
          const remainingSwaps = getRemainingSwaps(pkg?.swap_count, subscription.swap_used);
          
          // Calculate percentages for progress bars (remaining, not used)
          const distanceRemainingPercentage = pkg?.base_distance 
            ? (remainingDistance / pkg.base_distance) * 100 
            : 0;
          const swapRemainingPercentage = pkg?.swap_count 
            ? (remainingSwaps / pkg.swap_count) * 100 
            : 0;

          return (
            <div 
              key={subscription.subscription_id || i} 
              className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                {/* Left Section - Package Info */}
                <div className="flex-1 space-y-4">
                  {/* Header */}
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {pkg?.name || subscription.name || 'Subscription'}
                    </h3>
                    {getStatusBadge(subscription.status)}
                  </div>
                  
                  {/* Description */}
                  <p className="text-sm text-gray-600">
                    {pkg?.description || subscription.description || 'No description available'}
                  </p>

                  {/* Key Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                    {/* Linked Vehicle */}
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Car className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-1">Linked Vehicle</p>
                        <p className="text-sm font-semibold text-gray-800">
                          {vehicle 
                            ? `${vehicle.vin || 'N/A'}`
                            : 'No vehicle assigned'
                          }
                        </p>
                      </div>
                    </div>

                    {/* Days Remaining */}
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Calendar className="w-5 h-5 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-1">Days Remaining</p>
                        <p className="text-sm font-semibold text-gray-800">
                          {daysRemaining} days
                        </p>
                      </div>
                    </div>

                    {/* Distance Remaining with Progress Bar */}
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <MapPin className="w-5 h-5 text-blue-700" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-baseline justify-between mb-2">
                          <p className="text-xs text-gray-500">Distance Remaining</p>
                          <p className="text-xs text-gray-600 font-medium">
                            {remainingDistance} / {pkg?.base_distance || 0} km
                          </p>
                        </div>
                        <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              distanceRemainingPercentage < 10 
                                ? 'bg-red-500' 
                                : distanceRemainingPercentage < 30 
                                ? 'bg-yellow-500' 
                                : 'bg-blue-500'
                            }`}
                            style={{ width: `${Math.min(distanceRemainingPercentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Swaps Remaining with Progress Bar */}
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Zap className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-baseline justify-between mb-2">
                          <p className="text-xs text-gray-500">Swaps Remaining</p>
                          <p className="text-xs text-gray-600 font-medium">
                            {remainingSwaps} / {pkg?.swap_count || 0}
                          </p>
                        </div>
                        <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              swapRemainingPercentage < 10 
                                ? 'bg-red-500' 
                                : swapRemainingPercentage < 30 
                                ? 'bg-yellow-500' 
                                : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(swapRemainingPercentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Section - Action Button */}
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={() => handleViewDetails(subscription)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 whitespace-nowrap"
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </Button>
                {/* Renewal Buttons */}
                  {subscription.status === 'expired' && (
                    <div className="flex flex-col gap-2 w-full">
                      <Button
                        onClick={() => handleRenewSubscription(subscription)}
                        disabled={renewingId === subscription.subscription_id || renewingDirectId === subscription.subscription_id}
                        variant="default"
                        size="sm"
                        className="flex items-center gap-2 whitespace-nowrap bg-blue-700 hover:bg-blue-700"
                      >
                        <RefreshCcw className="w-4 h-4" />
                        {renewingId === subscription.subscription_id ? 'Renewing...' : 'Renew (VNPAY)'}
                      </Button>
                      <Button
                        onClick={() => handleRenewSubscriptionDirect(subscription)}
                        disabled={renewingDirectId === subscription.subscription_id || renewingId === subscription.subscription_id}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2 whitespace-nowrap"
                      >
                        <RefreshCcw className="w-4 h-4" />
                        {renewingDirectId === subscription.subscription_id ? 'Renewing...' : 'Renew Direct'}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      <SubscriptionDetailModal
        subscription={selectedSubscription}
        open={isModalOpen}
        onClose={handleCloseModal}
        onSubscriptionCancelled={handleSubscriptionCancelled}
      />
    </>
  )
}
