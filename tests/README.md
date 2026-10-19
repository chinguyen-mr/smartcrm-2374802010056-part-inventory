# Bộ kiểm thử Luồng L5 – Quản lý kho linh kiện thay thế

Tài liệu hướng dẫn và cấu trúc bộ kiểm thử tự động của luồng L5 theo tiêu chí C4 (Buổi 7 – Chuyên đề Tốt nghiệp 1).

---

## 1. Kết quả kiểm thử tổng quát

- **Tổng số test cases:** 31 tests (PASS 31/31 - 100%)
- **Test Runner:** Node.js native test runner (`node --test`), không phụ thuộc thư viện bên ngoài nặng (Jest/Mocha).
- **Lệnh chạy:**
  ```powershell
  # Từ thư mục gốc dự án:
  npm test

  # Hoặc từ thư mục backend:
  cd src/backend
  npm test
  ```

---

## 2. Phân loại và cấu trúc các ca kiểm thử

Mã nguồn kiểm thử chính thức được tổ chức tại [`src/backend/tests/`](../src/backend/tests/):

### A. Unit Tests (22 tests - Chạy độc lập với Mock Repository)
1. **`src/backend/tests/unit/issue.service.test.js` (10 tests):**
   - **Luồng đúng (Positive):** Xuất kho thành công khi phiếu bảo hành hợp lệ và tồn kho đủ (QT-09, QT-13).
   - **Giá trị biên (Boundary):** Xuất số lượng đúng bằng tồn kho hiện tại (tồn về 0 hợp lệ); Tồn sau xuất bằng đúng ngưỡng (`quantity == min_threshold`) không cảnh báo; Tồn sau xuất nhỏ hơn ngưỡng (`quantity < min_threshold`) bật cảnh báo (QT-09).
   - **Dữ liệu sai & từ chối (Negative):** Từ chối xuất khi yêu cầu vượt tồn khả dụng (`INSUFFICIENT_STOCK`); từ chối số lượng không nguyên dương; từ chối truy cập ngoài trung tâm được cấp quyền (`QT-14`); từ chối phiếu không tồn tại; từ chối phiếu khác trung tâm; từ chối phiếu sai trạng thái (allowlist).

2. **`src/backend/tests/unit/receipt.service.test.js` (6 tests):**
   - **Luồng đúng (Positive):** Nhập kho tăng tồn cho linh kiện đã có tồn; Tự động khởi tạo dòng tồn mới khi linh kiện chưa có tồn tại trung tâm.
   - **Giá trị biên (Boundary):** Nhập kho với số lượng tối thiểu = 1 thành công.
   - **Dữ liệu sai & từ chối (Negative):** Từ chối số lượng `<= 0`; từ chối linh kiện không tồn tại trong danh mục; từ chối trung tâm ngoài quyền (`QT-14`).

3. **`src/backend/tests/unit/stock.service.test.js` (6 tests):**
   - **Luồng đúng (Positive):** Thiết lập ngưỡng cảnh báo thành công bởi Quản lý trung tâm (FR8); Tra cứu danh sách dưới ngưỡng (FR7).
   - **Giá trị biên (Boundary):** Thiết lập ngưỡng = 0 hợp lệ (không cảnh báo).
   - **Dữ liệu sai & từ chối (Negative):** Kỹ thuật viên (KTV) không có quyền sửa ngưỡng (403 FORBIDDEN); Từ chối ngưỡng là số âm; Từ chối tra cứu ngoài trung tâm được phân quyền (`QT-14`).

### B. Integration Tests (9 tests - Chạy toàn trình với CSDL PostgreSQL thật)
- **`src/backend/tests/integration/api.test.js` (9 tests):**
  - Khởi động server test nội bộ và sinh JWT token xác thực cho 2 vai trò (`KTV`, `QUAN_LY_TRUNG_TAM`).
  - `API-IT-01`: GET `/api/parts` – Tra cứu danh mục và tồn kho thành công (200 OK).
  - `API-IT-02`: POST `/api/stock/receipts` – QLTT ghi nhận nhập kho thành công (201 Created).
  - `API-IT-03`: POST `/api/stock/issues` – KTV ghi nhận xuất kho theo phiếu thành công (201 Created).
  - `API-IT-04`: POST `/api/stock/issues` – Từ chối xuất cho phiếu đã đóng `DA_DONG` (409 Conflict).
  - `API-IT-05`: PUT `/api/stock/thresholds` – QLTT thiết lập ngưỡng cảnh báo thành công (200 OK).
  - `API-IT-06`: GET `/api/stock/alerts` – Lọc danh sách cảnh báo dưới ngưỡng thành công (200 OK).
  - `API-IT-07`: GET `/api/stock/transactions` – Xem sổ cái giao dịch kho (200 OK).
  - Đóng kết nối PostgreSQL và dừng server an toàn.
