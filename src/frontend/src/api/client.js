/**
 * API Client tập trung cho Frontend React (Luồng L5)
 * Không gọi trực tiếp database, không hardcode địa chỉ backend rải rác
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

// Quản lý token xác thực trong bộ nhớ và localStorage
let currentToken = localStorage.getItem("smartcrm_token") || "";
let currentUser = null;
try {
  currentUser = JSON.parse(localStorage.getItem("smartcrm_user") || "null");
} catch (e) {
  currentUser = null;
}

export function setAuthToken(token, user) {
  currentToken = token;
  currentUser = user;
  if (token) {
    localStorage.setItem("smartcrm_token", token);
    localStorage.setItem("smartcrm_user", JSON.stringify(user));
  } else {
    localStorage.removeItem("smartcrm_token");
    localStorage.removeItem("smartcrm_user");
  }
}

export function getAuthToken() {
  return currentToken;
}

export function getCurrentUser() {
  return currentUser;
}

// Hàm gửi HTTP request chung có kèm Bearer token và xử lý lỗi chuẩn
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (currentToken) {
    headers["Authorization"] = `Bearer ${currentToken}`;
  }

  let response;
  try {
    response = await fetch(url, { ...options, headers });
  } catch (netErr) {
    throw new Error(
      "Không thể kết nối đến máy chủ Backend. Vui lòng kiểm tra lại dịch vụ (http://localhost:3000)."
    );
  }

  let data = null;
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    try {
      data = await response.json();
    } catch (e) {
      data = null;
    }
  }

  if (!response.ok) {
    const errorMsg =
      (data && data.message) ||
      (data && data.error) ||
      `Yêu cầu thất bại với mã lỗi HTTP ${response.status}`;
    const err = new Error(errorMsg);
    err.status = response.status;
    err.code = (data && data.error) || "HTTP_ERROR";
    err.details = (data && data.details) || null;
    throw err;
  }

  return data;
}

// ================================================================
// CÁC HÀM GỌI API THEO HỢP ĐỒNG API CONTRACT
// ================================================================

/**
 * Lấy token xác thực demo theo vai trò và trung tâm
 */
export async function loginDemo({ role = "KTV", center_id = 1, username = "nguyen_van_a" }) {
  const res = await request("/api/auth/token", {
    method: "POST",
    body: JSON.stringify({ role, center_id: Number(center_id), username }),
  });
  if (res && res.token) {
    setAuthToken(res.token, res.user);
  }
  return res;
}

/**
 * 1. Tra cứu danh mục linh kiện và số lượng tồn theo trung tâm (US1, UC1)
 */
export async function getParts({ center_id, q, page = 1, size = 20 }) {
  const params = new URLSearchParams();
  if (center_id) params.append("center_id", center_id);
  if (q && q.trim()) params.append("q", q.trim());
  params.append("page", page);
  params.append("size", size);

  return await request(`/api/parts?${params.toString()}`);
}

/**
 * 2. Xem danh sách linh kiện dưới ngưỡng cảnh báo (US4, UC5)
 */
export async function getStockAlerts({ center_id, page = 1, size = 20 }) {
  const params = new URLSearchParams();
  if (center_id) params.append("center_id", center_id);
  params.append("page", page);
  params.append("size", size);

  return await request(`/api/stock/alerts?${params.toString()}`);
}

/**
 * 3. Thiết lập ngưỡng cảnh báo tồn kho (US5, UC6)
 */
export async function setThreshold({ center_id, part_id, min_threshold }) {
  return await request("/api/stock/thresholds", {
    method: "PUT",
    body: JSON.stringify({
      center_id: Number(center_id),
      part_id: Number(part_id),
      min_threshold: Number(min_threshold),
    }),
  });
}

/**
 * 4. Ghi nhận nhập kho linh kiện (US3, UC3)
 */
export async function receiveStock({ center_id, part_id, quantity, reference }) {
  return await request("/api/stock/receipts", {
    method: "POST",
    body: JSON.stringify({
      center_id: Number(center_id),
      part_id: Number(part_id),
      quantity: Number(quantity),
      reference: reference ? reference.trim() : undefined,
    }),
  });
}

/**
 * 5. Ghi nhận xuất kho linh kiện cho phiếu bảo hành (US2, UC2)
 */
export async function issueStock({ center_id, part_id, ticket_code, quantity }) {
  return await request("/api/stock/issues", {
    method: "POST",
    body: JSON.stringify({
      center_id: Number(center_id),
      part_id: Number(part_id),
      ticket_code: ticket_code.trim(),
      quantity: Number(quantity),
    }),
  });
}

/**
 * 6. Xem lịch sử giao dịch biến động kho (US6, UC7)
 */
export async function getTransactions({ center_id, part_id, type, page = 1, size = 20 }) {
  const params = new URLSearchParams();
  if (center_id) params.append("center_id", center_id);
  if (part_id) params.append("part_id", part_id);
  if (type) params.append("type", type);
  params.append("page", page);
  params.append("size", size);

  return await request(`/api/stock/transactions?${params.toString()}`);
}

/**
 * 7. Xem linh kiện đã xuất theo mã phiếu bảo hành (US7, UC8)
 */
export async function getPartsIssuedForTicket({ ticket_code, center_id }) {
  const params = new URLSearchParams();
  if (center_id) params.append("center_id", center_id);

  return await request(`/api/tickets/${encodeURIComponent(ticket_code)}/parts?${params.toString()}`);
}
