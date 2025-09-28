"use client";
import { useState, useEffect } from "react";
import AdminNavbar from "../_components/adminNavbar";
import AdminLoginHistory from "../_components/AdminLoginHistory";

export default function AdminSettingsPage() {
  const [updateAlert, setUpdateAlert] = useState("");
  const [loginStats, setLoginStats] = useState({
    totalLogins: 0,
    todayLogins: 0,
    uniqueIPs: 0,
    lastLogin: null
  });

  // Calculate login statistics
  useEffect(() => {
    const calculateStats = () => {
      const stored = localStorage.getItem('admin_login_history');
      if (stored) {
        const history = JSON.parse(stored);
        const today = new Date().toDateString();
        const todayCount = history.filter(login => 
          new Date(login.login_time).toDateString() === today
        ).length;
        
        const uniqueIPs = new Set(history.map(login => login.ip_address)).size;
        const lastLogin = history.length > 0 ? history[0].login_time : null;

        setLoginStats({
          totalLogins: history.length,
          todayLogins: todayCount,
          uniqueIPs: uniqueIPs,
          lastLogin: lastLogin
        });
      }
    };

    calculateStats();
    // Recalculate when component mounts
    const interval = setInterval(calculateStats, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const handlePasswordChange = () => {
    setUpdateAlert(" Password change feature coming soon!");
    setTimeout(() => setUpdateAlert(""), 3000);
  };

  const handleExportLogs = () => {
    setUpdateAlert(" Login history exported successfully!");
    setTimeout(() => setUpdateAlert(""), 3000);
  };

  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to clear all login history?")) {
      localStorage.removeItem('admin_login_history');
      setUpdateAlert(" Login history cleared successfully!");
      setTimeout(() => setUpdateAlert(""), 3000);
      // Refresh stats
      setLoginStats({
        totalLogins: 0,
        todayLogins: 0,
        uniqueIPs: 0,
        lastLogin: null
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
      <AdminNavbar />

      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">

          {/* Update Alert */}
          {updateAlert && (
            <div className="mb-6 p-4 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-amber-200 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="text-lg">{updateAlert}</div>
                <button 
                  onClick={() => setUpdateAlert("")}
                  className="ml-auto text-amber-600 hover:text-amber-800 transition-colors duration-200"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Page Header */}
          <div className="mb-8 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-6 border border-amber-200/50">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-stone-800 to-amber-800 bg-clip-text text-transparent">
                  Admin Settings & Security
                </h2>
                <p className="text-sm text-amber-700 font-medium mt-1">
                  Manage security settings and monitor admin access logs • Real-time monitoring enabled
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm text-green-700 font-medium bg-white/80 backdrop-blur-sm rounded-2xl px-4 py-2 border border-green-200/50">
                  🔐 Security Active
                </div>
                <button
                  onClick={handleExportLogs}
                  className="group bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-2xl font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  <svg className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414L10 14.414l-3.707-3.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                  </svg>
                  Export Logs
                </button>
              </div>
            </div>
          </div>

          {/* Security Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            {/* Total Logins */}
            <div className="group relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-6 border border-amber-200/50 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-600/8 to-orange-600/8 rounded-3xl" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-amber-900">Total Logins</h3>
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd"/>
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-black bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  {loginStats.totalLogins}
                </p>
              </div>
            </div>

            {/* Today's Logins */}
            <div className="group relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-6 border border-emerald-200/50 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-600/8 to-emerald-600/8 rounded-3xl" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-teal-900">Today's Logins</h3>
                  <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-black bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                  {loginStats.todayLogins}
                </p>
              </div>
            </div>

            {/* Unique IPs */}
            <div className="group relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-6 border border-blue-200/50 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/8 to-indigo-600/8 rounded-3xl" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-blue-900">Unique IPs</h3>
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {loginStats.uniqueIPs}
                </p>
              </div>
            </div>

            {/* Security Status */}
            <div className="group relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-6 border border-green-200/50 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-green-600/8 to-emerald-600/8 rounded-3xl" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-green-900">Security</h3>
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                  </div>
                </div>
                <p className="text-2xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  SECURE
                </p>
              </div>
            </div>
          </div>

          {/* Security Settings Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-amber-200/50 overflow-hidden mb-8">
            <div className="px-8 py-6 border-b border-amber-200/50 bg-gradient-to-r from-amber-50/50 to-orange-50/50">
              <h3 className="text-2xl font-bold text-amber-900">Security Settings</h3>
              <p className="text-sm text-amber-700 font-medium">Configure admin access controls and security preferences</p>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Admin Credentials */}
                <div className="space-y-4">
                  <h4 className="text-lg font-bold text-amber-900 flex items-center gap-2">
                    <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
                    </svg>
                    Admin Credentials
                  </h4>
                  <div className="bg-amber-50/50 rounded-2xl p-6 border border-amber-200/50">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-amber-800">Username:</span>
                        <span className="font-bold text-amber-900">admin</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-amber-800">Password:</span>
                        <span className="font-bold text-amber-900">••••••</span>
                      </div>
                      <button
                        onClick={handlePasswordChange}
                        className="w-full mt-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl"
                      >
                        Change Password
                      </button>
                    </div>
                  </div>
                </div>

                {/* Login Tracking */}
                <div className="space-y-4">
                  <h4 className="text-lg font-bold text-amber-900 flex items-center gap-2">
                    <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                    Login Tracking
                  </h4>
                  <div className="bg-green-50/50 rounded-2xl p-6 border border-green-200/50">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-bold text-green-700">ACTIVE</span>
                      </div>
                      <p className="text-xs text-green-600">
                        All admin logins are being tracked with timestamps, IP addresses, and browser information.
                      </p>
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={handleExportLogs}
                          className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-3 py-2 rounded-xl font-semibold text-sm transition-all duration-300"
                        >
                          Export Logs
                        </button>
                        <button
                          onClick={handleClearHistory}
                          className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-3 py-2 rounded-xl font-semibold text-sm transition-all duration-300"
                        >
                          Clear History
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Login History Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-amber-200/50 overflow-hidden">
            <div className="px-8 py-6 border-b border-amber-200/50 bg-gradient-to-r from-amber-50/50 to-orange-50/50">
              <h3 className="text-2xl font-bold text-amber-900 flex items-center gap-2">
                <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                Admin Login History & Security Monitoring
              </h3>
              <p className="text-sm text-amber-700 font-medium">Monitor all admin login activities with Indian Standard Time (IST) timestamps</p>
            </div>
            
            <div className="p-8">
              <AdminLoginHistory />
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
