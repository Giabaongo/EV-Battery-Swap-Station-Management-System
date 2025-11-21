import React from 'react';
import { Card } from '../ui/card';
import { formatCurrency } from '../../utils/formatters';
import {
  TrendingUp,
  DollarSign,
  Receipt,
  Zap,
  MapPin,
} from 'lucide-react';

// Component hiển thị 3 thẻ metric chính trên dashboard - Tóm tắt dữ liệu quan trọng
export default function MetricCards({ data }) {
  // Danh sách các metric cần hiển thị - Mỗi metric có title, value, icon, color, và period
  const metrics = [
    {
      title: 'Total Transactions',  // Tiêu đề: Tổng số giao dịch
      value: (data.revenue?.currentMonth?.total_transactions || 0).toLocaleString('vi-VN'),  // Số lượng giao dịch (format Vietnamese)
      icon: Receipt,  // Icon Receipt từ lucide-react
      color: 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300',  // Màu xanh
      period: `Avg: ${formatCurrency(data.revenue?.currentMonth?.average_transaction || 0)}`,  // Thông tin thêm: Giá trị trung bình giao dịch
    },
    {
      title: 'Total Swaps',  // Tiêu đề: Tổng số lần trao đổi pin
      value: (data.swapAnalytics?.frequency?.total || 0).toLocaleString('vi-VN'),  // Số lần swap (format Vietnamese)
      icon: Zap,  // Icon Zap từ lucide-react
      color: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-300',  // Màu vàng
      period: `This month: ${data.swapAnalytics?.frequency?.['this_month'] || 0} swaps`,  // Thông tin: Swap trong tháng này
    },
    {
      title: 'Total Stations',  // Tiêu đề: Tổng số trạm
      value: (data.stationStats?.totalStations || 0).toLocaleString('vi-VN'),  // Số lượng trạm (format Vietnamese)
      icon: MapPin,  // Icon MapPin từ lucide-react
      color: 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300',  // Màu tím
      period: 'Active stations',  // Thông tin: Trạm hoạt động
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
      {/* Lặp qua từng metric và render thành card */}
      {metrics.map((metric, index) => {
        const Icon = metric.icon;  // Lấy component icon từ metric
        return (
          <Card
            key={index}
            className="flex flex-col gap-2 p-5 hover:shadow-lg transition-shadow"  // Hiệu ứng shadow khi hover
          >
            {/* Phần header: Title + Icon */}
            <div className="flex items-center justify-between">
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                {metric.title}  {/* Tiêu đề metric */}
              </p>
              <div className={`w-8 h-8 flex items-center justify-center rounded-lg ${metric.color}`}>
                <Icon className="w-4 h-4" />  {/* Icon với màu sắc tương ứng */}
              </div>
            </div>
            {/* Phần giá trị chính: Number lớn */}
            <p className="text-gray-900 dark:text-white text-3xl font-bold tracking-tight">
              {metric.value}  {/* Giá trị chính (ví dụ: "1,234") */}
            </p>
            {/* Phần footer: Additional info */}
            <div className="flex items-center justify-between">
              <p className="text-success text-sm font-medium">{metric.change}</p>
              <p className="text-gray-500 dark:text-gray-400 text-xs">{metric.period}</p>  {/* Period/Average info */}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
