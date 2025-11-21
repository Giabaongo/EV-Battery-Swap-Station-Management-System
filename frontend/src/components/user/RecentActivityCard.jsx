import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Zap, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
import { swapService } from '../../services/swapService';
import { useAuth } from '../../hooks/useContext';
import { stationService } from '../../services/stationService';

// Component hiển thị lịch sử hoạt động trao đổi pin gần đây của user
export default function RecentActivityCard({ onViewAll }) {
  // State lưu danh sách giao dịch trao đổi pin của user
  const [swapTransactions, setSwapTransactions] = useState([]);
  // State cho biết đang load dữ liệu hay chưa
  const [loading, setLoading] = useState(true);
  // Lấy thông tin user từ Auth context
  const { user } = useAuth();
  // State lưu danh sách tất cả các trạm
  const [stations, setStations] = useState([]);

  // Lấy dữ liệu lịch sử trao đổi pin khi component mount hoặc user thay đổi
  useEffect(() => {
    const fetchSwapHistory = async () => {
      if (!user?.user_id) {
        setSwapTransactions([]);
        setStations([]);
        setLoading(false);
        return;
      }

      try {
        // Lấy dữ liệu trạm và giao dịch song song
        const [allStations, transactions] = await Promise.all([
          stationService.getAllStations(),
          swapService.getAllSwapTransactionsByUserId(user.user_id)
        ]);

        setStations(Array.isArray(allStations) ? allStations : []);

        // Lấy 3 giao dịch gần đây nhất và định dạng ngày giờ
        const recentActivities = (transactions || [])
          .slice(0, 3)
          .map(transaction => ({
            transaction_id: transaction.transaction_id,
            station_id: transaction.station_id,
            date: transaction.createAt
              ? new Date(transaction.createAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })
              : 'N/A',
            time: transaction.createAt
              ? new Date(transaction.createAt).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
              })
              : 'N/A',
            status: transaction.status,
            batteryTaken: transaction.battery_taken_id,
            batteryReturned: transaction.battery_returned_id,
            createAt: transaction.createAt
          }));

        setSwapTransactions(recentActivities);
      } catch (error) {
        console.error('Error fetching swap transactions:', error);
        setSwapTransactions([]);
        setStations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSwapHistory();
  }, [user?.user_id]);

  const getStatusConfig = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          label: 'Completed'
        };
      case 'pending':
        return {
          icon: Clock,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          label: 'Pending'
        };
      case 'failed':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          label: 'Failed'
        };
      default:
        return {
          icon: AlertCircle,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          label: status || 'Unknown'
        };
    }
  };

  return (
    <Card className="bg-white border-gray-200">
      <CardHeader className="pb-2">
        <div className="w-full flex items-start justify-between">
          <div>
            <CardTitle className="text-[22px]">Recent Activity</CardTitle>
            <CardDescription>Latest battery swap transactions</CardDescription>
          </div>
          <Link
            to="/driver/swap-history"
            onClick={(e) => {
              if (onViewAll) {
                e.preventDefault();
                onViewAll();
              }
            }}
            className="text-sm text-blue-700 hover:underline"
          >
            View All
          </Link>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
          </div>
        ) : swapTransactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Zap className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No recent swap transactions</p>
          </div>
        ) : (
          swapTransactions.map((item) => {
            const statusConfig = getStatusConfig(item.status);
            const StatusIcon = statusConfig.icon;
            const stationObj = stations.find(s => String(s.station_id) === String(item.station_id));

            return (
              <div
                key={item.transaction_id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
              >
                <div className="flex items-center gap-4">
                  <div className={`${statusConfig.bgColor} ${statusConfig.color} p-2 rounded-full`}>
                    <Zap size={18} />
                  </div>
                  {/* Get station name from stations state */}
                  <div>
                    <p className="font-medium text-gray-900">{stationObj?.name || `Station ${item.station_id}`}</p>
                    <p className="text-gray-500 text-sm">{item.date} at {item.time}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">Battery Swap</p>
                </div>
                <div className={`${statusConfig.color} font-medium text-sm flex items-center gap-1`}>
                  <StatusIcon size={16} /> {statusConfig.label}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

