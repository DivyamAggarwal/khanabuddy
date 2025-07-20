"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminNavbar from "../../_components/adminNavbar";
import { getTodaysReport, clearAllDeliveredOrders } from "../../../lib/reportService";

// Format currency function
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);
};

export default function TodayReport() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    avgOrderValue: 0,
    orders: []
  });
  const [loading, setLoading] = useState(true);
  const [updateAlert, setUpdateAlert] = useState("");

  useEffect(() => {
    loadTodayData();
    
    // Refresh every 30 seconds to show new delivered orders
    const interval = setInterval(loadTodayData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadTodayData = async () => {
    setLoading(true);
    try {
      const result = await getTodaysReport();
      if (result.success) {
        setStats(result.data);
        console.log('✅ Loaded today\'s report:', result.data);
      } else {
        console.error('❌ Failed to load today\'s report:', result.error);
        setUpdateAlert("❌ Failed to load today's report data!");
        setTimeout(() => setUpdateAlert(""), 3000);
      }
    } catch (error) {
      console.error('Error loading today\'s data:', error);
      setUpdateAlert("❌ Error loading report data!");
      setTimeout(() => setUpdateAlert(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleClearData = async () => {
    if (confirm('Are you sure you want to clear all delivered orders? This action cannot be undone.')) {
      const result = await clearAllDeliveredOrders();
      if (result.success) {
        setUpdateAlert("✅ All delivered orders cleared successfully!");
        setTimeout(() => setUpdateAlert(""), 3000);
        loadTodayData(); // Refresh the data
      } else {
        setUpdateAlert("❌ Failed to clear delivered orders!");
        setTimeout(() => setUpdateAlert(""), 3000);
      }
    }
  };

  const formatTime = (t) =>
    new Date(t).toLocaleTimeString("en-US", { 
      hour: "2-digit", 
      minute: "2-digit", 
      hour12: true,
      timeZone: 'Asia/Kolkata'
    });

  const formatDate = (t) =>
    new Date(t).toLocaleDateString("en-US", { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      timeZone: 'Asia/Kolkata'
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-900 mx-auto mb-4"></div>
          <p className="text-amber-700 font-medium">Loading today's report...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
      <AdminNavbar />
      
      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {/* Update Alert */}
          {updateAlert && (
            <div className="mb-6 p-4 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-amber-200">
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
          
          {/* Header */}
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-amber-900">Today's Report</h1>
              <p className="text-amber-700 mt-2">{formatDate(new Date())}</p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={loadTodayData}
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-4 py-2 rounded-2xl font-semibold flex items-center gap-2 shadow-md hover:shadow-lg transition-all duration-300"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"/>
                </svg>
                Refresh
              </button>
              <button
                onClick={handleClearData}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-2xl font-semibold flex items-center gap-2 shadow-md hover:shadow-lg transition-all duration-300"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd"/>
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 012 0v6a1 1 0 11-2 0V7zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V7z" clipRule="evenodd"/>
                </svg>
                Clear Data
              </button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-6 border border-emerald-200/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-700">Total Delivered</p>
                  <p className="text-2xl font-bold text-emerald-900">{stats.totalOrders}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-6 border border-amber-200/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-700">Total Revenue</p>
                  <p className="text-2xl font-bold text-amber-900">{formatCurrency(stats.totalRevenue)}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-6 border border-teal-200/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-teal-700">Avg Order Value</p>
                  <p className="text-2xl font-bold text-teal-900">{formatCurrency(stats.avgOrderValue)}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Delivered Orders Table */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-emerald-200/50 overflow-hidden">
            <div className="px-8 py-6 border-b border-emerald-200/50 bg-gradient-to-r from-emerald-50/50 to-teal-50/50">
              <h3 className="text-2xl font-bold text-emerald-900">Delivered Orders</h3>
              <p className="text-sm text-emerald-700 font-medium">All orders completed today • Real-time sync from admin dashboard</p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-200/50">
                    <th className="px-8 py-4 text-left text-xs font-bold text-emerald-800 uppercase tracking-wider">Order ID</th>
                    <th className="px-8 py-4 text-left text-xs font-bold text-emerald-800 uppercase tracking-wider">Customer</th>
                    <th className="px-8 py-4 text-left text-xs font-bold text-emerald-800 uppercase tracking-wider">Items</th>
                    <th className="px-8 py-4 text-left text-xs font-bold text-emerald-800 uppercase tracking-wider">Total</th>
                    <th className="px-8 py-4 text-left text-xs font-bold text-emerald-800 uppercase tracking-wider">Order Time</th>
                    <th className="px-8 py-4 text-left text-xs font-bold text-emerald-800 uppercase tracking-wider">Delivered Time</th>
                  </tr>
                </thead>

                <tbody className="bg-white/60 divide-y divide-emerald-200/50">
                  {stats.orders.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-8 py-12 text-center text-emerald-600">
                        <div className="flex flex-col items-center gap-4">
                          <svg className="w-12 h-12 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                          </svg>
                          <p className="text-lg font-medium">No orders delivered today</p>
                          <p className="text-sm text-emerald-500">Orders marked as delivered will appear here automatically</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    stats.orders.map((order, i) => (
                      <tr key={order.id} className="hover:bg-white/90 transition-all duration-200">
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                              {i + 1}
                            </div>
                            <div className="text-sm font-bold text-emerald-900">{order.id}</div>
                          </div>
                        </td>

                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                              {order.customerName[0]}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-emerald-900">{order.customerName}</div>
                              {order.phone && (
                                <div className="text-xs text-gray-600">{order.phone}</div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-8 py-6">
                          <div className="flex flex-wrap gap-2">
                            {order.items.map((item, idx) => (
                              <span key={idx} className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-medium bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 border border-emerald-200/50">
                                {item}
                              </span>
                            ))}
                          </div>
                        </td>

                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="text-sm font-bold text-emerald-900">{formatCurrency(order.total)}</div>
                        </td>

                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="text-sm font-medium text-emerald-800">{formatTime(order.orderTime)}</div>
                        </td>

                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="text-sm font-medium text-emerald-800">{formatTime(order.deliveredTime)}</div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
