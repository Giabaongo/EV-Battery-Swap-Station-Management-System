import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { authService } from '../../services/authService';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');
  const hasVerifiedRef = useRef(false); // Use ref to persist across renders

  useEffect(() => {
    const verifyEmail = async () => {
      // Prevent running twice in strict mode or on re-renders
      if (hasVerifiedRef.current) {
        console.log('⚠️ Already verified, skipping...');
        return;
      }

      const token = searchParams.get('token');
      
      console.log('🔍 Verifying email with token:', token);

      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link. Please check your email and try again.');
        return;
      }

      hasVerifiedRef.current = true; // Mark as verified attempt (will persist across renders)

      try {
        // Call backend API to verify email
        console.log('📤 Sending verify request to backend...');
        const response = await authService.verifyEmail(token);
        
        console.log('Verify email response:', response);

        // Backend returns { message: '...', user: {...} } on success
        if (response && response.message) {
          setStatus('success');
          setMessage(response.message || 'Your account is now active. You can proceed to log in and set up your EV profile.');
        } else {
          setStatus('error');
          setMessage('Verification failed. Please try again or contact support.');
        }
      } catch (error) {
        console.error('Email verification error:', error);
        console.error('Error response:', error.response);
        console.error('Error data:', error.response?.data);
        
        setStatus('error');
        setMessage(
          error.response?.data?.message ||
          error.message ||
          'An error occurred during verification. Please try again later.'
        );
      }
    };

    verifyEmail();
  }, [searchParams]); // Remove hasVerified from dependencies

  const handleContinue = () => {
    navigate('/login');
  };

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col bg-background-light dark:bg-background-dark overflow-x-hidden">
      <div className="flex flex-1 justify-center items-center p-4">
        <div className="flex flex-col max-w-md w-full bg-white dark:bg-slate-900 dark:border dark:border-slate-800 rounded-xl shadow-lg p-8 text-center items-center">

          {/* Icon */}
          <div className={`flex justify-center items-center mb-6 h-16 w-16 rounded-full ${status === 'loading'
              ? 'bg-blue-100 dark:bg-blue-900/30'
              : status === 'success'
                ? 'bg-green-100 dark:bg-green-900/30'
                : 'bg-red-100 dark:bg-red-900/30'
            }`}>
            {status === 'loading' && (
              <Loader2 className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            )}
            {status === 'error' && (
              <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            )}
          </div>

          {/* Content */}
          <div className="flex flex-col w-full">
            <h1 className="text-slate-900 dark:text-slate-50 tracking-tight text-[32px] font-bold leading-tight pb-3">
              {status === 'loading' && 'Verifying Email...'}
              {status === 'success' && 'Email Verified!'}
              {status === 'error' && 'Verification Failed'}
            </h1>

            <p className="text-slate-600 dark:text-slate-400 text-base font-normal leading-normal pb-6">
              {status === 'loading' && 'Please wait while we verify your email address.'}
              {status === 'success' && message}
              {status === 'error' && message}
            </p>

            {/* Button - Only show when not loading */}
            {status !== 'loading' && (
              <div className="flex w-full">
                <Button
                  onClick={handleContinue}
                  className="w-full h-12 text-base font-bold"
                  disabled={status === 'loading'}
                >
                  {status === 'success' ? 'Continue to Login' : 'Back to Home'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}