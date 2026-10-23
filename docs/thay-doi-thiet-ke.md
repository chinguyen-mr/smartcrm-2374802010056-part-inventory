# Nhật ký thay đổi thiết kế – Luồng L5 Kho linh kiện thay thế

Tài liệu này ghi nhận toàn bộ các quyết định điều chỉnh kỹ thuật giữa bản thiết kế BT1 và quá trình hiện thực BT2 theo yêu cầu của học phần Chuyên đề Tốt nghiệp 1 (Buổi 7 – Slide 23, Tiêu chí 5).

---

## Bảng tổng hợp các thay đổi kỹ thuật

| Mã | Vấn đề / Phản hồi nguồn | Quyết định Giữ / Sửa | Lý do kỹ thuật | Ảnh hưởng | Trạng thái kiểm chứng |
|:---:|:---|:---:|:---|:---|:---:|
| **TD-01** | Bảng `ticket_ref` trong BT1 chỉ có `(ticket_id, center_id, ticket_code)`, thiếu thông tin trạng thái phiếu để xác minh nghiệp vụ xuất kho. | **Sửa** (Bổ sung cột `status`) | Yêu cầu nghiệp vụ FR4 & UC2 quy định chỉ xuất kho khi phiếu ở trạng thái cho phép. Module L5 xem hệ thống phiếu là bên ngoài và sử dụng `ticket_ref` làm bảng tham chiếu mô phỏng cho `TicketAdapter`. Cột `status` là cần thiết để adapter kiểm tra allowlist. | Thêm cột `status VARCHAR(30) NOT NULL DEFAULT 'DANG_XU_LY'` vào bảng `ticket_ref` trong `db/sql-ddl.sql` và migration. | **ĐÃ KIỂM CHỨNG**: Migration và seed 7.805 phiếu thành công. |
| **TD-02** | Ràng buộc `min_threshold` không thống nhất giữa các bản nháp BT1 (chỗ cho phép NULL, chỗ DEFAULT 0). | **Sửa / Chốt** (`NOT NULL DEFAULT 0`) | Thống nhất quy tắc QT-09: chỉ cảnh báo khi `quantity < min_threshold` và `min_threshold > 0`. Giá trị `0` biểu thị trạng thái mặc định chưa cấu hình ngưỡng (không cảnh báo). Tránh giá trị NULL gây phức tạp câu lệnh truy vấn SQL. | Bảng `part_stock` có cột `min_threshold INTEGER NOT NULL DEFAULT 0 CHECK (min_threshold >= 0)`. | **ĐÃ KIỂM CHỨNG**: Toàn bộ 717 dòng seed có `min_threshold >= 0`. Không có lỗi CHECK. |
| **TD-03** | Khóa ngoại vòng giữa `ticket_part.transaction_id` và `part_transaction.ticket_part_id`. | **Giữ thiết kế DDL**, xử lý trong Seed & Service | Thiết kế BT1 định nghĩa quan hệ 1-1 giữa liên kết phiếu-linh kiện và giao dịch xuất. Nếu nạp đồng thời sẽ vi phạm ràng buộc Foreign Key. | Quy trình ghi dữ liệu: (1) Chèn `ticket_part` với `transaction_id = NULL`; (2) Chèn `part_transaction`; (3) Cập nhật `ticket_part.transaction_id`. | **ĐÃ KIỂM CHỨNG**: Nạp 4.063 giao dịch xuất lịch sử thành công 100%, 0 vi phạm FK. |
| **TD-04** | Tách 3 màn hình giao diện (Wireframe vs Báo cáo). | **Chốt theo chỉ đạo** | Báo cáo và wireframe cũ có sự khác biệt giữa gộp hay tách form nhập/xuất. Quyết định chốt: M1 (Tra cứu tồn kho & cảnh báo), M2 (Nhập kho), M3 (Xuất kho cho phiếu bảo hành). | Frontend React xây dựng 3 màn hình riêng biệt, độc lập, gọi API qua client layer. | **ĐÃ KIỂM CHỨNG**: Đã hiện thực 3 màn hình `StockLookupScreen` (M1), `StockReceiptScreen` (M2), `StockIssueScreen` (M3) trong React 19 + Vite, gọi API thật qua `client.js`, build thành công. |
| **TD-05** | Đề xuất allowlist trạng thái phiếu cho phép xuất kho. | **Đề xuất kỹ thuật (Prototype)** | Cần tiêu chí rõ ràng để `TicketAdapter` từ chối các phiếu không hợp lệ. Đề xuất: `DA_PHAN_CONG`, `DANG_XU_LY`, `CHO_LINH_KIEN`. | Giao dịch xuất kiểm tra điều kiện này; các phiếu `MOI`, `HOAN_TAT`, `DA_DONG`, `DA_HUY` bị từ chối `409 TICKET_STATUS_NOT_ELIGIBLE`. Lưu ý 4.063 phiếu lịch sử trong CSV có trạng thái `DA_DONG` vì là dữ liệu snapshot quá khứ. | **ĐÃ KIỂM CHỨNG**: Đã tạo các phiếu mẫu (active & invalid) trong seed script. |
| **TD-06** | Số lượng User Story trong bản nháp cũ có 8 story (US1–US8), vượt ngưỡng 5–7 story theo quy định của đề bài BT1 (Mục 2.1). | **Sửa** (Chốt 7 User Story cốt lõi cho bản nộp BT1; đưa US8 vào Ngoài phạm vi) | Đề bài BT1 quy định rõ: "≥ 4 FR và 5–7 User Story". US8 (Xem danh sách phiếu chờ linh kiện) có mức ưu tiên COULD và phụ thuộc vào hệ thống phiếu ngoài. Giữ US1–US7 là 7 story cốt lõi bao quát đủ luồng L5, không vi phạm giới hạn story của rubric. | Chuyển US8, FR12, UC9 thành nhóm "Ngoài phạm vi hiện thực chính của BT1 / Đề xuất tương lai". Bảng truy vết FR–US–UC–MoSCoW giữ 11 FR ứng với 7 US, 0 ô trống. | **ĐÃ KIỂM CHỨNG**: Đồng bộ trong `docs/srs.md`, `docs/use-cases.md`, `docs/api-contract.md`. |
| **TD-07** | Số liệu dataset ở Phiếu phạm vi Buổi 2 ghi số ước tính (1.080 part_stock, ~9.400 part_transaction) thay vì số liệu thực tế của bộ dataset chính thức. | **Sửa** (Chuẩn hóa số liệu thực tế và phân biệt rõ số liệu seed prototype) | Nguyên tắc CĐTN1 yêu cầu: "Truy vết được – Tái lập được – Kiểm chứng được". Bộ dataset gốc có 717 dòng `part_stock`, 4.954 dòng `part_transactions`, 180 `parts`, 6 `service_centers`, 7.800 `tickets_history`. Con số 1.080 là tổ hợp lý thuyết ($6 \times 180$); 363 tổ hợp chưa có dòng tồn được hệ thống xử lý mặc định = 0 (G5). | Cập nhật số liệu chuẩn xác trong tài liệu; seed nạp đúng 100% dữ liệu gốc không tự bịa đặt, không làm tròn số. | **ĐÃ KIỂM CHỨNG**: Đối chiếu 100% số dòng giữa `data/sample/*.csv` và dataset gốc `CDTN1_Mekong Mobile_Dataset Smart CRM`. |
| **TD-08** | Sơ đồ kiến trúc mức khái niệm trong BT1 (`architecture.drawio`) chưa thể hiện đầy đủ các thành phần hiện thực của BT2 (thiếu API client, express routes, middleware xác thực/phân quyền). | **Bổ sung** tài liệu kiến trúc hiện thực (`docs/architecture-thuc-te.md`) | Kiến trúc BT1 là sơ đồ phân tầng logic tổng quát. Khi hiện thực BT2 theo Track SE, cần làm rõ luồng phụ thuộc 1 chiều: `UI -> API Client -> Routes -> Middleware -> Services -> Repositories -> PostgreSQL`, đảm bảo Service độc lập HTTP. | Giữ nguyên sơ đồ BT1 làm mốc thiết kế; lập tài liệu `docs/architecture-thuc-te.md` phân tích chi tiết ánh xạ đề xuất → hiện thực. | **ĐÃ KIỂM CHỨNG**: Mã nguồn backend/frontend phân tách đúng 3 lớp, Service không nhận `req/res`, 31/31 test pass. |
| **TD-09** | Chuẩn hóa định dạng phản hồi lỗi API và vòng đời xử lý 401/403 giữa Backend và Frontend (Buổi 9 & 10). | **Chuẩn hóa đồng bộ** (`error`, `message`, `fields`, `details`) | Tài liệu Buổi 9 và yêu cầu Master Prompt quy định lỗi trả về có cấu trúc `{ error, message, fields }`. Tầng `errorHandler` chuyển đổi mảng validation của validator thành object `fields: { [field]: reason }` cho form frontend, bảo toàn `details` cho backward-compatibility. API client bắt mã 401 để xóa token, phát sự kiện `auth:expired` yêu cầu đăng nhập lại; bắt mã 403 để báo không đủ quyền hạn mà không xóa session. | Cập nhật `src/backend/src/middleware/errorHandler.js`, `src/frontend/src/api/client.js`, `src/frontend/src/App.jsx`. | **ĐÃ KIỂM CHỨNG**: 31/31 unit & integration test PASS, Frontend build thành công. |

---

## Chi tiết các quyết định

### TD-01: Bảng `ticket_ref` và ranh giới tích hợp
- **Bản chất:** `ticket_ref` là bảng mô phỏng dữ liệu tham chiếu nội bộ trong prototype của L5, không phải schema chính thức đã chốt của hệ thống phiếu bảo hành bên ngoài.
- **Ranh giới:** Module L5 không tạo phiếu, không sửa phiếu và không cập nhật trạng thái phiếu bảo hành.

### TD-02: Tính Idempotent của Migration và Seed
- Script `npm run migrate` thực hiện dọn dẹp và tái tạo cấu trúc DDL sạch từ `db/sql-ddl.sql`.
- Script `npm run seed` sử dụng mệnh đề `ON CONFLICT DO NOTHING`, cho phép người chấm hoặc lập trình viên chạy lại nhiều lần mà không gặp lỗi và không làm nhân đôi số lượng bản ghi (đáp ứng tiêu chí cốt lõi C5).

### TD-03: Chuẩn hóa 7 User Story và Bảng truy vết BT1 (TD-06)
- Đề bài BT1 Mục 2.1 quy định: 5–7 User Story chuẩn INVEST và Bảng truy vết FR ↔ US ↔ UC ↔ MoSCoW không có ô trống.
- 7 User Story cốt lõi của L5 gồm:
  1. US1 (KTV tra cứu tồn kho theo trung tâm - MUST)
  2. US2 (KTV ghi nhận xuất kho cho phiếu bảo hành - MUST)
  3. US3 (QLTT ghi nhận nhập kho linh kiện - MUST)
  4. US4 (QLTT xem danh sách cảnh báo tồn dưới ngưỡng - SHOULD)
  5. US5 (QLTT thiết lập ngưỡng cảnh báo - SHOULD)
  6. US6 (QLTT xem lịch sử nhập/xuất kho - SHOULD)
  7. US7 (KTV xem danh sách linh kiện đã xuất theo phiếu - SHOULD)
- US8 (Xem danh sách phiếu chờ linh kiện - COULD) được phân loại là chức năng mở rộng tương lai, phụ thuộc vào phân hệ bảo hành ngoài, không đưa vào phạm vi nộp BT1.

### TD-04: Đối chiếu số liệu Dataset chính thức và Xử lý tồn kho rỗng G5 (TD-07)
- Dữ liệu nguồn chính thức từ Mekong Mobile Dataset:
  - `service_centers.csv`: 6 dòng
  - `parts.csv`: 180 dòng
  - `part_stock.csv`: 717 dòng (133 dòng dưới ngưỡng `quantity < min_threshold`, 17 dòng bằng ngưỡng `quantity == min_threshold`, 567 dòng trên ngưỡng `quantity > min_threshold`)
  - `part_transactions.csv`: 4.954 dòng (891 NHAP, 4.063 XUAT)
  - `tickets_history.csv`: 7.800 dòng (toàn bộ 4.063 mã phiếu xuất đều tìm thấy trong tệp này)
- Xử lý 363 cặp trung tâm/linh kiện chưa có trong `part_stock.csv`:
  - Khi tra cứu: Hệ thống tự động hiển thị số lượng tồn = 0 (G5) thông qua mệnh đề `COALESCE(ps.quantity, 0)`.
  - Khi nhập kho lần đầu: Hệ thống sử dụng câu lệnh `INSERT ... ON CONFLICT DO UPDATE` để tự động khởi tạo dòng tồn kho và cập nhật số dư nguyên tử trong cùng một transaction.

### TD-05: Tiến hóa kiến trúc phân lớp và tính độc lập HTTP của Service (TD-08)
- Tách bạch 3 lớp rõ ràng theo tiêu chí C2 và S2:
  - **Routes / Controllers:** Tiếp nhận HTTP request, giải nén tham số, gọi validator, chuyển giao xử lý cho Service, định dạng HTTP response.
  - **Services:** Chứa 100% logic nghiệp vụ (QT-09 kiểm tra tồn/ngưỡng, QT-13 ghi sổ cái bất biến, QT-14 phân quyền trung tâm), hoàn toàn không chứa `req`, `res`, không tự trả mã HTTP status.
  - **Repositories:** Trừu tượng hóa việc truy vấn CSDL PostgreSQL, thực hiện các câu lệnh SQL an toàn (Parameterized Query), khóa dòng `SELECT ... FOR UPDATE` khi xuất kho chống race condition (NFR3).
- Toàn bộ request từ Frontend SPA (React 19) đều thông qua lớp `api/client.js` tập trung, tự động gắn Header `Authorization: Bearer <JWT>`, xử lý chuẩn hóa 3 trạng thái Loading, Empty và Error (có nút Thử lại).

### TD-06: Hiện thực Module cốt lõi đầu tiên của Buổi 8 (Sprint 1)
- **Tiêu chuẩn Buổi 8:** Có ít nhất một entity thực hiện đủ 4 thao tác CRUD qua 3 lớp.
- **Thực tế hiện thực:** Module L5 đã hiện thực vượt mức với 2 thực thể CRUD:
  1. `part` (Danh mục linh kiện): `POST /api/parts` (Create), `GET /api/parts` (Read list & search), `GET /api/parts/:id` (Read detail), `PUT /api/parts/:id` (Update), `DELETE /api/parts/:id` (Delete).
  2. `part_stock` (Số dư tồn kho linh kiện theo trung tâm): `initStock`/`upsertStock` (Create/Update), `findPartsWithStock` (Read), `updateQuantity`/`updateThreshold` (Update), `deleteStock` (Delete).
- Tất cả đều đi qua 3 lớp: Router (`routes/part.routes.js`, `routes/stock.routes.js`) $\rightarrow$ Service (`services/part.service.js`, `services/stock.service.js`) $\rightarrow$ Repository (`repositories/part.repository.js`, `repositories/stock.repository.js`) $\rightarrow$ PostgreSQL.

### TD-07: Chuẩn hóa hợp đồng lỗi và chu trình xác thực Buổi 9 & 10 (TD-09)
- Định dạng lỗi toàn diện tuân thủ Buổi 9: `{ error: string, message: string, fields: object, details: any }`.
- Tầng `errorHandler` tự động bóc tách các vi phạm validation thành key-value trong trường `fields` giúp giao diện dễ dàng đánh dấu trường nhập sai.
- API Client tự động xóa token và phát tín hiệu hết phiên làm việc khi gặp mã `401 Unauthorized`. Giao diện chuyển sang trạng thái cảnh báo và hiển thị nút "Đăng nhập lại".
- Mã `403 Forbidden` hiển thị thông báo phân quyền rõ ràng, không làm mất phiên đăng nhập hiện tại.
