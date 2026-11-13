/**
 * Khởi tạo CSDL an toàn cho Docker (service `db-init` trong docker-compose.yml).
 *
 * - Nếu schema CHƯA có: tạo 7 bảng từ sql/sql-ddl.sql.
 * - Nếu schema ĐÃ có: giữ nguyên, KHÔNG xóa dữ liệu (khác với `npm run migrate`).
 * - Sau đó chạy seed idempotent (ON CONFLICT DO NOTHING) và in số dòng từng bảng,
 *   để chứng minh chạy lần hai không nhân đôi dữ liệu (tiêu chí C8).
 *
 * Chạy lại thủ công: docker compose run --rm db-init
 */
const { pool } = require("../src/config/db");
const { readDdl } = require("./migrate");
const { seedData } = require("./seed");

const TABLES = [
  "service_center",
  "employee",
  "part",
  "part_stock",
  "ticket_ref",
  "ticket_part",
  "part_transaction",
];

async function countRows(client) {
  const counts = {};
  for (const table of TABLES) {
    const res = await client.query(`SELECT COUNT(*)::int AS n FROM ${table}`);
    counts[table] = res.rows[0].n;
  }
  return counts;
}

async function bootstrap() {
  const client = await pool.connect();
  try {
    console.log("=== DB-INIT: KIỂM TRA SCHEMA ===");
    const check = await client.query("SELECT to_regclass('public.part_transaction') AS t");
    await client.query("BEGIN");
    if (check.rows[0].t === null) {
      console.log("Schema chưa có -> tạo 7 bảng từ sql-ddl.sql");
      await client.query(readDdl());
    } else {
      console.log("Schema đã có -> giữ nguyên dữ liệu, chỉ chạy seed idempotent");
    }
    await seedData(client);
    await client.query("COMMIT");

    const counts = await countRows(client);
    console.log("=== DB-INIT: SỐ DÒNG SAU KHI CHẠY ===");
    for (const table of TABLES) {
      console.log(`   ${table.padEnd(18)} ${counts[table]}`);
    }
    console.log("✅ DB-INIT HOÀN TẤT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("❌ DB-INIT THẤT BẠI:", error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

bootstrap();
