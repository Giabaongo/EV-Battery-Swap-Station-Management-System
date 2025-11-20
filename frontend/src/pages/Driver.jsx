import Sidebar from '../components/layout/Sidebar'
import { Outlet } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuth, useReservation } from '../hooks/useContext'

export default function Driver() {
  const { user } = useAuth();
  const { getReservationsByUserId } = useReservation();

  // Fetch existing reservations on mount
  useEffect(() => {
    const fetchReservations = async () => {
      if (!user?.user_id) return;
      try {
        await getReservationsByUserId(user.user_id);
      } catch (error) {
        console.error('Failed to fetch user reservations:', error);
      }
    };
    fetchReservations();
  }, [user?.user_id, getReservationsByUserId]);

  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      {/* Aurora Dream Diagonal Flow */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 5% 40%, #ffffffdc, transparent 67%),
            radial-gradient(ellipse 70% 60% at 45% 45%, #6699ff69, transparent 67%),
            radial-gradient(ellipse 62% 52% at 83% 76%, #b9e2ffb4, transparent 63%),
            radial-gradient(ellipse 60% 48% at 75% 20%, #eff1f8bc, transparent 66%),
            linear-gradient(45deg, #eaeeffff 0%, #ffffffff 100%)
          `,
        }}
      />

      {/* Content */}
      <div className="min-h-screen relative z-10">
        <Sidebar />
        <main className="ml-64 px-6 py-4">
          <div className="max-w-7xl mx-auto">
            {/* Trang con sẽ render ở đây - pass user context */}
            <Outlet context={{ user }} />
          </div>
        </main>
      </div>


    </div>
  )
}