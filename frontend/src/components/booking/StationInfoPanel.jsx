import React from 'react';
import { Battery, CheckCircle2, XCircle } from 'lucide-react';

// Component panel thông tin trạm - Hiển thị tình trạng pin, xác nhận/hủy booking
export default function StationInfoPanel({
  stationInfo,                        // Thông tin trạm (availableSlots, totalSlots, batteries)
  bookingState,                       // Trạng thái booking ('idle' hoặc 'confirmed')
  timeRemaining,                      // Thời gian còn lại (giây)
  onConfirmBooking,                   // Callback xác nhận booking
  onCancelBooking,                    // Callback hủy booking
  showCancelDialog,                   // Hiển thị dialog xác nhận hủy
  onConfirmCancel,                    // Callback xác nhận hủy
  onCancelDialogClose,                // Callback đóng dialog hủy
  selectedVehicleHasSubscription,     // Xe có subscription active không
  selectedVehicleBatteryModel         // Model pin của xe
}) {

  // Hàm format thời gian countdown - Chuyển giây thành MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);       // Lấy phần phút
    const secs = seconds % 60;                    // Lấy phần giây còn lại
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;  // Format MM:SS
  };

  // Tính phần trăm pin sẵn có - Dùng cho thanh progress
  const progressPercentage = Math.round((stationInfo.availableSlots / stationInfo.totalSlots) * 100);

  // Lọc pin có trạng thái 'full' (sạc đầy) - Chỉ hiển thị pin sẵn dùng được
  const availableBatteries = Array.isArray(stationInfo.batteries) 
    ? stationInfo.batteries.filter(b => String(b.status || '').toLowerCase() === 'full') 
    : [];

  // Hàm kiểm tra pin có tương thích với model xe không
  // Nếu không chỉ định model xe: trả về true (không filter)
  // Nếu chỉ định model xe: so sánh model pin với model xe
  const modelMatches = (battery, model) => {
    if (!model) return true;  // Không filter nếu chưa chọn xe
    const bModel = battery?.battery_model ?? battery?.model ?? battery?.batteryModel ?? '';
    return String(bModel).toLowerCase() === String(model).toLowerCase();
  };

  // Lọc pin tương thích - Pin full + phù hợp với model xe được chọn
  const compatibleBatteries = availableBatteries.filter(b => modelMatches(b, selectedVehicleBatteryModel));

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl">
      {/* Phần hiển thị tình trạng pin sẵn có */}
      <div className="bg-blue-50 rounded-xl p-6 mb-6 shadow-md">
        {/* Header: Icon + tiêu đề + số lượng pin */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Battery className="w-5 h-5 text-blue-700" />  {/* Icon pin */}
            <span className="text-gray-700 font-semibold text-lg">Available Batteries</span>
          </div>
          {/* Hiển thị số pin sẵn / tổng pin (ví dụ: 3/5) */}
          <span className="text-2xl font-bold text-blue-800">
            {availableBatteries.length}/{stationInfo.totalSlots}
          </span>
        </div>

        {/* Thanh progress - Hiển thị tỷ lệ pin sẵn có */}
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
          <div
            className="bg-blue-800 h-full rounded-full transition-all duration-300 shadow-sm"
            style={{ width: `${progressPercentage}%` }} 
             //* Width = % pin sẵn có *
          />
        </div>

        {/* Thông báo pin tương thích */}
        <div className="mt-4">
          {selectedVehicleBatteryModel ? (
            // Nếu xe có model pin: Hiển thị số pin tương thích
            <p className="text-sm text-gray-700">
              There are <span className="text-green-600 font-semibold">{compatibleBatteries.length}</span> batteries available that match your vehicle (<strong>{selectedVehicleBatteryModel}</strong>).
            </p>
          ) : (
            // Nếu chưa chọn xe: Hiển thị tổng pin sẵn có
            <p className="text-sm text-gray-600">Showing all available batteries: {availableBatteries.length}</p>
          )}
        </div>
      </div>

      {/* Hiển thị khác nhau dựa vào trạng thái booking */}
      {bookingState === 'idle' ? (
        /* Trước khi booking - Hiển thị nút xác nhận */
        <>
          <button
            onClick={onConfirmBooking}
            disabled={
              stationInfo.availableSlots === 0 ||              // Không có pin
              !selectedVehicleHasSubscription ||                // Xe không có subscription
              (selectedVehicleBatteryModel && compatibleBatteries.length === 0)  // Không có pin tương thích
            }
            className="w-full bg-blue-800 hover:bg-blue-700 disabled:bg-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-bold py-5 px-6 rounded-xl text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
          >
            <CheckCircle2 size={22} />
            Confirm Booking
          </button>
          
          {/* Thông báo: Xe không có subscription */}
          {!selectedVehicleHasSubscription && (
            <p className="text-sm mt-3 text-yellow-700 text-center">
              Selected vehicle has no active subscription — booking is disabled. 
              <button onClick={() => window.location.href = '/driver/plans'} className="underline">View plans</button>
            </p>
          )}
          
          {/* Thông báo: Không có pin tương thích */}
          {selectedVehicleBatteryModel && compatibleBatteries.length === 0 && (
            <p className="text-sm mt-3 text-yellow-700 text-center">
              No compatible batteries available for this vehicle. Please select another station.
            </p>
          )}
        </>
      ) : (
        /* Sau khi booking - Hiển thị bộ đếm ngược và nút hủy */
        <div className="space-y-5">
          {/* Tiêu đề chính */}
          <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
            Please arrive at the station within the time limit to complete the battery swap
          </h3>

          {/* Hiển thị bộ đếm ngược */}
          <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-8 text-center shadow-lg">
            <p className="text-gray-700 mb-3 font-semibold text-lg">Time Remaining</p>
            {/* Thời gian MM:SS to lớn */}
            <div className="text-7xl font-bold text-blue-800 mb-2 font-mono">
              {formatTime(timeRemaining)}
            </div>
            <p className="text-sm text-gray-600 font-medium">minutes</p>
          </div>

          {/* Xác nhận booking thành công */}
          <div className="bg-green-50 border-2 border-green-400 rounded-xl p-5 text-center shadow-md">
            <div className="flex items-center justify-center text-green-700">
              <CheckCircle2 className="w-7 h-7 mr-2" strokeWidth={2.5} />
              <span className="font-bold text-xl">Booking Confirmed</span>
            </div>
          </div>

          {/* Nút hủy booking */}
          <button
            onClick={onCancelBooking}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
          >
            <XCircle size={20} />
            Cancel Booking
          </button>
        </div>
      )}

      {/* Dialog xác nhận hủy booking */}
      {showCancelDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-xl">
            {/* Tiêu đề dialog */}
            <h3 className="text-lg font-bold text-gray-900 mb-2">Confirm Cancellation</h3>
            {/* Câu hỏi xác nhận */}
            <p className="text-gray-600 mb-6">
              Are you sure you want to cancel this booking?
            </p>
            {/* 2 nút: No / Yes, Cancel */}
            <div className="flex gap-3">
              {/* Nút No - Đóng dialog */}
              <button
                onClick={onCancelDialogClose}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors"
              >
                No
              </button>
              {/* Nút Yes - Xác nhận hủy booking */}
              <button
                onClick={onConfirmCancel}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
