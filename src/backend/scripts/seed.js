const fs = require("fs");
const path = require("path");
const { pool } = require("../src/config/db");

// Hàm parse từng dòng CSV an toàn, xử lý được dấu phẩy bên trong dấu ngoặc kép
function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

// Đọc và tách các dòng CSV
function readCSV(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = parseCSVLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === headers.length) {
      const obj = {};
      headers.forEach((h, idx) => {
        obj[h] = values[idx];
      });
      rows.push(obj);
    }
  }
  return { headers, rows };
}

async function seed() {
  const client = await pool.connect();
  try {
    console.log("=== BẮT ĐẦU CHẠY SEED DỮ LIỆU L5 (IDEMPOTENT) ===");
    const sampleDir = path.join(__dirname, "../../../data/sample");

    await client.query("BEGIN");

    // 1. Seed danh mục trung tâm bảo hành (service_center)
    console.log("1. Nạp danh mục trung tâm bảo hành...");
    const scPath = path.join(sampleDir, "service_centers.csv");
    const { rows: scRows } = readCSV(scPath);
    let scCount = 0;
    for (const sc of scRows) {
      const res = await client.query(
        `INSERT INTO service_center (center_id, center_code, center_name)
         VALUES ($1, $2, $3)
         ON CONFLICT (center_id) DO NOTHING`,
        [Number(sc.center_id), sc.center_code, sc.center_name]
      );
      if (res.rowCount > 0) scCount++;
    }
    console.log(`   -> Đã nạp ${scCount}/${scRows.length} trung tâm mới.`);

    // 2. Seed danh mục linh kiện (part)
    console.log("2. Nạp danh mục linh kiện thay thế...");
    const partPath = path.join(sampleDir, "parts.csv");
    const { rows: partRows } = readCSV(partPath);
    let partCount = 0;
    for (const p of partRows) {
      const res = await client.query(
        `INSERT INTO part (part_id, part_code, part_name, unit_price)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (part_id) DO NOTHING`,
        [Number(p.part_id), p.part_code, p.part_name, Number(p.unit_price)]
      );
      if (res.rowCount > 0) partCount++;
    }
    console.log(`   -> Đã nạp ${partCount}/${partRows.length} linh kiện mới.`);

    // 3. Seed số dư tồn kho (part_stock)
    console.log("3. Nạp số dư tồn kho (part_stock)...");
    const stockPath = path.join(sampleDir, "part_stock.csv");
    const { rows: stockRows } = readCSV(stockPath);
    let stockCount = 0;
    for (const s of stockRows) {
      const res = await client.query(
        `INSERT INTO part_stock (center_id, part_id, quantity, min_threshold, updated_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (center_id, part_id) DO NOTHING`,
        [
          Number(s.center_id),
          Number(s.part_id),
          Number(s.quantity),
          Number(s.min_threshold || 0),
        ]
      );
      if (res.rowCount > 0) stockCount++;
    }
    console.log(`   -> Đã nạp ${stockCount}/${stockRows.length} dòng tồn kho mới.`);

    // 4. Seed tham chiếu phiếu bảo hành (ticket_ref)
    console.log("4. Nạp tham chiếu phiếu bảo hành (ticket_ref)...");
    const ticketPath = path.join(sampleDir, "tickets_history.csv");
    const { rows: ticketRows } = readCSV(ticketPath);
    let ticketCount = 0;
    for (const t of ticketRows) {
      const res = await client.query(
        `INSERT INTO ticket_ref (ticket_id, center_id, ticket_code, status)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (ticket_code) DO NOTHING`,
        [
          Number(t.ticket_id),
          Number(t.center_id),
          t.ticket_code,
          t.status || "DA_DONG",
        ]
      );
      if (res.rowCount > 0) ticketCount++;
    }
    console.log(`   -> Đã nạp ${ticketCount}/${ticketRows.length} phiếu bảo hành tham chiếu.`);

    // Cập nhật sequence của ticket_ref trước khi sinh ticket mới tự động
    await client.query(`
      SELECT setval(pg_get_serial_sequence('ticket_ref', 'ticket_id'), COALESCE(MAX(ticket_id), 1)) FROM ticket_ref;
    `);

    // Bổ sung một số phiếu mẫu ở trạng thái ĐƯỢC PHÉP XUẤT phục vụ KTV thao tác và test API
    const testTickets = [
      { ticket_code: "BH-TEST-ACTIVE-01", center_id: 1, status: "DANG_XU_LY" },
      { ticket_code: "BH-TEST-ACTIVE-02", center_id: 1, status: "CHO_LINH_KIEN" },
      { ticket_code: "BH-TEST-ACTIVE-03", center_id: 1, status: "DA_PHAN_CONG" },
      { ticket_code: "BH-TEST-INVALID-01", center_id: 1, status: "DA_DONG" },
      { ticket_code: "BH-TEST-OTHER-01", center_id: 2, status: "DANG_XU_LY" },
    ];
    for (const tt of testTickets) {
      await client.query(
        `INSERT INTO ticket_ref (center_id, ticket_code, status)
         VALUES ($1, $2, $3)
         ON CONFLICT (ticket_code) DO NOTHING`,
        [tt.center_id, tt.ticket_code, tt.status]
      );
    }
    console.log("   -> Đã nạp thêm phiếu mẫu (active & invalid) phục vụ kiểm thử xuất kho.");

    // Lấy mapping ticket_code -> ticket_id để phục vụ liên kết khóa ngoại
    const ticketMapRes = await client.query("SELECT ticket_id, ticket_code FROM ticket_ref");
    const ticketMap = new Map();
    ticketMapRes.rows.forEach((r) => ticketMap.set(r.ticket_code, Number(r.ticket_id)));

    // 5. Seed lịch sử giao dịch kho (part_transactions.csv)
    console.log("5. Nạp lịch sử giao dịch kho (part_transactions)...");
    const txPath = path.join(sampleDir, "part_transactions.csv");
    const { rows: txRows } = readCSV(txPath);
    let txCount = 0;

    for (const tx of txRows) {
      const txId = Number(tx.transaction_id);
      const centerId = Number(tx.center_id);
      const partId = Number(tx.part_id);
      const type = tx.loai;
      const quantity = Number(tx.so_luong);
      const occurredAt = tx.ngay || new Date().toISOString();

      if (type === "NHAP") {
        const res = await client.query(
          `INSERT INTO part_transaction (transaction_id, center_id, part_id, ticket_part_id, type, quantity, occurred_at, reference)
           VALUES ($1, $2, $3, NULL, 'NHAP', $4, $5, 'Khoi tao kho ban dau')
           ON CONFLICT (transaction_id) DO NOTHING`,
          [txId, centerId, partId, quantity, occurredAt]
        );
        if (res.rowCount > 0) txCount++;
      } else if (type === "XUAT") {
        const ticketCode = tx.ticket_code;
        const ticketId = ticketMap.get(ticketCode);

        // Kiểm tra xem giao dịch này đã được nạp chưa
        const existingTx = await client.query(
          "SELECT transaction_id FROM part_transaction WHERE transaction_id = $1",
          [txId]
        );

        if (existingTx.rows.length === 0 && ticketId) {
          // Bước 1: Tạo bản ghi ticket_part với transaction_id ban đầu là null
          const tpRes = await client.query(
            `INSERT INTO ticket_part (ticket_id, part_id, transaction_id, created_at)
             VALUES ($1, $2, NULL, $3)
             RETURNING ticket_part_id`,
            [ticketId, partId, occurredAt]
          );
          const ticketPartId = tpRes.rows[0].ticket_part_id;

          // Bước 2: Tạo giao dịch part_transaction loại XUAT liên kết tới ticket_part_id
          await client.query(
            `INSERT INTO part_transaction (transaction_id, center_id, part_id, ticket_part_id, type, quantity, occurred_at, reference)
             VALUES ($1, $2, $3, $4, 'XUAT', $5, $6, $7)`,
            [txId, centerId, partId, ticketPartId, quantity, occurredAt, ticketCode]
          );

          // Bước 3: Cập nhật ngược lại transaction_id cho ticket_part (giải quyết FK vòng)
          await client.query(
            `UPDATE ticket_part SET transaction_id = $1 WHERE ticket_part_id = $2`,
            [txId, ticketPartId]
          );
          txCount++;
        }
      }
    }
    console.log(`   -> Đã nạp ${txCount}/${txRows.length} giao dịch kho mới.`);

    // 6. Cập nhật lại SEQUENCE tự tăng cho các bảng để tránh lỗi ID trùng khi người dùng tạo mới
    console.log("6. Cập nhật Identity Sequence cho các bảng...");
    await client.query(`
      SELECT setval(pg_get_serial_sequence('service_center', 'center_id'), COALESCE(MAX(center_id), 1)) FROM service_center;
      SELECT setval(pg_get_serial_sequence('part', 'part_id'), COALESCE(MAX(part_id), 1)) FROM part;
      SELECT setval(pg_get_serial_sequence('ticket_ref', 'ticket_id'), COALESCE(MAX(ticket_id), 1)) FROM ticket_ref;
      SELECT setval(pg_get_serial_sequence('ticket_part', 'ticket_part_id'), COALESCE(MAX(ticket_part_id), 1)) FROM ticket_part;
      SELECT setval(pg_get_serial_sequence('part_transaction', 'transaction_id'), COALESCE(MAX(transaction_id), 1)) FROM part_transaction;
    `);

    await client.query("COMMIT");
    console.log("✅ SEED DỮ LIỆU HOÀN TẤT THÀNH CÔNG VÀ AN TOÀN!");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ LỖI TRONG QUÁ TRÌNH SEED DỮ LIỆU:", error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
