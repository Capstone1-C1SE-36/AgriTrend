import { useState, useEffect } from "react"
import Navbar from "@/components/Navbar" //
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card" //
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select" //
import { Loader2 } from "lucide-react"
import api from "@/lib/api" //
// Import các component của react-leaflet
import { MapContainer, TileLayer, GeoJSON, Tooltip } from "react-leaflet"

const vietnamGeoJsonUrl = "/vietnam-map.json"; // Tải file từ thư mục /public

// Hàm chuẩn hóa tên tỉnh (quan trọng để khớp dữ liệu)
const normalizeName = (name) => {
  if (!name) return "";
  return name.toLowerCase()
    .replace(/tỉnh /g, "")
    .replace(/thành phố /g, "") // Thêm "thành phố"
    .replace(/tp. /g, "")
    .replace(/đ/g, "d")
    .replace(/ă/g, "a")
    .replace(/â/g, "a")
    .replace(/ê/g, "e")
    .replace(/ô/g, "o")
    .replace(/ơ/g, "o")
    .replace(/ư/g, "u")
    .trim();
};

export default function PriceMap() {
  const [geoJson, setGeoJson] = useState(null); // Dữ liệu bản đồ
  const [allProducts, setAllProducts] = useState([]); // Dữ liệu giá
  const [categories, setCategories] = useState([]); // Danh sách loại (Cà phê, Tiêu...)
  const [selectedCategory, setSelectedCategory] = useState("Cà phê"); // Loại đang chọn
  const [loading, setLoading] = useState(true);

  // 1. Tải dữ liệu bản đồ GeoJSON và dữ liệu giá
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [geoRes, productRes] = await Promise.all([
          fetch(vietnamGeoJsonUrl), // <-- ĐÃ SỬA URL
          api.get("/products/map-data") // API chúng ta đã tạo
        ]);
        
        if (!geoRes.ok) {
          throw new Error(`Không thể tải bản đồ: ${geoRes.statusText} (File: ${vietnamGeoJsonUrl})`);
        }
        
        const geoData = await geoRes.json();
        const productData = productRes.data;

        // Xử lý dữ liệu GeoJSON: Thêm key chuẩn hóa
        // File Gist này có thuộc tính là "name_vi"
        geoData.features = geoData.features.map(feature => ({
          ...feature,
          properties: {
            ...feature.properties,
            // --- SỬA LỖI 2: DÙNG 'name_vi' (từ file JSON mới) ---
            regionKey: normalizeName(feature.properties.name_vi) 
          }
        }));
        
        setGeoJson(geoData);
        setAllProducts(productData); 

        const uniqueCategories = [...new Set(productData.map(p => p.category_name))];
        setCategories(uniqueCategories);
        if (uniqueCategories.length > 0) {
          const defaultCat = uniqueCategories.includes("Cà phê") ? "Cà phê" : uniqueCategories[0];
          setSelectedCategory(defaultCat); 
        }
        
      } catch (error) {
        console.error("Lỗi tải dữ liệu bản đồ:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // (Phần còn lại của file giữ nguyên)

  // 2. Tính toán giá trị min/max để tô màu
  const filteredProducts = allProducts.filter(
    p => p.category_name === selectedCategory
  );
  
  const priceMap = new Map(
    filteredProducts.map(p => [p.regionKey, p.currentPrice])
  );
  
  const prices = filteredProducts.map(p => p.currentPrice).filter(p => p > 0);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;

  // 3. Hàm quyết định màu sắc
  const getColor = (price) => {
    if (price === undefined || minPrice === maxPrice) return "#808080"; 
    
    const ratio = (price - minPrice) / (maxPrice - minPrice);
    
    if (ratio < 0.5) {
      const g = 255;
      const r = Math.round(255 * (ratio * 2));
      return `rgb(${r},${g},0)`;
    } else {
      const r = 255;
      const g = Math.round(255 * (1 - (ratio - 0.5) * 2));
      return `rgb(${r},${g},0)`;
    }
  };

  // 4. Hàm style cho từng tỉnh
  const styleGeoJSON = (feature) => {
    const regionKey = feature.properties.regionKey;
    const price = priceMap.get(regionKey);
    
    return {
      fillColor: getColor(price),
      weight: 1,
      opacity: 1,
      color: 'white',
      fillOpacity: 0.7
    };
  };

  if (loading || !geoJson) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin" />
        <p className="ml-4">Đang tải dữ liệu bản đồ...</p>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tiêu đề và Bộ lọc */}
        <div className="mb-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Bản đồ nhiệt giá</h1>
          <div className="w-64">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn loại nông sản" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Bản đồ */}
        <Card>
          <CardContent className="pt-6 h-[70vh]">
            <MapContainer 
              center={[16.047079, 108.206230]} // Tọa độ Đà Nẵng
              zoom={6} 
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <GeoJSON data={geoJson} style={styleGeoJSON}>
                <Tooltip>
                  {(layer) => {
                    const props = layer.feature.properties;
                    // --- SỬA LỖI 3: DÙNG 'name_vi' ĐỂ HIỂN THỊ TÊN ---
                    const price = priceMap.get(props.regionKey);
                    return `
                      <b>${props.name_vi}</b><br/> 
                      ${price ? `${price.toLocaleString("vi-VN")} đ` : "Không có dữ liệu"}
                    `;
                  }}
                </Tooltip>
              </GeoJSON>
            </MapContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}