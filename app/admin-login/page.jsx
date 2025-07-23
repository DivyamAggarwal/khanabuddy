"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { logAdminLogin } from "../../lib/adminAuth"; // Import the logging function

export default function AdminLogin() {
  const [credentials, setCredentials] = useState({
    username: "",     // Autofilled
    password: "",       // Autofilled
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Simple authentication - check credentials
    if (
      credentials.username === "admin" &&
      credentials.password === "adminqw"
    ) {
      try {
        // Log the successful admin login to Supabase
        console.log("Logging admin login...");
        const loginResult = await logAdminLogin();
        
        if (loginResult.success) {
          console.log("Admin login logged successfully:", loginResult.data);
        } else {
          console.error("Failed to log admin login:", loginResult.error);
          // Still proceed with login even if logging fails
        }
        
        // Redirect to admin dashboard
        router.push("/admin-dashboard");
        
      } catch (error) {
        console.error("Error during login process:", error);
        // Still redirect even if logging fails - don't block admin access
        router.push("/admin-dashboard");
      }
    } else {
      setError("Invalid credentials. Please try again.");
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25px 25px, #FF6B35 2px, transparent 0), 
                           radial-gradient(circle at 75px 75px, #FF6B35 1px, transparent 0)`,
          backgroundSize: '100px 100px'
        }}></div>
      </div>

      {/* Main Card */}
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-8 w-full max-w-md border border-orange-100 relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            <span className="text-orange-600">KhanaBuddy</span> Admin
          </h1>
          <p className="text-gray-600 font-medium">Restaurant Order Management</p>
          <div className="w-16 h-1 bg-gradient-to-r from-orange-400 to-orange-500 mx-auto mt-3 rounded-full"></div>
        </div>

        

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username Field */}
          <div className="relative">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Username
            </label>
            <div className="relative">
              <input
                type="text"
                name="username"
                value={credentials.username}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 pl-11 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-gray-800 placeholder-gray-400"
                placeholder="Enter admin username"
              />
              <svg
                className="absolute left-3 top-3.5 w-5 h-5 text-orange-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>

          {/* Password Field */}
          <div className="relative">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={credentials.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 pl-11 pr-11 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-gray-800 placeholder-gray-400"
                placeholder="Enter admin password"
              />
              <svg
                className="absolute left-3 top-3.5 w-5 h-5 text-orange-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-gray-400 hover:text-orange-600 transition-colors"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L12 12m-2.122-2.122L7.757 7.757m13.067-.069a9.968 9.968 0 01-.924 4.484M21 12a9 9 0 01-1.436 4.898" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.764 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin w-5 h-5"
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
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Signing in...
              </>
            ) : (
              <>
                <span>Access Dashboard</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </button>
        </form>

        {/* Dashboard Preview */}
        {/* <div className="mt-6 text-center">
          <div className="inline-flex items-center space-x-4 bg-orange-50 rounded-xl px-4 py-2 border border-orange-100">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-orange-700 text-sm font-medium">Dashboard Ready</span>
            </div>
            <div className="text-orange-400">•</div>
            <div className="text-orange-700 text-sm font-medium">Real-time Sync</div>
          </div>
        </div> */}

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <button
            onClick={() => router.push("/")}
            className="text-orange-600 hover:text-orange-800 text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2 mx-auto group"
          >
            <svg
              className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to KhanaBuddy
          </button>
        </div>
      </div>
    </div>
  );
}
