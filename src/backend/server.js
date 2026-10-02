const express = require("express");
const { Pool } = require("pg");
const path = require("path");
require("dotenv").config({
    path: path.join(__dirname, "../../.env")
});

const app = express();
const PORT = process.env.APP_PORT || 3000;

// Cho phép server nhận dữ liệu JSON
app.use(express.json());

// Kết nối PostgreSQL
const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

// Kiểm tra kết nối PostgreSQL
pool.connect()
    .then(client => {
        console.log("PostgreSQL connected successfully!");
        client.release();
    })
    .catch(err => {
        console.error("PostgreSQL connection failed:", err.message);
    });

// Endpoint kiểm tra Backend
app.get("/api/hello", (req, res) => {
    res.json({
        message: "Hello Smart CRM"
    });
});

// Endpoint kiểm tra Database
app.get("/api/db-test", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW() AS current_time");

        res.json({
            message: "Database connected successfully!",
            database: process.env.DB_NAME,
            time: result.rows[0].current_time
        });
    } catch (error) {
        console.error("Database error:", error.message);

        res.status(500).json({
            message: "Database connection failed",
            error: error.message
        });
    }
});

// Khởi động server
app.listen(PORT, () => {
    console.log(`Backend running at http://localhost:${PORT}`);
});