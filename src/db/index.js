// src/db/connection.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

pool.connect()
  .then(() => console.log("📡 Conexión a PostgreSQL exitosa"))
  .catch(err => console.error("❌ Error en la conexión a PostgreSQL", err));

module.exports = pool;
