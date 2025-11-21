import React from 'react'

// Component card đề xuất - Hiển thị đề xuất cải tiến trạm từ hệ thống AI
export default function RecommendationCard({ recommendation }) {
    // Destructure thông tin từ object recommendation
    const { 
      station_id,              // ID trạm
      station_name,            // Tên trạm
      priority,                // Mức độ ưu tiên (HIGH, MEDIUM, LOW)
      recommendation: recommendationText,  // Nội dung đề xuất
      reasons,                 // Mảng lý do
      suggested_improvements,  // Mảng các cải tiến được đề xuất
      estimated_impact         // Tác động dự kiến (%)
    } = recommendation

    // Hàm lấy màu badge dựa vào mức độ ưu tiên
    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'HIGH':
                return 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300'      // Cao: đỏ
            case 'MEDIUM':
                return 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300'  // Trung: cam
            case 'LOW':
                return 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'     // Thấp: xanh
            default:
                return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
        }
    }

    // Hàm lấy label ưu tiên - Tiếng Việt
    const getPriorityLabel = (priority) => {
        switch (priority) {
            case 'HIGH':
                return 'Ưu tiên: CAO'
            case 'MEDIUM':
                return 'Ưu tiên: TRUNG BÌNH'
            case 'LOW':
                return 'Ưu tiên: THẤP'
            default:
                return 'Ưu tiên: KHÔNG XÁC ĐỊNH'
        }
    }

    return (
        // Card container - Nền trắng, border xám, shadow nhẹ
        <div className="bg-white dark:bg-background-dark/50 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            {/* Nội dung card */}
            <div className="p-6">
                {/* Header: Tên trạm + Badge ưu tiên */}
                <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
                    {/* Tên trạm - Font lớn đậm */}
                    <h4 className="text-xl font-bold dark:text-white">{station_name}</h4>
                    {/* Badge ưu tiên - Màu động theo priority */}
                    <span className={`inline-flex items-center justify-center rounded-full ${getPriorityColor(priority)} px-3 py-1 text-sm font-medium`}>
                        {getPriorityLabel(priority)}
                    </span>
                </div>

                {/* Thông tin trạm: ID + Loại */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-[#617589] dark:text-gray-400 mb-6">
                    {/* Station ID */}
                    <div className="flex items-center gap-2">
                        <span className="text-base">🏢</span>
                        <span>ID: {station_id}</span>
                    </div>
                    {/* Station Type/Status */}
                    <div className="flex items-center gap-2">
                        <span className="text-base">📍</span>
                        <span>Trạm</span>
                    </div>
                </div>

                {/* Chi tiết đề xuất - 4 phần: Đề xuất, Lý do, Cải tiến, Tác động */}
                <div className="space-y-4">
                    {/* Phần 1: Đề xuất chính */}
                    <div>
                        <h5 className="font-bold mb-2 dark:text-white">Đề xuất</h5>
                        {/* Nội dung đề xuất */}
                        <p className="text-[#617589] dark:text-gray-400">{recommendationText}</p>
                    </div>

                    {/* Phần 2: Lý do thực hiện */}
                    <div>
                        <h5 className="font-bold mb-2 dark:text-white">Lý do</h5>
                        {/* Danh sách lý do */}
                        <ul className="list-disc list-inside space-y-1 text-[#617589] dark:text-gray-400">
                            {reasons && reasons.map((reason, ridx) => (
                                <li key={ridx}>{reason}</li>
                            ))}
                        </ul>
                    </div>

                    {/* Phần 3: Cải tiến được đề xuất */}
                    <div>
                        <h5 className="font-bold mb-2 dark:text-white">Cải tiến được đề xuất</h5>
                        {/* Danh sách cải tiến + checkmark xanh */}
                        <ul className="space-y-1">
                            {suggested_improvements && suggested_improvements.map((improvement, iidx) => (
                                <li key={iidx} className="flex items-center gap-2 text-[#617589] dark:text-gray-400">
                                    <span className="text-lg text-green-500">✅</span>  {/* Icon check xanh */}
                                    {improvement}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Phần 4: Tác động dự kiến */}
                    <div>
                        {/* Text italic xanh - Hiển thị % tác động */}
                        <p className="text-sm italic text-blue-500 dark:text-blue-400">
                            Tác động dự kiến: {estimated_impact}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
