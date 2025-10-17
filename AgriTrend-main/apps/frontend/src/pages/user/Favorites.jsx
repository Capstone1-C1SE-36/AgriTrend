import React, { useState, useEffect } from "react"
import Navbar from "../../components/Navbar"

export default function Favorites() {
  const [favoriteProducts, setFavoriteProducts] = useState([])

  useEffect(() => {
    const localData = localStorage.getItem("favoriteProducts")
    if (localData) {
      setFavoriteProducts(JSON.parse(localData))
    }
  }, [])

  const handleRemoveFavorite = (productId) => {
    setFavoriteProducts((prevFavorites) => {
      const updatedFavorites = prevFavorites.filter((p) => p.id !== productId)
      localStorage.setItem("favoriteProducts", JSON.stringify(updatedFavorites))
      return updatedFavorites
    })
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-8 text-center">Sản phẩm yêu thích</h1>

        {favoriteProducts.length === 0 ? (
          <p className="text-center text-gray-600 text-lg">Bạn chưa có sản phẩm yêu thích nào.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {favoriteProducts.map((product) => (
              <div
                key={product.id}
                className="p-5 border rounded-lg shadow-sm bg-white transition-all duration-200 ease-in-out hover:shadow-md relative"
              >
                <button
                  className="absolute top-3 right-3 text-red-500 hover:text-red-700 focus:outline-none"
                  onClick={() => handleRemoveFavorite(product.id)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 fill-current"
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
                <p className="text-xl font-bold text-green-600 mt-2">{product.price} đ/kg</p>
                {product.change && (
                  <p className={`text-sm ${product.change > 0 ? "text-green-500" : "text-red-500"}`}>
                    {product.change > 0 ? "↑" : "↓"} {Math.abs(product.change).toFixed(2)}%
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">Cập nhật: {new Date(product.updatedAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
