import { useState, useEffect } from 'react'
import { getAdminLoginHistory } from '../../lib/adminAuth'

export default function AdminLoginHistory() {
  const [loginHistory, setLoginHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLoginHistory()
  }, [])

  const fetchLoginHistory = async () => {
    setLoading(true)
    const result = await getAdminLoginHistory()
    if (result.success) {
      setLoginHistory(result.data)
    }
    setLoading(false)
  }

  // Convert to IST (Indian Standard Time)
  const formatDateTimeIST = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    })
  }

  const formatDateIST = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    })
  }

  const getBrowserName = (userAgent) => {
    if (userAgent.includes('Chrome')) return 'Chrome'
    if (userAgent.includes('Firefox')) return 'Firefox'
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari'
    if (userAgent.includes('Edge')) return 'Edge'
    return 'Unknown Browser'
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">Loading login history...</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Admin Login History</h2>
        <div className="text-sm text-gray-500">
          Time Zone: Indian Standard Time (IST)
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-200">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-200 px-4 py-2 text-left font-semibold">Date</th>
              <th className="border border-gray-200 px-4 py-2 text-left font-semibold">Login Time (IST)</th>
              <th className="border border-gray-200 px-4 py-2 text-left font-semibold">IP Address</th>
              <th className="border border-gray-200 px-4 py-2 text-left font-semibold">Browser</th>
            </tr>
          </thead>
          <tbody>
            {loginHistory.map((session) => (
              <tr key={session.id} className="hover:bg-gray-50">
                <td className="border border-gray-200 px-4 py-2">
                  {formatDateIST(session.created_at)}
                </td>
                <td className="border border-gray-200 px-4 py-2">
                  {formatDateTimeIST(session.login_time)}
                </td>
                <td className="border border-gray-200 px-4 py-2 font-mono text-sm">
                  {session.ip_address || 'Unknown'}
                </td>
                <td className="border border-gray-200 px-4 py-2">
                  {getBrowserName(session.user_agent || '')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {loginHistory.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No login history found. Try logging in first!
        </div>
      )}
      
      <div className="mt-4 text-sm text-gray-600">
        Total logins: <span className="font-semibold">{loginHistory.length}</span>
        <span className="ml-4">All times shown in Indian Standard Time (IST)</span>
      </div>
    </div>
  )
}
