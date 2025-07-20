"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminNavbar from "../../_components/adminNavbar";
// REMOVE this line
// import { getTodayStats, getDeliveredOrders, formatCurrency } from "../../utils/localStorage";

// REPLACE with Supabase imports (same as your today report)
import { getTodaysReport, getDeliveredOrders } from "../../../lib/reportService";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

export default function SalesList() {
  const router = useRouter();
  const [timeRange, setTimeRange] = useState("daily");
  const [autoScale, setAutoScale] = useState(true);
  const [headerRevenueRange, setHeaderRevenueRange] = useState("monthly");
  const [currentTime, setCurrentTime] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [deliveredOrders, setDeliveredOrders] = useState([]);
  const [todayStats, setTodayStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    avgOrderValue: 0,
    orders: []
  });

  // Handle client-side time display
  useEffect(() => {
    setIsClient(true);
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleString("en-IN", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          timeZone: "Asia/Kolkata",
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Load ONLY real orders from localStorage (no fake data)
  // useEffect(() => {
  //   const loadRealOrdersData = () => {
  //     try {
  //       // Get today's stats and all delivered orders from localStorage only
  //       const stats = getTodaysReport();
  //       const allDeliveredOrders = getDeliveredOrders();
        
  //       setTodayStats(stats);
  //       setDeliveredOrders(allDeliveredOrders); // Only real data
        
  //       console.log('Real orders loaded:', allDeliveredOrders.length);
  //     } catch (error) {
  //       console.error('Error loading orders data:', error);
  //       setDeliveredOrders([]); // Empty array if error
  //     }
  //   };

  //   loadRealOrdersData();
    
  //   // Set up interval to refresh data every 30 seconds
  //   const interval = setInterval(loadRealOrdersData, 30000);
  //   return () => clearInterval(interval);
  // }, []);
  // Replace the entire "Load ONLY real orders from localStorage" useEffect with this:
// Load real orders from Supabase (preserving all original functionality)
useEffect(() => {
  const loadRealOrdersData = async () => {
    try {
      // Get today's stats from Supabase
      const todayResult = await getTodaysReport();
      if (todayResult.success) {
        setTodayStats(todayResult.data);
      } else {
        // Fallback stats if today's report fails
        setTodayStats({
          totalOrders: 0,
          totalRevenue: 0,
          avgOrderValue: 0,
          orders: []
        });
      }

      // Get all delivered orders from Supabase for historical charts
      const ordersResult = await getDeliveredOrders();
      if (ordersResult.success) {
        setDeliveredOrders(ordersResult.data);
        console.log('✅ Loaded from Supabase:', ordersResult.data.length, 'orders');
      } else {
        console.error('❌ Failed to load orders from Supabase:', ordersResult.error);
        setDeliveredOrders([]);
      }
      
    } catch (error) {
      console.error('Error loading orders data from Supabase:', error);
      // Set fallback data to prevent crashes
      setDeliveredOrders([]);
      setTodayStats({
        totalOrders: 0,
        totalRevenue: 0,
        avgOrderValue: 0,
        orders: []
      });
    }
  };

  loadRealOrdersData();
  
  // Set up interval to refresh data every 30 seconds (same as before)
  const interval = setInterval(loadRealOrdersData, 30000);
  return () => clearInterval(interval);
}, []);


  // Calculate revenue for header based on real data only
  const getHeaderRevenue = () => {
    const currentDate = new Date();

    if (headerRevenueRange === "monthly") {
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();

      const monthlyOrders = deliveredOrders.filter((order) => {
        const orderDate = new Date(order.deliveredTime || order.orderTime);
        return (
          orderDate.getMonth() === currentMonth &&
          orderDate.getFullYear() === currentYear
        );
      });

      return monthlyOrders.reduce((sum, order) => sum + order.total, 0);
    } else if (headerRevenueRange === "yearly") {
      const currentYear = currentDate.getFullYear();

      const yearlyOrders = deliveredOrders.filter((order) => {
        const orderDate = new Date(order.deliveredTime || order.orderTime);
        return orderDate.getFullYear() === currentYear;
      });

      return yearlyOrders.reduce((sum, order) => sum + order.total, 0);
    }

    return 0;
  };
  // Add this function at the top of your component, before the export default function
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);
};

  const getHeaderRevenueLabel = () => {
    return headerRevenueRange === "monthly" ? "Total Revenue Monthly" : "Total Revenue Yearly";
  };

  // Process sales data for line chart with real data only
  // const getSalesData = () => {
  //   const salesMap = new Map();

  //   deliveredOrders.forEach((order) => {
  //     // Use deliveredTime if available, otherwise orderTime
  //     const date = new Date(order.deliveredTime || order.orderTime);
  //     let key;

  //     switch (timeRange) {
  //       case "daily":
  //         key = date.toISOString().split("T")[0];
  //         break;
  //       case "monthly":
  //         key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  //         break;
  //       case "yearly":
  //         key = date.getFullYear().toString();
  //         break;
  //       default:
  //         key = date.toISOString().split("T")[0];
  //     }

  //     if (salesMap.has(key)) {
  //       salesMap.set(key, salesMap.get(key) + order.total);
  //     } else {
  //       salesMap.set(key, order.total);
  //     }
  //   });

  //   return Array.from(salesMap.entries())
  //     .map(([date, revenue]) => ({
  //       date,
  //       revenue: parseFloat(revenue.toFixed(2)),
  //     }))
  //     .sort((a, b) => a.date.localeCompare(b.date));
  // };
  const getSalesData = () => {
  const salesMap = new Map();

  deliveredOrders.forEach((order) => {
    const date = new Date(order.deliveredTime || order.orderTime);
    let key;

    switch (timeRange) {
      case "daily":
        // Use IST timezone for consistent daily grouping
        key = date.toLocaleDateString("en-CA", { 
          timeZone: "Asia/Kolkata" 
        }); // Returns YYYY-MM-DD format in IST
        break;
      case "monthly":
        const year = date.toLocaleDateString("en-US", { 
          year: "numeric", 
          timeZone: "Asia/Kolkata" 
        });
        const month = date.toLocaleDateString("en-US", { 
          month: "2-digit", 
          timeZone: "Asia/Kolkata" 
        });
        key = `${year}-${month}`;
        break;
      case "yearly":
        key = date.toLocaleDateString("en-US", { 
          year: "numeric", 
          timeZone: "Asia/Kolkata" 
        });
        break;
      default:
        key = date.toLocaleDateString("en-CA", { 
          timeZone: "Asia/Kolkata" 
        });
    }

    if (salesMap.has(key)) {
      salesMap.set(key, salesMap.get(key) + order.total);
    } else {
      salesMap.set(key, order.total);
    }
  });

  console.log('IST Sales data processed:', Array.from(salesMap.entries()));

  return Array.from(salesMap.entries())
    .map(([date, revenue]) => ({
      date,
      revenue: parseFloat(revenue.toFixed(2)),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
};


  // Process item popularity data with percentages
  const getItemPopularityData = () => {
    const itemCount = new Map();

    deliveredOrders.forEach((order) => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item) => {
          const itemName = item.toLowerCase().trim();
          itemCount.set(itemName, (itemCount.get(itemName) || 0) + 1);
        });
      }
    });

    const totalItems = Array.from(itemCount.values()).reduce((sum, count) => sum + count, 0);
    
    const data = Array.from(itemCount.entries())
      .map(([name, count]) => ({ 
        name: name.charAt(0).toUpperCase() + name.slice(1), 
        value: count,
        percentage: totalItems > 0 ? ((count / totalItems) * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    return data.length > 0 ? data : [{ name: "No Data Yet", value: 1, percentage: 100 }];
  };

  // Calculate Y-axis domain for auto-scaling
  const getYAxisDomain = () => {
    if (!autoScale) return [0, "auto"];

    const data = getSalesData();
    if (data.length === 0) return [0, 500]; // Lower starting point for real data

    const maxValue = Math.max(...data.map((d) => d.revenue));
    const minValue = Math.min(...data.map((d) => d.revenue));

    const padding = (maxValue - minValue) * 0.1;
    const adjustedMin = Math.max(0, minValue - padding);
    const adjustedMax = maxValue + padding;

    return [adjustedMin, adjustedMax];
  };

  // const formatChartDate = (dateString) => {
  //   const date = new Date(dateString);
  //   switch (timeRange) {
  //     case "daily":
  //       return date.toLocaleDateString("en-IN", {
  //         month: "short",
  //         day: "numeric",
  //         timeZone: "Asia/Kolkata",
  //       });
  //     case "monthly":
  //       return date.toLocaleDateString("en-IN", {
  //         month: "short",
  //         year: "numeric",
  //         timeZone: "Asia/Kolkata",
  //       });
  //     case "yearly":
  //       return date.getFullYear().toString();
  //     default:
  //       return dateString;
  //   }
  // };

  // Enhanced color palette for pie chart
  const formatChartDate = (dateString) => {
  // Parse the date string and create a proper date object
  const date = new Date(dateString + 'T00:00:00');
  
  switch (timeRange) {
    case "daily":
      return date.toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
        timeZone: "Asia/Kolkata",
      });
    case "monthly":
      const [year, month] = dateString.split('-');
      const monthDate = new Date(year, month - 1, 1);
      return monthDate.toLocaleDateString("en-IN", {
        month: "short",
        year: "numeric",
        timeZone: "Asia/Kolkata",
      });
    case "yearly":
      return dateString;
    default:
      return date.toLocaleDateString("en-IN", {
        month: "short", 
        day: "numeric",
        timeZone: "Asia/Kolkata"
      });
  }
};

  const COLORS = [
    "#10B981", "#F59E0B", "#EF4444", "#3B82F6", "#8B5CF6", 
    "#F97316", "#06B6D4", "#84CC16", "#EC4899", "#6B7280",
  ];

  // Enhanced custom label renderer for pie chart
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name, value }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    // Only show percentage if it's significant enough (>3%)
    if (percent < 0.03) return null;

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="12"
        fontWeight="bold"
        style={{
          textShadow: '1px 1px 2px rgba(0,0,0,0.7)',
          filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.5))'
        }}
      >
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    );
  };

  // Enhanced legend formatter with percentages
  const formatLegendWithPercentage = (value, entry) => {
    const itemData = getItemPopularityData().find(item => item.name === value);
    return (
      <span style={{ color: entry.color, fontSize: '12px', fontWeight: '500' }}>
        {value} ({itemData?.percentage || 0}%)
      </span>
    );
  };

  // Enhanced print functionality
  // Enhanced print functionality with PDF download
// Enhanced print functionality with reliable PDF download
const handlePrint = () => {
  const printWindow = window.open("", "_blank", "width=1200,height=800");
  const currentDate = new Date().toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Kolkata",
  });

  const totalRevenue = deliveredOrders.reduce(
    (sum, order) => sum + order.total,
    0
  );
  const avgOrderValue =
    deliveredOrders.length > 0 ? totalRevenue / deliveredOrders.length : 0;
  const popularItems = getItemPopularityData();
  const salesData = getSalesData();

  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>KhanaBuddy - Sales Analytics Report (IST)</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          margin: 20px; 
          line-height: 1.6;
          color: #333;
        }
        .header { 
          text-align: center; 
          margin-bottom: 30px; 
          border-bottom: 2px solid #f59e0b; 
          padding-bottom: 20px; 
        }
        .stats-grid { 
          display: grid; 
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
          gap: 20px; 
          margin: 20px 0; 
        }
        .stat-card { 
          background: #f9fafb; 
          padding: 20px; 
          border-radius: 8px; 
          text-align: center; 
          border: 1px solid #e5e7eb;
        }
        .stat-value { 
          font-size: 24px; 
          font-weight: bold; 
          color: #1f2937; 
        }
        .stat-label { 
          font-size: 14px; 
          color: #6b7280; 
          margin-top: 5px; 
        }
        .section { 
          margin: 30px 0; 
          page-break-inside: avoid;
        }
        .section-title { 
          font-size: 20px; 
          font-weight: bold; 
          margin-bottom: 15px; 
          color: #1f2937;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin: 10px 0; 
        }
        th, td { 
          padding: 10px; 
          text-align: left; 
          border-bottom: 1px solid #e5e7eb; 
        }
        th { 
          background: #f3f4f6; 
          font-weight: bold; 
        }
        .today-highlight { 
          background: #fef3c7; 
          padding: 15px; 
          border-radius: 8px; 
          border-left: 4px solid #f59e0b; 
          margin: 20px 0;
        }
        .no-data { 
          background: #f3f4f6; 
          padding: 15px; 
          border-radius: 8px; 
          text-align: center; 
          color: #6b7280; 
        }
        
        /* Button container */
        .button-container { 
          position: fixed; 
          top: 20px; 
          right: 20px; 
          z-index: 1000; 
        }
        .download-btn { 
          background: linear-gradient(135deg, #10b981, #059669); 
          color: white;
          padding: 15px 30px; 
          font-size: 16px; 
          font-weight: 600; 
          border: none; 
          border-radius: 10px; 
          cursor: pointer; 
          transition: all 0.3s ease;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .download-btn:hover { 
          background: linear-gradient(135deg, #059669, #047857); 
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(0,0,0,0.2);
        }
        .download-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
        
        .spinner {
          display: none;
          width: 16px;
          height: 16px;
          border: 2px solid #ffffff;
          border-top: 2px solid transparent;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        /* Hide button when printing */
        @media print {
          .button-container { display: none !important; }
        }
      </style>
    </head>
    <body>
      <!-- Download Button -->
      <div class="button-container">
        <button id="downloadPdfBtn" class="download-btn">
          <span id="downloadText">📥 Download PDF</span>
          <div id="spinner" class="spinner"></div>
        </button>
      </div>

      <!-- Report Content -->
      <div id="reportContent">
        <div class="header">
          <h1>🍽️ KhanaBuddy Sales Analytics Report</h1>
          <p><strong>Generated on:</strong> ${currentDate} (IST)<br>
          <strong>Data Source:</strong> Real Orders Only</p>
        </div>

        <div class="today-highlight">
          <h3>📊 Today's Performance (IST)</h3>
          <p><strong>Orders:</strong> ${
            todayStats.totalOrders
          } | <strong>Revenue:</strong> ${formatCurrency(
    todayStats.totalRevenue
  )} | <strong>Avg Order:</strong> ${formatCurrency(
    todayStats.avgOrderValue
  )}</p>
        </div>

        ${deliveredOrders.length > 0 ? `
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${formatCurrency(totalRevenue)}</div>
            <div class="stat-label">💰 Total Revenue</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${deliveredOrders.length}</div>
            <div class="stat-label">📦 Total Orders</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${formatCurrency(avgOrderValue)}</div>
            <div class="stat-label">📈 Average Order Value</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${
              popularItems.filter((item) => item.name !== "No Data Yet").length
            }</div>
            <div class="stat-label">🍕 Menu Items Sold</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">📈 Revenue Trends (IST Dates)</div>
          <table>
            <thead>
              <tr><th>Period</th><th>Revenue</th><th>Growth</th></tr>
            </thead>
            <tbody>
              ${salesData.map((item, index) => {
                const growth = index > 0 ? ((item.revenue - salesData[index-1].revenue) / salesData[index-1].revenue * 100).toFixed(1) : 0;
                return `<tr><td>${formatChartDate(item.date)}</td><td>${formatCurrency(item.revenue)}</td><td>${growth}%</td></tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>

        <div class="section">
          <div class="section-title">🏆 Top Items</div>
          <table>
            <thead>
              <tr><th>Item</th><th>Orders</th><th>Share</th></tr>
            </thead>
            <tbody>
              ${popularItems.filter(item => item.name !== "No Data Yet").map(item => {
                const total = popularItems.filter(i => i.name !== "No Data Yet").reduce((sum, i) => sum + i.value, 0);
                const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
                return `<tr><td>${item.name}</td><td>${item.value}</td><td>${percentage}%</td></tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
        ` : `
        <div class="no-data">
          <h3>📊 No Sales Data Available</h3>
          <p>Start delivering orders to see analytics here. Your sales data will appear as you complete orders.</p>
        </div>
        `
        }
      </div>

      <script>
        // Simple PDF download using browser's print functionality
        document.getElementById('downloadPdfBtn').addEventListener('click', function() {
          const btn = this;
          const downloadText = document.getElementById('downloadText');
          const spinner = document.getElementById('spinner');
          
          // Show loading state
          btn.disabled = true;
          downloadText.textContent = 'Generating PDF...';
          spinner.style.display = 'inline-block';
          
          try {
            // Hide the button for printing
            document.querySelector('.button-container').style.display = 'none';
            
            // Set document title for PDF filename
            document.title = 'KhanaBuddy_Sales_Report_' + new Date().toLocaleDateString('en-IN', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              timeZone: 'Asia/Kolkata'
            }).replace(/\\//g, '-');
            
            // Use browser's print dialog to save as PDF
            setTimeout(() => {
              window.print();
              
              // Show button again after print dialog
              setTimeout(() => {
                document.querySelector('.button-container').style.display = 'block';
                
                // Reset button state
                btn.disabled = false;
                downloadText.textContent = '📥 Download PDF';
                spinner.style.display = 'none';
              }, 1000);
            }, 100);
            
          } catch (error) {
            console.error('Error:', error);
            
            // Reset button state on error
            btn.disabled = false;
            downloadText.textContent = '📥 Download PDF';
            spinner.style.display = 'none';
            document.querySelector('.button-container').style.display = 'block';
            
            alert('Please use your browser\\'s print function and select "Save as PDF" to download the report.');
          }
        });

        // Focus the window
        window.focus();
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(printContent);
  printWindow.document.close();
  printWindow.focus();
};



  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
      <AdminNavbar />

      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {/* Page Header */}
          <div className="mb-8 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-6 border border-amber-200/50">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-stone-800 to-amber-800 bg-clip-text text-transparent">
                  Sales Analytics Dashboard
                </h2>
                <p className="text-sm text-amber-700 font-medium mt-1">
                  {isClient ? currentTime : "Loading..."} | Real Data Only
                </p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={handlePrint}
                  className="group bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-4 py-2 rounded-xl font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd"/>
                  </svg>
                  Print Report
                </button>

                <div className="text-right bg-gradient-to-r from-teal-50 to-emerald-50 rounded-2xl p-4 border border-teal-200/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-bold text-teal-900">{getHeaderRevenueLabel()}</div>
                    <select
                      value={headerRevenueRange}
                      onChange={(e) => setHeaderRevenueRange(e.target.value)}
                      className="ml-3 px-2 py-1 bg-white border border-teal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs font-medium text-teal-900"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                  <div className="text-2xl font-black text-teal-600">
                    {formatCurrency(getHeaderRevenue())}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Today's Performance Highlight */}
          {/* <div className="mb-8 bg-gradient-to-r from-green-50 to-emerald-50 rounded-3xl shadow-xl p-6 border border-green-200/50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-green-900 mb-2">Today's Performance</h3>
                <div className="flex items-center gap-8">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{todayStats.totalOrders}</div>
                    <div className="text-sm text-green-700">Orders</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{formatCurrency(todayStats.totalRevenue)}</div>
                    <div className="text-sm text-green-700">Revenue</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{formatCurrency(todayStats.avgOrderValue)}</div>
                    <div className="text-sm text-green-700">Avg Order</div>
                  </div>
                </div>
              </div>
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-3xl flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
              </div>
            </div>
          </div> */}

          {/* Conditional Content Based on Data */}
          {deliveredOrders.length === 0 ? (
            /* No Data State */
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-12 border border-amber-200/50 text-center">
              <div className="flex flex-col items-center gap-6">
                <svg className="w-24 h-24 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd"/>
                </svg>
                <div>
                  <h3 className="text-2xl font-bold text-amber-900 mb-2">No Sales Data Yet</h3>
                  <p className="text-amber-700 mb-4">Start delivering orders to see your analytics here!</p>
                  <p className="text-sm text-amber-600">Your sales trends, popular items, and revenue data will appear as you complete orders.</p>
                </div>
                <button
                  onClick={() => router.push('/admin-dashboard')}
                  className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-6 py-3 rounded-2xl font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd"/>
                  </svg>
                  Go to Dashboard
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-6 border border-emerald-200/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-emerald-900">Total Orders</h3>
                      <p className="text-2xl font-black text-emerald-600">{deliveredOrders.length}</p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-6 border border-amber-200/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-amber-900">Avg Order Value</h3>
                      <p className="text-2xl font-black text-amber-600">
                        {formatCurrency(deliveredOrders.length > 0 ? deliveredOrders.reduce((sum, order) => sum + order.total, 0) / deliveredOrders.length : 0)}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-6 border border-rose-200/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-rose-900">Total Revenue</h3>
                      <p className="text-2xl font-black text-rose-600">
                        {formatCurrency(deliveredOrders.reduce((sum, order) => sum + order.total, 0))}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-r from-rose-500 to-pink-600 rounded-2xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                {/* Sales Trend Chart */}
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-amber-200/50 p-8">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-amber-900">Sales Trend</h3>
                      <p className="text-sm text-amber-700 font-medium">Real revenue data from your orders</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="autoScale"
                          checked={autoScale}
                          onChange={(e) => setAutoScale(e.target.checked)}
                          className="w-4 h-4 text-amber-600 border-amber-300 rounded focus:ring-amber-500"
                        />
                        <label htmlFor="autoScale" className="text-xs text-amber-700 font-medium">Auto Scale</label>
                      </div>
                      <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                        className="px-4 py-2 bg-white border border-amber-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-medium text-amber-900"
                      >
                        <option value="daily">Daily</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={getSalesData()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#FEF3C7" />
                      <XAxis dataKey="date" tickFormatter={formatChartDate} stroke="#92400E" fontSize={12} />
                      <YAxis 
                        domain={getYAxisDomain()} 
                        stroke="#92400E" 
                        fontSize={12} 
                        tickFormatter={(value) => `₹${value.toFixed(0)}`} 
                      />
                      <Tooltip
                        formatter={(value) => [`₹${value.toFixed(2)}`, "Revenue"]}
                        labelFormatter={(label) => `Date: ${formatChartDate(label)}`}
                        contentStyle={{ 
                          backgroundColor: "#FEF3C7", 
                          border: "1px solid #F59E0B", 
                          borderRadius: "12px", 
                          fontSize: "12px" 
                        }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#F59E0B" 
                        strokeWidth={3} 
                        dot={{ fill: "#F59E0B", strokeWidth: 2, r: 4 }} 
                        activeDot={{ r: 6, stroke: "#F59E0B", strokeWidth: 2 }} 
                        connectNulls={false} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Popular Items Chart with Percentages */}
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-amber-200/50 p-8">
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-amber-900">Popular Items</h3>
                    <p className="text-sm text-amber-700 font-medium">Based on actual delivered orders with percentages</p>
                  </div>
                  
                  {/* Item Statistics Table */}
                  <div className="mb-6 max-h-32 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-amber-50 text-amber-800">
                          <th className="text-left p-2 font-semibold">Item</th>
                          <th className="text-center p-2 font-semibold">Orders</th>
                          <th className="text-center p-2 font-semibold">Share</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getItemPopularityData().filter(item => item.name !== "No Data Yet").map((item, index) => (
                          <tr key={index} className="border-b border-amber-100">
                            <td className="p-2 flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                              ></div>
                              <span className="font-medium text-amber-900">{item.name}</span>
                            </td>
                            <td className="text-center p-2 text-amber-800">{item.value}</td>
                            <td className="text-center p-2 text-amber-800 font-semibold">{item.percentage}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={getItemPopularityData()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        animationBegin={0}
                        animationDuration={800}
                      >
                        {getItemPopularityData().map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={COLORS[index % COLORS.length]}
                            stroke="#ffffff"
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value, name, props) => [
                          `${value} orders (${props.payload.percentage}%)`, 
                          name
                        ]}
                        contentStyle={{ 
                          backgroundColor: "#FEF3C7", 
                          border: "1px solid #F59E0B", 
                          borderRadius: "12px", 
                          fontSize: "12px",
                          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
                        }}
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        height={60}
                        formatter={formatLegendWithPercentage}
                        wrapperStyle={{
                          paddingTop: '20px',
                          fontSize: '12px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
