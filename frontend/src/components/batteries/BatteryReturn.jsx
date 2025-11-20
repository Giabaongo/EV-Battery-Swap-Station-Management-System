import React from 'react'

// Component nhận lại pin từ user - Đánh giá tình trạng vật lý và ghi nhận vào hệ thống
export default function BatteryReturn() {
    return (
        <div>
            {/* Hộp form - Nền xám đậm, border xám, shadow */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                {/* Tiêu đề: Icon + "Physical Condition Assessment" */}
                <h2 className="text-xl font-semibold mb-6 flex items-center">
                    <i className="ri-search-line mr-2 text-blue-400"></i>
                    Physical Condition Assessment
                </h2>

                {/* Form: 4 phần - ID + Condition + Notes + Submit */}
                <div className="space-y-6">
                    {/* Phần 1: Nhập Battery ID */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Battery ID</label>
                        <input
                            placeholder="Scan or enter Battery ID"
                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            type="text"
                            value=""
                            spellCheck="false"
                        />
                    </div>

                    {/* Phần 2: Chọn tình trạng vật lý - 3 option: Normal/Minor/Impact */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-3">Physical Condition</label>
                        <div className="grid grid-cols-1 gap-3">
                            {/* Option 1: Normal - Pin bình thường, không có hư hại */}
                            <label className="flex items-center p-4 border rounded-lg cursor-pointer transition-colors duration-200 border-gray-600 hover:border-gray-500">
                                <input className="sr-only" type="radio" value="normal" name="condition" />
                                <div className="w-6 h-6 flex items-center justify-center mr-3 text-green-400">
                                    <i className="ri-check-line"></i>  {/* Icon check xanh */}
                                </div>
                                <div>
                                    <div className="font-medium">Normal</div>
                                    <div className="text-sm text-gray-400">Battery is in good condition with no visible damage</div>
                                </div>
                            </label>

                            {/* Option 2: Minor Damage - Xước nhỏ, không ảnh hưởng */}
                            <label className="flex items-center p-4 border rounded-lg cursor-pointer transition-colors duration-200 border-gray-600 hover:border-gray-500">
                                <input className="sr-only" type="radio" value="minor" name="condition" />
                                <div className="w-6 h-6 flex items-center justify-center mr-3 text-yellow-400">
                                    <i className="ri-alert-line"></i>  {/* Icon cảnh báo vàng */}
                                </div>
                                <div>
                                    <div className="font-medium">Minor Damage</div>
                                    <div className="text-sm text-gray-400">Minor scratches or cosmetic damage that doesn't affect performance</div>
                                </div>
                            </label>

                            {/* Option 3: Impact Damage - Hư hại nặng, ảnh hưởng an toàn */}
                            <label className="flex items-center p-4 border rounded-lg cursor-pointer transition-colors duration-200 border-gray-600 hover:border-gray-500">
                                <input className="sr-only" type="radio" value="impact" name="condition" />
                                <div className="w-6 h-6 flex items-center justify-center mr-3 text-red-400">
                                    <i className="ri-close-line"></i>  {/* Icon X đỏ */}
                                </div>
                                <div>
                                    <div className="font-medium">Impact Damage</div>
                                    <div className="text-sm text-gray-400">Significant damage that may affect battery safety or performance</div>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Phần 3: Ghi chú thêm (không bắt buộc) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Additional Notes (Optional)</label>
                        <textarea
                            placeholder="Describe any specific damage or observations..."
                            rows="4"
                            maxLength="500"
                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            spellCheck="false"
                        ></textarea>
                        {/* Đếm ký tự */}
                        <div className="text-xs text-gray-400 mt-1">0/500 characters</div>
                    </div>

                    {/* Phần 4: Nút submit Check-in */}
                    <div className="pt-4">
                        <button
                            className="font-medium rounded-lg transition-colors duration-200 whitespace-nowrap cursor-pointer bg-blue-700 hover:bg-blue-700 text-white px-6 py-3 text-lg w-full"
                            disabled
                        >
                            <i className="ri-check-double-line mr-2"></i>
                            Check-in Battery  {/* Ghi nhận pin vào hệ thống */}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

