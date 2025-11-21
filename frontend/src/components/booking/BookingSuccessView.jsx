import React from 'react';
import BookingSuccessHeader from './BookingSuccessHeader';
import StationInfoCard from './StationInfoCard';
import InstructionsCard from './InstructionsCard';

// Component hiển thị màn hình booking thành công - Xác nhận booking và hướng dẫn tiếp theo
export default function BookingSuccessView({
  stationName,      // Tên trạm sạc
  stationAddress,   // Địa chỉ trạm
  availableSlots,   // Số pin sẵn có
  totalSlots,       // Tổng số pin
  timeRemaining,    // Thời gian còn lại (giây)
  bookingTime,      // Thời gian booking
}) {
  return (
    // Container màn hình - Nền transparent, giữa giữa
    <div className="min-h-screen bg-transparent flex items-center justify-center p-4">
      {/* Hộp chính - Nền trắng, shadow, đủ rộng */}
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-8">
        {/* Header thành công - Hiển thị thông báo booking thành công */}
        <BookingSuccessHeader />
        
        {/* 2 cột: Thông tin trạm + Hướng dẫn */}
        {/* Mobile: 1 cột, Desktop: 2 cột */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Cột 1: Thông tin trạm */}
          <StationInfoCard
            stationName={stationName}
            stationAddress={stationAddress}
            availableSlots={availableSlots}
            totalSlots={totalSlots}
            bookingTime={bookingTime}
          />
          {/* Cột 2: 3 bước hướng dẫn */}
          <InstructionsCard />
        </div>
      </div>
    </div>
  );
}
