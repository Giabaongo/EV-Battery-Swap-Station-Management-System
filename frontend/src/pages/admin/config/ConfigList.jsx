import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { configService } from '../../../services/configService'
import { Search, Plus, X, Edit, ChevronLeft, ChevronRight, Settings } from 'lucide-react'

export default function AdminConfigList() {
  const [configs, setConfigs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('')

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(5)

  // Fetch all configs
  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        setLoading(true)
        const data = await configService.getAllConfigs()
        setConfigs(Array.isArray(data) ? data : [])
        setError(null)
      } catch (err) {
        console.error('Error fetching configs:', err)
        setError('Failed to load configurations')
        setConfigs([])
      } finally {
        setLoading(false)
      }
    }

    fetchConfigs()
  }, [])

  // Filter configs based on search
  const filteredConfigs = configs.filter(config => {
    const matchesSearch = 
      config.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      config.value?.toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
      config.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      config.type?.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesSearch
  })

  // Pagination logic
  const totalPages = Math.ceil(filteredConfigs.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentConfigs = filteredConfigs.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  // Get type badge color
  const getTypeBadge = (type) => {
    const typeMap = {
      system: { bg: 'bg-purple-100', text: 'text-purple-800', darkBg: 'dark:bg-purple-900/20', darkText: 'dark:text-purple-400', label: 'System' },
      payment: { bg: 'bg-blue-100', text: 'text-blue-800', darkBg: 'dark:bg-blue-900/20', darkText: 'dark:text-blue-400', label: 'Payment' },
      penalty: { bg: 'bg-orange-100', text: 'text-orange-800', darkBg: 'dark:bg-orange-900/20', darkText: 'dark:text-orange-400', label: 'Penalty' },
      business: { bg: 'bg-green-100', text: 'text-green-800', darkBg: 'dark:bg-green-900/20', darkText: 'dark:text-green-400', label: 'Business' },
    }

    const config = typeMap[type?.toLowerCase()] || { bg: 'bg-gray-100', text: 'text-gray-800', darkBg: 'dark:bg-gray-900/20', darkText: 'dark:text-gray-400', label: type }

    return (
      <span className={`inline-flex items-center rounded-full ${config.bg} px-2.5 py-0.5 text-xs font-medium ${config.text} ${config.darkBg} ${config.darkText}`}>
        {config.label}
      </span>
    )
  }

  // Get status badge
  const getStatusBadge = (isActive) => {
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        isActive 
          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
      }`}>
        {isActive ? 'Active' : 'Inactive'}
      </span>
    )
  }

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600 dark:text-gray-400">Loading configurations...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-600 dark:text-red-400">{error}</div>
      </div>
    )
  }

  return (
    <main className="flex-1 p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Page Heading */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex flex-col">
            <p className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              System Configuration
            </p>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              View and manage system configuration settings.
            </p>
          </div>
        </div>

        {/* Search & Filter Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 p-4 mb-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
            {/* Search Bar - Left Side */}
            <div className="flex-1 w-full lg:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  className="w-full h-10 pl-10 pr-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Search by name, value, type, or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Clear Filters - Below if active */}
          {searchQuery && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-400 font-medium hover:underline"
              >
                <X className="h-4 w-4" />
                Clear all filters
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredConfigs.length)} of {filteredConfigs.length} configurations
          </p>
        </div>

        {/* Data Table */}
        <div className="overflow-hidden rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800">
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-xs uppercase text-gray-700 dark:text-gray-300">
                <tr>
                  <th className="px-6 py-3">Config Name</th>
                  <th className="px-6 py-3">Value</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Description</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentConfigs.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      No configurations found
                    </td>
                  </tr>
                ) : (
                  currentConfigs.map((config) => (
                    <tr
                      key={config.config_id}
                      className="border-b border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-gray-700/50"
                    >
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">
                        {config.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                        <code className="bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded text-xs">
                          {config.value ?? 'N/A'}
                        </code>
                      </td>
                      <td className="px-6 py-4">
                        {getTypeBadge(config.type)}
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400 max-w-xs truncate">
                        {config.description || '—'}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(config.is_active)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Link
                          to={`/admin/config/${config.config_id}/edit`}
                          className="inline-flex items-center gap-1 p-1.5 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                        >
                          <Edit className="h-4 w-4" />
                          <span className="text-sm font-medium">Edit</span>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-4 p-4 text-sm">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-700 px-3 h-9 font-medium hover:bg-blue-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>

              <nav className="flex items-center gap-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                        currentPage === pageNum
                          ? 'bg-blue-700 text-white font-bold'
                          : 'hover:bg-blue-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <>
                    <span className="px-1 text-gray-500">...</span>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700"
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </nav>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-700 px-3 h-9 font-medium hover:bg-blue-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
