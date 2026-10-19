# Khai báo sử dụng công cụ AI (AI Disclosure)

Tài liệu này ghi nhận phạm vi và cách thức sử dụng công cụ AI trong quá trình chuẩn bị tài liệu và triển khai mã nguồn cho **Bài tập 1 (BT1)** và **Bài tập 2 (BT2)** thuộc học phần Chuyên đề Tốt nghiệp 1 (Track SE – Luồng L5 Kho linh kiện thay thế).

---

## 1. Công cụ và phạm vi sử dụng

| Công cụ | Phiên bản / Môi trường | Phạm vi sử dụng | Thành phần chịu ảnh hưởng | Cách con người kiểm chứng |
|---|---|---|---|---|
| **ChatGPT** | GPT-4o | Hỗ trợ cấu trúc tài liệu ban đầu, phác thảo Use Case, kiến trúc 3 lớp và mô hình dữ liệu từ tài liệu case study nguồn. | `docs/srs.md`, `docs/use-cases.md`, `docs/architecture.md`, `docs/api-contract.md` | Đối chiếu từng Use Case với tài liệu SRS và Case Study Mekong Mobile; rà soát chuẩn hóa mã truy vết US/UC/FR. |
| **Antigravity IDE / Agent** | Claude 3.7 Sonnet / Gemini | Hỗ trợ phân tích mâu thuẫn giữa DDL, ERD và SRS; sinh mã khung (scaffolding) cho backend layered architecture, script migrate/seed dữ liệu lớn, bộ unit/integration test, và các màn hình React Vite (M1, M2, M3). | `src/backend/`, `db/sql-ddl.sql`, `src/frontend/`, `docs/thay-doi-thiet-ke.md`, `README.md` | - Chạy `npm run migrate` và `npm run seed` kiểm tra 100% bản ghi.<br>- Chạy `npm test` độc lập, xác nhận 31/31 test pass (22 unit + 9 integration).<br>- Chạy `npm run build` trên frontend, xác nhận 0 lỗi compile/bundle.<br>- Kiểm tra thủ công giao diện M1, M2, M3 kết nối backend API. |

---

## 2. Chi tiết phạm vi hỗ trợ và kiểm chứng theo từng giai đoạn (BT2)

### Giai đoạn 2 & 3: Kiến trúc Backend & DDL / Migration / Seed
- **Hỗ trợ từ AI:**
  - Thiết kế cấu trúc thư mục 3 lớp (`src/config`, `src/errors`, `src/repositories`, `src/services`, `src/controllers`, `src/routes`, `src/middleware`).
  - Viết script `migrate.js` thực thi `sql-ddl.sql` và `seed.js` nạp hơn 17.000 dòng dữ liệu từ 5 file CSV mẫu.
  - Xử lý khóa ngoại vòng giữa `ticket_part` và `part_transaction` bằng quy trình chèn 3 bước.
- **Cách con người kiểm chứng:**
  - Chạy migration trên PostgreSQL 16 local, kiểm tra schema tạo đầy đủ 6 bảng, 6 index và 1 circular FK.
  - Chạy seed script lần 1: kiểm tra số lượng bản ghi bằng truy vấn `COUNT(*)` (6 trung tâm, 180 linh kiện, 717 tồn kho, 7.805 phiếu, 4.063 phiếu-linh kiện, 4.954 giao dịch).
  - Chạy seed script lần 2: xác minh tính **idempotent** (0 bản ghi mới, 0 lỗi phát sinh).

### Giai đoạn 4 & 5: Hiện thực Nghiệp vụ & Bộ Kiểm thử
- **Hỗ trợ từ AI:**
  - Viết `IssueService` với cơ chế khóa bi quan `SELECT ... FOR UPDATE` chống race condition và xuất vượt tồn.
  - Viết `StockService` với quy tắc cảnh báo QT-09 (`quantity < min_threshold AND min_threshold > 0`).
  - Viết `TicketAdapter` xác thực tính hợp lệ của mã phiếu và trạng thái cho phép (`DA_PHAN_CONG`, `DANG_XU_LY`, `CHO_LINH_KIEN`).
  - Sinh 31 ca kiểm thử bao quát ca đúng, ca biên và ca sai.
- **Cách con người kiểm chứng:**
  - Chạy `npm test` tại `src/backend`. Kết quả: `31 passing` trong 1 lệnh duy nhất.
  - Đọc và rà soát từng file test trong `src/backend/tests/unit/` và `src/backend/tests/integration/` để đảm bảo không dùng mock giả tạo kết quả mà kiểm thử logic thật.

### Giai đoạn 6 & 7: Xây dựng Frontend React & Kiểm thử Toàn trình
- **Hỗ trợ từ AI:**
  - Khởi tạo dự án React 19 + Vite, cấu hình proxy `/api` đến backend cổng 3000.
  - Xây dựng lớp gọi API tập trung `src/api/client.js`.
  - Xây dựng 3 màn hình: M1 (Tra cứu tồn kho & cảnh báo), M2 (Ghi nhận nhập kho), M3 (Ghi nhận xuất kho).
  - Áp dụng Vanilla CSS hiện đại, trực quan, hỗ trợ 4 trạng thái (Loading, Empty, Error, Success).
- **Cách con người kiểm chứng:**
  - Chạy `npm run build` tại `src/frontend`: build thành công, sinh bundle sạch trong `dist/`.
  - Khởi động backend và frontend đồng thời, thao tác tra cứu, nhập kho và xuất kho thực tế trên trình duyệt.

---

## 3. Quyết định kỹ thuật của sinh viên (Human Judgment)

1. **Ranh giới module L5 và `ticket_ref`:** Xác định L5 là module quản trị kho, không kiêm nhiệm quản lý vòng đời phiếu bảo hành. Bảng `ticket_ref` được quy định rõ là bảng tham chiếu mô phỏng nội bộ cho prototype.
2. **Loại bỏ bảng `employee`:** Không lưu nhân viên dư thừa trong schema của L5 vì thông tin người dùng được trích xuất từ JWT token claim của hệ thống xác thực tập trung.
3. **Quy tắc ngưỡng `min_threshold`:** Chốt `NOT NULL DEFAULT 0` và giá trị `0` là chưa cấu hình cảnh báo, loại bỏ hoàn toàn giá trị `NULL` để câu lệnh SQL tường minh và hiệu năng cao.
4. **Cơ chế phân quyền:** Chặn truy cập chéo trung tâm (`QT-14`) ngay tại Service layer bằng cách so khớp `centerId` của người dùng đăng nhập với `centerId` của tài nguyên yêu cầu, trả mã lỗi `403 FORBIDDEN`.

---

## 4. Cam kết của sinh viên

Tôi xác nhận đã trực tiếp chỉ đạo, rà soát, kiểm thử và chịu trách nhiệm hoàn toàn về toàn bộ mã nguồn, cấu trúc dữ liệu và tài liệu kỹ thuật trong repository này.

- **Sinh viên thực hiện:** Nguyễn Văn Chí
- **MSSV:** 2374802010056
- **Lớp / Khóa:** K29 – Track SE
- **Đại học:** Trường Đại học Văn Lang – Khoa Công nghệ Thông tin
- **Ngày xác nhận:** 19/10/2026
