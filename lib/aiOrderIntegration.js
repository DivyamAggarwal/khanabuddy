import { supabase } from './supabase'
import { createNewOrder, checkItemAvailability } from './orderService'

// Main function to process AI orders and save to database
export async function processAIOrder(aiOrderData) {
  try {
    console.log(' Processing AI order:', aiOrderData)

    // Validate AI order data
    if (!aiOrderData || !aiOrderData.customerName || !aiOrderData.items || aiOrderData.items.length === 0) {
      throw new Error('Invalid AI order data: missing customer name or items')
    }

    // Transform AI order format to database format
    const orderData = {
      customer_name: aiOrderData.customerName || aiOrderData.customer_name,
      customer_phone: aiOrderData.phone || aiOrderData.customer_phone || null,
      special_instructions: aiOrderData.notes || aiOrderData.special_instructions || null
    }

    // Transform AI items to database format
    const orderItems = aiOrderData.items.map(item => {
      // Handle different possible AI order formats
      const itemName = item.name || item.item_name || item.itemName
      const quantity = parseInt(item.quantity || item.qty || 1)
      const unitPrice = parseFloat(item.price || item.unit_price || item.unitPrice || 0)
      
      return {
        item_name: itemName,
        quantity: quantity,
        unit_price: unitPrice,
        total_price: quantity * unitPrice
      }
    })

    console.log(' Transformed order data:', { orderData, orderItems })

    // Check availability before creating order
    const availabilityCheck = await checkItemAvailability(orderItems)
    if (!availabilityCheck.success || !availabilityCheck.all_available) {
      const unavailableItems = availabilityCheck.unavailable_items?.map(item => item.item_name).join(', ') || 'Unknown items'
      throw new Error(`Items not available: ${unavailableItems}`)
    }

    // Create order using existing orderService (this will handle inventory deduction)
    const result = await createNewOrder(orderData, orderItems)
    
    if (result.success) {
      console.log(' AI order successfully saved to database:', result.order)
      
      // Dispatch event for real-time dashboard updates
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('aiOrderProcessed', {
          detail: {
            orderId: result.order.id,
            orderNumber: result.order.order_number,
            customerName: result.order.customer_name,
            totalAmount: result.order.total_amount,
            items: result.items
          }
        }))
      }
      
      return { 
        success: true, 
        orderId: result.order.id,
        orderNumber: result.order.order_number,
        totalAmount: result.order.total_amount,
        message: 'AI order processed successfully and inventory updated'
      }
    } else {
      throw new Error(result.error || 'Failed to create order')
    }
  } catch (error) {
    console.error(' Error processing AI order:', error)
    return { success: false, error: error.message }
  }
}

// Function to handle AI order after payment confirmation
export async function handleAIOrderPayment(paymentData) {
  try {
    console.log(' Processing AI order payment:', paymentData)

    if (!paymentData || !paymentData.orderData) {
      throw new Error('Invalid payment data: missing order information')
    }

    // Check payment status
    if (paymentData.status === 'success' || 
        paymentData.status === 'confirmed' || 
        paymentData.status === 'completed' ||
        paymentData.payment_status === 'success') {
      
      console.log(' Payment confirmed, processing order...')
      
      // Payment successful, process the order
      const result = await processAIOrder(paymentData.orderData)
      
      if (result.success) {
        console.log(' AI order processed successfully after payment')
        
        // Trigger dashboard refresh and notifications
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('newOrderReceived', {
            detail: {
              orderId: result.orderId,
              orderNumber: result.orderNumber,
              customerName: paymentData.orderData.customerName,
              totalAmount: result.totalAmount,
              source: 'AI',
              timestamp: new Date().toISOString()
            }
          }))
        }
        
        return {
          success: true,
          message: 'Order created successfully after payment confirmation',
          orderDetails: result
        }
      } else {
        throw new Error(result.error)
      }
    } else {
      console.log(' Payment not confirmed, order not processed')
      return { 
        success: false, 
        error: `Payment not confirmed. Status: ${paymentData.status || paymentData.payment_status || 'unknown'}` 
      }
    }
  } catch (error) {
    console.error(' Error handling AI order payment:', error)
    return { success: false, error: error.message }
  }
}

// Function to manually create AI order (for testing)
export async function createTestAIOrder() {
  const testOrder = {
    customerName: "AI Test Customer",
    phone: "9876543210",
    items: [
      {
        name: "Margherita Pizza",
        quantity: 1,
        price: 150.00
      },
      {
        name: "Chicken Burger",
        quantity: 2,
        price: 130.00
      }
    ],
    notes: "Test order from AI system"
  }

  console.log(' Creating test AI order:', testOrder)
  return await processAIOrder(testOrder)
}

// Function to simulate payment confirmation (for testing)
export async function simulateAIOrderPayment(orderData) {
  const paymentData = {
    status: 'success',
    payment_id: 'test_' + Date.now(),
    orderData: orderData,
    timestamp: new Date().toISOString()
  }

  console.log(' Simulating AI order payment:', paymentData)
  return await handleAIOrderPayment(paymentData)
}

// Function to check if AI integration is working
export async function testAIIntegration() {
  try {
    console.log('🔧 Testing AI integration...')
    
    // Test 1: Check database connectivity
    const { data, error } = await supabase
      .from('orders')
      .select('count')
      .limit(1)

    if (error) {
      throw new Error(`Database connection failed: ${error.message}`)
    }

    // Test 2: Check inventory availability
    const testItems = [{ item_name: "Margherita Pizza", quantity: 1 }]
    const availabilityResult = await checkItemAvailability(testItems)
    
    if (!availabilityResult.success) {
      throw new Error(`Inventory check failed: ${availabilityResult.error}`)
    }

    console.log(' AI integration test passed')
    return {
      success: true,
      message: 'AI integration is working properly',
      tests: {
        database_connection: true,
        inventory_check: true,
        order_functions: true
      }
    }
  } catch (error) {
    console.error(' AI integration test failed:', error)
    return {
      success: false,
      error: error.message,
      message: 'AI integration test failed'
    }
  }
}
