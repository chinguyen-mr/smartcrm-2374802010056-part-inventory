const AppError = require("../errors/AppError");

/**
 * Middleware xử lý lỗi tập trung theo đúng tiêu chuẩn Buổi 7 (Slide 14, 15)
 * Tiêu chí C7: dữ liệu sai bị từ chối với thông báo rõ ràng, không sập app, không trả lỗi thô DB.
 */
function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    let fields = {};
    if (Array.isArray(err.details)) {
      for (const item of err.details) {
        if (item && item.field) {
          fields[item.field] = item.reason || item.message || "Không hợp lệ";
        }
      }
    } else if (err.details && typeof err.details === "object") {
      fields = err.details;
    }

    return res.status(err.statusCode).json({
      error: err.errorCode,
      message: err.message,
      fields,
      details: err.details || undefined,
    });
  }

  // Lỗi do JSON parse body sai định dạng
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      error: "DU_LIEU_KHONG_HOP_LE",
      message: "Định dạng JSON gửi lên không hợp lệ.",
    });
  }

  // Lỗi hệ thống ngoài dự kiến: ghi log điều tra, không lộ chi tiết kỹ thuật ra client
  console.error("[INTERNAL_SYSTEM_ERROR]", {
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method,
    message: err.message,
    stack: err.stack,
  });

  return res.status(500).json({
    error: "INTERNAL_ERROR",
    message: "Hệ thống gặp sự cố ngoài dự kiến. Vui lòng liên hệ quản trị viên hoặc thử lại sau.",
  });
}

module.exports = errorHandler;
