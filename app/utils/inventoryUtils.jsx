import { supabase } from '../../lib/supabase';

// ✅ PRESERVED: Generic item name mapping (no varieties)
const ITEM_MAPPING = {
  // Voice orders use these names → Maps to inventory names (1:1 mapping)
  "burger": "burger",
  "pizza": "pizza", 
  "fries": "fries",
  "garlic bread": "garlic bread",
  "pasta": "pasta",
  "salad": "salad"
};

// ✅ PRESERVED: Direct lookup function - simple 1:1 mapping
const getInventoryItemName = (orderItemName) => {
  // First try direct match (exact name from payment)
  const directMatch = orderItemName.trim();
  
  // Then try mapping from voice order names
  const mappedName = ITEM_MAPPING[orderItemName.toLowerCase()];
  
  return mappedName || directMatch;
};

// ✅ MIGRATED: Get inventory items from Supabase (was localStorage)
export const getInventoryItems = async () => {
  try {
    const { data: stored, error } = await supabase
      .from('inventory_items')
      .select('*')
      .order('item_name', { ascending: true });
    
    if (error) {
      console.error('Error loading inventory items:', error);
      return [];
    }
    
    if (stored && stored.length > 0) {
      return stored.map(item => ({
        ...item,
        quantity: item.quantity ?? 0,
        price: item.price ?? 0,
        min_stock: item.min_stock ?? 5
      }));
    }
    return [];
  } catch (error) {
    console.error('Error loading inventory items:', error);
    return [];
  }
};

// ✅ PRESERVED: Generic display names only (no varieties)
export const getDisplayName = (itemName) => {
  const nameMap = {
    'pizza': 'pizza',
    'burger': 'burger', 
    'fries': 'fries',
    'garlic bread': 'garlic bread',
    'pasta': 'pasta',
    'salad': 'salad'
  };
  return nameMap[itemName.toLowerCase()] || itemName;
};

// ✅ MIGRATED: Get current inventory status for dashboard (now from Supabase)
export const getCurrentInventoryStatus = async () => {
  try {
    const menuItems = await getInventoryItems();
    
    const getItemStatus = (quantity, minStock = 5) => {
      if (quantity === 0) return "Not Available";
      if (quantity < minStock) return "Need to Restock";
      return "Available";
    };

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
  } catch (error) {
    console.error('Error getting inventory status:', error);
    return {};
  }
};

// ✅ MIGRATED: Calculate dynamic order total (now from Supabase)
export const calculateOrderTotal = async (orderItems) => {
  try {
    const inventoryItems = await getInventoryItems();
    console.log('🧮 Calculating total for order items:', orderItems);
    console.log('📦 Available inventory items:', inventoryItems.map(i => i.item_name));
    
    // Create lookup dictionary with flexible matching
    const inventoryDict = {};
    inventoryItems.forEach(item => {
      // Add by exact name (case-insensitive)
      inventoryDict[item.item_name.toLowerCase()] = item;
      
      // Add by display name variations
      const displayName = getDisplayName(item.item_name);
      inventoryDict[displayName.toLowerCase()] = item;
    });
    
    // Count quantities of each item in the order
    const itemCounts = {};
    orderItems.forEach(orderItem => {
      const normalizedName = (orderItem.name || orderItem).toLowerCase();
      const inventoryName = getInventoryItemName(orderItem);
      const lookupKey = inventoryName.toLowerCase();
      
      itemCounts[lookupKey] = (itemCounts[lookupKey] || 0) + 1;
    });
    
    console.log('📊 Item counts:', itemCounts);
    
    let total = 0;
    const itemDetails = [];
    
    // Calculate total and prepare item details
    Object.entries(itemCounts).forEach(([itemKey, qty]) => {
      const inventoryItem = inventoryDict[itemKey];
      
      console.log(`🔍 Looking up "${itemKey}":`, inventoryItem ? 'FOUND' : 'NOT FOUND');
      
      const isOutOfStock = !inventoryItem || inventoryItem.quantity === 0;
      const isLowStock = inventoryItem && inventoryItem.quantity < (inventoryItem.min_stock || 5) && inventoryItem.quantity > 0;
      
      if (inventoryItem && inventoryItem.quantity > 0) {
        total += inventoryItem.price * qty;
      }
      
      // Use original order item name for display
      const originalName = orderItems.find(item => 
        getInventoryItemName(item).toLowerCase() === itemKey
      ) || itemKey;
      
      itemDetails.push({
        name: originalName,
        quantity: qty,
        isOutOfStock,
        isLowStock,
        price: inventoryItem?.price || 0,
        wasOutOfStock: false
      });
    });
    
    console.log('💰 Total calculated:', total, 'Item details:', itemDetails);
    return { total, itemDetails };
  } catch (error) {
    console.error('Error calculating order total:', error);
    return { total: 0, itemDetails: [] };
  }
};

// ✅ MIGRATED: Reduce inventory quantity (now updates Supabase)
export const reduceInventoryQuantity = async (orderItems) => {
  try {
    const inventoryItems = await getInventoryItems();
    let updated = false;
    const changedItems = [];
    
    console.log('📉 Reducing inventory for order items:', orderItems);
    console.log('📦 Current inventory:', inventoryItems.map(i => `${i.item_name}: ${i.quantity}`));

    // Create a copy for updating
    const updatedInventory = [];
    
    for (const inventoryItem of inventoryItems) {
      let newQuantity = inventoryItem.quantity;
      const originalQuantity = inventoryItem.quantity;
      
      // Check each order item against this inventory item
      orderItems.forEach(orderItem => {
        const inventoryName = getInventoryItemName(orderItem);
        
        // ✅ PRESERVED: Direct string comparison with proper normalization
        if (inventoryName.toLowerCase().trim() === inventoryItem.item_name.toLowerCase().trim()) {
          if (newQuantity > 0) {
            newQuantity -= 1;
            updated = true;
            console.log(`✅ Reduced ${inventoryItem.item_name} from ${originalQuantity} to ${newQuantity}`);
          } else {
            console.log(`⚠️ Cannot reduce ${inventoryItem.item_name} - out of stock`);
          }
        }
      });
      
      if (originalQuantity !== newQuantity) {
        changedItems.push({
          name: getDisplayName(inventoryItem.item_name),
          originalQuantity,
          newQuantity,
          wasOutOfStock: originalQuantity === 0,
          isNowOutOfStock: newQuantity === 0
        });
      }
      
      const updatedItem = {
        ...inventoryItem,
        quantity: Math.max(0, newQuantity)
      };
      
      updatedInventory.push(updatedItem);
      
      // Update individual item in Supabase if quantity changed
      if (originalQuantity !== newQuantity) {
        await supabase
          .from('inventory_items')
          .update({ 
            quantity: Math.max(0, newQuantity),
            updated_at: new Date().toISOString()
          })
          .eq('id', inventoryItem.id);
      }
    }

    if (updated) {
      // ✅ PRESERVED: Dispatch inventory update event
      window.dispatchEvent(new CustomEvent('inventoryUpdated', {
        detail: {
          updatedItems: changedItems,
          changeType: 'order_delivery',
          timestamp: new Date().toISOString()
        }
      }));
      
      console.log('✅ Inventory successfully reduced:', changedItems);
      return true;
    }
    
    console.log('⚠️ No inventory items were reduced');
    return false;
  } catch (error) {
    console.error('❌ Error reducing inventory quantity:', error);
    return false;
  }
};

// ✅ MIGRATED: Check item availability (now checks Supabase)
export const checkItemAvailability = async (orderItems) => {
  try {
    const inventoryItems = await getInventoryItems();
    const unavailableItems = [];
    
    console.log('🔍 Checking availability for:', orderItems);
    
    orderItems.forEach(orderItem => {
      const inventoryName = getInventoryItemName(orderItem);
      const inventoryItem = inventoryItems.find(item => 
        item.item_name.toLowerCase().trim() === inventoryName.toLowerCase().trim()
      );
      
      if (!inventoryItem || inventoryItem.quantity === 0) {
        unavailableItems.push(orderItem);
        console.log(`❌ ${orderItem} is not available`);
      } else {
        console.log(`✅ ${orderItem} is available (${inventoryItem.quantity} in stock)`);
      }
    });
    
    return unavailableItems;
  } catch (error) {
    console.error('Error checking item availability:', error);
    return orderItems;
  }
};

// ✅ MIGRATED: Save inventory items (now saves to Supabase with same event tracking)
export const saveInventoryItems = async (items, changeDetails = null) => {
  try {
    const previousItems = await getInventoryItems();
    
    // Batch update/insert items to Supabase
    for (const item of items) {
      await supabase
        .from('inventory_items')
        .upsert({
          id: item.id,
          item_name: item.item_name,
          price: item.price,
          quantity: item.quantity,
          min_stock: item.min_stock
        }, { 
          onConflict: 'id' 
        });
    }
    
    // ✅ PRESERVED: All the same event tracking logic
    const newlyAvailableItems = [];
    const updatedItems = [];
    const removedItems = [];
    
    items.forEach(currentItem => {
      const previousItem = previousItems.find(prev => prev.id === currentItem.id);
      const displayName = getDisplayName(currentItem.item_name);
      
      if (previousItem) {
        const wasOutOfStock = previousItem.quantity === 0;
        const isNowInStock = currentItem.quantity > 0;
        const quantityChanged = previousItem.quantity !== currentItem.quantity;
        const priceChanged = previousItem.price !== currentItem.price;
        
        if (wasOutOfStock && isNowInStock) {
          newlyAvailableItems.push({
            name: displayName,
            quantity: currentItem.quantity,
            price: currentItem.price,
            previousQuantity: previousItem.quantity
          });
        }
        
        if (quantityChanged || priceChanged) {
          updatedItems.push({
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
        newlyAvailableItems.push({
          name: displayName,
          quantity: currentItem.quantity,
          price: currentItem.price,
          isNewItem: true
        });
      }
    });
    
    previousItems.forEach(previousItem => {
      const stillExists = items.find(item => item.id === previousItem.id);
      if (!stillExists) {
        removedItems.push(getDisplayName(previousItem.item_name));
      }
    });
    
    // ✅ PRESERVED: All the same event dispatching
    const eventDetail = {
      newlyAvailableItems,
      updatedItems,
      removedItems,
      allItems: items.map(item => ({
        ...item,
        displayName: getDisplayName(item.item_name)
      })),
      changeType: changeDetails?.type || 'update',
      changedItem: changeDetails?.changedItem ? {
        ...changeDetails.changedItem,
        displayName: getDisplayName(changeDetails.changedItem.item_name)
      } : null
    };
    
    window.dispatchEvent(new CustomEvent('inventoryUpdated', { detail: eventDetail }));
    
    if (updatedItems.some(item => item.priceChanged) || newlyAvailableItems.length > 0) {
      window.dispatchEvent(new CustomEvent('pricesUpdated', {
        detail: {
          updatedItems: updatedItems.filter(item => item.priceChanged),
          newlyAvailableItems: newlyAvailableItems.filter(item => !item.isNewItem)
        }
      }));
    }
    
    if (updatedItems.some(item => item.quantityChanged)) {
      window.dispatchEvent(new CustomEvent('quantityUpdated', {
        detail: {
          updatedItems: updatedItems.filter(item => item.quantityChanged)
        }
      }));
    }
    
    if (changeDetails?.type === 'add') {
      window.dispatchEvent(new CustomEvent('inventoryItemAdded', { detail: eventDetail }));
    }
    
    if (changeDetails?.type === 'delete' || removedItems.length > 0) {
      window.dispatchEvent(new CustomEvent('inventoryItemRemoved', {
        detail: { removedItems }
      }));
    }
    
  } catch (error) {
    console.error('Error saving inventory items:', error);
  }
};

// ✅ PRESERVED: Format currency utility (unchanged)
export const formatCurrency = (amount) => {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  } catch (error) {
    return `₹${amount.toFixed(2)}`;
  }
};
