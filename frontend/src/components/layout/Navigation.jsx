import { Link, useLocation } from "react-router-dom"
import { useState } from "react"
import { useAuth } from "../../hooks/useContext"
import {
  LayoutDashboard,
  MapPin,
  Users,
  Package,
  ArrowLeftRight,
  MessageCircle,
  FileText,
  User as UserIcon,
  LogOut
} from 'lucide-react'

export default function Navigation({ type = "main" }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const { logout } = useAuth();

  // --- NAVBAR CHO MAIN WEBSITE ---
  const MainNavigation = () => (
    <nav className="bg-blue-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
                <span className="text-blue-800 font-bold text-lg">E</span>
              </div>
              <span className="text-xl font-bold">EV SWAP</span>
            </Link>
          </div>

          {/* Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="hover:text-blue-200 px-3 py-2 rounded-md text-sm font-medium">
              Home
            </Link>

            {/* Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="hover:text-blue-200 px-3 py-2 rounded-md text-sm font-medium flex items-center"
              >
                Services
                <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg z-50">
                  <Link
                    to="/stations"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-800"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    Swap Stations
                  </Link>
                  <Link
                    to="/batteries"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-800"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    Battery Management
                  </Link>
                  <Link
                    to="/dashboard"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-800"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    Dashboard
                  </Link>
                </div>
              )}
            </div>

            <Link to="/users" className="hover:text-blue-200 px-3 py-2 rounded-md text-sm font-medium">
              Users
            </Link>
            <Link to="/reports" className="hover:text-blue-200 px-3 py-2 rounded-md text-sm font-medium">
              Reports
            </Link>
            <Link to="/help" className="hover:text-blue-200 px-3 py-2 rounded-md text-sm font-medium">
              Support
            </Link>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            <Link
              to="/login"
              className="bg-white text-blue-800 px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-50 transition-colors"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )

  // --- NAVBAR CHO STAFF ---
  const StaffNavigation = () => {
    const location = useLocation()
    const menuItems = [
      { name: 'Overview', path: '/staff', icon: LayoutDashboard },
      { name: 'Manual Swap', path: '/staff/manual-swap', icon: MapPin },
      { name: 'Battery Inventory', path: '/staff/inventory', icon: Package },
      { name: 'Swap Requests', path: '/staff/swap-requests', icon: ArrowLeftRight },
      { name: 'Transfer Requests', path: '/staff/transfer-requests', icon: ArrowLeftRight },
      { name: 'Import Batteries', path: '/staff/import-batteries', icon: FileText },
      { name: 'Profile', path: '/staff/profile', icon: UserIcon },
    ]

    const isActive = (path) => {
      if (path === '/staff') {
        return location.pathname === '/staff'
      }
      return location.pathname === path
    }

    return (
      <aside className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col shadow-lg fixed left-0 top-0 overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">S</span>
            </div>
            <span className="text-xl font-bold text-gray-800">Staff Portal</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive(item.path)
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100'
                  }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={logout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors duration-200 font-medium"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    )
  }

  // --- NAVBAR CHO ADMIN ---
  const AdminNavigation = () => {
    const location = useLocation()
    const menuItems = [
      { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
      { name: 'Stations', path: '/admin/stations-list', icon: MapPin },
      { name: 'Users', path: '/admin/users-list', icon: Users },
      { name: 'Packages', path: '/admin/packages-list', icon: Package },
      { name: 'Battery Transfer', path: '/admin/battery-transfer-requests', icon: ArrowLeftRight },
      { name: 'Support', path: '/admin/support-list', icon: MessageCircle },
      { name: 'AI Reports', path: '/admin/report', icon: FileText },
      { name: 'Profile', path: '/admin/profile', icon: UserIcon },
    ]

    const isActive = (path) => {
      if (path === '/admin') {
        return location.pathname === '/admin'
      }
      return location.pathname === path
    }

    return (
      <aside className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col shadow-lg fixed left-0 top-0 overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <span className="text-xl font-bold text-gray-800">Admin Portal</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive(item.path)
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100'
                  }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={logout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors duration-200 font-medium"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    )
  }

  switch (type) {
    case "staff":
      return <StaffNavigation />
    case "admin":
      return <AdminNavigation />
    default:
      return <MainNavigation />
  }
}