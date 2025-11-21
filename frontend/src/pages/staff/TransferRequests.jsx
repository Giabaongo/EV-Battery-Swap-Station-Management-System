import React, { useState, useEffect } from 'react'
import TransferTicketCard from '../../components/dashboard/TransferTicketCard'
import BatterySelectionModal from '../../components/dashboard/BatterySelectionModal'
import ConfirmReceiveBatteriesModal from '../../components/dashboard/ConfirmReceiveBatteriesModal'
import { useAuth } from '../../hooks/useContext'
import batteryTransferService from '../../services/batteryTransferService'
import { toast } from 'sonner'
import { useTicketWebSocket } from '../../hooks/useTicketWebSocket'
import { useTransferWebSocket } from '../../hooks/useTransferWebSocket'

function StaffTransfer() {
    const { user } = useAuth()
    const [pendingRequests, setPendingRequests] = useState([])
    const [allRequests, setAllRequests] = useState([])
    const [filteredRequests, setFilteredRequests] = useState([])
    const [loading, setLoading] = useState(true)

    // Filter states
    const [searchQuery, setSearchQuery] = useState('')
    const [filterType, setFilterType] = useState('all')
    const [filterFromStation, setFilterFromStation] = useState('')
    const [filterToStation, setFilterToStation] = useState('')

    // Pagination for pending exports and imports
    const [exportIndex, setExportIndex] = useState(0)
    const [importIndex, setImportIndex] = useState(0)

    // Pagination for transfer history
    const [historyPage, setHistoryPage] = useState(1)
    const itemsPerPage = 10

    // Modal state for battery selection
    const [showBatteryModal, setShowBatteryModal] = useState(false)
    const [selectedTransfer, setSelectedTransfer] = useState(null)
    const [selectedTicketType, setSelectedTicketType] = useState(null)

    // Modal state for confirm receive batteries
    const [showConfirmReceiveModal, setShowConfirmReceiveModal] = useState(false)

    // WebSocket for real-time transfer request updates
    useTransferWebSocket(
        (data) => {
            console.log('🔔 Transfer request created:', data)
            fetchData(false)
        },
        (data) => {
            console.log('🔔 Transfer request updated:', data)
            fetchData(false)
        },
        (data) => {
            console.log('🔔 Transfer request status updated:', data)
            fetchData(false)
        },
        !!user?.station_id
    )

    // WebSocket for real-time ticket updates
    useTicketWebSocket(
        (data) => {
            console.log('🔔 Ticket created:', data)
            fetchData(false)
        },
        (data) => {
            console.log('🔔 Export ticket completed:', data)
            fetchData(false)
        },
        (data) => {
            console.log('🔔 Import ticket completed:', data)
            fetchData(false)
        },
        !!user?.station_id
    )

    // Initial data load
    useEffect(() => {
        if (user?.station_id) {
            fetchData(true)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.station_id])



    useEffect(() => {
        applyFilters()
        setHistoryPage(1) // Reset to first page when filters change
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [allRequests, searchQuery, filterType, filterFromStation, filterToStation])

    const fetchData = async (isInitialLoad = false) => {
        try {
            // Only show loading on initial load
            if (isInitialLoad) {
                setLoading(true)
            }

            // Get all requests for pending section (imports/exports)
            const allResponse = await batteryTransferService.getAllRequests()
            let allRequests = Array.isArray(allResponse) ? allResponse : allResponse.data || [];

            // Enrich requests with station info (names)
            allRequests = await batteryTransferService.enrichRequestsWithStationInfo(allRequests)

            // Filter pending requests for current station
            const pending = allRequests.filter(
                req => req.status === 'in_progress' &&
                    (req.from_station_id === user.station_id || req.to_station_id === user.station_id)
            )

            setPendingRequests(pending)

            // Get tickets for history section (by station_id) - THIS IS TICKETS, NOT REQUESTS
            const ticketsResponse = await batteryTransferService.getTicketByStationId(user.station_id)
            let tickets = Array.isArray(ticketsResponse) ? ticketsResponse : ticketsResponse.data || [];

            // Enrich tickets with transfer request and station info
            tickets = await batteryTransferService.enrichTicketsWithTransferRequestInfo(tickets)

            // Add transfer request status to each ticket for display purposes
            tickets = tickets.map(ticket => {
                const transferRequest = allRequests.find(req => req.transfer_request_id === ticket.transfer_request_id)
                return {
                    ...ticket,
                    transfer_request_status: transferRequest?.status || 'unknown'
                }
            })

            setAllRequests(tickets)
        } catch (error) {
            console.error('Error fetching transfer data:', error)
            toast.error('Failed to load transfer requests')
        } finally {
            if (isInitialLoad) {
                setLoading(false)
            }
        }
    }

    const applyFilters = () => {
        let filtered = [...allRequests]

        if (searchQuery) {
            filtered = filtered.filter(req => {
                const reqId = (req.transfer_request_id || '').toString().toLowerCase()
                const from = (req.fromStation?.station_name || '').toLowerCase()
                const to = (req.toStation?.station_name || '').toLowerCase()
                return reqId.includes(searchQuery.toLowerCase()) ||
                    from.includes(searchQuery.toLowerCase()) ||
                    to.includes(searchQuery.toLowerCase())
            })
        }

        if (filterType && filterType !== 'all') {
            filtered = filtered.filter(req => {
                const reqType = req.to_station_id === user?.station_id ? 'import' : 'export'
                return reqType === filterType
            })
        }

        if (filterFromStation) {
            filtered = filtered.filter(req =>
                req.fromStation?.station_name === filterFromStation
            )
        }

        if (filterToStation) {
            filtered = filtered.filter(req =>
                req.toStation?.station_name === filterToStation
            )
        }

        setFilteredRequests(filtered)
    }

    const handleConfirm = (request) => {
        // Determine ticket type based on whether it's export or import
        const ticketType = request.from_station_id === user?.station_id ? 'export' : 'import'
        setSelectedTransfer(request)
        setSelectedTicketType(ticketType)

        // For export: show battery selection modal to pick which batteries to export
        // For import: show confirm receive modal to verify received batteries
        if (ticketType === 'export') {
            setShowBatteryModal(true)
        } else {
            setShowConfirmReceiveModal(true)
        }
    }

    const handleBatterySelectionConfirm = async (selectedBatteryIds) => {
        try {
            // Create ticket with selected batteries
            await batteryTransferService.createTicket({
                transfer_request_id: selectedTransfer.transfer_request_id,
                ticket_type: selectedTicketType,
                station_id: user.station_id,
                staff_id: user.user_id,
                battery_ids: selectedBatteryIds
            })
            toast.success('Transfer confirmed and ticket created successfully')
            setShowBatteryModal(false)
            setSelectedTransfer(null)
            setSelectedTicketType(null)
            fetchData()
        } catch (error) {
            console.error('Error confirming transfer:', error)
            toast.error('Failed to confirm transfer')
        }
    }

    const handleConfirmReceiveBatteries = async (receivedBatteryIds) => {
        try {
            console.log('Creating import ticket with:')
            console.log('  transfer_request_id:', selectedTransfer.transfer_request_id)
            console.log('  ticket_type: import')
            console.log('  station_id:', user.station_id)
            console.log('  staff_id:', user.user_id)
            console.log('  battery_ids:', receivedBatteryIds, 'Types:', receivedBatteryIds.map(id => typeof id))

            // Create import ticket with received batteries
            await batteryTransferService.createTicket({
                transfer_request_id: selectedTransfer.transfer_request_id,
                ticket_type: 'import',
                station_id: user.station_id,
                staff_id: user.user_id,
                battery_ids: receivedBatteryIds
            })
            toast.success('Batteries confirmed and added to inventory')
            setShowConfirmReceiveModal(false)
            setSelectedTransfer(null)
            setSelectedTicketType(null)
            fetchData()
        } catch (error) {
            console.error('Error confirming received batteries:', error)
            const errorMsg = error.response?.data?.message || error.message || 'Failed to confirm received batteries'
            toast.error(errorMsg)
        }
    }

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A'
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        })
    }

    // Get list of transfer_request_ids that already have tickets created
    const requestsWithExportTickets = new Set()
    const requestsWithImportTickets = new Set()

    allRequests.forEach(ticket => {
        if (ticket.ticket_type === 'export') {
            requestsWithExportTickets.add(ticket.transfer_request_id)
        } else if (ticket.ticket_type === 'import') {
            requestsWithImportTickets.add(ticket.transfer_request_id)
        }
    })

    // Separate pending requests into exports and imports
    // IMPORTANT: Exclude requests that already have tickets created
    const pendingExports = pendingRequests.filter(req =>
        req.from_station_id === user?.station_id && !requestsWithExportTickets.has(req.transfer_request_id)
    )
    const pendingImports = pendingRequests.filter(req =>
        req.to_station_id === user?.station_id && !requestsWithImportTickets.has(req.transfer_request_id)
    )

    const currentExport = pendingExports[exportIndex]
    const currentImport = pendingImports[importIndex]

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header with title and user info */}
                <div className="flex items-center justify-between gap-3 mb-8">
                    <h1 className="text-[#212529] dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">
                        Battery Transfer Management
                    </h1>
                </div>

                {/* Pending Transfers Section - 2 Column Grid */}
                <section className="mb-10">
                    <div className="grid grid-cols-2 lg:grid-cols-2 gap-8">
                        {/* Pending Exports Column */}
                        <div className="flex flex-col">
                            <div className="flex items-center justify-between pb-3 pt-5">
                                <h2 className="text-[#212529] dark:text-white text-[22px] font-bold leading-tight tracking-[-0.015em]">
                                    Pending Exports
                                </h2>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                        {pendingExports.length > 0 ? `Export ${exportIndex + 1} of ${pendingExports.length}` : 'No exports'}
                                    </span>
                                    {pendingExports.length > 1 && (
                                        <div className="flex items-center">
                                            <button
                                                onClick={() => setExportIndex(Math.max(0, exportIndex - 1))}
                                                disabled={exportIndex === 0}
                                                className="flex items-center justify-center size-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => setExportIndex(Math.min(pendingExports.length - 1, exportIndex + 1))}
                                                disabled={exportIndex === pendingExports.length - 1}
                                                className="flex items-center justify-center size-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {currentExport ? (
                                <TransferTicketCard
                                    type="export"
                                    stationLabel={`From: ${currentExport.fromStation?.station_name || 'Unknown'}`}
                                    fromStation={currentExport.fromStation?.station_name || 'Unknown'}
                                    toStation={currentExport.toStation?.station_name || 'Unknown'}
                                    quantity={currentExport.quantity}
                                    model={currentExport.battery_model || 'N/A'}
                                    buttonText="Confirm & Prepare for Dispatch"
                                    onConfirm={() => handleConfirm(currentExport)}
                                    borderColor="border-orange-500"
                                    icon="ri-arrow-right-up-line"
                                    iconColor="text-orange-500"
                                />
                            ) : (
                                <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-orange-300 dark:border-orange-900/50 bg-orange-50 dark:bg-orange-900/10 min-h-[261px]">
                                    <p className="text-orange-600 dark:text-orange-400 font-medium text-lg">No pending exports</p>
                                </div>
                            )}
                        </div>

                        {/* Pending Imports Column */}
                        <div className="flex flex-col">
                            <div className="flex items-center justify-between pb-3 pt-5">
                                <h2 className="text-[#212529] dark:text-white text-[22px] font-bold leading-tight tracking-[-0.015em]">
                                    Pending Imports
                                </h2>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                        {pendingImports.length > 0 ? `Import ${importIndex + 1} of ${pendingImports.length}` : 'No imports'}
                                    </span>
                                    {pendingImports.length > 1 && (
                                        <div className="flex items-center">
                                            <button
                                                onClick={() => setImportIndex(Math.max(0, importIndex - 1))}
                                                disabled={importIndex === 0}
                                                className="flex items-center justify-center size-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => setImportIndex(Math.min(pendingImports.length - 1, importIndex + 1))}
                                                disabled={importIndex === pendingImports.length - 1}
                                                className="flex items-center justify-center size-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {currentImport ? (
                                <TransferTicketCard
                                    type="import"
                                    stationLabel={`To: ${currentImport.toStation?.station_name || 'Unknown'}`}
                                    fromStation={currentImport.fromStation?.station_name || 'Unknown'}
                                    toStation={currentImport.toStation?.station_name || 'Unknown'}
                                    quantity={currentImport.quantity}
                                    model={currentImport.battery_model || 'N/A'}
                                    buttonText="Receive & Confirm Inventory"
                                    onConfirm={() => handleConfirm(currentImport)}
                                    borderColor="border-green-500"
                                    icon="ri-arrow-left-down-line"
                                    iconColor="text-green-500"
                                />
                            ) : (
                                <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-green-300 dark:border-green-900/50 bg-green-50 dark:bg-green-900/10 min-h-[261px]">
                                    <p className="text-green-600 dark:text-green-400 font-medium text-lg">No pending imports</p>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Transfer History Section */}
                <section className="mt-10">
                    <h2 className="text-[#212529] dark:text-white text-[22px] font-bold leading-tight tracking-[-0.015em] pb-3 pt-5">
                        Transfer History
                    </h2>

                    {/* Search and Filter Bar */}
                    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-4 mb-4">
                        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                            <div className="relative w-full md:w-auto md:flex-2">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                                    search
                                </span>
                                <input
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full md:max-w-xs h-10 pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-200 focus:ring-primary focus:border-primary text-sm"
                                    placeholder="Search by Ticket ID, Station..."
                                    type="text"
                                />
                            </div>
                            <div className="flex flex-col-3 sm:flex-row gap-2 w-full md:w-auto">
                                <select
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value)}
                                    className="w-full sm:w-auto h-10 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-200 focus:ring-primary focus:border-primary text-sm"
                                >
                                    <option value="all">Type: All</option>
                                    <option value="import">Import</option>
                                    <option value="export">Export</option>
                                </select>
                                <select
                                    value={filterFromStation}
                                    onChange={(e) => setFilterFromStation(e.target.value)}
                                    className="w-full sm:w-auto h-10 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-200 focus:ring-primary focus:border-primary text-sm"
                                >
                                    <option value="">From Station</option>
                                    {[...new Set(allRequests.map(t => t.fromStation?.station_name))].filter(Boolean).map(station => (
                                        <option key={station} value={station}>{station}</option>
                                    ))}
                                </select>
                                <select
                                    value={filterToStation}
                                    onChange={(e) => setFilterToStation(e.target.value)}
                                    className="w-full sm:w-auto h-10 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-200 focus:ring-primary focus:border-primary text-sm"
                                >
                                    <option value="">To Station</option>
                                    {[...new Set(allRequests.map(t => t.toStation?.station_name))].filter(Boolean).map(station => (
                                        <option key={station} value={station}>{station}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* History Table */}
                    <div className="overflow-x-auto bg-white dark:bg-gray-900 rounded-lg shadow-sm">
                        {filteredRequests.length === 0 ? (
                            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                                No transfer records found
                            </div>
                        ) : (
                            <>
                                <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
                                    <thead className="bg-gray-50 dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                        <tr>
                                            <th className="px-6 py-3">Ticket ID</th>
                                            <th className="px-6 py-3">Date &amp; Time</th>
                                            <th className="px-6 py-3">Type</th>
                                            <th className="px-6 py-3">From</th>
                                            <th className="px-6 py-3">To</th>
                                            <th className="px-6 py-3 text-right">Quantity</th>
                                            <th className="px-6 py-3">Model</th>
                                            <th className="px-6 py-3">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(() => {
                                            // Sort by newest first and paginate
                                            const sortedRequests = [...filteredRequests].sort((a, b) =>
                                                new Date(b.created_at || 0) - new Date(a.created_at || 0)
                                            )
                                            const totalPages = Math.ceil(sortedRequests.length / itemsPerPage)
                                            const startIndex = (historyPage - 1) * itemsPerPage
                                            const paginatedRequests = sortedRequests.slice(startIndex, startIndex + itemsPerPage)

                                            return paginatedRequests.map((ticket) => {
                                                const isImport = ticket.ticket_type === 'import'
                                                const typeBg = isImport
                                                    ? 'bg-green-100 dark:bg-green-900/50'
                                                    : 'bg-orange-100 dark:bg-orange-900/50'
                                                const typeText = isImport
                                                    ? 'text-green-700 dark:text-green-300'
                                                    : 'text-orange-700 dark:text-orange-300'

                                                // Status logic: Based on transfer_request_id status
                                                // - If transfer_request_status === 'in_progress': Show "In Transit" (export) or "Pending" (import)
                                                // - If transfer_request_status === 'completed': Show "Completed"
                                                let statusBg = 'bg-gray-100 dark:bg-gray-900/50'
                                                let statusText = 'text-gray-700 dark:text-gray-300'
                                                let statusLabel = 'Pending'
                                                let statusIcon = 'ri-time-line'

                                                const transferRequestStatus = ticket.transfer_request_status || 'unknown'

                                                if (transferRequestStatus === 'completed') {
                                                    // Transfer request completed = both export and import are done
                                                    statusBg = 'bg-green-100 dark:bg-green-900/50'
                                                    statusText = 'text-green-700 dark:text-green-300'
                                                    statusLabel = 'Completed'
                                                    statusIcon = 'ri-check-double-line'
                                                } else if (transferRequestStatus === 'in_progress') {
                                                    // Transfer request still in progress
                                                    if (isImport) {
                                                        // Import ticket created but transfer_request not completed yet
                                                        statusBg = 'bg-yellow-100 dark:bg-yellow-900/50'
                                                        statusText = 'text-yellow-700 dark:text-yellow-300'
                                                        statusLabel = 'Pending'
                                                        statusIcon = 'ri-time-line'
                                                    } else {
                                                        // Export ticket = batteries in transit
                                                        statusBg = 'bg-blue-100 dark:bg-blue-900/50'
                                                        statusText = 'text-blue-700 dark:text-blue-300'
                                                        statusLabel = 'In Transit'
                                                        statusIcon = 'ri-truck-line'
                                                    }
                                                }

                                                return (
                                                    <tr key={ticket.ticket_id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                                                            #{ticket.ticket_id || 'N/A'}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-xs">{formatDate(ticket.created_at)}</td>
                                                        <td className="px-6 py-4">
                                                            <span className={`inline-flex items-center gap-1.5 rounded-full ${typeBg} px-2 py-1 text-xs font-medium ${typeText}`}>
                                                                <i className={`ri ${isImport ? 'ri-arrow-left-down-line' : 'ri-arrow-right-up-line'} !text-sm`}></i>
                                                                {isImport ? 'IMPORT' : 'EXPORT'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">{ticket.fromStation?.station_name || 'Unknown'}</td>
                                                        <td className="px-6 py-4">{ticket.toStation?.station_name || 'Unknown'}</td>
                                                        <td className="px-6 py-4 text-right">{ticket.quantity || 'N/A'}</td>
                                                        <td className="px-6 py-4">{ticket.battery_model || 'N/A'}</td>
                                                        <td className="px-6 py-4">
                                                            <span className={`inline-flex items-center gap-1.5 rounded-full ${statusBg} px-2.5 py-0.5 text-xs font-medium ${statusText}`}>
                                                                <i className={`ri ${statusIcon} !text-sm`}></i>
                                                                {statusLabel}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                )
                                            })
                                        })()}
                                    </tbody>
                                </table>

                                {/* Pagination */}
                                {(() => {
                                    const totalPages = Math.ceil(filteredRequests.length / itemsPerPage)
                                    if (totalPages <= 1) return null

                                    return (
                                        <div className="flex items-center justify-between px-6 py-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                Showing <span className="font-medium">{((historyPage - 1) * itemsPerPage) + 1}</span> to <span className="font-medium">{Math.min(historyPage * itemsPerPage, filteredRequests.length)}</span> of <span className="font-medium">{filteredRequests.length}</span> records
                                            </p>
                                            <nav className="flex items-center gap-1">
                                                <button
                                                    onClick={() => setHistoryPage(prev => Math.max(1, prev - 1))}
                                                    disabled={historyPage === 1}
                                                    className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                    </svg>
                                                </button>
                                                {[...Array(totalPages)].map((_, idx) => {
                                                    const pageNum = idx + 1
                                                    return (
                                                        <button
                                                            key={pageNum}
                                                            onClick={() => setHistoryPage(pageNum)}
                                                            className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-colors ${historyPage === pageNum
                                                                ? 'bg-primary text-white'
                                                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                                                }`}
                                                        >
                                                            {pageNum}
                                                        </button>
                                                    )
                                                })}
                                                <button
                                                    onClick={() => setHistoryPage(prev => Math.min(totalPages, prev + 1))}
                                                    disabled={historyPage === totalPages}
                                                    className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </button>
                                            </nav>
                                        </div>
                                    )
                                })()}
                            </>
                        )}
                    </div>
                </section>
            </div>

            {/* Battery Selection Modal */}
            {selectedTransfer && (
                <BatterySelectionModal
                    isOpen={showBatteryModal}
                    ticketId={selectedTransfer.transfer_request_id}
                    requiredQuantity={selectedTransfer.quantity}
                    transferRequestId={selectedTransfer.transfer_request_id}
                    ticketType={selectedTicketType}
                    stationId={user?.station_id}
                    onClose={() => {
                        setShowBatteryModal(false)
                        setSelectedTransfer(null)
                        setSelectedTicketType(null)
                    }}
                    onConfirm={handleBatterySelectionConfirm}
                />
            )}

            {/* Confirm Receive Batteries Modal */}
            {selectedTransfer && (
                <ConfirmReceiveBatteriesModal
                    isOpen={showConfirmReceiveModal}
                    ticketId={selectedTransfer.transfer_request_id}
                    transferRequestId={selectedTransfer.transfer_request_id}
                    stationId={user?.station_id}
                    onClose={() => {
                        setShowConfirmReceiveModal(false)
                        setSelectedTransfer(null)
                        setSelectedTicketType(null)
                    }}
                    onConfirm={handleConfirmReceiveBatteries}
                />
            )}
        </div>
    )
}

export default StaffTransfer