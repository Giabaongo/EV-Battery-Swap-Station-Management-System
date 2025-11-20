import React from 'react';
import { ListOrdered } from 'lucide-react';

// Component hướng dẫn swap pin - Hiển thị 3 bước user cần thực hiện
export default function InstructionsCard() {
  // Mảng 3 bước hướng dẫn swap pin
  const instructions = [
    'Arrive at the station within the specified time',      // Bước 1: Đến trạm đúng giờ
    'Present your booking code at the station',             // Bước 2: Xuất trình mã đặt lịch
    'Follow the instructions to complete the battery swap'  // Bước 3: Thực hiện swap
  ];

  return (
    // Hộp hướng dẫn - Nền xám nhạt, bo góc
    <div className="bg-gray-50 rounded-lg p-5">
      {/* Header hướng dẫn - Icon + tiêu đề */}
      <div className="flex items-center gap-2 mb-4">
        <ListOrdered className="w-5 h-5 text-blue-700" />  {/* Icon danh sách */}
        <h3 className="font-bold text-gray-900 text-lg">Instructions</h3>
      </div>
      
      {/* Lặp qua 3 bước hướng dẫn */}
      <div className="space-y-3">
        {instructions.map((instruction, index) => (
          <div key={index} className="flex gap-3">
            {/* Số thứ tự - Hình tròn xanh với số (1, 2, 3) */}
            <div className="flex-shrink-0 w-7 h-7 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
              {index + 1}  {/* Hiển thị 1, 2, 3 */}
            </div>
            {/* Nội dung hướng dẫn bước này */}
            <p className="text-sm text-gray-700 pt-1">
              {instruction}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

