import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../../hooks/useContext";
import { useState, useEffect } from "react";
import Navigation from "../../components/layout/Navigation";

// Validation schema using Zod
const loginSchema = z.object({
  emailOrPhone: z
    .string()
    .min(1, "Please enter email or phone number")
    .refine(
      (value) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^(?:\+84|0)(?:3[2-9]|5[25689]|7[06-9]|8[1-9]|9[0-46-9])[0-9]{7}$/;
        return emailRegex.test(value) || phoneRegex.test(value);
      },
      { message: "Please enter a valid email or phone number" }
    ),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function Login() {
  const { login, loading, error, clearError, redirectToGoogleLogin } = useAuth();
  const [success, setSuccess] = useState(false);
  const [localError, setLocalError] = useState(null);


  // Clear error on mount
  useEffect(() => {
    clearError();
    setLocalError(null);
    // Ensure the login page is scrolled to top when opened (fixes redirect landing at bottom)
    if (typeof window !== "undefined" && window.scrollTo) {
      window.scrollTo(0, 0);
    }
  }, [clearError]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const handleLogin = async (data) => {
    clearError(); // Clear error trước khi submit
    setSuccess(false);

    try {
      const user = await login(data);
      if (user) {
        setSuccess(true);
      }
    } catch {
      // Errors are set in AuthContext (error state). No need to log here.
    }
  };

  // Google OAuth login handler - disabled until Google Cloud Console is configured
  const handleGoogleLogin = async () => {
    clearError();
    setSuccess(false);

    try {
      const user = await redirectToGoogleLogin();
      if (user) {
        setSuccess(true);
      }
    } catch {
      // Errors are set in AuthContext (error state). No need to log here.
    }
  };

  return (
    <div>
      <Navigation />
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Human Power</h2>
            <p className="text-sm text-gray-600 mb-8">
              Sign in to your account
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6 text-center">Sign In</h3>

            <form onSubmit={handleSubmit(handleLogin)} className="space-y-6">
              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email or Phone</label>
                <input
                  type="text"
                  {...register("emailOrPhone")}
                  disabled={loading}
                  placeholder="Enter email or phone number"
                  className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50"
                />
                {errors.emailOrPhone && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.emailOrPhone.message}
                  </p>
                )}
              </div>

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <Link 
                    to="/forget-password" 
                    className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <input
                  type="password"
                  {...register("password")}
                  disabled={loading}
                  placeholder="Enter password"
                  className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50"
                />
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {success && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-600">Signed in successfully!</p>
                </div>
              )}

              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || success}
                className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-colors ${loading || success
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-200"
                  }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                    Signing in...
                  </span>
                ) : success ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="w-5 h-5 mr-2"
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
                    Signed in successfully!
                  </span>
                ) : (
                  "🔑 Sign In"
                )}
              </button>
            </form>

            <div className="text-center mt-6">
              <button
                onClick={() => redirectToGoogleLogin()}
                disabled={loading || success}
                className="w-full py-3 px-4 rounded-lg font-semibold bg-red-500 hover:bg-red-600 text-white"
              >
                Sign in with Google
              </button>
            </div>


            <div className="text-center mt-6">
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <Link to="/register" className="text-blue-600 hover:underline">
                  Register now
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}