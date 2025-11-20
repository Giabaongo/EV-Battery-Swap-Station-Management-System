
import { useState, useEffect } from 'react';
import { useAuth, useBattery } from '../../hooks/useContext';
import StaffWelcomeHeader from '../../components/staff-dashboard/StaffWelcomeHeader';
import BatteryStatsCards from '../../components/staff-dashboard/BatteryStatsCards';
import TransactionsTable from '../../components/staff-dashboard/TransactionsTable';

export default function StaffDashboard() {
    const { user } = useAuth();
    const { batteries, loading: batteriesLoading, getAllBatteriesByStationId } = useBattery();
    const [stats, setStats] = useState({
        fullBatteries: 0,
        chargingBatteries: 0,
        maintenanceBatteries: 0
    });

    // Fetch batteries for assigned station on mount (for station staff)
    useEffect(() => {
        if (user?.role === 'station_staff' && user?.station_id) {
            getAllBatteriesByStationId(user.station_id);
        }
        // Optionally, clear batteries if user logs out or role changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.role, user?.station_id]);

    useEffect(() => {
        if (batteries && batteries.length > 0) {
            const full = batteries.filter(b => b.status === 'full').length;
            const charging = batteries.filter(b => b.status === 'charging').length;
            const maintenance = batteries.filter(b => b.status === 'maintenance').length;

            setStats({
                fullBatteries: full,
                chargingBatteries: charging,
                maintenanceBatteries: maintenance
            });
        } else {
            setStats({
                fullBatteries: 0,
                chargingBatteries: 0,
                maintenanceBatteries: 0
            });
        }
    }, [batteries]);

    return (
        <div className="flex-1 p-8">
            <div className="flex flex-col gap-8">
                <StaffWelcomeHeader user={user} />
                <BatteryStatsCards stats={stats} loading={batteriesLoading} />
                <TransactionsTable />
            </div>
        </div>
    );
}
