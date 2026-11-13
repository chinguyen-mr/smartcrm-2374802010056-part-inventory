# Báo cáo kiểm thử (Test Report) — Phân hệ Quản lý kho linh kiện thay thế (Luồng L5)

**Học phần:** Chuyên đề Tốt nghiệp 1 — Chuyên ngành: Kỹ thuật Phần mềm (Track SE)  
**Dự án:** Smart CRM – Mekong Mobile  
**Phân hệ:** Luồng L5 – Quản lý kho linh kiện thay thế (Part Inventory Management)  
**Sinh viên thực hiện:** Nguyễn Văn Chí (MSSV: 2374802010056)  
**Ngày báo cáo:** 09/11/2026 (Checklist Buổi 14)  
**Môi trường thử:** PostgreSQL 16 local (cổng 5432, db `smart_crm`), Node.js `v24.21.0`, Backend API cổng 3001, Windows 11  

---

## 1. Tóm tắt kết quả kiểm thử (Executive Summary)

- **Số test case chính thức đã chạy thật:** **18 / 18**
- **Kết quả đợt kiểm thử thực nghiệm:**
  - **Lần chạy đầu tiên:** **16 PASS, 2 FAIL**
    - *Ca FAIL 1 (TC-07):* Nhập số âm `quantity: -5` bị đánh dấu FAIL do tài liệu Test Plan đặt nhầm kỳ vọng mã lỗi `VALIDATION_ERROR` thay vì mã gốc `DU_LIEU_KHONG_HOP_LE` của BT2.
    - *Ca FAIL 2 (TC-18):* Nhập số lượng cực lớn `quantity: 999999999999999` bị FAIL do lỗi kỹ thuật thực tế **BUG-05** (PostgreSQL ném lỗi tràn số `22003: integer out of range`, server trả về HTTP 500 `INTERNAL_ERROR`).
  - **Sau khi sửa bug BUG-05 và hiệu chỉnh kỳ vọng TC-07:** **18 PASS / 0 FAIL (100% PASS)**.
- **Phát hiện và sửa lỗi kỹ thuật thực tế mới trong Buổi 14:**
  - Phát hiện **BUG-05** (Mức độ Minor): Nhập `quantity` vượt quá giới hạn 32-bit `INTEGER` của PostgreSQL (hoặc nhập số lượng khiến tổng tồn sau cộng vượt quá 2.147.483.647) làm máy chủ trả về HTTP 500 `INTERNAL_ERROR` thay vì HTTP 400 `DU_LIEU_KHONG_HOP_LE`. Đã khắc phục triệt để ở cả tầng Validator và Service.
- **Đủ 5 loại kiểm thử chuẩn:** **CÓ — không thiếu loại nào:**
  1. *Luồng đúng (Positive Path):* TC-01, TC-02 (2 ca)
  2. *Giá trị biên (Boundary Values):* TC-03, TC-04, TC-05, TC-06 (4 ca)
  3. *Dữ liệu sai & Từ chối an toàn (Negative / Invalid Data):* TC-07, TC-09, TC-10, TC-15, TC-16, TC-18 (6 ca)
  4. *Bảo mật, Phân quyền & Cô lập đa trung tâm (Security OWASP A01 / RBAC):* TC-08, TC-12, TC-13, TC-14, TC-17 (5 ca)
  5. *Tái lập & Bất biến (Reproducibility / Idempotency):* TC-11 (1 ca)
- **Thư mục ảnh chụp kết quả minh chứng:** [`docs/screenshots/`](./screenshots/) (19 file ảnh minh chứng kết xuất từ lệnh thực tế: `TC-01.png` – `TC-17.png`, `TC-08b.png`, kèm cặp ảnh đối chứng trước/sau sửa lỗi `TC-18-before.png` và `TC-18-after.png`).

---

## 2. Bảng phân bố kết quả theo 5 loại kiểm thử bắt buộc

| Phân loại kiểm thử | Số ca test | Số PASS | Số FAIL | Tỷ lệ PASS | Danh sách ảnh chụp minh chứng |
|:---|:---:|:---:|:---:|:---:|:---|
| **1. Luồng đúng (Positive Path)** | 2 | 2 | 0 | 100% | [`TC-01.png`](./screenshots/TC-01.png), [`TC-02.png`](./screenshots/TC-02.png) |
| **2. Giá trị biên (Boundary Values)** | 4 | 4 | 0 | 100% | [`TC-03.png`](./screenshots/TC-03.png), [`TC-04.png`](./screenshots/TC-04.png), [`TC-05.png`](./screenshots/TC-05.png), [`TC-06.png`](./screenshots/TC-06.png) |
| **3. Dữ liệu sai & Nghiệp vụ liên trung tâm (Negative Cases)** | 6 | 6 | 0 | 100% | [`TC-07.png`](./screenshots/TC-07.png), [`TC-09.png`](./screenshots/TC-09.png), [`TC-10.png`](./screenshots/TC-10.png), [`TC-15.png`](./screenshots/TC-15.png), [`TC-16.png`](./screenshots/TC-16.png), [`TC-18-after.png`](./screenshots/TC-18-after.png) |
| **4. Bảo mật, Phân quyền & Cô lập đa trung tâm (Security)** | 5 | 5 | 0 | 100% | [`TC-08.png`](./screenshots/TC-08.png), [`TC-08b.png`](./screenshots/TC-08b.png), [`TC-12.png`](./screenshots/TC-12.png), [`TC-13.png`](./screenshots/TC-13.png), [`TC-14.png`](./screenshots/TC-14.png), [`TC-17.png`](./screenshots/TC-17.png) |
| **5. Tái lập & Bất biến (Reproducibility / Idempotent)** | 1 | 1 | 0 | 100% | [`TC-11.png`](./screenshots/TC-11.png) |
| **TỔNG CỘNG** | **18** | **18** | **0** | **100%** | **Toàn bộ 19 ảnh tại `docs/screenshots/` (`TC-01..17.png`, `TC-08b.png`, `TC-18-before.png`, `TC-18-after.png`)** |

---

## 3. Bảng kê chi tiết 18 ca kiểm thử thực tế (Chuẩn 8 cột)

| Mã | Tiền điều kiện | Các bước thực hiện | Dữ liệu thử | Kết quả mong đợi | Mức ưu tiên | Kết quả thực tế (Định lượng thật) | PASS / FAIL |
|:---:|:---|:---|:---|:---|:---:|:---|:---:|
| **TC-01** | TT01 có `part_id=1`, tồn ban đầu: 23, số tx: 880 | Gửi `POST /api/stock/receipts` với token QLTT TT01, nhập 5 chiếc kèm `reference="NK-BUOI14-01"` | `{"center_id":1,"part_id":1,"quantity":5,"reference":"NK-BUOI14-01"}` | HTTP 201 Created; số tồn tăng +5 (28); sinh giao dịch NHAP | High | HTTP 201; new_quantity: 28 (tăng +5); tx tăng 880 $\rightarrow$ 881; tx_id: 4974 (Content-Length: 292) | **PASS** |
| **TC-02** | Phiếu `BH-TEST-ACTIVE-01` trạng thái `DANG_XU_LY` tại TT01, tồn `part_id=2`: 22 | Gửi `POST /api/stock/issues` với token KTV TT01 xuất 2 chiếc cho phiếu | `{"center_id":1,"part_id":2,"ticket_code":"BH-TEST-ACTIVE-01","quantity":2}` | HTTP 201 Created; tồn trừ -2 (20); sinh giao dịch XUAT | High | HTTP 201; new_quantity: 20 (giảm -2); tx tăng 881 $\rightarrow$ 882; tx_id: 4975 (Content-Length: 355) | **PASS** |
| **TC-03** | `part_id=175` tại TT01 có tồn ban đầu = 3, `min_threshold=0`; phiếu `BH-TEST-ACTIVE-02` | Gửi `POST /api/stock/issues` xuất chính xác 3 chiếc (xuất cạn tồn kho) | `{"center_id":1,"part_id":175,"ticket_code":"BH-TEST-ACTIVE-02","quantity":3}` | HTTP 201 Created; new_quantity = 0; is_below_threshold = false | High | HTTP 201; new_quantity: 0 (giảm 3 $\rightarrow$ 0); is_below_threshold: false; tx tăng 882 $\rightarrow$ 883; tx_id: 4976 (Content-Length: 355) | **PASS** |
| **TC-04** | `part_id=176` có tồn ban đầu = 15, `min_threshold=10`; phiếu `BH-TEST-ACTIVE-03` | Gửi `POST /api/stock/issues` xuất 5 chiếc | `{"center_id":1,"part_id":176,"ticket_code":"BH-TEST-ACTIVE-03","quantity":5}` | HTTP 201 Created; new_quantity = 10; is_below_threshold = false (tồn bằng ngưỡng không cảnh báo theo QT-09) | Medium | HTTP 201; new_quantity: 10 (giảm 15 $\rightarrow$ 10); is_below_threshold: false; tx tăng 883 $\rightarrow$ 884 (Content-Length: 357) | **PASS** |
| **TC-05** | `part_id=177` có tồn ban đầu = 10, `min_threshold=10`; phiếu `BH-TEST-ACTIVE-01` | Gửi `POST /api/stock/issues` xuất tiếp 1 chiếc | `{"center_id":1,"part_id":177,"ticket_code":"BH-TEST-ACTIVE-01","quantity":1}` | HTTP 201 Created; new_quantity = 9 (< 10); is_below_threshold = true (kích hoạt cảnh báo) | Medium | HTTP 201; new_quantity: 9 (giảm 10 $\rightarrow$ 9); is_below_threshold: true; tx tăng 884 $\rightarrow$ 885 (Content-Length: 355) | **PASS** |
| **TC-06** | `part_id=178` có tồn ban đầu = 4 | Gửi `POST /api/stock/receipts` với `quantity = 1` (số nguyên dương tối thiểu) | `{"center_id":1,"part_id":178,"quantity":1,"reference":"NK-MIN-ONE"}` | HTTP 201 Created; số tồn tăng đúng +1 (5); lưu đúng `reference="NK-MIN-ONE"` | Low | HTTP 201; new_quantity: 5 (tăng 4 $\rightarrow$ 5); tx tăng 885 $\rightarrow$ 886; tx_id: 4988; reference: "NK-MIN-ONE" (Content-Length: 284) | **PASS** |
| **TC-07** | Token QLTT TT01 hợp lệ, tồn `part_id=1` = 28 | Gửi `POST /api/stock/receipts` với `quantity = -5` | `{"center_id":1,"part_id":1,"quantity":-5,"reference":"NK-INVALID"}` | HTTP 400 Bad Request với `error="DU_LIEU_KHONG_HOP_LE"`; có trường `fields.quantity` | Medium | HTTP 400 (`DU_LIEU_KHONG_HOP_LE`: Số lượng nhập phải là số nguyên lớn hơn 0, Content-Length: 353). Tồn giữ nguyên 28, tx giữ 886 | **PASS** |
| **TC-08** | Token KTV thuộc Trung tâm 1 (`center_id=1`) còn hiệu lực | Gửi `POST /api/stock/issues` với `center_id=2` để can thiệp kho Trung tâm 2 (kèm kiểm chứng đọc `GET /api/parts?center_id=2`) | `{"center_id":2,"part_id":1,"ticket_code":"BH-TEST-ACTIVE-01","quantity":1}` | HTTP 403 Forbidden với `error="FORBIDDEN"`; CSDL TT02 bất biến 100% | Critical | - Ghi (POST issue): HTTP 403 (`FORBIDDEN: Không có quyền thao tác trên trung tâm #2. Người dùng thuộc trung tâm #1.`, Content-Length: 228, minh chứng: [`TC-08.png`](./screenshots/TC-08.png)). CSDL TT02 trước và sau: 126 dòng stock (2.375 chiếc), 800 tx (bất biến 100%).<br>- Đọc (GET parts ?center_id=2): HTTP 403 (`FORBIDDEN: Không có quyền truy cập dữ liệu của trung tâm #2. Người dùng thuộc trung tâm #1.`, Content-Length: 241, minh chứng: [`TC-08b.png`](./screenshots/TC-08b.png)). | **PASS** |
| **TC-09** | Phiếu `BH-TEST-INVALID-01` có `status="DA_DONG"` tại TT01 | Gửi `POST /api/stock/issues` yêu cầu xuất linh kiện cho phiếu đã đóng | `{"center_id":1,"part_id":1,"ticket_code":"BH-TEST-INVALID-01","quantity":1}` | HTTP 409 Conflict với `error="TICKET_STATUS_NOT_ELIGIBLE"` | High | HTTP 409 (`TICKET_STATUS_NOT_ELIGIBLE`: Phiếu đang ở trạng thái 'DA_DONG', không thuộc diện xuất, Content-Length: 388). Tồn giữ 28, tx giữ 886 | **PASS** |
| **TC-10** | `part_id=179` tại TT01 có tồn khả dụng = 2; phiếu `BH-TEST-ACTIVE-02` hợp lệ | Gửi `POST /api/stock/issues` yêu cầu xuất 10 chiếc (vượt quá tồn) | `{"center_id":1,"part_id":179,"ticket_code":"BH-TEST-ACTIVE-02","quantity":10}` | HTTP 409 Conflict với `error="INSUFFICIENT_STOCK"`; tồn giữ nguyên = 2 (QT-09) | High | HTTP 409 (`INSUFFICIENT_STOCK`: Tồn hiện tại: 2, yêu cầu xuất: 10, Content-Length: 330). Tồn giữ nguyên 2, tx giữ 886 | **PASS** |
| **TC-11** | CSDL đã nạp dữ liệu ban đầu (718 dòng stock, 4979 dòng tx) | Chạy lệnh `npm run migrate` sau đó chạy `npm run seed` lần 2 | CLI: `npm run migrate; npm run seed` | Migration tái lập DDL sạch; Seed nạp đúng 0 bản ghi mới cho cả 7 bảng (Idempotent 100%) | Medium | DDL hoàn tất thành công; Seed lần 2 nạp 0/6 trung tâm, 0/38 nhân viên, 0/180 linh kiện, 0/717 tồn kho, 0/7800 phiếu, 0/4954 giao dịch | **PASS** |
| **TC-12** | Request không đính kèm Authorization Header | Gửi `GET /api/parts?center_id=1` không kèm token | Query: `center_id=1`, không Header | HTTP 401 Unauthorized với `error="UNAUTHENTICATED"` | High | HTTP 401 (`UNAUTHENTICATED`: Yêu cầu chưa được xác thực, Content-Length: 133). Tồn và tx bất biến | **PASS** |
| **TC-13** | Token bị thay thế chữ ký bằng chuỗi giả mạo `TAMPERED_SIGNATURE_XXXXX` | Gửi `GET /api/parts?center_id=1` với token giả mạo | `Authorization: Bearer <token_prefix>.TAMPERED_SIGNATURE_XXXXX` | HTTP 401 Unauthorized với `error="INVALID_TOKEN"` | High | HTTP 401 (`INVALID_TOKEN`: Token xác thực không hợp lệ hoặc đã hết hạn, Content-Length: 110). Tồn và tx bất biến | **PASS** |
| **TC-14** | Token người dùng với vai trò Kỹ thuật viên (KTV) | Gửi `PUT /api/stock/thresholds` với `min_threshold: 12` | `{"center_id":1,"part_id":1,"min_threshold":12}` | HTTP 403 Forbidden với `error="FORBIDDEN"` (chỉ QLTT mới được sửa) | Medium | HTTP 403 (`FORBIDDEN: Người dùng với vai trò KTV không có quyền thực hiện thao tác này.`, Content-Length: 128). `min_threshold` giữ nguyên = 8 | **PASS** |
| **TC-15** | Token KTV TT01 hợp lệ | Gửi `POST /api/stock/issues` với mã phiếu không tồn tại trong hệ thống | `{"center_id":1,"part_id":1,"ticket_code":"BH-KHONG-TON-TAI-9999","quantity":1}` | HTTP 404 Not Found với `error="TICKET_NOT_FOUND"` | Medium | HTTP 404 (`TICKET_NOT_FOUND`: Không tìm thấy phiếu bảo hành với mã BH-KHONG-TON-TAI-9999, Content-Length: 230). Tồn và tx bất biến | **PASS** |
| **TC-16** | Token KTV TT01 hợp lệ, mã phiếu `BH-TEST-OTHER-01` thuộc TT02 trong seed | Gửi `POST /api/stock/issues` với `center_id=1` nhưng phiếu thuộc TT02 | `{"center_id":1,"part_id":1,"ticket_code":"BH-TEST-OTHER-01","quantity":1}` | HTTP 409 Conflict với `error="TICKET_CENTER_MISMATCH"` | High | HTTP 409 (`TICKET_CENTER_MISMATCH`: Phiếu bảo hành thuộc trung tâm #2, không khớp trung tâm #1, Content-Length: 270). Tồn và tx bất biến | **PASS** |
| **TC-17** | Token KTV TT01 hợp lệ | Gửi `GET /api/parts` không truyền tham số `center_id` | Query rỗng: `GET /api/parts` | HTTP 200 OK; hệ thống tự động ép theo `center_id=1` trong JWT token | High | HTTP 200 (Content-Length: 4299); Phân trang: `page=1, size=20, total=180, returnedItems=20`. `total: 180` là toàn bộ danh mục linh kiện hệ thống được ánh xạ qua view tồn kho TT01 (linh kiện chưa có tồn hiển thị `quantity: 0`). Chuỗi `center_id` trong JSON là `"1"`; đếm `items.filter(i => String(i.center_id) === "1").length` đạt đúng 20/20 (không có linh kiện thuộc trung tâm khác). | **PASS** |
| **TC-18** | Token QLTT TT01 hợp lệ | Gửi `POST /api/stock/receipts` với số lượng cực lớn vượt 32-bit INT | `{"center_id":1,"part_id":1,"quantity":999999999999999,"reference":"NK-OVERFLOW"}` | HTTP 400 Bad Request với `error="DU_LIEU_KHONG_HOP_LE"` (trước khi sửa bị lỗi 500) | Medium | Trước sửa: HTTP 500 (`INTERNAL_ERROR`, Content-Length: 151, minh chứng: [`TC-18-before.png`](./screenshots/TC-18-before.png)). Sau sửa: HTTP 400 (`DU_LIEU_KHONG_HOP_LE`, Content-Length: 353, minh chứng: [`TC-18-after.png`](./screenshots/TC-18-after.png)) | **PASS** |

---

## 4. Ghi chú điều tra, hiệu chỉnh kỳ vọng TC-07 và phân tích BUG-05

1. **Hiệu chỉnh kỳ vọng TC-07 (Không phát sinh bug giả):**
   - Ở lượt chạy đầu tiên, ca kiểm thử `quantity = -5` bị đánh dấu FAIL vì Test Plan ban đầu ghi nhận kỳ vọng mã lỗi là `VALIDATION_ERROR`.
   - Sau khi đối chiếu hợp đồng API (`docs/api-contract.md`), tài liệu thiết kế BT2 (`docs/thay-doi-thiet-ke.md` TD-09) và mã nguồn gốc (`src/backend/src/errors/AppError.js`), định danh mã lỗi chuẩn của hệ thống là `DU_LIEU_KHONG_HOP_LE`.
   - Kết luận: Mã nguồn hoạt động hoàn toàn chính xác theo thiết kế BT2; tài liệu Test Plan đã được điều chỉnh kỳ vọng sang `DU_LIEU_KHONG_HOP_LE` để bảo toàn tính nguyên bản.

2. **Phân tích và khắc phục lỗi BUG-05 (Integer Overflow):**
   - **Triệu chứng ban đầu:** Khi gửi `POST /api/stock/receipts` với `quantity: 999999999999999` hoặc khi nhập số lượng lớn làm tổng tồn vượt quá 2.147.483.647, hệ thống trả về mã HTTP 500 với body:
     ```http
     HTTP/1.1 500 Internal Server Error
     Content-Type: application/json; charset=utf-8
     Content-Length: 151
     
     {"error":"INTERNAL_ERROR","message":"Hệ thống gặp sự cố ngoài dự kiến. Vui lòng liên hệ quản trị viên hoặc thử lại sau."}
     ```
   - **Đánh giá mức độ:** Mức độ **Minor** theo thang chuẩn Buổi 13. Lý do: Phản hồi HTTP 500 sử dụng thông báo chung của middleware `errorHandler`, không làm lộ stack trace hay cấu trúc CSDL nội bộ ra bên ngoài; máy chủ không bị treo/sập kết nối và số liệu tồn kho trong DB không bị sai lệch hay mất mát. Tuy nhiên, việc trả mã 500 đối với lỗi nhập liệu người dùng là chưa đúng chuẩn RESTful (cần trả HTTP 400).
   - **Giải pháp khắc phục:**
     - Tầng 1 (`StockValidator`): Bổ sung kiểm tra `quantity > MAX_INTEGER` (2.147.483.647), ném lỗi `DU_LIEU_KHONG_HOP_LE` (HTTP 400).
     - Tầng 2 (`ReceiptService`): Kiểm tra tổng tồn sau khi nhập `currentQty + quantity > MAX_INTEGER`, ngăn chặn hoàn toàn việc phát sinh lỗi `integer out of range` ở mức PostgreSQL.
   - **Xác nhận sau khắc phục:** Ca kiểm thử `TC-18` trả về HTTP 400 với thông điệp rõ ràng:
     ```http
     HTTP/1.1 400 Bad Request
     Content-Type: application/json; charset=utf-8
     Content-Length: 353
     
     {"error":"DU_LIEU_KHONG_HOP_LE","message":"Dữ liệu nhập kho không đúng định dạng.","fields":{"quantity":"Số lượng nhập phải là số nguyên lớn hơn 0 và không vượt quá 2147483647."},"details":[{"field":"quantity","reason":"Số lượng nhập phải là số nguyên lớn hơn 0 và không vượt quá 2147483647."}]}
     ```
   - Hai ảnh minh chứng đối chứng được lưu tại [`docs/screenshots/TC-18-before.png`](./screenshots/TC-18-before.png) và [`docs/screenshots/TC-18-after.png`](./screenshots/TC-18-after.png).


3. **Lưu ý về dữ liệu mẫu (Test Fixtures) và tính tái lập (Reproducibility):**
   - Các mã phiếu bảo hành `BH-TEST-ACTIVE-01`, `BH-TEST-ACTIVE-02`, `BH-TEST-ACTIVE-03`, `BH-TEST-INVALID-01`, `BH-TEST-OTHER-01` (được sinh từ `ticket_id >= 7801` trong `seed.js`) là các fixture được tạo riêng cho kiểm thử tự động, không phải là dữ liệu phiếu thực tế của khách hàng trong vận hành.
   - Do các ca kiểm thử xuất kho (TC-02 đến TC-05) làm giảm số tồn thực tế trên các linh kiện mẫu này, để đảm bảo tính độc lập và khả năng tái lập 100% khi chạy lại bộ test suite nhiều lần, kịch bản kiểm thử tự động (`scratch/run_official_18_suite.js`) chủ động đưa các dòng tồn kho mẫu về số dư định danh ban đầu trước khi thực thi.

---

## 5. Kiểm thử qua giao diện web (chạy thật trên Docker, 13/11/2026)

Bổ sung cho 18 ca API ở mục 3: thao tác **trực tiếp trên giao diện** `http://localhost:8088` (stack `docker compose up -d --build`, dữ liệu do `db-init` nạp) bằng trình duyệt Microsoft Edge được điều khiển tự động (Playwright): chọn vai trò/trung tâm trên thanh đầu trang, nhập form, bấm nút, rồi chụp toàn trang. Cột "Kết quả thực tế" là nguyên văn thông báo hiện trên giao diện (log: `docs/evidence/bt3/11-ui-test-results.json`).

| Mã | Thao tác | Kết quả mong đợi | Kết quả thực tế (thông báo trên giao diện) | PASS/FAIL |
|:---:|:---|:---|:---|:---:|
| [UI-01](./screenshots/UI-01-M2-nhap-kho-thanh-cong.png) | M2 – QLTT TT01 nhập 5 linh kiện MH-SS-01 (TC-01) | Thông báo nhập kho thành công, tồn tăng 5, giao dịch NHAP xuất hiện trong lịch sử | ✓ Ghi nhận nhập kho thành công! Mã giao dịch #4955. Số lượng nhập: +5. Tồn kho mới: 21. | **PASS** |
| [UI-02](./screenshots/UI-02-M3-xuat-kho-thanh-cong.png) | M3 – KTV TT01 xuất 2 MH-SS-02 cho phiếu BH-TEST-ACTIVE-01 (TC-02) | Thông báo xuất kho thành công, tồn giảm 2 | ✓ Xuất kho thành công cho phiếu [BH-TEST-ACTIVE-01]! Mã GD: #4956. Số lượng xuất: -2. Tồn còn lại: 8. | **PASS** |
| [UI-03](./screenshots/UI-03-M3-phieu-da-dong.png) | M3 – Xuất kho cho phiếu đã đóng BH-TEST-INVALID-01 (TC-09) | Báo lỗi phiếu ở trạng thái DA_DONG, không cho xuất | Phiếu bảo hành BH-TEST-INVALID-01 đang ở trạng thái 'DA_DONG', không thuộc diện được phép xuất linh kiện. | **PASS** |
| [UI-04](./screenshots/UI-04-M3-xuat-vuot-ton.png) | M3 – Xuất 9999 chiếc, vượt tồn kho (TC-10, QT-09) | Báo lỗi tồn kho không đủ, hiển thị tồn khả dụng | Số lượng tồn kho không đủ để xuất. Tồn hiện tại: 8, yêu cầu xuất: 9999. | **PASS** |
| [UI-05](./screenshots/UI-05-M3-phieu-khong-ton-tai.png) | M3 – Mã phiếu không tồn tại (TC-15) | Báo lỗi không tìm thấy phiếu bảo hành | Không tìm thấy phiếu bảo hành với mã BH-KHONG-TON-TAI-9999 trong hệ thống. | **PASS** |
| [UI-06](./screenshots/UI-06-M3-phieu-khac-trung-tam.png) | M3 – Phiếu BH-TEST-OTHER-01 thuộc TT02, thao tác tại TT01 (TC-16) | Báo lỗi phiếu không khớp trung tâm | Phiếu bảo hành BH-TEST-OTHER-01 thuộc trung tâm #2, không khớp với trung tâm #1 đang thao tác. | **PASS** |
| [UI-07](./screenshots/UI-07-M2-KTV-khong-duoc-nhap.png) | M2 – Vai trò KTV mở màn hình nhập kho (phân quyền, TC-14) | Nút Xác nhận Nhập kho bị khóa, có nhắc chỉ QLTT được nhập | Lưu ý phân quyền: Nghiệp vụ nhập kho yêu cầu vai trò Quản lý trung tâm (QLTT). Bạn đang ở chế độ xem KTV, hãy chuyển vai trò ở góc trên để thực hiện thao tác. | **PASS** |
| [UI-08](./screenshots/UI-08-M1-dat-nguong.png) | M1 – QLTT đặt ngưỡng 30 cho MH-SS-01 (US5, TC-04/05) | Thông báo cập nhật ngưỡng thành công; MH-SS-01 chuyển sang trạng thái dưới ngưỡng | Đã cập nhật ngưỡng cảnh báo cho linh kiện MH-SS-01 thành 30. | **PASS** |
| [UI-09](./screenshots/UI-09-M1-loc-duoi-nguong.png) | M1 – Lọc linh kiện dưới ngưỡng cảnh báo (US4, QT-09) | Chỉ hiển thị linh kiện có tồn < ngưỡng, đánh dấu cảnh báo | (kết quả dạng bảng — xem ảnh) | **PASS** |
| [UI-10](./screenshots/UI-10-M3-tra-cuu-theo-phieu.png) | M3 – Tra cứu linh kiện đã xuất cho phiếu BH-TEST-ACTIVE-01 (US7) | Bảng liệt kê giao dịch xuất của phiếu, gồm giao dịch vừa xuất ở UI-02 | (kết quả dạng bảng — xem ảnh) | **PASS** |

**Phát hiện thêm khi kiểm thử giao diện (chưa sửa, mức Trivial):** ở màn hình M3, ô "Tra cứu linh kiện đã xuất cho phiếu" được điền sẵn `BH-TEST-ACTIVE-01` (`StockIssueScreen.jsx` dòng 16) nên trước khi người dùng bấm tra cứu, màn hình đã hiện "Chưa có linh kiện nào được xuất cho phiếu BH-TEST-ACTIVE-01" dù phiếu này có giao dịch (thấy ở ảnh `UI-04`; khi bấm tra cứu thật thì hiện đúng — ảnh `UI-10`). Không sai dữ liệu, chỉ gây hiểu nhầm; hướng sửa: chỉ hiện thông báo rỗng sau khi đã tra cứu.
