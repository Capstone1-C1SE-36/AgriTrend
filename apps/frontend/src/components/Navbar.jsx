"use client"

import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { Home, Heart, Bell, BarChart3, Users, User, LogOut, Menu, X, Map } from "lucide-react" // <-- THÊM ICON "Map"
import { useState } from "react"
import { useClerk } from "@clerk/clerk-react"

export default function Navbar() {
  const { user, logout } = useAuth()
  console.log("👤 Thông tin user hiện tại:", user)
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { signOut } = useClerk()
  const handleLogout = async () => {
    try {
      // Nếu có Clerk session thì sign out cả Clerk
      if (window.Clerk?.session) {
        await window.Clerk.signOut()
        console.log("✅ Clerk session signed out")
      }

      // Logout context app
      logout()

      // Điều hướng
      navigate("/login")
    } catch (error) {
      console.error("❌ Lỗi khi đăng xuất:", error)
    }
  }


  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <span className="font-bold text-xl text-gray-900">AgriPrice</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2 text-gray-700 hover:text-green-600 transition-colors">
              <Home className="w-5 h-5" />
              <span>Trang chủ</span>
            </Link>
            <Link
              to="/favorites"
              className="flex items-center gap-2 text-gray-700 hover:text-green-600 transition-colors"
            >
              <Heart className="w-5 h-5" />
              <span>Yêu thích</span>
            </Link>
            <Link to="/alerts" className="flex items-center gap-2 text-gray-700 hover:text-green-600 transition-colors">
              <Bell className="w-5 h-5" />
              <span>Cảnh báo</span>
            </Link>
            <Link
              to="/compare"
              className="flex items-center gap-2 text-gray-700 hover:text-green-600 transition-colors"
            >
              <BarChart3 className="w-5 h-5" />
              <span>So sánh</span>
            </Link>
            <Link
              to="/community"
              className="flex items-center gap-2 text-gray-700 hover:text-green-600 transition-colors"
            >
              <Users className="w-5 h-5" />
              <span>Cộng đồng</span>
            </Link>
            <Link
              to="/map"
              className="flex items-center gap-2 text-gray-700 hover:text-green-600 transition-colors"
            >
              <Map className="w-5 h-5" />
              <span>Bản đồ giá</span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <Link
                to="/profile"
                className="hidden md:flex items-center gap-2 text-gray-700 hover:text-green-600 transition-colors"
              >
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.name || "User avatar"}
                    className="w-8 h-8 rounded-full object-cover border border-gray-300"
                  />
                ) : (
                  <User className="w-5 h-5" />
                )}
                <span>{user?.name || user?.email}</span>
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="hidden md:flex items-center gap-2 text-gray-700 hover:text-red-600 transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>

            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden">
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col gap-4">
              <Link to="/" className="flex items-center gap-2 text-gray-700" onClick={() => setMobileMenuOpen(false)}>
                <Home className="w-5 h-5" />
                <span>Trang chủ</span>
              </Link>
              <Link
                to="/favorites"
                className="flex items-center gap-2 text-gray-700"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Heart className="w-5 h-5" />
                <span>Yêu thích</span>
              </Link>
              <Link
                to="/alerts"
                className="flex items-center gap-2 text-gray-700"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Bell className="w-5 h-5" />
                <span>Cảnh báo</span>
              </Link>
              <Link
                to="/compare"
                className="flex items-center gap-2 text-gray-700"
                onClick={() => setMobileMenuOpen(false)}
              >
                <BarChart3 className="w-5 h-5" />
                <span>So sánh</span>
              </Link>
              <Link
                to="/community"
                className="flex items-center gap-2 text-gray-700"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Users className="w-5 h-5" />
                <span>Cộng đồng</span>
              </Link>

              <Link
                to="/map"
                className="flex items-center gap-2 text-gray-700"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Map className="w-5 h-5" />
                <span>Bản đồ giá</span>
              </Link>

              <Link
                to="/profile"
                className="flex items-center gap-2 text-gray-700"
                onClick={() => setMobileMenuOpen(false)}
              >
                <User className="w-5 h-5" />
                <span>Hồ sơ</span>
              </Link>
              <button onClick={handleLogout} className="flex items-center gap-2 text-red-600">
                <LogOut className="w-5 h-5" />
          _       <span>Đăng xuất</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}