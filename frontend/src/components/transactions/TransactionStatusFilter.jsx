// Component dropdown lọc trạng thái giao dịch
export default function TransactionStatusFilter({ 
  value,    // Trạng thái được chọn (all, completed, failed, cancelled)
  onChange  // Callback khi thay đổi trạng thái
}) {
    return (
        // Container dropdown
        <div className="relative">
            {/* Select dropdown - Lọc theo status */}
            <select
                className="h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-200 px-4 pr-8 text-sm font-bold leading-normal tracking-[0.015em] hover:bg-gray-300 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer"
                value={value}
                onChange={(e) => onChange(e.target.value)}  // Gọi callback khi chọn
            >
                <option value="all">All Status</option>        {/* Tất cả trạng thái */}
                <option value="completed">Completed</option>   {/* Hoàn thành */}
                <option value="failed">Failed</option>         {/* Thất bại */}
                <option value="cancelled">Cancelled</option>   {/* Đã hủy */}
            </select>
            {/* Icon dropdown - Mũi tên xuống */}
            <span className="material-icons absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none text-base">
                arrow_drop_down
            </span>
        </div>
    );
}
