import { useEffect, useState } from "react"
import { TrendingUp, TrendingDown, Minus, Heart } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import { io } from "socket.io-client"
import api from "@/lib/api"

// Kết nối Socket.IO tới backend (chạy 1 lần toàn web)
const socket = io("http://localhost:5000")

export default function PriceCard({ item }) {
    const [currentPrice, setCurrentPrice] = useState(item.currentPrice)
    const [previousPrice, setPreviousPrice] = useState(item.previousPrice)
    const [isUpdating, setIsUpdating] = useState(false)
    const [isFavorite, setIsFavorite] = useState(item.isFavorite)
    const [product, setProduct] = useState(item) // 🆕 giữ bản sao để cập nhật mọi field

    // Nhận cập nhật từ server (giá tự động hoặc admin sửa)
    useEffect(() => {
        const handleServerUpdate = (data) => {
            if (data.id === item.id) {
                setIsUpdating(true)

                // Nếu có thay đổi giá → cập nhật giá
                if (data.newPrice !== undefined) {
                    setPreviousPrice(data.previousPrice ?? currentPrice)
                    setCurrentPrice(data.newPrice)
                }

                // Nếu admin chỉnh sửa sản phẩm → cập nhật toàn bộ thông tin
                setProduct((prev) => ({
                    ...prev,
                    name: data.name ?? prev.name,
                    category: data.category ?? prev.category,
                    unit: data.unit ?? prev.unit,
                    region: data.region ?? prev.region,
                }))

                // Tắt hiệu ứng highlight sau 1 giây
                setTimeout(() => setIsUpdating(false), 1000)
            }
        }

        // Nghe cả 2 event từ server
        socket.on("priceUpdate", handleServerUpdate)
        socket.on("productUpdated", handleServerUpdate)

        return () => {
            socket.off("priceUpdate", handleServerUpdate)
            socket.off("productUpdated", handleServerUpdate)
        }
    }, [item.id, currentPrice])

    // Toggle yêu thích
    const toggleFavorite = async (e) => {
        e.preventDefault()
        e.stopPropagation()
        try {
            await api.post(`/favorites/${item.id}`)
            setIsFavorite(!isFavorite)
        } catch (error) {
            console.error("Toggle favorite failed:", error)
        }
    }

    // Tính phần trăm thay đổi giá
    const priceChange = currentPrice - previousPrice
    const percentChange =
        previousPrice > 0 ? ((priceChange / previousPrice) * 100).toFixed(2) : 0

    const getTrendIcon = () => {
        if (priceChange > 0) return <TrendingUp className="h-4 w-4" />
        if (priceChange < 0) return <TrendingDown className="h-4 w-4" />
        return <Minus className="h-4 w-4" />
    }

    const getTrendColor = () => {
        if (priceChange > 0) return "text-green-600"
        if (priceChange < 0) return "text-red-600"
        return "text-gray-500"
    }

    return (
        <Link to={`/product/${product.id}`} className="block">
            <Card
                className={`hover:shadow-md transition-all duration-500 ease-in-out cursor-pointer ${isUpdating
                    ? priceChange > 0
                        ? "ring-2 ring-green-400/50"
                        : priceChange < 0
                            ? "ring-2 ring-red-400/50"
                            : "ring-2 ring-gray-300/50"
                    : ""
                    }`}
            >
                <CardContent className="pt-6">
                    <div className="space-y-3">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-900">{product.name}</h3>
                                <p className="text-sm text-gray-500">{product.category}</p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 -mt-1"
                                onClick={toggleFavorite}
                            >
                                <Heart
                                    className={`h-5 w-5 transition-colors duration-200 ${isFavorite
                                        ? "fill-red-500 text-red-500"
                                        : "text-gray-400 hover:text-red-400"
                                        }`}
                                />
                            </Button>
                        </div>

                        <div className="space-y-1">
                            <div className="flex items-baseline gap-2">
                                <span
                                    className={`text-2xl font-bold transition-all duration-500 ${isUpdating
                                        ? priceChange > 0
                                            ? "scale-110 text-green-600"
                                            : priceChange < 0
                                                ? "scale-110 text-red-600"
                                                : "text-gray-900"
                                        : "text-gray-900"
                                        }`}
                                >
                                    {currentPrice.toLocaleString("vi-VN")}
                                </span>
                                <span className="text-sm text-gray-500">đ/{product.unit}</span>
                            </div>
                            <div
                                className={`flex items-center gap-1 text-sm font-medium ${getTrendColor()}`}
                            >
                                {getTrendIcon()}
                                <span>
                                    {priceChange > 0 ? "+" : ""}
                                    {priceChange.toLocaleString("vi-VN")} ({percentChange}%)
                                </span>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                            <Badge variant="secondary" className="text-xs">
                                {product.region}
                            </Badge>
                            <span className="text-xs text-gray-500">
                                {product.lastUpdate.toLocaleString("vi-VN")}
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    )
}
