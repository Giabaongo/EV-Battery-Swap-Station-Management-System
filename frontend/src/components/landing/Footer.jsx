import { MapPin, Phone, Mail, Facebook, Twitter, Linkedin, Instagram } from 'lucide-react'
import { Link } from 'react-router-dom'

// Component Footer hiển thị thông tin công ty, liên kết, và thông tin liên hệ
export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-16">
      <div className="max-w-6xl mx-auto px-4">
        {/* Nội dung chính của Footer */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Phần Branding - Logo và thông tin công ty */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <img 
                src="/kiri-swap-logo.png" 
                alt="KIRI Swap" 
                className="h-8 object-contain"
              />
              <h3 className="text-2xl font-bold text-white">KIRI Swap</h3>
            </div>
            <p className="text-sm text-gray-400">
              Revolutionary battery swap technology for electric vehicles.
            </p>
            {/* Các icon mạng xã hội */}
            <div className="flex gap-4 pt-4">
              <a href="#" className="hover:text-blue-700 transition-colors">
                <Facebook size={20} />
              </a>
              <a href="#" className="hover:text-blue-700 transition-colors">
                <Twitter size={20} />
              </a>
              <a href="#" className="hover:text-blue-700 transition-colors">
                <Linkedin size={20} />
              </a>
              <a href="#" className="hover:text-blue-700 transition-colors">
                <Instagram size={20} />
              </a>
            </div>
          </div>


          {/* Phần Thông tin liên hệ - địa chỉ, điện thoại, email */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Contact</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin size={20} className="mt-1 flex-shrink-0 text-blue-700" />
                <p className="text-sm">Nhà Văn Hóa Sinh Viên TP.HCM</p>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={20} className="flex-shrink-0 text-blue-700" />
                <a href="tel:+1234567890" className="text-sm hover:text-blue-700 transition-colors">
                  +84 123 456 789
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={20} className="flex-shrink-0 text-blue-700" />
                <a href="mailto:support@powerswap.com" className="text-sm hover:text-blue-700 transition-colors">
                  support@powerswap.com
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800 pt-8 mb-8"></div>

        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-400">
            &copy; 2025 KIRI Swap. All rights reserved.
          </p>
          {/* <div className="flex gap-6 text-sm">
            <a href="#" className="text-gray-400 hover:text-blue-700 transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-gray-400 hover:text-blue-700 transition-colors">
              Terms of Service
            </a>
            <a href="#" className="text-gray-400 hover:text-blue-700 transition-colors">
              Cookie Settings
            </a>
          </div> */}
        </div>
      </div>
    </footer>
  )
}
