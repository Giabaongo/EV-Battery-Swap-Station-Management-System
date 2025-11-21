import React, { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import { CheckCircle, XCircle, Loader, AlertCircle } from 'lucide-react';
import { subscriptionService } from '../../services/subscriptionService';
import { useAuth } from '../../hooks/useContext';

// Helper to format currency
const formatPrice = (price) => {
  if (!price && price !== 0) return 'N/A';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price);
};

// Component for individual package details
const PackageDetail = ({ label, value }) => (
  <div className="flex flex-col gap-1 border border-solid border-gray-200 dark:border-gray-700/50 rounded-lg p-4">
    <p className="text-gray-500 dark:text-gray-400 text-sm font-normal leading-normal">{label}</p>
    <p className="text-[#0d141b] dark:text-white text-base font-semibold leading-normal">{value}</p>
  </div>
);

export default function Payment() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [error, setError] = useState(null);

  // Determine if payment was successful based on URL path
  const isSuccess = location.pathname.includes('/success');
  const isFailed = location.pathname.includes('/failed');

  // Get error code if payment failed
  const errorCode = searchParams.get('code');

  // Map VNPAY error codes to user-friendly messages
  const getErrorMessage = (code) => {
    const errorMessages = {
      '07': 'Transaction denied due to suspicious activity. Please contact your bank.',
      '09': 'Card not registered for internet banking. Please register or use another card.',
      '10': 'Incorrect OTP authentication. Please try again.',
      '11': 'Payment timeout. Please try again.',
      '12': 'Card is locked. Please contact your bank.',
      '13': 'Invalid OTP. Please verify and try again.',
      '24': 'Transaction cancelled by user.',
      '51': 'Insufficient balance. Please check your account.',
      '65': 'Transaction limit exceeded. Please contact your bank.',
      '75': 'Your bank is under maintenance. Please try again later.',
      '79': 'Payment verification error. Please try again.',
      'default': 'Payment processing failed. Please try again or contact support.'
    };
    return errorMessages[code] || errorMessages['default'];
  };

  useEffect(() => {
    const fetchSubscriptionData = async () => {
      // If payment failed, don't try to fetch subscription
      if (isFailed) {
        setError(getErrorMessage(errorCode));
        setLoading(false);
        return;
      }

      if (!user?.id) {
        setError("User not authenticated. Please log in.");
        setLoading(false);
        return;
      }

      const subscriptionId = searchParams.get('subscription_id');

      if (!subscriptionId) {
        setError("No subscription ID found in URL.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log("Fetching subscription with ID:", subscriptionId);
        
        // Fetch subscription details from backend
        const result = await subscriptionService.getSubscriptionById(subscriptionId);
        
        console.log("Subscription data:", result);
        setSubscription(result);

      } catch (err) {
        console.error("Failed to fetch subscription:", err);
        const errorMessage = err.response?.data?.message || err.message || "An unknown error occurred.";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionData();
  }, [user?.id, searchParams, isFailed, errorCode]);

  // Loading State
  if (loading) {
    return (
      <div className="flex flex-1 justify-center items-center min-h-screen bg-background-light dark:bg-background-dark">
        <div className="text-center">
          <Loader className="animate-spin h-12 w-12 text-primary mx-auto" />
          <h2 className="mt-4 text-xl font-semibold text-[#0d141b] dark:text-white">Loading subscription details...</h2>
          <p className="text-gray-600 dark:text-gray-400">Please wait while we fetch your information.</p>
        </div>
      </div>
    );
  }

  const pkg = subscription?.package;
  const vehicle = subscription?.vehicle;

  // Main content based on success or failure
  return (
    <main className="flex flex-1 justify-center py-10 px-4 sm:px-6 lg:px-8 bg-background-light dark:bg-background-dark min-h-screen">
      <div className="w-full max-w-3xl">
        <div className="w-full bg-white dark:bg-background-dark/60 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700/50 p-6 md:p-10">
          <div className="flex flex-col items-center text-center">
            {isSuccess ? (
              <>
                <div className="flex items-center justify-center size-16 rounded-full bg-green-100 dark:bg-green-900/50 mb-4">
                  <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                </div>
                <h1 className="text-[#0d141b] dark:text-white tracking-tight text-3xl font-bold leading-tight pb-2">Subscription Activated!</h1>
                <p className="text-gray-600 dark:text-gray-400 text-base font-normal leading-normal pb-8 max-w-md">
                  Your payment was processed successfully and your new plan is now active. You can find the details of your subscription below.
                </p>
              </>
            ) : (
              <>
                <div className="flex items-center justify-center size-16 rounded-full bg-red-100 dark:bg-red-900/50 mb-4">
                  <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
                </div>
                <h1 className="text-[#0d141b] dark:text-white tracking-tight text-3xl font-bold leading-tight pb-2">Payment Failed</h1>
                <p className="text-gray-600 dark:text-gray-400 text-base font-normal leading-normal pb-4 max-w-md">
                  {error || "Unfortunately, we were unable to process your payment. Please try again."}
                </p>
                {errorCode && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mb-8">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    <p className="text-sm text-red-700 dark:text-red-300">Error Code: {errorCode}</p>
                  </div>
                )}
              </>
            )}
          </div>

          {isSuccess && subscription && (
            <>
              <div className="border-t border-b border-gray-200 dark:border-gray-700/50 py-6 my-4">
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                  <div className="flex flex-col gap-1">
                    <dt className="text-gray-500 dark:text-gray-400 text-sm font-medium">Package Name</dt>
                    <dd className="text-[#0d141b] dark:text-white text-base font-semibold">{pkg?.name || 'N/A'}</dd>
                  </div>
                  <div className="flex flex-col gap-1">
                    <dt className="text-gray-500 dark:text-gray-400 text-sm font-medium">Linked Vehicle</dt>
                    <dd className="text-[#0d141b] dark:text-white text-base font-semibold">{vehicle?.license_plate || 'N/A'}</dd>
                  </div>
                </dl>
              </div>

              <h3 className="text-lg font-bold text-[#0d141b] dark:text-white mb-4">Package Summary</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <PackageDetail label="Base Distance" value={`${pkg?.base_distance || 0} km`} />
                <PackageDetail label="Swap Count" value={`${pkg?.swap_count || 0} Swaps`} />
                <PackageDetail label="Duration" value={`${pkg?.duration_days || 0} Days`} />
                <PackageDetail label="Base Price" value={formatPrice(pkg?.base_price)} />
                <div className="col-span-1 sm:col-span-2">
                  <PackageDetail label="Penalty Fee (per extra swap)" value={formatPrice(pkg?.penalty_fee)} />
                </div>
              </div>
            </>
          )}

          {subscription?.subscription_id && (
            <div className="text-center pt-8">
              <p className="text-xs text-gray-500 dark:text-gray-500">Subscription ID: {subscription.subscription_id}</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-center items-center gap-3 pt-8">
            {isFailed ? (
              // Buttons for failed payment
              <>
                <Link to="/driver/plans" className="flex w-full sm:w-auto min-w-[200px] max-w-[300px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-primary hover:bg-primary/90 text-white text-base font-bold leading-normal tracking-[0.015em]">
                  <span className="truncate">Try Again</span>
                </Link>
                <Link to="/driver" className="flex w-full sm:w-auto min-w-[200px] max-w-[300px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-gray-200 dark:bg-gray-700/50 text-[#0d141b] dark:text-gray-200 dark:hover:bg-gray-700 hover:bg-gray-300 text-base font-bold leading-normal tracking-[0.015em]">
                  <span className="truncate">Return to Dashboard</span>
                </Link>
              </>
            ) : (
              // Buttons for successful payment
              <>
                <Link to="/driver/swap-history" className="flex w-full sm:w-auto min-w-[200px] max-w-[300px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-gray-200 dark:bg-gray-700/50 text-[#0d141b] dark:text-gray-200 dark:hover:bg-gray-700 hover:bg-gray-300 text-base font-bold leading-normal tracking-[0.015em]">
                  <span className="truncate">View Transaction History</span>
                </Link>
                <Link to="/driver" className="flex w-full sm:w-auto min-w-[200px] max-w-[300px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-primary hover:bg-primary/90 text-white text-base font-bold leading-normal tracking-[0.015em]">
                  <span className="truncate">Return to Dashboard</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
