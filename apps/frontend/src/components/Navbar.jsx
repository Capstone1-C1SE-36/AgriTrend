"use client"

import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { Home, Heart, Bell, BarChart3, Users, User, LogOut, Menu, X, Map, Sprout } from "lucide-react" // Thêm icon Sprout cho logo
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
      if (window.Clerk?.session) {
        await window.Clerk.signOut()
        console.log("✅ Clerk session signed out")
      }
      logout()
      navigate("/login")
    } catch (error) {
      console.error("❌ Lỗi khi đăng xuất:", error)
    }
  }

  return (
    // GLASSMORPHISM: bg-background/60 + backdrop-blur-xl
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 transition-all">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            {/* Logo sống động hơn với Gradient */}
            <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-emerald-700 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-green-500/50 transition-all duration-300">
              <Sprout className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-green-700 to-emerald-500">
              AgroInsight
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-1">
            <NavLink to="/" icon={Home} label="Trang chủ" />
            <NavLink to="/favorites" icon={Heart} label="Yêu thích" />
            <NavLink to="/alerts" icon={Bell} label="Cảnh báo" />
            <NavLink to="/compare" icon={BarChart3} label="So sánh" />
            <NavLink to="/community" icon={Users} label="Cộng đồng" />
            <NavLink to="/map" icon={Map} label="Bản đồ" />
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <Link
                to="/profile"
                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-secondary/10 transition-colors border border-transparent hover:border-secondary/20"
              >
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.name || "User avatar"}
                    className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <User className="w-4 h-4" />
                  </div>
                )}
                <span className="text-sm font-medium text-foreground">{user?.name || user?.email}</span>
              </Link>
            )}

            <button
              onClick={handleLogout}
              className="hidden md:flex items-center gap-2 text-gray-500 hover:text-red-600 transition-colors hover:bg-red-50 p-2 rounded-full"
              title="Đăng xuất"
            >
              <LogOut className="w-5 h-5" />
            </button>

            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-gray-600">
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu (Cũng có hiệu ứng mờ nhẹ) */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/50 bg-background/95 backdrop-blur-md animate-in slide-in-from-top-2">
            <div className="flex flex-col gap-2 p-2">
              <MobileNavLink to="/" icon={Home} label="Trang chủ" onClick={() => setMobileMenuOpen(false)} />
              <MobileNavLink to="/favorites" icon={Heart} label="Yêu thích" onClick={() => setMobileMenuOpen(false)} />
              <MobileNavLink to="/alerts" icon={Bell} label="Cảnh báo" onClick={() => setMobileMenuOpen(false)} />
              <MobileNavLink to="/compare" icon={BarChart3} label="So sánh" onClick={() => setMobileMenuOpen(false)} />
              <MobileNavLink to="/community" icon={Users} label="Cộng đồng" onClick={() => setMobileMenuOpen(false)} />
              <MobileNavLink to="/map" icon={Map} label="Bản đồ giá" onClick={() => setMobileMenuOpen(false)} />
              <MobileNavLink to="/profile" icon={User} label="Hồ sơ" onClick={() => setMobileMenuOpen(false)} />

              <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg w-full transition-colors">
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Đăng xuất</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

// Component phụ cho Desktop Link gọn gàng hơn
function NavLink({ to, icon: Icon, label }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-primary hover:bg-primary/5 transition-all duration-200"
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </Link>
  )
}

// Component phụ cho Mobile Link
function MobileNavLink({ to, icon: Icon, label, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-primary/10 hover:text-primary transition-colors"
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
    </Link>
  )
}