import { Sun, Moon, Cloud, Zap, UserCog } from "lucide-react"

// Component tiêu đề chào mừng - Hiển thị lời chào theo thời gian và nút action swap
// Tính năng: Đổi icon chào mừng (Sun/Moon/Cloud), hiệu ứng theo giờ (morning/afternoon/evening)
export default function WelcomeHeader({ userName = "Alex", onManualSwap, onAutoSwap }) {
  // Lấy giờ hiện tại (0-23)
  const currentHour = new Date().getHours()
  // Xác định lời chào dựa vào giờ hiện tại
  // < 12 (0-11): Morning; 12-17: Afternoon; >= 18: Evening
  const greeting = currentHour < 12 ? "Good morning" : currentHour < 18 ? "Good afternoon" : "Good evening"
  // Chọn icon tương ứng: Sun (sáng), Cloud (chiều), Moon (tối)
  const GreetingIcon = currentHour < 12 ? Sun : currentHour < 18 ? Cloud : Moon

  return (
    <div className="bg-blue-800 rounded-lg p-4 text-white ">
      <div className="flex items-center justify-between">
        {/* Phần trái: Icon chào mừng + Text */}
        <div className="flex items-center gap-3">
          {/* Icon thay đổi theo giờ */}
          <GreetingIcon className="w-8 h-8" />
          <div>
            {/* Lời chào + Tên người dùng */}
            <h1 className="text-2xl font-bold">{greeting}, {userName}</h1>
            {/* Subtitle: "Ready for your next journey?" */}
            <p className="text-blue-100 text-sm">Ready for your next journey?</p>
          </div>
        </div>

        {/* Phần phải: Nút Action (Auto Swap + Manual Swap) */}
        <div className="flex gap-2">
          {/* Nút Auto Swap - Tự động tìm trạm gần nhất và đặt lịch */}
          <button
            onClick={onAutoSwap}  // Callback khi user click
            className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg font-semibold transition-colors"
          >
            <Zap className="w-5 h-5" />  {/* Icon Zap (lightning bolt) */}
            Auto Swap
          </button>
          {/* Manual Swap button - Hiện tại commented out, có thể kích hoạt sau */}
          {/* <button
            onClick={onManualSwap}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg font-semibold transition-colors"
          >
            <UserCog className="w-5 h-5" />
            Manual Swap
          </button> */}
        </div>
      </div>
    </div>
  )
}