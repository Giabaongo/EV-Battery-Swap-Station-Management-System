import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import batteryTransferService from '../../services/batteryTransferService'

function BatterySelectionModal({ isOpen, ticketId, requiredQuantity, transferRequestId, ticketType, stationId, onClose, onConfirm }) {
    const [batteries, setBatteries] = useState([])
    const [selectedBatteries, setSelectedBatteries] = useState(new Set())
    const [loading, setLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Fetch available batteries when modal opens
    useEffect(() => {
        if (isOpen && transferRequestId && ticketType && stationId) {
            fetchAvailableBatteries()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, transferRequestId, ticketType, stationId])

    const fetchAvailableBatteries = async () => {
        try {
            setLoading(true)
            // Get list of batteries with enriched details (includes current_charge from full battery data)
            const data = await batteryTransferService.getAvailableBatteriesEnriched(
                transferRequestId,
                ticketType,
                stationId
            )

            // Handle response - API returns { available_batteries: [...] }
            const batteriesList = data.available_batteries || (Array.isArray(data) ? data : data.data || [])
            setBatteries(batteriesList)
            setSelectedBatteries(new Set()) // Reset selection when fetching new data
        } catch (error) {
            console.error('Error fetching available batteries:', error)
            toast.error('Failed to load available batteries')
        } finally {
            setLoading(false)
        }
    }

    const handleSelectBattery = (batteryId) => {
        const newSelected = new Set(selectedBatteries)
        if (newSelected.has(batteryId)) {
            newSelected.delete(batteryId)
        } else {
            // Prevent selecting more than required quantity
            if (newSelected.size < requiredQuantity) {
                newSelected.add(batteryId)
            } else {
                toast.error(`You can only select ${requiredQuantity} batteries`)
                return
            }
        }
        setSelectedBatteries(newSelected)
    }

    const handleSelectAll = () => {
        if (selectedBatteries.size === requiredQuantity) {
            setSelectedBatteries(new Set())
        } else {
            const newSelected = new Set()
            for (let i = 0; i < Math.min(requiredQuantity, filteredBatteries.length); i++) {
                newSelected.add(filteredBatteries[i].battery_id || filteredBatteries[i].id)
            }
            setSelectedBatteries(newSelected)
        }
    }

    const handleConfirm = async () => {
        if (selectedBatteries.size !== requiredQuantity) {
            toast.error(`Please select exactly ${requiredQuantity} batteries`)
            return
        }
        // Prevent duplicate submission
        if (isSubmitting) return

        try {
            setIsSubmitting(true)
            // Call parent to create ticket with selected battery IDs
            await onConfirm(Array.from(selectedBatteries))
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleClose = () => {
        setSelectedBatteries(new Set())
        setSearchQuery('')
        onClose()
    }

    // Filter batteries based on search query
    const filteredBatteries = batteries.filter(battery => {
        const query = searchQuery.toLowerCase()
        const batteryId = (battery.battery_id || battery.id || '').toString().toLowerCase()
        const model = (battery.model || battery.battery_model || '').toLowerCase()
        return batteryId.includes(query) || model.includes(query)
    })

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="relative flex flex-col w-full max-w-4xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-xl shadow-2xl">
                {/* Header */}
                <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-2xl font-bold text-[#212529] dark:text-white">
                            Select Batteries for Dispatch (Ticket #{ticketId})
                        </h2>
                        <p className="text-base text-gray-600 dark:text-gray-400">
                            Please select {requiredQuantity} available batteries
                        </p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Search and Filter Bar */}
                <div className="flex items-center gap-4 p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="relative flex-1">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search by Battery ID or Model..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>
                </div>

                {/* Content - Scrollable Table */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex justify-center items-center h-40">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        </div>
                    ) : filteredBatteries.length === 0 ? (
                        <div className="flex justify-center items-center h-40 text-gray-500 dark:text-gray-400">
                            <p>No batteries available</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
                                <thead className="bg-gray-50 dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-300 uppercase tracking-wider sticky top-0">
                                    <tr>
                                        <th className="p-4 w-12">
                                            <input
                                                type="checkbox"
                                                checked={selectedBatteries.size === requiredQuantity && requiredQuantity > 0}
                                                onChange={handleSelectAll}
                                                className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded cursor-pointer dark:bg-gray-700 dark:border-gray-600 focus:ring-primary"
                                            />
                                        </th>
                                        <th className="px-6 py-3">Battery ID</th>
                                        <th className="px-6 py-3">Model</th>
                                        <th className="px-6 py-3">State of Charge (SOC)</th>
                                        <th className="px-6 py-3">State of Health (SOH)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {filteredBatteries.map((battery) => {
                                        const batteryId = battery.battery_id || battery.id
                                        const isSelected = selectedBatteries.has(batteryId)
                                        return (
                                            <tr
                                                key={batteryId}
                                                className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                                                    }`}
                                                onClick={() => handleSelectBattery(batteryId)}
                                            >
                                                <td className="p-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => { }}
                                                        className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded cursor-pointer dark:bg-gray-700 dark:border-gray-600 focus:ring-primary"
                                                    />
                                                </td>
                                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                                                    {batteryId}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {battery.model || battery.battery_model || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {battery.current_charge || battery.soc || battery.state_of_charge || 0}%
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {battery.soh || battery.state_of_health || 0}%
                                                    </span>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        Selected: <span className="font-bold text-gray-900 dark:text-white">{selectedBatteries.size}/{requiredQuantity}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleClose}
                            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={selectedBatteries.size !== requiredQuantity || isSubmitting}
                            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                        >
                            {isSubmitting ? 'Processing...' : `Confirm Dispatch of ${requiredQuantity} Batteries`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default BatterySelectionModal
