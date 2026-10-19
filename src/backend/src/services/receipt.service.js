const stockRepository = require("../repositories/stock.repository");
const transactionRepository = require("../repositories/transaction.repository");
const partRepository = require("../repositories/part.repository");
const { pool } = require("../config/db");
const AppError = require("../errors/AppError");

class ReceiptService {
  constructor(
    stockRepo = stockRepository,
    txRepo = transactionRepository,
    partRepo = partRepository,
    dbPool = pool
  ) {
    this.stockRepo = stockRepo;
    this.txRepo = txRepo;
    this.partRepo = partRepo;
    this.dbPool = dbPool;
  }

  /**
   * Nghiệp vụ Ghi nhận nhập kho linh kiện (US3, UC3, FR5)
   * Tuân thủ QT-13 (giao dịch bất biến) và QT-14 (phân quyền trung tâm)
   */
  async receiveStock({ centerId, partId, quantity, reference = null }, user = null) {
    // 1. Kiểm tra phân quyền trung tâm (QT-14)
    if (user && user.centerId && Number(user.centerId) !== Number(centerId)) {
      throw new AppError(
        "FORBIDDEN",
        `Không có quyền thao tác trên trung tâm #${centerId}. Người dùng thuộc trung tâm #${user.centerId}.`,
        403,
        { required_center_id: centerId, user_center_id: user.centerId }
      );
    }

    // 2. Kiểm tra số lượng nhập phải là số nguyên dương
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new AppError(
        "DU_LIEU_KHONG_HOP_LE",
        "Số lượng nhập kho phải là số nguyên lớn hơn 0.",
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

    // 4. Mở database transaction để đảm bảo cập nhật tồn và ghi sổ cái nguyên tử (NFR2, Slide 8)
    const client = await this.dbPool.connect();
    try {
      await client.query("BEGIN");

      // Cập nhật tồn kho (nếu chưa có dòng tồn thì khởi tạo mới theo G5)
      const existingStock = await this.stockRepo.findStockForUpdate(centerId, partId, client);
      let updatedStock;
      if (existingStock) {
        const newQty = existingStock.quantity + quantity;
        updatedStock = await this.stockRepo.updateQuantity(centerId, partId, newQty, client);
      } else {
        updatedStock = await this.stockRepo.createStock(centerId, partId, quantity, 0, client);
      }

      // Ghi một giao dịch NHAP vào sổ cái bất biến (QT-13)
      const tx = await this.txRepo.create(
        {
          centerId,
          partId,
          ticketPartId: null,
          type: "NHAP",
          quantity,
          reference: reference || "Nhập bổ sung kho",
        },
        client
      );

      await client.query("COMMIT");

      return {
        transaction_id: Number(tx.transaction_id),
        type: tx.type,
        center_id: Number(centerId),
        part_id: Number(partId),
        part_code: part.part_code,
        part_name: part.part_name,
        quantity: quantity,
        new_quantity: Number(updatedStock.quantity),
        occurred_at: tx.occurred_at,
        reference: tx.reference,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = new ReceiptService();
module.exports.ReceiptService = ReceiptService;
