import React from 'react';
import { CheckCircle, X } from 'lucide-react';

// Component header tái sử dụng cho màn hình thành công/hủy booking
export default function BookingSuccessHeader({
  title = 'Booking Successful!',              // Tiêu đề (mặc định: "Booking Successful!")
  subtitle = 'Your battery swap has been successfully scheduled',  // Tiêu đề phụ
  variant = 'success',  // Kiểu variant - 'success' hiển thị checkmark xanh, 'cancel' hiển thị X đỏ
}) {
  // Kiểm tra variant để xác định hiển thị theo loại
  const isCancel = variant === 'cancel';

  return (
    <>
      {/* Icon hình tròn - Xanh nếu success, đỏ nếu cancel */}
      <div className="flex justify-center mb-6">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center ${isCancel ? 'bg-red-100' : 'bg-green-100'}`}>
          {isCancel ? (
            // Icon X để hiển thị hủy booking
            <X className="w-12 h-12 text-red-600" strokeWidth={3} />
          ) : (
            // Icon CheckCircle để hiển thị booking thành công
            <CheckCircle className="w-12 h-12 text-green-600" strokeWidth={3} />
          )}
        </div>
      </div>

      {/* Tiêu đề chính */}
      <h1 className="text-3xl font-bold text-gray-900 text-center mb-2">
        {title}
      </h1>
      
      {/* Tiêu đề phụ - Mô tả chi tiết */}
      <p className="text-gray-600 text-center mb-8">
        {subtitle}
      </p>
    </>
  );
}
