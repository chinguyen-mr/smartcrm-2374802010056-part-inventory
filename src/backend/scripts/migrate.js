const fs = require("fs");
const path = require("path");
const { pool } = require("../src/config/db");

async function migrate() {
  const client = await pool.connect();
  try {
    console.log("=== BẮT ĐẦU CHẠY MIGRATION CSDL ===");
    const ddlPath = path.join(__dirname, "../../../sql/sql-ddl.sql");
    const ddlContent = fs.readFileSync(ddlPath, "utf-8");

    await client.query("BEGIN");

    // Xóa bảng cũ nếu đã tồn tại để đảm bảo dựng lại từ đầu sạch sẽ (Clean state)
    console.log("Dọn dẹp schema cũ (nếu có)...");
    await client.query(`
      DROP TABLE IF EXISTS part_transaction CASCADE;
      DROP TABLE IF EXISTS ticket_part CASCADE;
      DROP TABLE IF EXISTS ticket_ref CASCADE;
      DROP TABLE IF EXISTS part_stock CASCADE;
      DROP TABLE IF EXISTS employee CASCADE;
      DROP TABLE IF EXISTS part CASCADE;
      DROP TABLE IF EXISTS service_center CASCADE;
    `);

    console.log("Thực thi DDL chính thức từ sql/sql-ddl.sql...");
    await client.query(ddlContent);

    await client.query("COMMIT");
    console.log("✅ MIGRATION HOÀN TẤT THÀNH CÔNG!");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ LỖI KHI CHẠY MIGRATION:", error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
