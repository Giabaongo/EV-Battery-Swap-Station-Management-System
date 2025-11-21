import { MoreVertical } from 'lucide-react';

// Component hiển thị thông tin chi tiết một chiếc pin
export default function BatteryCard({ battery }) {
  if (!battery) return null;

  // Hàm lấy nhãn trạng thái và màu badge - dùng để hiển thị trạng thái pin với màu sắc khác nhau
  // Ví dụ: status='full' -> label='Available', color='bg-green-100 text-green-800'
  const getStatusInfo = (status) => {
    // Ánh xạ từ status code sang display label và CSS color classes
    const statusMap = {
      full: { label: 'Full', color: 'bg-green-100 text-green-800' },  // Pin đầy, sẵn sàng dùng
      charging: { label: 'Charging', color: 'bg-yellow-100 text-yellow-800' },  // Pin đang sạc
      in_use: { label: 'In Use', color: 'bg-blue-100 text-blue-800' },  // Pin đang sử dụng trên xe
      booked: { label: 'Booked', color: 'bg-orange-100 text-orange-800' },  // Pin đã được đặt lịch
      defective: { label: 'Maintenance', color: 'bg-red-100 text-red-800' }  // Pin lỗi/cần bảo dưỡng
    };
    return statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
  };

  // Hàm chọn màu thanh tiến độ pin dựa vào phần trăm
  const getChargeBarColor = (percent) => {
    if (percent >= 80) return 'bg-green-500';
    if (percent >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Hàm chọn màu sức khỏe pin (SOH) dựa vào giá trị
  const getSOHColor = (soh) => {
    if (soh >= 80) return { bar: 'bg-green-500', text: 'text-gray-800' };
    return { bar: 'bg-red-500', text: 'text-red-600' };
  };

  const statusInfo = getStatusInfo(battery.status);
  const sohColor = getSOHColor(battery.soh);
  const borderClass = battery.status === 'defective' ? 'border-red-300' : 'border-gray-200';

  return (
    <div className={`flex flex-col rounded-xl border ${borderClass} bg-white p-5 shadow-sm transition-shadow hover:shadow-lg`}>
      {/* Phần đầu: Serial Number và badge trạng thái */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-lg font-bold text-gray-900">
          {battery.serial_number || `Battery #${battery.battery_id}`}
        </p>
        <div className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusInfo.color}`}>
          {statusInfo.label}
        </div>
      </div>

      {/* Hiển thị Cabinet và Slot */}
      <div className="flex justify-between text-sm text-gray-500 mb-2">
        <span>Cabinet: <span className="font-medium text-gray-700">{battery.cabinet?.cabinet_name || battery.cabinet_id || 'N/A'}</span></span>
        <span>Slot: <span className="font-medium text-gray-700">{battery.slot?.slot_number || battery.slot_id || 'N/A'}</span></span>
      </div>

      {/* Hiển thị Model */}
      <div className="text-sm text-gray-500 mb-4">
        <span>Model: <span className="font-medium text-gray-700">{battery.model || 'Unknown'}</span></span>
      </div>

      {/* Progress bars */}
      <div className="space-y-3">
        {/* State of Charge */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium text-gray-600">State of Charge</span>
            <span className="font-semibold text-gray-800">{battery.current_charge}%</span>
          </div>
          <div className="w-full overflow-hidden rounded-full bg-gray-200 h-2">
            <div
              className={`h-2 rounded-full ${getChargeBarColor(battery.current_charge)}`}
              style={{ width: `${battery.current_charge}%` }}
            ></div>
          </div>
        </div>

        {/* State of Health */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium text-gray-600">State of Health</span>
            <span className={`font-semibold ${sohColor.text}`}>{battery.soh}%</span>
          </div>
          <div className="w-full overflow-hidden rounded-full bg-gray-200 h-2">
            <div
              className={`h-2 rounded-full ${sohColor.bar}`}
              style={{ width: `${battery.soh}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* More options button */}
      <div className="mt-auto pt-4 text-right">
        <button className="p-2 rounded-full text-gray-500 hover:bg-gray-100">
          <MoreVertical size={20} />
        </button>
      </div>
    </div>
  );
}