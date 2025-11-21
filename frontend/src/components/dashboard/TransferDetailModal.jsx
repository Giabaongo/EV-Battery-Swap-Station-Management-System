import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import batteryTransferService from '../../services/batteryTransferService'

function TransferDetailModal({
    isOpen,
    ticketId,
    transferRequestId,
    ticketType,
    onClose
}) {
    const [transferData, setTransferData] = useState(null)
    const [batteries, setBatteries] = useState([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (isOpen && transferRequestId && ticketId) {
            fetchTransferDetail()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, transferRequestId, ticketId])

    const fetchTransferDetail = async () => {
        try {
            setLoading(true)
            // Get transfer request data which has all the info we need
            const requestData = await batteryTransferService.getRequestById(transferRequestId)

            setTransferData({
                request: requestData
            })

            // Get available batteries for this transfer (will show what was exported/imported)
            const batteriesData = await batteryTransferService.getAvailableBatteriesEnriched(
                transferRequestId,
                ticketType,
                requestData.to_station_id // For enrichment, use to_station_id
            )

            if (batteriesData.available_batteries) {
                setBatteries(batteriesData.available_batteries)
            }
        } catch (error) {
            console.error('Error fetching transfer detail:', error)
            toast.error('Failed to load transfer details')
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A'
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getStatusBadge = (status) => {
        const statusConfig = {
            completed: { bg: 'bg-green-100 dark:bg-green-900/50', text: 'text-green-800 dark:text-green-300', label: 'Completed' },
            in_progress: { bg: 'bg-blue-100 dark:bg-blue-900/50', text: 'text-blue-800 dark:text-blue-300', label: 'In Progress' },
            cancelled: { bg: 'bg-red-100 dark:bg-red-900/50', text: 'text-red-800 dark:text-red-300', label: 'Cancelled' }
        }
        const config = statusConfig[status] || statusConfig.in_progress
        return (
            <span className={`inline-flex items-center rounded-full ${config.bg} px-3 py-1 text-sm font-medium ${config.text}`}>
                {config.label}
            </span>
        )
    }

    if (!isOpen || !transferData || !transferData.request) return null

    const request = transferData.request
    const isExport = ticketType === 'export'

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="relative flex flex-col w-full max-w-4xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-bold text-[#212529] dark:text-white">
                                {isExport ? 'Dispatch Manifest' : 'Transfer Receipt'}
                            </h2>
                            <span className="text-sm text-gray-500 dark:text-gray-400">Ticket #{ticketId}</span>
                        </div>
                        {getStatusBadge(request?.status)}
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex justify-center items-center h-40">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Summary Section */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">From Station</p>
                                    <p className="font-medium text-gray-900 dark:text-white mt-1">
                                        {isExport ? request?.fromStation?.station_name : request?.fromStation?.station_name}
                                    </p>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">To Station</p>
                                    <p className="font-medium text-gray-900 dark:text-white mt-1">
                                        {isExport ? request?.toStation?.station_name : request?.toStation?.station_name}
                                    </p>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Quantity</p>
                                    <p className="font-medium text-gray-900 dark:text-white mt-1">
                                        {batteries.length} / {request?.quantity}
                                    </p>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{isExport ? 'Dispatched' : 'Received'}</p>
                                    <p className="font-medium text-gray-900 dark:text-white mt-1">
                                        {formatDate(request?.created_at)}
                                    </p>
                                </div>
                            </div>

                            {/* Batteries Table */}
                            <div>
                                <h3 className="text-lg font-semibold mb-4 text-[#212529] dark:text-white">
                                    {isExport ? 'Dispatched Batteries' : 'Received Batteries'} ({batteries.length})
                                </h3>
                                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left text-gray-600 dark:text-gray-400">
                                            <thead className="bg-gray-50 dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                                <tr>
                                                    <th className="px-6 py-3">Battery ID</th>
                                                    <th className="px-6 py-3">Model</th>
                                                    <th className="px-6 py-3 text-center">SOC</th>
                                                    <th className="px-6 py-3 text-center">SOH</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                                {batteries.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="4" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                                                            No batteries found
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    batteries.map((battery) => (
                                                        <tr key={battery.battery_id || battery.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                                                                {battery.battery_id || battery.id}
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                {battery.model || battery.battery_model || 'N/A'}
                                                            </td>
                                                            <td className="px-6 py-4 text-center">
                                                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                                    {battery.current_charge || battery.soc || battery.state_of_charge || 0}%
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-center">
                                                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                                    {battery.soh || battery.state_of_health || 0}%
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
}

export default TransferDetailModal
