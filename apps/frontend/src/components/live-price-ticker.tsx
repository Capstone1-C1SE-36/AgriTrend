"use client"

import { useEffect, useState } from "react"
import { Activity } from "lucide-react"

interface TickerItem {
    name: string
    price: number
    change: number
    trend: "up" | "down"
}

export default function LivePriceTicker() {
    const [items, setItems] = useState<TickerItem[]>([
        { name: "Lúa ST25", price: 8500, change: 3.5, trend: "up" },
        { name: "Cà Phê", price: 52000, change: -2.1, trend: "down" },
        { name: "Tiêu Đen", price: 145000, change: 1.8, trend: "up" },
        { name: "Cao Su", price: 38500, change: 0, trend: "up" },
        { name: "Điều", price: 185000, change: 2.5, trend: "up" },
    ])

    useEffect(() => {
        const interval = setInterval(() => {
            setItems((prevItems) =>
                prevItems.map((item) => {
                    if (Math.random() < 0.3) {
                        const change = (Math.random() - 0.5) * 5
                        const newPrice = Math.max(100, item.price + (item.price * change) / 100)
                        return {
                            ...item,
                            price: Math.round(newPrice),
                            change: Number(change.toFixed(1)),
                            trend: change >= 0 ? "up" : "down",
                        }
                    }
                    return item
                }),
            )
        }, 3000)

        return () => clearInterval(interval)
    }, [])

    return (
        <div className="bg-card border-b border-border overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 py-2">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm font-medium whitespace-nowrap">
                        <Activity className="h-4 w-4 text-primary animate-pulse" />
                        <span>Giá trực tiếp:</span>
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <div className="flex gap-6 animate-scroll">
                            {[...items, ...items].map((item, index) => (
                                <div key={index} className="flex items-center gap-2 whitespace-nowrap text-sm">
                                    <span className="font-medium">{item.name}</span>
                                    <span className="text-muted-foreground">{item.price.toLocaleString("vi-VN")}đ</span>
                                    <span className={item.trend === "up" ? "text-success" : "text-danger"}>
                                        {item.change > 0 ? "+" : ""}
                                        {item.change}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
