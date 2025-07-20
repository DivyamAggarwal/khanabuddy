import { supabase } from './supabase'

// Get today's delivered orders with statistics
export async function getTodaysReport() {
  try {
    const today = new Date().toDateString()
    const startOfDay = new Date(today).toISOString()
    const endOfDay = new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000).toISOString()

    // Get delivered orders for today
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
      .eq('action', 'Mark as Delivered')
      .gte('completed_at', startOfDay)
      .lt('completed_at', endOfDay)
      .order('completed_at', { ascending: false })

    if (error) throw error

    // Calculate statistics
    const totalOrders = orders.length
    const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total_amount), 0)
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Format orders for the UI (to match your current structure)
    const formattedOrders = orders.map(order => ({
      id: order.order_number,
      customerName: order.customer_name,
      phone: order.customer_phone,
      items: order.order_items.map(item => `${item.quantity}x ${item.item_name}`),
      total: parseFloat(order.total_amount),
      orderTime: order.order_time,
      deliveredTime: order.completed_at,
      deliveredAt: order.completed_at
    }))

    return {
      success: true,
      data: {
        totalOrders,
        totalRevenue,
        avgOrderValue,
        orders: formattedOrders
      }
    }
  } catch (error) {
    console.error('Error getting today\'s report:', error)
    return { success: false, error }
  }
}

// Clear all delivered orders (admin function)
export async function clearAllDeliveredOrders() {
  try {
    // Delete all delivered orders (cascade will handle order_items)
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('action', 'Mark as Delivered')

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Error clearing delivered orders:', error)
    return { success: false, error }
  }
}

// Get weekly/monthly statistics
export async function getWeeklyStats() {
  try {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const { data: orders, error } = await supabase
      .from('orders')
      .select('total_amount, completed_at')
      .eq('action', 'Mark as Delivered')
      .gte('completed_at', oneWeekAgo)

    if (error) throw error

    const totalOrders = orders.length
    const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total_amount), 0)
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    return {
      success: true,
      data: { totalOrders, totalRevenue, avgOrderValue }
    }
  } catch (error) {
    console.error('Error getting weekly stats:', error)
    return { success: false, error }
  }
}
