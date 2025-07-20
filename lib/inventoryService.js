import { supabase } from './supabase'

// Load all inventory items from Supabase
// export async function loadInventoryItems() {
//   try {
//     const { data, error } = await supabase
//       .from('inventory_items')
//       .select('*')
//       .order('created_at', { ascending: false })

//     if (error) throw error
    
//     // Convert to match your current data structure
//     const formattedItems = data.map(item => ({
//       item_id: item.id.toString(),
//       item_name: item.item_name,
//       price: item.price,
//       quantity: item.quantity,
//       min_stock: item.min_stock
//     }))

//     return { success: true, data: formattedItems }
//   } catch (error) {
//     console.error('Error loading inventory:', error)
//     return { success: false, error }
//   }
// }
export async function loadInventoryItems() {
  try {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    
    const formattedItems = data.map(item => ({
      item_id: item.id.toString(),
      item_name: item.item_name,
      price: item.price,
      quantity: item.quantity,
      min_stock: item.min_stock
    }))

    return { success: true, data: formattedItems }
  } catch (error) {
    console.error('Error loading inventory:', error)
    return { success: false, error: error.message }
  }
}

// Add single item to Supabase
export async function addInventoryItem(item) {
  try {
    const { data, error } = await supabase
      .from('inventory_items')
      .insert([{
        item_name: item.item_name,
        price: item.price,
        quantity: item.quantity,
        min_stock: item.min_stock
      }])
      .select()

    if (error) throw error
    
    // Return in your format
    const newItem = {
      item_id: data[0].id.toString(),
      item_name: data[0].item_name,
      price: data[0].price,
      quantity: data[0].quantity,
      min_stock: data[0].min_stock
    }

    return { success: true, data: newItem }
  } catch (error) {
    console.error('Error adding inventory item:', error)
    return { success: false, error }
  }
}

// Update single item in Supabase
export async function updateInventoryItem(item) {
  try {
    const { data, error } = await supabase
      .from('inventory_items')
      .update({
        item_name: item.item_name,
        price: item.price,
        quantity: item.quantity,
        min_stock: item.min_stock
      })
      .eq('id', parseInt(item.item_id))
      .select()

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error updating inventory item:', error)
    return { success: false, error }
  }
}

// Delete single item from Supabase
export async function deleteInventoryItem(itemId) {
  try {
    const { error } = await supabase
      .from('inventory_items')
      .delete()
      .eq('id', parseInt(itemId))

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Error deleting inventory item:', error)
    return { success: false, error }
  }
}
