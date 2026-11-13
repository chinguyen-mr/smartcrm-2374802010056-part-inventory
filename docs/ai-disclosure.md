# Khai báo sử dụng công cụ AI (AI Disclosure)

Tài liệu này ghi nhận phạm vi và cách thức sử dụng công cụ AI trong quá trình chuẩn bị tài liệu và triển khai mã nguồn cho **Bài tập 1 (BT1)** và **Bài tập 2 (BT2)** thuộc học phần Chuyên đề Tốt nghiệp 1 (Track SE – Luồng L5 Kho linh kiện thay thế).

---

## 1. Công cụ và phạm vi sử dụng

| Công cụ | Phiên bản / Môi trường | Phạm vi sử dụng | Thành phần chịu ảnh hưởng | Cách con người kiểm chứng |
|---|---|---|---|---|
| **ChatGPT** | GPT-4o | Hỗ trợ cấu trúc tài liệu ban đầu, phác thảo Use Case, kiến trúc 3 lớp và mô hình dữ liệu từ tài liệu case study nguồn. | `docs/srs.md`, `docs/use-cases.md`, `docs/architecture.md`, `docs/api-contract.md` | Đối chiếu từng Use Case với tài liệu SRS và Case Study Mekong Mobile; rà soát chuẩn hóa mã truy vết US/UC/FR. |
| **Antigravity IDE / Agent** | Claude 3.7 Sonnet / Gemini | Hỗ trợ phân tích mâu thuẫn giữa DDL, ERD và SRS; sinh mã khung (scaffolding) cho backend layered architecture, script migrate/seed dữ liệu lớn, bộ unit/integration test, và các màn hình React Vite (M1, M2, M3). | `src/backend/`, `sql/sql-ddl.sql`, `src/frontend/`, `docs/thay-doi-thiet-ke.md`, `README.md` | - Chạy `npm run migrate` và `npm run seed` kiểm tra 100% bản ghi.<br>- Chạy `npm test` độc lập, xác nhận 31/31 test pass (22 unit + 9 integration).<br>- Chạy `npm run build` trên frontend, xác nhận 0 lỗi compile/bundle.<br>- Kiểm tra thủ công giao diện M1, M2, M3 kết nối backend API. |

---

## 2. Chi tiết phạm vi hỗ trợ và kiểm chứng theo từng giai đoạn (BT2)

### Giai đoạn 2 & 3: Kiến trúc Backend & DDL / Migration / Seed
- **Hỗ trợ từ AI:**
  - Thiết kế cấu trúc thư mục 3 lớp (`src/config`, `src/errors`, `src/repositories`, `src/services`, `src/controllers`, `src/routes`, `src/middleware`).
  - Viết script `migrate.js` thực thi `sql/sql-ddl.sql` và `seed.js` nạp hơn 17.000 dòng dữ liệu từ 6 file CSV mẫu (bao gồm `technicians.csv`).
  - Xử lý khóa ngoại vòng giữa `ticket_part` và `part_transaction` bằng quy trình chèn 3 bước.
- **Cách con người kiểm chứng:**
  - Chạy migration trên PostgreSQL 16 local, kiểm tra schema tạo đầy đủ 7 bảng, 6 index và 1 circular FK.
  - Chạy seed script lần 1: kiểm tra số lượng bản ghi bằng truy vấn `COUNT(*)` (6 trung tâm, 38 nhân viên, 180 linh kiện, 717 tồn kho, 7.805 phiếu, 4.063 phiếu-linh kiện, 4.954 giao dịch).
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

### Giai đoạn Buổi 14: Kiểm thử thực nghiệm, Rà soát tài liệu & Audit Bảo mật
- **Hỗ trợ từ AI:**
  - Hỗ trợ xây dựng kế hoạch kiểm thử độc lập gồm 18 ca thực nghiệm bao quát đủ 5 nhóm: Luồng đúng, Giá trị biên, Dữ liệu sai, Bảo mật & Cô lập đa trung tâm (OWASP A01/RBAC), và Tái lập/Bất biến.
  - Thực thi kiểm thử fuzzing và kịch bản bảo mật chuyên sâu (OWASP A01 BOLA, SQL Injection, Race Condition, giá trị biên cực hạn 32-bit integer).
  - Tự động hóa kết xuất các ảnh minh chứng tại `docs/screenshots/` (`TC-01.png` – `TC-17.png`, `TC-18-before.png`, `TC-18-after.png`): Các ảnh này do script kết xuất từ output thực tế của lệnh curl chạy trên máy chủ local; khung cửa sổ và dòng `PS D:\...>` là mô phỏng giao diện terminal, không phải ảnh chụp màn hình từ cửa sổ PowerShell do sinh viên gõ tay. Toàn bộ HTTP status, headers, body JSON tiếng Việt UTF-8 và số liệu CSDL trước/sau đều phản ánh chính xác kết quả thực thi lệnh thật.
- **Cách con người kiểm chứng:**
  - Đối chiếu mã lỗi `DU_LIEU_KHONG_HOP_LE` trong mã nguồn gốc `src/backend/src/errors/AppError.js` và `stock.validator.js`, quyết định hoàn tác code không cần thiết và hiệu chỉnh kỳ vọng trong Test Plan nhằm bảo toàn thiết kế chuẩn.
  - Giải mã độc lập payload token JWT và tự tính toán số byte Content-Length UTF-8 cho từng phản hồi HTTP (đặc biệt các ký tự tiếng Việt có dấu) để xác minh tính xác thực tuyệt đối của dữ liệu kiểm thử.
  - Rà soát nguyên nhân gốc của lỗi BUG-05 (tràn số 32-bit `INTEGER` PostgreSQL cả ở giá trị nhập đơn lẻ và tổng tồn sau cộng `currentQty + quantity > 2147483647`), bổ sung 2 unit test (`TC14B-Negative`, `TC14C-Negative`).
  - Chạy lệnh kiểm thử tự động `npm test` đạt 33/33 ca PASS (100% không có lỗi).
  - Trực tiếp rà soát và nghiệm thu toàn bộ tài liệu Test Plan, Test Report, Bug Log, Thiết kế thay đổi trước khi hoàn tất báo cáo.

---

## 3. Quyết định kỹ thuật của sinh viên (Human Judgment)

1. **Ranh giới module L5 và `ticket_ref`:** Xác định L5 là module quản trị kho, không kiêm nhiệm quản lý vòng đời phiếu bảo hành. Bảng `ticket_ref` được quy định rõ là bảng tham chiếu mô phỏng nội bộ cho prototype có bổ sung cột `status` để xác minh trạng thái cho phép xuất kho.
2. **Bổ sung và chuẩn hóa bảng `employee` (Theo góp ý Giảng viên):** Tiếp thu góp ý của Giảng viên hướng dẫn (G1, G2), nhóm đã bổ sung bảng `employee` (38 nhân sự kỹ thuật từ dataset `technicians.csv`) vào DDL 7 bảng và ERD để làm rõ tác nhân thao tác kho L5 (KTV và QLTT), đồng thời phân quyền chính xác theo trung tâm (QT-14).
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

---

## 5. Phụ lục — Bảng khai báo sử dụng AI giai đoạn 3 (BT3: buổi 13–16)

| Công cụ AI | Đã dùng AI vào việc gì | Phần kết quả trong repo có sự hỗ trợ của AI | Sinh viên kiểm chứng bằng cách nào |
|---|---|---|---|
| Công cụ AI ghi ở mục 2 – "Giai đoạn Buổi 14" | Lập kế hoạch 18 ca kiểm thử, chạy kịch bản curl, kết xuất ảnh minh chứng từ output thật, phân tích BUG-05 | `docs/test-plan.md`, `docs/test-report.md`, `docs/screenshots/TC-*.png`, BUG-05 trong `docs/bug-log.md`, `TC14B/TC14C` | Như mục 2 – Giai đoạn Buổi 14 (đối chiếu mã lỗi, tự tính Content-Length, `npm test` 33/33) |
| Claude Code (Anthropic) | Đọc yêu cầu buổi 14–16; rà gói Docker theo tiêu chí C1–C9; sửa đóng gói (`db-init`, Dockerfile, compose); bổ sung bảo mật (JWT bắt buộc ≥ 32 ký tự, HS256, CORS allow-list); phát hiện và sửa BUG-06 – BUG-09; chạy phép thử máy trắng và `npm audit`; soạn nháp Deployment Guide, API docs, checklist bảo mật | `docker-compose.yml`, `src/backend/Dockerfile`, `.dockerignore`, `.gitattributes`, `src/backend/scripts/bootstrap.js`, `auth.middleware.js`, `server.js`, `validators/common.validator.js`, test `API-IT-08..10`; `docs/deployment-guide.md`, `docs/api-docs.md`, `docs/checklist-bao-mat.md`, BUG-06 – BUG-09, TD-12 – TD-15, `docs/evidence/bt3/` | (1) Tự chạy phép thử máy trắng theo đúng Deployment Guide trong thư mục trống và chụp ảnh `docker compose ps` healthy; (2) chạy `docker compose exec backend npm test` → 36/36 PASS; (3) chạy `docker compose run --rm db-init` hai lần, số dòng không đổi; (4) bấm thử từng link commit trong Bug Log ở cửa sổ ẩn danh; (5) đối chiếu từng endpoint trong `api-docs.md` với `src/backend/src/routes/*.js` (15 route) và gọi thử bằng curl; (6) chạy lại 3 lệnh grep và `npm audit` của checklist bảo mật |

**Nguyên tắc đã áp dụng:** ví dụ request/response trong API docs được chép từ lần chạy thật (`docs/evidence/bt3/10-api-capture.json`), không tự nghĩ ra; mục nào chưa làm được ghi trung thực là hạn chế (endpoint `POST /api/auth/token` thử nghiệm, xem checklist bảo mật mục 3).

**Về ảnh `docs/screenshots/BT3-01` … `BT3-08`:** là ảnh chụp màn hình **cửa sổ Windows PowerShell thật** trên máy sinh viên (Windows 11, Docker 29.9) ngày 13/11/2026. Một script mở cửa sổ, gõ và chạy đúng các lệnh hiển thị trong ảnh, rồi chụp vùng cửa sổ; toàn bộ output là output thật của lệnh, không dựng lại. Ảnh giao diện `BT3-05` chụp bằng Microsoft Edge (headless) mở `http://localhost:8088` của hệ thống đang chạy. Phép thử máy trắng clone trực tiếp từ GitHub (nhánh `main`, commit `c31cfe1`) vào thư mục trống `%TEMP%\kiem-tra`.
