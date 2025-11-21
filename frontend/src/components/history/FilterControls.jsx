import React from 'react';

// Component điều khiển bộ lọc - Lọc theo khoảng thời gian và số kết quả hiển thị
export default function FilterControls({
  resultsPerPage,              // Số kết quả mỗi trang (1, 10, 20, 50)
  onResultsPerPageChange,      // Callback khi thay đổi số kết quả
  timePeriod,                  // Khoảng thời gian lọc ('week', 'month', 'year')
  onTimePeriodChange,          // Callback khi thay đổi khoảng thời gian
  title                        // Tiêu đề phần (ví dụ: "Swap History")
}) {
  return (
    // Phần header filter - Nền xám nhạt
    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
      {/* Phần 1: Tiêu đề + Dropdown số kết quả */}
      <div className="flex items-center justify-between mb-4">
        {/* Tiêu đề bên trái */}
        <h2 className="text-xl font-semibold text-gray-800">{title}</h2>

        {/* Dropdown "Show result" bên phải */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Show result:</span>
          {/* Dropdown chọn số kết quả: 1, 10, 20, 50 */}
          <select
            value={resultsPerPage}
            onChange={(e) => onResultsPerPageChange(parseInt(e.target.value))}  // Gọi callback khi chọn
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="1">1</option>
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
        </div>
      </div>

      {/* Phần 2: Bộ lọc khoảng thời gian - 3 nút: Week / Month / Year */}
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-600 mr-2">Show by:</span>
        {/* Group 3 nút filter khoảng thời gian */}
        <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden">
          {/* Nút Week - Lọc theo tuần */}
          <button
            onClick={() => onTimePeriodChange('week')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${timePeriod === 'week'
                ? 'bg-blue-700 text-white'  // Chọn: nền xanh
                : 'bg-white text-gray-700 hover:bg-gray-50'  // Chưa chọn: nền trắng
              }`}
          >
            Week
          </button>
          {/* Nút Month - Lọc theo tháng */}
          <button
            onClick={() => onTimePeriodChange('month')}
            className={`px-4 py-2 text-sm font-medium border-l border-gray-300 transition-colors ${timePeriod === 'month'
                ? 'bg-blue-700 text-white'  // Chọn: nền xanh
                : 'bg-white text-gray-700 hover:bg-gray-50'  // Chưa chọn: nền trắng
              }`}
          >
            Month
          </button>
          {/* Nút Year - Lọc theo năm */}
          <button
            onClick={() => onTimePeriodChange('year')}
            className={`px-4 py-2 text-sm font-medium border-l border-gray-300 transition-colors ${timePeriod === 'year'
                ? 'bg-blue-700 text-white'  // Chọn: nền xanh
                : 'bg-white text-gray-700 hover:bg-gray-50'  // Chưa chọn: nền trắng
              }`}
          >
            Year
          </button>
        </div>
      </div>
    </div>
  );
}

