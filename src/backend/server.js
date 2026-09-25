const express = require("express");

const app = express();

const PORT = 3000;

// Cho phép server nhận dữ liệu JSON
app.use(express.json());

// Endpoint kiểm tra Backend
app.get("/api/hello", (req, res) => {
    res.json({
        message: "Hello Smart CRM"
    });
});

// Khởi động server
app.listen(PORT, () => {
    console.log(`Backend running at http://localhost:${PORT}`);
});