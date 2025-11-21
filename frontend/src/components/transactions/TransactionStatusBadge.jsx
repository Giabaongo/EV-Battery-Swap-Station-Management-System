import { ca } from "zod/v4/locales";

// Component badge hiển thị trạng thái giao dịch - Xanh/Xám/Đỏ tùy status
export default function TransactionStatusBadge({ status }) {
    // Cấu hình màu sắc & label cho mỗi trạng thái
    const statusConfig = {
        completed: {
            bg: 'bg-green-100 dark:bg-green-900/50',  // Nền xanh lá
            text: 'text-green-700 dark:text-green-300',  // Text xanh lá
            dot: 'bg-green-500',                        // Chấm xanh lá
            label: 'Completed'                          // Hoàn thành
        },
        cancelled: {
            bg: 'bg-gray-100 dark:bg-gray-900/50',     // Nền xám
            text: 'text-gray-700 dark:text-gray-300',   // Text xám
            dot: 'bg-gray-500',                         // Chấm xám
            label: 'Cancelled'                          // Đã hủy
        },
        // 'in-progress': {
        //   bg: 'bg-amber-100 dark:bg-amber-900/50',
        //   text: 'text-amber-800 dark:text-amber-300',
        //   dot: 'bg-amber-500',
        //   label: 'In Progress'
        // },
        // pending: {
        //   bg: 'bg-blue-100 dark:bg-blue-900/50',
        //   text: 'text-blue-700 dark:text-blue-300',
        //   dot: 'bg-blue-500',
        //   label: 'Pending'
        // },
        failed: {
            bg: 'bg-red-100 dark:bg-red-900/50',       // Nền đỏ
            text: 'text-red-700 dark:text-red-300',     // Text đỏ
            dot: 'bg-red-500',                          // Chấm đỏ
            label: 'Failed'                             // Thất bại
        }
    };

    // Lấy config của status, nếu không có lấy mặc định là completed
    const config = statusConfig[status] || statusConfig.completed;

    return (
        // Badge container - Hiển thị inline, rounded, với chấm màu
        <div className={`inline-flex items-center gap-1.5 rounded-full ${config.bg} px-2 py-1 text-xs font-medium ${config.text}`}>
            {/* Chấm tròn nhỏ - Hiển thị trạng thái màu */}
            <span className={`size-2 rounded-full ${config.dot}`}></span>
            {/* Text label trạng thái */}
            {config.label}
        </div>
    );
}
