// import axios from 'axios';
// import dotenv from 'dotenv';
import express from 'express';
// import pool from '../db.js';

// dotenv.config();

const router = express.Router();

// Route to fetch commodity prices from Twelve Data API
// router.get('/prices', async (req, res) => {
//     const { symbol, interval } = req.query;
//     const API_KEY = process.env.TWELVE_DATA_API_KEY;

//     if (!symbol || !interval) {
//         return res.status(400).json({ message: 'Symbol and interval are required' });
//     }

//     try {
//         // Fetch historical data for 30 days to calculate price changes
//         const response = await axios.get(`https://api.twelvedata.com/time_series`, {
//             params: {
//                 symbol,
//                 interval: '1day', // Always fetch daily data for historical calculations
//                 apikey: API_KEY,
//                 outputsize: 30, // Get 30 data points for 30-day change
//             },
//         });

//         if (response.data && response.data.values && response.data.values.length > 0) {
//             const prices = response.data.values;
//             const latestPrice = parseFloat(prices[0].close);
//             const latestTimestamp = prices[0].datetime;

//             // Calculate 7-day price change
//             let priceChange7d = null;
//             if (prices.length >= 7) {
//                 const price7dAgo = parseFloat(prices[6].close);
//                 priceChange7d = ((latestPrice - price7dAgo) / price7dAgo) * 100;
//             }

//             // Calculate 30-day price change
//             let priceChange30d = null;
//             if (prices.length >= 30) {
//                 const price30dAgo = parseFloat(prices[29].close);
//                 priceChange30d = ((latestPrice - price30dAgo) / price30dAgo) * 100;
//             }

//             // Store data in PostgreSQL
//             const client = await pool.connect();
//             try {
//                 const query = `
//                     INSERT INTO commodity_prices (symbol, price, price_change_7d, price_change_30d, timestamp)
//                     VALUES ($1, $2, $3, $4, $5)
//                     ON CONFLICT (symbol, timestamp) DO UPDATE
//                     SET price = EXCLUDED.price,
//                         price_change_7d = EXCLUDED.price_change_7d,
//                         price_change_30d = EXCLUDED.price_change_30d;
//                 `;
//                 await client.query(query, [symbol, latestPrice, priceChange7d, priceChange30d, latestTimestamp]);
//                 console.log(`Stored latest price for ${symbol} at ${latestTimestamp}`);
//             } finally {
//                 client.release();
//             }

//             res.json({
//                 symbol,
//                 price: latestPrice,
//                 price_change_7d: priceChange7d,
//                 price_change_30d: priceChange30d,
//                 timestamp: latestTimestamp,
//                 message: 'Commodity data fetched and stored successfully.'
//             });
//         } else {
//             res.status(404).json({ message: 'No data found for the given symbol' });
//         }
//     } catch (error) {
//         console.error('Error fetching or storing commodity prices:', error.message);
//         res.status(500).json({ message: 'Error fetching or storing commodity prices', error: error.message });
//     }
// });

// [GM] - Các phần sử dụng API twelvedata.com đã được xóa theo yêu cầu của người dùng.
// Nếu cần chức năng lấy giá nông sản, cần tích hợp một API khác.

export default router;