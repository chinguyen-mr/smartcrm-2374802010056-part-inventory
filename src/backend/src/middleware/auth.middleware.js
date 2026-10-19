const jwt = require("jsonwebtoken");
const AppError = require("../errors/AppError");

const JWT_SECRET = process.env.JWT_SECRET || "smartcrm_jwt_secret_dev_2026";

/**
 * Sinh token phục vụ kiểm thử prototype (không dùng cho production)
 */
function generateToken(payload, expiresIn = "24h") {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
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
    const decoded = jwt.verify(token, JWT_SECRET);
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
