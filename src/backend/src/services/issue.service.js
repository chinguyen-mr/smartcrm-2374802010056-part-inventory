const stockRepository = require("../repositories/stock.repository");
const transactionRepository = require("../repositories/transaction.repository");
const partRepository = require("../repositories/part.repository");
const ticketRepository = require("../repositories/ticket.repository");
const ticketAdapter = require("./ticket.adapter");
const { pool } = require("../config/db");
const AppError = require("../errors/AppError");

class IssueService {
  constructor(
    stockRepo = stockRepository,
    txRepo = transactionRepository,
    partRepo = partRepository,
    ticketRepo = ticketRepository,
    adapter = ticketAdapter,
    dbPool = pool
  ) {
    this.stockRepo = stockRepo;
    this.txRepo = txRepo;
    this.partRepo = partRepo;
    this.ticketRepo = ticketRepo;
    this.adapter = adapter;
    this.dbPool = dbPool;
  }

  /**
   * Nghiệp vụ Ghi nhận xuất kho linh kiện cho phiếu bảo hành (US2, UC2, FR2, FR3, FR4)
   * Tuân thủ QT-09 (không xuất vượt tồn, kiểm tra ngưỡng), QT-13 (sổ bất biến) và QT-14 (phân quyền trung tâm)
   */
  async issueStock({ centerId, partId, ticketCode, quantity }, user = null) {
    // 1. Kiểm tra phân quyền trung tâm người dùng (QT-14)
    if (user && user.centerId && Number(user.centerId) !== Number(centerId)) {
      throw new AppError(
        "FORBIDDEN",
        `Không có quyền thao tác trên trung tâm #${centerId}. Người dùng thuộc trung tâm #${user.centerId}.`,
        403,
        { required_center_id: centerId, user_center_id: user.centerId }
      );
    }

    // 2. Kiểm tra số lượng xuất phải là số nguyên dương
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new AppError(
        "DU_LIEU_KHONG_HOP_LE",
        "Số lượng xuất kho phải là số nguyên lớn hơn 0.",
        400,
        { field: "quantity", value: quantity }
      );
    }

    // 3. Kiểm tra linh kiện có tồn tại trong danh mục không
    const part = await this.partRepo.findById(partId);
    if (!part) {
      throw new AppError(
        "PART_NOT_FOUND",
        `Linh kiện với mã #${partId} không tồn tại trong danh mục.`,
        404,
        { part_id: partId }
      );
    }

    // 4. Mở database transaction nguyên tử
    const client = await this.dbPool.connect();
    try {
      await client.query("BEGIN");

      // 4.1. Xác minh phiếu bảo hành qua TicketAdapter (FR4)
      const ticket = await this.adapter.verifyTicketForIssue(ticketCode, centerId, client);

      // 4.2. Khóa dòng tồn kho bằng SELECT ... FOR UPDATE (NFR3, Slide 8 - xử lý tranh chấp đồng thời)
      const stock = await this.stockRepo.findStockForUpdate(centerId, partId, client);
      const currentQuantity = stock ? Number(stock.quantity) : 0;
      const minThreshold = stock ? Number(stock.min_threshold) : 0;

      // 4.3. Kiểm tra quy tắc QT-09: Không xuất vượt tồn kho
      if (!stock || currentQuantity < quantity) {
        throw new AppError(
          "INSUFFICIENT_STOCK",
          `Số lượng tồn kho không đủ để xuất. Tồn hiện tại: ${currentQuantity}, yêu cầu xuất: ${quantity}.`,
          409,
          {
            part_id: partId,
            part_code: part.part_code,
            available_quantity: currentQuantity,
            requested_quantity: quantity,
          }
        );
      }

      // 4.4. Giảm số lượng tồn kho
      const newQuantity = currentQuantity - quantity;
      await this.stockRepo.updateQuantity(centerId, partId, newQuantity, client);

      // 4.5. Tạo bản ghi liên kết phiếu - linh kiện (ticket_part)
      const ticketPart = await this.ticketRepo.createTicketPart(
        {
          ticketId: ticket.ticket_id,
          partId: partId,
          transactionId: null,
        },
        client
      );

      // 4.6. Ghi giao dịch XUAT vào sổ cái bất biến (QT-13)
      const tx = await this.txRepo.create(
        {
          centerId,
          partId,
          ticketPartId: ticketPart.ticket_part_id,
          type: "XUAT",
          quantity,
          reference: ticketCode,
        },
        client
      );

      // 4.7. Cập nhật transaction_id cho ticket_part (giải quyết FK vòng)
      await this.ticketRepo.updateTransactionId(ticketPart.ticket_part_id, tx.transaction_id, client);

      await client.query("COMMIT");

      // 4.8. Kiểm tra trạng thái cảnh báo sau khi xuất (QT-09: chỉ cảnh báo khi tồn < ngưỡng và ngưỡng > 0)
      const isBelowThreshold = newQuantity < minThreshold && minThreshold > 0;

      return {
        transaction_id: Number(tx.transaction_id),
        type: "XUAT",
        center_id: Number(centerId),
        part_id: Number(partId),
        part_code: part.part_code,
        part_name: part.part_name,
        ticket_code: ticketCode,
        ticket_id: Number(ticket.ticket_id),
        quantity: quantity,
        new_quantity: newQuantity,
        min_threshold: minThreshold,
        is_below_threshold: isBelowThreshold,
        occurred_at: tx.occurred_at,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = new IssueService();
module.exports.IssueService = IssueService;
