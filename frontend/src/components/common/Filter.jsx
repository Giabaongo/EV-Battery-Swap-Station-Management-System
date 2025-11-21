import { Search } from 'lucide-react';

export default function Filter({ filters, setFilters }) {
    const handleReset = () => {
        setFilters({
            model: "all",
            soc: "all",
            soh: "all",
            search: "",
            status: "all"
        });
    };

    return (
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
            <div className="grid grid-cols-5 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {/* Search Input */}
                <div className="relative sm:col-span-2 lg:col-span-2">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Search className="text-gray-400" size={20} />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by Battery ID..."
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        className="block w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Status Filter */}
                <select
                    value={filters.status || "all"}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                >
                    <option value="all">Status</option>
                    <option value="full">Available</option>
                    <option value="charging">Charging</option>
                    <option value="booked">Booked</option>
                    <option value="defective">Defective</option>
                    <option value="in_use">In Use</option>
                    <option value="in_transit">In Transit</option>
                </select>

                {/* State of Charge Filter */}
                <select
                    value={filters.soc}
                    onChange={(e) => setFilters({ ...filters, soc: e.target.value })}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                >
                    <option value="all">State of Charge</option>
                    <option value="high">High (80-100%)</option>
                    <option value="medium">Medium (40-79%)</option>
                    <option value="low">Low (0-39%)</option>
                </select>

                {/* Reset Button */}
                <button
                    onClick={handleReset}
                    className="w-full justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                    Reset Filters
                </button>
            </div>
        </div>
    );
}
