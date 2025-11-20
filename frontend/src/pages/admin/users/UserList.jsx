import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { userService } from '../../../services/userService'
import { Search, Plus, X, Eye, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'

export default function AdminUserList() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all') // 'all', 'admin', 'driver', 'station_staff'
  const [showRoleDropdown, setShowRoleDropdown] = useState(false)

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(5)

  // Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true)
        const data = await userService.getAllUsers()
        setUsers(Array.isArray(data) ? data : [])
        setError(null)
      } catch (err) {
        console.error('Error fetching users:', err)
        setError('Failed to load users')
        setUsers([])
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  // Filter users based on search and role
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchQuery.toLowerCase())

    // Only show driver and station_staff, exclude admin
    const isNonAdmin = user.role === 'driver' || user.role === 'station_staff'
    const matchesRole = roleFilter === 'all' || user.role === roleFilter

    return matchesSearch && matchesRole && isNonAdmin
  })

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentUsers = filteredUsers.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, roleFilter])

  // Get role badge color
  const getRoleBadge = (role) => {
    const roleMap = {
      admin: { bg: 'bg-purple-100', text: 'text-purple-800', darkBg: 'dark:bg-purple-900/20', darkText: 'dark:text-purple-400', label: 'Admin' },
      driver: { bg: 'bg-blue-100', text: 'text-blue-800', darkBg: 'dark:bg-blue-900/20', darkText: 'dark:text-blue-400', label: 'Driver' },
      station_staff: { bg: 'bg-green-100', text: 'text-green-800', darkBg: 'dark:bg-green-900/20', darkText: 'dark:text-green-400', label: 'Station Staff' },
    }

    const config = roleMap[role] || { bg: 'bg-gray-100', text: 'text-gray-800', darkBg: 'dark:bg-gray-900/20', darkText: 'dark:text-gray-400', label: role }

    return (
      <span className={`inline-flex items-center rounded-full ${config.bg} px-2.5 py-0.5 text-xs font-medium ${config.text} ${config.darkBg} ${config.darkText}`}>
        {config.label}
      </span>
    )
  }

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('')
    setRoleFilter('all')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading users...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-600">{error}</div>
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
              User Management
            </p>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              View, search, and manage all users in the system.
            </p>
          </div>
          <Link to="/admin/users/create" className="flex min-w-[84px] items-center justify-center gap-2 overflow-hidden rounded-lg h-10 px-4 bg-blue-600 text-white text-sm font-medium leading-normal tracking-wide shadow-sm hover:bg-blue-700">
            <Plus className="h-5 w-5" />
            <span className="truncate">Add New User</span>
          </Link>
        </div>

        {/* Search and Filter Card */}
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Search Bar - Left Side */}
            <div className="flex-1 w-full lg:max-w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  className="w-full h-10 pl-10 pr-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Search by name, email, or username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Filters - Right Side */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Role Filter */}
              <div className="relative">
                <button
                  onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                  className="flex h-10 items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <span>
                    Role: {roleFilter === 'all' ? 'All' : roleFilter === 'admin' ? 'Admin' : roleFilter === 'driver' ? 'Driver' : 'Station Staff'}
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </button>

                {showRoleDropdown && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg z-10">
                    <button
                      onClick={() => { setRoleFilter('all'); setShowRoleDropdown(false) }}
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 rounded-t-lg text-gray-700 dark:text-gray-300"
                    >
                      All Roles
                    </button>
                    <button
                      onClick={() => { setRoleFilter('driver'); setShowRoleDropdown(false) }}
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                    >
                      Driver
                    </button>
                    <button
                      onClick={() => { setRoleFilter('station_staff'); setShowRoleDropdown(false) }}
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 rounded-b-lg text-gray-700 dark:text-gray-300"
                    >
                      Station Staff
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Clear Filters - Below if active */}
          {(searchQuery || roleFilter !== 'all') && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline"
              >
                <X className="h-4 w-4" />
                Clear all filters
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length} users
          </p>
        </div>

        {/* Data Table */}
        <div className="overflow-hidden rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800">
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-xs uppercase text-gray-700 dark:text-gray-300">
                <tr>  
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Username</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentUsers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  currentUsers.map((user) => (
                    <tr
                      key={user.user_id}
                      className="border-b border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-gray-700/50"
                    >
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                        {user.email || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                        {user.username || 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Link
                          to={`/admin/users/${user.user_id}`}
                          className="inline-flex items-center gap-1 p-1.5 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                        >
                          <Eye className="h-4 w-4" />
                          <span className="text-sm font-medium">View</span>
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
                      className={`flex h-9 w-9 items-center justify-center rounded-lg ${currentPage === pageNum
                        ? 'bg-blue-600 text-white font-bold'
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
