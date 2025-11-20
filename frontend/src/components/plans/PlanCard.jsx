import { Button } from "../ui/button"

// Component card gói plan - Hiển thị thông tin gói subscription và nút đăng ký
export default function PlanCard({ 
  plan,           // Thông tin gói (name, description, price, features, period)
  onSubscribe,    // Callback khi user click subscribe
  subscribed,     // User đã đăng ký gói này chưa
  loading         // Đang load (disable button)
}) {
  // Kiểm tra user đã subscribed gói này hay chưa
  const inUse = Boolean(subscribed)

  return (
    // Card container - Nền trắng, border xám, flex cao đầy
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 h-full flex flex-col">
      {/* Nội dung card - Flex lấy không gian có sẵn */}
      <div className="flex-1">
        {/* Header: Tên gói + Giá */}
        <div className="flex items-start justify-between gap-4">
          {/* Phần trái: Tên + mô tả */}
          <div className="min-w-0">
            {/* Tên gói */}
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-gray-800 truncate">{plan.name}</h3>
            </div>
            {/* Mô tả gói - Text nhỏ xám */}
            <p className="text-sm text-gray-600">{plan.description}</p>
          </div>
          {/* Phần phải: Giá + kỳ hạn */}
          <div className="text-right">
            {/* Giá tiền - To đậm */}
            <div className="text-2xl font-bold text-gray-900">{plan.price}</div>
            {/* Kỳ hạn (Monthly, Yearly) - Nhỏ xám */}
            <div className="text-sm text-gray-500">{plan.period}</div>
          </div>
        </div>
        
        {/* Badge "Active subscription" - Hiển thị nếu user đã subscribe */}
        {inUse && (
          <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-0.5 text-xs font-medium text-green-700 mt-3">
            Active subscription
          </span>
        )}
        
        {/* Danh sách features/tính năng của gói */}
        <ul className="mt-4 space-y-2">
          {plan.features.map((f, i) => (
            <li key={i} className="text-sm text-gray-600">• {f}</li>
          ))}
        </ul>
      </div>

      {/* Footer: Nút subscribe/subscribed */}
      <div className="mt-6">
        <Button 
          className="w-full" 
          onClick={() => onSubscribe(plan)}  // Gọi callback với thông tin gói
          disabled={loading || inUse}         // Disable nếu đang load hoặc đã subscribe
          variant={inUse ? "outline" : "default"}  // Outline style nếu đã subscribe
        >
          {inUse ? 'Subscribed' : 'Subscribe'}
        </Button>
      </div>
    </div>
  )
}