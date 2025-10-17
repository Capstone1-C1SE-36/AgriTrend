import Navbar from "../../components/Navbar"
import { useState, useEffect } from "react"
import axios from "axios"
import { Link } from "react-router-dom"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Compare() {
  const [products, setProducts] = useState([])
  const [selectedProducts, setSelectedProducts] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [detailedProducts, setDetailedProducts] = useState([])
  const [loading, setLoading] = useState(false) // Add loading state
  const [notification, setNotification] = useState(null) // Add notification state
  const [favoriteProducts, setFavoriteProducts] = useState(() => {
    const localData = localStorage.getItem("favoriteProducts")
    return localData ? JSON.parse(localData) : []
  })
  const [savedComparisons, setSavedComparisons] = useState(() => {
    const localData = localStorage.getItem("savedComparisons")
    return localData ? JSON.parse(localData) : []
  })

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get("http://localhost:5003/api/products") // Cập nhật URL backend
        setProducts(response.data)
      } catch (error) {
        console.error("Error fetching products:", error)
      }
    }
    fetchProducts()
  }, [])

  useEffect(() => {
    localStorage.setItem("savedComparisons", JSON.stringify(savedComparisons))
  }, [savedComparisons])

  useEffect(() => {
    localStorage.setItem("favoriteProducts", JSON.stringify(favoriteProducts))
  }, [favoriteProducts])

  // Effect to clear notification after a few seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null)
      }, 3000) // Clear notification after 3 seconds
      return () => clearTimeout(timer)
    }
  }, [notification])

  const handleSearch = (event) => {
    setSearchTerm(event.target.value)
  }

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  const handleCompare = async () => {
    setLoading(true) // Set loading to true
    const fetchedDetails = await Promise.all(
      selectedProducts.map(async (product) => {
        try {
          const response = await axios.get(`http://localhost:5003/api/products/${product.id}`)
          return { ...response.data, history: response.data.history.map(item => ({ ...item, name: response.data.name })) } // Add product name to history for chart legend
        } catch (error) {
          console.error(`Error fetching details for product ${product.id}:`, error)
          setNotification(`Lỗi khi tìm nạp chi tiết cho sản phẩm ${product.name}.`)
          return null
        }
      })
    )
    const validDetails = fetchedDetails.filter(Boolean)
    setDetailedProducts(validDetails)

    if (validDetails.length === 2) {
      setSavedComparisons((prev) => {
        const newComparison = { id: Date.now(), products: validDetails.map(p => ({ id: p.id, name: p.name })) }
        return [...prev, newComparison]
      })
    } else if (validDetails.length < 2 && selectedProducts.length === 2) {
      setNotification("Không thể tải chi tiết cho một hoặc nhiều sản phẩm đã chọn.")
    }
    setLoading(false) // Set loading to false
  }

  const handleLoadComparison = async (comparison) => {
    setLoading(true) // Set loading to true
    setSelectedProducts([])
    setDetailedProducts([])
    const fetchedDetails = await Promise.all(
      comparison.products.map(async (product) => {
        try {
          const response = await axios.get(`http://localhost:5003/api/products/${product.id}`)
          return { ...response.data, history: response.data.history.map(item => ({ ...item, name: response.data.name })) } // Add product name to history for chart legend
        } catch (error) {
          console.error(`Error fetching details for product ${product.id}:`, error)
          setNotification(`Lỗi khi tải so sánh cho sản phẩm ${product.name}.`)
          return null
        }
      })
    )
    setDetailedProducts(fetchedDetails.filter(Boolean))
    setLoading(false) // Set loading to false
  }

  const handleClearSavedComparisons = () => {
    setSavedComparisons([])
    setNotification("Đã xóa tất cả các so sánh đã lưu.")
  }

  const handleToggleFavorite = (product) => { 
   // BƯỚC 1 & 2: Xác định trạng thái tiếp theo mà không gây tác dụng phụ 
   const isFavorite = favoriteProducts.some((p) => p.id === product.id); 
 
   if (isFavorite) { 
     // Cập nhật state một cách riêng biệt 
     setFavoriteProducts((prevFavorites) => 
       prevFavorites.filter((p) => p.id !== product.id) 
     ); 
     setNotification(`Đã xóa '${product.name}' khỏi danh sách yêu thích.`); 
   } else { 
     const simplifiedProduct = { 
       id: product.id, 
       name: product.name, 
       region: product.region, 
       currentPrice: product.currentPrice, 
       unit: product.unit, 
       lastUpdated: product.lastUpdated, 
       category: product.category, 
     }; 
     
     // Cập nhật state một cách riêng biệt 
     setFavoriteProducts((prevFavorites) => [...prevFavorites, simplifiedProduct]); 
     setNotification(`Đã thêm '${product.name}' vào danh sách yêu thích.`); 
   } 
 
   // Console log bên ngoài để kiểm tra 
   console.log(`Toggled favorite for product: ${product.name}. Was favorite? ${isFavorite}`); 
 };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-8 text-center">So sánh giá sản phẩm</h1>

        {notification && (
          <div className="bg-blue-100 border-t-4 border-blue-500 rounded-b text-blue-900 px-4 py-3 shadow-md mb-6" role="alert">
            <div className="flex">
              <div className="py-1"><svg className="fill-current h-6 w-6 text-blue-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M2.93 17.07A10 10 0 0 1 20 10V0H0v10a10 10 0 0 1 2.93 7.07zm12.73-1.41A8 8 0 0 0 10 4H4v6a8 8 0 0 0 8.66 7.93L15.66 15.66z"/></svg></div>
              <div>
                <p className="font-bold">Thông báo</p>
                <p className="text-sm">{notification}</p>
              </div>
            </div>
          </div>
        )}

        <div className="mb-8">
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm theo tên..."
            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {filteredProducts.length === 0 && searchTerm !== '' && (
            <p className="text-gray-500 italic col-span-full text-center">Không tìm thấy sản phẩm nào phù hợp với tìm kiếm của bạn.</p>
          )}
          {filteredProducts.length === 0 && searchTerm === '' && (
            <p className="text-gray-500 italic col-span-full text-center">Không có sản phẩm nào để hiển thị. Vui lòng thêm sản phẩm.</p>
          )}
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className={`p-5 border rounded-lg shadow-sm cursor-pointer transition-all duration-200 ease-in-out ${
                selectedProducts.some((p) => p.id === product.id)
                  ? "border-blue-600 ring-2 ring-blue-300 bg-blue-50"
                  : "border-gray-200 bg-white hover:shadow-md"
              }`}
              onClick={(e) => {
                // Ngăn chặn sự kiện lan truyền từ nút yêu thích
                if (e.target.closest('.favorite-button')) return;

                // Xử lý chọn sản phẩm
                if (selectedProducts.length < 2 && !selectedProducts.some(p => p.id === product.id)) {
                  setSelectedProducts(prev => [...prev, product]);
                } else if (selectedProducts.some(p => p.id === product.id)) {
                  setSelectedProducts(prev => prev.filter(p => p.id !== product.id));
                } else {
                  setNotification("Chỉ có thể chọn tối đa 2 sản phẩm.");
                }
              }}
            >
              <button
                className="absolute top-0 right-0 p-3 text-gray-400 hover:text-red-500 focus:outline-none z-20 favorite-button"
                onClick={(e) => {
                  console.log("Favorite button clicked.");
                  e.stopPropagation();
                  e.preventDefault();
                  handleToggleFavorite(product);
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-6 w-6 ${favoriteProducts.some(p => p.id === product.id) ? 'text-red-500' : 'text-gray-400'}`}
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 22.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </button>
              <h2 className="text-lg font-semibold text-gray-800">{product.name}</h2>
              <p className="text-sm text-gray-600">{product.region}</p>
            </div>
          ))}
        </div>

        <div className="mb-8 p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Sản phẩm đã chọn ({selectedProducts.length}/2)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedProducts.length === 0 && (
              <p className="text-gray-500 italic">Chọn tối đa 2 sản phẩm để so sánh.</p>
            )}
            {selectedProducts.map((product) => (
              <div key={product.id} className="flex items-center p-4 border border-green-500 rounded-lg bg-green-50 shadow-sm">
                <span className="text-green-700 mr-3"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></span>
                <div>
                  <h3 className="font-semibold text-lg text-green-800">{product.name}</h3>
                  <p className="text-sm text-green-600">{product.region}</p>
                </div>
              </div>
            ))}
          </div>

          {selectedProducts.length === 2 && (
            <button
              className="mt-6 w-full bg-blue-600 text-white px-5 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleCompare}
              disabled={loading}
            >
              {loading ? "Đang tải..." : "So sánh sản phẩm"}
            </button>
          )}
        </div>

        {/* Saved Comparisons Section */}
        <div className="mt-10 p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">So sánh đã lưu</h2>
          {savedComparisons.length === 0 ? (
            <p className="text-gray-500 italic">Chưa có so sánh nào được lưu. So sánh hai sản phẩm để lưu.</p>
          ) : (
            <div className="space-y-3">
              {savedComparisons.map((comparison) => (
                <div key={comparison.id} className="flex justify-between items-center p-4 border border-gray-200 rounded-lg bg-gray-50 shadow-sm">
                  <span className="text-gray-700 font-medium">{comparison.products.map(p => p.name).join(" vs ")}</span>
                  <button
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 text-sm transition-colors duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => handleLoadComparison(comparison)}
                    disabled={loading}
                  >
                    Xem so sánh
                  </button>
                </div>
              ))}
              <button
                className="mt-6 w-full bg-red-600 text-white px-5 py-3 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleClearSavedComparisons}
                disabled={loading}
              >
                Xóa tất cả so sánh đã lưu
              </button>
            </div>
          )}
        </div>

        {/* Comparison Table */}
        {loading && <p className="text-center text-blue-600 text-lg mt-10">Đang tải dữ liệu so sánh...</p>}
        {detailedProducts.length === 2 && !loading && (
          <div className="mt-10 p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Kết quả so sánh</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="py-4 px-6 border-b-2 border-gray-300 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Tiêu chí</th>
                    <th className="py-4 px-6 border-b-2 border-gray-300 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">{detailedProducts[0].name}</th>
                    <th className="py-4 px-6 border-b-2 border-gray-300 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">{detailedProducts[1].name}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-4 px-6 border-b border-gray-200 font-semibold text-gray-800">Giá hiện tại</td>
                    <td className="py-4 px-6 border-b border-gray-200 text-gray-700">{detailedProducts[0].currentPrice} {detailedProducts[0].unit}</td>
                    <td className="py-4 px-6 border-b border-gray-200 text-gray-700">{detailedProducts[1].currentPrice} {detailedProducts[1].unit}</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 border-b border-gray-200 font-semibold text-gray-800">Nguồn gốc</td>
                    <td className="py-4 px-6 border-b border-gray-200 text-gray-700">{detailedProducts[0].region}</td>
                    <td className="py-4 px-6 border-b border-gray-200 text-gray-700">{detailedProducts[1].region}</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 border-b border-gray-200 text-gray-700 font-semibold">Cập nhật cuối</td>
                    <td className="py-4 px-6 border-b border-gray-200 text-gray-700">{new Date(detailedProducts[0].lastUpdated).toLocaleDateString()}</td>
                    <td className="py-4 px-6 border-b border-gray-200 text-gray-700">{new Date(detailedProducts[1].lastUpdated).toLocaleDateString()}</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 border-b border-gray-200 font-semibold text-gray-800">Biểu đồ giá lịch sử</td>
                    <td colSpan="2" className="py-4 px-6 border-b border-gray-200">
                      <div className="flex flex-col lg:flex-row justify-around items-center space-y-6 lg:space-y-0 lg:space-x-6 mt-4">
                        <div className="w-full lg:w-1/2 h-80 bg-white p-4 rounded-lg shadow-lg border border-gray-100">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={detailedProducts[0].history} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="date" tickFormatter={(dateStr) => new Date(dateStr).toLocaleDateString()} />
                              <YAxis domain={['auto', 'auto']} />
                              <Tooltip />
                              <Legend />
                              <Line type="monotone" dataKey="price" stroke="#8884d8" activeDot={{ r: 8 }} name={detailedProducts[0].name} strokeWidth={2} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="w-full lg:w-1/2 h-80 bg-white p-4 rounded-lg shadow-lg border border-gray-100">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={detailedProducts[1].history} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="date" tickFormatter={(dateStr) => new Date(dateStr).toLocaleDateString()} />
                              <YAxis domain={['auto', 'auto']} />
                              <Tooltip />
                              <Legend />
                              <Line type="monotone" dataKey="price" stroke="#82ca9d" activeDot={{ r: 8 }} name={detailedProducts[1].name} strokeWidth={2} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
