import React from 'react';

// Component liên hệ hỗ trợ - Hiển thị thông tin liên hệ email/phone
export default function SupportContact() {
  return (
    // Hộp chứa - Nằm dưới, text nhỏ, màu xám
    <div className="mt-8 text-center text-sm text-gray-500">
      <p>
        {/* Nội dung liên hệ (hiện đang comment out) */}
        {/* For urgent inquiries, please contact us at{' '}
        <a href="mailto:support@evcharging.com" className="text-blue-700 hover:underline">support@evcharging.com</a>{' '}
        or call{' '}
        <a href="tel:1-800-123-4567" className="text-blue-700 hover:underline">1-800-123-4567</a>. */}
      </p>
    </div>
  );
}

