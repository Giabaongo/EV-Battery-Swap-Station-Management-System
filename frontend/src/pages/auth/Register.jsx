import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../../hooks/useContext";
import { useState, useEffect } from "react";
import Navigation from "../../components/layout/Navigation";

const registerSchema = z
  .object({
    username: z.string().nonempty("Username is required").min(3, "Username must be at least 3 characters"),
    email: z
      .string()
      .nonempty("Email is required")
      .refine((value) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value);
      }, {
        message: "Please enter a valid email address",
      }),
    phone: z
      .string()
      .nonempty("Phone number is required")
      .min(10, "Invalid phone number")
      .refine((value) => {
        const phoneRegex = /^0(3|5|7|8|9)\d{8}$/;
        return phoneRegex.test(value);
      }, {
        message: "Please enter a valid phone number",
      }),
    password: z.string().nonempty("Please enter a password").min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password confirmation does not match",
    path: ["confirmPassword"],
  });

export default function Register() {
  const { register: registerUser, loading, error, clearError } = useAuth();
  const [success, setSuccess] = useState(false);
  const [localError, setLocalError] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

  // Clear error on mount
  useEffect(() => {
    clearError();
    setLocalError(null);
  }, [clearError]);

  const handleRegister = async (data) => {
    clearError();
    setLocalError(null);
    setSuccess(false);

    try {
      // Remove confirmPassword before sending
      const { confirmPassword, ...registerData } = data;
      const res = await registerUser(registerData);
      if (res) {
        setSuccess(true);
      }
    } catch (err) {
      // Errors are set in AuthContext (error state). Mirror it locally if needed.
      const errorMessage = err?.message || error || "Registration failed. Please try again.";
      setLocalError(errorMessage);
    }
  };

  // Hiển thị error từ context hoặc local error
  const displayError = localError || error;

  return (
    <div>
      <Navigation />
      <div className="relative min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div
          className="absolute inset-0 bg-center bg-cover blur-md scale-105"
          style={{ backgroundImage: "url('/images/login_register_bg.jpg')" }}
        ></div>

        <div className="absolute inset-0 bg-white/40 backdrop-blur-md"></div>

        <div className="relative max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Human Power</h2>
            <p className="text-sm text-gray-600 mb-8">
              Create a new account to get started
            </p>
          </div>

          <form onSubmit={handleSubmit(handleRegister)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
              <input
                {...register("username")}
                disabled={loading}
                className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50"
                placeholder="Username"
              />
              {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                {...register("email")}
                disabled={loading}
                className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50"
                placeholder="Email"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone number</label>
              <input
                {...register("phone")}
                disabled={loading}
                className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50"
                placeholder="Phone number"
              />
              {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                {...register("password")}
                disabled={loading}
                className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50"
                placeholder="Password"
              />
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm password</label>
              <input
                type="password"
                {...register("confirmPassword")}
                disabled={loading}
                className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50"
                placeholder="Re-enter password"
              />
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Error Message */}
            {displayError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{displayError}</p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-600">Registration successful! Redirecting to the login page...</p>
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
                  Registering...
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
                  Registration successful!
                </span>
              ) : (
                "Register"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}