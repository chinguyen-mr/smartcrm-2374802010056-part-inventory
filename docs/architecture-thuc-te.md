# Kiến trúc đã hiện thực – Luồng L5 Kho linh kiện thay thế

Tài liệu này mô tả kiến trúc **đã hiện thực thực tế** trong mã nguồn BT2, đối chiếu với bản thiết kế đề xuất tại [`docs/architecture.md`](architecture.md). Các thay đổi kỹ thuật so với BT1 được ghi nhận tại [`docs/thay-doi-thiet-ke.md`](thay-doi-thiet-ke.md).

---

## 1. Tổng quan kiến trúc phân lớp (Layered Architecture)

Hệ thống được thiết kế và hiện thực hóa theo kiến trúc phân lớp chuẩn của ngành Kỹ thuật Phần mềm (Software Engineering - SE), tuân thủ nguyên lý phân tách trách nhiệm (Separation of Concerns - SoC):

```
┌────────────────────────────────────────────────────────────────────────┐
│               LỚP TRÌNH BÀY (Presentation Layer)                      │
│  Giao diện người dùng (React 19 + Vite) │ Bộ định tuyến HTTP (Express) │
│  ┌────────────────────────┐             │ ┌──────────────────────────┐ │
│  │ StockLookupScreen (M1) │             │ │ part.routes.js           │ │
│  │ StockReceiptScreen(M2) │             │ │ stock.routes.js          │ │
│  │ StockIssueScreen  (M3) │             │ │ ticket.routes.js         │ │
│  └───────────┬────────────┘             │ │ auth.routes.js           │ │
│              │ api/client.js            │ └────────────┬─────────────┘ │
│              │ (RESTful + JWT Bearer)   │              │               │
│              └──────────────────────────┼──────────────┘               │
│                                         │ Middleware:                  │
│                                         │  - auth.middleware.js        │
│                                         │  - errorHandler.js           │
│                                         │  - validators/               │
└─────────────────────────────────────────┼──────────────────────────────┘
                                          │
┌─────────────────────────────────────────┼──────────────────────────────┐
│               LỚP NGHIỆP VỤ (Business Logic Layer / Domain Service)    │
│  ┌──────────────────────────────────────┼────────────────────────────┐ │
│  │ stock.service.js                     │ Tra cứu tồn kho, tính toán │ │
│  │                                      │ cảnh báo, quản lý ngưỡng   │ │
│  │                                      │ tối thiểu (QT-09, FR1–FR8) │ │
│  ├──────────────────────────────────────┼────────────────────────────┤ │
│  │ receipt.service.js                   │ Ghi nhận nhập kho, sinh    │ │
│  │                                      │ giao dịch NHAP (FR5, UC3)  │ │
│  ├──────────────────────────────────────┼────────────────────────────┤ │
│  │ issue.service.js                     │ Ghi nhận xuất kho theo     │ │
│  │                                      │ phiếu, khóa bi quan, kiểm  │ │
│  │                                      │ tra tồn kho khả dụng       │ │
│  │                                      │ (QT-09, QT-13, FR2–FR4)    │ │
│  ├──────────────────────────────────────┼────────────────────────────┤ │
│  │ part.service.js                      │ Truy xuất danh mục linh    │ │
│  │                                      │ kiện và tồn kho tổng hợp   │ │
│  ├──────────────────────────────────────┼────────────────────────────┤ │
│  │ ticket.adapter.js                    │ Adapter xác thực phiếu     │ │
│  │ (Anti-Corruption Layer)              │ bảo hành qua bảng mô phỏng │ │
│  │                                      │ ticket_ref (Ranh giới tích │ │
│  │                                      │ hợp hệ thống bên ngoài)    │ │
│  └──────────────────────────────────────┴────────────────────────────┘ │
└─────────────────────────────────────────┬──────────────────────────────┘
                                          │
┌─────────────────────────────────────────┼──────────────────────────────┐
│               LỚP TRUY XUẤT DỮ LIỆU (Data Access Layer - Repository)   │
│  ┌──────────────────────────────────────┼────────────────────────────┐ │
│  │ stock.repository.js                  │ Đọc/ghi số dư kho, khóa    │ │
│  │                                      │ dòng FOR UPDATE            │ │
│  ├──────────────────────────────────────┼────────────────────────────┤ │
│  │ part.repository.js                   │ Đọc danh mục, kết nối JOIN │ │
│  │                                      │ với số dư tồn kho          │ │
│  ├──────────────────────────────────────┼────────────────────────────┤ │
│  │ transaction.repository.js            │ Ghi sổ cái giao dịch       │ │
│  │                                      │ bất biến (Immutable Ledger)│ │
│  └──────────────────────────────────────┴────────────────────────────┘ │
└─────────────────────────────────────────┬──────────────────────────────┘
                                          │
┌─────────────────────────────────────────┼──────────────────────────────┐
│               LỚP LƯU TRỮ (Persistence / Storage Layer)               │
│  Hệ quản trị CSDL quan hệ: PostgreSQL 15+                              │
│  Schema chuẩn hóa gồm 6 bảng: service_center, part, part_stock,        │
│                               ticket_ref, ticket_part, part_transaction│
│  Ngôn ngữ định nghĩa dữ liệu (DDL): sql/sql-ddl.sql                    │
│  Khởi tạo lược đồ (Migration): src/backend/scripts/migrate.js          │
│  Nạp dữ liệu mẫu khả lặp (Idempotent Seed): scripts/seed.js            │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Ánh xạ thành phần đề xuất (BT1) → Hiện thực hóa (BT2)

| Thành phần đề xuất (architecture.md) | File hiện thực thực tế | Trách nhiệm chuyên môn (Design Patterns & Roles) |
|---|---|---|
| `StockQueryService` | `src/backend/src/services/stock.service.js` | Service Layer: Điều phối truy vấn tồn kho, tính toán trạng thái dưới ngưỡng (`quantity < min_threshold`), cấu hình ngưỡng tối thiểu |
| `ReceiptService` | `src/backend/src/services/receipt.service.js` | Service Layer: Thực thi nghiệp vụ nhập kho nguyên tử trong Transaction, ghi nhận giao dịch `NHAP` |
| `IssueService` | `src/backend/src/services/issue.service.js` | Service Layer: Thực thi nghiệp vụ xuất kho có khóa bi quan (*Pessimistic Locking*), ghi nhận giao dịch `XUAT`, liên kết quan hệ 1-1 với `ticket_part` |
| *(bổ sung trong BT2)* | `src/backend/src/services/part.service.js` | Service Layer: Đóng gói nghiệp vụ tra cứu danh mục kết hợp số dư tồn kho theo trung tâm |
| *(adapter đề xuất)* | `src/backend/src/services/ticket.adapter.js` | Adapter Pattern (GoF) / Anti-Corruption Layer: Xác minh tính hợp lệ và trạng thái cho phép của phiếu bảo hành |
| `CatalogRepository` | `src/backend/src/repositories/part.repository.js` | Repository Pattern: Trừu tượng hóa truy vấn bảng danh mục linh kiện (`part`) và phép `LEFT JOIN` với bảng số dư (`part_stock`) |
| `StockRepository` | `src/backend/src/repositories/stock.repository.js` | Repository Pattern: Trừu tượng hóa thao tác đọc, cập nhật số dư kho và thực hiện câu lệnh khóa dòng `FOR UPDATE` |
| `TransactionRepository` | `src/backend/src/repositories/transaction.repository.js` | Repository Pattern: Ghi nhận sổ cái giao dịch kho bất biến (*Append-only Immutable Ledger*) |
| Màn hình tra cứu tồn | `src/frontend/src/screens/StockLookupScreen.jsx` (M1) | Single Page Application (SPA) View: Tra cứu tồn kho, lọc cảnh báo thiếu hụt, thiết lập ngưỡng |
| Màn hình nhập kho | `src/frontend/src/screens/StockReceiptScreen.jsx` (M2) | SPA View: Tiếp nhận dữ liệu nhập kho và hiển thị bảng lịch sử tức thời |
| Màn hình xuất kho theo phiếu | `src/frontend/src/screens/StockIssueScreen.jsx` (M3) | SPA View: Ghi nhận xuất kho theo phiếu bảo hành, tra cứu lịch sử linh kiện đã xuất theo mã phiếu |
| API Client | `src/frontend/src/api/client.js` | Data Access Client: Lớp đóng gói HTTP request tập trung, tự động gắn `Authorization: Bearer <JWT>` |

---

## 3. Cơ chế kiểm soát đồng thời (Concurrency Control)

Nhằm đáp ứng yêu cầu phi chức năng **NFR3** (chống xuất vượt tồn kho và chống race condition khi có tranh chấp đồng thời), hệ thống áp dụng cơ chế **Khóa bi quan (Pessimistic Locking)** ở cấp độ dòng trong Cơ sở dữ liệu:

```
IssueService.issuePartForTicket()
│
├── 1. BEGIN DATABASE TRANSACTION (Bắt đầu giao dịch CSDL nguyên tử)
├── 2. StockRepository.findStockForUpdate(centerId, partId)
│        └── Câu lệnh SQL: SELECT quantity, min_threshold 
│                          FROM part_stock 
│                          WHERE center_id = $1 AND part_id = $2 
│                          FOR UPDATE;
│             ↳ Đặt Exclusive Row-level Lock (Khóa độc quyền trên dòng tồn kho)
│             ↳ Mọi Transaction đồng thời khác bắt buộc phải xếp hàng chờ giải phóng khóa
├── 3. Kiểm định điều kiện nghiệp vụ (Business Rule QT-09):
│        └── Nếu (quantity < requestedQty) 
│              ↳ ROLLBACK TRANSACTION; 
│              ↳ Ném lỗi nghiệp vụ AppError('INSUFFICIENT_STOCK', 409);
├── 4. StockRepository.decreaseStock(centerId, partId, requestedQty)
│        └── Cập nhật giảm tồn kho: quantity = quantity - requestedQty
├── 5. TransactionRepository.createTransaction(type='XUAT', ...)
│        └── Ghi sổ cái bất biến (Audit Trail / Ledger)
├── 6. ticket_part ↔ part_transaction
│        └── Thiết lập toàn vẹn tham chiếu 1-1 (QT-13)
└── 7. COMMIT DATABASE TRANSACTION (Hoàn tất giao dịch, tự động giải phóng khóa)
```

**Đánh giá kỹ thuật:** Cơ chế `SELECT ... FOR UPDATE` đảm bảo thỏa mãn tiêu chuẩn **ACID** (đặc biệt là tính *Isolation* và *Atomicity*), ngăn chặn hoàn toàn hiện tượng *Lost Update* và *Dirty Read* trong môi trường đa luồng/đa kết nối.

---

## 4. Cơ chế xác thực và phân quyền (Authentication & Authorization)

Hệ thống triển khai mô hình bảo mật 2 lớp:

| Cơ chế chuyên môn | Thành phần hiện thực | Quy tắc & Hành vi kỹ thuật |
|---|---|---|
| **Xác thực người dùng (Authentication)** | `auth.middleware.js` (`requireAuth`) | Giải mã và kiểm tra tính hợp lệ của **JSON Web Token (JWT)** từ HTTP Request Header `Authorization: Bearer <token>`. Nếu thiếu hoặc sai token, từ chối với mã lỗi `401 UNAUTHENTICATED`. |
| **Phân quyền theo vai trò (Role-Based Access Control - RBAC)** | `auth.middleware.js` (`requireRole`) | Kiểm tra vai trò trong payload JWT: <br>- `KTV` (Kỹ thuật viên): Quyền tra cứu M1, xuất kho M3.<br>- `QUAN_LY_TRUNG_TAM` (QLTT): Quyền tra cứu M1, cấu hình ngưỡng M1, nhập kho M2. Từ chối truy cập trái vai trò với mã lỗi `403 FORBIDDEN`. |
| **Phân quyền theo phạm vi dữ liệu (Data-Level Access Control / Center Isolation)** | Service Layer (`QT-14`) | So khớp trung tâm hoạt động (`centerId`) của tài khoản đang đăng nhập với `centerId` của tài nguyên kho yêu cầu. Nghiêm cấm thao tác chéo trung tâm bảo hành (`403 FORBIDDEN`). |

- **Cấu trúc JWT Payload:** `{ userId: number, username: string, role: string, centerId: number }`.

---

## 5. Khác biệt giữa bản thiết kế đề xuất (BT1) và hiện thực thực tế (BT2)

| Tiêu chí | Đề xuất ban đầu (BT1) | Hiện thực hóa thực tế (BT2) | Lý giải kỹ thuật chuyên môn |
|---|---|---|---|
| **Quy ước đặt tên Service** | `StockQueryService` | `stock.service.js` | Tuân thủ quy ước đặt tên (Naming Convention) chuẩn của hệ sinh thái Node.js/Express.js |
| **Phân rã Service quản lý ngưỡng** | Tách riêng `ThresholdService` | Tích hợp trong `stock.service.js` | Giảm thiểu phân mảnh mã nguồn khi nghiệp vụ ngưỡng gắn liền với thuộc tính `min_threshold` trên bảng `part_stock` |
| **Tối ưu hóa truy vấn danh mục** | `CatalogRepository` truy vấn độc lập | `part.repository.js` kết hợp phép `LEFT JOIN` với `part_stock` | Tối ưu hóa hiệu năng (NFR1): Giảm thiểu số lượng Network Round-Trip giữa ứng dụng và máy chủ CSDL |
| **Ranh giới tích hợp phiếu** | Chưa xác định rõ mô hình lưu trữ | Bảng tham chiếu mô phỏng `ticket_ref` kết hợp `TicketAdapter` | Thiết lập rõ ràng ranh giới nghiệp vụ (Bounded Context theo DDD): L5 không trực tiếp sở hữu vòng đời phiếu bảo hành |
| **Kiểm soát xác thực** | Giả định phụ thuộc hệ thống Identity bên ngoài | Cơ chế JWT Token nội bộ phục vụ kiểm thử | Đảm bảo tính độc lập và sẵn sàng triển khai (Self-contained Prototype) |

Toàn bộ các quyết định điều chỉnh kỹ thuật này đã được ghi nhận chi tiết tại [`docs/thay-doi-thiet-ke.md`](thay-doi-thiet-ke.md) theo đúng yêu cầu của Buổi 7.

---

## 6. Sơ đồ cấu trúc thư mục thực tế

```text
src/backend/
├── server.js                          # Entrypoint Express
├── package.json
├── scripts/
│   ├── migrate.js                     # Migration DDL
│   └── seed.js                        # Seed idempotent
├── src/
│   ├── config/db.js                   # Kết nối PostgreSQL tập trung
│   ├── errors/AppError.js             # Lỗi nghiệp vụ độc lập HTTP
│   ├── middleware/
│   │   ├── auth.middleware.js          # JWT xác thực + phân quyền
│   │   └── errorHandler.js            # Xử lý lỗi tập trung
│   ├── validators/
│   │   ├── stock.validator.js
│   │   ├── receipt.validator.js
│   │   └── issue.validator.js
│   ├── repositories/
│   │   ├── part.repository.js
│   │   ├── stock.repository.js
│   │   └── transaction.repository.js
│   ├── services/
│   │   ├── stock.service.js
│   │   ├── receipt.service.js
│   │   ├── issue.service.js
│   │   ├── part.service.js
│   │   └── ticket.adapter.js
│   └── routes/
│       ├── auth.routes.js
│       ├── part.routes.js
│       ├── stock.routes.js
│       └── ticket.routes.js
└── tests/
    ├── unit/
    │   ├── issue.service.test.js
    │   ├── receipt.service.test.js
    │   └── stock.service.test.js
    └── integration/
        └── api.test.js

src/frontend/
├── vite.config.js                     # Proxy /api → localhost:3000
├── package.json
├── index.html
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── App.css
    ├── index.css                      # Vanilla CSS hiện đại
    ├── api/client.js                  # Lớp gọi API tập trung
    ├── components/
    │   ├── Header.jsx
    │   ├── AlertBanner.jsx
    │   ├── LoadingSpinner.jsx
    │   └── EmptyState.jsx
    └── screens/
        ├── StockLookupScreen.jsx      # M1
        ├── StockReceiptScreen.jsx     # M2
        └── StockIssueScreen.jsx       # M3
```
