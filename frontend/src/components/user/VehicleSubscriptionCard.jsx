import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Link } from 'react-router-dom';
import { MapPin, ChevronLeft, ChevronRight, X, Loader2, Package, CreditCard, Calendar, Car } from 'lucide-react';
import { batteryService } from '../../services/batteryService';
import { subscriptionService } from '../../services/subscriptionService';
import { vehicleService } from '../../services/vehicleService';
import { toast } from 'sonner';

export default function VehicleSubscriptionCard({ vehicles = [], onFindStations, onVehiclesUpdate }) {
  // State quản lý xe đang hiển thị (khi có nhiều xe, dùng để chuyển đổi giữa các xe)
  const [currentVehicleIndex, setCurrentVehicleIndex] = useState(0);
  // State điều khiển modal cập nhật pin
  const [showChargeModal, setShowChargeModal] = useState(false);
  // State lưu giá trị pin người dùng nhập vào
  const [chargeInput, setChargeInput] = useState('');
  // State cho biết đang cập nhật pin hay chưa (hiển thị loading)
  const [updatingCharge, setUpdatingCharge] = useState(false);
  // State lưu danh sách xe cục bộ
  const [localVehicles, setLocalVehicles] = useState(vehicles);
  // State lưu danh sách gói cước của user
  const [subscriptions, setSubscriptions] = useState([]);
  // State lưu map xe (key: vehicle_id, value: thông tin xe) để tra cứu nhanh
  const [vehiclesMap, setVehiclesMap] = useState({});
  // State cho biết đang load gói cước hay chưa
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(true);

  // Lấy thông tin user từ localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Đồng bộ danh sách xe cục bộ với props khi props thay đổi
  useEffect(() => {
    setLocalVehicles(vehicles);
  }, [vehicles]);

  // Lấy danh sách gói cước và tạo map xe khi component mount
  useEffect(() => {
    const fetchSubscriptions = async () => {
      if (!user?.user_id) {
        setLoadingSubscriptions(false);
        return;
      }

      try {
        setLoadingSubscriptions(true);
        
        // Lấy danh sách gói cước (cả gói active và expired)
        const subs = await subscriptionService.getSubscriptionsByUserId(user.user_id);
        setSubscriptions(Array.isArray(subs) ? subs.filter(s => s.status === 'active' || s.status === 'expired') : []);

        // Lấy danh sách xe để tạo map tra cứu nhanh
        const vhcls = await vehicleService.getVehicleByUserId(user.user_id);
        const map = {};
        if (Array.isArray(vhcls)) {
          vhcls.forEach(v => {
            map[v.vehicle_id] = v;
          });
        }
        setVehiclesMap(map);
      } catch (error) {
        console.error('Error fetching subscriptions:', error);
      } finally {
        setLoadingSubscriptions(false);
      }
    };

    fetchSubscriptions();
  }, [user?.user_id]);

  // Kiểm tra nếu không có xe, hiển thị thông báo
  if (!localVehicles || localVehicles.length === 0) {
    return (
      <Card className="bg-white border-gray-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-[22px]">Vehicle & Subscription</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p className="mb-4">No vehicles found</p>
            <Link to="/driver/profile" className="inline-flex items-center justify-center px-4 py-2 bg-blue-700 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
              Add a vehicle
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Lấy xe hiện tại từ danh sách dựa vào chỉ số
  const currentVehicle = localVehicles[currentVehicleIndex];
  // Tìm gói cước của xe hiện tại
  const currentSubscription = subscriptions.find(s => s.vehicle_id === currentVehicle?.vehicle_id);

  // Chuyển sang xe trước đó (hoặc sang xe cuối cùng nếu ở đầu danh sách)
  const handlePreviousVehicle = () => {
    setCurrentVehicleIndex((prev) => (prev === 0 ? localVehicles.length - 1 : prev - 1));
  };

  // Chuyển sang xe tiếp theo (hoặc sang xe đầu tiên nếu ở cuối danh sách)
  const handleNextVehicle = () => {
    setCurrentVehicleIndex((prev) => (prev === localVehicles.length - 1 ? 0 : prev + 1));
  };

  // Xử lý cập nhật mức pin của xe hiện tại - Tính năng cho phép user cập nhật lại mức pin
  const handleUpdateCharge = async () => {
    // Chuyển đổi chuỗi nhập vào thành số thập phân (ví dụ: "85" -> 85)
    const chargeValue = parseFloat(chargeInput);

    // Kiểm tra #1: Giá trị nhập vào có rỗng không - Tránh user submit form trống
    if (chargeInput.trim() === '') {
      toast.error('Please enter a charge value');
      return;
    }

    // Kiểm tra #2: Giá trị có phải số hợp lệ không - Đảm bảo input là numeric
    if (isNaN(chargeValue)) {
      toast.error('Please enter a valid number');
      return;
    }

    // Kiểm tra #3: Kiểm tra range pin hợp lệ (0-100%) - Đảm bảo % pin hợp lệ
    if (chargeValue < 0 || chargeValue > 100) {
      toast.error('Charge value must be between 0 and 100');
      return;
    }

    // Kiểm tra #4: Xe có pin gán chưa - Tránh lỗi khi cập nhật pin không tồn tại
    if (!currentVehicle?.battery_id) {
      toast.error('No battery assigned to this vehicle');
      return;
    }

    // Bật loading flag để hiển thị spinner - UX feedback đến user
    setUpdatingCharge(true);
    try {
      // Bước 1: Gọi API backend cập nhật mức pin theo battery_id
      const updatedBattery = await batteryService.updateBatteryCharge(
        currentVehicle.battery_id,  // ID pin cần cập nhật
        chargeValue  // Mức pin mới (0-100%)
      );

      // Cập nhật danh sách xe cục bộ với mức pin mới
      const updatedVehicles = localVehicles.map((vehicle, index) => {
        if (index === currentVehicleIndex) {
          return {
            ...vehicle,
            batteryLevel: chargeValue,
            battery: {
              ...vehicle.battery,
              current_charge: chargeValue.toString()
            }
          };
        }
        return vehicle;
      });
      setLocalVehicles(updatedVehicles);

      // Gọi callback để thông báo cho parent component nếu có
      if (onVehiclesUpdate) {
        onVehiclesUpdate(updatedVehicles);
      }

      toast.success(`Battery charge updated to ${chargeValue}% for vehicle (VIN: ${currentVehicle.vin})`);
      setShowChargeModal(false);
      setChargeInput('');
    } catch (err) {
      console.error('Error updating battery charge:', err);
      toast.error(err.response?.data?.message || 'Failed to update battery charge');
    } finally {
      setUpdatingCharge(false);
    }
  };

  // Định dạng giá tiền thành định dạng VND
  const formatPrice = (price) => {
    const numPrice = Number(price) || 0;
    return numPrice.toLocaleString('en-US', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).replace('VND', 'đ').trim();
  };

  // Format date helper
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <>
      <Card className="bg-white border-gray-200">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-[22px]">Vehicle & Subscription</CardTitle>
            {localVehicles.length > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePreviousVehicle}
                  className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                  aria-label="Previous vehicle"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <span className="text-sm text-gray-500 font-medium min-w-[40px] text-center">
                  {currentVehicleIndex + 1}/{localVehicles.length}
                </span>
                <button
                  onClick={handleNextVehicle}
                  className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                  aria-label="Next vehicle"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-2 gap-6">
            {/* Vehicle Status Section - Left */}
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-gray-600 mb-4">Vehicle Status</h3>
              
              <div className="grid grid-cols-2 gap-x-4 gap-y-4 mb-4">
                <div className="flex flex-col gap-1">
                  <span className="text-gray-500 text-sm">Battery Type</span>
                  <span className="text-gray-900 text-sm">{currentVehicle.battery_type || 'N/A'}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-gray-500 text-sm">VIN</span>
                  <span className="text-gray-900 text-sm">{currentVehicle.vin || 'N/A'}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-gray-500 text-sm">Battery Model</span>
                  <span className="text-gray-900 text-sm">{currentVehicle.battery_model || 'N/A'}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-gray-500 text-sm">Status</span>
                  {((currentVehicle.status || '').toString().toLowerCase() === 'active') ? (
                    <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-[2px] text-sm font-medium text-green-700 border border-green-200">
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-[2px] text-sm font-medium text-red-700 border border-red-200">
                      Inactive
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-center mb-4">
                <img
                  src="/images/xe-may-1.png"
                  alt="Vehicle"
                  className="w-full max-w-[200px] h-auto object-contain"
                />
              </div>

              {!currentVehicle?.battery_id ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                  <div className="text-amber-600 mb-2">
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 mb-1">No battery assigned for this vehicle</p>
                  <p className="text-xs text-gray-600">You can take your first battery at station</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-900 text-sm font-medium">Battery Level</span>
                      <span className="text-gray-900 text-sm">{currentVehicle.batteryLevel || 0}%</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-gray-200">
                      <div className="h-2.5 rounded-full bg-blue-700" style={{ width: `${currentVehicle.batteryLevel || 0}%` }} />
                    </div>
                    <span className="text-gray-500 text-sm">Estimated Range: {currentVehicle.estimatedRange || 'N/A'}</span>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-900 text-sm font-medium">Battery Health (SOH)</span>
                      <span className="text-gray-900 text-sm">{currentVehicle.soh || 0}%</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-gray-200">
                      <div className="h-2.5 rounded-full bg-green-600" style={{ width: `${currentVehicle.soh || 0}%` }} />
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 grid grid-cols-2 gap-3">
                <Button className="w-full" onClick={onFindStations}>
                  <MapPin className="mr-2" size={18} /> Find Stations
                </Button>

                <Button
                  className="w-full bg-blue-700 hover:bg-blue-700 text-white font-medium py-2"
                  onClick={() => {
                    setChargeInput((currentVehicle.batteryLevel || 0).toString());
                    setShowChargeModal(true);
                  }}
                >
                  Update Charge
                </Button>
              </div>
            </div>

            {/* Subscription Section - Right */}
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-gray-600 mb-4">Subscription</h3>

              {loadingSubscriptions ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
                </div>
              ) : currentSubscription ? (
                <div className="space-y-3">
                  {/* Package Name */}
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-blue-700" />
                        <p className="text-xs text-gray-600 font-medium">Package</p>
                      </div>
                      {currentSubscription.status === 'expired' && (
                        <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-bold text-red-700 border border-red-200">
                          EXPIRED
                        </span>
                      )}
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      {currentSubscription.package?.name ||
                        currentSubscription.name ||
                        `Package #${currentSubscription.package_id}`}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 mb-1">
                      <CreditCard className="w-4 h-4 text-green-600" />
                      <p className="text-xs text-gray-600 font-medium">Price</p>
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      {formatPrice(
                        currentSubscription.package?.base_price ||
                        currentSubscription.price
                      )}
                    </p>
                  </div>

                  {/* Subscription Period */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-4 h-4 text-orange-600" />
                      <p className="text-xs text-gray-600 font-medium">Period</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500">From</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {formatDate(currentSubscription.start_date)}
                        </p>
                      </div>
                      <div className="text-gray-400">→</div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">To</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {formatDate(currentSubscription.end_date)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Usage Stats */}
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-2">
                    {/* Swaps Used */}
                    {currentSubscription.swap_used !== undefined && (
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600">Swaps Used</p>
                        <p className="text-lg font-bold text-blue-700">
                          {currentSubscription.swap_used}
                          {currentSubscription.package?.swap_count &&
                            <span className="text-sm text-gray-500 font-normal">
                              {' '}/ {currentSubscription.package.swap_count}
                            </span>
                          }
                        </p>
                      </div>
                    )}

                    {/* Distance Traveled */}
                    {currentSubscription.distance_traveled !== undefined && (
                      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                        <p className="text-sm text-gray-600">Distance Traveled</p>
                        <p className="text-lg font-bold text-green-600">
                          {currentSubscription.distance_traveled.toLocaleString('en-US', {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 1
                          })} km
                          {currentSubscription.package?.base_distance &&
                            <span className="text-sm text-gray-500 font-normal">
                              {' '}/ {currentSubscription.package.base_distance.toLocaleString('en-US')} km
                            </span>
                          }
                        </p>
                      </div>
                    )}

                    {/* Distance Progress Bar */}
                    {currentSubscription.package?.base_distance &&
                      currentSubscription.distance_traveled !== undefined && (
                        <div className="pt-1">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${(currentSubscription.distance_traveled / currentSubscription.package.base_distance) > 1
                                  ? 'bg-red-500'
                                  : (currentSubscription.distance_traveled / currentSubscription.package.base_distance) > 0.8
                                    ? 'bg-yellow-500'
                                    : 'bg-green-500'
                                }`}
                              style={{
                                width: `${Math.min(
                                  (currentSubscription.distance_traveled / currentSubscription.package.base_distance) * 100,
                                  100
                                )}%`
                              }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1 text-right">
                            {((currentSubscription.distance_traveled / currentSubscription.package.base_distance) * 100).toFixed(1)}% used
                          </p>
                        </div>
                      )}
                  </div>
                </div>
              ) : currentSubscription?.status === 'expired' ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="font-medium">Subscription Expired</p>
                  <p className="text-sm mt-1">Your subscription has ended</p>
                  <div className="mt-4">
                    <Link
                      to="/driver/plans"
                      className="inline-flex items-center justify-center px-4 py-2 bg-blue-700 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                    >
                      Renew
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="font-medium">No active subscription</p>
                  <p className="text-sm mt-1">Subscribe to a plan to get started</p>
                  <div className="mt-4">
                    <Link
                      to="/driver/plans"
                      className="inline-flex items-center justify-center px-4 py-2 bg-blue-700 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                    >
                      Subscribe
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charge Update Modal */}
      {showChargeModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-sm w-full">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Update Battery Charge</h3>
              <button
                onClick={() => setShowChargeModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Charge Percentage (0-100%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={chargeInput}
                  onChange={(e) => setChargeInput(e.target.value)}
                  placeholder="Enter charge value"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Info Message */}
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Current charge: {(currentVehicle.batteryLevel || 0).toFixed(0)}%
              </p>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 justify-end p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowChargeModal(false)}
                disabled={updatingCharge}
                className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white font-medium hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateCharge}
                disabled={updatingCharge}
                className="px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-700 text-white font-medium disabled:opacity-50 flex items-center gap-2"
              >
                {updatingCharge && <Loader2 className="w-4 h-4 animate-spin" />}
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

