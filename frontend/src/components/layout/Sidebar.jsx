import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import {
  LayoutDashboard,
  MapPin,
  CreditCard,
  User,
  MessageCircle,
  History,
  Sun,
  Moon,
  LogOut
} from 'lucide-react'
import { useAuth } from '../../hooks/useContext'

// Sidebar component
export default function Sidebar() {
  const location = useLocation()
  const [darkMode, setDarkMode] = useState(false)
  const { logout } = useAuth()
  const menuItems = [
    { name: 'Dashboard', path: '/driver', icon: LayoutDashboard },
    { name: 'Stations', path: '/driver/map', icon: MapPin },
    { name: 'History', path: '/driver/swap-history', icon: History },
    { name: 'Plans', path: '/driver/plans', icon: CreditCard },
    { name: 'Profile', path: '/driver/profile', icon: User },
    { name: 'Support', path: '/driver/support', icon: MessageCircle }
  ]

  const handleLogout = () => {
    // Add logout logic here
    console.log('Logging out...')
  }

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    // Add dark mode implementation here
  }

  return (
    <aside className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col shadow-lg fixed left-0 top-0 overflow-y-auto">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <img 
            src="/kiri-swap-logo.png" 
            alt="KIRI Swap" 
            className="w-10 h-10 object-contain"
          />
          <span className="text-xl font-bold text-gray-800">KIRI Swap</span>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path
          const IconComponent = item.icon
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive
                ? 'bg-blue-700 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-100'
                }`}
            >
              <IconComponent className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* Bottom Section - Dark Mode & Logout */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        {/* Dark Mode Toggle */}
        {/* <button
          onClick={toggleDarkMode}
          className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors duration-200"
        >
          <div className="flex items-center space-x-3">
            {darkMode ? (
              <Moon className="w-5 h-5 text-gray-700" />
            ) : (
              <Sun className="w-5 h-5 text-gray-700" />
            )}
            <span className="font-medium text-gray-700">Dark Mode</span>
          </div>
          <div className={`w-12 h-6 rounded-full transition-colors duration-200 ${darkMode ? 'bg-blue-700' : 'bg-gray-300'
            } relative`}>
            <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${darkMode ? 'transform translate-x-6' : ''
              }`}></div>
          </div>
        </button>

        {/* Logout Button */}
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
