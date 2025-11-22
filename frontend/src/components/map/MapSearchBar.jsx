import React from 'react';
import { Search, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader } from "../ui/card"
import { Button } from "../ui/button"

// Component thanh tìm kiếm bản đồ - Tìm kiếm trạm trên map
export default function MapSearchBar({
  searchQuery,             // Text tìm kiếm hiện tại
  onSearch,                // Callback khi nhập text tìm kiếm
  vehicles,                // Danh sách xe (dùng cho filter)
  selectedVehicleId,       // ID xe được chọn filter (nếu có)
  onVehicleFilterChange,   // Callback khi thay đổi filter xe
  showAllStations = false, // Toggle state from parent
  onToggleAllStations      // Callback to toggle all stations view
}) {
  return (
    <div className="bg-white-800">
      {/* Thanh tìm kiếm - Nền xanh đậm */}
      <div className="bg-blue-800 px-4 py-3 rounded-lg shadow-md">
        <div className="flex items-center gap-3">
          {/* Ô input tìm kiếm */}
          <div className="flex-1 relative">
            {/* Icon search - Nằm bên trái input */}
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            {/* Input field - Tìm kiếm tên trạm */}
            <input
              type="text"
              placeholder="Search stations..."
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}  // Gọi callback khi thay đổi text
              className="w-full pl-9 pr-4 py-2 rounded-lg border-none focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white text-gray-900 placeholder-gray-500 text-sm"
            />
          </div>

          {/* All stations toggle button */}
          <div className="ml-2">
            <Button
              variant={showAllStations ? 'secondary' : 'ghost'}
              style={{ minWidth: '80px', backgroundColor: '#ffff' }}
              onClick={() => onToggleAllStations && onToggleAllStations(!showAllStations)}
              className="px-3 py-1 text-sm"
            >
              {showAllStations ? 'Showing: All' : 'Nearby'}
            </Button>
          </div>

          {/* Vehicle Filter Dropdown - Comment out trong code hiện tại */}
          {/* <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
          <select
            value={selectedVehicleId || 'all'}
            onChange={(e) => onVehicleFilterChange(e.target.value)}
            className="pl-9 pr-8 py-2 rounded-lg border-none focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white text-gray-900 text-sm appearance-none cursor-pointer min-w-[200px]"
          >
            <option value="all">All Stations</option>
            {vehicles && vehicles.length > 0 && vehicles.map((vehicle) => (
              <option key={vehicle.vehicle_id} value={vehicle.vehicle_id}>
                {vehicle.brand} {vehicle.model} ({vehicle.vin})
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div> */}
        </div>
      </div>
    </div>
  );
}