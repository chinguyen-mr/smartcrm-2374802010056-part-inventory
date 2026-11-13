const fs = require("fs");
const path = require("path");
const { pool } = require("../src/config/db");

// Đường dẫn DDL: trong container đặt qua biến SQL_DDL_PATH; chạy native dùng đường dẫn tương đối tới repo
const DDL_PATH = process.env.SQL_DDL_PATH || path.join(__dirname, "../../../sql/sql-ddl.sql");

function readDdl() {
  return fs.readFileSync(DDL_PATH, "utf-8");
}

/**
 * Migration "reset": XÓA toàn bộ bảng L5 rồi dựng lại từ DDL.
 * Chỉ dùng khi chủ động muốn làm sạch CSDL (npm run migrate).
 * Khởi động bằng Docker dùng scripts/bootstrap.js (không xóa dữ liệu).
 */
async function migrate() {
  const client = await pool.connect();
  try {
    console.log("=== BẮT ĐẦU CHẠY MIGRATION CSDL ===");
    const ddlContent = readDdl();

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
      DROP TABLE IF EXISTS inventories, inventory_transactions, parts, service_centers CASCADE;
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

if (require.main === module) {
  migrate();
}

module.exports = { migrate, readDdl, DDL_PATH };
