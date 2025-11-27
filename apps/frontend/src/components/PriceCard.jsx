import { useEffect, useState } from "react"
import { TrendingUp, TrendingDown, Minus, Heart, Coins } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import { io } from "socket.io-client"
import api from "@/lib/api"
import { motion } from "framer-motion"

const socket = io("http://localhost:5000")

export default function PriceCard({ item, onCreateAlert, showAlertButton = false }) {
    const [currentPrice, setCurrentPrice] = useState(item.currentPrice)
    const [previousPrice, setPreviousPrice] = useState(item.previousPrice)
    const [userCost, setUserCost] = useState(item.userCost || 0)

    const [isUpdating, setIsUpdating] = useState(false)
    const [isFavorite, setIsFavorite] = useState(item.isFavorite)
    const [product, setProduct] = useState(item)

    useEffect(() => {
        const handleServerUpdate = (data) => {
            if (data.id === item.id) {
                setIsUpdating(true)
                if (data.newPrice !== undefined) {
                    setPreviousPrice(data.previousPrice ?? currentPrice)
                    setCurrentPrice(data.newPrice)
                }
                setProduct((prev) => ({
                    ...prev,
                    name: data.name ?? prev.name,
                    category: data.category ?? prev.category,
                    unit: data.unit ?? prev.unit,
                    region: data.region ?? prev.region,
                    userCost: data.userCost ?? prev.userCost,
                }))
                if (data.userCost !== undefined) {
                    setUserCost(data.userCost);
                }
                setTimeout(() => setIsUpdating(false), 1000)
            }
        }
        socket.on("priceUpdate", handleServerUpdate)
        socket.on("productUpdated", handleServerUpdate)
        return () => {
            socket.off("priceUpdate", handleServerUpdate)
            socket.off("productUpdated", handleServerUpdate)
        }
    }, [item.id, currentPrice])

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

    const hasUserCost = userCost > 0
    const profit = currentPrice - userCost
    const priceChange = currentPrice - previousPrice
    const percentChange = previousPrice > 0 ? ((priceChange / previousPrice) * 100).toFixed(2) : 0

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
        <Link to={`/product/${product.id}`} className="block h-full">
            <motion.div
                whileHover={{ scale: 1.02, y: -4 }} 
                whileTap={{ scale: 0.98 }}          
                initial={{ opacity: 0, y: 20 }}     
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="h-full"
            >
                <Card
                    // --- THAY ĐỔI CHÍNH Ở ĐÂY ---
                    // 1. Dùng bg-white để tạo khối nổi bật trên nền kem.
                    // 2. Bỏ border-l-4 (viền dày) thay bằng border mỏng nhẹ.
                    // 3. Dùng shadow-sm và tăng shadow khi hover.
                    // 4. Giảm độ gắt của ring khi update giá (opacity /30).
                    className={`h-full overflow-hidden bg-white border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 ${
                        isUpdating
                            ? priceChange > 0
                                ? "ring-2 ring-green-500/30"
                                : priceChange < 0
                                    ? "ring-2 ring-red-500/30"
                                    : "ring-2 ring-gray-200"
                            : ""
                    }`}
                >
                    <CardContent className="pt-6 flex flex-col h-full justify-between">
                        <div className="space-y-3">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900 line-clamp-1 text-lg group-hover:text-primary transition-colors">
                                        {product.name}
                                    </h3>
                                    <p className="text-sm text-gray-500">{product.category}</p>
                                </div>
                                <motion.div whileTap={{ scale: 0.8 }}>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 -mt-1 hover:bg-red-50"
                                        onClick={toggleFavorite}
                                    >
                                        <Heart
                                            className={`h-5 w-5 transition-colors duration-200 ${
                                                isFavorite
                                                    ? "fill-red-500 text-red-500"
                                                    : "text-gray-400 hover:text-red-400"
                                            }`}
                                        />
                                    </Button>
                                </motion.div>
                            </div>

                            <div className="space-y-1 bg-gray-50/50 p-2 rounded-lg border border-dashed border-gray-200">
                                <div className="flex items-baseline gap-2">
                                    <span
                                        className={`text-2xl font-bold transition-all duration-500 ${
                                            isUpdating
                                                ? priceChange > 0
                                                    ? "scale-110 text-green-600"
                                                    : priceChange < 0
                                                        ? "scale-110 text-red-600"
                                                        : "text-gray-900"
                                                : "text-primary" 
                                        }`}
                                    >
                                        {currentPrice.toLocaleString("vi-VN")}
                                    </span>
                                    <span className="text-sm text-gray-500">đ/{product.unit}</span>
                                </div>
                                <div className={`flex items-center gap-1 text-sm font-medium ${getTrendColor()}`}>
                                    {getTrendIcon()}
                                    <span>
                                        {priceChange > 0 ? "+" : ""}
                                        {priceChange.toLocaleString("vi-VN")} ({percentChange}%)
                                    </span>
                                </div>
                            </div>

                            {hasUserCost && (
                                <div
                                    className={`flex items-center p-2 rounded-md shadow-sm border ${
                                        profit > 0 
                                        ? "bg-green-100/50 text-green-800 border-green-200" 
                                        : "bg-red-100/50 text-red-800 border-red-200"
                                    }`}
                                >
                                    <Coins size={16} className="mr-2 flex-shrink-0" />
                                    <span className="text-sm font-medium">
                                        Lãi: {profit.toLocaleString()} đ
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                            <Badge variant="outline" className="text-xs font-normal bg-white text-gray-600 border-gray-200">
                                📍 {product.region}
                            </Badge>
                            <span className="text-[10px] text-gray-400 italic">
                                {new Date(product.lastUpdate).toLocaleTimeString("vi-VN", {hour: '2-digit', minute:'2-digit'})}
                            </span>
                        </div>

                        {showAlertButton && (
                            <Button
                                className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white mt-3 shadow-md hover:shadow-lg transition-all"
                                onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    onCreateAlert(item)
                                }}
                            >
                                🔔 Tạo cảnh báo
                            </Button>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </Link>
    )
}