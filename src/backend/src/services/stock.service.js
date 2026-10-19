const stockRepository = require("../repositories/stock.repository");
const transactionRepository = require("../repositories/transaction.repository");
const partRepository = require("../repositories/part.repository");
const AppError = require("../errors/AppError");

class StockService {
  constructor(
    stockRepo = stockRepository,
    txRepo = transactionRepository,
    partRepo = partRepository
  ) {
    this.stockRepo = stockRepo;
    this.txRepo = txRepo;
    this.partRepo = partRepo;
  }

  /**
   * Tra cứu tồn kho theo trung tâm (US1, UC1, FR1)
   */
  async getPartsWithStock({ centerId, q, belowThresholdOnly = false, page = 1, size = 20 }, user = null) {
    // Kiểm tra phân quyền trung tâm (QT-14)
    if (user && user.centerId && Number(user.centerId) !== Number(centerId)) {
      throw new AppError(
        "FORBIDDEN",
        `Không có quyền truy cập dữ liệu của trung tâm #${centerId}. Người dùng thuộc trung tâm #${user.centerId}.`,
        403,
        { required_center_id: centerId, user_center_id: user.centerId }
      );
    }

    return await this.stockRepo.findPartsWithStock({
      centerId,
      q,
      belowThresholdOnly,
      page,
      size,
    });
  }

  /**
   * Xem danh sách linh kiện dưới ngưỡng cảnh báo (US4, UC5, FR6, FR7)
   */
  async getStockAlerts({ centerId, page = 1, size = 20 }, user = null) {
    return await this.getPartsWithStock(
      {
        centerId,
        belowThresholdOnly: true,
        page,
        size,
      },
      user
    );
  }

  /**
   * Thiết lập ngưỡng cảnh báo cho cặp trung tâm/linh kiện (US5, UC6, FR8)
   */
  async setThreshold({ centerId, partId, minThreshold }, user = null) {
    // 1. Phân quyền trung tâm (QT-14)
    if (user && user.centerId && Number(user.centerId) !== Number(centerId)) {
      throw new AppError(
        "FORBIDDEN",
        `Không có quyền thao tác trên trung tâm #${centerId}.`,
        403
      );
    }

    // 2. Quyền QLTT
    if (user && user.role && user.role !== "QUAN_LY_TRUNG_TAM") {
      throw new AppError(
        "FORBIDDEN",
        "Chỉ Quản lý trung tâm mới có quyền thiết lập ngưỡng cảnh báo tồn kho.",
        403
      );
    }

    // 3. Kiểm tra tính hợp lệ của ngưỡng
    if (!Number.isInteger(minThreshold) || minThreshold < 0) {
      throw new AppError(
        "DU_LIEU_KHONG_HOP_LE",
        "Ngưỡng cảnh báo phải là số nguyên không âm (>= 0).",
        400,
        { field: "min_threshold", value: minThreshold }
      );
    }

    // 4. Kiểm tra linh kiện tồn tại
    const part = await this.partRepo.findById(partId);
    if (!part) {
      throw new AppError(
        "PART_NOT_FOUND",
        `Linh kiện với mã #${partId} không tồn tại.`,
        404
      );
    }

    const updated = await this.stockRepo.setThreshold(centerId, partId, minThreshold);
    const quantity = Number(updated.quantity);
    const isBelowThreshold = quantity < minThreshold && minThreshold > 0;

    return {
      center_id: Number(centerId),
      part_id: Number(partId),
      part_code: part.part_code,
      part_name: part.part_name,
      quantity,
      min_threshold: Number(updated.min_threshold),
      is_below_threshold: isBelowThreshold,
      updated_at: updated.updated_at,
    };
  }

  /**
   * Tra cứu lịch sử giao dịch biến động kho (US6, UC7, FR10)
   */
  async getTransactions({ centerId, partId, type, from, to, page = 1, size = 20 }, user = null) {
    if (user && user.centerId && Number(user.centerId) !== Number(centerId)) {
      throw new AppError(
        "FORBIDDEN",
        `Không có quyền tra cứu lịch sử của trung tâm #${centerId}.`,
        403
      );
    }

    return await this.txRepo.findAll({
      centerId,
      partId,
      type,
      from,
      to,
      page,
      size,
    });
  }

  /**
   * Xem danh sách linh kiện đã xuất cho một phiếu bảo hành (US7, UC8, FR11)
   */
  async getPartsIssuedForTicket({ ticketCode, centerId }, user = null) {
    if (user && user.centerId && Number(user.centerId) !== Number(centerId)) {
      throw new AppError(
        "FORBIDDEN",
        `Không có quyền tra cứu thông tin phiếu của trung tâm #${centerId}.`,
        403
      );
    }

    const items = await this.txRepo.findPartsIssuedForTicket(ticketCode, centerId);
    return {
      ticket_code: ticketCode,
      center_id: Number(centerId),
      total_items: items.length,
      items,
    };
  }
}

module.exports = new StockService();
module.exports.StockService = StockService;
