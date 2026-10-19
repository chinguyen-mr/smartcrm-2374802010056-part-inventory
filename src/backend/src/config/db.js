const { Pool } = require("pg");
const path = require("path");
require("dotenv").config({
  path: path.join(__dirname, "../../../../.env"),
});

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || "smart_crm",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "123",
});

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
};
