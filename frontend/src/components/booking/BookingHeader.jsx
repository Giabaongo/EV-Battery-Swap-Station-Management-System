import React from 'react';
import { ArrowLeft, MapPin } from 'lucide-react';

// Component header trang booking - Hiển thị thông tin trạm và nút quay lại bản đồ
export default function BookingHeader({ 
  stationName,      // Tên trạm sạc
  stationAddress,   // Địa chỉ trạm
  onBackToMap       // Callback khi user click nút quay lại
}) {
  return (
    // Header với nền xanh đậm - Phần trên cùng trang booking
    <div className="bg-blue-800 p-8 shadow-lg">
      {/* Nút quay lại bản đồ - Click sẽ gọi callback để navigate về screen trước */}
      <button 
        onClick={onBackToMap}
        className="flex items-center text-white hover:text-blue-100 mb-6 text-sm font-medium transition-colors duration-200"
      >
        <ArrowLeft size={20} className="mr-2" />  {/* Icon mũi tên trái */}
        Back to Map
      </button>
      
      {/* Tiêu đề trạm sạc - Hiển thị tên trạm to đậm */}
      <h1 className="text-3xl font-bold text-white mb-3">{stationName}</h1>
      
      {/* Địa chỉ trạm - Kèm icon vị trí để dễ nhận biết */}
      <p className="text-blue-100 flex items-center text-lg">
        <MapPin size={18} className="mr-2 text-blue-200" />  {/* Icon MapPin xanh nhạt */}
        {stationAddress}
      </p>
    </div>
  );
}