// utils/localStorage.js

export const LocalStorageKeys = {
  DELIVERED_ORDERS: 'deliveredOrders',
  ACTIVE_ORDERS: 'activeOrders'
};

// Save delivered order to localStorage
export const saveDeliveredOrder = (order) => {
  try {
    const deliveredOrders = getDeliveredOrders();
    const orderWithDeliveryTime = {
      ...order,
      deliveredAt: new Date().toISOString(),
      deliveredTime: new Date().toISOString(), // For saleslist compatibility
      status: 'delivered'
    };
    deliveredOrders.push(orderWithDeliveryTime);
    localStorage.setItem('deliveredOrders', JSON.stringify(deliveredOrders));
    
    // Trigger analytics update
    window.dispatchEvent(new CustomEvent('analyticsUpdated'));
    
    return true;
  } catch (error) {
    console.error('Error saving delivered order:', error);
    return false;
  }
};
// Get all delivered orders from localStorage
export const getDeliveredOrders = () => {
  const delivered = localStorage.getItem('deliveredOrders');
  return delivered ? JSON.parse(delivered) : [];
};



// Get today's delivered orders
export const getTodayDeliveredOrders = () => {
  try {
    const allDeliveredOrders = getDeliveredOrders();
    const today = new Date().toDateString();
    return allDeliveredOrders.filter(order => {
      const orderDate = new Date(order.deliveredTime).toDateString();
      return orderDate === today;
    });
  } catch (error) {
    console.error('Error loading today\'s delivered orders:', error);
    return [];
  }
};

// Save active orders to localStorage
export const saveActiveOrders = (orders) => {
  try {
    localStorage.setItem(LocalStorageKeys.ACTIVE_ORDERS, JSON.stringify(orders));
    return true;
  } catch (error) {
    console.error('Error saving active orders:', error);
    return false;
  }
};

// Get active orders from localStorage
export const getActiveOrders = () => {
  try {
    return JSON.parse(localStorage.getItem(LocalStorageKeys.ACTIVE_ORDERS) || '[]');
  } catch (error) {
    console.error('Error loading active orders:', error);
    return [];
  }
};

// Clear all localStorage data
export const clearAllData = () => {
  try {
    localStorage.removeItem(LocalStorageKeys.DELIVERED_ORDERS);
    localStorage.removeItem(LocalStorageKeys.ACTIVE_ORDERS);
    return true;
  } catch (error) {
    console.error('Error clearing localStorage:', error);
    return false;
  }
};

// Format currency in rupees
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount);
};

// Get today's statistics
export const getTodayStats = () => {
  try {
    const todayOrders = getTodayDeliveredOrders();
    const totalRevenue = todayOrders.reduce((sum, order) => sum + order.total, 0);
    const avgOrderValue = todayOrders.length > 0 ? totalRevenue / todayOrders.length : 0;
    
    return {
      totalOrders: todayOrders.length,
      totalRevenue: totalRevenue,
      avgOrderValue: avgOrderValue,
      orders: todayOrders
    };
  } catch (error) {
    console.error('Error calculating today\'s stats:', error);
    return {
      totalOrders: 0,
      totalRevenue: 0,
      avgOrderValue: 0,
      orders: []
    };
  }
};

