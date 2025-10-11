import { useEffect, useState } from "react"
import { TrendingUp, TrendingDown, Minus, Heart } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import api from "@/lib/api"

export default function PriceCard({ item }) {
    const [currentPrice, setCurrentPrice] = useState(item.currentPrice)
    const [isUpdating, setIsUpdating] = useState(false)
    const [isFavorite, setIsFavorite] = useState(item.isFavorite)

    // Hiệu ứng mô phỏng cập nhật giá ngẫu nhiên
    useEffect(() => {
        const interval = setInterval(() => {
            if (Math.random() < 0.15) {
                setIsUpdating(true)
                const change = (Math.random() - 0.5) * 0.05
                const newPrice = Math.max(100, currentPrice + currentPrice * change)
                setCurrentPrice(Math.round(newPrice))
                setTimeout(() => setIsUpdating(false), 1000)
            }
        }, 5000)

        return () => clearInterval(interval)
    }, [currentPrice])

    // Hàm toggle yêu thích
    const toggleFavorite = async (e) => {
        e.preventDefault()
        e.stopPropagation()

        try {
            await api.post(`/favorites/${item.id}`) // Gọi API backend
            setIsFavorite(!isFavorite) // Đổi màu tim ngay lập tức
        } catch (error) {
            console.error("Toggle favorite failed:", error)
        }
    }

    // Tính phần trăm thay đổi giá
    const priceChange = currentPrice - item.previousPrice
    const percentChange = ((priceChange / item.previousPrice) * 100).toFixed(2)

    const getTrendIcon = () => {
        if (item.trend === "up") return <TrendingUp className="h-4 w-4" />
        if (item.trend === "down") return <TrendingDown className="h-4 w-4" />
        return <Minus className="h-4 w-4" />
    }

    const getTrendColor = () => {
        if (item.trend === "up") return "text-green-600"
        if (item.trend === "down") return "text-red-600"
        return "text-gray-500"
    }

    return (
        <Link to={`/product/${item.id}`} className="block">
            <Card
                className={`hover:shadow-md transition-all cursor-pointer ${isUpdating ? "ring-2 ring-green-400/50" : ""
                    }`}
            >
                <CardContent className="pt-6">
                    <div className="space-y-3">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 text-balance">
                                    {item.name}
                                </h3>
                                <p className="text-sm text-gray-500">{item.category}</p>
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
                                    className={`text-2xl font-bold text-gray-900 transition-all ${isUpdating ? "scale-110 text-green-600" : ""
                                        }`}
                                >
                                    {currentPrice.toLocaleString("vi-VN")}
                                </span>
                                <span className="text-sm text-gray-500">
                                    đ/{item.unit}
                                </span>
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
                                {item.region}
                            </Badge>
                            <span className="text-xs text-gray-500">{item.lastUpdate}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    )
}
