import React from 'react';

// Component hiển thị thông tin cá nhân của user
export default function PersonalInfoCard({ user }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm mb-8">
      {/* Phần header: Tiêu đề */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
      </div>

      {/* Lưới hiển thị thông tin: 2 cột trên desktop, responsive trên mobile */}
      <div className="grid grid-cols-2 sm:grid-cols-2 gap-x-6 gap-y-4">
        {/* Trường Full Name */}
        <div>
          <label className="text-sm font-medium text-gray-500">Full Name</label>
          <p className="text-gray-800 mt-1">{user?.username || '—'}</p>  {/* Hiển thị username hoặc '—' nếu không có */}
        </div>
        {/* Trường Email */}
        <div>
          <label className="text-sm font-medium text-gray-500">Email Address</label>
          <p className="text-gray-800 mt-1">{user?.email || '—'}</p>  {/* Hiển thị email hoặc '—' */}
        </div>
        {/* Trường Phone */}
        <div>
          <label className="text-sm font-medium text-gray-500">Phone Number</label>
          <p className="text-gray-800 mt-1">{user?.phone || '—'}</p>  {/* Hiển thị số điện thoại hoặc '—' */}
        </div>
      </div>
    </div>
  );
}
