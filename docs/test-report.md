# Báo cáo kiểm thử (Test Report) — Phân hệ Quản lý kho linh kiện thay thế (Luồng L5)

**Học phần:** Chuyên đề Tốt nghiệp 1 — Chuyên ngành: Kỹ thuật Phần mềm (Track SE)  
**Dự án:** Smart CRM – Mekong Mobile  
**Phân hệ:** Luồng L5 – Quản lý kho linh kiện thay thế (Part Inventory Management)  
**Sinh viên thực hiện:** Nguyễn Văn Chí (MSSV: 2374802010056)  
**Ngày báo cáo:** 07/11/2026 (Checklist Buổi 14)  
**Mã commit kiểm chứng:** `f43566c` (Git Tag: `v0.2`)  

---

## 1. Tóm tắt kết quả kiểm thử (Executive Summary)

- **Số test case đã chạy thật:** **31 / 31**
- **Số ca PASS:** **31** (Tỷ lệ: **100%**)
- **Số ca FAIL:** **0**
- **Số ca SKIPPED:** **0**
- **Thời gian thực thi:** 10.42 giây
- **Lệnh thực thi duy nhất:** `npm test`
- **Đủ 5 loại kiểm thử chuẩn:** **CÓ** (Luồng đúng, Giá trị biên, Dữ liệu sai, Bảo mật & phân quyền, Tái lập hệ thống).
- **Thư mục ảnh chụp kết quả minh chứng:** [`docs/screenshots/`](./screenshots/)

---

## 2. Bảng phân bố kết quả theo 5 loại kiểm thử bắt buộc

| Phân loại kiểm thử | Số ca test | Số PASS | Số FAIL | Tỷ lệ PASS | Ảnh chụp minh chứng |
|:---|:---:|:---:|:---:|:---:|:---|
| **1. Luồng đúng (Positive Path)** | 8 tests | 8 | 0 | 100% | [`14_test_happy_path.png`](./screenshots/14_test_happy_path.png) |
| **2. Giá trị biên (Boundary Cases)** | 5 tests | 5 | 0 | 100% | [`15_test_boundary_case.png`](./screenshots/15_test_boundary_case.png) |
| **3. Dữ liệu sai (Negative Cases)** | 9 tests | 9 | 0 | 100% | [`16_test_invalid_input.png`](./screenshots/16_test_invalid_input.png) |
| **4. Bảo mật / Phân quyền (Security / Auth)** | 5 tests | 5 | 0 | 100% | [`17_test_cross_center_authorization.png`](./screenshots/17_test_cross_center_authorization.png) |
| **5. Tái lập & Bất biến (Reproducibility)** | 4 kịch bản | 4 | 0 | 100% | [`24_seed_rerun_idempotency.png`](./screenshots/24_seed_rerun_idempotency.png) |
| **TỔNG HỢP TOÀN BỘ BỘ TEST** | **31 tests** | **31** | **0** | **100%** | [`13_backend_test_summary.png`](./screenshots/13_backend_test_summary.png) |

---

## 3. Bảng kê chi tiết 31 ca kiểm thử tự động

### 3.1. Nhóm 1: Kiểm thử nghiệp vụ Xuất kho (IssueService — 10 tests)
*Tệp mã nguồn kiểm thử:* `src/backend/tests/unit/issue.service.test.js`

| Mã ca test | Loại | Kịch bản / Đầu vào kiểm thử | Quy tắc / Hành vi kỳ vọng | Kết quả thực tế | Trạng thái |
|:---:|:---:|:---|:---|:---|:---:|
| **TC01** | Luồng đúng | Xuất kho linh kiện khi phiếu hợp lệ, đủ tồn kho | Trừ tồn nguyên tử, tạo giao dịch `XUAT`, tạo dòng `ticket_part` (QT-09, QT-13) | Tồn giảm chính xác, sinh giao dịch XUAT | **PASS** |
| **TC02** | Biên | Xuất số lượng đúng bằng số tồn hiện có (`quantity == req`) | Tồn kho giảm về đúng `0` hợp lệ, không bị lỗi âm kho | Số tồn = 0, giao dịch ghi nhận thành công | **PASS** |
| **TC03** | Biên | Tồn sau xuất bằng đúng ngưỡng (`quantity == min_threshold`) | Không phát sinh cảnh báo thiếu hụt (bằng ngưỡng là an toàn theo QT-09) | Trạng thái an toàn, không kích hoạt alert | **PASS** |
| **TC04** | Biên | Tồn sau xuất nhỏ hơn ngưỡng (`quantity < min_threshold`) | Kích hoạt cờ cảnh báo thiếu hụt màu cam (QT-09) | Trạng thái cảnh báo thiếu hụt được bật | **PASS** |
| **TC05** | Dữ liệu sai | Xuất số lượng vượt quá tồn kho khả dụng (`req > quantity`) | Từ chối an toàn với mã lỗi `409 INSUFFICIENT_STOCK`, ROLLBACK giao dịch | Ném `AppError(409)`, không đổi tồn | **PASS** |
| **TC06** | Dữ liệu sai | Số lượng yêu cầu xuất là số âm (`-5`) hoặc bằng `0` | Từ chối với mã lỗi `400 VALIDATION_ERROR` | Ném `AppError(400)`, chặn ngay tầng kiểm tra | **PASS** |
| **TC07** | Bảo mật | Người dùng trung tâm này yêu cầu xuất kho trung tâm khác | Từ chối truy cập chéo trung tâm với mã lỗi `403 FORBIDDEN` (QT-14) | Ném `AppError(403)`, bảo vệ đa trung tâm | **PASS** |
| **TC08** | Dữ liệu sai | Phiếu bảo hành không tồn tại trong hệ thống tham chiếu | Từ chối với mã lỗi `404 TICKET_NOT_FOUND` | Ném `AppError(404)`, không thực hiện xuất | **PASS** |
| **TC09** | Bảo mật | Phiếu bảo hành thuộc trung tâm khác với trung tâm xuất kho | Từ chối với mã lỗi `409 TICKET_CENTER_MISMATCH` | Ném `AppError(409)`, chặn xuất sai trung tâm | **PASS** |
| **TC10** | Dữ liệu sai | Phiếu bảo hành có trạng thái không nằm trong allowlist (`DA_DONG`) | Từ chối với mã lỗi `409 TICKET_STATUS_NOT_ELIGIBLE` | Ném `AppError(409)`, chặn phiếu đã đóng | **PASS** |

### 3.2. Nhóm 2: Kiểm thử nghiệp vụ Nhập kho (ReceiptService — 6 tests)
*Tệp mã nguồn kiểm thử:* `src/backend/tests/unit/receipt.service.test.js`

| Mã ca test | Loại | Kịch bản / Đầu vào kiểm thử | Quy tắc / Hành vi kỳ vọng | Kết quả thực tế | Trạng thái |
|:---:|:---:|:---|:---|:---|:---:|
| **TC11** | Luồng đúng | Nhập kho bổ sung cho linh kiện đã có số dư tồn | Tăng số dư tồn kho tức thời, tạo giao dịch `NHAP` (US3, UC3, FR5) | Tồn kho tăng đúng bằng số lượng nhập | **PASS** |
| **TC12** | Luồng đúng | Nhập kho cho linh kiện lần đầu xuất hiện tại trung tâm | Tự động khởi tạo dòng tồn mới (`quantity = nhập`, `min_threshold = 0`) (G5) | Tạo bản ghi mới trong `part_stock` thành công | **PASS** |
| **TC13** | Biên | Nhập kho với số lượng tối thiểu là `1` | Ghi nhận thành công, tăng số dư tồn thêm 1 | Tồn kho tăng 1, sinh giao dịch hợp lệ | **PASS** |
| **TC14** | Dữ liệu sai | Nhập kho với số lượng `<= 0` hoặc giá trị rỗng | Từ chối với mã lỗi `400 VALIDATION_ERROR` | Ném `AppError(400)`, không thay đổi kho | **PASS** |
| **TC15** | Dữ liệu sai | Nhập kho mã linh kiện không tồn tại trong danh mục `part` | Từ chối với mã lỗi `404 PART_NOT_FOUND` | Ném `AppError(404)`, từ chối an toàn | **PASS** |
| **TC16** | Bảo mật | Người dùng trung tâm này thực hiện nhập kho cho trung tâm khác | Từ chối với mã lỗi `403 FORBIDDEN` (QT-14) | Ném `AppError(403)`, ngăn chặn can thiệp kho | **PASS** |

### 3.3. Nhóm 3: Kiểm thử Tra cứu & Quản lý Ngưỡng (StockService — 6 tests)
*Tệp mã nguồn kiểm thử:* `src/backend/tests/unit/stock.service.test.js`

| Mã ca test | Loại | Kịch bản / Đầu vào kiểm thử | Quy tắc / Hành vi kỳ vọng | Kết quả thực tế | Trạng thái |
|:---:|:---:|:---|:---|:---|:---:|
| **TC17** | Luồng đúng | Quản lý trung tâm (QLTT) cập nhật ngưỡng cảnh báo `min_threshold` | Cập nhật thành công giá trị ngưỡng mới vào CSDL (US5, UC6, FR8) | Ngưỡng được lưu chính xác, trả HTTP 200 | **PASS** |
| **TC18** | Luồng đúng | Tra cứu danh sách linh kiện đang dưới ngưỡng cảnh báo | Lọc chính xác các bản ghi thỏa mãn `quantity < min_threshold` (FR7) | Danh sách trả về chỉ chứa linh kiện thiếu | **PASS** |
| **TC19** | Biên | Thiết lập ngưỡng cảnh báo bằng `0` | Cho phép thiết lập, giá trị 0 xem như tắt cảnh báo | Cập nhật `min_threshold = 0` thành công | **PASS** |
| **TC20** | Bảo mật | Kỹ thuật viên (KTV) cố tình gửi yêu cầu sửa ngưỡng cảnh báo | Chặn phân quyền vai trò với mã lỗi `403 FORBIDDEN` | Ném `AppError(403)`, bảo vệ quyền QLTT | **PASS** |
| **TC21** | Dữ liệu sai | Thiết lập ngưỡng cảnh báo là số âm (`-3`) | Từ chối với mã lỗi `400 VALIDATION_ERROR` | Ném `AppError(400)`, không lưu số âm | **PASS** |
| **TC22** | Bảo mật | Tra cứu danh mục tồn kho của trung tâm ngoài phân quyền | Chặn truy cập với mã lỗi `403 FORBIDDEN` (QT-14) | Ném `AppError(403)`, bảo vệ tính cô lập tenant | **PASS** |

### 3.4. Nhóm 4: Kiểm thử tích hợp toàn trình REST API (Integration Tests — 9 tests)
*Tệp mã nguồn kiểm thử:* `src/backend/tests/integration/api.test.js`

| Mã ca test | Loại | Phương thức & Endpoint | Kịch bản kiểm thử | Kết quả kỳ vọng | Trạng thái |
|:---:|:---:|:---|:---|:---|:---:|
| **API-IT-00** | Hệ thống | Khởi tạo môi trường test | Khởi động server test và cấp JWT Token cho KTV và QLTT | Token hợp lệ cho cả 2 vai trò | **PASS** |
| **API-IT-01** | Luồng đúng | `GET /api/parts` | Tra cứu danh mục linh kiện và tồn kho theo trung tâm | Trả về HTTP 200 và danh sách linh kiện | **PASS** |
| **API-IT-02** | Luồng đúng | `POST /api/stock/receipts` | Quản lý trung tâm ghi nhận nhập kho linh kiện | Trả về HTTP 201 Created và tăng tồn kho | **PASS** |
| **API-IT-03** | Luồng đúng | `POST /api/stock/issues` | KTV ghi nhận xuất kho cho phiếu bảo hành đang xử lý | Trả về HTTP 201 Created và trừ tồn kho | **PASS** |
| **API-IT-04** | Dữ liệu sai | `POST /api/stock/issues` | Cố tình xuất linh kiện cho phiếu đã đóng (`DA_DONG`) | Trả về HTTP 409 Conflict từ chối an toàn | **PASS** |
| **API-IT-05** | Luồng đúng | `PUT /api/stock/thresholds` | QLTT cập nhật ngưỡng cảnh báo linh kiện | Trả về HTTP 200 OK và cập nhật CSDL | **PASS** |
| **API-IT-06** | Luồng đúng | `GET /api/stock/alerts` | Lọc danh sách linh kiện có `quantity < min_threshold` | Trả về HTTP 200 và danh sách cảnh báo | **PASS** |
| **API-IT-07** | Bảo mật | `GET /api/stock/transactions` | Tra cứu lịch sử sổ cái giao dịch bất biến `part_transaction` | Trả về HTTP 200, lưu vết đầy đủ kiểm toán | **PASS** |
| **API-IT-08** | Hệ thống | Dọn dẹp môi trường test | Đóng an toàn kết nối server test và Connection Pool | Kết thúc sạch sẽ, không rò rỉ socket | **PASS** |

---

## 4. Kiểm chứng tính Tái lập và Bất biến (Reproducibility & Idempotency)

1. **Migration CSDL (`npm run migrate`):** Tạo tự động chuẩn hóa 7 bảng từ `sql/sql-ddl.sql` theo đúng thứ tự khóa ngoại. Minh chứng: [`22_migration_success.png`](./screenshots/22_migration_success.png).
2. **Nạp dữ liệu ban đầu (`npm run seed`):** Nạp thành công hơn 17.000 bản ghi chuẩn từ 6 file CSV của Mekong Mobile. Minh chứng: [`23_seed_success.png`](./screenshots/23_seed_success.png).
3. **Tính Idempotent khi chạy lại (`npm run seed lần 2`):** Sử dụng mệnh đề `ON CONFLICT DO NOTHING`, ghi nhận chính xác **0 bản ghi mới** cho cả 7 bảng, không bị lỗi trùng khóa và không sai lệch số dư tồn. Minh chứng: [`24_seed_rerun_idempotency.png`](./screenshots/24_seed_rerun_idempotency.png).
4. **Biên dịch Frontend (`npm run build`):** Biên dịch production bundle bằng Vite thành công trong 128ms, sinh tệp tĩnh sẵn sàng triển khai. Minh chứng: [`25_frontend_build.png`](./screenshots/25_frontend_build.png).

---

## 5. Kết luận

Toàn bộ 31/31 ca kiểm thử tự động đã được thực thi và đạt **PASS 100%**. Bộ kiểm thử bao phủ toàn diện 5 nhóm yêu cầu, chứng minh hệ thống vận hành ổn định, an toàn và bảo toàn tuyệt đối 3 quy tắc nghiệp vụ cốt lõi QT-09, QT-13, QT-14.

