import React from 'react';

// Component nút xác nhận đặt lịch - Điều khiển trạng thái enable/disable dựa vào điều kiện
export default function BookingConfirmButton({ 
  selectedTimeSlot,           // Giờ được chọn (ví dụ: "14:00")
  availableSlots,            // Số pin sẵn có tại trạm
  onContinueToConfirmation   // Callback khi user click nút
}) {
  // Kiểm tra nút có được phép click không
  // Nút disabled nếu: chưa chọn giờ HOẶC không có pin sẵn
  const isDisabled = !selectedTimeSlot || availableSlots === 0;
  
  // Hàm lấy text nút dựa vào tình trạng
  // - Nếu không có pin: "No Batteries Available"
  // - Nếu chọn giờ rồi: "Continue to confirmation"
  // - Nếu chưa chọn giờ: "Select time slot to continue"
  const getButtonText = () => {
    if (availableSlots === 0) return 'No Batteries Available';  // Không có pin sẵn
    if (selectedTimeSlot) return 'Continue to confirmation';    // Đã chọn giờ, có thể tiếp tục
    return 'Select time slot to continue';                      // Chưa chọn giờ
  };

  return (
    <div>
      {/* Nút xác nhận */}
      <button
        onClick={onContinueToConfirmation}
        disabled={isDisabled}  // Disable nếu không đạt điều kiện
        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
          // Nếu chọn giờ AND có pin: Nút xanh có thể click
          // Ngược lại: Nút xám, không thể click
          selectedTimeSlot && availableSlots > 0
            ? 'bg-green-600 hover:bg-green-700 text-white' 
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
      >
        {getButtonText()}
      </button>
      
      {/* Text gợi ý: Hiển thị số pin sẵn có nếu chưa chọn giờ */}
      {availableSlots > 0 && !selectedTimeSlot && (
        <p className="text-xs text-gray-500 mt-2 text-center">
          {availableSlots} fully charged batteries ready  {/* Ví dụ: "5 fully charged batteries ready" */}
        </p>
      )}
    </div>
  );
}