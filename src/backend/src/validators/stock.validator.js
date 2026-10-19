const AppError = require("../errors/AppError");

class StockValidator {
  /**
   * Tầng 1: Kiểm định dạng dữ liệu đầu vào cho thao tác Nhập kho (US3, UC3)
   */
  validateReceiptInput(data) {
    const { center_id, part_id, quantity, reference } = data;
    const errors = [];

    const parsedCenterId = Number(center_id);
    if (!center_id || isNaN(parsedCenterId) || !Number.isInteger(parsedCenterId) || parsedCenterId <= 0) {
      errors.push({ field: "center_id", reason: "Mã trung tâm phải là số nguyên dương hợp lệ." });
    }

    const parsedPartId = Number(part_id);
    if (!part_id || isNaN(parsedPartId) || !Number.isInteger(parsedPartId) || parsedPartId <= 0) {
      errors.push({ field: "part_id", reason: "Mã linh kiện phải là số nguyên dương hợp lệ." });
    }

    const parsedQuantity = Number(quantity);
    if (quantity === undefined || quantity === null || isNaN(parsedQuantity) || !Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
      errors.push({ field: "quantity", reason: "Số lượng nhập phải là số nguyên lớn hơn 0." });
    }

    if (reference && typeof reference === "string" && reference.length > 80) {
      errors.push({ field: "reference", reason: "Mã tham chiếu hoặc số chứng từ không được vượt quá 80 ký tự." });
    }

    if (errors.length > 0) {
      throw new AppError(
        "DU_LIEU_KHONG_HOP_LE",
        "Dữ liệu nhập kho không đúng định dạng.",
        400,
        errors
      );
    }

    return {
      centerId: parsedCenterId,
      partId: parsedPartId,
      quantity: parsedQuantity,
      reference: reference ? String(reference).trim() : null,
    };
  }

  /**
   * Tầng 1: Kiểm định dạng dữ liệu đầu vào cho thao tác Xuất kho (US2, UC2)
   */
  validateIssueInput(data) {
    const { center_id, part_id, ticket_code, quantity } = data;
    const errors = [];

    const parsedCenterId = Number(center_id);
    if (!center_id || isNaN(parsedCenterId) || !Number.isInteger(parsedCenterId) || parsedCenterId <= 0) {
      errors.push({ field: "center_id", reason: "Mã trung tâm phải là số nguyên dương hợp lệ." });
    }

    const parsedPartId = Number(part_id);
    if (!part_id || isNaN(parsedPartId) || !Number.isInteger(parsedPartId) || parsedPartId <= 0) {
      errors.push({ field: "part_id", reason: "Mã linh kiện phải là số nguyên dương hợp lệ." });
    }

    if (!ticket_code || typeof ticket_code !== "string" || !ticket_code.trim()) {
      errors.push({ field: "ticket_code", reason: "Mã phiếu bảo hành là bắt buộc." });
    }

    const parsedQuantity = Number(quantity);
    if (quantity === undefined || quantity === null || isNaN(parsedQuantity) || !Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
      errors.push({ field: "quantity", reason: "Số lượng xuất phải là số nguyên lớn hơn 0." });
    }

    if (errors.length > 0) {
      throw new AppError(
        "DU_LIEU_KHONG_HOP_LE",
        "Dữ liệu xuất kho không đúng định dạng.",
        400,
        errors
      );
    }

    return {
      centerId: parsedCenterId,
      partId: parsedPartId,
      ticketCode: ticket_code.trim(),
      quantity: parsedQuantity,
    };
  }

  /**
   * Tầng 1: Kiểm tra cấu hình ngưỡng cảnh báo (min_threshold)
   */
  validateThresholdInput(data) {
    const { center_id, part_id, min_threshold } = data;
    const errors = [];

    const parsedCenterId = Number(center_id);
    if (!center_id || isNaN(parsedCenterId) || !Number.isInteger(parsedCenterId) || parsedCenterId <= 0) {
      errors.push({ field: "center_id", reason: "Mã trung tâm phải là số nguyên dương hợp lệ." });
    }

    const parsedPartId = Number(part_id);
    if (!part_id || isNaN(parsedPartId) || !Number.isInteger(parsedPartId) || parsedPartId <= 0) {
      errors.push({ field: "part_id", reason: "Mã linh kiện phải là số nguyên dương hợp lệ." });
    }

    const parsedThreshold = Number(min_threshold);
    if (min_threshold === undefined || min_threshold === null || isNaN(parsedThreshold) || !Number.isInteger(parsedThreshold) || parsedThreshold < 0) {
      errors.push({ field: "min_threshold", reason: "Ngưỡng cảnh báo phải là số nguyên không âm (>= 0)." });
    }

    if (errors.length > 0) {
      throw new AppError(
        "DU_LIEU_KHONG_HOP_LE",
        "Dữ liệu cấu hình ngưỡng cảnh báo không hợp lệ.",
        400,
        errors
      );
    }

    return {
      centerId: parsedCenterId,
      partId: parsedPartId,
      minThreshold: parsedThreshold,
    };
  }
}

module.exports = new StockValidator();
