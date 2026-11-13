# Checklist bảo mật — Smart CRM L5 (BT3, tag `v1.0`)

**Track:** SE · **Luồng:** L5 – Kho linh kiện thay thế · **Ngày tự đánh giá:** 13/11/2026  
**Cách điền:** mỗi mục ghi `ĐÃ LÀM` / `CHƯA LÀM` / `KHÔNG ÁP DỤNG` kèm minh chứng kiểm chứng được (tệp, lệnh đã chạy + kết quả, ảnh chụp). Log gốc của các lệnh nằm ở [`docs/evidence/bt3/`](evidence/bt3/); ảnh chụp ở [`docs/screenshots/`](screenshots/).

## Bảng tổng hợp

| # | Mục | Trạng thái | Minh chứng một dòng |
|---|---|---|---|
| 1 | Không có secret trong repo | **ĐÃ LÀM** | `git log --all --oneline -- .env` → rỗng; `JWT_SECRET`, `DB_PASSWORD` chỉ đọc từ biến môi trường; khóa dev mặc định cũ đã gỡ khỏi mã ở commit [a5c1a98](https://github.com/chinguyen-mr/smartcrm-2374802010056-part-inventory/commit/a5c1a98) — `evidence/bt3/07-secret-scan.txt` |
| 2 | Kiểm tra dữ liệu vào ở tầng ứng dụng | **ĐÃ LÀM** | `src/backend/src/validators/stock.validator.js`, `common.validator.js`; 3 lệnh grep chống injection: grep 2 và 3 rỗng, grep 1 có 3 kết quả đã giải thích là an toàn (2 câu SQL chỉ ghép placeholder, 1 chuỗi thông báo UI); test `TC-07`, `TC-18`, `API-IT-08..10` trả 400 |
| 3 | Kiểm soát truy cập theo quyền sở hữu | **ĐÃ LÀM** (có hạn chế ghi rõ) | Kiểm tra trung tâm (QT-14) ở tầng service + `requireRole`; `TC-08`, `TC-08b` (403 khi truy cập trung tâm khác), `TC-14` (KTV đặt ngưỡng → 403). Hạn chế: `POST /api/auth/token` là endpoint thử nghiệm cấp token cho mọi vai trò |
| 4 | Băm / mã hóa mật khẩu và dữ liệu nhạy cảm | **KHÔNG ÁP DỤNG** | Hệ thống không lưu mật khẩu: DDL `sql/sql-ddl.sql` không có cột mật khẩu nào; xác thực bằng JWT ký HS256 với khóa trong biến môi trường |
| 5 | Thông báo lỗi không lộ cấu trúc bên trong | **ĐÃ LÀM** | `errorHandler.js` trả `INTERNAL_ERROR` chung, chi tiết chỉ ghi log máy chủ; `/api/health` không còn trả `error.message`; `/api/db-test` không còn trả tên CSDL; ảnh `TC-18-before.png` |
| 6 | Log không ghi mật khẩu, token, dữ liệu cá nhân thừa | **ĐÃ LÀM** | Không có middleware log request; `errorHandler` chỉ log `path, method, message, stack`, không log body/header; grep `console.*(req.body|token|password|authorization)` → rỗng |
| 7 | Ghim phiên bản phụ thuộc + kiểm lỗ hổng | **ĐÃ LÀM** | `package-lock.json` của backend và frontend đã commit, Docker dùng `npm ci`; `npm audit`: trước 1 high + 1 moderate → sửa ở commit [3afeb97](https://github.com/chinguyen-mr/smartcrm-2374802010056-part-inventory/commit/3afeb97) → `found 0 vulnerabilities` — `evidence/bt3/08-npm-audit.txt` |

---

## Chi tiết từng mục

### 1. Không có secret trong repo — ĐÃ LÀM

- **Lệnh và kết quả** (`docs/evidence/bt3/07-secret-scan.txt`):
  - `git log --all --oneline -- .env` → **không ra dòng nào** (`.env` chưa từng được commit).
  - `git ls-files | grep '\.env$'` → rỗng; `.gitignore` dòng 2 là `.env`; `.dockerignore` loại `.env` khỏi image.
  - Quét lịch sử `git log -p --all` tìm `PASSWORD|SECRET|API_KEY` có gán giá trị: chỉ còn **giá trị mẫu** (`change_me_local_db_password`, `change-me-please-use-…`) và **mật khẩu dùng một lần của CI** (`postgrespassword`, `supersecretjwtkeyforci123` → nay `ci-only-throwaway-…`) — các giá trị này chỉ tồn tại trong máy ảo GitHub Actions bị hủy sau mỗi lần chạy, không bảo vệ hệ thống thật nào.
- **Phát hiện và xử lý trung thực:** trước BT3, mã nguồn có **khóa JWT mặc định** `smartcrm_jwt_secret_dev_2026` (fallback trong `auth.middleware.js`, giá trị mặc định trong `docker-compose.yml` và README). Vì repo PUBLIC, bất kỳ ai cũng có thể dùng khóa này ký token hợp lệ cho mọi môi trường không đặt `JWT_SECRET`. Đã xử lý ở commit [a5c1a98](https://github.com/chinguyen-mr/smartcrm-2374802010056-part-inventory/commit/a5c1a98):
  - Gỡ fallback; backend **dừng ngay khi khởi động** nếu `JWT_SECRET` thiếu hoặc ngắn hơn 32 ký tự.
  - `docker-compose.yml` dùng `${JWT_SECRET:?…}` và `${DB_PASSWORD:?…}` — thiếu biến thì compose từ chối chạy, không còn giá trị mặc định.
  - Gỡ mật khẩu mặc định `"123"` trong `src/backend/src/config/db.js`.
  - **Đổi khóa:** `JWT_SECRET` trong `.env` cục bộ của sinh viên đã được thay bằng khóa ngẫu nhiên 64 ký tự hex (khóa cũ coi như đã lộ).
- **Ảnh cần chụp:** `docs/screenshots/BT3-07-secret-scan.png` — cửa sổ terminal chạy `git log --all --oneline -- .env` (kết quả rỗng).

### 2. Dữ liệu vào được kiểm tra ở tầng ứng dụng — ĐÃ LÀM

- **Validator tầng ứng dụng** (không chỉ dựa vào ràng buộc CSDL):
  - `src/backend/src/validators/stock.validator.js`: kiểm `center_id`, `part_id`, `quantity` là số nguyên dương ≤ 2.147.483.647, `ticket_code` bắt buộc, `reference` ≤ 80 ký tự, `min_threshold` ≥ 0.
  - `src/backend/src/validators/common.validator.js` (mới, BUG-09): id trên đường dẫn phải là số nguyên dương; `from`/`to` phải là ngày `YYYY-MM-DD`.
  - `server.js`: giới hạn body JSON 100 kB; chuẩn hóa body rỗng để trả 400 thay vì 500 (BUG-08).
- **Ba lệnh grep chống injection** (tài liệu tự học buổi 15, mục A4), chạy trên `src/`:
  | Lệnh | Kết quả | Kết luận |
  |---|---|---|
  | `grep -rnE '(SELECT\|INSERT\|UPDATE\|DELETE).*(\+ *[a-zA-Z_]\|\$\{)' src/` | 3 dòng: `part.repository.js:14` và `transaction.repository.js:48` (chèn `${whereClause}`), `StockIssueScreen.jsx:77` (chuỗi thông báo UI, không phải SQL) | **An toàn**: `whereClause` chỉ ghép tên cột cố định và placeholder `$1, $2…`; mọi giá trị người dùng đi qua mảng `params` của `pg` |
  | `grep -rnE "innerHTML\|dangerouslySetInnerHTML\|v-html" src/` | rỗng | React tự thoát ký tự |
  | `grep -rnE 'exec\(\|execSync\|spawn\(\|os\.system\|shell=True' src/` | rỗng | Không gọi lệnh hệ thống |
- **Test chứng minh:** `TC-07` (`quantity:-5` → 400), `TC-18` (`quantity` vượt INT → 400), `API-IT-08` (không có body → 400), `API-IT-09` (`/api/parts/abc` → 400), `API-IT-10` (`from` sai → 400).
- **Ảnh cần chụp:** `docs/screenshots/BT3-02-grep-injection.png` — terminal chạy 3 lệnh grep.

### 3. Kiểm soát truy cập — ĐÃ LÀM (có hạn chế ghi rõ)

- **Đã làm:**
  - Mọi endpoint nghiệp vụ yêu cầu JWT (`requireAuth`); token được xác thực với **thuật toán chỉ định rõ** `algorithms: ['HS256']` (chặn `alg: none`), hạn dùng 1 giờ.
  - Phân quyền theo vai trò (`requireRole('QUAN_LY_TRUNG_TAM')`) cho nhập kho, đặt ngưỡng, thêm/sửa/xóa linh kiện.
  - Phân quyền theo **trung tâm sở hữu dữ liệu** (QT-14) ở tầng service: `user.centerId` trong token phải bằng `center_id` của yêu cầu, nếu không → `403 FORBIDDEN` (OWASP A01).
  - Payload token chỉ có `userId, username, role, centerId, iat, exp` — không có dữ liệu cá nhân.
  - CORS chỉ mở cho các nguồn trong biến `CORS_ORIGINS` (không dùng `origin: "*"`).
- **Test chứng minh:** `TC-08` (KTV TT01 xuất kho TT02 → 403, dữ liệu TT02 không đổi), `TC-08b` (đọc tồn kho TT02 → 403), `TC-14` (KTV đặt ngưỡng → 403), `TC-12` (không token → 401), `TC-13` (token giả chữ ký → 401), unit test `TC22-Negative`.
- **Hạn chế (chưa làm, ghi trung thực):** `POST /api/auth/token` là endpoint **thử nghiệm** — ai gọi được API đều có thể xin token vai trò bất kỳ cho trung tâm bất kỳ. Hệ thống tài khoản/mật khẩu nằm ngoài phạm vi luồng L5 của prototype. Đây là việc **bắt buộc** phải thay bằng đăng nhập thật trước khi triển khai công khai (ghi trong Deployment Guide mục 6 và API docs endpoint 4).

### 4. Băm hoặc mã hóa mật khẩu / dữ liệu nhạy cảm — KHÔNG ÁP DỤNG

- **Lý do:** hệ thống **không lưu mật khẩu** ở bất kỳ đâu — `sql/sql-ddl.sql` (7 bảng) không có cột mật khẩu (`grep -i "password\|hash" sql/sql-ddl.sql` → rỗng); không có chức năng đăng ký/đăng nhập bằng mật khẩu.
- Dữ liệu có tính định danh duy nhất là `employee.full_name` (họ tên kỹ thuật viên trong bộ dữ liệu giả lập của case study), không phải mức "nhạy cảm" theo phân loại của tài liệu buổi 15 nên không mã hóa. Không có số điện thoại, email hay địa chỉ khách hàng trong luồng L5.
- Khi bổ sung đăng nhập thật (xem mục 3), mật khẩu phải băm bằng bcrypt/argon2.

### 5. Thông báo lỗi không lộ cấu trúc bên trong — ĐÃ LÀM

- `src/backend/src/middleware/errorHandler.js`: lỗi nghiệp vụ trả `{ error, message, fields }`; lỗi ngoài dự kiến trả **chung** `{"error":"INTERNAL_ERROR","message":"Hệ thống gặp sự cố ngoài dự kiến…"}` — không có stack trace, tên bảng, chuỗi kết nối. Chi tiết chỉ ghi `console.error` phía máy chủ.
- Sửa trong BT3: `GET /api/health` trước đây trả `error.message` của driver PostgreSQL khi mất kết nối (có thể chứa host/cổng CSDL) → nay chỉ trả `{"status":"DOWN","database":"DISCONNECTED"}`; `GET /api/db-test` không còn trả tên CSDL.
- **Minh chứng:** ảnh `TC-18-before.png` (lỗi 500 chỉ có thông báo chung); `docs/evidence/bt3/10-api-capture.json` (mọi phản hồi lỗi của 15 endpoint).
- Lưu ý: thông báo 403 có nêu mã trung tâm của chính người dùng (`Người dùng thuộc trung tâm #1`) — là thông tin của người gọi, có chủ ý để giao diện hiển thị.

### 6. Nhật ký hệ thống an toàn — ĐÃ LÀM

- Backend không dùng middleware ghi log request (không có morgan/winston), nên **body, header `Authorization` và token không bao giờ được ghi**.
- `errorHandler.js` chỉ ghi `timestamp, path, method, message, stack` cho lỗi 500; healthcheck chỉ ghi mã lỗi (`error.code`).
- **Lệnh:** `grep -rnE "console\.(log|error|warn).*(req\.body|token|password|authorization)" src/backend` → **rỗng**.
- Hạn chế: thông điệp lỗi PostgreSQL trong log có thể chứa giá trị người dùng nhập (ví dụ giá trị sai kiểu) — không chứa mật khẩu hay token.

### 7. Phụ thuộc được ghim phiên bản và kiểm lỗ hổng — ĐÃ LÀM

- `src/backend/package-lock.json` và `src/frontend/package-lock.json` đã commit; cả hai Dockerfile cài bằng `npm ci` (cài đúng phiên bản trong lockfile). Image nền ghim phiên bản: `postgres:16-alpine`, `node:20-alpine`, `nginx:1.27-alpine`.
- `npm audit` (log: `docs/evidence/bt3/08-npm-audit.txt`):
  - Backend trước khi sửa: **2 lỗ hổng** — `body-parser 2.0.0–2.3.0` (high, DoS, GHSA-27r3-jxmh-p828) và `qs 6.7.0–6.16.0` (moderate, DoS, GHSA-6pq8-jhm2-2vcw), đều là phụ thuộc gián tiếp của Express 5.
  - Đã chạy `npm audit fix` (lên `body-parser 2.4.0`, `qs 6.17.1`), 36/36 test PASS, commit [3afeb97](https://github.com/chinguyen-mr/smartcrm-2374802010056-part-inventory/commit/3afeb97) → `found 0 vulnerabilities`.
  - Frontend: `found 0 vulnerabilities`.
- Hạn chế: `package.json` vẫn dùng khoảng `^x.y.z`; phiên bản thực tế được khóa bởi lockfile.
- **Ảnh cần chụp:** `docs/screenshots/BT3-08-npm-audit.png`.

---

## Checklist tự kiểm track SE (tài liệu tự học buổi 15, mục A6)

| Mục | Kết quả |
|---|---|
| Đã chạy 3 lệnh grep ở A4 và ghi vào checklist | ✅ mục 2 |
| `JWT_SECRET` từ biến môi trường, ≥ 32 ký tự, hệ thống dừng khi thiếu | ✅ `auth.middleware.js` dòng 4–9 |
| Xác thực token chỉ định rõ thuật toán, không dùng `decode` để phân quyền | ✅ `jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] })` |
| Payload token chỉ có id, vai trò, thời hạn | ✅ (thêm `centerId`, `username` thử nghiệm — không phải dữ liệu cá nhân) |
| Kiểm soát truy cập theo chủ sở hữu, có test case OWASP A01 | ✅ `TC-08`, `TC-08b` |
| CORS chỉ mở cho nguồn trong biến môi trường | ✅ `CORS_ORIGINS` trong `server.js` |
| Cookie có HttpOnly/SameSite/Secure | Không áp dụng — hệ thống không dùng cookie (token gửi qua header `Authorization`) |
| Không có secret/token/mật khẩu trong URL | ✅ frontend gửi token qua header (`src/frontend/src/api/client.js:54`); không endpoint nào nhận token qua query |
| Thông báo lỗi không chứa stack trace, tên bảng, chuỗi kết nối | ✅ mục 5 |
| API docs mô tả đủ mọi endpoint, mỗi endpoint đủ 7 mục, có ví dụ THẬT | ✅ `docs/api-docs.md` — 15/15 endpoint |
| Deployment Guide có mục bật HTTPS khi triển khai thật | ✅ `docs/deployment-guide.md` mục 6 |
