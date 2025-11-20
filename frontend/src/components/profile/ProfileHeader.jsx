import React from 'react';

// Component tiêu đề trang hồ sơ cá nhân
export default function ProfileHeader({ title = 'My Profile', subtitle = 'Manage your personal and vehicle information.' }) {
  return (
    <header className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-gray-500">{subtitle}</p>}
      </div>
    </header>
  );
}

