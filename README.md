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
├── db/
│   └── sql-ddl.sql               # DDL CSDL PostgreSQL chính thức
├── data/
│   └── sample/                   # Bộ dữ liệu mẫu chuẩn L5 từ Case Study Mekong Mobile
│       ├── service_centers.csv   # Danh mục 6 trung tâm bảo hành
│       ├── parts.csv             # Danh mục 180 linh kiện thay thế
│       ├── part_stock.csv        # 717 cặp số dư tồn kho theo trung tâm
│       ├── part_transactions.csv # 4.954 giao dịch kho lịch sử (891 NHAP, 4.063 XUAT)
│       └── tickets_history.csv   # 7.800 phiếu bảo hành tham chiếu
├── docs/
│   ├── srs.md                    # Đặc tả yêu cầu phần mềm SRS luồng L5 (từ BT1)
│   ├── erd.md                    # Mô hình dữ liệu quan hệ ERD chi tiết
│   ├── architecture.md           # Thiết kế kiến trúc 3 lớp đề xuất (từ BT1)
│   ├── architecture-thuc-te.md   # Sơ đồ & mô tả kiến trúc ĐÃ HIỆN THỰC (BT2)
│   ├── use-cases.md              # Đặc tả các Use Case cốt lõi
│   ├── api-contract.md           # Hợp đồng API chi tiết
│   ├── thay-doi-thiet-ke.md      # Nhật ký 5 quyết định thay đổi kỹ thuật (MỚI ở BT2 - bắt buộc)
│   ├── ai-disclosure.md          # Khai báo sử dụng AI & cách thức kiểm chứng (cập nhật BT2)
│   └── diagrams/                 # Các sơ đồ nguồn định dạng .drawio
├── src/
│   ├── backend/
│   │   ├── scripts/
│   │   │   ├── migrate.js        # Script migration tạo bảng từ database trống
│   │   │   └── seed.js           # Script nạp dữ liệu mẫu an toàn (Idempotent)
│   │   ├── src/
│   │   │   ├── config/db.js      # Kết nối PostgreSQL tập trung
│   │   │   ├── errors/           # Lớp lỗi nghiệp vụ AppError độc lập HTTP
│   │   │   ├── middleware/       # Auth JWT, Role check, Error handler tập trung
│   │   │   ├── validators/       # Kiểm định dạng đầu vào tầng 1
│   │   │   ├── repositories/     # Đọc/ghi CSDL bằng câu lệnh SQL
│   │   │   ├── services/         # Toàn bộ quy tắc nghiệp vụ L5 (QT-09, QT-13, QT-14)
│   │   │   └── routes/           # Controllers HTTP ánh xạ API Contract
│   │   ├── tests/
│   │   │   ├── unit/             # 22 Unit Tests (mock repository, không phụ thuộc DB)
│   │   │   └── integration/      # 9 Integration Tests chạy toàn trình với CSDL
│   │   ├── server.js             # Entrypoint Backend Express
│   │   └── package.json
│   └── frontend/
│       ├── src/
│       │   ├── api/client.js     # Lớp API Client tập trung
│       │   ├── components/       # Header, AlertBanner, LoadingSpinner, EmptyState
│       │   ├── screens/          # 3 màn hình M1, M2, M3
│       │   ├── App.jsx
│       │   └── index.css         # Styling Vanilla CSS hiện đại
│       ├── vite.config.js
│       └── package.json
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
Chạy script migration để tạo tự động toàn bộ 6 bảng, khóa chính, khóa ngoại, chỉ mục (Index) và ràng buộc toàn vẹn từ database trống:
```powershell
cd src/backend
npm run migrate
```
*Kết quả:* Tạo sạch sẽ 6 bảng: `service_center`, `part`, `part_stock`, `ticket_ref`, `ticket_part`, `part_transaction`.

### 4.5. Nạp dữ liệu mẫu (Seed Data)
Nạp dữ liệu thực tế từ bộ dữ liệu Case Study Mekong Mobile:
```powershell
npm run seed
```
*Kết quả:* Nạp thành công:
- **6/6** trung tâm bảo hành (`service_center`).
- **180/180** danh mục linh kiện thay thế (`part`).
- **717/717** dòng số dư tồn kho theo trung tâm (`part_stock`).
- **7.805** phiếu bảo hành tham chiếu (`ticket_ref`), bao gồm các phiếu mẫu active/invalid phục vụ kiểm thử.
- **4.063** liên kết phiếu-linh kiện (`ticket_part`).
- **4.954** giao dịch kho lịch sử (`part_transaction`), gồm 891 NHAP và 4.063 XUAT.

> **Kiểm chứng tính Idempotent (Tiêu chí C5):** Chạy lại lệnh `npm run seed` lần 2, hệ thống ghi nhận `0 bản ghi mới`, không báo lỗi trùng khóa và không nhân đôi dữ liệu.

---

## 5. Chạy bộ kiểm thử (Tiêu chí cốt lõi C4)

Tại thư mục `src/backend`, thực thi một lệnh duy nhất:
```powershell
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

## 8. Các lỗi thường gặp và cách xử lý

1. **Lỗi `ECONNREFUSED` hoặc không kết nối được PostgreSQL:**
   - Kiểm tra xem dịch vụ PostgreSQL đã được khởi động chưa.
   - Kiểm tra cổng `DB_PORT` (mặc định 5432) và mật khẩu `DB_PASSWORD` trong tệp `.env`.
2. **Lỗi `FORBIDDEN` khi gọi API:**
   - Đảm bảo bạn đang thao tác trên đúng trung tâm được cấp trong token. Chuyển đổi vai trò/trung tâm ở thanh Header góc trên bên phải giao diện để đồng bộ lại token.
3. **Lỗi khi chạy `npm run migrate`:**
   - Đảm bảo database `smart_crm` đã được tạo trong PostgreSQL trước khi chạy migration.

---

## 9. Khai báo AI & Quyền tác giả

- Dự án được phát triển với sự hỗ trợ của mô hình ngôn ngữ lớn (LLM) theo quy định của môn học.
- Toàn bộ kiến trúc 3 lớp, mã nguồn backend, migration, seed, bộ kiểm thử 31 test cases và giao diện 3 màn hình React đã được sinh viên trực tiếp rà soát, kiểm thử thực tế và nghiệm thu từng bước.
- Chi tiết xem tại [docs/ai-disclosure.md](docs/ai-disclosure.md) và [docs/thay-doi-thiet-ke.md](docs/thay-doi-thiet-ke.md).
