import React from 'react';

// Component header trang hỗ trợ - Tiêu đề + mô tả trang support
export default function SupportHeader() {
  return (
    // Container header - Căn giữa, khoảng cách dưới
    <div className="flex flex-col gap-2 mb-6">
      {/* Tiêu đề chính - "Support & Feedback" */}
      <h1 className="text-3xl md:text-4xl font-black tracking-tight text-gray-900">Support & Feedback</h1>
      {/* Mô tả - Hướng dẫn user cách sử dụng trang */}
      <p className="text-gray-600">We're here to help. Select a station, a category, and tell us about your experience.</p>
    </div>
  );
}
