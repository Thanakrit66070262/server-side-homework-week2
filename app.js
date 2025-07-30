require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const app = express();
const port = 3000;

app.use(express.json()); 
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE
});


app.get('/products', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM products WHERE is_deleted = FALSE');
  res.json(rows);
});


app.get('/products/:id', async (req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM products WHERE id = ? AND is_deleted = FALSE',
    [req.params.id]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Product not found' });
  res.json(rows[0]);
});


app.get('/products/search/:keyword', async (req, res) => {
  const keyword = `%${req.params.keyword}%`;
  const [rows] = await pool.query(
    'SELECT * FROM products WHERE name LIKE ? AND is_deleted = FALSE',
    [keyword]
  );
  res.json(rows);
});


app.post('/products', async (req, res) => {
  const { name, price, discount, review_count, image_url } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO products (name, price, discount, review_count, image_url) VALUES (?, ?, ?, ?, ?)',
      [name, price, discount, review_count, image_url]
    );
    res.status(201).json({ id: result.insertId, message: 'Product created' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/products/:id', async (req, res) => {
  const { name, price, discount, review_count, image_url } = req.body;
  try {
    const [result] = await pool.query(
      'UPDATE products SET name = ?, price = ?, discount = ?, review_count = ?, image_url = ? WHERE id = ? AND is_deleted = FALSE',
      [name, price, discount, review_count, image_url, req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found or already deleted' });
    }
    res.json({ message: 'Product updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/products/:id', async (req, res) => {
  try {
    const [result] = await pool.query(
      'UPDATE products SET is_deleted = TRUE WHERE id = ? AND is_deleted = FALSE',
      [req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found or already deleted' });
    }
    res.json({ message: 'Product soft-deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.patch('/products/restore/:id', async (req, res) => {
  try {
    const [result] = await pool.query(
      'UPDATE products SET is_deleted = FALSE WHERE id = ? AND is_deleted = TRUE',
      [req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found or not deleted' });
    }
    res.json({ message: 'Product restored' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



app.listen(port, () => {
  console.log(`API is running on http://localhost:${port}`);
});
