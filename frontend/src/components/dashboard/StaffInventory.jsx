import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useContext";
import { batteryService } from "../../services/batteryService";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import Filter from "../common/Filter"
import BatteryCard from "../batteries/BatteryCard"

/**
 * StaffInventory - Battery inventory management dashboard
 * Displays batteries from the staff's station
 */
export default function StaffInventory() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [batteries, setBatteries] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    const [simulatingCharge, setSimulatingCharge] = React.useState(false);
    const [increaseAmount, setIncreaseAmount] = React.useState(10);

    const [filters, setFilters] = React.useState({
        model: "all",
        soc: "all",
        soh: "all",
        search: "",
    });

    // Fetch batteries by station_id
    React.useEffect(() => {
        const fetchBatteries = async (isInitialLoad = false) => {
            if (!user?.station_id) {
                setError("No station assigned to this staff");
                setLoading(false);
                return;
            }

            try {
                // Only show loading on initial load
                if (isInitialLoad) {
                    setLoading(true);
                }
                const data = await batteryService.getBatteriesByStationId(user.station_id);
                setBatteries(Array.isArray(data) ? data : []);
                setError(null);
            } catch (err) {
                console.error("Error fetching batteries:", err);
                setError(err.message || "Failed to fetch batteries");
                setBatteries([]);
            } finally {
                if (isInitialLoad) {
                    setLoading(false);
                }
            }
        };

        if (user?.station_id) {
            // Initial load with loading state
            fetchBatteries(true);

            // Auto-fetch batteries every 5 seconds for real-time updates (without showing loading)
            const interval = setInterval(() => {
                fetchBatteries(false);
            }, 5000)

            return () => clearInterval(interval)
        }
    }, [user?.station_id]);

    // Filter logic
    const filteredBatteries = React.useMemo(() => {
        if (!Array.isArray(batteries)) return [];
        return batteries.filter((battery) => {
            if (!battery) return false;
            // Search filter
            if (filters.search && filters.search.trim() !== "") {
                const q = filters.search.trim().toLowerCase();
                const batteryId = String(battery.battery_id || "").toLowerCase();
                if (!batteryId.includes(q)) return false;
            }
            // Status filter
            if (filters.status && filters.status !== "all" && battery.status !== filters.status) return false;
            // SOC filter
            const percentage = battery.capacity && battery.current_charge
                ? Math.max(0, Math.min(100, Math.round((battery.current_charge / battery.capacity) * 100)))
                : 0;
            if (filters.soc === "low" && percentage >= 40) return false;
            if (filters.soc === "medium" && (percentage < 40 || percentage >= 80)) return false;
            if (filters.soc === "high" && percentage < 80) return false;
            return true;
        });
    }, [batteries, filters]);

    // Pagination
    const [currentPage, setCurrentPage] = React.useState(1);
    const itemsPerPage = 8;
    const totalPages = Math.ceil(filteredBatteries.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentBatteries = filteredBatteries.slice(startIndex, endIndex);

    React.useEffect(() => {
        setCurrentPage(1);
    }, [filters]);

    const handleSimulateCharging = async () => {
        setSimulatingCharge(true);
        try {
            await batteryService.simulateCharging(user.station_id, increaseAmount);
            toast.success('Charging simulation completed successfully!');
            // Refresh batteries after simulation
            const data = await batteryService.getBatteriesByStationId(user.station_id);
            setBatteries(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error simulating charging:', err);
            toast.error(err.message || 'Failed to simulate charging');
        } finally {
            setSimulatingCharge(false);
        }
    };

    const handleCreateBattery = () => {
        navigate('/staff/batteries/create');
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-gray-900 text-xl">Loading batteries...</div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-red-500 text-xl">Error: {error}</div>
            </div>
        );
    }

    return (
        <div>
            {/* Page Heading */}
            <div className="flex flex-wrap justify-between gap-4 items-center mb-6">
                <div className="flex flex-col gap-1">
                    <p className="text-3xl font-black text-gray-900 leading-tight tracking-tight">Battery Inventory</p>
                    <p className="text-base font-normal text-gray-500">Monitor and manage battery slot status at your station.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleCreateBattery}
                        className="px-4 py-2 flex items-center justify-center gap-2 overflow-hidden rounded-lg h-10 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        <span className="truncate">Create Battery</span>
                    </button>
                    <button
                        onClick={handleSimulateCharging}
                        disabled={simulatingCharge}
                        className="px-4 py-2 bg-green-600 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {simulatingCharge ? 'Simulating...' : 'Simulate Charging'}
                    </button>
                </div>
            </div>

            {/* Increase Amount Input */}
            <div className="mb-6 flex items-center gap-4">
                <label htmlFor="increaseAmount" className="text-sm font-medium text-gray-700">
                    Charge Increase Amount (%)
                </label>
                <input
                    id="increaseAmount"
                    type="number"
                    min="1"
                    max="100"
                    value={increaseAmount}
                    onChange={(e) => setIncreaseAmount(Math.max(1, Math.min(100, parseInt(e.target.value) || 10)))}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-500">Default: 10%</span>
            </div>

            {/* Filter Section */}
            <Filter filters={filters} setFilters={setFilters} />

            {/* Battery Grid */}
            {filteredBatteries.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">No batteries match the selected filters</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-4 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {currentBatteries.map(battery => (
                            <BatteryCard key={battery.battery_id} battery={battery} />
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="mt-8 flex items-center justify-between">
                            <p className="text-sm text-gray-600">
                                Showing <span className="font-medium">{startIndex + 1}</span> to <span className="font-medium">{Math.min(endIndex, filteredBatteries.length)}</span> of <span className="font-medium">{filteredBatteries.length}</span> results
                            </p>
                            <nav className="flex items-center justify-center gap-1">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                {[...Array(Math.min(totalPages, 5))].map((_, idx) => {
                                    let pageNum;
                                    if (totalPages <= 5) {
                                        pageNum = idx + 1;
                                    } else if (currentPage <= 3) {
                                        pageNum = idx + 1;
                                    } else if (currentPage >= totalPages - 2) {
                                        pageNum = totalPages - 4 + idx;
                                    } else {
                                        pageNum = currentPage - 2 + idx;
                                    }
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setCurrentPage(pageNum)}
                                            className={`text-sm font-medium flex h-9 w-9 items-center justify-center rounded-lg ${currentPage === pageNum
                                                ? 'bg-blue-600 text-white'
                                                : 'text-gray-600 hover:bg-gray-100'
                                                }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                                {totalPages > 5 && currentPage < totalPages - 2 && (
                                    <>
                                        <span className="text-sm font-normal flex h-9 w-9 items-center justify-center text-gray-500">...</span>
                                        <button
                                            onClick={() => setCurrentPage(totalPages)}
                                            className="text-sm font-normal flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100"
                                        >
                                            {totalPages}
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </nav>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}