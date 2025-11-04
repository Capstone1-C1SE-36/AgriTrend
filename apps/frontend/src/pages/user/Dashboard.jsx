"use client"

import { useState, useEffect } from "react"
import { TrendingUp, TrendingDown, Heart, Search } from "lucide-react"
import Navbar from "@/components/Navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import api from "@/lib/api"
import LivePriceTicker from "@/components/live-price-ticker.jsx"
import PriceCard from "@/components/PriceCard"
import { io } from "socket.io-client"

const socket = io("http://localhost:5000")

export default function Dashboard() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [categories, setCategories] = useState(["all"])

  const fetchCategories = async () => {
    try {
      const res = await api.get("/products/categories")
      // thêm "all" vào đầu danh sách
      setCategories(["all", ...res.data.map(c => c.name)])
    } catch (error) {
      console.error("⚠️ Failed to fetch categories:", error)
    }
  }

  useEffect(() => {
    fetchProducts()
    fetchCategories()

    // Khi có sản phẩm mới thêm
    socket.on("productAdded", (newProduct) => {
      setProducts((prev) => [...prev, newProduct])
    })

    // Khi sản phẩm bị xóa
    socket.on("productDeleted", (deleted) => {
      setProducts((prev) => prev.filter((p) => p.id !== deleted.id))
    })

    return () => {
      socket.off("productAdded")
      socket.off("productDeleted")
    }
  }, [])

  // Hàm tải sản phẩm (có tìm kiếm, lọc và phân trang)
  const fetchProducts = async () => {
    try {
      setLoading(true)

      const response = await api.get("/products", {
        params: {
          page,
          search: searchQuery,
          category: selectedCategory === "all" ? undefined : selectedCategory,
        },
      })

      const { data, totalPages } = response.data

      // Lấy danh sách yêu thích (nếu có token)
      const token = localStorage.getItem("token")
      let favoriteIds = []

      if (token) {
        try {
          const favResponse = await api.get("/favorites")
          favoriteIds = favResponse.data.map(f => f.productId)
        } catch (err) {
          console.warn("⚠️ Không thể tải danh sách yêu thích:", err)
        }
      }

      // Gộp dữ liệu & đánh dấu sản phẩm yêu thích
      const merged = data.map(p => ({
        ...p,
        id: p.id || p.productId,
        isFavorite: favoriteIds.includes(p.id || p.productId),
      }))

      setProducts(merged)
      setTotalPages(totalPages)
    } catch (error) {
      console.error("❌ Lỗi khi tải sản phẩm:", error)
    } finally {
      setLoading(false)
    }
  }

  // Tự động gọi API khi thay đổi tìm kiếm, danh mục hoặc trang
  useEffect(() => {
    fetchProducts()
  }, [searchQuery, selectedCategory, page])

  const handleNextPage = () => {
    if (page < totalPages) setPage(page + 1)
  }

  const handlePrevPage = () => {
    if (page > 1) setPage(page - 1)
  }

  return (
    <div>
      <Navbar />
      <LivePriceTicker />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tiêu đề */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Giá nông sản hôm nay</h1>
          <p className="text-gray-600">Cập nhật giá thời gian thực từ các khu vực trên toàn quốc</p>
        </div>

        {/* Tìm kiếm + Lọc */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm nông sản..."
                  value={searchQuery}
                  onChange={(e) => {
                    setPage(1)
                    setSearchQuery(e.target.value)
                  }}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setPage(1)
                      setSelectedCategory(category)
                    }}
                    className="whitespace-nowrap"
                  >
                    {category === "all" ? "Tất cả" : category}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danh sách sản phẩm */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.length > 0 ? (
                products.map((product) => <PriceCard key={product.id} item={product} />)
              ) : (
                <div className="col-span-full text-center text-gray-500 py-10">
                  Không tìm thấy sản phẩm phù hợp
                </div>
              )}
            </div>

            {/* Điều hướng phân trang */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-8">
                <Button onClick={handlePrevPage} disabled={page === 1} variant="outline">
                  Trang trước
                </Button>
                <span className="text-gray-600">
                  Trang {page} / {totalPages}
                </span>
                <Button onClick={handleNextPage} disabled={page === totalPages} variant="outline">
                  Trang sau
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
