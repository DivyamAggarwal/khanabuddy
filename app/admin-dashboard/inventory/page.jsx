"use client";
import { useState, useEffect } from "react";
import AdminNavbar from "../../_components/adminNavbar";
import { loadInventoryItems, addInventoryItem, updateInventoryItem, deleteInventoryItem } from "../../../lib/inventoryService";

export default function InventoryPage() {
  const [menuItems, setMenuItems] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [updateAlert, setUpdateAlert] = useState("");
  const [formData, setFormData] = useState({
    item_name: "",
    price: "",
    quantity: "",
    min_stock: "5"
  });

  //  Enhanced: Item name mapping for dashboard compatibility
  const getDisplayName = (itemName) => {
    const nameMap = {
      'pizza': 'Margherita Pizza',
      'burger': 'Chicken Burger', 
      'fries': 'Fries',
      'garlic bread': 'Garlic Bread',
      'pasta': 'Pasta',
      'beverage': 'Coke',
      'wrap': 'Wrap',
      'chicken burger': 'Chicken Burger',
      'bbq burger': 'BBQ Burger',
      'onion rings': 'Onion Rings',
      'loaded fries': 'Loaded Fries',
      'milkshake': 'Milkshake',
      'smoothie': 'Smoothie',
      'coke': 'Coke'
    };
    return nameMap[itemName.toLowerCase()] || itemName;
  };

  // Enhanced: Get current inventory status for dashboard
  const getCurrentInventoryStatus = () => {
    return menuItems.reduce((status, item) => {
      const displayName = getDisplayName(item.item_name);
      status[displayName] = {
        quantity: item.quantity || 0,
        price: item.price || 0,
        min_stock: item.min_stock || 5,
        status: getItemStatus(item.quantity, item.min_stock),
        isOutOfStock: item.quantity === 0,
        isLowStock: item.quantity < (item.min_stock || 5) && item.quantity > 0
      };
      return status;
    }, {});
  };

  // Enhanced: Make getCurrentInventoryStatus globally available
  useEffect(() => {
    // Make function available globally for dashboard
    window.getCurrentInventoryStatus = getCurrentInventoryStatus;
    
    return () => {
      // Clean up global function
      delete window.getCurrentInventoryStatus;
    };
  }, [menuItems]);

  // Load menu items from Supabase on component mount
  useEffect(() => {
    loadMenuItems();
  }, []);

  //  Enhanced: Real-time inventory updates integration
  useEffect(() => {
    const handleInventoryUpdate = () => {
      loadMenuItems();
      setUpdateAlert("📦 Inventory updated from order delivery!");
      setTimeout(() => setUpdateAlert(""), 3000);
    };

    const handleAnalyticsUpdate = () => {
      console.log('Analytics updated, inventory might need refresh');
    };

    const handleStorageChange = (e) => {
      if (e.key === 'menu') {
        loadMenuItems();
        setUpdateAlert("🔄 Inventory synchronized!");
        setTimeout(() => setUpdateAlert(""), 3000);
      }
    };

    // Enhanced event listeners
    window.addEventListener('inventoryUpdated', handleInventoryUpdate);
    window.addEventListener('analyticsUpdated', handleAnalyticsUpdate);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('inventoryUpdated', handleInventoryUpdate);
      window.removeEventListener('analyticsUpdated', handleAnalyticsUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Updated to use Supabase
  const loadMenuItems = async () => {
  const result = await loadInventoryItems();
  
  if (result.success) {
    setMenuItems(result.data);
    console.log(' Inventory loaded from database:', result.data.length, 'items');
  } else {
    console.error(' Failed to load from database:', result.error);
    setUpdateAlert(" Failed to load inventory from database!");
    setTimeout(() => setUpdateAlert(""), 3000);
  }
};


  // ENHANCED: Comprehensive event dispatching system - THE KEY FIX
  const saveMenuItems = (updatedItems, changeType = 'update', changedItem = null) => {
    const previousItems = [...menuItems];
    
    // Update state immediately for UI responsiveness
    setMenuItems(updatedItems);
    
    // Enhanced: Detailed event information for dashboard sync
    const newlyAvailableItems = [];
    const updatedItemsInfo = [];
    const removedItems = [];
    
    // Process each item for changes
    updatedItems.forEach(currentItem => {
      const previousItem = previousItems.find(prev => prev.item_id === currentItem.item_id);
      const displayName = getDisplayName(currentItem.item_name);
      
      if (previousItem) {
        const wasOutOfStock = previousItem.quantity === 0;
        const isNowInStock = currentItem.quantity > 0;
        const quantityChanged = previousItem.quantity !== currentItem.quantity;
        const priceChanged = previousItem.price !== currentItem.price;
        
        // Track newly available items (out of stock -> in stock)
        if (wasOutOfStock && isNowInStock) {
          newlyAvailableItems.push({
            name: displayName,
            quantity: currentItem.quantity,
            price: currentItem.price,
            previousQuantity: previousItem.quantity,
            isNewItem: false
          });
        }
        
        // Track all changes for updates
        if (quantityChanged || priceChanged) {
          updatedItemsInfo.push({
            name: displayName,
            quantity: currentItem.quantity,
            price: currentItem.price,
            previousQuantity: previousItem.quantity,
            previousPrice: previousItem.price,
            quantityChanged,
            priceChanged
          });
        }
      } else {
        // Completely new item added
        newlyAvailableItems.push({
          name: displayName,
          quantity: currentItem.quantity,
          price: currentItem.price,
          isNewItem: true
        });
      }
    });
    
    // Handle removed items
    if (changeType === 'delete' && changedItem) {
      removedItems.push(getDisplayName(changedItem.item_name));
    }
    
    // CRITICAL: Dispatch ALL required events for dashboard synchronization
    
    // 1. Main inventory updated event - ALWAYS dispatch this
    const inventoryEventDetail = {
      newlyAvailableItems,
      updatedItems: updatedItemsInfo,
      removedItems,
      allItems: updatedItems.map(item => ({
        ...item,
        displayName: getDisplayName(item.item_name)
      })),
      changeType,
      changedItem: changedItem ? {
        ...changedItem,
        displayName: getDisplayName(changedItem.item_name)
      } : null,
      timestamp: new Date().toISOString()
    };
    
    window.dispatchEvent(new CustomEvent('inventoryUpdated', {
      detail: inventoryEventDetail
    }));
    
    // 2. Price update event - for price changes
    const priceChangedItems = updatedItemsInfo.filter(item => item.priceChanged);
    if (priceChangedItems.length > 0) {
      window.dispatchEvent(new CustomEvent('pricesUpdated', {
        detail: {
          updatedItems: priceChangedItems,
          newlyAvailableItems: newlyAvailableItems.filter(item => !item.isNewItem),
          timestamp: new Date().toISOString()
        }
      }));
    }
    
    // 3. Quantity update event - for quantity changes
    const quantityChangedItems = updatedItemsInfo.filter(item => item.quantityChanged);
    if (quantityChangedItems.length > 0) {
      window.dispatchEvent(new CustomEvent('quantityUpdated', {
        detail: {
          updatedItems: quantityChangedItems,
          timestamp: new Date().toISOString()
        }
      }));
    }
    
    // 4. Item added event - for new items
    if (changeType === 'add' && changedItem) {
      window.dispatchEvent(new CustomEvent('inventoryItemAdded', {
        detail: {
          newlyAvailableItems: [{
            name: getDisplayName(changedItem.item_name),
            quantity: changedItem.quantity,
            price: changedItem.price,
            isNewItem: true
          }],
          timestamp: new Date().toISOString()
        }
      }));
    }
    
    // 5. Item removed event - for deleted items
    if (changeType === 'delete' && changedItem) {
      window.dispatchEvent(new CustomEvent('inventoryItemRemoved', {
        detail: {
          removedItems: [getDisplayName(changedItem.item_name)],
          timestamp: new Date().toISOString()
        }
      }));
    }
    
    // Enhanced: Console logging for debugging
    console.log(' All inventory events dispatched successfully:', {
      changeType,
      eventsDispatched: [
        'inventoryUpdated',
        priceChangedItems.length > 0 ? 'pricesUpdated' : null,
        quantityChangedItems.length > 0 ? 'quantityUpdated' : null,
        changeType === 'add' ? 'inventoryItemAdded' : null,
        changeType === 'delete' ? 'inventoryItemRemoved' : null
      ].filter(Boolean),
      newlyAvailableItems: newlyAvailableItems.length,
      updatedItems: updatedItemsInfo.length,
      removedItems: removedItems.length
    });
  };

  const generateId = () => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  };

  const getItemStatus = (quantity, minStock = 5) => {
    if (quantity === 0) return "Not Available";
    if (quantity < minStock) return "Need to Restock";
    return "Available";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Available":
        return "bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 border border-emerald-200";
      case "Need to Restock":
        return "bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border border-amber-200";
      case "Not Available":
        return "bg-gradient-to-r from-rose-100 to-pink-100 text-rose-800 border border-rose-200";
      default:
        return "bg-gradient-to-r from-gray-100 to-gray-100 text-gray-800 border border-gray-200";
    }
  };

  const getRowBackgroundColor = (status) => {
    switch (status) {
      case "Available":
        return "hover:bg-white/90 transition-all duration-200";
      case "Need to Restock":
        return "bg-gradient-to-r from-amber-50/80 to-orange-50/80 hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50 transition-all duration-200 border-l-4 border-amber-400";
      case "Not Available":
        return "bg-gradient-to-r from-rose-50/80 to-pink-50/80 hover:bg-gradient-to-r hover:from-rose-50 hover:to-pink-50 transition-all duration-200 border-l-4 border-rose-400";
      default:
        return "hover:bg-white/90 transition-all duration-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Available":
        return "✅";
      case "Need to Restock":
        return "⚠️";
      case "Not Available":
        return "❌";
      default:
        return "❓";
    }
  };

  // Enhanced: Add item with Supabase integration
  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!formData.item_name || !formData.price || !formData.quantity) return;

    const newItemData = {
      item_name: formData.item_name,
      price: parseFloat(formData.price),
      quantity: parseInt(formData.quantity),
      min_stock: parseInt(formData.min_stock)
    };

    const result = await addInventoryItem(newItemData);
    
    if (result.success) {
      const updatedItems = [...menuItems, result.data];
      
      setFormData({ item_name: "", price: "", quantity: "", min_stock: "5" });
      setIsAddModalOpen(false);
      setUpdateAlert(`🎉 "${result.data.item_name}" added to inventory with ${result.data.quantity} units!`);
      setTimeout(() => setUpdateAlert(""), 3000);
      
      // CRITICAL: Proper event dispatching for new items
      saveMenuItems(updatedItems, 'add', result.data);
    } else {
      setUpdateAlert(" Failed to add item to database!");
      setTimeout(() => setUpdateAlert(""), 3000);
    }
  };

  // Enhanced: Edit item with Supabase integration
  const handleEditItem = async (e) => {
    e.preventDefault();
    if (!formData.item_name || !formData.price || !formData.quantity) return;

    const previousQuantity = editingItem.quantity;
    const newQuantity = parseInt(formData.quantity);
    const wasOutOfStock = previousQuantity === 0;
    const isNowInStock = newQuantity > 0;

    const updatedItem = {
      ...editingItem,
      item_name: formData.item_name,
      price: parseFloat(formData.price),
      quantity: newQuantity,
      min_stock: parseInt(formData.min_stock)
    };

    const result = await updateInventoryItem(updatedItem);
    
    if (result.success) {
      const updatedItems = menuItems.map(item =>
        item.item_id === editingItem.item_id ? updatedItem : item
      );
      
      setFormData({ item_name: "", price: "", quantity: "", min_stock: "5" });
      setIsEditModalOpen(false);
      setEditingItem(null);
      
      if (wasOutOfStock && isNowInStock) {
        setUpdateAlert(` "${updatedItem.item_name}" is now back in stock with ${newQuantity} units!`);
      } else {
        setUpdateAlert(` "${updatedItem.item_name}" updated successfully!`);
      }
      setTimeout(() => setUpdateAlert(""), 3000);
      
      // CRITICAL: Proper event dispatching for edited items
      saveMenuItems(updatedItems, 'edit', updatedItem);
    } else {
      setUpdateAlert(" Failed to update item in database!");
      setTimeout(() => setUpdateAlert(""), 3000);
    }
  };

  //  Enhanced: Delete item with Supabase integration
  // const handleDeleteItem = async (itemId) => {
  //   const itemToDelete = menuItems.find(item => item.item_id === itemId);
  //   if (window.confirm(`Are you sure you want to delete "${itemToDelete?.item_name}"?`)) {
      
  //     const result = await deleteInventoryItem(itemId);
      
  //     if (result.success) {
  //       const updatedItems = menuItems.filter(item => item.item_id !== itemId);
        
  //       setUpdateAlert(` "${itemToDelete?.item_name}" removed from inventory!`);
  //       setTimeout(() => setUpdateAlert(""), 3000);
        
  //       // CRITICAL: Proper event dispatching for deleted items
  //       saveMenuItems(updatedItems, 'delete', itemToDelete);
  //     } else {
  //       setUpdateAlert(" Failed to delete item from database!");
  //       setTimeout(() => setUpdateAlert(""), 3000);
  //     }
  //   }
  // };
  const handleDeleteItem = async (itemId) => {
  const itemToDelete = menuItems.find(item => item.item_id === itemId);
  if (window.confirm(`Are you sure you want to delete "${itemToDelete?.item_name}"?`)) {
    
    const result = await deleteInventoryItem(itemId);
    
    if (result.success) {
      const updatedItems = menuItems.filter(item => item.item_id !== itemId);
      setMenuItems(updatedItems);
      
      setUpdateAlert(`🗑️ "${itemToDelete?.item_name}" removed from inventory!`);
      setTimeout(() => setUpdateAlert(""), 3000);
      
      saveMenuItems(updatedItems, 'delete', itemToDelete);
    } else {
      // Handle foreign key constraint error specifically
      if (result.error && (result.error.includes('foreign key constraint') || result.error.includes('violates'))) {
        setUpdateAlert(` Cannot delete "${itemToDelete?.item_name}" - it's referenced in existing orders! Use "Mark as Inactive" instead.`);
      } else {
        setUpdateAlert(` Failed to delete: ${result.error}`);
      }
      setTimeout(() => setUpdateAlert(""), 3000);
    }
  }
};


  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      item_name: item.item_name,
      price: item.price.toString(),
      quantity: (item.quantity || 0).toString(),
      min_stock: (item.min_stock || 5).toString()
    });
    setIsEditModalOpen(true);
  };

  const closeModals = () => {
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setEditingItem(null);
    setFormData({ item_name: "", price: "", quantity: "", min_stock: "5" });
  };

  const displayQuantity = (item) => {
    const status = getItemStatus(item.quantity, item.min_stock);
    if (status === "Not Available") {
      return "0 units";
    }
    return `${item.quantity} units`;
  };

  // Calculate statistics
  const availableItems = menuItems.filter(item => getItemStatus(item.quantity, item.min_stock) === "Available").length;
  const restockItems = menuItems.filter(item => getItemStatus(item.quantity, item.min_stock) === "Need to Restock").length;
  const unavailableItems = menuItems.filter(item => getItemStatus(item.quantity, item.min_stock) === "Not Available").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
      <AdminNavbar />

      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">

          {/*  Enhanced: Update Alert with better styling */}
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
                  Inventory Management
                </h2>
                <p className="text-sm text-amber-700 font-medium mt-1">
                  Manage your restaurant menu items and stock levels • Database sync enabled
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm text-green-700 font-medium bg-white/80 backdrop-blur-sm rounded-2xl px-4 py-2 border border-green-200/50">
                  🗄️ Database Connected
                </div>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="group bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white px-6 py-3 rounded-2xl font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
                  </svg>
                  Add New Item
                </button>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            {/* Total Items */}
            <div className="group relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-6 border border-amber-200/50 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-600/8 to-orange-600/8 rounded-3xl" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-amber-900">Total Items</h3>
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z"/>
                      <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd"/>
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-black bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  {menuItems.length}
                </p>
              </div>
            </div>

            {/* Available Items */}
            <div className="group relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-6 border border-emerald-200/50 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-600/8 to-emerald-600/8 rounded-3xl" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-teal-900">Available</h3>
                  <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-black bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                  {availableItems}
                </p>
              </div>
            </div>

            {/* Need to Restock */}
            <div className="group relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-6 border border-orange-200/50 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-600/8 to-amber-600/8 rounded-3xl" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-orange-900">Need Restock</h3>
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-black bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                  {restockItems}
                </p>
              </div>
            </div>

            {/* Not Available */}
            <div className="group relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-6 border border-rose-200/50 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-rose-600/8 to-pink-600/8 rounded-3xl" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-rose-900">Not Available</h3>
                  <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-black bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
                  {unavailableItems}
                </p>
              </div>
            </div>
          </div>

          {/* Inventory Table */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-amber-200/50 overflow-hidden">
            <div className="px-8 py-6 border-b border-amber-200/50 bg-gradient-to-r from-amber-50/50 to-orange-50/50">
              <h3 className="text-2xl font-bold text-amber-900">Menu Items</h3>
              <p className="text-sm text-amber-700 font-medium">Manage your restaurant inventory and stock levels • Events dispatch to dashboard</p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200/50">
                    <th className="px-8 py-4 text-left text-xs font-bold text-amber-800 uppercase tracking-wider">Item</th>
                    <th className="px-8 py-4 text-left text-xs font-bold text-amber-800 uppercase tracking-wider">Price</th>
                    <th className="px-8 py-4 text-left text-xs font-bold text-amber-800 uppercase tracking-wider">Quantity</th>
                    <th className="px-8 py-4 text-left text-xs font-bold text-amber-800 uppercase tracking-wider">Min Stock</th>
                    <th className="px-8 py-4 text-left text-xs font-bold text-amber-800 uppercase tracking-wider">Status</th>
                    <th className="px-8 py-4 text-left text-xs font-bold text-amber-800 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white/60 divide-y divide-amber-200/50">
                  {menuItems.map((item, index) => {
                    const status = getItemStatus(item.quantity, item.min_stock);
                    return (
                      <tr key={item.item_id} className={getRowBackgroundColor(status)}>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-md">
                              {index + 1}
                            </div>
                            <div className="text-sm font-semibold text-amber-900 capitalize">{item.item_name}</div>
                          </div>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="text-lg font-bold text-amber-900">₹{item.price.toFixed(2)}</div>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className={`text-sm font-semibold ${status === "Not Available" ? "text-rose-800" : "text-amber-900"}`}>
                            {displayQuantity(item)}
                          </div>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="text-sm font-medium text-amber-800">{item.min_stock || 5} units</div>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-medium ${getStatusColor(status)}`}>
                            {getStatusIcon(status)} {status}
                          </span>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="flex gap-2">
                            <button
                              onClick={() => openEditModal(item)}
                              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-3 py-2 rounded-xl font-semibold text-xs flex items-center gap-1 shadow-md hover:shadow-lg transition-all duration-300"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                              </svg>
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.item_id)}
                              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-3 py-2 rounded-xl font-semibold text-xs flex items-center gap-1 shadow-md hover:shadow-lg transition-all duration-300"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/>
                              </svg>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Add Item Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/20 flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl border border-amber-200/50">
            <h3 className="text-2xl font-bold text-amber-900 mb-6">Add New Item</h3>
            <form onSubmit={handleAddItem}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-amber-800 mb-2">Item Name</label>
                  <input
                    type="text"
                    value={formData.item_name}
                    onChange={(e) => setFormData({...formData, item_name: e.target.value})}
                    className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white/80"
                    placeholder="Enter item name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-amber-800 mb-2">Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white/80"
                    placeholder="Enter price in rupees"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-amber-800 mb-2">Quantity</label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white/80"
                    placeholder="Enter quantity"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-amber-800 mb-2">Minimum Stock Level</label>
                  <input
                    type="number"
                    value={formData.min_stock}
                    onChange={(e) => setFormData({...formData, min_stock: e.target.value})}
                    className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white/80"
                    placeholder="Enter minimum stock level"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-4 mt-8">
                <button
                  type="button"
                  onClick={closeModals}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-3 rounded-xl font-semibold transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-300"
                >
                  Add Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/20 flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl border border-amber-200/50">
            <h3 className="text-2xl font-bold text-amber-900 mb-6">Edit Item</h3>
            <form onSubmit={handleEditItem}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-amber-800 mb-2">Item Name</label>
                  <input
                    type="text"
                    value={formData.item_name}
                    onChange={(e) => setFormData({...formData, item_name: e.target.value})}
                    className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white/80"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-amber-800 mb-2">Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white/80"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-amber-800 mb-2">Quantity</label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white/80"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-amber-800 mb-2">Minimum Stock Level</label>
                  <input
                    type="number"
                    value={formData.min_stock}
                    onChange={(e) => setFormData({...formData, min_stock: e.target.value})}
                    className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white/80"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-4 mt-8">
                <button
                  type="button"
                  onClick={closeModals}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-3 rounded-xl font-semibold transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-300"
                >
                  Update Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
