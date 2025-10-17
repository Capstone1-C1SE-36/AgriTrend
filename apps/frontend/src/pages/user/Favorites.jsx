import { useEffect, useState } from "react"
import Navbar from "../../components/Navbar"
import api from "@/lib/api"
import PriceCard from "@/components/PriceCard"

export default function Favorites() {
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFavorites()
  }, [])

  const fetchFavorites = async () => {
    try {
      // 🔹 Lấy danh sách ID sản phẩm yêu thích của user
      const favRes = await api.get("/favorites")
      const favoriteIds = favRes.data
      console.log("❤️ Favorite IDs:", favoriteIds)

      if (!favoriteIds.length) {
        setFavorites([])
        return
      }

      // 🔹 Lấy danh sách sản phẩm từ /products
      const prodRes = await api.get("/products")
      const allProducts = prodRes.data

      // 🔹 Lọc ra những sản phẩm có id nằm trong danh sách yêu thích
      const favProducts = allProducts.filter(p => favoriteIds.includes(p.id))

      // 🔹 Gắn cờ isFavorite: true để hiển thị tim đỏ
      const final = favProducts.map(p => ({ ...p, isFavorite: true }))

      setFavorites(final)
      console.log("✅ Favorites loaded:", final)
    } catch (error) {
      console.error("Failed to load favorites:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Danh sách yêu thích
        </h1>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
          </div>
        ) : favorites.length === 0 ? (
          <p className="text-gray-600 text-center py-12">
            Bạn chưa có sản phẩm nào trong danh sách yêu thích.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map(item => (
              <PriceCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
