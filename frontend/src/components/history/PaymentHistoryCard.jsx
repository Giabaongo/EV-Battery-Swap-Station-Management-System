import React from 'react';
import { ArrowUpDown } from 'lucide-react';
import FilterControls from './FilterControls';
import PaginationControls from './PaginationControls';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Eye } from 'lucide-react';

// Component bảng lịch sử thanh toán - Hiển thị danh sách giao dịch thanh toán với sắp xếp/lọc
export default function PaymentHistoryCard({
  paymentHistory,           // Mảng lịch sử thanh toán
  loading,                  // Trạng thái loading
  sortBy,                   // Cột sắp xếp (date, amount)
  sortOrder,                // Thứ tự sắp xếp (asc, desc)
  onSort,                   // Callback khi click sắp xếp
  // Filter props
  resultsPerPage,           // Số kết quả mỗi trang
  onResultsPerPageChange,   // Callback thay đổi số kết quả
  timePeriod,               // Khoảng thời gian lọc (week, month, year)
  onTimePeriodChange,       // Callback thay đổi khoảng thời gian
  // Pagination props
  currentPage,              // Trang hiện tại
  totalPages,               // Tổng số trang
  totalResults,             // Tổng số kết quả
  startIndex,               // Vị trí bắt đầu
  endIndex,                 // Vị trí kết thúc
  onPageChange,             // Callback chọn trang
  onPrevious,               // Callback nút previous
  onNext                    // Callback nút next
}) {
  // Component icon sắp xếp - Hiển thị mũi tên tùy theo cột được sắp xếp
  const SortIcon = ({ column }) => {
    if (sortBy !== column) return <ArrowUpDown size={16} className="text-gray-400" />;  // Không sắp xếp: xám
    return sortOrder === 'asc' ? (
      <ArrowUpDown size={16} className="text-green-600" />  // Sắp xếp tăng: xanh
    ) : (
      <ArrowUpDown size={16} className="text-green-600" />  // Sắp xếp giảm: xanh
    );
  };

  const [selectedSwap, setSelectedSwap] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const handleViewDetail = (swap) => {
    setSelectedSwap(swap);
    setDetailOpen(true);
  };

  return (
    // Hộp chính - Nền trắng, rounded, shadow
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Phần filter: Tiêu đề + Dropdown số kết quả + Bộ lọc thời gian */}
      <FilterControls
        title="Payment History"
        resultsPerPage={resultsPerPage}
        onResultsPerPageChange={onResultsPerPageChange}
        timePeriod={timePeriod}
        onTimePeriodChange={onTimePeriodChange}
      />

      {/* Phần bảng */}
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* Header bảng - 4 cột: Date, Package, Price, Time */}
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {/* Cột Date - Có thể sắp xếp */}
              <th className="px-6 py-4 text-left">
                <button
                  onClick={() => onSort('date')}  // Gọi callback sắp xếp theo date
                  className="flex items-center space-x-2 font-semibold text-gray-700 hover:text-green-600 transition-colors"
                >
                  <span>Date</span>
                  <SortIcon column="date" />  {/* Icon mũi tên sort */}
                </button>
              </th>

              {/* Cột Package - Không sắp xếp được */}
              <th className="px-6 py-4 text-left">
                <span className="font-semibold text-gray-700">Package</span>
              </th>

              {/* Cột Amount/Price - Có thể sắp xếp */}
              <th className="px-6 py-4 text-left">
                <button
                  onClick={() => onSort('amount')}  // Gọi callback sắp xếp theo amount
                  className="flex items-center space-x-2 font-semibold text-gray-700 hover:text-green-600 transition-colors"
                >
                  <span>Price</span>
                  <SortIcon column="amount" />  {/* Icon mũi tên sort */}
                </button>
              </th>

              {/* Cột Time - Không sắp xếp được */}
              <th className="px-6 py-4 text-left">
                <span className="font-semibold text-gray-700">Time</span>
              </th>

              {/* Detail Column */}
              <th className="px-6 py-4 text-center">
                <span className="font-semibold text-gray-700">Detail</span>
              </th>
            </tr>
          </thead>

          {/* Body bảng - Hiển thị dòng dữ liệu */}
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              // Trạng thái loading - Spinner + text
              <tr>
                <td colSpan="4" className="px-6 py-12 text-center">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                    <span className="ml-3 text-gray-600">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : paymentHistory.length === 0 ? (
              // Không có dữ liệu
              <tr>
                <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                  No payment history found
                </td>
              </tr>
            ) : (
              // Hiển thị danh sách thanh toán
              paymentHistory.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  {/* Cột 1: Ngày */}
                  <td className="px-6 py-4 text-gray-800">{item.date}</td>
                  {/* Cột 2: Gói/Địa điểm + Phương thức + Trạng thái */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-gray-800">{item.location}</span>
                      <span className="text-xs text-gray-500 mt-1">
                        {item.method?.toUpperCase()} • {item.status}
                      </span>
                    </div>
                  </td>
                  {/* Cột 3: Giá tiền - Hiển thị badge với màu theo trạng thái */}
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      item.status === 'success' 
                        ? 'bg-blue-100 text-blue-800'    // Thành công: xanh dương
                        : item.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'  // Đang chờ: vàng
                        : 'bg-red-100 text-red-800'        // Thất bại: đỏ
                    }`}>
                      {item.amount.toLocaleString()} VND
                    </span>
                  </td>
                  {/* Cột 4: Thời gian */}
                  <td className="px-6 py-4 text-gray-600">{item.time}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetail(item)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Detail</span>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Phần pagination footer - Nút Previous/Next + Số trang */}
      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        totalResults={totalResults}
        startIndex={startIndex}
        endIndex={endIndex}
        onPageChange={onPageChange}
        onPrevious={onPrevious}
        onNext={onNext}
      />





    </div>
  );
}
