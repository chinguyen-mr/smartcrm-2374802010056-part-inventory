const jwt = require("jsonwebtoken");
const AppError = require("../errors/AppError");

// Khóa ký JWT BẮT BUỘC lấy từ biến môi trường, tối thiểu 32 ký tự.
// Không có giá trị mặc định trong mã nguồn: thiếu khóa thì dừng ngay khi khởi động.
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET phải được đặt trong biến môi trường và có ít nhất 32 ký tự.");
}
const JWT_ALGORITHM = "HS256";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";

/**
 * Sinh token phục vụ kiểm thử prototype (không dùng cho production).
 * Payload chỉ chứa id, vai trò, trung tâm — không chứa dữ liệu cá nhân.
 */
function generateToken(payload, expiresIn = JWT_EXPIRES_IN) {
  return jwt.sign(payload, JWT_SECRET, { algorithm: JWT_ALGORITHM, expiresIn });
}

/**
 * Middleware kiểm tra xác thực người dùng qua JWT
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(
      new AppError(
        "UNAUTHENTICATED",
        "Yêu cầu chưa được xác thực. Vui lòng cung cấp JWT token hợp lệ.",
        401
      )
    );
  }

  const token = authHeader.split(" ")[1];
  try {
    // Chỉ định rõ thuật toán: không để thư viện chọn theo header của token (chặn "alg: none")
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: [JWT_ALGORITHM] });
    req.user = decoded; // { userId, username, role: 'KTV' | 'QUAN_LY_TRUNG_TAM', centerId }
    next();
  } catch (err) {
    return next(
      new AppError(
        "INVALID_TOKEN",
        "Token xác thực không hợp lệ hoặc đã hết hạn.",
        401
      )
    );
  }
}

/**
 * Middleware kiểm tra vai trò người dùng
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          "FORBIDDEN",
          `Người dùng với vai trò ${req.user ? req.user.role : "CHUA_XAC_THUC"} không có quyền thực hiện thao tác này.`,
          403
        )
      );
    }
    next();
  };
}

module.exports = {
  generateToken,
  requireAuth,
  requireRole,
};
