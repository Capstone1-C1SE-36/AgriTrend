import express from "express"
import { authenticateToken, isAdmin } from "../middleware/auth.js"
import pool from '../db.js'; // Import the PostgreSQL connection pool
import { io } from "../server.js"; // Import the io instance

const router = express.Router()

// Function to create products table if it doesn't exist
const createProductsTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(255) NOT NULL,
        "currentPrice" INTEGER NOT NULL,
        "previousPrice" INTEGER,
        change NUMERIC,
        unit VARCHAR(50) NOT NULL,
        region VARCHAR(255) NOT NULL,
        "lastUpdated" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Products table checked/created successfully');
  } catch (err) {
    console.error('Error creating products table:', err);
  }
};

// Call the function to create the table when the application starts
createProductsTable();

// Get all products
router.get("/", async (req, res) => {
  const { search, category, region } = req.query;
  let query = 'SELECT * FROM products WHERE 1=1';
  const values = [];
  let paramIndex = 1;

  if (search) {
    query += ` AND name ILIKE $${paramIndex++}`;
    values.push(`%${search}%`);
  }

  if (category) {
    query += ` AND category = $${paramIndex++}`;
    values.push(category);
  }

  if (region) {
    query += ` AND region = $${paramIndex++}`;
    values.push(region);
  }

  try {
    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error("Failed to fetch products:", err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// Get product by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    const product = result.rows[0];

    // Fetch price history from product_price_history table
    const priceHistoryResult = await pool.query(
      'SELECT time, price FROM product_price_history WHERE product_id = $1 ORDER BY time ASC',
      [id]
    );
    const history = priceHistoryResult.rows.map(row => ({
      date: new Date(row.time).toISOString(),
      price: parseFloat(row.price),
    }));

    res.json({ ...product, history });
  } catch (err) {
    console.error("Failed to fetch product by ID:", err);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

// Create product (Admin only)
router.post("/", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { name, category, currentPrice, previousPrice, change, unit, region } = req.body;
    const result = await pool.query(
      'INSERT INTO products(name, category, "currentPrice", "previousPrice", change, unit, region) VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING * ',
      [name, category, currentPrice, previousPrice, change, unit, region]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Failed to create product:", err);
    res.status(500).json({ error: "Failed to create product" });
  }
});

// Update product (Admin only)
router.put("/:id", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const setClauses = [];
    const values = [];
    let paramIndex = 1;

    // Fetch the existing product to calculate previousPrice and change if currentPrice is updated
    const existingProductResult = await pool.query('SELECT "currentPrice" FROM products WHERE id = $1', [id]);
    if (existingProductResult.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    const existingCurrentPrice = existingProductResult.rows[0].currentPrice;

    if (updates.currentPrice !== undefined && updates.currentPrice !== existingCurrentPrice) {
      updates.previousPrice = existingCurrentPrice;
      updates.change = ((updates.currentPrice - existingCurrentPrice) / existingCurrentPrice) * 100;
    }

    for (const key in updates) {
      if (updates.hasOwnProperty(key)) {
        setClauses.push(`"${key}" = $${paramIndex++}`);
        values.push(updates[key]);
      }
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ error: "No update fields provided" });
    }

    setClauses.push(`"lastUpdated" = CURRENT_TIMESTAMP`);
    const query = `UPDATE products SET ${setClauses.join(', ')} WHERE id = $${paramIndex++} RETURNING *`;
    values.push(id);

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    const updatedProduct = result.rows[0];

    // If currentPrice was updated, record it in product_price_history
    if (updates.currentPrice !== undefined && updates.currentPrice !== existingCurrentPrice) {
      await pool.query(
        'INSERT INTO product_price_history(time, product_id, price) VALUES(NOW(), $1, $2)',
        [id, updates.currentPrice]
      );
    }

    io.emit("productPriceUpdate", updatedProduct); // Emit WebSocket event
    res.json(updatedProduct);
  } catch (err) {
    console.error("Failed to update product:", err);
    res.status(500).json({ error: "Failed to update product" });
  }
});

// Delete product (Admin only)
router.delete("/:id", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING * ', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error("Failed to delete product:", err);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

export default router
