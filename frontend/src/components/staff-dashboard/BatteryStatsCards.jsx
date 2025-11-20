import { BatteryFull, BatteryCharging, Wrench } from 'lucide-react';

export default function BatteryStatsCards({ stats, loading }) {
    const cards = [
        {
            title: 'Total Full Batteries',
            value: stats.fullBatteries,
            icon: BatteryFull,
            bgColor: 'bg-green-100 dark:bg-green-900/50',
            iconColor: 'text-green-600 dark:text-green-400'
        },
        {
            title: 'Batteries Currently Charging',
            value: stats.chargingBatteries,
            icon: BatteryCharging,
            bgColor: 'bg-blue-100 dark:bg-blue-900/50',
            iconColor: 'text-blue-700 dark:text-blue-400'
        },
        {
            title: 'Batteries Under Maintenance',
            value: stats.maintenanceBatteries,
            icon: Wrench,
            bgColor: 'bg-yellow-100 dark:bg-yellow-900/50',
            iconColor: 'text-yellow-600 dark:text-yellow-400'
        }
    ];

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-xl p-6 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 animate-pulse">
                        <div className="flex items-start gap-4">
                            <div className="size-12 rounded-lg bg-gray-200 dark:bg-gray-700"></div>
                            <div className="flex-1">
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.map((card, index) => (
                <div
                    key={index}
                    className="flex items-start gap-4 rounded-xl p-8 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-lg transition-shadow"
                >
                    <div className={`flex items-center justify-center size-12 rounded-lg ${card.bgColor}`}>
                        <card.icon className={`w-7 h-7 ${card.iconColor}`} />
                    </div>
                    <div className="flex flex-col">
                        <p className="text-gray-600 dark:text-gray-400 text-sm font-medium leading-normal">
                            {card.title}
                        </p>
                        <p className="text-gray-900 dark:text-white tracking-light text-3xl font-bold leading-tight">
                            {card.value}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}
