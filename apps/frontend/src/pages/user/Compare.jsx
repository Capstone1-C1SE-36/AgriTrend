import { useState, useEffect } from "react"
import Navbar from "@/components/Navbar"
import api from "@/lib/api"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, X, BarChartHorizontal } from "lucide-react"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts" //


const COLORS = ["#16a34a", "#f59e0b", "#3b82f6", "#ef4444", "#8b5cf6"];

export default function Compare() {
  const [allProducts, setAllProducts] = useState([]); // Danh sách để chọn
  const [selectedProducts, setSelectedProducts] = useState([]); // Mảng sản phẩm đã chọn
  const [chartData, setChartData] = useState([]); // Dữ liệu cho biểu đồ
  const [loadingList, setLoadingList] = useState(true);
  const [loadingChart, setLoadingChart] = useState(false);

  // 1. Tải danh sách tất cả sản phẩm (chỉ 1 lần)
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const res = await api.get("/products/all"); //
        setAllProducts(res.data);
      } catch (error) {
        console.error("Lỗi tải danh sách sản phẩm:", error);
      } finally {
        setLoadingList(false);
      }
    };
    fetchAll();
  }, []);

  // 2. Tải dữ liệu biểu đồ (ĐÃ TỐI ƯU)
  useEffect(() => {
    const fetchCompareData = async () => {
      if (selectedProducts.length === 0) {
        setChartData([]); // Xóa biểu đồ nếu không chọn gì
        return;
      }

      setLoadingChart(true);
      try {
        // --- 🚀 LOGIC MỚI: Chỉ 1 lệnh gọi API ---
        const productIds = selectedProducts.map(p => p.id);
        const res = await api.post("/products/compare", { productIds }); // Gọi API mới
        
        // Dữ liệu trả về đã được "trộn" và "chuẩn hóa"
        setChartData(res.data); 
        
      } catch (error) {
        console.error("Lỗi tải dữ liệu so sánh:", error);
      } finally {
        setLoadingChart(false);
      }
    };

    fetchCompareData();
  }, [selectedProducts]); // Kích hoạt khi danh sách chọn thay đổi

  // 3. Hàm xử lý khi chọn 1 sản phẩm
  const handleSelectProduct = (productId) => {
    if (!productId || selectedProducts.length >= 5) return; 
    
    if (selectedProducts.find(p => p.id === productId)) return;

    const productToAdd = allProducts.find(p => p.id === productId);
    if (productToAdd) {
      setSelectedProducts([...selectedProducts, productToAdd]);
    }
  };

  // 4. Hàm xử lý khi xóa 1 sản phẩm
  const handleRemoveProduct = (productId) => {
    setSelectedProducts(selectedProducts.filter(p => p.id !== productId));
  };

  return (
    <div>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">So sánh Tăng trưởng</h1>
        
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">
                  Chọn sản phẩm (Tối đa 5)
                </label>
                <Select
                  onValueChange={handleSelectProduct}
                  disabled={loadingList || selectedProducts.length >= 5}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingList ? "Đang tải danh sách..." : "Thêm sản phẩm để so sánh..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {allProducts.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} ({p.region})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">
                  Đang so sánh:
                </label>
                <div className="flex flex-wrap gap-2 min-h-[40px] items-center">
                  {selectedProducts.length === 0 ? (
                     <span className="text-sm text-muted-foreground">Chưa chọn sản phẩm nào.</span>
                  ) : (
                    selectedProducts.map(p => (
                      <Badge key={p.id} variant="secondary" className="text-base py-1">
                        {p.name}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 ml-1"
                          onClick={() => handleRemoveProduct(p.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Biểu đồ (ĐÃ SỬA TRỤC Y VÀ TOOLTIP) */}
        <Card>
          <CardHeader>
            <CardTitle>Biểu đồ so sánh tăng trưởng 30 ngày (Mốc = 100%)</CardTitle>
          </CardHeader>
          <CardContent className="h-[500px] w-full">
            {loadingChart ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="w-12 h-12 animate-spin" />
              </div>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  {/* --- 🚀 SỬA TRỤC Y ĐỂ HIỂN THỊ % --- */}
                  <YAxis 
                    tickFormatter={(value) => `${value.toFixed(0)}%`}
                    domain={['auto', 'auto']}
                  />
                  {/* --- 🚀 SỬA TOOLTIP ĐỂ HIỂN THỊ % --- */}
                  <Tooltip 
                    formatter={(value) => `${value.toFixed(2)}%`}
                    labelFormatter={(label) => `Ngày: ${label}`}
                  />
                  <Legend />
                  {selectedProducts.map((p, index) => (
                    <Line
                      key={p.id}
                      type="monotone"
                      dataKey={p.name}
                      stroke={COLORS[index % COLORS.length]} 
                      strokeWidth={2}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col justify-center items-center h-full text-muted-foreground">
                <BarChartHorizontal className="w-12 h-12" />
                <p className="mt-2">Chọn ít nhất một sản phẩm để xem biểu đồ.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}