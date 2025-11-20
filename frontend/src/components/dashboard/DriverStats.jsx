import { RefreshCw, DollarSign, Clock, Calendar } from "lucide-react"
import { calculateMonthlyStats } from "../../data/mockData"

// Lấy statistics tháng này cho user (user_id: 1)
const monthlyStats = calculateMonthlyStats(1);

// Mảng 3 stat card - Hiển thị thông số driver tháng này
const stats = [
  {
    label: "Total Swaps",            // Tổng số swap
    value: monthlyStats.totalSwaps.toString(),  // Số swap (ví dụ: 12)
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    icon: RefreshCw
  },
  {
    label: "Total Cost",             // Tổng chi phí
    value: `$${(monthlyStats.totalCost / 1000).toFixed(2)}`,  // Chi phí chia 1000 (ví dụ: $5.25)
    color: "text-green-600",
    bgColor: "bg-green-50",
    icon: DollarSign
  },
  {
    label: "Avg. Time",              // Thời gian trung bình
    value: `${monthlyStats.avgTime} min`,  // Thời gian phút (ví dụ: 8 min)
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    icon: Clock
  },
]

// Component hiển thị statistics driver tháng này
export default function DriverStats() {
  return (
    // Hộp stats - Nền trắng, shadow, border xám
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      {/* Header: Icon calendar + tiêu đề "This Month" */}
      <div className="flex items-center gap-2 mb-6">
        <Calendar className="w-5 h-5 text-gray-800" />  {/* Icon lịch */}
        <h2 className="text-xl font-bold text-gray-800">This Month</h2>
      </div>
      
      {/* Lặp qua 3 stat để hiển thị từng card */}
      <div className="space-y-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon  // Lấy icon từ mảng stats
          return (
            <div key={index} className={`bg-gray-200 rounded-lg p-4 flex justify-between items-center`}>
              {/* Phần trái: Icon + label */}
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5 text-indigo-700" />  {/* Icon (RefreshCw / DollarSign / Clock) */}
                <span className="text-gray-700 font-medium">{stat.label}</span>
              </div>
              {/* Phần phải: Giá trị stat to lớn */}
              <span className={`font-bold text-2xl text-indigo-700`}>
                {stat.value}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
