"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import AdminNavbar from "../_components/adminNavbar";
import { saveDeliveredOrder, saveActiveOrders, getActiveOrders, formatCurrency } from "../utils/localStorage";
import { reduceInventoryQuantity, checkItemAvailability, calculateOrderTotal, getCurrentInventoryStatus } from "../utils/inventoryUtils";

export default function AdminDashboard() {
  const router = useRouter();

  // ✅ CLEANED: Only voice orders - no hardcoded data
  const [orders, setOrders] = useState([]);
  const [inventoryAlert, setInventoryAlert] = useState("");
  const [animatingItems, setAnimatingItems] = useState(new Set());
  const [flashingItems, setFlashingItems] = useState(new Set());
  const [syncStatus, setSyncStatus] = useState('connected');
  const [inventoryStatus, setInventoryStatus] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const animationTimeouts = useRef({});

  // ✅ Enhanced: Calculate dynamic totals for orders
  const calculateOrdersWithDynamicTotals = (ordersList) => {
    return ordersList.map(order => {
      const { total, itemDetails } = calculateOrderTotal(order.items);
      return {
        ...order,
        total,
        itemDetails
      };
    });
  };

  // ✅ OPTIMIZED: Load orders from localStorage
  useEffect(() => {
    const loadOrders = async () => {
      try {
        setIsLoading(true);
        const savedOrders = getActiveOrders();
        console.log('📋 Loading orders from localStorage:', savedOrders);
        
        if (savedOrders.length > 0) {
          const ordersWithTotals = calculateOrdersWithDynamicTotals(savedOrders);
          console.log('✅ Successfully loaded orders:', ordersWithTotals.length, 'orders');
          setOrders(ordersWithTotals);
        } else {
          console.log('📝 No orders found - dashboard is empty');
          setOrders([]);
        }
      } catch (error) {
        console.error('❌ Error loading orders:', error);
        setOrders([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadOrders();
  }, []);

  // ✅ Enhanced: Real-time inventory status tracking
  useEffect(() => {
    const updateInventoryStatus = () => {
      try {
        const status = getCurrentInventoryStatus();
        setInventoryStatus(status);
        setSyncStatus('connected');
      } catch (error) {
        console.error('Failed to get inventory status:', error);
        setSyncStatus('disconnected');
      }
    };

    updateInventoryStatus();

    const handleInventoryChange = () => {
      updateInventoryStatus();
    };

    window.addEventListener('inventoryUpdated', handleInventoryChange);
    window.addEventListener('pricesUpdated', handleInventoryChange);
    window.addEventListener('quantityUpdated', handleInventoryChange);

    return () => {
      window.removeEventListener('inventoryUpdated', handleInventoryChange);
      window.removeEventListener('pricesUpdated', handleInventoryChange);
      window.removeEventListener('quantityUpdated', handleInventoryChange);
    };
  }, []);

  // ✅ Enhanced: Comprehensive inventory/price updates with immediate synchronization
  useEffect(() => {
    const handleInventoryUpdate = (event) => {
      console.log('📦 Inventory update received:', event.detail);
      const { newlyAvailableItems, updatedItems, removedItems } = event.detail || {};
      
      setOrders(currentOrders => {
        const updatedOrders = calculateOrdersWithDynamicTotals(currentOrders);
        console.log('🔄 Orders recalculated with new inventory:', updatedOrders);
        return updatedOrders;
      });
      
      if (newlyAvailableItems && newlyAvailableItems.length > 0) {
        newlyAvailableItems.forEach(item => {
          const itemName = item.name.toLowerCase();
          
          setFlashingItems(prev => new Set([...prev, itemName]));
          
          const alertMessage = item.isNewItem 
            ? `🎉 New item "${item.name}" added to inventory! Price: ${formatCurrency(item.price)}`
            : `🔄 "${item.name}" is now back in stock! (${item.quantity} units at ${formatCurrency(item.price)} each)`;
          
          setInventoryAlert(alertMessage);
          
          if (animationTimeouts.current[itemName]) {
            clearTimeout(animationTimeouts.current[itemName]);
          }
          
          animationTimeouts.current[itemName] = setTimeout(() => {
            setFlashingItems(prev => {
              const newSet = new Set(prev);
              newSet.delete(itemName);
              return newSet;
            });
          }, 3000);
        });
        
        setTimeout(() => setInventoryAlert(""), 5000);
      } 
      else if (removedItems && removedItems.length > 0) {
        setInventoryAlert(`⚠️ Items removed from inventory: ${removedItems.join(', ')}`);
        setTimeout(() => setInventoryAlert(""), 4000);
      }
      else {
        setInventoryAlert("📦 Inventory updated - Order totals refreshed!");
        setTimeout(() => setInventoryAlert(""), 3000);
      }
    };

    const handlePriceUpdate = (event) => {
      console.log('💰 Price update received:', event.detail);
      const { updatedItems } = event.detail || {};
      
      setOrders(currentOrders => {
        const updatedOrders = calculateOrdersWithDynamicTotals(currentOrders);
        console.log('💰 Orders recalculated with new prices:', updatedOrders);
        return updatedOrders;
      });
      
      if (updatedItems && updatedItems.length > 0) {
        const itemNames = updatedItems.map(item => item.name).join(', ');
        setInventoryAlert(`💰 Prices updated for: ${itemNames} - Order totals refreshed!`);
      } else {
        setInventoryAlert("💰 Inventory prices updated - Order totals refreshed!");
      }
      
      setTimeout(() => setInventoryAlert(""), 3000);
    };

    const handleQuantityUpdate = (event) => {
      console.log('📊 Quantity update received:', event.detail);
      const { updatedItems } = event.detail || {};
      
      setOrders(currentOrders => calculateOrdersWithDynamicTotals(currentOrders));
      
      if (updatedItems) {
        const lowStockItems = updatedItems.filter(item => item.quantity < 5);
        if (lowStockItems.length > 0) {
          setInventoryAlert(`⚠️ Low stock alert: ${lowStockItems.map(item => `${item.name} (${item.quantity} left)`).join(', ')}`);
          setTimeout(() => setInventoryAlert(""), 5000);
        }
      }
    };

    window.addEventListener('inventoryUpdated', handleInventoryUpdate);
    window.addEventListener('pricesUpdated', handlePriceUpdate);
    window.addEventListener('quantityUpdated', handleQuantityUpdate);
    window.addEventListener('inventoryItemAdded', handleInventoryUpdate);
    window.addEventListener('inventoryItemRemoved', handleInventoryUpdate);

    return () => {
      window.removeEventListener('inventoryUpdated', handleInventoryUpdate);
      window.removeEventListener('pricesUpdated', handlePriceUpdate);
      window.removeEventListener('quantityUpdated', handleQuantityUpdate);
      window.removeEventListener('inventoryItemAdded', handleInventoryUpdate);
      window.removeEventListener('inventoryItemRemoved', handleInventoryUpdate);
      
      Object.values(animationTimeouts.current).forEach(clearTimeout);
    };
  }, []);

  // ✅ OPTIMIZED: Save orders when there are changes
  useEffect(() => {
    if (orders.length > 0) {
      try {
        const ordersToSave = orders.map(({ itemDetails, ...order }) => order);
        saveActiveOrders(ordersToSave);
        console.log('💾 Saved', ordersToSave.length, 'orders to localStorage');
      } catch (error) {
        console.error('❌ Error saving orders:', error);
      }
    }
  }, [orders]);

  // Helper functions
  const activeOrders = orders.filter(o => o.status === "preparing" || o.status === "ready");
  const pendingOrders = orders.filter(o => o.status === "preparing").length;
  const readyOrders = orders.filter(o => o.status === "ready").length;

  const handleStatusChange = (id, status) => {
    setOrders(orders.map(o => o.id === id ? { ...o, status } : o));
  };

  // ✅ ENHANCED: Order delivery with comprehensive inventory integration
  const handleOrderDelivered = (id) => {
    const orderToDeliver = orders.find(o => o.id === id);
    if (orderToDeliver) {
      console.log('🚚 Processing delivery for order:', orderToDeliver);
      
      // Check if items are available before delivering
      const unavailableItems = checkItemAvailability(orderToDeliver.items);
      
      if (unavailableItems.length > 0) {
        setInventoryAlert(`⚠️ Cannot deliver order ${id}: ${unavailableItems.join(', ')} are not available in inventory.`);
        setTimeout(() => setInventoryAlert(""), 5000);
        return;
      }

      // Reduce inventory quantities
      const inventoryUpdated = reduceInventoryQuantity(orderToDeliver.items);
      
      const orderWithDeliveryTime = {
        ...orderToDeliver,
        deliveredAt: new Date().toISOString(),
        deliveredTime: new Date().toISOString(),
        status: 'delivered'
      };
      
      const success = saveDeliveredOrder(orderWithDeliveryTime);
      if (success) {
        setOrders(orders.filter(o => o.id !== id));
        
        if (inventoryUpdated) {
          setInventoryAlert(`✅ Order ${id} delivered successfully! Inventory updated.`);
          console.log('✅ Order delivered and inventory reduced:', orderToDeliver.items);
        } else {
          setInventoryAlert(`✅ Order ${id} delivered successfully!`);
          console.log('⚠️ Order delivered but inventory was not updated.');
        }
        
        setTimeout(() => setInventoryAlert(""), 3000);
      } else {
        setInventoryAlert(`❌ Failed to save delivered order ${id}`);
        setTimeout(() => setInventoryAlert(""), 5000);
      }
    }
  };

  const getStatusColor = (s) =>
    s === "preparing"
      ? "bg-gradient-to-r from-amber-50 to-orange-50 text-amber-800 border-amber-300"
      : s === "ready"
      ? "bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-800 border-emerald-300"
      : "bg-gradient-to-r from-stone-50 to-neutral-50 text-stone-800 border-stone-300";

  const formatTime = (t) =>
    new Date(t).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });

  const renderOrderItems = (order) => {
    const { itemDetails } = calculateOrderTotal(order.items);
    
    return (
      <div className="flex flex-wrap gap-1.5 max-w-xs">
        {itemDetails.map((item, idx) => {
          const itemKey = `${order.id}-${item.name}-${idx}`;
          const isFlashing = flashingItems.has(item.name.toLowerCase());
          const isLowStock = item.quantity < 5 && !item.isOutOfStock;
          
          return (
            <span 
              key={itemKey}
              className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium border transition-all duration-300 ${
                item.isOutOfStock 
                  ? "bg-gradient-to-r from-red-100 to-red-200 text-red-800 border-red-300 animate-pulse" 
                  : isLowStock
                  ? "bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-800 border-orange-200/50"
                  : "bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border-amber-200/50 hover:from-amber-200 hover:to-orange-200"
              } ${
                isFlashing 
                  ? "animate-pulse bg-gradient-to-r from-green-200 to-emerald-200 text-green-800 border-green-400 shadow-lg transform scale-105" 
                  : ""
              }`}
              style={{
                animation: isFlashing ? 'flash 0.5s ease-in-out infinite alternate' : 'none'
              }}
              title={`${item.name} - ${formatCurrency(item.price)} each${item.isOutOfStock ? ' (OUT OF STOCK)' : isLowStock ? ' (LOW STOCK)' : ''}`}
            >
              {item.quantity}x {item.name}
              {item.isOutOfStock && <span className="ml-1">⚠️</span>}
              {isLowStock && !item.isOutOfStock && <span className="ml-1">⚡</span>}
              {isFlashing && <span className="ml-1">✨</span>}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
      <AdminNavbar />

      <style jsx>{`
        @keyframes flash {
          0% { background-color: rgba(34, 197, 94, 0.2); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
          50% { background-color: rgba(34, 197, 94, 0.4); box-shadow: 0 0 0 8px rgba(34, 197, 94, 0.1); }
          100% { background-color: rgba(34, 197, 94, 0.2); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
        }
        
        @keyframes slideIn {
          from { transform: translateX(-20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        
        .flash-alert {
          animation: slideIn 0.3s ease-out;
        }
        
        .loading-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>

      <main className="max-w-[95vw] mx-auto py-6 px-2 sm:px-4 lg:px-6">
        <div className="sm:px-0">

          {inventoryAlert && (
            <div className="mb-6 p-4 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-amber-200 flash-alert">
              <div className="flex items-center gap-3">
                <div className="text-lg">{inventoryAlert}</div>
                <button 
                  onClick={() => setInventoryAlert("")}
                  className="ml-auto text-amber-600 hover:text-amber-800 transition-colors duration-200"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* ✅ CLEANED: Simple header without AI voice references */}
          <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-amber-700 mt-1">Restaurant Order Management</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className={`text-sm font-medium bg-white/80 backdrop-blur-sm rounded-xl px-3 py-1.5 border ${
                syncStatus === 'connected' 
                  ? 'text-green-700 border-green-200/50' 
                  : 'text-red-700 border-red-200/50'
              }`}>
                {syncStatus === 'connected' ? '⚡ Real-time Sync' : '⚠️ Sync Disconnected'}
              </div>
              <div className="text-sm text-blue-700 font-medium bg-white/80 backdrop-blur-sm rounded-xl px-3 py-1.5 border border-blue-200/50">
                📊 {orders.length} Total Orders
              </div>
              <div className="text-sm text-amber-700 font-medium bg-white/80 backdrop-blur-sm rounded-xl px-3 py-1.5 border border-amber-200/50">
                📦 Inventory Sync Active
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="group relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-6 border border-amber-200/50 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-600/8 to-orange-600/8 rounded-3xl" />
              <div className="relative flex items-center justify-between">
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-amber-900 mb-2">Preparing Orders</h3>
                  <p className="text-3xl font-black bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                    {pendingOrders}
                  </p>
                  <p className="text-sm text-amber-700 font-medium">Orders being prepared</p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                  </svg>
                </div>
              </div>
            </div>

            <div className="group relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-6 border border-emerald-200/50 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-600/8 to-emerald-600/8 rounded-3xl" />
              <div className="relative flex items-center justify-between">
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-teal-900 mb-2">Ready Orders</h3>
                  <p className="text-3xl font-black bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                    {readyOrders}
                  </p>
                  <p className="text-sm text-teal-700 font-medium">Ready for delivery</p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Active Orders Table */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-amber-200/50 overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-amber-200/50 bg-gradient-to-r from-amber-50/50 to-orange-50/50">
              <div>
                <h3 className="text-xl font-bold text-amber-900">Active Orders</h3>
                <p className="text-sm text-amber-700 font-medium">Current orders • Real-time inventory sync enabled</p>
              </div>
            </div>

            {/* ✅ CLEANED: Loading state and empty state without AI references */}
            {isLoading ? (
              <div className="p-12 text-center">
                <div className="loading-pulse text-6xl mb-4">⏳</div>
                <h3 className="text-xl font-bold text-amber-900 mb-2">Loading Orders...</h3>
                <p className="text-amber-700">Please wait while we fetch your orders.</p>
              </div>
            ) : activeOrders.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-xl font-bold text-amber-900 mb-2">No Active Orders</h3>
                <p className="text-amber-700 mb-4">New orders will appear here automatically when customers place them.</p>
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 max-w-md mx-auto">
                  <p className="text-sm text-amber-800">
                    💡 <strong>How it works:</strong><br/>
                    Orders from the ordering system will automatically appear here once payment is completed.
                  </p>
                </div>
              </div>
            ) : (
              <div className="w-full">
                <table className="w-full table-fixed">
                  <thead>
                    <tr className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200/50">
                      <th className="w-[12%] px-3 py-3 text-left text-xs font-bold text-amber-800 uppercase tracking-wide">Order Details</th>
                      <th className="w-[15%] px-3 py-3 text-left text-xs font-bold text-amber-800 uppercase tracking-wide">Customer</th>
                      <th className="w-[25%] px-3 py-3 text-left text-xs font-bold text-amber-800 uppercase tracking-wide">Items</th>
                      <th className="w-[10%] px-3 py-3 text-left text-xs font-bold text-amber-800 uppercase tracking-wide">Total</th>
                      <th className="w-[10%] px-3 py-3 text-left text-xs font-bold text-amber-800 uppercase tracking-wide">Time</th>
                      <th className="w-[15%] px-3 py-3 text-left text-xs font-bold text-amber-800 uppercase tracking-wide">Status</th>
                      <th className="w-[13%] px-3 py-3 text-left text-xs font-bold text-amber-800 uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="bg-white/60 divide-y divide-amber-200/50">
                    {activeOrders.map((order, i) => (
                      <tr key={order.id} className="hover:bg-white/90 transition-all duration-200">
                        <td className="px-3 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-md">
                              {i + 1}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-amber-900 truncate">{order.id}</div>
                            </div>
                          </div>
                        </td>

                        <td className="px-3 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-md flex-shrink-0">
                              {order.customerName[0]}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-semibold text-amber-900 truncate">{order.customerName}</div>
                              <div className="text-xs text-gray-500 truncate">{order.phone}</div>
                            </div>
                          </div>
                        </td>

                        <td className="px-3 py-4">
                          {renderOrderItems(order)}
                        </td>

                        <td className="px-3 py-4">
                          <div className="text-xs font-bold text-amber-900">
                            {formatCurrency(order.total)}
                          </div>
                        </td>

                        <td className="px-3 py-4">
                          <div className="text-xs font-medium text-amber-800">{formatTime(order.orderTime)}</div>
                        </td>

                        <td className="px-3 py-4">
                          <select
                            value={order.status}
                            onChange={e => handleStatusChange(order.id, e.target.value)}
                            className={`w-full px-2 py-1 text-xs font-bold rounded-xl border-2 focus:outline-none focus:ring-2 focus:ring-amber-500/20 cursor-pointer transition-all duration-200 ${getStatusColor(order.status)}`}
                          >
                            <option value="preparing">⏳ Preparing</option>
                            <option value="ready">✅ Ready</option>
                          </select>
                        </td>

                        <td className="px-3 py-4">
                          {order.status === "ready" ? (
                            <button
                              onClick={() => handleOrderDelivered(order.id)}
                              className="w-full group bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white px-2 py-1.5 rounded-xl font-semibold flex items-center justify-center gap-1 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 text-xs"
                            >
                              <svg className="w-3 h-3 group-hover:scale-110 transition-transform flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                              </svg>
                              <span className="hidden sm:inline">Mark</span> Delivered
                            </button>
                          ) : (
                            <button disabled className="w-full bg-gradient-to-r from-stone-400 to-neutral-500 text-white px-2 py-1.5 rounded-xl font-semibold opacity-60 cursor-not-allowed flex items-center justify-center gap-1 text-xs">
                              <svg className="w-3 h-3 animate-spin flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                              </svg>
                              In Progress
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
