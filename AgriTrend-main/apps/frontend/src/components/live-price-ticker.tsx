"use client"

import { useEffect, useState } from "react"
import { Activity } from "lucide-react"
import axios from "axios";

interface TickerItem {
    name: string
    price: number
    price_change_7d: number | null
    price_change_30d: number | null
}

const API_BASE_URL = "http://localhost:5003/api/commodity"; // Adjust if your backend runs on a different port

export default function LivePriceTicker() {
    const [items, setItems] = useState<TickerItem[]>([])
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCommodityPrices = async () => {
        setLoading(true);
        setError(null);
        const symbols = ['CORN', 'WHEAT', 'SOY', 'COFFEE', 'SUGAR']; // Example symbols
        const interval = '1day'; // Interval for fetching latest price
        const fetchedItems: TickerItem[] = [];

        for (const symbol of symbols) {
            try {
                const response = await axios.get(`${API_BASE_URL}/prices`, {
                    params: { symbol, interval },
                });
                if (response.data) {
                    fetchedItems.push({
                        name: symbol,
                        price: response.data.price,
                        price_change_7d: response.data.price_change_7d,
                        price_change_30d: response.data.price_change_30d,
                    });
                }
            } catch (err: any) {
                console.error(`Error fetching price for ${symbol}:`, err.message);
                // Optionally, add a placeholder item or handle error for individual symbol
            }
        }
        setItems(fetchedItems);
        setLoading(false);
    };

    useEffect(() => {
        fetchCommodityPrices();
        const intervalId = setInterval(fetchCommodityPrices, 60000); // Update every minute
        return () => clearInterval(intervalId);
    }, []);

    if (loading) {
        return (
            <div className="bg-card border-b border-border overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 py-2">
                    <div className="flex items-center gap-4">
                        <Activity className="h-4 w-4 text-primary animate-pulse" />
                        <span>Đang tải giá hàng hóa...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-card border-b border-border overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 py-2">
                    <div className="flex items-center gap-4 text-danger">
                        <Activity className="h-4 w-4" />
                        <span>Lỗi tải giá hàng hóa: {error}</span>
                    </div>
                </div>
            </div>
        );
    }

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
                                    {item.price_change_7d !== null && (
                                        <span className={item.price_change_7d >= 0 ? "text-success" : "text-danger"}>
                                            {item.price_change_7d > 0 ? "+" : ""}
                                            {item.price_change_7d.toFixed(2)}% (7d)
                                        </span>
                                    )}
                                    {item.price_change_30d !== null && (
                                        <span className={item.price_change_30d >= 0 ? "text-success" : "text-danger"}>
                                            {item.price_change_30d > 0 ? "+" : ""}
                                            {item.price_change_30d.toFixed(2)}% (30d)
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
