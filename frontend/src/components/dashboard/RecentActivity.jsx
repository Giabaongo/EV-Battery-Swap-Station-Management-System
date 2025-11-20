import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader } from "../ui/card"
import { History, CheckCircle, Clock, TrendingUp } from "lucide-react"
import { swapService } from "../../services/swapService"

// Component hiển thị hoạt động gần đây - 3 giao dịch swap mới nhất của user
export default function RecentActivity() {
  // State lưu danh sách giao dịch swap
  const [swapTransactions, setSwapTransactions] = useState([])
  // State lưu trạng thái loading
  const [loading, setLoading] = useState(true)

  // Lấy user từ localStorage - useMemo để tránh re-fetch khi component re-render
  const user = useMemo(() => {
    try {
      const userData = localStorage.getItem('user')
      return userData ? JSON.parse(userData) : null
    } catch {
      return null
    }
  }, [])

  // Fetch lịch sử swap khi component mount hoặc user thay đổi
  useEffect(() => {
    const fetchSwapHistory = async () => {
      // Nếu không có user_id: không lấy dữ liệu
      if (!user?.id) {
        setSwapTransactions([])
        setLoading(false)
        return
      }

      try {
        // Gọi API lấy tất cả giao dịch swap của user
        const transactions = await swapService.getAllSwapTransactionsByUserId(user.id)
        
        // Lấy 3 giao dịch gần đây nhất + format dữ liệu để hiển thị UI
        const recentActivities = (transactions || [])
          .slice(0, 3)  // Chỉ lấy 3 giao dịch đầu
          .map(transaction => ({
            transaction_id: transaction.transaction_id,
            // Format ngày: "Jan 15, 2024"
            date: transaction.createAt 
              ? new Date(transaction.createAt).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric' 
                })
              : 'N/A',
            // Format giờ: "14:30"
            time: transaction.createAt 
              ? new Date(transaction.createAt).toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })
              : 'N/A',
            // Vị trí trạm
            location: `Station ${transaction.station_id}`,
            // Số pin swap (mỗi transaction là 1 pin)
            amount: 1,
            // Trạng thái swap (completed, pending, etc)
            status: transaction.status,
            // Thời gian tạo giao dịch
            createAt: transaction.createAt
          }))
        
        setSwapTransactions(recentActivities)
      } catch (error) {
        console.error('Error fetching swap transactions:', error)
        setSwapTransactions([])
      } finally {
        setLoading(false)
      }
    }

    fetchSwapHistory()
  }, [user?.id])

  return (
    // Card container - Nền trắng, shadow, border xám
    <Card className="bg-white shadow-lg border border-gray-200">
      {/* Header xanh đậm với icon history + "Recent Activity" */}
      <CardHeader className="bg-blue-800 text-white rounded-lg pt-2">
        <div className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5" />  {/* Icon history */}
            <h2 className="text-lg font-bold">Recent Activity</h2>
          </div>
          {/* Nút xem tất cả giao dịch */}
          <button className="text-white hover:text-blue-100 text-sm font-medium underline">
            View All
          </button>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        {/* Trạng thái loading - Hiển thị spinner */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-800"></div>
          </div>
        ) : swapTransactions.length === 0 ? (
          // Trạng thái không có giao dịch
          <div className="text-center py-8 text-gray-500">
            <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No recent swap transactions</p>
          </div>
        ) : (
          // Hiển thị danh sách 3 giao dịch gần đây
          <div className="space-y-4">
            {swapTransactions.map((activity) => (
              <div 
                key={activity.transaction_id}
                className={`bg-gray-200 border rounded-lg p-4 flex justify-between items-center hover:bg-indigo-300 transition-all`}
              >
                {/* Phần trái: Icon + thông tin giao dịch */}
                <div className="flex items-center space-x-4">
                  {/* Icon tròn xanh lá - Check circle */}
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center border-2 border-green-300">
                    <CheckCircle className="text-green-600 w-5 h-5" />
                  </div>
                  {/* Thông tin chi tiết: Trạm, giờ, thời gian */}
                  <div>
                    <p className="font-semibold text-gray-800">{activity.location}</p>
                    {/* Giờ giao dịch + icon clock */}
                    <div className="flex items-center gap-1 text-gray-600 text-sm font-medium">
                      <Clock className="w-3 h-3" />
                      <p>{activity.time}</p>
                    </div>
                    {/* Thời lượng (nếu có) + icon trending */}
                    <div className="flex items-center gap-1 text-gray-700 text-sm">
                      <TrendingUp className="w-3 h-3" />
                      <p>Duration: N/A</p>
                    </div>
                  </div>
                </div>
                {/* Phần phải: Trạng thái + ngày */}
                <div className="text-right">
                  {/* Trạng thái swap (xanh/vàng) */}
                  <p className="text-indigo-500 text-sm font-medium capitalize">{activity.status}</p>
                  {/* Ngày giao dịch */}
                  <p className="text-gray-500 text-xs">{new Date(activity.createAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}