// Component danh sách pin - Hiển thị tình trạng tồn kho chi tiết
export default function BatteryList({ type = "inventory" }) {
  // Component tình trạng tồn kho - Bảng hiển thị pin theo model
  const InventoryStatus = () => (
    // Hộp chứa - Nền trắng, shadow, border xám
    <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
      {/* Tiêu đề bảng */}
      <h3 className="text-lg font-bold text-gray-800 mb-4">Tình trạng Tồn kho chi tiết</h3>

      {/* Mảng 3 dòng pin: Model X, Model Y, Pin Lỗi */}
      {[
        { 
          model: "Model X",           // Tên model pin
          type: "Dung lượng cao",     // Loại pin
          total: 12,                  // Tổng pin
          full: 8,                    // Pin đầy sạc
          maintenance: 1,             // Pin đang bảo dưỡng
          color: "green"              // Màu icon
        },
        { 
          model: "Model Y", 
          type: "Dung lượng thường",
          total: 16, 
          full: 10, 
          charging: 3,               // Pin đang sạc
          color: "green" 
        },
        { 
          model: "Pin Lỗi", 
          type: "Cần báo cáo",
          total: 3, 
          pending: 2,                // Pin chưa xử lý
          color: "red" 
        },
      ].map((item) => (
        <div key={item.model} className="flex justify-between items-center py-2 border-b last:border-b-0">
          {/* Phần trái: Icon + Tên model + Tổng */}
          <div className="flex items-center">
            {/* Icon pin */}
            <svg className={`w-5 h-5 text-${item.color}-600 mr-3`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            {/* Tên + loại + tổng */}
            <div>
              <p className="font-semibold">{item.model} ({item.type})</p>
              <p className="text-sm text-gray-500">Tổng: {item.total} pin</p>
            </div>
          </div>
          {/* Phần phải: Chi tiết trạng thái */}
          <div className="text-right">
            {/* Hiển thị số pin đầy (nếu có) */}
            {item.full && <span className="text-sm font-medium text-green-700">Đầy: {item.full}</span>}
            {/* Hiển thị số pin đang sạc (nếu có) */}
            {item.charging && <p className="text-xs text-yellow-600 mt-1">Đang sạc: {item.charging}</p>}
            {/* Hiển thị số pin đang bảo dưỡng (nếu có) */}
            {item.maintenance && <p className="text-xs text-red-600 mt-1">Bảo dưỡng: {item.maintenance}</p>}
            {/* Hiển thị số pin chưa xử lý (nếu có) */}
            {item.pending && <span className="text-sm font-medium text-red-700">Chưa xử lý: {item.pending}</span>}
          </div>
        </div>
      ))}
    </div>
  );

  // Render component dựa vào type prop
  if (type === "inventory") {
    return <InventoryStatus />;
  }
}

