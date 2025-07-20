import { supabase } from './supabase'

// Function to get current IST time (THIS IS THE KEY CHANGE)
function getCurrentISTTime() {
  const now = new Date()
  // Add 5.5 hours (IST offset) to current UTC time
  const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000))
  return istTime.toISOString()
}

// Function to get user's IP address
async function getUserIP() {
  try {
    const response = await fetch('https://api.ipify.org?format=json')
    const data = await response.json()
    return data.ip
  } catch (error) {
    console.error('Could not fetch IP:', error)
    return 'Unknown'
  }
}

// Log admin login with IST timestamps stored directly in database
export async function logAdminLogin() {
  try {
    const istTime = getCurrentISTTime()  // ✅ This stores IST time in database
    const ip = await getUserIP()
    const userAgent = navigator.userAgent

    console.log('Storing IST time:', istTime) // Debug log

    const { data, error } = await supabase
      .from('admin_login_history')
      .insert([
        {
          login_time: istTime,      // IST time stored here
          created_at: istTime,      // IST time stored here  
          ip_address: ip,
          user_agent: userAgent
        }
      ])
      .select()

    if (error) {
      console.error('Error logging admin login:', error)
      return { success: false, error }
    }

    console.log('Admin login logged successfully (IST):', data[0])
    return { success: true, data: data[0] }
  } catch (error) {
    console.error('Error logging admin login:', error)
    return { success: false, error }
  }
}

// Fetch all admin login history
export async function getAdminLoginHistory() {
  try {
    const { data, error } = await supabase
      .from('admin_login_history')
      .select('*')
      .order('login_time', { ascending: false })

    if (error) {
      console.error('Error fetching login history:', error)
      return { success: false, error }
    }

    console.log('Fetched login history:', data) // Debug log
    return { success: true, data }
  } catch (error) {
    console.error('Error fetching login history:', error)
    return { success: false, error }
  }
}
