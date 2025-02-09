// models/db.js
const mysql = require('mysql');
const dotenv = require('dotenv');
dotenv.config();

const pool = mysql.createPool({
  connectionLimit: 100,
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'property_db',
  waitForConnections: true,
  queueLimit: 0,
});

pool.getConnection((err, connection) => {
  if (err) {
    console.error('Connection Error:', err);
    process.exit(1);
  }
  console.log('Connected to database');
  connection.release();
});

module.exports = pool;
