import { Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider, useAuth } from "./context/AuthContext"
import ProtectedRoute from "./components/ProtectedRoute"
import AdminRoute from "./components/AdminRoute"
// Auth pages
import Login from "./pages/auth/Login"
import Register from "./pages/auth/Register"
import ForgotPassword from "./pages/auth/Forgot-Password"
import ResetPassword from "./pages/auth/Reset-Password"

// User pages
import Dashboard from "./pages/user/Dashboard"
import ProductDetail from "./pages/user/ProductDetail"
import Favorites from "./pages/user/Favorites"
import Alerts from "./pages/user/Alerts"
import Compare from "./pages/user/Compare"
import Community from "./pages/user/Community"
import Profile from "./pages/user/Profile"
import PriceMap from "./pages/user/PriceMap"

// Admin pages
import AdminDashboard from "./pages/admin/Dashboard"
import AdminProducts from "./pages/admin/Products"
import AdminUsers from "./pages/admin/Users"
import AdminNews from "./pages/admin/News"
import AdminStatistics from "./pages/admin/Statistics"
import AdminSettings from "./pages/admin/Settings"
// ... import pages như trước
import ChatBotWidget from "./components/ChatBotWidget"

function AppContent() {
  const { user } = useAuth()  // ✅ Bây giờ useAuth nằm trong AuthProvider
  console.log("Current user in AppContent:", user);

  return (
    <>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected routes */}
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/product/:id" element={<ProtectedRoute><ProductDetail /></ProtectedRoute>} />
        <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
        <Route path="/alerts" element={<ProtectedRoute><Alerts /></ProtectedRoute>} />
        <Route path="/compare" element={<ProtectedRoute><Compare /></ProtectedRoute>} />
        <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/map" element={<ProtectedRoute><PriceMap /></ProtectedRoute>} />

        {/* Admin routes */}
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/products" element={<AdminRoute><AdminProducts /></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
        <Route path="/admin/news" element={<AdminRoute><AdminNews /></AdminRoute>} />
        <Route path="/admin/statistics" element={<AdminRoute><AdminStatistics /></AdminRoute>} />
        <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* ChatBotWidget chỉ render khi user đã đăng nhập */}
      {user && <ChatBotWidget userId={user.id} />}
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
