import TransactionStatusBadge from './TransactionStatusBadge';

// Component bảng hiển thị danh sách các giao dịch với tính năng sắp xếp, lọc
export default function TransactionTable({ transactions, loading, onViewDetails }) {
    // Hàm định dạng ngày giờ từ chuỗi ISO sang định dạng dễ đọc cho người dùng
    // Ví dụ: "2024-11-20T14:30:00Z" -> "11/20/2024 14:30"
    const formatDateTime = (dateString) => {
        // Nếu không có ngày, hiển thị "N/A"
        if (!dateString) return 'N/A';
        // Tạo Date object từ ISO string
        const date = new Date(dateString);
        // Format theo locale en-US: MM/DD/YYYY HH:MM (24h format không có AM/PM)
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false  // Dùng 24h format (không có AM/PM)
        }).replace(',', '');  // Xóa dấu phẩy trong kết quả
    };

    // Hàm lấy thông tin người dùng - ưu tiên full_name > username > email > user_id
    // Tính năng: Hiển thị tên người dùng theo thứ tự ưu tiên
    const getUserInfo = (transaction) => {
        // Ưu tiên 1: Lấy full_name nếu có (ví dụ: "Nguyễn Văn A")
        if (transaction.user?.full_name) return transaction.user.full_name;
        // Ưu tiên 2: Lấy username nếu không có full_name (ví dụ: "nguyenvana")
        if (transaction.user?.username) return transaction.user.username;
        // Ưu tiên 3: Lấy email prefix nếu không có cả 2 trên (ví dụ: "nguyena" từ nguyena@gmail.com)
        if (transaction.user?.email) return transaction.user.email.split('@')[0];
        // Ưu tiên 4: Hiển thị user_id nếu không có bất cứ thông tin nào (ví dụ: "User 123")
        return `User ${transaction.user_id}`;
    };

    // Hiển thị spinner khi đang load
    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    // Hiển thị thông báo nếu không có giao dịch
    if (!transactions || transactions.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                No transactions found
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50">
            <div className="overflow-x-auto">
                <table className="w-full">
                    {/* Phần tiêu đề bảng */}
                    <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                            <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-400 text-xs font-medium uppercase tracking-wider">
                                Transaction ID
                            </th>
                            <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-400 text-xs font-medium uppercase tracking-wider">
                                Date & Time
                            </th>
                            <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-400 text-xs font-medium uppercase tracking-wider">
                                User Info
                            </th>
                            <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-400 text-xs font-medium uppercase tracking-wider">
                                Battery Out
                            </th>
                            <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-400 text-xs font-medium uppercase tracking-wider">
                                Battery In
                            </th>
                            <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-400 text-xs font-medium uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-400 text-xs font-medium uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                        {transactions.map((transaction) => (
                            <tr
                                key={transaction.transaction_id}
                                className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                            >
                                <td className="h-[72px] px-4 py-2 text-gray-700 dark:text-gray-300 text-sm font-normal">
                                    {transaction.transaction_id}
                                </td>
                                <td className="h-[72px] px-4 py-2 text-gray-500 dark:text-gray-400 text-sm font-normal">
                                    {formatDateTime(transaction.createAt || transaction.created_at)}
                                </td>
                                <td className="h-[72px] px-4 py-2 text-gray-700 dark:text-gray-300 text-sm font-normal">
                                    {getUserInfo(transaction)}
                                </td>
                                <td className="h-[72px] px-4 py-2 text-gray-500 dark:text-gray-400 text-sm font-normal">
                                    {transaction.battery_returned_id || 'N/A'}
                                </td>
                                <td className="h-[72px] px-4 py-2 text-gray-500 dark:text-gray-400 text-sm font-normal">
                                    {transaction.battery_taken_id || 'N/A'}
                                </td>
                                <td className="h-[72px] px-4 py-2 text-sm font-normal">
                                    <TransactionStatusBadge status={transaction.status} />
                                </td>
                                <td className="h-[72px] px-4 py-2">
                                    <button
                                        onClick={() => onViewDetails && onViewDetails(transaction)}
                                        className="text-blue-700 dark:text-blue-400 text-sm font-medium cursor-pointer hover:underline"
                                    >
                                        View Details
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

