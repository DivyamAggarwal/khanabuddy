import { supabase } from './supabase'

// Load all active orders with their items
// export async function loadActiveOrders() {
//   try {
//     const { data: orders, error: ordersError } = await supabase
//       .from('orders')
//       .select(`
//         *,
//         order_items (
//           id,
//           inventory_item_id,
//           item_name,
//           quantity,
//           unit_price,
//           total_price,
//           item_status
//         )
//       `)
//       .in('status', ['preparing', 'ready'])
//       .order('order_time', { ascending: true })

//     if (ordersError) throw ordersError

//     return { success: true, data: orders }
//   } catch (error) {
//     console.error('Error loading active orders:', error)
//     return { success: false, error }
//   }
// }
// TEMPORARY SIMPLE VERSION FOR TESTING
export async function loadActiveOrders() {
  try {
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          inventory_item_id,
          item_name,
          quantity,
          unit_price,
          total_price,
          item_status
        )
      `)
      // ✅ UPDATED: Filter out delivered orders using action field
      .neq('action', 'Mark as Delivered')
      .order('created_at', { ascending: false })

    if (ordersError) throw ordersError
    return { success: true, data: orders }
  } catch (error) {
    console.error('Error loading active orders:', error)
    return { success: false, error: error.message }
  }
}




// Load order history (completed orders)
// export async function loadOrderHistory(limit = 50) {
//   try {
//     const { data: orders, error } = await supabase
//       .from('orders')
//       .select(`
//         *,
//         order_items (
//           id,
//           item_name,
//           quantity,
//           unit_price,
//           total_price
//         )
//       `)
//       .eq('action', 'Mark as Delivered')
//       .order('completed_at', { ascending: false })
//       .limit(limit)

//     if (error) throw error
//     return { success: true, data: orders }
//   } catch (error) {
//     console.error('Error loading order history:', error)
//     return { success: false, error }
//   }
// }
export async function loadOrderHistory(limit = 50) {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          item_name,
          quantity,
          unit_price,
          total_price
        )
      `)
      // ✅ UPDATED: Filter by action field for delivered orders
      .eq('action', 'Mark as Delivered')
      .order('completed_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return { success: true, data: orders }
  } catch (error) {
    console.error('Error loading order history:', error)
    return { success: false, error }
  }
}

// Add this function to lib/orderService.js
export async function loadInventoryItems() {
  try {
    console.log('📦 Loading inventory items from Supabase...');
    
    const { data: items, error } = await supabase
      .from('inventory_items')
      .select('*')
      .order('item_name', { ascending: true });

    if (error) {
      console.error('❌ Supabase inventory error:', error);
      throw error;
    }

    console.log('✅ Loaded inventory items from Supabase:', items);
    return { success: true, data: items };
  } catch (error) {
    console.error('❌ Error loading inventory items:', error);
    return { success: false, error: error.message };
  }
}

// Enhanced: Create new order with AI integration support
export async function createNewOrder(orderData, orderItems) {
  try {
    console.log('🆕 Creating new order:', { orderData, orderItems })

    // Validate input data
    if (!orderData.customer_name || !orderItems || orderItems.length === 0) {
      throw new Error('Invalid order data: missing customer name or items')
    }

    // Check inventory availability first
    const availabilityCheck = await checkItemAvailability(orderItems)
    if (!availabilityCheck.success) {
      throw new Error('Failed to check item availability')
    }

    if (!availabilityCheck.all_available) {
      const unavailableItems = availabilityCheck.unavailable_items.map(item => 
        `${item.item_name} (requested: ${item.requested_quantity}, available: ${item.available_quantity})`
      ).join(', ')
      throw new Error(`Insufficient inventory for: ${unavailableItems}`)
    }

    // Calculate total amount
    const totalAmount = orderItems.reduce((sum, item) => sum + (item.total_price || (item.quantity * item.unit_price)), 0)

    // Insert order (triggers will handle order_number, estimated_ready_time, etc.)
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{
        customer_name: orderData.customer_name,
        customer_phone: orderData.customer_phone || null,
        total_amount: totalAmount,
        special_instructions: orderData.special_instructions || null,
        status: 'preparing',
        action: 'In Progress'
      }])
      .select()
      .single()

    if (orderError) throw orderError

    console.log('✅ Order created in database:', order)

    // Prepare order items with inventory linking
    const itemsWithOrderId = await Promise.all(
      orderItems.map(async (item) => {
        // Find inventory item ID by name (case-insensitive)
        const { data: inventoryItem } = await supabase
          .from('inventory_items')
          .select('id, item_name, quantity, price')
          .ilike('item_name', item.item_name.trim())
          .single()

        console.log(`🔍 Found inventory item for "${item.item_name}":`, inventoryItem)

        return {
          order_id: order.id,
          inventory_item_id: inventoryItem?.id || null,
          item_name: item.item_name,
          quantity: parseInt(item.quantity),
          unit_price: parseFloat(item.unit_price || inventoryItem?.price || 0),
          total_price: parseFloat(item.total_price || (item.quantity * (item.unit_price || inventoryItem?.price || 0)))
        }
      })
    )

    // Insert order items
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .insert(itemsWithOrderId)
      .select()

    if (itemsError) throw itemsError

    console.log('✅ Order items created:', items)

    // Deduct inventory stock IMMEDIATELY when order is created
    // const stockDeductionResult = await deductInventoryStock(itemsWithOrderId)
    // if (!stockDeductionResult.success) {
    //   console.warn('⚠️ Warning: Stock deduction failed:', stockDeductionResult.error)
    // }

    // Dispatch event for real-time updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('newOrderCreated', {
        detail: {
          order,
          items,
          customerName: order.customer_name,
          totalAmount: order.total_amount
        }
      }))
    }

    return { success: true, order, items }
  } catch (error) {
    console.error('❌ Error creating new order:', error)
    return { success: false, error: error.message }
  }
}

// Update order status
export async function updateOrderStatus(orderId, newStatus) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error updating order status:', error)
    return { success: false, error }
  }
}

// Mark order as delivered
// export async function markOrderAsDelivered(orderId) {
//   try {
//     const { data, error } = await supabase
//       .from('orders')
//       .update({ 
//         action: 'Mark as Delivered',
//         status: 'ready',
//         completed_at: new Date().toISOString(),
//         updated_at: new Date().toISOString()
//       })
//       .eq('id', orderId)
//       .select()
//       .single()

//     if (error) throw error
//     return { success: true, data }
//   } catch (error) {
//     console.error('Error marking order as delivered:', error)
//     return { success: false, error }
//   }
// }
export async function markOrderAsDelivered(orderId) {
  try {
    // Validate input
    if (!orderId || isNaN(orderId)) {
      throw new Error('Invalid order ID provided')
    }

    console.log('🚀 Marking order as delivered:', orderId)
    
    // Get order items before marking as delivered
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId)

    if (itemsError) {
      console.error('❌ Error fetching order items:', itemsError)
      throw itemsError
    }

    if (!orderItems || orderItems.length === 0) {
      throw new Error('No order items found for this order')
    }

    // Mark order as delivered
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .update({ 
        action: 'Mark as Delivered',
        status: 'ready',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single()

    if (orderError) {
      console.error('❌ Database update error:', orderError)
      throw orderError
    }

    // ✅ FIXED: Better error handling for inventory reduction
    const stockDeductionResult = await deductInventoryStock(orderItems)
    if (!stockDeductionResult.success) {
      console.error('⚠️ Warning: Stock deduction failed upon delivery:', stockDeductionResult.error)
      // Return partial success - order is marked as delivered but inventory update failed
      return { 
        success: true, 
        data: order,
        warning: `Order delivered but inventory update failed: ${stockDeductionResult.error}`,
        inventory_errors: stockDeductionResult.results?.filter(r => !r.success) || []
      }
    } else {
      console.log('✅ Inventory successfully reduced for delivered order')
    }

    console.log('✅ Order marked as delivered successfully:', order)
    return { success: true, data: order }
    
  } catch (error) {
    console.error('❌ Error marking order as delivered:', error)
    return { 
      success: false, 
      error: error.message || error.details || JSON.stringify(error) || 'Unknown error occurred' 
    }
  }
}

// Add this function to validate inventory items
async function validateInventoryItems(orderItems) {
  try {
    const validationResults = []
    
    for (const item of orderItems) {
      if (item.inventory_item_id) {
        const { data: inventoryItem, error } = await supabase
          .from('inventory_items')
          .select('id, item_name, quantity')
          .eq('id', item.inventory_item_id)
          .single()
        
        validationResults.push({
          order_item: item.item_name,
          inventory_item_id: item.inventory_item_id,
          exists: !error && inventoryItem !== null,
          current_quantity: inventoryItem?.quantity || 0,
          requested_quantity: item.quantity,
          sufficient_stock: (inventoryItem?.quantity || 0) >= item.quantity
        })
      }
    }
    
    return validationResults
  } catch (error) {
    console.error('❌ Error validating inventory items:', error)
    return []
  }
}



// Enhanced: Deduct inventory stock when order is placed
// async function deductInventoryStock(orderItems) {
//   try {
//     console.log('📦 Starting inventory stock deduction for:', orderItems)
    
//     const deductionResults = []
    
//     for (const item of orderItems) {
//       if (item.inventory_item_id) {
//         // Get current stock
//         const { data: inventoryItem, error: fetchError } = await supabase
//           .from('inventory_items')
//           .select('id, item_name, quantity')
//           .eq('id', item.inventory_item_id)
//           .single()

//         if (fetchError) {
//           console.error(`❌ Error fetching inventory for item ${item.item_name}:`, fetchError)
//           deductionResults.push({ 
//             item_name: item.item_name, 
//             success: false, 
//             error: fetchError.message 
//           })
//           continue
//         }

//         if (inventoryItem) {
//           const currentQuantity = inventoryItem.quantity
//           const requestedQuantity = item.quantity
//           const newQuantity = Math.max(0, currentQuantity - requestedQuantity)
          
//           console.log(`📊 Inventory update for ${inventoryItem.item_name}: ${currentQuantity} → ${newQuantity} (deducting ${requestedQuantity})`)
          
//           // Update inventory
//           const { error: updateError } = await supabase
//             .from('inventory_items')
//             .update({ 
//               quantity: newQuantity,
//               updated_at: new Date().toISOString()
//             })
//             .eq('id', item.inventory_item_id)

//           if (updateError) {
//             console.error(`❌ Error updating inventory for ${inventoryItem.item_name}:`, updateError)
//             deductionResults.push({ 
//               item_name: item.item_name, 
//               success: false, 
//               error: updateError.message 
//             })
//           } else {
//             console.log(`✅ Successfully updated inventory for ${inventoryItem.item_name}`)
//             deductionResults.push({ 
//               item_name: item.item_name, 
//               success: true, 
//               old_quantity: currentQuantity,
//               new_quantity: newQuantity,
//               deducted: requestedQuantity
//             })

//             // Dispatch inventory update event
//             if (typeof window !== 'undefined') {
//               window.dispatchEvent(new CustomEvent('inventoryUpdated', {
//                 detail: {
//                   updatedItems: [{
//                     name: inventoryItem.item_name,
//                     quantity: newQuantity,
//                     previousQuantity: currentQuantity,
//                     quantityChanged: true
//                   }],
//                   changeType: 'order_deduction',
//                   timestamp: new Date().toISOString()
//                 }
//               }))
//             }
//           }
//         }
//       } else {
//         console.warn(`⚠️ No inventory item ID found for ${item.item_name}, skipping stock deduction`)
//         deductionResults.push({ 
//           item_name: item.item_name, 
//           success: false, 
//           error: 'No inventory item ID found' 
//         })
//       }
//     }

//     const successfulDeductions = deductionResults.filter(result => result.success)
//     const failedDeductions = deductionResults.filter(result => !result.success)

//     console.log(`📦 Inventory deduction complete: ${successfulDeductions.length} successful, ${failedDeductions.length} failed`)

//     return { 
//       success: failedDeductions.length === 0,
//       results: deductionResults,
//       successful_count: successfulDeductions.length,
//       failed_count: failedDeductions.length
//     }
//   } catch (error) {
//     console.error('❌ Error deducting inventory stock:', error)
//     return { success: false, error: error.message }
//   }
// }
// Enhanced: Deduct inventory stock when order is delivered
async function deductInventoryStock(orderItems) {
  try {
    console.log('📦 Starting inventory stock deduction for:', orderItems)
    
    const deductionResults = []
    
    for (const item of orderItems) {
      if (item.inventory_item_id) {
        try {
          // Get current stock
          const { data: inventoryItem, error: fetchError } = await supabase
            .from('inventory_items')
            .select('id, item_name, quantity')
            .eq('id', item.inventory_item_id)
            .single()

          if (fetchError) {
            console.error(`❌ Error fetching inventory for item ${item.item_name}:`, fetchError)
            deductionResults.push({ 
              item_name: item.item_name, 
              success: false, 
              error: fetchError.message || JSON.stringify(fetchError)
            })
            continue
          }

          if (!inventoryItem) {
            console.error(`❌ No inventory item found for ID: ${item.inventory_item_id}`)
            deductionResults.push({ 
              item_name: item.item_name, 
              success: false, 
              error: 'Inventory item not found'
            })
            continue
          }

          const currentQuantity = inventoryItem.quantity || 0
          const requestedQuantity = item.quantity || 0
          const newQuantity = Math.max(0, currentQuantity - requestedQuantity)
          
          console.log(`📊 Inventory update for ${inventoryItem.item_name}: ${currentQuantity} → ${newQuantity} (deducting ${requestedQuantity})`)
          
          // ✅ FIXED: Add better error handling for update
          const { data: updateData, error: updateError } = await supabase
            .from('inventory_items')
            .update({ 
              quantity: newQuantity,
              updated_at: new Date().toISOString()
            })
            .eq('id', item.inventory_item_id)
            .select()

          if (updateError) {
            console.error(`❌ Error updating inventory for ${inventoryItem.item_name}:`, updateError)
            deductionResults.push({ 
              item_name: item.item_name, 
              success: false, 
              error: updateError.message || updateError.details || JSON.stringify(updateError)
            })
          } else {
            console.log(`✅ Successfully updated inventory for ${inventoryItem.item_name}`)
            deductionResults.push({ 
              item_name: item.item_name, 
              success: true, 
              old_quantity: currentQuantity,
              new_quantity: newQuantity,
              deducted: requestedQuantity
            })

            // Dispatch inventory update event
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('inventoryUpdated', {
                detail: {
                  updatedItems: [{
                    name: inventoryItem.item_name,
                    quantity: newQuantity,
                    previousQuantity: currentQuantity,
                    quantityChanged: true
                  }],
                  changeType: 'order_deduction',
                  timestamp: new Date().toISOString()
                }
              }))
            }
          }
        } catch (itemError) {
          console.error(`❌ Unexpected error processing ${item.item_name}:`, itemError)
          deductionResults.push({ 
            item_name: item.item_name, 
            success: false, 
            error: itemError.message || 'Unexpected error occurred'
          })
        }
      } else {
        console.warn(`⚠️ No inventory item ID found for ${item.item_name}, skipping stock deduction`)
        deductionResults.push({ 
          item_name: item.item_name, 
          success: false, 
          error: 'No inventory item ID found' 
        })
      }
    }

    const successfulDeductions = deductionResults.filter(result => result.success)
    const failedDeductions = deductionResults.filter(result => !result.success)

    console.log(`📦 Inventory deduction complete: ${successfulDeductions.length} successful, ${failedDeductions.length} failed`)

    // ✅ FIXED: Better error reporting
    if (failedDeductions.length > 0) {
      console.error('❌ Failed deductions:', failedDeductions)
    }

    return { 
      success: failedDeductions.length === 0,
      results: deductionResults,
      successful_count: successfulDeductions.length,
      failed_count: failedDeductions.length,
      error: failedDeductions.length > 0 ? 
        `Failed to update ${failedDeductions.length} items: ${failedDeductions.map(f => `${f.item_name} (${f.error})`).join(', ')}` : 
        null
    }
  } catch (error) {
    console.error('❌ Error deducting inventory stock:', error)
    return { 
      success: false, 
      error: error.message || error.details || JSON.stringify(error) || 'Unknown error occurred',
      results: []
    }
  }
}

// Enhanced: Check if items are available in sufficient quantity
export async function checkItemAvailability(orderItems) {
  try {
    console.log('🔍 Checking availability for items:', orderItems)
    
    const availabilityChecks = await Promise.all(
      orderItems.map(async (item) => {
        const { data: inventoryItem, error } = await supabase
          .from('inventory_items')
          .select('id, quantity, item_name, price')
          .ilike('item_name', item.item_name.trim())
          .single()

        if (error) {
          console.warn(`⚠️ Inventory item not found: ${item.item_name}`)
          return {
            item_name: item.item_name,
            requested_quantity: item.quantity,
            available_quantity: 0,
            is_available: false,
            error: 'Item not found in inventory'
          }
        }

        const isAvailable = (inventoryItem?.quantity || 0) >= item.quantity

        return {
          item_name: item.item_name,
          requested_quantity: item.quantity,
          available_quantity: inventoryItem?.quantity || 0,
          is_available: isAvailable,
          inventory_id: inventoryItem?.id,
          current_price: inventoryItem?.price
        }
      })
    )

    const unavailableItems = availabilityChecks.filter(check => !check.is_available)
    
    console.log(`🔍 Availability check complete: ${availabilityChecks.length - unavailableItems.length}/${availabilityChecks.length} items available`)

    return {
      success: true,
      all_available: unavailableItems.length === 0,
      availability_checks: availabilityChecks,
      unavailable_items: unavailableItems
    }
  } catch (error) {
    console.error('❌ Error checking item availability:', error)
    return { success: false, error: error.message }
  }
}

// Get today's orders summary
export async function getTodaysOrdersSummary() {
  try {
    const today = new Date().toDateString()
    
    const { data: orders, error } = await supabase
      .from('orders')
      .select('total_amount, status, action')
      .gte('order_time', new Date(today).toISOString())
      .lt('order_time', new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000).toISOString())

    if (error) throw error

    const summary = {
      total_orders: orders.length,
      preparing_orders: orders.filter(o => o.status === 'preparing').length,
      ready_orders: orders.filter(o => o.status === 'ready').length,
      delivered_orders: orders.filter(o => o.action === 'Mark as Delivered').length,
      total_revenue: orders.reduce((sum, order) => sum + parseFloat(order.total_amount), 0)
    }

    return { success: true, data: summary }
  } catch (error) {
    console.error('Error getting today\'s summary:', error)
    return { success: false, error }
  }
}
