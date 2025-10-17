// import axios from 'axios';
// import dotenv from 'dotenv';
// import pool from '../db.js';

// dotenv.config();

// const API_KEY = process.env.TWELVE_DATA_API_KEY;
// const SYMBOLS = ['CORN', 'WHEAT', 'SOY', 'COFFEE', 'SUGAR']; // Example symbols, can be expanded

// const updateCommodityPrices = async () => {
//     console.log('Starting commodity price update...');
//     for (const symbol of SYMBOLS) {
//         try {
//             const response = await axios.get(`https://api.twelvedata.com/time_series`, {
//                 params: {
//                     symbol,
//                     interval: '1day',
//                     apikey: API_KEY,
//                     outputsize: 30,
//                 },
//             });

//             if (response.data && response.data.values && response.data.values.length > 0) {
//                 const prices = response.data.values;
//                 const latestPrice = parseFloat(prices[0].close);
//                 const latestTimestamp = prices[0].datetime;

//                 let priceChange7d = null;
//                 if (prices.length >= 7) {
//                     const price7dAgo = parseFloat(prices[6].close);
//                     priceChange7d = ((latestPrice - price7dAgo) / price7dAgo) * 100;
//                 }

//                 let priceChange30d = null;
//                 if (prices.length >= 30) {
//                     const price30dAgo = parseFloat(prices[29].close);
//                     priceChange30d = ((latestPrice - price30dAgo) / price30dAgo) * 100;
//                 }

//                 const client = await pool.connect();
//                 try {
//                     const query = `
//                         INSERT INTO commodity_prices (symbol, price, price_change_7d, price_change_30d, timestamp)
//                         VALUES ($1, $2, $3, $4, $5)
//                         ON CONFLICT (symbol, timestamp) DO UPDATE
//                         SET price = EXCLUDED.price,
//                             price_change_7d = EXCLUDED.price_change_7d,
//                             price_change_30d = EXCLUDED.price_change_30d;
//                     `;
//                     await client.query(query, [symbol, latestPrice, priceChange7d, priceChange30d, latestTimestamp]);
//                     console.log(`Updated price for ${symbol} at ${latestTimestamp}`);
//                 } finally {
//                     client.release();
//                 }
//             } else {
//                 console.warn(`No data found for symbol: ${symbol}`);
//             }
//         } catch (error) {
//             console.error(`Error updating prices for ${symbol}:`, error.message);
//         }
//     }
//     console.log('Commodity price update finished.');
// };

// export default updateCommodityPrices;

// [GM] - Các phần sử dụng API twelvedata.com đã được xóa theo yêu cầu của người dùng.
// Nếu cần chức năng cập nhật giá nông sản, cần tích hợp một API khác.