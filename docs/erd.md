# Mô hình dữ liệu – Smart CRM Luồng L5

Tài liệu này mô tả schema đã được chốt cho BT2 và đối chiếu với sơ đồ [`diagrams/erd.drawio`](diagrams/erd.drawio). Mọi khác biệt giữa BT1 và BT2 đã được giải quyết; DDL tại [`sql/sql-ddl.sql`](../sql/sql-ddl.sql) là nguồn sự thật duy nhất (7 bảng).

## 4.1 Sơ đồ ERD

Xem file [`diagrams/erd.drawio`](diagrams/erd.drawio). Ký hiệu theo chuẩn crow's foot (IE notation).

## 4.2 Mô tả bảng

| Bảng | Khóa chính | Thuộc tính chính | Vai trò |
|---|---|---|---|
| `service_center` | `center_id` (PK, IDENTITY) | `center_code` UNIQUE, `center_name` | Danh mục trung tâm bảo hành. |
| `employee` | `employee_id` (PK, IDENTITY) | `employee_code` UNIQUE, `full_name`, `center_id` (FK), `role`, `is_active` | Danh mục nhân viên (KTV / Quản lý trung tâm) thao tác kho. |
| `part` | `part_id` (PK, IDENTITY) | `part_code` UNIQUE, `part_name`, `unit_price NUMERIC(12,2)` | Danh mục linh kiện thay thế. |
| `part_stock` | (`center_id`, `part_id`) (PK ghép, FK) | `quantity >= 0`, `min_threshold >= 0 NOT NULL`, `updated_at` | Số dư tồn kho hiện tại theo cặp trung tâm/linh kiện. Mỗi cặp có tối đa một dòng. |
| `ticket_ref` | `ticket_id` (PK, IDENTITY) | `center_id` (FK), `ticket_code` UNIQUE, `status` | Tham chiếu phiếu bảo hành từ hệ thống ngoài; lưu nội bộ để kiểm tra đúng trung tâm khi xuất. |
| `ticket_part` | `ticket_part_id` (PK, IDENTITY) | `ticket_id` (FK), `part_id` (FK), `transaction_id` (FK nullable), `created_at` | Liên kết giữa phiếu và linh kiện; `transaction_id` được cập nhật sau khi giao dịch xuất ghi thành công. |
| `part_transaction` | `transaction_id` (PK, IDENTITY) | `center_id` (FK), `part_id` (FK), `ticket_part_id` (FK nullable), `type`, `quantity > 0`, `occurred_at`, `reference` | Sổ lịch sử nhập/xuất bất biến theo QT-13. `type` là `NHAP` hoặc `XUAT`. |

## 4.2.1 Chi tiết bảng `service_center`

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `center_id` | BIGINT | PK, IDENTITY | Khóa kỹ thuật tự tăng. |
| `center_code` | VARCHAR(20) | NOT NULL, UNIQUE | Mã trung tâm do nghiệp vụ đặt. |
| `center_name` | VARCHAR(120) | NOT NULL | Tên đầy đủ của trung tâm. |

## 4.2.2 Chi tiết bảng `employee`

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `employee_id` | BIGINT | PK, IDENTITY | Khóa kỹ thuật tự tăng (tương ứng technician_id từ dataset). |
| `employee_code` | VARCHAR(20) | NOT NULL, UNIQUE | Mã nhân viên/kỹ thuật viên (NV-xxx). |
| `full_name` | VARCHAR(120) | NOT NULL | Họ và tên nhân viên. |
| `center_id` | BIGINT | NOT NULL, FK → service_center | Trung tâm bảo hành trực thuộc. |
| `role` | VARCHAR(30) | NOT NULL, DEFAULT 'KTV', CHECK (role IN ('KTV', 'QUAN_LY_TRUNG_TAM')) | Vai trò nghiệp vụ trong luồng L5. |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT TRUE | Trạng thái hoạt động của nhân viên. |

## 4.2.3 Chi tiết bảng `part`

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `part_id` | BIGINT | PK, IDENTITY | Khóa kỹ thuật tự tăng. |
| `part_code` | VARCHAR(30) | NOT NULL, UNIQUE | Mã linh kiện do nghiệp vụ đặt. |
| `part_name` | VARCHAR(120) | NOT NULL | Tên linh kiện. |
| `unit_price` | NUMERIC(12,2) | NOT NULL, >= 0 | Đơn giá; lưu 2 chữ số thập phân. |

## 4.2.4 Chi tiết bảng `part_stock`

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `center_id` | BIGINT | PK, FK → service_center | Trung tâm. |
| `part_id` | BIGINT | PK, FK → part | Linh kiện. |
| `quantity` | INTEGER | NOT NULL, DEFAULT 0, >= 0 | Số lượng tồn hiện tại; không âm. |
| `min_threshold` | INTEGER | NOT NULL, DEFAULT 0, >= 0 | Ngưỡng cảnh báo. Mặc định 0 khi chưa cấu hình (không cảnh báo). |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Thời điểm cập nhật tồn gần nhất. |

## 4.2.5 Chi tiết bảng `ticket_ref`

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `ticket_id` | BIGINT | PK, IDENTITY | Khóa kỹ thuật nội bộ. |
| `center_id` | BIGINT | NOT NULL, FK → service_center | Trung tâm xử lý phiếu. |
| `ticket_code` | VARCHAR(20) | NOT NULL, UNIQUE | Mã phiếu từ hệ thống ngoài. |
| `status` | VARCHAR(30) | NOT NULL, DEFAULT 'DANG_XU_LY' | Trạng thái phiếu (DANG_XU_LY, CHO_LINH_KIEN, DA_DONG, ...). |

## 4.2.6 Chi tiết bảng `ticket_part`

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `ticket_part_id` | BIGINT | PK, IDENTITY | Khóa kỹ thuật tự tăng. |
| `ticket_id` | BIGINT | NOT NULL, FK → ticket_ref | Phiếu bảo hành. |
| `part_id` | BIGINT | NOT NULL, FK → part | Linh kiện được xuất. |
| `transaction_id` | BIGINT | FK → part_transaction, nullable | Giao dịch xuất tương ứng; điền sau khi giao dịch ghi thành công. |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Thời điểm tạo bản ghi. |

## 4.2.7 Chi tiết bảng `part_transaction`

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `transaction_id` | BIGINT | PK, IDENTITY | Khóa kỹ thuật tự tăng. |
| `center_id` | BIGINT | NOT NULL, FK → service_center | Trung tâm thực hiện giao dịch. |
| `part_id` | BIGINT | NOT NULL, FK → part | Linh kiện. |
| `ticket_part_id` | BIGINT | FK → ticket_part, nullable | Liên kết phiếu/linh kiện; bắt buộc khi `type = XUAT`. |
| `type` | VARCHAR(10) | NOT NULL, IN ('NHAP','XUAT') | Loại giao dịch. |
| `quantity` | INTEGER | NOT NULL, > 0 | Số lượng nhập/xuất; luôn dương. |
| `occurred_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Thời điểm ghi nhận giao dịch. |
| `reference` | VARCHAR(80) | nullable | Số phiếu nhập hoặc ghi chú tham chiếu. |

**Ràng buộc CHECK:** `(type = 'NHAP' AND ticket_part_id IS NULL) OR (type = 'XUAT' AND ticket_part_id IS NOT NULL)`

## 4.3 Quan hệ

```
service_center ──< employee
service_center ──< part_stock >── part
service_center ──< ticket_ref
ticket_ref     ──< ticket_part >── part
ticket_part    ──< part_transaction
service_center ──< part_transaction
part           ──< part_transaction
```

- Một trung tâm có nhiều nhân viên (`employee`), mỗi nhân viên trực thuộc đúng một trung tâm.
- Một trung tâm và một linh kiện có đúng một dòng tồn (`part_stock`).
- Một phiếu (`ticket_ref`) có thể liên quan đến nhiều linh kiện (`ticket_part`).
- Một `ticket_part` tương ứng đúng một giao dịch xuất (`part_transaction`).
- Mỗi giao dịch nhập không liên kết phiếu (`ticket_part_id IS NULL`); mỗi giao dịch xuất bắt buộc có `ticket_part_id`.

## 4.4 SQL DDL

Xem toàn bộ DDL tại [`sql/sql-ddl.sql`](../sql/sql-ddl.sql).

## 4.5 Quy tắc dữ liệu

- Số lượng tồn không âm; số lượng mỗi giao dịch là số nguyên dương.
- `part_code`, `employee_code` và `ticket_code` là duy nhất trên toàn hệ thống.
- `unit_price` lưu 2 chữ số thập phân, không âm.
- Giao dịch xuất phải gắn với phiếu hợp lệ, cùng trung tâm với phiếu.
- Giao dịch đã ghi không được sửa hoặc xóa vật lý (QT-13).
- Cảnh báo khi `quantity < min_threshold`; bằng ngưỡng thì không cảnh báo.
- Khi `min_threshold = 0` (chưa cấu hình), không phát sinh cảnh báo trừ khi tồn âm (không được phép).

## 4.6 Index

| Index | Bảng | Cột | Mục đích |
|---|---|---|---|
| `idx_part_stock_alert` | `part_stock` | `(center_id, quantity, min_threshold)` | Lọc cảnh báo tồn dưới ngưỡng (UC4, UC5). |
| `idx_part_transaction_history` | `part_transaction` | `(center_id, part_id, occurred_at DESC)` | Tra cứu lịch sử theo trung tâm, linh kiện, thời gian (UC7). |
| `idx_part_transaction_ticket_part` | `part_transaction` | `(ticket_part_id) WHERE NOT NULL` | Tra cứu giao dịch xuất theo phiếu (UC8). |
