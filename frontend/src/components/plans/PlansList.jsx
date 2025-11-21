import React from 'react'
import PlanCard from './PlanCard'

// Component danh sách các gói plan - Hiển thị với phân trang (3 gói/trang)
export default function PlansList({ 
  plans,         // Mảng các gói plan
  onSubscribe,   // Callback khi user click subscribe
  loading        // Đang load
}) {
  // State quản lý trang hiện tại
  const [currentPage, setCurrentPage] = React.useState(1)
  // Số gói hiển thị mỗi trang
  const plansPerPage = 3
  
  // Nếu không có plan: hiển thị thông báo trống
  if (!plans || plans.length === 0) {
    return (
      <div className="bg-white border border-dashed border-gray-200 rounded-lg p-8 text-center">
        <p className="text-gray-600">No plans available at the moment.</p>
      </div>
    )
  }

  // Tính toán phân trang
  const totalPages = Math.ceil(plans.length / plansPerPage)  // Tổng số trang
  const startIndex = (currentPage - 1) * plansPerPage        // Vị trí bắt đầu
  const endIndex = startIndex + plansPerPage                 // Vị trí kết thúc
  const currentPlans = plans.slice(startIndex, endIndex)     // Gói hiển thị trang này

  // Hàm chuyển trang trước (disable ở trang 1)
  const handlePrevious = () => {
    setCurrentPage(prev => Math.max(1, prev - 1))
  }

  // Hàm chuyển trang sau (disable ở trang cuối)
  const handleNext = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1))
  }

  return (
    <div>
      {/* Lưới 3 cột - Hiển thị các PlanCard */}
      <div className="grid lg:grid-cols-3 gap-6">
        {currentPlans.map(plan => (
          <PlanCard
            key={plan.id}
            plan={plan}
            subscribed={false}
            onSubscribe={onSubscribe}
            loading={loading}
          />
        ))}
      </div>

      {/* Phần phân trang - Hiển thị nếu có > 1 trang */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-4">
          {/* Nút Previous */}
          <button
            onClick={handlePrevious}
            disabled={currentPage === 1}  // Disable ở trang 1
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {/* Icon mũi tên trái */}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Danh sách số trang */}
          <div className="flex items-center gap-2">
            {[...Array(totalPages)].map((_, idx) => (
              <button
                key={idx + 1}
                onClick={() => setCurrentPage(idx + 1)}
                className={`h-10 w-10 rounded-lg font-medium transition-colors ${
                  currentPage === idx + 1
                    ? 'bg-blue-700 text-white'  // Trang hiện tại: xanh đậm
                    : 'text-gray-600 hover:bg-gray-100'  // Trang khác: xám
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          {/* Nút Next */}
          <button
            onClick={handleNext}
            disabled={currentPage === totalPages}  // Disable ở trang cuối
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {/* Icon mũi tên phải */}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}

