import React, { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Bike, X } from 'lucide-react';
import AddVehicleDialog from './AssignVehicle'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog'
import { vehicleService } from '../../services/vehicleService'
import { toast } from 'sonner'

// Component hiển thị danh sách xe được liên kết - Cho phép add/remove xe
export default function VehiclesList({ vehicles = [], onAddVehicle }) {
  // State hiển thị banner gợi ý subscription sau khi thêm xe
  const [showSuggestion, setShowSuggestion] = useState(false)
  // State điều khiển dialog xác nhận xóa xe
  const [confirmOpen, setConfirmOpen] = useState(false)
  // State lưu xe cần xóa
  const [removeVehicle, setRemoveVehicle] = useState(null)
  // State cho biết đang xóa xe hay không (loading)
  const [isRemoving, setIsRemoving] = useState(false)

  // Hàm xử lý khi user thêm xe thành công
  const handleAdded = async (info) => {
    // Gọi callback để parent refresh danh sách xe
    if (onAddVehicle) await onAddVehicle();
    // Emit global event so other parts of app can refresh too
    try { window.dispatchEvent(new Event('vehiclesUpdated')); } catch { /* ignore */ }
    // Hiển thị banner gợi ý nếu user chưa subscribe gói cước
    if (info?.suggestedSubscription) setShowSuggestion(true)
    // Tự động ẩn banner sau 8 giây
    setTimeout(() => setShowSuggestion(false), 8000)
  }

  // Hàm xử lý khi user click nút xóa xe
  const handleRemoveClick = (vehicle) => {
    setRemoveVehicle(vehicle)  // Lưu xe cần xóa
    setConfirmOpen(true)        // Mở dialog xác nhận
  }

  // Hàm xác nhận xóa xe - Gọi API xóa xe
  const handleConfirmRemove = async () => {
    if (!removeVehicle) return

    setIsRemoving(true)  // Bật loading
    try {
      // Gọi API xóa xe theo VIN
      await vehicleService.removeVehicleFromCurrentUser(removeVehicle.vin)
      toast.success('Vehicle unlinked successfully!')  // Thông báo thành công
      setConfirmOpen(false)  // Đóng dialog
      setRemoveVehicle(null)  // Xóa state
      // Refresh danh sách xe từ server
      if (onAddVehicle) await onAddVehicle()
      // Emit global event for other listeners
      try { window.dispatchEvent(new Event('vehiclesUpdated')); } catch { /* ignore */ }
    } catch (error) {
      console.error('Error removing vehicle:', error)
      toast.error(error.response?.data?.message || 'Cannot unlink vehicle')  // Thông báo lỗi
    } finally {
      setIsRemoving(false)  // Tắt loading
    }
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      {/* Phần header: Tiêu đề + Nút thêm xe */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Linked Vehicles</h2>
        {/* Component AddVehicleDialog - Cho phép user thêm xe mới */}
        <AddVehicleDialog onAdded={handleAdded} />
      </div>

      {/* Banner gợi ý: Khuyến khích user subscribe gói cước cho xe mới thêm */}
      {showSuggestion && (
        <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded text-sm">
          Vehicle added. You can <a className="text-blue-700 underline" href="/driver/plans">subscribe to a battery rental plan</a> for this vehicle later.
        </div>
      )}

      {/* Danh sách xe */}
      <div className="space-y-4">
        {/* Lặp qua từng xe và hiển thị thông tin */}
        {vehicles.map((v, idx) => (
          <div key={idx} className="border border-gray-200 p-4 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* Phần header của card xe: Icon + Tên xe */}
                <div className="flex items-center gap-3">
                  <Bike className="w-6 h-6 text-blue-700" />  {/* Icon xe */}
                  <h3 className="font-semibold text-lg text-gray-900">{v.name || v.vin || 'Vehicle'}</h3>
                </div>
                {/* Grid hiển thị thông tin xe: VIN, Battery Module */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 mt-3 text-sm">
                  <div>
                    <span className="text-gray-500">VIN:</span>
                    <span className="text-gray-800 ml-1">{v.vin}</span>  {/* Số khung xe */}
                  </div>
                  <div>
                    <span className="text-gray-500">Battery Module:</span>
                    <span className="text-gray-800 ml-1">{v.battery_model}</span>  {/* Model pin tương thích */}
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRemoveClick(v)}
                className="text-gray-600 hover:text-gray-800 hover:bg-gray-50 flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                <span className="text-sm">Unlink</span>
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Confirm dialog for removing vehicle */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Unlink Vehicle</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to unlink the vehicle <strong>{removeVehicle?.vin}</strong> from your account?</p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)} disabled={isRemoving}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmRemove}
              disabled={isRemoving}
            >
              {isRemoving ? 'Processing...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

