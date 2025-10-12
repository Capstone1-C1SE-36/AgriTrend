import express from "express"
import { authenticateToken, isAdmin } from "../middleware/auth.js"

const router = express.Router()

// Mock products database
const products = [
  {
    id: 1,
    name: "Lúa Gạo ST25",
    category: "Lúa gạo",
    currentPrice: 8500,
    previousPrice: 8200,
    unit: "kg",
    region: "Đồng bằng sông Cửu Long",
    lastUpdate: "2025-09-10T13:42:00Z",
    isFavorite: false,
    trend: "up",
  },
  {
    id: 2,
    name: "Cà phê Robusta",
    category: "Cà phê",
    currentPrice: 52000,
    previousPrice: 53500,
    unit: "kg",
    region: "Tây Nguyên",
    lastUpdate: "2025-09-10T13:42:00Z",
    isFavorite: false,
    trend: "down",
  },
  {
    id: 3,
    name: "Tiêu Đen",
    category: "Gia vị",
    currentPrice: 125000,
    previousPrice: 120000,
    unit: "kg",
    region: "Đông Nam Bộ",
    lastUpdate: "2025-09-10T13:42:00Z",
    isFavorite: false,
    trend: "up",
  },
  {
    id: 4,
    name: "Cao Su",
    category: "Công nghiệp",
    currentPrice: 38000,
    previousPrice: 38000,
    unit: "kg",
    region: "Đông Nam Bộ",
    lastUpdate: "2025-09-10T13:42:00Z",
    isFavorite: false,
    trend: "neutral",
  },
  {
    id: 5,
    name: "Ngô Vàng",
    category: "Ngũ cốc",
    currentPrice: 9500,
    previousPrice: 9100,
    unit: "kg",
    region: "Miền Bắc",
    lastUpdate: "2025-09-10T13:42:00Z",
    isFavorite: false,
    trend: "up",
  },
]

// Get all products
router.get("/", (req, res) => {
  const { search, category, region } = req.query

  let filtered = [...products]

  if (search) {
    filtered = filtered.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
  }

  if (category) {
    filtered = filtered.filter((p) => p.category === category)
  }

  if (region) {
    filtered = filtered.filter((p) => p.region === region)
  }

  res.json(filtered)
})

// Get product by ID
router.get("/:id", (req, res) => {
  const product = products.find((p) => p.id === Number.parseInt(req.params.id))

  if (!product) {
    return res.status(404).json({ error: "Product not found" })
  }

  // Generate mock price history
  const history = Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString(),
    price: product.currentPrice + Math.random() * 2000 - 1000,
  }))

  res.json({ ...product, history })
})

// Create product (Admin only)
router.post("/", authenticateToken, isAdmin, (req, res) => {
  const newProduct = {
    id: products.length + 1,
    ...req.body,
    lastUpdate: new Date().toISOString(),
  }

  products.push(newProduct)
  res.status(201).json(newProduct)
})

// Update product (Admin only)
router.put("/:id", authenticateToken, isAdmin, (req, res) => {
  const index = products.findIndex((p) => p.id === Number.parseInt(req.params.id))

  if (index === -1) {
    return res.status(404).json({ error: "Product not found" })
  }

  products[index] = {
    ...products[index],
    ...req.body,
    lastUpdate: new Date().toISOString(),
  }

  res.json(products[index])
})

// Delete product (Admin only)
router.delete("/:id", authenticateToken, isAdmin, (req, res) => {
  const index = products.findIndex((p) => p.id === Number.parseInt(req.params.id))

  if (index === -1) {
    return res.status(404).json({ error: "Product not found" })
  }

  products.splice(index, 1)
  res.json({ message: "Product deleted successfully" })
})

// Update product price only
router.patch("/:id/price", (req, res) => {
  const product = products.find(p => p.id === Number.parseInt(req.params.id))
  if (!product) return res.status(404).json({ error: "Product not found" })

  const { newPrice } = req.body
  product.previousPrice = product.currentPrice
  product.currentPrice = newPrice
  product.lastUpdate = new Date().toISOString()

  res.json(product)
})


export default router
