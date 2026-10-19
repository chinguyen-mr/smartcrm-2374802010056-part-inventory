const { pool } = require("../config/db");

class TicketRepository {
  /**
   * Tra cứu thông tin tham chiếu phiếu bảo hành (mô phỏng hệ thống ngoài)
   */
  async findByCode(ticketCode, client = null) {
    const runner = client || pool;
    const res = await runner.query(
      `SELECT ticket_id, center_id, ticket_code, status
       FROM ticket_ref
       WHERE ticket_code = $1`,
      [ticketCode]
    );
    return res.rows[0] || null;
  }

  /**
   * Ghi nhận liên kết phiếu – linh kiện trong transaction
   */
  async createTicketPart({ ticketId, partId, transactionId = null }, client) {
    const res = await client.query(
      `INSERT INTO ticket_part (ticket_id, part_id, transaction_id, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING ticket_part_id, ticket_id, part_id, transaction_id, created_at`,
      [ticketId, partId, transactionId]
    );
    return res.rows[0];
  }

  /**
   * Cập nhật ngược lại transaction_id sau khi đã tạo xong bản ghi part_transaction
   */
  async updateTransactionId(ticketPartId, transactionId, client) {
    const res = await client.query(
      `UPDATE ticket_part
       SET transaction_id = $1
       WHERE ticket_part_id = $2
       RETURNING ticket_part_id, ticket_id, part_id, transaction_id`,
      [transactionId, ticketPartId]
    );
    return res.rows[0];
  }
}

module.exports = new TicketRepository();
