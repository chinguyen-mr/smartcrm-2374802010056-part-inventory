const { pool } = require("../config/db");

class TransactionRepository {
  /**
   * Ghi nhận giao dịch kho mới (bất biến theo QT-13)
   */
  async create({ centerId, partId, ticketPartId = null, type, quantity, reference = null }, client = null) {
    const runner = client || pool;
    const res = await runner.query(
      `INSERT INTO part_transaction (center_id, part_id, ticket_part_id, type, quantity, occurred_at, reference)
       VALUES ($1, $2, $3, $4, $5, NOW(), $6)
       RETURNING transaction_id, center_id, part_id, ticket_part_id, type, quantity, occurred_at, reference`,
      [centerId, partId, ticketPartId, type, quantity, reference]
    );
    return res.rows[0];
  }

  /**
   * Tra cứu lịch sử biến động kho theo bộ lọc (UC7, FR10)
   */
  async findAll({ centerId, partId, type, from, to, page = 1, size = 20 }) {
    const offset = (page - 1) * size;
    const params = [centerId];
    const whereConditions = ["t.center_id = $1"];

    if (partId) {
      params.push(partId);
      whereConditions.push(`t.part_id = $${params.length}`);
    }

    if (type) {
      params.push(type);
      whereConditions.push(`t.type = $${params.length}`);
    }

    if (from) {
      params.push(from);
      whereConditions.push(`t.occurred_at >= $${params.length}::timestamptz`);
    }

    if (to) {
      params.push(`${to} 23:59:59.999`);
      whereConditions.push(`t.occurred_at <= $${params.length}::timestamptz`);
    }

    const whereClause = `WHERE ${whereConditions.join(" AND ")}`;

    const countQuery = `SELECT COUNT(*) AS total FROM part_transaction t ${whereClause}`;
    const countRes = await pool.query(countQuery, params);
    const total = parseInt(countRes.rows[0].total, 10);

    params.push(size);
    const limitIndex = params.length;
    params.push(offset);
    const offsetIndex = params.length;

    const dataQuery = `
      SELECT
        t.transaction_id,
        t.center_id,
        t.part_id,
        p.part_code,
        p.part_name,
        t.ticket_part_id,
        tr.ticket_code,
        t.type,
        t.quantity,
        t.occurred_at,
        t.reference
      FROM part_transaction t
      JOIN part p ON p.part_id = t.part_id
      LEFT JOIN ticket_part tp ON tp.ticket_part_id = t.ticket_part_id
      LEFT JOIN ticket_ref tr ON tr.ticket_id = tp.ticket_id
      ${whereClause}
      ORDER BY t.occurred_at DESC, t.transaction_id DESC
      LIMIT $${limitIndex} OFFSET $${offsetIndex}
    `;
    const dataRes = await pool.query(dataQuery, params);

    return {
      items: dataRes.rows,
      page,
      size,
      total,
    };
  }

  /**
   * Tra cứu các linh kiện đã xuất theo mã phiếu bảo hành (UC8, FR11)
   */
  async findPartsIssuedForTicket(ticketCode, centerId) {
    const res = await pool.query(
      `SELECT
        t.transaction_id,
        t.center_id,
        t.part_id,
        p.part_code,
        p.part_name,
        p.unit_price,
        t.quantity,
        t.occurred_at,
        tr.ticket_code
       FROM part_transaction t
       JOIN part p ON p.part_id = t.part_id
       JOIN ticket_part tp ON tp.ticket_part_id = t.ticket_part_id
       JOIN ticket_ref tr ON tr.ticket_id = tp.ticket_id
       WHERE tr.ticket_code = $1 AND t.center_id = $2 AND t.type = 'XUAT'
       ORDER BY t.occurred_at ASC`,
      [ticketCode, centerId]
    );
    return res.rows;
  }
}

module.exports = new TransactionRepository();
