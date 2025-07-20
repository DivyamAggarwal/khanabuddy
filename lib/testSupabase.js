import { supabase } from './supabase'

export async function testConnection() {
  console.log('🔍 Testing Supabase connection...')
  
  try {
    // Test 1: Basic connection
    const { data: basicTest, error: basicError } = await supabase
      .from('orders')
      .select('count', { count: 'exact', head: true })
    
    console.log('✅ Basic connection test:', { count: basicTest, error: basicError })
    
    // Test 2: Get all orders with detailed logging
    const { data: allOrders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
    
    console.log('📊 All orders in database:', allOrders)
    console.log('❌ Orders query error:', ordersError)
    
    // ✅ NEW: Log each order's details individually
    if (allOrders && allOrders.length > 0) {
      console.log('🔍 DETAILED ORDER ANALYSIS:')
      allOrders.forEach((order, index) => {
        console.log(`\n--- ORDER ${index + 1} ---`)
        console.log('ID:', order.id)
        console.log('Customer Name:', order.customer_name)
        console.log('Status:', order.status)
        console.log('Total:', order.total_amount)
        console.log('Phone:', order.customer_phone)
        console.log('Order Time:', order.order_time)
        console.log('All Order Fields:', Object.keys(order))
      })
    }
    
    // Test 3: Get orders with items and detailed item logging
    const { data: ordersWithItems, error: joinError } = await supabase
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
      .in('status', ['preparing', 'ready'])
    
    console.log('🔗 Orders with items:', ordersWithItems)
    console.log('❌ Join query error:', joinError)
    
    // ✅ NEW: Log each order's items individually
    if (ordersWithItems && ordersWithItems.length > 0) {
      console.log('🔍 DETAILED ORDER ITEMS ANALYSIS:')
      ordersWithItems.forEach((order, orderIndex) => {
        console.log(`\n--- ORDER ${orderIndex + 1} ITEMS ---`)
        console.log('Order ID:', order.id)
        console.log('Customer:', order.customer_name)
        console.log('Order Items Array:', order.order_items)
        
        if (order.order_items && order.order_items.length > 0) {
          order.order_items.forEach((item, itemIndex) => {
            console.log(`  Item ${itemIndex + 1}:`)
            console.log('    - Item Name:', item.item_name)
            console.log('    - Quantity:', item.quantity)
            console.log('    - Unit Price:', item.unit_price)
            console.log('    - Total Price:', item.total_price)
            console.log('    - All Item Fields:', Object.keys(item))
          })
        } else {
          console.log('  ⚠️ No items found for this order')
        }
      })
    }
    
    // Test 4: Count items in each table
    const tables = ['orders', 'order_items', 'inventory_items']
    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
      
      console.log(`📈 ${table} table count:`, count, error ? `Error: ${error.message}` : '')
    }
    
    // ✅ NEW: Check actual order_items table content
    const { data: allOrderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .limit(5)
    
    console.log('🔍 SAMPLE ORDER_ITEMS:', allOrderItems)
    if (allOrderItems && allOrderItems.length > 0) {
      console.log('First order item fields:', Object.keys(allOrderItems[0]))
    }
    
    return true
    
  } catch (err) {
    console.error('❌ Connection test failed:', err)
    return false
  }
}
