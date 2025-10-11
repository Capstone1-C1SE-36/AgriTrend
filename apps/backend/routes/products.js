import express from "express"
import { authenticateToken, isAdmin } from "../middleware/auth.js"

const router = express.Router()

// Mock products database
const products = [
  {
    id: 1,
    name: "Gạo ST25",
    category: "Lúa gạo",
    currentPrice: 18500,
    previousPrice: 18000,
    change: 2.78,
    unit: "kg",
    region: "Đồng bằng sông Cửu Long",
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 2,
    name: "Cà phê Robusta",
    category: "Cà phê",
    currentPrice: 52000,
    previousPrice: 53500,
    change: -2.8,
    unit: "kg",
    region: "Tây Nguyên",
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 3,
    name: "Tiêu đen",
    category: "Gia vị",
    currentPrice: 125000,
    previousPrice: 120000,
    change: 4.17,
    unit: "kg",
    region: "Đông Nam Bộ",
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 4,
    name: "Cao su",
    category: "Công nghiệp",
    currentPrice: 38000,
    previousPrice: 38000,
    change: 0,
    unit: "kg",
    region: "Đông Nam Bộ",
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 5,
    name: "Cao",
    category: "Công nghiệp",
    currentPrice: 38000,
    previousPrice: 38000,
    change: 0,
    unit: "kg",
    region: "Đông Nam Bộ",
    lastUpdated: new Date().toISOString(),
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
    lastUpdated: new Date().toISOString(),
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
    lastUpdated: new Date().toISOString(),
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

export default router
