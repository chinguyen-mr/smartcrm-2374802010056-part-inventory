const partRepository = require("../repositories/part.repository");
const { pool } = require("../config/db");
const AppError = require("../errors/AppError");

class PartService {
  constructor(partRepo = partRepository, dbPool = pool) {
    this.partRepo = partRepo;
    this.dbPool = dbPool;
  }

  async getAllParts({ q, page = 1, size = 20 }) {
    return await this.partRepo.findAll({ q, page, size });
  }

  async getPartById(partId) {
    const part = await this.partRepo.findById(partId);
    if (!part) {
      throw new AppError(
        "PART_NOT_FOUND",
        `Không tìm thấy linh kiện với mã #${partId}.`,
        404,
        { part_id: partId }
      );
    }
    return part;
  }

  async createPart({ part_code, part_name, unit_price }, user = null) {
    if (user && user.role !== "QUAN_LY_TRUNG_TAM") {
      throw new AppError(
        "FORBIDDEN",
        "Chỉ Quản lý trung tâm mới có quyền thêm mới danh mục linh kiện.",
        403
      );
    }

    if (!part_code || typeof part_code !== "string" || !part_code.trim()) {
      throw new AppError("DU_LIEU_KHONG_HOP_LE", "Mã linh kiện là bắt buộc.", 400, { field: "part_code" });
    }

    if (!part_name || typeof part_name !== "string" || !part_name.trim()) {
      throw new AppError("DU_LIEU_KHONG_HOP_LE", "Tên linh kiện là bắt buộc.", 400, { field: "part_name" });
    }

    const price = Number(unit_price);
    if (isNaN(price) || price < 0) {
      throw new AppError("DU_LIEU_KHONG_HOP_LE", "Đơn giá phải là số không âm.", 400, { field: "unit_price" });
    }

    const existing = await this.partRepo.findByCode(part_code.trim());
    if (existing) {
      throw new AppError(
        "DUPLICATE_PART_CODE",
        `Mã linh kiện '${part_code}' đã tồn tại trong hệ thống.`,
        409,
        { part_code }
      );
    }

    return await this.partRepo.create({
      part_code: part_code.trim(),
      part_name: part_name.trim(),
      unit_price: price,
    });
  }

  async updatePart(partId, { part_name, unit_price }, user = null) {
    if (user && user.role !== "QUAN_LY_TRUNG_TAM") {
      throw new AppError(
        "FORBIDDEN",
        "Chỉ Quản lý trung tâm mới có quyền cập nhật danh mục linh kiện.",
        403
      );
    }

    await this.getPartById(partId);

    const price = unit_price !== undefined ? Number(unit_price) : undefined;
    if (price !== undefined && (isNaN(price) || price < 0)) {
      throw new AppError("DU_LIEU_KHONG_HOP_LE", "Đơn giá phải là số không âm.", 400, { field: "unit_price" });
    }

    return await this.partRepo.update(partId, {
      part_name: part_name ? String(part_name).trim() : undefined,
      unit_price: price,
    });
  }

  async deletePart(partId, user = null) {
    if (user && user.role !== "QUAN_LY_TRUNG_TAM") {
      throw new AppError(
        "FORBIDDEN",
        "Chỉ Quản lý trung tâm mới có quyền xóa linh kiện.",
        403
      );
    }

    await this.getPartById(partId);

    // Kiểm tra ràng buộc toàn vẹn: nếu đã có giao dịch kho thì không cho xóa vật lý
    const txCheck = await this.dbPool.query(
      "SELECT COUNT(*) AS count FROM part_transaction WHERE part_id = $1",
      [partId]
    );
    if (parseInt(txCheck.rows[0].count, 10) > 0) {
      throw new AppError(
        "CANNOT_DELETE_REFERENCED_PART",
        "Không thể xóa linh kiện đã phát sinh giao dịch nhập/xuất trong lịch sử để bảo toàn dữ liệu.",
        409,
        { part_id: partId, transaction_count: txCheck.rows[0].count }
      );
    }

    return await this.partRepo.delete(partId);
  }
}

module.exports = new PartService();
module.exports.PartService = PartService;
