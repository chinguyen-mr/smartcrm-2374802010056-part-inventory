/**
 * Lớp lỗi nghiệp vụ tuân thủ tiêu chí Buổi 7 (Slide 12, 14, 15)
 * Phân biệt rõ lỗi nghiệp vụ với lỗi hệ thống.
 * Không phụ thuộc vào req/res của Express.
 */
class AppError extends Error {
  /**
   * @param {string} errorCode - Mã nghiệp vụ định danh lỗi (ví dụ: INSUFFICIENT_STOCK, DU_LIEU_KHONG_HOP_LE)
   * @param {string} message - Thông báo lỗi mô tả sự việc và nguyên nhân
   * @param {number} statusCode - Mã trạng thái HTTP tương ứng khi routes dịch lỗi (mặc định 400)
   * @param {any} details - Chi tiết lỗi (trường sai, giá trị hiện tại, gợi ý)
   */
  constructor(errorCode, message, statusCode = 400, details = null) {
    super(message);
    this.name = "AppError";
    this.errorCode = errorCode;
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
