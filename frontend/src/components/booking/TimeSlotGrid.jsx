import React from 'react';
import { Clock } from 'lucide-react';

// Component lưới giờ đặt lịch - User chọn giờ muốn swap pin tại trạm
export default function TimeSlotGrid({ 
  timeSlots,           // Mảng các giờ sẵn có (ví dụ: ["10:00", "11:00", "12:00"])
  selectedTimeSlot,    // Giờ được chọn hiện tại (hoặc null nếu chưa chọn)
  onTimeSlotSelect     // Callback khi user click vào 1 giờ
}) {
  return (
    <div className="w-full">
      {/* Tiêu đề phần chọn giờ */}
      <h2 className="text-2xl font-semibold text-gray-800 mb-8">Select time slot</h2>
      
      {/* Lưới các nút giờ - 3 cột, mỗi nút hiển thị 1 giờ */}
      <div className="grid grid-cols-3 gap-4">
        {timeSlots.map((timeSlot, index) => {
          // Kiểm tra giờ này có được chọn không
          const isSelected = selectedTimeSlot === timeSlot;
          // Kiểm tra xem đây có phải nút cuối cùng không
          const isLastSlot = index === timeSlots.length - 1;
          
          return (
            <button
              key={timeSlot}
              onClick={() => onTimeSlotSelect(timeSlot)}  // Gọi callback với giờ được chọn
              className={`
                h-20 rounded-lg border-2 transition-all duration-200 flex items-center justify-center font-medium
                ${isSelected 
                  ? 'border-green-500 bg-green-50 text-green-700'  // Nếu chọn: nền xanh, viền xanh
                  : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'  // Chưa chọn: nền trắng, viền xám
                }
                ${isLastSlot && !isSelected ? 'border-green-500 text-green-700' : ''}
              `}
            >
              {/* Icon clock + giờ */}
              <div className="flex items-center">
                <Clock size={16} className="mr-2" />  {/* Icon đồng hồ */}
                {timeSlot}                             {/* Hiển thị giờ (ví dụ: "14:00") */}
              </div>
            </button>
          );
        })}
      </div>

      {/* Hộp hiển thị thông tin giờ được chọn - Chỉ hiển thị nếu đã chọn giờ */}
      {selectedTimeSlot && (
        <div className="mt-8 p-4 bg-green-50 rounded-lg border border-green-200">
          {/* Tiêu đề chính */}
          <div className="flex items-center text-green-800">
            <Clock size={20} className="mr-2" />  {/* Icon đồng hồ */}
            <span className="font-medium">Selected: {selectedTimeSlot}</span>  {/* Giờ được chọn */}
          </div>
          {/* Ngày đặt (hôm nay) */}
          <p className="text-sm text-green-600 mt-1">
            Today, {new Date().toLocaleDateString()}  {/* Hiển thị ngày hôm nay theo format locale */}
          </p>
        </div>
      )}
    </div>
  );
}