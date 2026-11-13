# Nhật ký sửa lỗi kỹ thuật (Bug Log) — Luồng L5 Kho linh kiện thay thế

Tài liệu này ghi nhận toàn bộ các lỗi kỹ thuật thực tế được phát hiện, điều tra theo **quy trình debug 4 bước chuẩn** (Tái lập $\rightarrow$ Khoanh vùng $\rightarrow$ Sửa nguyên nhân $\rightarrow$ Xác nhận) và khắc phục triệt để trong quá trình phát triển dự án Smart CRM — Bài tập 2 và Bài tập 3 (BUG-06 – BUG-09 phát hiện ở buổi 15–16 khi đóng gói và chạy phép thử máy trắng).

---

## 1. Bảng tổng hợp các lỗi kỹ thuật (Bug Registry)

| ID | Mức độ | Triệu chứng | Nguyên nhân | Cách sửa | Cách xác nhận |
|:---:|:---:|:---|:---|:---|:---|
| **BUG-01** | **Major** | Frontend gửi payload camelCase (`minThreshold`) bị Backend từ chối `400 BAD_REQUEST` | Validator chỉ đọc thuộc tính `snake_case` (`req.body.min_threshold`), thiếu fallback | Chuẩn hóa `min_threshold = req.body.min_threshold ?? req.body.minThreshold` | Unit test `TC17`, `TC19` và Integration test `API-IT-05` chạy PASS 100% (Commit: [76e3fd4](https://github.com/chinguyen-mr/smartcrm-2374802010056-part-inventory/commit/76e3fd41ada5e065b33ba38d1eff8b5f24d0b8ca)) |
| **BUG-02** | **Major** | Backend trả lỗi validation mảng thô `details`, Frontend không hiển thị được câu lỗi dưới từng ô nhập liệu | Middleware `errorHandler.js` chưa chuyển đổi mảng `details` sang dictionary `fields` | Bổ sung logic mapping mảng sang `fields: { [field]: message }`, bảo toàn `details` | Kiểm thử form M2/M3: tô đỏ input field, hiển thị lỗi chính xác (Commit: [7dda898](https://github.com/chinguyen-mr/smartcrm-2374802010056-part-inventory/commit/7dda898e0bc4e34b5dd08285d81f461eb6e77e0f)) |
| **BUG-03** | **Critical** | Token hết hạn (401) làm app treo; bị cấm quyền (403) bị xóa nhầm phiên đăng nhập | `client.js` chỉ throw error chung chung, không phân biệt mã HTTP 401 và 403 | Bắt mã 401 dispatch sự kiện `auth:expired`, xóa token; bắt 403 ném lỗi phân quyền giữ session | Thử nghiệm phiên hết hạn và truy cập chéo trung tâm: hiển thị đúng modal/banner (Commit: [5256eed](https://github.com/chinguyen-mr/smartcrm-2374802010056-part-inventory/commit/5256eeddf7fa45c5653337cc63535568aba891c5)) |
| **BUG-04** | **Critical** | DDL/ERD thiếu bảng `employee`, thiếu cột `status` trong `ticket_ref`, sai quan hệ FK theo góp ý GV | Thiết kế BT1 xem hệ thống phiếu và nhân sự là bên ngoài, chưa mô hình hóa thực tế | Bổ sung bảng `employee` (38 KTV), thêm `status` vào `ticket_ref`, chuẩn hóa `ticket_part_id` | Chạy lại `npm run migrate` & `seed` thành công 100%, 31/31 tests PASS (Commit: [ff3f402](https://github.com/chinguyen-mr/smartcrm-2374802010056-part-inventory/commit/ff3f402bb1cfff8d8e788b3b800ef8b1ea8669d7)) |
| **BUG-05** | **Minor** | Nhập `quantity` cực lớn hoặc tổng tồn vượt 2.147.483.647 gây lỗi PostgreSQL 500 integer out of range | Validator và Service thiếu chặn giới hạn trên kiểu `INTEGER` 4-byte có dấu (2.147.483.647) | Bổ sung ràng buộc `MAX_INTEGER = 2147483647` ở Validator và kiểm tra tổng tồn ở Service, trả HTTP 400 | Ca TC-18 và Unit test `TC14B`, `TC14C` trả đúng 400 Bad Request, 33/33 tests PASS (Commit: [24e2613](https://github.com/chinguyen-mr/smartcrm-2374802010056-part-inventory/commit/24e2613add653e4df501b686f11e710aa998c8eb)) |
| **BUG-06** | **Major** | Chạy theo README bằng Docker: `docker compose exec backend npm run migrate`/`seed` lỗi `ENOENT`, hệ thống lên nhưng CSDL rỗng; `npm test` trong container không chạy được | Image backend build từ `src/backend` nên KHÔNG chứa `sql/sql-ddl.sql`, `data/sample/*.csv`, `tests/`; compose không có bước khởi tạo CSDL | Build context = thư mục gốc, image chứa DDL + dữ liệu mẫu + test; thêm service `db-init` (tạo schema nếu chưa có + seed idempotent) chạy trước backend | Phép thử máy trắng: 2 lệnh → 4 service healthy/exited 0, `npm test` trong container 36/36 PASS (Commit: [a5c1a98](https://github.com/chinguyen-mr/smartcrm-2374802010056-part-inventory/commit/a5c1a98b11139e313c0dd151276d4cd78cda517b)) |
| **BUG-07** | **Major** | `docker compose up` dừng ngay: `go-yaml load error … mapping values are not allowed in this context` | Chuỗi `${DB_PASSWORD:?… chay: cp …}` không có ngoặc kép chứa `": "` nên YAML hiểu sai thành mapping | Bọc ngoặc kép các giá trị `${VAR:?…}` và bỏ dấu `:` trong thông điệp | `docker compose config --quiet` exit 0; phép thử máy trắng chạy lại thành công (Commit: [dd8ec9b](https://github.com/chinguyen-mr/smartcrm-2374802010056-part-inventory/commit/dd8ec9bc34ff10c648751ffd0b7cda7ef2583ea8)) |
| **BUG-08** | **Minor** | `POST /api/stock/receipts` không có body trả 500 `INTERNAL_ERROR` thay vì 400 | Express 5 để `req.body = undefined` khi không có body JSON; validator đọc `data.center_id` → `TypeError` | Middleware chuẩn hóa `req.body` rỗng thành `{}` ngay sau `express.json()` | Integration test `API-IT-08` trả 400 `DU_LIEU_KHONG_HOP_LE` (Commit: [fa8ebdb](https://github.com/chinguyen-mr/smartcrm-2374802010056-part-inventory/commit/fa8ebdb6f8b872886c68c0448bc462dd2822c26b)) |
| **BUG-09** | **Minor** | `GET /api/parts/abc` và `GET /api/stock/transactions?from=sai-ngay` trả 500 | Tham số đường dẫn/truy vấn đưa thẳng xuống PostgreSQL, ép kiểu `bigint`/`timestamptz` thất bại | Thêm `common.validator.js` (`parsePositiveId`, `parseOptionalDate`) kiểm tra ở tầng route | `API-IT-09`, `API-IT-10` trả 400; 36/36 test PASS (Commit: [95038b0](https://github.com/chinguyen-mr/smartcrm-2374802010056-part-inventory/commit/95038b0869ec0edae178a90704def9a31240bbf8)) |

---

## 2. Chi tiết từng lỗi theo quy trình debug 4 bước

### 2.1. BUG-01: Không đồng bộ quy ước đặt tên (camelCase vs snake_case) trong Stock Validator

1. **ID và Severity:** `BUG-01` | Mức độ: `Major` (Ảnh hưởng đến tính liên thông giữa React Frontend và Express Backend).
2. **Phát hiện bởi:** Bộ kiểm thử đơn vị (`tests/unit/stock.service.test.js`) và kiểm thử thủ công API thiết lập ngưỡng cảnh báo `PUT /api/stock/thresholds`.
3. **Triệu chứng:** Khi Frontend gửi payload JSON dạng camelCase (`{ centerId: 1, partId: 10, minThreshold: 5 }`), Backend trả về mã lỗi `400 BAD_REQUEST` với thông báo `min_threshold is required and must be an integer >= 0`.
4. **Cách tái lập:**
   - Bước 1: Gửi request `PUT /api/stock/thresholds` với Header `Authorization: Bearer <Token_QLTT>`.
   - Bước 2: Request body chứa `{ "centerId": 1, "partId": 10, "minThreshold": 5 }`.
   - Bước 3: Quan sát phản hồi HTTP 400 dù dữ liệu hoàn toàn hợp lệ về mặt ngữ nghĩa.
5. **Nguyên nhân gốc:**
   - Trong `stock.validator.js`, hàm kiểm tra chỉ đọc trực tiếp các trường theo định dạng `snake_case`: `req.body.min_threshold`, `req.body.center_id`, `req.body.part_id`.
   - Không có cơ chế fallback hoặc chuẩn hóa dữ liệu đầu vào giữa chuẩn JavaScript Frontend (camelCase) và CSDL PostgreSQL (snake_case).
6. **Cách sửa (Root-cause Fix):**
   - Cập nhật bộ validator để tự động chuẩn hóa và nhận diện cả 2 quy ước đặt tên:
     ```javascript
     const center_id = req.body.center_id ?? req.body.centerId;
     const part_id = req.body.part_id ?? req.body.partId;
     const min_threshold = req.body.min_threshold !== undefined 
       ? req.body.min_threshold 
       : req.body.minThreshold;
     ```
   - Gán lại các giá trị đã chuẩn hóa vào `req.body` trước khi chuyển giao tiếp cho Service tầng dưới.
7. **Commit và Bằng chứng xác nhận:**
   - **Commit:** [76e3fd4](https://github.com/chinguyen-mr/smartcrm-2374802010056-part-inventory/commit/76e3fd41ada5e065b33ba38d1eff8b5f24d0b8ca) — `fix: hỗ trợ linh hoạt cả camelCase và snake_case trong stock validator`
   - **Bằng chứng:** Unit test `TC17`, `TC19` và Integration test `API-IT-05` chạy PASS 100% với cả hai kiểu payload.

---

### 2.2. BUG-02: Định dạng phản hồi lỗi Validation chưa đáp ứng cấu trúc `fields` của Buổi 9

1. **ID và Severity:** `BUG-02` | Mức độ: `Major` (Vi phạm hợp đồng API và tài liệu đặc tả Buổi 9).
2. **Phát hiện bởi:** Kiểm thử giao diện M2 (Nhập kho) và M3 (Xuất kho) khi submit form có trường dữ liệu không hợp lệ.
3. **Triệu chứng:**
   - Khi người dùng bỏ trống số lượng hoặc nhập số âm, Backend trả về response: `{ error: "VALIDATION_ERROR", details: [{ field: "quantity", message: "..." }] }`.
   - Frontend không tìm thấy thuộc tính `fields: { quantity: "..." }` nên không thể làm nổi bật viền đỏ và hiển thị câu thông báo lỗi ngay dưới ô nhập liệu tương ứng.
4. **Cách tái lập:**
   - Bước 1: Gửi `POST /api/stock/receipts` với body `{ center_id: 1, part_id: 1, quantity: -5 }`.
   - Bước 2: Kiểm tra cấu trúc JSON trả về.
   - Bước 3: Thuộc tính `fields` bị thiếu hoặc là `undefined`.
5. **Nguyên nhân gốc:**
   - Middleware `errorHandler.js` cũ chỉ chuyển tiếp mảng `details` từ validator mà không thực hiện biến đổi cấu trúc (data transformation) sang dạng từ điển `{ [field]: message }` như yêu cầu tại Buổi 9.
6. **Cách sửa (Root-cause Fix):**
   - Viết hàm chuẩn hóa cấu trúc lỗi trong `src/backend/src/middleware/errorHandler.js`:
     ```javascript
     let fields = null;
     if (Array.isArray(err.details)) {
       fields = {};
       err.details.forEach(item => {
         if (item.field) {
           fields[item.field] = item.message;
         }
       });
     }
     res.status(statusCode).json({
       error: err.errorCode || "INTERNAL_SERVER_ERROR",
       message: err.message,
       fields: fields,
       details: err.details || null
     });
     ```
   - Vừa đảm bảo trường `fields` cho UI mới, vừa bảo toàn `details` cho tương thích ngược.
7. **Commit và Bằng chứng xác nhận:**
   - **Commit:** [7dda898](https://github.com/chinguyen-mr/smartcrm-2374802010056-part-inventory/commit/7dda898e0bc4e34b5dd08285d81f461eb6e77e0f) — `fix(backend): chuan hoa dinh dang loi API tra ve fields cho form validation`
   - **Bằng chứng:** Ảnh minh chứng `20_UI_error.png` hiển thị form tô đỏ đúng trường nhập sai; toàn bộ integration test chạy PASS.

---

### 2.3. BUG-03: Xử lý vòng đời mã lỗi 401 (Unauthorized) và 403 (Forbidden) tại Frontend

1. **ID và Severity:** `BUG-03` | Mức độ: `Critical` (Gây tắc nghẽn luồng người dùng và trải nghiệm giao diện).
2. **Phát hiện bởi:** Thử nghiệm kịch bản phiên làm việc hết hạn và thử nghiệm phân quyền chéo trung tâm (QT-14).
3. **Triệu chứng:**
   - Khi token JWT hết hạn (HTTP 401), giao diện không điều hướng, người dùng nhấn các nút thao tác thì màn hình rơi vào trạng thái tải vô hạn hoặc báo lỗi kết nối mơ hồ.
   - Khi người dùng KTV thực hiện hành vi bị cấm như thiết lập ngưỡng (HTTP 403), client cũ xóa nhầm token đăng nhập khiến người dùng bị đẩy văng ra ngoài không rõ nguyên do.
4. **Cách tái lập:**
   - Bước 1: Giả lập lưu một chuỗi JWT hết hạn hoặc chuỗi ngẫu nhiên vào `localStorage.getItem("token")`.
   - Bước 2: Tải lại trang ứng dụng tại màn hình M1.
   - Bước 3: Ứng dụng gửi request và nhận mã 401, token cũ vẫn lưu trong storage, giao diện không reset.
5. **Nguyên nhân gốc:**
   - Lớp gọi API `src/frontend/src/api/client.js` chỉ bắt lỗi chung chung bằng `catch` và `throw error`, không bóc tách mã trạng thái HTTP 401 và 403 để phát tín hiệu điều hướng phù hợp.
6. **Cách sửa (Root-cause Fix):**
   - Triển khai interceptor xử lý mã lỗi HTTP tại `src/frontend/src/api/client.js`:
     - Khi `res.status === 401`: Xóa ngay `token` khỏi `localStorage`, phát sự kiện toàn cục qua `window.dispatchEvent(new CustomEvent("auth:expired"))`.
     - Khi `res.status === 403`: Ném lỗi `ForbiddenError` với thông điệp: "Bạn không có quyền thực hiện thao tác này tại trung tâm đã chọn". Giữ nguyên phiên đăng nhập.
   - Tại `src/frontend/src/App.jsx`: Lắng nghe sự kiện `auth:expired` để chuyển ngay về trạng thái chưa xác thực, hiển thị modal thông báo "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại".
7. **Commit và Bằng chứng xác nhận:**
   - **Commit:** [5256eed](https://github.com/chinguyen-mr/smartcrm-2374802010056-part-inventory/commit/5256eeddf7fa45c5653337cc63535568aba891c5) — `feat(frontend): xu ly vong doi 401 het han phien dang nhap va 403 phan quyen`
   - **Bằng chứng:** Kiểm thử phân quyền RBAC thành công; ảnh minh chứng `20_UI_error.png` và kịch bản 401/403 hoạt động chính xác.

---

### 2.4. BUG-04: Bất nhất mô hình dữ liệu giữa DDL, ERD, Draw.io và Phản hồi của Giảng viên

1. **ID và Severity:** `BUG-04` | Mức độ: `HIGH` (Nguy cơ bị trừ điểm nặng do không nhất quán hồ sơ kỹ thuật và DDL).
2. **Phát hiện bởi:** Rà soát phản hồi của Giảng viên hướng dẫn sau BT1 (góp ý G1, G2, G3, G7) và đối chiếu với bộ dataset `CDTN1_Mekong Mobile_Dataset Smart CRM`.
3. **Triệu chứng:**
   - ERD cũ chỉ có 6 bảng, thiếu bảng `employee` dù hệ thống có phân quyền KTV và QLTT.
   - Bảng `ticket_ref` thiếu cột `status` khiến nghiệp vụ xuất kho không thể kiểm tra điều kiện phiếu hợp lệ ở mức CSDL.
   - Bảng `ticket_part` dùng composite key thay vì surrogate key `ticket_part_id`, dẫn đến quan hệ khóa ngoại vòng với `part_transaction`.
4. **Cách tái lập:**
   - So sánh trực tiếp giữa `sql/sql-ddl.sql`, `docs/erd.md`, `docs/diagrams/erd.drawio` và file dataset `technicians.csv`.
   - Kết quả: `sql-ddl.sql` không tạo bảng `employee`, file seed nạp 5 bảng, sơ đồ Draw.io thiếu thực thể nhân sự.
5. **Nguyên nhân gốc:**
   - Ở giai đoạn BT1, nhóm thiết kế coi nhân viên và phiếu bảo hành là các hệ thống bên ngoài hoàn toàn. Tuy nhiên, theo yêu cầu phân quyền chi tiết (QT-14) và dữ liệu thực tế Mekong Mobile, 38 kỹ thuật viên thuộc 6 trung tâm cần được quản lý tập trung trong bảng `employee`.
6. **Cách sửa (Root-cause Fix):**
   - Bổ sung bảng `employee` vào `sql/sql-ddl.sql` với các trường: `employee_id`, `employee_code`, `full_name`, `email`, `role`, `center_id`, `skill_level`, `is_active`.
   - Bổ sung cột `status VARCHAR(30) NOT NULL DEFAULT 'DANG_XU_LY'` vào `ticket_ref`.
   - Thêm cột `ticket_part_id` làm khóa chính cho `ticket_part` và liên kết khóa ngoại 1-1 tới `part_transaction(ticket_part_id)`.
   - Cập nhật script `migrate.js` và `seed.js` nạp đầy đủ 38 nhân sự từ `technicians.csv`.
   - Vẽ lại sơ đồ ERD trực quan chuẩn mực 7 bảng trên `docs/diagrams/erd.drawio` và cập nhật tài liệu `docs/erd.md`, `docs/erd.drawio.md`.
7. **Commit và Bằng chứng xác nhận:**
   - **Commit:** [ff3f402](https://github.com/chinguyen-mr/smartcrm-2374802010056-part-inventory/commit/ff3f402bb1cfff8d8e788b3b800ef8b1ea8669d7) — `fix: khac phuc gop y GV - dong bo ERD 7 bang, DDL, Draw.io va tai lieu BT2`
   - **Bằng chứng:**
     - `npm run migrate` tạo thành công 7/7 bảng.
     - `npm run seed` nạp đủ 38 employees, 180 parts, 717 stock records, 7.805 ticket references, 4.063 ticket parts, 4.954 transactions.
     - Toàn bộ 31/31 unit và integration test PASS.

---

### 2.5. BUG-05: Lỗi máy chủ 500 khi người dùng nhập số lượng vượt giới hạn 32-bit Integer của PostgreSQL

1. **ID và Severity:** `BUG-05` | Mức độ: `Minor` (Lỗi nhập liệu trả về mã 500 thay vì 400; không làm lộ thông tin nhạy cảm, không gây hỏng dữ liệu và máy chủ vẫn hoạt động bình thường).
2. **Phát hiện bởi:** Ca kiểm thử thực nghiệm `TC-18` tại Buổi 14 (`POST /api/stock/receipts` với `quantity: 999999999999999`) và bộ unit test kiểm thử biên `TC14B-Negative`, `TC14C-Negative`.
3. **Triệu chứng:**
   - Khi người dùng gửi request nhập kho với số lượng rất lớn (`quantity: 999999999999999`) hoặc nhập số lượng lớn khiến tổng tồn sau khi nhập vượt quá 2.147.483.647, Express Backend không chặn ở tầng kiểm thực mà để lọt câu lệnh SQL xuống CSDL.
   - PostgreSQL ném lỗi `error: integer out of range` (mã lỗi `22003`), dẫn đến middleware xử lý lỗi trả về phản hồi HTTP `500 INTERNAL_ERROR` kèm thông điệp generic `{"error":"INTERNAL_ERROR","message":"Hệ thống gặp sự cố ngoài dự kiến. Vui lòng liên hệ quản trị viên hoặc thử lại sau."}` (Content-Length: 151).
4. **Cách tái lập:**
   - Bước 1: Gửi `POST /api/stock/receipts` kèm token QLTT TT01.
   - Bước 2: Request body chứa `{ "center_id": 1, "part_id": 1, "quantity": 999999999999999 }` hoặc `{ "center_id": 1, "part_id": 1, "quantity": 2147483647 }` khi tồn đang là 28.
   - Bước 3: Quan sát máy chủ phản hồi HTTP 500 thay vì HTTP 400.
5. **Nguyên nhân gốc:**
   - Trong JavaScript, `Number.MAX_SAFE_INTEGER` là $2^{53}-1$ ($9,007,199,254,740,991$), do đó hàm `Number.isInteger(999999999999999)` trả về `true`.
   - Tuy nhiên, cột `quantity` trong CSDL PostgreSQL được định nghĩa kiểu `INTEGER` (4-byte signed integer, giới hạn tối đa là $2^{31}-1 = 2,147,483,647$).
   - `StockValidator` và `ReceiptService` chỉ kiểm tra `quantity > 0` mà thiếu ràng buộc cận trên `quantity <= 2147483647` và thiếu kiểm tra tổng tồn sau khi cộng `current_quantity + quantity <= 2147483647`.
6. **Cách sửa (Root-cause Fix):**
   - Bổ sung hằng số `MAX_INTEGER = 2147483647` vào cả 2 tầng phòng thủ:
     - Tầng 1 (`StockValidator`): Bổ sung kiểm tra `parsedQuantity > MAX_INTEGER` và `parsedThreshold > MAX_INTEGER`, từ chối ngay lập tức với HTTP 400 `DU_LIEU_KHONG_HOP_LE`.
     - Tầng 2 (`ReceiptService`): Bổ sung kiểm tra `currentQty + quantity > MAX_INTEGER` trước khi gọi câu lệnh `UPDATE` tồn kho.
   - Trả về mã lỗi chuẩn `DU_LIEU_KHONG_HOP_LE` kèm HTTP 400 Bad Request và thông điệp trường rõ ràng.
7. **Commit và Bằng chứng xác nhận:**
   - **Commit:** [24e2613](https://github.com/chinguyen-mr/smartcrm-2374802010056-part-inventory/commit/24e2613add653e4df501b686f11e710aa998c8eb) — `fix(validator): gioi han quantity toi da 2147483647 va tong ton tranh loi 500 postgres integer overflow (BUG-05)`
   - **Bằng chứng:** Unit test `TC14B-Negative`, `TC14C-Negative` và ca kiểm thử API `TC-18` trả về HTTP 400; toàn bộ 33/33 tests PASS (ảnh đối chứng `TC-18-before.png` và `TC-18-after.png`).

---

### 2.6. BUG-06: Gói Docker không dựng lại được CSDL — image backend thiếu DDL, dữ liệu mẫu và bộ test

1. **ID và Severity:** `BUG-06` | Mức độ: `Major` — người khác clone repo và làm theo README (mục 11) **không dựng được hệ thống có dữ liệu** bằng Docker; không có cách làm tạm nếu không sửa Dockerfile. Không làm sai hay lộ dữ liệu.
2. **Phát hiện bởi:** Đối chiếu tiêu chí C1 (buổi 16) — tự rà gói đóng gói trước phép thử máy trắng; xác nhận bằng cách build lại đúng image của commit `a51da68`.
3. **Triệu chứng:** `docker compose up` lên được 3 container nhưng CSDL không có bảng; lệnh README `docker compose exec backend npm run migrate` lỗi `ENOENT` khi đọc `sql/sql-ddl.sql`; `npm run seed` không tìm thấy `data/sample`; `npm test` trong container không có thư mục `tests`.
4. **Cách tái lập** (log: `docs/evidence/bt3/09-bug06-old-image-missing-files.txt`):
   - `git archive a51da68 src/backend` → `docker build -t smartcrm-backend:a51da68 src/backend`
   - `docker run --rm smartcrm-backend:a51da68 ls /app` → chỉ có `node_modules package*.json scripts server.js src`
   - `docker run --rm smartcrm-backend:a51da68 ls /sql /data/sample` → `No such file or directory` (đúng đường dẫn `migrate.js`/`seed.js` tìm tới: `/app/scripts/../../../sql`).
5. **Nguyên nhân gốc:** build context của backend là `./src/backend` nên Docker không thể `COPY` các thư mục ở gốc repo (`sql/`, `data/sample/`); `src/backend/.dockerignore` còn loại `tests`; `docker-compose.yml` không có bước nào chạy migrate/seed nên việc khởi tạo phụ thuộc người chạy gõ thêm lệnh. Ở BT2 lỗi bị che vì máy sinh viên chưa cài Docker, chỉ kiểm theo cách chạy native.
6. **Cách sửa (Root-cause Fix):**
   - Build context = thư mục gốc (`context: .`, `dockerfile: src/backend/Dockerfile`); image `COPY` thêm `sql/sql-ddl.sql`, `data/sample/`, `tests/`; đường dẫn đọc qua biến `SQL_DDL_PATH`, `SAMPLE_DATA_DIR`.
   - Thêm `scripts/bootstrap.js` và service `db-init`: tạo schema **chỉ khi chưa có**, rồi seed idempotent, in số dòng từng bảng; `backend` chỉ khởi động sau khi `db-init` thoát 0 (`service_completed_successfully`).
   - Bỏ publish cổng 5432 ra máy host (tránh xung đột với PostgreSQL cài sẵn), cổng web lấy từ `WEB_PORT`.
7. **Commit và Bằng chứng xác nhận:**
   - **Commit:** [a5c1a98](https://github.com/chinguyen-mr/smartcrm-2374802010056-part-inventory/commit/a5c1a98b11139e313c0dd151276d4cd78cda517b) — `feat(packaging): db-init tu dong migrate+seed idempotent, image chua sql/data/tests, bat buoc JWT_SECRET >=32, CORS allow-list`
   - **Bằng chứng:** `docs/evidence/bt3/01-clean-machine-test.txt` (clone vào thư mục trống, 2 lệnh, 4 service healthy/exited 0), `03-db-init-first-run.txt`, `05-npm-test-in-container.txt` (36/36 PASS), `06-db-init-rerun-idempotent.txt` (chạy lại nạp 0 dòng).

---

### 2.7. BUG-07: `docker compose up` lỗi phân tích YAML do chuỗi `${VAR:?…}` chứa dấu hai chấm

1. **ID và Severity:** `BUG-07` | Mức độ: `Major` — chặn hoàn toàn việc khởi động hệ thống (không service nào được tạo). Phát hiện trước khi gắn tag `v1.0` nên chưa ảnh hưởng bản nộp.
2. **Phát hiện bởi:** Phép thử máy trắng lần 1 (buổi 16) — clone vào thư mục trống rồi chạy `docker compose up -d --build`.
3. **Triệu chứng:** `go-yaml load error in scanner at L22.C58: mapping values are not allowed in this context`; lệnh thoát ngay, elapsed 0s.
4. **Cách tái lập:** checkout commit `a5c1a98` → `cp .env.example .env` → `docker compose up -d --build`.
5. **Nguyên nhân gốc:** giá trị `DB_PASSWORD: ${DB_PASSWORD:?DB_PASSWORD chua dat - chay: cp .env.example .env}` không có ngoặc kép; chuỗi `"chay: cp"` chứa `": "` nên trình phân tích YAML hiểu là bắt đầu một mapping mới (cột 58 của dòng 22).
6. **Cách sửa (Root-cause Fix):** bọc ngoặc kép toàn bộ giá trị `"${VAR:?…}"` (3 chỗ: `DB_PASSWORD`, `POSTGRES_PASSWORD`, `JWT_SECRET`) và viết lại thông điệp không có dấu `:`.
7. **Commit và Bằng chứng xác nhận:**
   - **Commit:** [dd8ec9b](https://github.com/chinguyen-mr/smartcrm-2374802010056-part-inventory/commit/dd8ec9bc34ff10c648751ffd0b7cda7ef2583ea8) — `fix(compose): boc ngoac kep chuoi ${VAR:?...} chua dau hai cham gay loi go-yaml khi docker compose up (BUG-07)`
   - **Bằng chứng:** `docker compose --env-file .env.example config --quiet` → exit 0; phép thử máy trắng lần 2 lên đủ 4 service (`docs/evidence/bt3/01-clean-machine-test.txt`).

---

### 2.8. BUG-08: Request không có body làm API trả 500 thay vì 400

1. **ID và Severity:** `BUG-08` | Mức độ: `Minor` — giao diện luôn gửi body nên người dùng vẫn làm được việc; dữ liệu không sai, không lộ (thông báo 500 là thông báo chung). Sai ở chỗ lỗi đầu vào bị báo là lỗi máy chủ.
2. **Phát hiện bởi:** Chạy script thu ví dụ thật cho API docs (buổi 16) — gửi `POST /api/stock/receipts` không kèm body.
3. **Triệu chứng:** HTTP 500 `{"error":"INTERNAL_ERROR",…}`; log máy chủ: `TypeError: Cannot read properties of undefined (reading 'center_id') at StockValidator.validateReceiptInput (/app/src/validators/stock.validator.js:11:28)`.
4. **Cách tái lập:** lấy token QLTT → `curl -X POST http://localhost:3000/api/stock/receipts -H "Authorization: Bearer <token>"` (không `-d`). Cùng lỗi với mọi endpoint nhận body (`/api/stock/issues`, `/api/stock/thresholds`, `POST`/`PUT /api/parts`) hoặc khi gửi sai `Content-Type`.
5. **Nguyên nhân gốc:** từ Express 5, `req.body` là `undefined` (không còn là `{}`) khi request không có body mà `express.json()` xử lý được; các validator và `part.service` destructure trực tiếp `req.body`.
6. **Cách sửa (Root-cause Fix):** trong `server.js`, ngay sau `express.json()` thêm middleware chuẩn hóa `req.body` rỗng thành `{}` — sửa một chỗ cho mọi route, validator trả `400 DU_LIEU_KHONG_HOP_LE` liệt kê đủ các trường thiếu.
7. **Commit và Bằng chứng xác nhận:**
   - **Commit:** [fa8ebdb](https://github.com/chinguyen-mr/smartcrm-2374802010056-part-inventory/commit/fa8ebdb6f8b872886c68c0448bc462dd2822c26b) — `fix(api): chuan hoa req.body rong thanh {} de request thieu body tra 400 thay vi 500 tren Express 5 (BUG-08)`
   - **Bằng chứng:** integration test mới `API-IT-08` PASS; `docs/evidence/bt3/10-api-capture.json` mục `nobody-400` trả 400 với `fields` gồm `center_id`, `part_id`, `quantity`.

---

### 2.9. BUG-09: Tham số id trên đường dẫn và ngày lọc sai định dạng làm API trả 500

1. **ID và Severity:** `BUG-09` | Mức độ: `Minor` — không ảnh hưởng luồng chính trên giao diện, không sai/lộ dữ liệu; lỗi đầu vào bị báo thành lỗi máy chủ.
2. **Phát hiện bởi:** Kiểm thử giá trị biên khi viết bảng mã lỗi cho API docs (buổi 16).
3. **Triệu chứng:** `GET /api/parts/abc` → 500; `GET /api/stock/transactions?center_id=1&from=khong-phai-ngay` → 500 (thông báo chung `INTERNAL_ERROR`).
4. **Cách tái lập:** lấy token bất kỳ → gọi 2 URL trên; tương tự với `PUT`/`DELETE /api/parts/abc`.
5. **Nguyên nhân gốc:** route dùng `Number(req.params.id)` → `NaN` và chuyển nguyên chuỗi `from`/`to` xuống câu SQL; PostgreSQL từ chối ép kiểu `bigint`/`timestamptz` và lỗi rơi vào nhánh 500 của `errorHandler`.
6. **Cách sửa (Root-cause Fix):** thêm `src/backend/src/validators/common.validator.js` với `parsePositiveId` (số nguyên dương) và `parseOptionalDate` (`YYYY-MM-DD` hợp lệ); dùng ở 3 route `/api/parts/:id` và route `/api/stock/transactions`; trả `400 DU_LIEU_KHONG_HOP_LE` kèm `fields`.
7. **Commit và Bằng chứng xác nhận:**
   - **Commit:** [95038b0](https://github.com/chinguyen-mr/smartcrm-2374802010056-part-inventory/commit/95038b0869ec0edae178a90704def9a31240bbf8) — `fix(api): kiem tra id duong dan va ngay from/to truoc khi truy van, tra 400 thay vi 500 (BUG-09)`
   - **Bằng chứng:** integration test mới `API-IT-09`, `API-IT-10` PASS; toàn bộ 36/36 test PASS trong container (`docs/evidence/bt3/05-npm-test-in-container.txt`).