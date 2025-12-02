"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { Button } from "@/components/ui/button"
import { SignInButton, useUser, useSession, useClerk, UserButton } from "@clerk/clerk-react"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const { login, loginWithClerk } = useAuth()
  const navigate = useNavigate()

  // 🔐 Clerk
  const { isSignedIn, user } = useUser()
  const { session } = useSession()
  const { signOut } = useClerk()

  // 🧩 Khi Clerk đăng nhập, tự sync với backend
  useEffect(() => {
    const syncClerkLogin = async () => {
      if (isSignedIn && session) {
        try {
          const token = await session.getToken({ template: "integrationFallback" })
          await loginWithClerk(token)
          navigate("/")
        } catch (err) {
          console.error("Lỗi đồng bộ Clerk:", err)
        }
      }
    }
    syncClerkLogin()
  }, [isSignedIn, session])

  // 🧩 Xử lý đăng nhập thủ công (backend riêng)
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const user = await login(email, password)
      if (user.role === "admin") {
        navigate("/admin")
      } else {
        navigate("/")
      }
    } catch (err) {
      setError(err.response?.data?.error || "Đăng nhập thất bại")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-green-700">AgriPrice</h1>
            <p className="text-gray-600 mt-2">Đăng nhập vào hệ thống</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* --- Form đăng nhập thủ công --- */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="email@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mật khẩu
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-green-600 hover:text-green-700 text-sm font-medium"
              >
                Quên mật khẩu?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            Chưa có tài khoản?{" "}
            <Link
              to="/register"
              className="text-green-600 hover:text-green-700 font-medium"
            >
              Đăng ký ngay
            </Link>
          </div>

          {/* --- Đăng nhập Google qua Clerk --- */}
          <div className="mt-6 text-center">
            <div className="flex items-center my-6">
              <div className="flex-grow h-px bg-gray-300"></div>
              <p className="mx-3 text-gray-500 text-sm font-medium">or</p>
              <div className="flex-grow h-px bg-gray-300"></div>
            </div>

            <SignInButton mode="modal">
              <button
                //onClick={() => console.log("Google login clicked")} // hoặc gọi handleClerkLogin()
                className="flex items-center justify-center gap-2 w-full border border-gray-300 rounded-lg py-2 px-4 hover:bg-gray-50 transition-colors"
              >
                <img
                  src="https://img.clerk.com/static/google.svg"
                  alt="Google"
                  className="w-5 h-5"
                />
                <span className="text-gray-700 font-medium">Continue with Google</span>
              </button>
            </SignInButton>
          </div>

          {/* --- Thông tin tài khoản demo --- */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg text-xs text-gray-600">
            <p className="font-medium mb-1">Tài khoản demo:</p>
            <p>Admin: admin@agriprice.vn</p>
            <p>User: user@example.com</p>
          </div>

          {/* --- Nếu đã đăng nhập Clerk, hiển thị nút logout --- */}
          {isSignedIn && (
            <div className="mt-6 text-center">
              <UserButton />
              <button
                onClick={() => signOut()}
                className="mt-3 bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg"
              >
                Đăng xuất Clerk
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
