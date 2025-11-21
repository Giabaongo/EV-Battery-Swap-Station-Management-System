import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import batteryTransferService from '../../services/batteryTransferService'

function ConfirmReceiveBatteriesModal({
    isOpen,
    ticketId,
    transferRequestId,
    stationId,
    onClose,
    onConfirm
}) {
    const [batteries, setBatteries] = useState([])
    const [loading, setLoading] = useState(false)
    const [confirmChecked, setConfirmChecked] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Fetch batteries from export ticket when modal opens
    useEffect(() => {
        if (isOpen && transferRequestId && stationId) {
            fetchExportedBatteries()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, transferRequestId, stationId])

    const fetchExportedBatteries = async () => {
        try {
            setLoading(true)
            // Get available batteries for import (what was exported by source station)
            const data = await batteryTransferService.getAvailableBatteriesEnriched(
                transferRequestId,
                'import', // Import ticket to see what needs to be received
                stationId
            )

            const batteriesList = data.available_batteries || (Array.isArray(data) ? data : data.data || [])
            setBatteries(batteriesList)
        } catch (error) {
            console.error('Error fetching exported batteries:', error)
            toast.error('Failed to load battery list')
        } finally {
            setLoading(false)
        }
    }

    const handleConfirm = async () => {
        if (!confirmChecked) {
            toast.error('Please confirm that all batteries are in good condition')
            return
        }

        // Prevent duplicate submission
        if (isSubmitting) return

        try {
            setIsSubmitting(true)
            // Call parent with battery IDs to confirm import
            // IMPORTANT: Convert to integers as backend expects number[]
            const batteryIds = batteries.map(b => {
                const id = b.battery_id || b.id
                const numId = Number(id)
                if (isNaN(numId)) {
                    console.error(`Invalid battery ID: ${id}`, b)
                    throw new Error(`Invalid battery ID: ${id}`)
                }
                return numId
            })

            console.log('Sending battery IDs to backend:', batteryIds, 'Type:', typeof batteryIds[0])
            await onConfirm(batteryIds)

            // Reset state
            setConfirmChecked(false)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleClose = () => {
        setConfirmChecked(false)
        onClose()
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="relative flex flex-col w-full max-w-2xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-xl shadow-2xl">
                {/* Header */}
                <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-2xl font-bold text-[#212529] dark:text-white">
                            Confirm Received Batteries (Ticket #{ticketId})
                        </h2>
                        <p className="text-base text-gray-600 dark:text-gray-400">
                            Verify the list of batteries received from source station.
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

                {/* Content - Scrollable Table */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex justify-center items-center h-40">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        </div>
                    ) : batteries.length === 0 ? (
                        <div className="flex justify-center items-center h-40 text-gray-500 dark:text-gray-400">
                            <p>No batteries to receive</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
                                <thead className="bg-gray-50 dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-300 uppercase tracking-wider sticky top-0">
                                    <tr>
                                        <th className="px-6 py-3">Battery ID</th>
                                        <th className="px-6 py-3">Model</th>
                                        <th className="px-6 py-3">State of Charge (SOC)</th>
                                        <th className="px-6 py-3">State of Health (SOH)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {batteries.map((battery) => {
                                        const batteryId = battery.battery_id || battery.id
                                        return (
                                            <tr key={batteryId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
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

                {/* Confirmation Checkbox */}
                {!loading && batteries.length > 0 && (
                    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                        <label className="flex items-start gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={confirmChecked}
                                onChange={(e) => setConfirmChecked(e.target.checked)}
                                className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary dark:bg-gray-700 dark:border-gray-600"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                                I confirm that all batteries listed above have been received and are in good condition.
                            </span>
                        </label>
                    </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <button
                        onClick={handleClose}
                        className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium"
                    >
                        Report Issue
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!confirmChecked || loading || isSubmitting}
                        className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                        {isSubmitting ? 'Confirming...' : 'Confirm & Add to Inventory'}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ConfirmReceiveBatteriesModal
