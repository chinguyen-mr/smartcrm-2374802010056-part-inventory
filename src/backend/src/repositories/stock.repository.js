const { pool } = require("../config/db");

class StockRepository {
  /**
   * Tra cứu danh sách linh kiện kèm số lượng tồn và ngưỡng tại trung tâm
   * Nếu chưa có dòng trong part_stock, số lượng hiển thị là 0 theo đúng SRS Mục 4 (US1)
   */
  async findPartsWithStock({ centerId, q, belowThresholdOnly = false, page = 1, size = 20 }) {
    const offset = (page - 1) * size;
    const params = [centerId];
    let whereConditions = [];

    if (q && q.trim()) {
      params.push(`%${q.trim()}%`);
      whereConditions.push(`(p.part_code ILIKE $${params.length} OR p.part_name ILIKE $${params.length})`);
    }

    if (belowThresholdOnly) {
      // QT-09: Chỉ cảnh báo khi quantity < min_threshold và min_threshold > 0 (bằng ngưỡng KHÔNG cảnh báo)
      whereConditions.push(`COALESCE(ps.quantity, 0) < COALESCE(ps.min_threshold, 0) AND COALESCE(ps.min_threshold, 0) > 0`);
    }

    const whereClause = whereConditions.length > 0 ? `AND ${whereConditions.join(" AND ")}` : "";

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM part p
      LEFT JOIN part_stock ps ON ps.part_id = p.part_id AND ps.center_id = $1
      WHERE 1=1 ${whereClause}
    `;
    const countRes = await pool.query(countQuery, params);
    const total = parseInt(countRes.rows[0].total, 10);

    params.push(size);
    const limitParamIndex = params.length;
    params.push(offset);
    const offsetParamIndex = params.length;

    const dataQuery = `
      SELECT
        p.part_id,
        p.part_code,
        p.part_name,
        p.unit_price,
        $1::BIGINT AS center_id,
        COALESCE(ps.quantity, 0) AS quantity,
        COALESCE(ps.min_threshold, 0) AS min_threshold,
        (COALESCE(ps.quantity, 0) < COALESCE(ps.min_threshold, 0) AND COALESCE(ps.min_threshold, 0) > 0) AS is_below_threshold,
        ps.updated_at
      FROM part p
      LEFT JOIN part_stock ps ON ps.part_id = p.part_id AND ps.center_id = $1
      WHERE 1=1 ${whereClause}
      ORDER BY p.part_id ASC
      LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}
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
   * Tra cứu dòng tồn kho của cặp (centerId, partId)
   */
  async findStockByCenterAndPart(centerId, partId, client = null) {
    const runner = client || pool;
    const res = await runner.query(
      `SELECT center_id, part_id, quantity, min_threshold, updated_at
       FROM part_stock
       WHERE center_id = $1 AND part_id = $2`,
      [centerId, partId]
    );
    return res.rows[0] || null;
  }

  /**
   * Khóa dòng tồn kho bằng SELECT ... FOR UPDATE để xử lý đồng thời (NFR3, QT-09)
   */
  async findStockForUpdate(centerId, partId, client) {
    const res = await client.query(
      `SELECT center_id, part_id, quantity, min_threshold, updated_at
       FROM part_stock
       WHERE center_id = $1 AND part_id = $2
       FOR UPDATE`,
      [centerId, partId]
    );
    return res.rows[0] || null;
  }

  /**
   * Tăng hoặc giảm tồn kho trong transaction
   */
  async updateQuantity(centerId, partId, newQuantity, client) {
    const res = await client.query(
      `UPDATE part_stock
       SET quantity = $1, updated_at = NOW()
       WHERE center_id = $2 AND part_id = $3
       RETURNING center_id, part_id, quantity, min_threshold, updated_at`,
      [newQuantity, centerId, partId]
    );
    return res.rows[0];
  }

  /**
   * Khởi tạo dòng tồn kho nếu chưa có
   */
  async createStock(centerId, partId, quantity, minThreshold, client) {
    const runner = client || pool;
    const res = await runner.query(
      `INSERT INTO part_stock (center_id, part_id, quantity, min_threshold, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (center_id, part_id) DO UPDATE
       SET quantity = part_stock.quantity + EXCLUDED.quantity,
           updated_at = NOW()
       RETURNING center_id, part_id, quantity, min_threshold, updated_at`,
      [centerId, partId, quantity, minThreshold]
    );
    return res.rows[0];
  }

  /**
   * Thiết lập ngưỡng cảnh báo (min_threshold)
   */
  async setThreshold(centerId, partId, minThreshold) {
    const res = await pool.query(
      `INSERT INTO part_stock (center_id, part_id, quantity, min_threshold, updated_at)
       VALUES ($1, $2, 0, $3, NOW())
       ON CONFLICT (center_id, part_id) DO UPDATE
       SET min_threshold = EXCLUDED.min_threshold,
           updated_at = NOW()
       RETURNING center_id, part_id, quantity, min_threshold, updated_at`,
      [centerId, partId, minThreshold]
    );
    return res.rows[0];
  }
}

module.exports = new StockRepository();
