import React from 'react';
import { Button } from '../../components/ui/button';
import { Edit3 } from 'lucide-react';
import PersonalInfoEdit from './PersonalInfoEdit';

// Component hiển thị thông tin cá nhân của user - Cho phép xem và edit thông tin
export default function PersonalInfoCard({ user }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm mb-8">
      {/* Phần header: Tiêu đề + Nút edit */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
        <div>
          {/* Component PersonalInfoEdit - Cho phép user edit thông tin cá nhân */}
          <PersonalInfoEdit onUpdated={(updated) => {
            // Callback khi user cập nhật thông tin thành công
            // Thông tin đã được lưu vào localStorage trong component PersonalInfoEdit
            console.log('profile updated', updated);
          }} />
        </div>
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
        {/* Trường Address */}
        <div>
          <label className="text-sm font-medium text-gray-500">Address</label>
          <p className="text-gray-800 mt-1">—</p>  {/* Hiện tại không có dữ liệu địa chỉ */}
        </div>
      </div>
    </div>
  );
}
