"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { TrendingUp, TrendingDown, Heart, Search } from "lucide-react"
import Navbar from "@/components/Navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import api from "@/lib/api"
import LivePriceTicker from "@/components/live-price-ticker"
import PriceCard from "@/components/PriceCard"

export default function Dashboard() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")

  const categories = ["all", "Lúa gạo", "Cà phê", "Gia vị", "Cao su", "Hạt điều", "Thủy sản"]

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      // Lấy danh sách sản phẩm
      const response = await api.get("/products")
      const allProducts = response.data
      console.log("✅ API /products response:", response.data)

      // 2️⃣ Nếu có token thì mới gọi /favorites
      const token = localStorage.getItem("token")
      let favoriteIds = []

      if (token) {
        try {
          const favResponse = await api.get("/favorites")
          favoriteIds = favResponse.data
        } catch (err) {
          console.warn("⚠️ Không thể tải danh sách yêu thích:", err)
        }
      }

      // Gộp lại: thêm isFavorite = true nếu id nằm trong favoriteIds
      const merged = allProducts.map(p => ({
        ...p,
        isFavorite: favoriteIds.includes(p.id),
      }))

      setProducts(merged)
      console.log(" Products loaded:", merged)

    } catch (error) {
      console.error("Failed to fetch products:", error)
    } finally {
      setLoading(false)
    }
  }


  // ✅ Lọc sản phẩm theo từ khóa và danh mục
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || p.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div>
      <Navbar />
      <LivePriceTicker />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Giá nông sản hôm nay</h1>
          <p className="text-gray-600">Cập nhật giá thời gian thực từ các khu vực trên toàn quốc</p>
        </div>

        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm nông sản..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className="whitespace-nowrap"
                  >
                    {category === "all" ? "Tất cả" : category}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <PriceCard key={product.id} item={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
