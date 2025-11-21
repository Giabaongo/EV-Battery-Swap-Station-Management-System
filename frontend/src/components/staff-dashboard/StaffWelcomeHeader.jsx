import { MapPin } from 'lucide-react';
import { useStation } from '../../hooks/useContext';
import { useState, useEffect } from 'react';

export default function StaffWelcomeHeader({ user }) {
  const { getStationById } = useStation();
  const [currentStation, setCurrentStation] = useState(null);

  // Fetch staff's assigned station by station_id
  useEffect(() => {
    const fetchStaffStation = async () => {
      const staffStationId = user?.station_id;

      if (!staffStationId) {
        console.warn('Staff has no station_id assigned');
        return;
      }

      try {
        const station = await getStationById(staffStationId);
        setCurrentStation(station);
      } catch (err) {
        console.error('Error fetching staff station:', err);
      }
    };

    if (user?.station_id) {
      fetchStaffStation();
    }
  }, [user?.station_id, getStationById]);

  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Welcome back, {user?.full_name || user?.username || 'Staff'}!
      </h1>
      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
        <MapPin className="w-5 h-5" />
        <p className="text-base">
          You are currently working at{' '}
          <span className="font-semibold text-gray-800 dark:text-gray-200">
            {currentStation?.name || 'Undefined Station'}
          </span>
        </p>
      </div>
    </div>
  );
}