import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { ChevronLeft, ChevronRight, Car, CreditCard, Calendar, Package } from 'lucide-react';
import { subscriptionService } from '../../services/subscriptionService';
import { vehicleService } from '../../services/vehicleService';

// Component hiển thị danh sách gói cước đăng ký của user
export default function SubscriptionCard() {
  // State lưu danh sách gói cước của user
  const [subscriptions, setSubscriptions] = useState([]);
  // State theo dõi gói cước đang xem (khi có nhiều gói)
  const [currentIndex, setCurrentIndex] = useState(0);
  // State cho biết đang load dữ liệu hay chưa
  const [loading, setLoading] = useState(true);
  // State lưu map xe (key: vehicle_id, value: thông tin xe) để tra cứu nhanh
  const [vehiclesMap, setVehiclesMap] = useState({});

  // Lấy thông tin user từ localStorage (sử dụng useMemo để cache và tránh re-render không cần thiết)
  // useMemo chỉ thực thi lại khi dependency [] thay đổi (không bao giờ trong trường hợp này)
  const user = useMemo(() => {
    try {
      // Lấy user JSON từ localStorage (được lưu khi user đăng nhập)
      const userData = localStorage.getItem('user');
      // Parse JSON string thành object, nếu không có thì trả về null
      return userData ? JSON.parse(userData) : null;
    } catch {
      // Nếu JSON parse thất bại, trả về null
      return null;
    }
  }, []);  // Empty dependency array = chỉ tạo 1 lần khi component mount

  // Lấy danh sách gói cước và xe khi component mount hoặc user_id thay đổi
  useEffect(() => {
    const fetchSubscriptions = async () => {
      // Nếu chưa có user_id, dừng lại (user chưa đăng nhập)
      if (!user?.user_id) {
        setSubscriptions([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Lấy gói cước và xe song song để tăng hiệu năng (Promise.all)
        // Promise.all chạy cả 2 request cùng lúc, chứ không tuần tự
        const [subsData, vehiclesData] = await Promise.all([
          subscriptionService.getSubscriptionsByUserId(user.user_id),  // Gọi API 1: Lấy gói cước
          vehicleService.getVehicleByUserId(user.user_id)  // Gọi API 2: Lấy danh sách xe
        ]);

        // Xử lý response dữ liệu gói cước (có thể là { data: [...] } hoặc [...])
        const subscriptionsArray = subsData.data || subsData || [];
        // Xử lý response dữ liệu xe (có thể là { data: [...] } hoặc [...])
        const vehiclesArray = vehiclesData.data || vehiclesData || [];

        // Tạo map xe để tra cứu nhanh (O(1) thay vì O(n))
        // Ví dụ: { "vehicle_1": {...}, "vehicle_2": {...} }
        // Sau này khi cần tìm xe, chỉ cần vMap[vehicle_id] thay vì duyệt cả array
        const vMap = {};
        vehiclesArray.forEach(vehicle => {
          vMap[vehicle.vehicle_id] = vehicle;
        });
        setVehiclesMap(vMap);

        // Lọc ra những gói cước đang hoạt động (status = 'active')
        // Không lấy gói cước expired hoặc cancelled
        const activeSubscriptions = subscriptionsArray.filter(
          sub => sub.status === 'active'
        );

        setSubscriptions(activeSubscriptions);
      } catch (error) {
        console.error('Error fetching subscriptions:', error);
        setSubscriptions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptions();
  }, [user?.user_id]);

  const handlePrevious = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? subscriptions.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex((prev) =>
      prev === subscriptions.length - 1 ? 0 : prev + 1
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatPrice = (price) => {
    if (!price && price !== 0) return 'N/A';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  if (loading) {
    return (
      <Card className="bg-white border-gray-200">
        <CardHeader className="pb-2">
          <CardTitle>My Subscription</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (subscriptions.length === 0) {
    return (
      <Card className="bg-white border-gray-200">
        <CardHeader className="pb-2">
          <CardTitle>My Subscription</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No active subscriptions</p>
            <p className="text-sm mt-1">Subscribe to a plan to get started</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentSubscription = subscriptions[currentIndex];
  const vehicle = currentSubscription.vehicle_id
    ? vehiclesMap[currentSubscription.vehicle_id]
    : null;

  return (
    <Card className="bg-white border-gray-200">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle>My Subscription</CardTitle>
          {subscriptions.length > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevious}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Previous subscription"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <span className="text-sm text-gray-500">
                {currentIndex + 1} / {subscriptions.length}
              </span>
              <button
                onClick={handleNext}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Next subscription"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Package Name */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <Package className="w-4 h-4 text-blue-700" />
              <p className="text-xs text-gray-600 font-medium">Package</p>
            </div>
            <p className="text-xl font-bold text-gray-900">
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
            <p className="text-xl font-bold text-gray-900">
              {formatPrice(
                currentSubscription.package?.base_price ||
                currentSubscription.price
              )}
            </p>
          </div>

          {/* Vehicle */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <Car className="w-4 h-4 text-purple-600" />
              <p className="text-xs text-gray-600 font-medium">Vehicle</p>
            </div>
            <p className="text-lg font-bold text-gray-900">
              {vehicle
                ? `${vehicle.brand || ''} ${vehicle.model || ''} (${vehicle.license_plate || 'N/A'})`
                : 'No vehicle assigned'
              }
            </p>
            {vehicle && vehicle.vin && (
              <p className="text-xs text-gray-500 mt-1">VIN: {vehicle.vin}</p>
            )}
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
      </CardContent>
    </Card>
  );
}

