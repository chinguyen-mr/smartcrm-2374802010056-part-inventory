const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config({
  path: path.join(__dirname, "../../.env"),
});

const { pool } = require("./src/config/db");
const errorHandler = require("./src/middleware/errorHandler");

// Import Routes
const authRoutes = require("./src/routes/auth.routes");
const partRoutes = require("./src/routes/part.routes");
const stockRoutes = require("./src/routes/stock.routes");
const ticketRoutes = require("./src/routes/ticket.routes");

const app = express();
const PORT = process.env.APP_PORT || 3000;

// Middleware cơ bản
app.use(cors());
app.use(express.json());

// Kiểm tra kết nối PostgreSQL khi khởi động
pool
  .connect()
  .then((client) => {
    console.log("PostgreSQL connected successfully!");
    client.release();
  })
  .catch((err) => {
    console.error("PostgreSQL connection failed:", err.message);
  });

// Endpoint kiểm tra Backend (Smoke test)
app.get("/api/hello", (req, res) => {
  res.json({
    message: "Hello Smart CRM - Luồng L5 Kho linh kiện thay thế",
    status: "online",
  });
});

// Endpoint kiểm tra Database
app.get("/api/db-test", async (req, res, next) => {
  try {
    const result = await pool.query("SELECT NOW() AS current_time");
    res.json({
      message: "Database connected successfully!",
      database: process.env.DB_NAME,
      time: result.rows[0].current_time,
    });
  } catch (error) {
    next(error);
  }
});

// Mount các router nghiệp vụ L5
app.use("/api/auth", authRoutes);
app.use("/api/parts", partRoutes);
app.use("/api/stock", stockRoutes);
app.use("/api/tickets", ticketRoutes);

// Middleware xử lý lỗi tập trung theo chuẩn Buổi 7 (luôn đặt ở cuối cùng)
app.use(errorHandler);

// Khởi động server nếu chạy trực tiếp
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Backend running at http://localhost:${PORT}`);
  });
}

module.exports = app;