const AppError = require("../errors/AppError");

// Giới hạn trên của khóa BIGINT dùng an toàn trong JavaScript
const MAX_ID = Number.MAX_SAFE_INTEGER;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Kiểm tra tham số đường dẫn dạng id (ví dụ /api/parts/:id) là số nguyên dương.
 * Chặn giá trị như "abc" trước khi xuống CSDL (tránh lỗi ép kiểu -> 500, BUG-09).
 */
function parsePositiveId(value, field = "id") {
  const n = Number(value);
  if (value === undefined || value === null || String(value).trim() === "" || !Number.isInteger(n) || n <= 0 || n > MAX_ID) {
    throw new AppError("DU_LIEU_KHONG_HOP_LE", `Tham số ${field} phải là số nguyên dương.`, 400, [
      { field, reason: "Phải là số nguyên dương." },
    ]);
  }
  return n;
}

/**
 * Kiểm tra tham số ngày tùy chọn theo định dạng YYYY-MM-DD (bộ lọc from/to).
 */
function parseOptionalDate(value, field) {
  if (value === undefined || value === null || value === "") return undefined;
  const s = String(value).trim();
  const d = new Date(`${s}T00:00:00Z`);
  if (!ISO_DATE.test(s) || Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== s) {
    throw new AppError("DU_LIEU_KHONG_HOP_LE", `Tham số ${field} phải là ngày hợp lệ dạng YYYY-MM-DD.`, 400, [
      { field, reason: "Định dạng YYYY-MM-DD." },
    ]);
  }
  return s;
}

module.exports = { parsePositiveId, parseOptionalDate };
