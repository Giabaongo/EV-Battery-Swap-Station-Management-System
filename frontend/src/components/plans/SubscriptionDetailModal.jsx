import React, { useState } from 'react';
import { X, Info, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { subscriptionService } from '../../services/subscriptionService';
import { paymentService } from '../../services/paymentService';

// Helper function to format currency
const formatPrice = (price) => {
  if (!price && price !== 0) return 'N/A';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price);
};

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Component for progress bar
const ProgressBar = ({ label, current, total, percentage }) => (
  <div className="flex flex-col gap-1.5">
    <div className="flex items-baseline justify-between gap-4">
      <p className="text-slate-800 dark:text-slate-200 text-sm font-medium leading-normal">{label}</p>
      <p className="text-slate-600 dark:text-slate-300 text-xs font-normal leading-normal">
        {current}/{total} km
      </p>
    </div>
    <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700">
      <div 
        className="h-2 rounded-full bg-primary transition-all duration-300" 
        style={{ width: `${Math.min(percentage, 100)}%` }}
      />
    </div>
  </div>
);

// Component for detail row
const DetailRow = ({ label, value, tooltip, highlight }) => (
  <div className="flex flex-col gap-0.5 border-t border-solid border-slate-200 py-3 dark:border-slate-800">
    <p className="text-slate-500 dark:text-slate-400 text-xs font-normal leading-normal flex items-center gap-1.5">
      {label}
      {tooltip && (
        <span className="group relative">
          <Info className="w-3 h-3 text-slate-400 dark:text-slate-500 cursor-help" />
          <span className="invisible group-hover:visible absolute left-0 top-5 z-10 w-40 rounded-md bg-slate-900 px-2 py-1 text-xs text-white shadow-lg">
            {tooltip}
          </span>
        </span>
      )}
    </p>
    <p className={`text-xs font-semibold leading-normal ${
      highlight ? 'text-amber-600 dark:text-amber-500' : 'text-slate-800 dark:text-slate-200'
    }`}>
      {value}
    </p>
  </div>
);

export default function SubscriptionDetailModal({ subscription, open, onClose, onSubscriptionCancelled }) {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [renewing, setRenewing] = useState(false);
  const [renewingDirect, setRenewingDirect] = useState(false);
  const [payingPenalty, setPayingPenalty] = useState(false);

  if (!subscription) return null;

  const pkg = subscription.package;
  const vehicle = subscription.vehicle;

  // Calculate percentages
  const swapPercentage = pkg?.swap_count 
    ? (subscription.swap_used / pkg.swap_count) * 100 
    : 0;
  
  const distancePercentage = pkg?.base_distance 
    ? (subscription.distance_traveled / pkg.base_distance) * 100 
    : 0;

  // Determine status badge color
  const getStatusBadge = (status) => {
    const statusConfig = {
      active: {
        bg: 'bg-green-100 dark:bg-green-900',
        text: 'text-green-800 dark:text-green-300',
        dot: 'bg-green-500'
      },
      expired: {
        bg: 'bg-red-100 dark:bg-red-900',
        text: 'text-red-800 dark:text-red-300',
        dot: 'bg-red-500'
      },
      cancelled: {
        bg: 'bg-red-100 dark:bg-red-900',
        text: 'text-red-800 dark:text-red-300',
        dot: 'bg-red-500'
      }
    };

    const config = statusConfig[status?.toLowerCase()] || statusConfig.active;

    return (
      <span className={`inline-flex items-center rounded-full ${config.bg} px-2.5 py-0.5 text-xs font-medium ${config.text}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot} mr-1.5`}></span>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    );
  };

  // Handle cancel subscription
  const handleCancelSubscription = async () => {
    setCancelling(true);
    try {
      await subscriptionService.cancelSubscription(subscription.subscription_id);
      
      // Close confirmation dialog
      setShowCancelConfirm(false);
      
      // Show success message
      toast.success('Subscription cancelled successfully');
      
      // Notify parent to refresh data
      if (onSubscriptionCancelled) {
        onSubscriptionCancelled();
      }
      
      // Close main modal
      onClose();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel subscription. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  // Handle renew subscription - Gọi API renewSubscription
  const handleRenewSubscription = async () => {
    setRenewing(true);
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
      setRenewing(false);
    }
  };

  // Handle pay penalty fee only - Gọi API payPenaltyOnly
  const handlePayPenalty = async () => {
    setPayingPenalty(true);
    try {
      const res = await paymentService.payPenaltyOnly({
        subscription_id: subscription.subscription_id
      });
      
      // Success - API trả về data object với payment info
      if (res?.success) {
        // Success - show toast and reload page
        toast.success(`Penalty fee paid successfully: ${res?.penaltyAmount || 'N/A'} VND`);
        // Close modal
        onClose();
        // Reload page after 1s
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast.error(res?.message || 'Payment failed');
      }
    } catch (error) {
      console.error('Error paying penalty fee:', error);
      toast.error(error.response?.data?.message || 'Error paying penalty fee');
    } finally {
      setPayingPenalty(false);
    }
  };

  // Handle renew subscription directly (không qua VNPAY) - Gọi API renewSubscriptionDirect
  const handleRenewSubscriptionDirect = async () => {
    setRenewingDirect(true);
    try {
      const res = await paymentService.renewSubscriptionDirect({
        subscription_id: subscription.subscription_id
      });
      
      // Success - API trả về data object với payment info
      if (res && !res.error) {
        // Success - show toast and reload page
        toast.success('Subscription renewed successfully!');
        // Close modal
        onClose();
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
      setRenewingDirect(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-2">
              <DialogTitle className="text-primary text-xl font-bold leading-tight tracking-tight">
                {pkg?.name || 'Subscription Plan'}
              </DialogTitle>
              <div className="flex items-center gap-2">
                <p className="text-slate-500 dark:text-slate-400 text-xs font-normal leading-normal">Status:</p>
                {getStatusBadge(subscription.status)}
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex flex-col gap-4 py-2">
          {/* Vehicle Information (if available) */}
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">Linked Vehicle</p>
            {vehicle ? (
              <>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {vehicle.brand} {vehicle.model}
                </p>
                <div className="flex items-center gap-3 mt-1.5 text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">License: </span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{vehicle.license_plate}</span>
                  </div>
                  {vehicle.vin && (
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">VIN: </span>
                      <span className="font-mono text-xs text-slate-800 dark:text-slate-200">{vehicle.vin}</span>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <p className="text-xs text-slate-600 dark:text-slate-400">No vehicle assigned</p>
            )}
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 gap-x-3 gap-y-0 sm:grid-cols-2">
            <DetailRow 
              label="Start Date" 
              value={formatDate(subscription.start_date)} 
            />
            <DetailRow 
              label="End Date" 
              value={formatDate(subscription.end_date)} 
            />
            <DetailRow 
              label="Base Price" 
              value={formatPrice(pkg?.base_price)} 
            />
            {/* To-Do: Lay tu config ra */}
            {/* <DetailRow 
              label="Penalty Fee" 
              value={`${formatPrice(pkg?.penalty_fee)}`}
              tooltip="Fee for exceeding usage limits."
              highlight
            /> */}
            <DetailRow 
              label="Base Distance" 
              value={`${pkg?.base_distance || 0} km`} 
            />
            <DetailRow 
              label="Total Swaps" 
              value={`${pkg?.swap_count || 0} swaps`} 
            />
          </div>

          {/* Progress Bars */}
          <div className="flex flex-col gap-4 pt-2">
            {/* <ProgressBar 
              label="Swaps Used"
              current={subscription.swap_used || 0}
              total={pkg?.swap_count || 0}
              percentage={swapPercentage}
            /> */}
            <ProgressBar 
              label="Distance Traveled"
              current={subscription.distance_traveled || 0} 
              total={pkg?.base_distance || 0}
              percentage={distancePercentage}
            />
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="bg-slate-50 dark:bg-slate-900/50 -mx-6 -mb-6 px-4 py-3 rounded-b-lg sticky bottom-0">
          <div className="flex items-center justify-between w-full gap-3">
            {/* Cancel/Renew Buttons - Left side */}
            <div className="flex gap-2">
              {subscription.status === 'active' && (
                <Button 
                  variant="destructive"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => setShowCancelConfirm(true)}
                >
                  <AlertTriangle className="w-4 h-4" />
                  Cancel Subscription
                </Button>
              )}
              {subscription.status === 'pending_penalty_payment' && (
                <Button 
                  variant="default"
                  size="sm"
                  className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white"
                  onClick={handlePayPenalty}
                  disabled={payingPenalty}
                >
                  {payingPenalty ? 'Processing...' : 'Pay Penalty Fee'}
                </Button>
              )}
              {subscription.status === 'expired' && (
                <>
                  <Button 
                    variant="default"
                    size="sm"
                    className="flex items-center gap-2 bg-blue-700 hover:bg-blue-700 text-white"
                    onClick={handleRenewSubscription}
                    disabled={renewing || renewingDirect}
                  >
                    {renewing ? 'Renewing...' : 'Renew (VNPAY)'}
                  </Button>
                  <Button 
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={handleRenewSubscriptionDirect}
                    disabled={renewingDirect || renewing}
                  >
                    {renewingDirect ? 'Renewing...' : 'Renew Direct'}
                  </Button>
                </>
              )}
            </div>
            
            {/* Done Button - Right side */}
            <Button 
              onClick={onClose}
              size="sm"
              className="bg-primary hover:bg-primary/90 text-white"
            >
              Done
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Confirmation Dialog */}
    <Dialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
            <AlertTriangle className="w-5 h-5" />
            Cancel Subscription?
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p className="text-slate-700 dark:text-slate-300 text-sm mb-3">
            Are you sure you want to cancel this subscription?
          </p>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <p className="text-red-800 dark:text-red-200 text-xs font-medium mb-1">
              Important Notice:
            </p>
            <ul className="text-red-700 dark:text-red-300 text-xs space-y-1 list-disc list-inside">
              <li>Your subscription will be cancelled immediately</li>
              <li>You will lose access to all subscription benefits</li>
              <li>Unused swaps and distance will be forfeited</li>
              <li>This action cannot be undone</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowCancelConfirm(false)}
            disabled={cancelling}
          >
            Keep Subscription
          </Button>
          <Button 
            variant="destructive"
            onClick={handleCancelSubscription}
            disabled={cancelling}
          >
            {cancelling ? 'Cancelling...' : 'Yes, Cancel Subscription'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>
  );
}

