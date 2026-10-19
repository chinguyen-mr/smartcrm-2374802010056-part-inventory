const { pool } = require("../config/db");

class PartRepository {
  async findAll({ q, page = 1, size = 20 }) {
    const offset = (page - 1) * size;
    const params = [];
    let whereClause = "";

    if (q && q.trim()) {
      params.push(`%${q.trim()}%`);
      whereClause = `WHERE part_code ILIKE $${params.length} OR part_name ILIKE $${params.length}`;
    }

    const countQuery = `SELECT COUNT(*) AS total FROM part ${whereClause}`;
    const countRes = await pool.query(countQuery, params);
    const total = parseInt(countRes.rows[0].total, 10);

    params.push(size);
    const limitParamIndex = params.length;
    params.push(offset);
    const offsetParamIndex = params.length;

    const dataQuery = `
      SELECT part_id, part_code, part_name, unit_price
      FROM part
      ${whereClause}
      ORDER BY part_id ASC
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

  async findById(partId) {
    const res = await pool.query(
      "SELECT part_id, part_code, part_name, unit_price FROM part WHERE part_id = $1",
      [partId]
    );
    return res.rows[0] || null;
  }

  async findByCode(partCode) {
    const res = await pool.query(
      "SELECT part_id, part_code, part_name, unit_price FROM part WHERE part_code = $1",
      [partCode]
    );
    return res.rows[0] || null;
  }

  async create({ part_code, part_name, unit_price }) {
    const res = await pool.query(
      `INSERT INTO part (part_code, part_name, unit_price)
       VALUES ($1, $2, $3)
       RETURNING part_id, part_code, part_name, unit_price`,
      [part_code, part_name, unit_price]
    );
    return res.rows[0];
  }

  async update(partId, { part_name, unit_price }) {
    const res = await pool.query(
      `UPDATE part
       SET part_name = COALESCE($1, part_name),
           unit_price = COALESCE($2, unit_price)
       WHERE part_id = $3
       RETURNING part_id, part_code, part_name, unit_price`,
      [part_name, unit_price, partId]
    );
    return res.rows[0] || null;
  }

  async delete(partId) {
    const res = await pool.query(
      "DELETE FROM part WHERE part_id = $1 RETURNING part_id",
      [partId]
    );
    return res.rows[0] || null;
  }
}

module.exports = new PartRepository();
