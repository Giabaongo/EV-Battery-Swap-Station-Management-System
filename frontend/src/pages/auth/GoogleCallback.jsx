import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useContext';
import { authService } from '../../services/authService';

export default function GoogleCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { setUser, setToken } = useAuth();
    const [status, setStatus] = useState('processing');

    useEffect(() => {
        const processGoogleCallback = async () => {
            try {
                const token = searchParams.get('token');

                if (!token) {
                    console.error('No token received from Google callback');
                    setStatus('error');
                    setTimeout(() => navigate('/login?error=google_auth_failed'), 2000);
                    return;
                }

                // Save token to localStorage
                localStorage.setItem('token', token);

                // Decode JWT to get user info
                try {
                    const tokenPayload = JSON.parse(atob(token.split('.')[1]));
                    console.log('Decoded Google login token:', tokenPayload);

                    const userData = {
                        id: tokenPayload.sub,
                        name: tokenPayload.username,
                        email: tokenPayload.email,
                        phone: tokenPayload.phone,
                        role: tokenPayload.role,
                        station_id: null // Will be fetched from profile if needed
                    };

                    // Fetch station_id from profile API if not in token (for staff users)
                    if (userData.id) {
                        try {
                            const profileResponse = await authService.getProfile(userData.id);
                            if (profileResponse?.station_id) {
                                userData.station_id = profileResponse.station_id;
                                console.log('Fetched station_id from profile:', userData.station_id);
                            }
                        } catch (profileError) {
                            console.error('Failed to fetch profile for station_id:', profileError);
                            // Continue without station_id - it's optional
                        }
                    }

                    // Save user to localStorage
                    localStorage.setItem('user', JSON.stringify(userData));

                    // Update Auth context
                    if (setUser) setUser(userData);
                    if (setToken) setToken(token);

                    // Dispatch event to notify other contexts (StationContext, etc.)
                    window.dispatchEvent(new CustomEvent('userLoggedIn', { detail: userData }));

                    setStatus('success');

                    // Navigate based on role
                    setTimeout(() => {
                        if (userData.role === 'admin') {
                            navigate('/admin');
                        } else if (userData.role === 'station_staff') {
                            navigate('/staff');
                        } else {
                            navigate('/driver');
                        }
                    }, 1000);

                } catch (decodeError) {
                    console.error('Failed to decode token:', decodeError);
                    setStatus('error');
                    setTimeout(() => navigate('/login?error=invalid_token'), 2000);
                }

            } catch (error) {
                console.error('Google callback processing error:', error);
                setStatus('error');
                setTimeout(() => navigate('/login?error=google_auth_failed'), 2000);
            }
        };

        processGoogleCallback();
    }, [searchParams, navigate, setUser, setToken]);

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                {status === 'processing' && (
                    <>
                        <div className="mb-4">
                            <svg
                                className="animate-spin h-12 w-12 mx-auto text-blue-600"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                ></circle>
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            Processing Google Login
                        </h2>
                        <p className="text-gray-600">Please wait...</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="mb-4">
                            <svg
                                className="h-12 w-12 mx-auto text-green-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            Login Successful!
                        </h2>
                        <p className="text-gray-600">Redirecting...</p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="mb-4">
                            <svg
                                className="h-12 w-12 mx-auto text-red-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            Login Failed
                        </h2>
                        <p className="text-gray-600">Redirecting to login page...</p>
                    </>
                )}
            </div>
        </div>
    );
}
