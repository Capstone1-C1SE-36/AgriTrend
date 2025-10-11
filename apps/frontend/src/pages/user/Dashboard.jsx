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
      const response = await api.get("/products")
      setProducts(response.data)
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
              <Link
                key={product.id}
                to={`/product/${product.id}`}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">{product.name}</h3>
                    <p className="text-sm text-gray-500">{product.category}</p>
                  </div>
                  <button className="text-gray-400 hover:text-red-500 transition-colors">
                    <Heart className="w-5 h-5" />
                  </button>
                </div>

                <div className="mb-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-gray-900">
                      {product.currentPrice.toLocaleString("vi-VN")}
                    </span>
                    <span className="text-gray-500">đ/{product.unit}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    {product.change > 0 ? (
                      <>
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-600">+{product.change}%</span>
                      </>
                    ) : product.change < 0 ? (
                      <>
                        <TrendingDown className="w-4 h-4 text-red-600" />
                        <span className="text-sm font-medium text-red-600">{product.change}%</span>
                      </>
                    ) : (
                      <span className="text-sm text-gray-500">Không đổi</span>
                    )}
                  </div>
                </div>

                <div className="text-sm text-gray-600">
                  <p>Khu vực: {product.region}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Cập nhật: {new Date(product.lastUpdated).toLocaleString("vi-VN")}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
