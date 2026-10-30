# Smart CRM – Quản lý kho linh kiện thay thế (Luồng L5)

**Sinh viên:** Nguyễn Văn Chí – MSSV: 2374802010056  
**Track:** SE – Software Engineering  
**Học phần:** Chuyên đề Tốt nghiệp 1 – Khoa CNTT, Trường Đại học Văn Lang  
**Case Study:** Smart CRM – Mekong Mobile  
**Phiên bản:** `v0.2` (Bài tập 2 – Hiện thực hóa module cốt lõi)  
**GitHub:** [smartcrm-2374802010056-part-inventory](https://github.com/chinguyen-mr/smartcrm-2374802010056-part-inventory)

---

## 1. Giới thiệu & Phạm vi nghiệp vụ L5

Module **L5 – Kho linh kiện thay thế** là phân hệ quản lý biến động kho tại các trung tâm bảo hành của Mekong Mobile, bao gồm:
- **M1 – Tra cứu tồn kho & Cảnh báo:** Tra cứu danh mục linh kiện, số lượng tồn và cảnh báo tự động khi số lượng tồn thấp hơn ngưỡng tối thiểu (`quantity < min_threshold`). Hỗ trợ Quản lý trung tâm thiết lập ngưỡng cảnh báo.
- **M2 – Ghi nhận nhập kho:** Ghi nhận số lượng linh kiện nhập kho bổ sung, cập nhật tồn kho tức thời và ghi sổ cái giao dịch bất biến `NHAP`.
- **M3 – Ghi nhận xuất kho theo phiếu:** Xác minh mã phiếu bảo hành hợp lệ, khóa dòng tồn bằng `SELECT ... FOR UPDATE` tránh xuất vượt tồn khi có tranh chấp đồng thời (QT-09), giảm tồn và liên kết giao dịch `XUAT`. Tra cứu danh sách linh kiện đã xuất theo phiếu bảo hành.

---

## 2. Công nghệ sử dụng

- **Frontend:** React 19 + Vite (JavaScript, Vanilla CSS thiết kế hiện đại, responsive).
- **Backend:** Node.js (v20+) + Express.js, kiến trúc 3 lớp phân lập rõ ràng (`routes` $\rightarrow$ `services` $\rightarrow$ `repositories`).
- **Database:** PostgreSQL 15+, toàn vẹn dữ liệu với Foreign Keys, CHECK constraints, và Unique indexes.
- **Kiểm thử:** Node.js native test runner (`node --test`), 31 test cases (Unit Test với mock repo + Integration Test với PostgreSQL thật) chạy bằng 1 lệnh duy nhất.

---

## 3. Cấu trúc thư mục mã nguồn

```text
smartcrm-2374802010056-part-inventory/
├── sql/
│   └── sql-ddl.sql               # DDL CSDL PostgreSQL chính thức (7 bảng)
├── data/
│   └── sample/                   # Bộ dữ liệu mẫu chuẩn L5 từ Case Study Mekong Mobile
│       ├── service_centers.csv   # Danh mục 6 trung tâm bảo hành
│       ├── technicians.csv       # Danh mục 38 nhân viên/kỹ thuật viên (employee)
│       ├── parts.csv             # Danh mục 180 linh kiện thay thế
│       ├── part_stock.csv        # 717 cặp số dư tồn kho theo trung tâm
│       ├── part_transactions.csv # 4.954 giao dịch kho lịch sử (891 NHAP, 4.063 XUAT)
│       └── tickets_history.csv   # 7.800 phiếu bảo hành tham chiếu
├── docs/
│   ├── srs.md                    # Đặc tả yêu cầu phần mềm SRS luồng L5 (từ BT1)
│   ├── erd.md                    # Mô hình dữ liệu quan hệ ERD chi tiết (7 bảng)
│   ├── erd.drawio.md             # Thuyết minh kỹ thuật mô hình dữ liệu ERD
│   ├── architecture.md           # Thiết kế kiến trúc 3 lớp đề xuất (từ BT1)
│   ├── architecture-thuc-te.md   # Sơ đồ & mô tả kiến trúc ĐÃ HIỆN THỰC (BT2)
│   ├── use-cases.md              # Đặc tả các Use Case cốt lõi
│   ├── api-contract.md           # Hợp đồng API chi tiết
│   ├── thay-doi-thiet-ke.md      # Nhật ký 10 quyết định thay đổi kỹ thuật (TD-01 đến TD-10)
│   ├── ai-disclosure.md          # Khai báo sử dụng AI & cách thức kiểm chứng (cập nhật BT2)
│   ├── bug-log.md                # Nhật ký sửa lỗi kỹ thuật 4 bước (BUG-01 đến BUG-04)
│   └── diagrams/                 # Các sơ đồ nguồn định dạng .drawio (erd.drawio)
├── evidence/
│   └── BT2_screenshots/          # 28 ảnh minh chứng thực tế được tổ chức theo 9 thư mục
├── src/
│   ├── backend/
│   │   ├── Dockerfile            # Container Node.js 20 Alpine, non-root, healthcheck
│   │   ├── .dockerignore
│   │   ├── scripts/
│   │   │   ├── migrate.js        # Script migration tạo bảng từ database trống
│   │   │   └── seed.js           # Script nạp dữ liệu mẫu an toàn (Idempotent)
│   │   ├── src/
│   │   │   ├── config/db.js      # Kết nối PostgreSQL tập trung
│   │   │   ├── errors/           # Lớp lỗi nghiệp vụ AppError độc lập HTTP
│   │   │   ├── middleware/       # Auth JWT, Role check, Error handler tập trung
│   │   │   ├── validators/       # Kiểm định dạng đầu vào tầng 1 (camelCase & snake_case)
│   │   │   ├── repositories/     # Đọc/ghi CSDL bằng câu lệnh SQL
│   │   │   ├── services/         # Toàn bộ quy tắc nghiệp vụ L5 (QT-09, QT-13, QT-14)
│   │   │   └── routes/           # Controllers HTTP ánh xạ API Contract
│   │   ├── tests/
│   │   │   ├── unit/             # 22 Unit Tests (mock repository, không phụ thuộc DB)
│   │   │   └── integration/      # 9 Integration Tests chạy toàn trình với CSDL
│   │   ├── server.js             # Entrypoint Backend Express (có /api/health)
│   │   └── package.json
│   └── frontend/
│       ├── Dockerfile            # Multi-stage build (Vite -> Nginx Alpine)
│       ├── nginx.conf            # Nginx reverse proxy /api/ & fallback SPA
│       ├── .dockerignore
│       ├── src/
│       │   ├── api/client.js     # Lớp API Client tập trung (bắt 401/403)
│       │   ├── components/       # Header, AlertBanner, LoadingSpinner, EmptyState
│       │   ├── screens/          # 3 màn hình M1, M2, M3
│       │   ├── App.jsx
│       │   └── index.css         # Styling Vanilla CSS hiện đại
│       ├── vite.config.js
│       └── package.json
├── docker-compose.yml            # Điều phối toàn trình 3 dịch vụ (Postgres, Backend, Frontend)
├── .dockerignore
├── .env.example                  # Mẫu khai báo biến môi trường
└── README.md
```

---

## 4. Hướng dẫn cài đặt và chạy (Quy trình Clone-and-Run)

### 4.1. Yêu cầu môi trường
- **Node.js:** Phiên bản 18.x trở lên (khuyên dùng Node.js 20 hoặc 24 LTS).
- **PostgreSQL:** Phiên bản 14 trở lên đang chạy cục bộ (mặc định cổng `5432`).

### 4.2. Cấu hình biến môi trường
1. Sao chép tệp mẫu `.env.example` thành `.env` tại thư mục gốc của dự án:
```powershell
cp .env.example .env
```
2. Mở tệp `.env` và điền thông tin kết nối PostgreSQL của máy bạn:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=smart_crm
DB_USER=postgres
DB_PASSWORD=mật_khẩu_postgres_của_bạn

APP_PORT=3000
JWT_SECRET=smartcrm_jwt_secret_dev_2026
```

### 4.3. Cài đặt Dependencies
Cài đặt thư viện cho cả Backend và Frontend:
```powershell
# Cài đặt Backend
cd src/backend
npm install

# Cài đặt Frontend
cd ../frontend
npm install

# Quay về thư mục gốc
cd ../..
```

### 4.4. Khởi tạo Cơ sở dữ liệu (Migration)
Tạo cơ sở dữ liệu `smart_crm` trong PostgreSQL nếu chưa có:
```sql
CREATE DATABASE smart_crm;
```
Chạy script migration để tạo tự động toàn bộ 7 bảng, khóa chính, khóa ngoại, chỉ mục (Index) và ràng buộc toàn vẹn từ database trống:
```powershell
# Chạy từ thư mục gốc:
npm run migrate

# Hoặc chạy từ src/backend:
cd src/backend
npm run migrate
```
*Kết quả:* Tạo sạch sẽ 7 bảng: `service_center`, `employee`, `part`, `part_stock`, `ticket_ref`, `ticket_part`, `part_transaction`.

### 4.5. Nạp dữ liệu mẫu (Seed Data)
Nạp dữ liệu thực tế từ bộ dữ liệu Case Study Mekong Mobile:
```powershell
# Chạy từ thư mục gốc:
npm run seed

# Hoặc chạy từ src/backend:
cd src/backend
npm run seed
```
*Kết quả:* Nạp thành công:
- **6/6** trung tâm bảo hành (`service_center`).
- **38/38** nhân viên/kỹ thuật viên (`employee`).
- **180/180** danh mục linh kiện thay thế (`part`).
- **717/717** dòng số dư tồn kho theo trung tâm (`part_stock`).
- **7.805** phiếu bảo hành tham chiếu (`ticket_ref`), bao gồm các phiếu mẫu active/invalid phục vụ kiểm thử.
- **4.063** liên kết phiếu-linh kiện (`ticket_part`).
- **4.954** giao dịch kho lịch sử (`part_transaction`), gồm 891 NHAP và 4.063 XUAT.

> **Kiểm chứng tính Idempotent (Tiêu chí C5):** Chạy lại lệnh `npm run seed` lần 2, hệ thống ghi nhận `0 bản ghi mới`, không báo lỗi trùng khóa và không nhân đôi dữ liệu.

---

## 5. Chạy bộ kiểm thử (Tiêu chí cốt lõi C4)

Thực thi một lệnh duy nhất:
```powershell
# Chạy từ thư mục gốc:
npm test

# Hoặc chạy từ src/backend:
cd src/backend
npm test
```
*Kết quả:* Chạy **31/31 bài test PASS 100%**, bao gồm:
1. **Luồng đúng (Positive):** Xuất kho thành công khi phiếu hợp lệ và đủ tồn; Nhập kho tăng tồn và ghi giao dịch; Khởi tạo dòng tồn tự động cho linh kiện mới.
2. **Giá trị biên (Boundary):** Xuất số lượng đúng bằng tồn kho hiện tại (tồn về 0 hợp lệ); Tồn bằng đúng ngưỡng (`quantity == min_threshold`) không cảnh báo; Tồn nhỏ hơn ngưỡng (`quantity < min_threshold`) bật cảnh báo; Nhập số lượng tối thiểu = 1.
3. **Dữ liệu sai & từ chối (Negative):** Từ chối xuất vượt tồn (`INSUFFICIENT_STOCK`); Từ chối số lượng âm hoặc bằng 0; Từ chối phiếu không tồn tại; Từ chối phiếu khác trung tâm; Từ chối phiếu sai trạng thái (allowlist); Từ chối truy cập ngoài trung tâm được cấp quyền (QT-14); KTV không có quyền đặt ngưỡng.
4. **Integration Tests:** 9 test cases chạy toàn trình với CSDL PostgreSQL thật.

---

## 6. Khởi động ứng dụng

### 6.1. Khởi động Backend
Mở Terminal 1:
```powershell
cd src/backend
npm start
```
*Máy chủ Backend lắng nghe tại:* `http://localhost:3000`
- Smoke test API: `http://localhost:3000/api/hello`
- Kiểm tra kết nối CSDL: `http://localhost:3000/api/db-test`

### 6.2. Khởi động Frontend
Mở Terminal 2:
```powershell
cd src/frontend
npm run dev
```
*Giao diện người dùng mở tại:* `http://localhost:5173`

---

## 7. Hướng dẫn sử dụng & Kiểm thử 3 màn hình

Trên thanh điều hướng đầu trang có sẵn công cụ chuyển đổi **Vai trò** (`KTV` / `QUAN_LY_TRUNG_TAM`) và **Trung tâm** (`TT01` đến `TT06`):

### M1 — Tra cứu Tồn kho & Cảnh báo (US1, US4, US5)
- Nhập từ khóa tìm kiếm (mã hoặc tên linh kiện, ví dụ: `MH-SS-01`, `pin`, `camera`...).
- Bấm nút **"⚠️ Lọc linh kiện Dưới ngưỡng"** để chỉ xem các linh kiện đang bị thiếu hụt.
- Khi đăng nhập vai trò **Quản lý trung tâm (QLTT)**, nút **"⚙️ Đặt ngưỡng"** xuất hiện ở mỗi dòng, cho phép thiết lập ngưỡng tối thiểu `min_threshold` theo quy tắc QT-09.

### M2 — Ghi nhận Nhập kho (US3, UC3, FR5)
- Chọn linh kiện từ danh mục, nhập số lượng nguyên dương và mã chứng từ tham chiếu (ví dụ: `PN-2026-0008`).
- Bấm **"📥 Xác nhận Nhập kho"**: Số lượng tồn kho được cập nhật tăng ngay lập tức và bản ghi hiển thị trong bảng lịch sử nhập gần nhất bên dưới.
- *Lưu ý:* Nếu đang ở vai trò KTV, hệ thống sẽ nhắc nhở phân quyền vì thao tác nhập kho chỉ dành cho QLTT.

### M3 — Ghi nhận Xuất kho cho Phiếu bảo hành (US2, UC2, FR2, FR3, FR4)
- **Thử nghiệm xuất thành công:** Nhập mã phiếu `BH-TEST-ACTIVE-01`, chọn linh kiện, nhập số lượng $\le$ tồn kho $\rightarrow$ Bấm **"📤 Xác nhận Xuất kho"** $\rightarrow$ Tồn kho giảm, sinh giao dịch XUAT.
- **Thử nghiệm chặn xuất vượt tồn (QT-09):** Nhập số lượng lớn hơn tồn kho $\rightarrow$ Hệ thống lập tức báo lỗi và hiển thị rõ số tồn khả dụng.
- **Thử nghiệm chặn phiếu sai trạng thái:** Nhập mã phiếu `BH-TEST-INVALID-01` (phiếu đã đóng `DA_DONG`) $\rightarrow$ Bị từ chối với thông báo trạng thái không hợp lệ.
- **Tra cứu linh kiện theo phiếu (FR11):** Sử dụng ô tra cứu ở nửa dưới màn hình M3, nhập mã phiếu (ví dụ: `BH-TEST-ACTIVE-01` hoặc `BH-001400/2024`) để xem toàn bộ danh sách linh kiện đã xuất cho phiếu đó.

---

## 8. Xử lý sự cố thường gặp (Troubleshooting)

Bảng chẩn đoán và khắc phục nhanh các sự cố thường gặp trong quá trình cài đặt, tái lập và chạy thử dự án:

| Thông báo lỗi | Nguyên nhân | Cách khắc phục | Lệnh chạy lại để xác nhận |
|:---|:---|:---|:---|
| `Cannot find module '...'` | Thiếu dependencies hoặc chưa cài đặt từ lockfile | Chạy cài đặt sạch thư viện qua lockfile cho cả backend và frontend | `cd src/backend && npm ci && cd ../frontend && npm ci && cd ../..` |
| `Node.js version is not supported` | Phiên bản Node.js máy cục bộ thấp hơn yêu cầu (< 18.x) | Cài đặt bản Node.js 20 LTS hoặc 24 LTS chính thức | `node -v` |
| `ENOENT: no such file or directory, open '.env'` | Chưa tạo tệp cấu hình `.env` tại thư mục gốc | Sao chép tệp cấu hình mẫu `.env.example` thành `.env` | `Copy-Item .env.example .env` *(Windows)* hoặc `cp .env.example .env` *(Linux/macOS)* |
| `KeyError / undefined process.env.DB_PASSWORD` | Thiếu biến môi trường cấu hình trong tệp `.env` | Mở tệp `.env` và điền đầy đủ 8 biến cấu hình theo mẫu `.env.example` | `Get-Content .env` |
| `ECONNREFUSED 127.0.0.1:5432` | Không kết nối được dịch vụ PostgreSQL | Khởi động dịch vụ PostgreSQL trên máy hoặc kiểm tra cổng `DB_PORT=5432` | `Get-Service postgresql*` *(Windows)* |
| `relation "part_stock" does not exist` | Database `smart_crm` chưa được khởi tạo bảng | Chạy script migration để tạo tự động 7 bảng từ file DDL | `npm run migrate` |
| `Database "smart_crm" does not exist` | Chưa tạo cơ sở dữ liệu trống trong PostgreSQL | Đăng nhập PostgreSQL tạo CSDL: `CREATE DATABASE smart_crm;` | `npm run migrate` |
| Dashboard trống, không có danh mục linh kiện | Chưa chạy nạp dữ liệu mẫu ban đầu (Seed) | Chạy script seed nạp hơn 17.000 dòng dữ liệu từ 6 file CSV mẫu | `npm run seed` |
| `EADDRINUSE: address already in use :::3000` | Cổng 3000 bị chiếm dụng bởi tiến trình khác | Giải phóng cổng hoặc đổi `APP_PORT=3001` trong `.env` | `netstat -ano \| findstr :3000` |
| Test PASS máy cá nhân nhưng FAIL máy mới | Bộ test bị phụ thuộc dữ liệu hoặc đường dẫn tuyệt đối | Đã dùng mock repo in-memory cho 22 unit tests; chạy test chuẩn | `npm test` |
| `duplicate key value violates unique constraint` | Chạy seed lần hai bị lỗi nhân đôi dữ liệu | Script seed đã cài đặt `ON CONFLICT DO NOTHING`, hoàn toàn an toàn | `npm run seed` *(ghi nhận 0 bản ghi mới)* |
| `403 FORBIDDEN: Không có quyền thao tác` | Người dùng thao tác ngoài trung tâm được phân quyền (QT-14) | Chọn đúng trung tâm tương ứng với vai trò trên thanh Header UI | Thao tác trên giao diện live |

---

## 9. Khai báo AI & Quyền tác giả

- Dự án được phát triển với sự hỗ trợ của mô hình ngôn ngữ lớn (LLM) theo quy định của môn học.
- Toàn bộ kiến trúc 3 lớp, mã nguồn backend, migration, seed, bộ kiểm thử 31 test cases và giao diện 3 màn hình React đã được sinh viên trực tiếp rà soát, kiểm thử thực tế và nghiệm thu từng bước.
- Chi tiết xem tại [docs/ai-disclosure.md](docs/ai-disclosure.md) và [docs/thay-doi-thiet-ke.md](docs/thay-doi-thiet-ke.md).

---

## 10. Trạng thái hiện tại của module (Buổi 8, 9, 10, 11)

Theo yêu cầu chuẩn của Buổi 8, 9, 10 và 11, hiện trạng triển khai của module L5 được nghiệm thu như sau:

- [x] **Xử lý phản hồi BT1 & Góp ý Giảng viên:** Đã ghi nhận 10 quyết định kỹ thuật chuẩn hóa tại [`docs/thay-doi-thiet-ke.md`](docs/thay-doi-thiet-ke.md) (từ `TD-01` đến `TD-10`), xử lý trọn vẹn 8 góp ý G1–G8 của Giảng viên.
- [x] **Nhật ký sửa lỗi kỹ thuật 4 bước:** Đã ghi nhận 4 lỗi thực tế được điều tra và khắc phục triệt để tại [`docs/bug-log.md`](docs/bug-log.md) (`BUG-01` đến `BUG-04`).
- [x] **Migration CSDL sạch:** Dựng tự động đầy đủ 7 bảng PostgreSQL (`service_center`, `employee`, `part`, `part_stock`, `ticket_ref`, `ticket_part`, `part_transaction`) từ CSDL trống.
- [x] **Seed dữ liệu mẫu an toàn (Idempotent):** Nạp 100% dữ liệu gốc Mekong Mobile (6 TT, 38 nhân sự kỹ thuật, 180 linh kiện, 717 tồn kho, 7.805 phiếu, 4.063 liên kết phiếu-LK, 4.954 giao dịch). Chạy lại ghi nhận `0 bản ghi mới`.
- [x] **CRUD 3 lớp độc lập:** Thực thể `part` và `part_stock` đầy đủ thao tác qua `routes` $\rightarrow$ `services` $\rightarrow$ `repositories`. Service không phụ thuộc `req`/`res`.
- [x] **Bảo toàn quy tắc nghiệp vụ L5:**
  - [x] `QT-09`: Khóa dòng `SELECT ... FOR UPDATE`, chặn xuất vượt tồn, cảnh báo đúng điều kiện `quantity < min_threshold && min_threshold > 0` (bằng ngưỡng không cảnh báo).
  - [x] `QT-13`: Sổ cái giao dịch bất biến (`part_transaction`), không có endpoint/câu lệnh sửa hoặc xóa vật lý.
  - [x] `QT-14`: Kiểm soát phân quyền trung tâm tại tầng Service (`user.centerId === centerId`), từ chối 403 khi truy cập chéo trung tâm.
- [x] **Hợp đồng dữ liệu & chuẩn hóa lỗi (Buổi 9):** Cấu trúc phản hồi lỗi `{ error, message, fields, details }`, tự động map mảng validation thành `fields: { [field]: reason }` phục vụ form giao diện.
- [x] **Ba màn hình React gọi API thật (Buổi 10):**
  - [x] M1 (`StockLookupScreen`): Tra cứu tồn kho, tìm kiếm, lọc cảnh báo thiếu hụt, cấu hình ngưỡng tối thiểu.
  - [x] M2 (`StockReceiptScreen`): Ghi nhận nhập kho, cập nhật số dư tức thời và xem lịch sử nhập gần nhất.
  - [x] M3 (`StockIssueScreen`): Xuất kho theo phiếu bảo hành, tra cứu danh sách linh kiện đã xuất theo mã phiếu.
  - [x] 100% request qua lớp `api/client.js`, 0% gọi `fetch()` trực tiếp từ components/pages.
- [x] **Ba trạng thái giao diện bắt buộc & Vòng đời xác thực:**
  - [x] Loading (spinner đang tải dữ liệu).
  - [x] Empty (phân biệt rỗng do chưa có dữ liệu và rỗng do bộ lọc tìm kiếm).
  - [x] Error (thông báo lỗi thân thiện kèm nút "🔄 Thử lại").
  - [x] Mã 401 Unauthorized (xóa token, chuyển trạng thái kèm nút "🔄 Đăng nhập lại").
  - [x] Mã 403 Forbidden (thông báo không đủ quyền, không làm mất phiên làm việc).
- [x] **Kiểm thử tự động:** 31/31 bài test PASS 100% (22 Unit Tests + 9 Integration Tests với PostgreSQL thật) chạy bằng 1 lệnh `npm test`.

---

## 11. Đóng gói và Điều phối dịch vụ với Docker (Buổi 11)

Dự án đã chuẩn bị đầy đủ cấu hình đóng gói theo chuẩn Stack SE phục vụ triển khai container hóa:

- **Backend Dockerfile:** Multi-stage build trên nền `node:20-alpine`, chạy bằng tài khoản không đặc quyền (`USER node`), có endpoint kiểm tra sức khỏe `HEALTHCHECK` tại `GET /api/health`.
- **Frontend Dockerfile:** Multi-stage build (Stage 1: Vite build bundle $\rightarrow$ Stage 2: `nginx:1.27-alpine` phục vụ file tĩnh và reverse proxy chuyển tiếp các request `/api/` về container Backend).
- **Docker Compose (`docker-compose.yml`):** Điều phối 3 container đồng bộ gồm PostgreSQL 16 Alpine, Express Backend và Nginx Frontend, khởi động theo trạng thái healthy (`depends_on: { condition: service_healthy }`).

### 11.1. Lệnh khởi chạy với Docker
```bash
# Khởi động toàn bộ cụm dịch vụ ở chế độ chạy nền
docker compose up -d --build

# Kiểm tra trạng thái các container (phải đạt trạng thái healthy)
docker compose ps

# Xem log hoạt động theo thời gian thực
docker compose logs -f
```

### 11.2. Chạy Migration và Seed trong Docker
```bash
# Khởi tạo CSDL 7 bảng bên trong container backend
docker compose exec backend npm run migrate

# Nạp dữ liệu mẫu ban đầu
docker compose exec backend npm run seed
```

> **Ghi chú môi trường:** Trên máy tính cá nhân của sinh viên hiện đang dùng Windows chưa cài Docker Desktop, dự án được kiểm thử và xác nhận hoạt động 100% qua quy trình **Native** (Node.js + PostgreSQL). Cấu hình Docker đã được lập trình chuẩn mực và sẵn sàng chạy trên bất kỳ máy chấm bài hoặc server nào có cài Docker.

---

## 12. Kịch bản Trình diễn Demo 3 phút tại Workshop Buổi 12

Để phục vụ tốt nhất buổi Workshop Buổi 12, nhóm đã chuẩn bị kịch bản trình diễn trực tiếp trong 3 phút:

1. **Phút 1 — Luồng nghiệp vụ E2E L5 (Happy Path):**
   - Mở màn hình **M1**: Chọn trung tâm `TT01`, tra cứu linh kiện Samsung/Apple, bấm lọc "Dưới ngưỡng" để thấy các mặt hàng cần nhập bổ sung.
   - Chuyển sang **M2**: Đăng nhập vai trò `QUAN_LY_TRUNG_TAM`, thực hiện nhập kho linh kiện `PIN-IP-13` số lượng 20 cái kèm số chứng từ `PN-DEMO-01` $\rightarrow$ Số dư tồn tăng tức thì, sổ cái giao dịch cập nhật.
   - Chuyển sang **M3**: Đăng nhập vai trò `KTV`, nhập mã phiếu bảo hành hợp lệ `BH-TEST-ACTIVE-01`, chọn xuất 2 pin $\rightarrow$ Giao dịch xuất hoàn tất, tra cứu phiếu thấy ngay dòng vật tư vừa xuất.
2. **Phút 2 — Xử lý ngoại lệ, vi phạm dữ liệu & Quy tắc nghiệp vụ (Negative Path):**
   - Thử xuất kho với số lượng lớn hơn tồn khả dụng (QT-09) $\rightarrow$ Hệ thống từ chối `409 INSUFFICIENT_STOCK`, hiển thị banner đỏ rõ ràng, tồn kho không bị giảm.
   - Thử xuất kho cho phiếu đã đóng `BH-TEST-INVALID-01` $\rightarrow$ Bị từ chối với thông báo trạng thái phiếu không đủ điều kiện.
   - Thử nhập số âm hoặc bỏ trống trường $\rightarrow$ Hệ thống phản hồi mã lỗi và hiển thị viền đỏ báo lỗi ngay dưới input field.
3. **Phút 3 — Kiểm chứng kỹ thuật & Chất lượng mã nguồn:**
   - Chạy lệnh `npm test` trong terminal $\rightarrow$ Thể hiện trực tiếp 31/31 bài test (22 Unit + 9 Integration) PASS trong vài giây.
   - Trình bày tóm tắt 1 lỗi thực tế từ `docs/bug-log.md` theo 4 bước (Tái lập $\rightarrow$ Khoanh vùng $\rightarrow$ Sửa gốc $\rightarrow$ Xác nhận).
   - Minh chứng tính Idempotent: Chạy `npm run seed` lần 2 ghi nhận `0 bản ghi mới`.

---

## 13. Bảng nghiệm thu tiêu chí BT2 và Checklist Buổi 10

| Mã tiêu chí | Nội dung yêu cầu | Kết quả thực tế | Lệnh / Cách kiểm tra | Bằng chứng | Trạng thái |
|:---:|:---|:---|:---|:---|:---:|
| **C1** | Clone & Chạy theo README | Clone vào thư mục mới, cấu hình `.env`, chạy migrate/seed/build thành công | `git clone ...`, `npm install`, `npm run migrate`, `npm run seed` | Thư mục `evidence/08_reproducibility/` | `PASS` |
| **C2** | Tách lớp chuẩn 3 lớp | Decoupled 3 layers (`routes` $\rightarrow$ `services` $\rightarrow$ `repositories`), Service độc lập HTTP | Rà soát `src/backend/src/` | `docs/architecture-thuc-te.md`, ảnh `02_architecture_mapping.png` | `PASS` |
| **C3** | CRUD 2 thực thể cốt lõi | Đã hiện thực đầy đủ CRUD cho 2 thực thể `part` và `part_stock` | Gọi API hoặc chạy test | Integration test `api.test.js` | `PASS` |
| **C4** | Tối thiểu 3 loại test PASS bằng 1 lệnh | 31/31 tests PASS (Positive, Boundary, Negative/Invalid, Integration) | `npm test` | Output terminal, ảnh `13_backend_test_summary.png` | `PASS` |
| **C5** | Khả năng chạy lại (Idempotency) | Chạy lại `npm run seed` lần 2 nạp 0 dòng mới, không lỗi, không trùng lặp | `npm run seed` (chạy 2 lần) | Ảnh `24_seed_rerun_idempotency.png` | `PASS` |
| **C6** | Quản lý phụ thuộc & Lockfile | Phiên bản ghim cố định, `package-lock.json` được commit, không có secret | Rà soát `package.json`, `package-lock.json` | Commit history, `package-lock.json` | `PASS` |
| **C7** | Dữ liệu sai bị từ chối an toàn | Dữ liệu sai (số lượng $\le 0$, xuất vượt tồn, sai phân quyền) bị từ chối rõ ràng, hệ thống không sập | Gọi API test invalid | Unit test TC05–TC10, TC14–TC16, ảnh `12_M3_insufficient_stock.png` | `PASS` |
| **UI-01** | 3 màn hình gọi API thật | M1 (Tra cứu/Cảnh báo), M2 (Nhập kho), M3 (Xuất kho theo phiếu) | Mở trình duyệt `http://localhost:5173` | Ảnh `04_M1_stock_lookup.png`, `08_M2_receipt_form.png`, `10_M3_issue_form.png` | `PASS` |
| **UI-02** | 3 trạng thái giao diện | Đầy đủ Loading, Empty và Error (kèm nút Thử lại) | Thao tác trên UI và ngắt kết nối mạng | Ảnh `18_UI_loading.png`, `19_UI_empty.png`, `20_UI_error.png` | `PASS` |
| **DOC-01** | Hồ sơ tài liệu kỹ thuật | Đồng bộ ERD 7 bảng, DDL, Draw.io, SRS, thay đổi thiết kế, Bug Log, Khai báo AI | Kiểm tra thư mục `docs/` | `docs/erd.md`, `thay-doi-thiet-ke.md`, `bug-log.md`, `ai-disclosure.md` | `PASS` |
| **DOC-02** | Báo cáo PDF BT2 | File PDF `BT2_2374802010056_NguyenVanChi.pdf` hoàn thiện theo mẫu đề bài | Mở file tại `TaiLieu/BuoiHoc/` | `BT2_2374802010056_NguyenVanChi.pdf` (10.9 MB) | `PASS` |
| **GIT-01** | Quản lý Git & Tag v0.2 | Nhánh sạch sẽ, lịch sử commit rõ ràng (> 20 commits), tag `v0.2` đã tạo | `git status`, `git tag -l` | Ảnh `26_git_status.png`, `27_git_tag_v02.png` | `PASS` |
| **DOCKER** | Đóng gói Docker Compose | Đã tạo Dockerfile Backend, Dockerfile Frontend, Nginx conf, docker-compose.yml | Đọc cấu hình `docker-compose.yml` | `docker-compose.yml`, `src/backend/Dockerfile`, `src/frontend/Dockerfile` | `READY (NATIVE_PASS)` |



