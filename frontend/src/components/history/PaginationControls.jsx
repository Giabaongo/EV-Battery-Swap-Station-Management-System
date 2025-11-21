import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Component điều khiển phân trang - Hiển thị nút Previous/Next và số trang
export default function PaginationControls({
  currentPage,      // Trang hiện tại
  totalPages,       // Tổng số trang
  totalResults,     // Tổng số kết quả
  startIndex,       // Vị trí bắt đầu kết quả trên trang này
  endIndex,         // Vị trí kết thúc kết quả trên trang này
  onPageChange,     // Callback khi chọn trang
  onPrevious,       // Callback nút Previous
  onNext            // Callback nút Next
}) {
  // Hàm tạo mảng số trang - Thêm ellipsis (...) nếu quá nhiều trang
  const getPageNumbers = () => {
    const pages = [];
    const showEllipsisThreshold = 7;  // Nếu <= 7 trang: hiển thị all, nếu > 7: thêm ellipsis

    if (totalPages <= showEllipsisThreshold) {
      // Trang ít: hiển thị tất cả
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Trang nhiều: hiển thị smart pagination
      if (currentPage <= 3) {
        // Ở đầu: hiển thị 1,2,3,4...lastPage
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Ở cuối: hiển thị 1...lastPages-3,lastPages-2,lastPages-1,lastPage
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        // Ở giữa: hiển thị 1...current-1,current,current+1...lastPage
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    // Footer phân trang - Nền xám nhạt
    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
      <div className="flex items-center justify-between">
        {/* Phần trái: Hiển thị "Showing X to Y of Z results" */}
        <div className="text-sm text-gray-600">
          Showing {startIndex} to {endIndex} of {totalResults} results
        </div>

        {/* Phần phải: Nút Previous + Trang + Nút Next */}
        <div className="flex items-center space-x-2">
          {/* Nút Previous - Disabled ở trang 1 */}
          <button
            onClick={onPrevious}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center space-x-1">
              <ChevronLeft size={16} />  {/* Icon mũi tên trái */}
              <span>Previous</span>
            </div>
          </button>

          {/* Danh sách số trang với ellipsis */}
          {getPageNumbers().map((pageNum, index) => (
            pageNum === '...' ? (
              // Hiển thị ellipsis (...)
              <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-500">
                ...
              </span>
            ) : (
              // Hiển thị nút số trang
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`px-3 py-1 rounded-md text-sm font-medium ${pageNum === currentPage
                    ? 'bg-blue-700 text-white'      // Trang hiện tại: nền xanh
                    : 'border border-gray-300 text-gray-700 hover:bg-gray-50'  // Trang khác: nền trắng
                  }`}
              >
                {pageNum}
              </button>
            )
          ))}

          {/* Nút Next - Disabled ở trang cuối */}
          <button
            onClick={onNext}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center space-x-1">
              <span>Next</span>
              <ChevronRight size={16} />  {/* Icon mũi tên phải */}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

