# Mô tả Kiến trúc Mô hình Dữ liệu Quan hệ (ERD) — Luồng L5

Sơ đồ trực quan: [`diagrams/erd.drawio`](diagrams/erd.drawio) (định dạng Diagrams.net / Draw.io).  
Nguồn sự thật DDL: [`sql/sql-ddl.sql`](../sql/sql-ddl.sql).

---

## 1. Tổng quan thiết kế mô hình thực thể — quan hệ

Mô hình dữ liệu luồng L5 (Quản lý kho linh kiện thay thế) được thiết kế theo chuẩn dạng chuẩn 3 (3NF) trên hệ quản trị cơ sở dữ liệu PostgreSQL 15+. Mô hình gồm **7 thực thể** được phân định theo 3 cụm logic chặt chẽ:

```
[ Cụm Tổ chức & Tác nhân ]       [ Cụm Linh kiện & Tồn kho ]      [ Cụm Nghiệp vụ Xuất/Nhập ]
     service_center                     part                              ticket_ref
           │                             │                                    │
           ├──< employee                 ├──< part_stock >── service_center   └──< ticket_part >── part
           │                             │                                              │ (1 - 1 khi XUẤT)
           └──< part_transaction >───────┴──────────────────────────────────────────────┘
```

---

## 2. Chi tiết các cụm thực thể và quyết định thiết kế

### 2.1 Cụm Tổ chức và Nhân sự (`service_center`, `employee`)
- **`service_center`**: Thực thể gốc phân chia ranh giới vật lý và quyền hạn (QT-14). Khóa chính `center_id` (BIGINT IDENTITY).
- **`employee`**: Lưu trữ 38 nhân sự kỹ thuật và quản lý từ dataset gốc (`technicians.csv`). Mỗi nhân viên thuộc đúng một trung tâm (`center_id` FK).
  - Phân định 2 vai trò nghiệp vụ chính trong L5:
    - `QUAN_LY_TRUNG_TAM`: Có toàn quyền nhập kho (`POST /api/stock/receipts`) và cấu hình ngưỡng cảnh báo tồn kho (`PUT /api/stock/thresholds`).
    - `KTV`: Kỹ thuật viên tra cứu danh mục, tồn kho và thực hiện xuất kho linh kiện theo phiếu sửa chữa (`POST /api/stock/issues`).

### 2.2 Cụm Danh mục và Số dư tồn kho (`part`, `part_stock`)
- **`part`**: Danh mục 180 linh kiện chuẩn hóa dùng chung toàn hệ thống Mekong Mobile. Khóa chính `part_id` (BIGINT IDENTITY), đơn giá `unit_price NUMERIC(12,2) >= 0`.
- **`part_stock`**: Bảng cầu thể hiện số dư tồn kho vật lý tại từng trung tâm.
  - **Khóa chính ghép**: `(center_id, part_id)` đảm bảo mỗi linh kiện tại một trung tâm chỉ tồn tại duy nhất một dòng số dư.
  - **Ràng buộc toàn vẹn số học**: `quantity >= 0` ngăn chặn triệt để tình trạng xuất âm kho.
  - **Ngưỡng cảnh báo**: `min_threshold INTEGER >= 0 NOT NULL DEFAULT 0`. Mặc định bằng 0 nghĩa là chưa cấu hình ngưỡng cảnh báo, hệ thống không báo động giả khi kho mới khởi tạo.

### 2.3 Cụm Giao dịch và Phiếu bảo hành (`ticket_ref`, `ticket_part`, `part_transaction`)
- **`ticket_ref`**: Lưu trữ thông tin tham chiếu phiếu bảo hành nội bộ trung tâm. Khóa chính `ticket_id`, mã phiếu nghiệp vụ duy nhất `ticket_code UNIQUE`, trạng thái phiếu `status` (kiểm tra allowlist: chỉ cho phép xuất khi phiếu đang ở trạng thái hợp lệ như `DANG_XU_LY`, `CHO_LINH_KIEN`, `DA_PHAN_CONG`).
- **`ticket_part`**: Đại diện cho yêu cầu linh kiện thay thế gắn liền với phiếu sửa chữa cụ thể.
  - Khóa chính kỹ thuật đơn `ticket_part_id` (BIGINT IDENTITY) thay vì khóa ghép, cho phép mở rộng hỗ trợ nhiều lần thay thế cùng một mã linh kiện trong các giai đoạn xử lý phiếu khác nhau.
- **`part_transaction`**: Sổ cái ghi nhận lịch sử biến động kho bất biến (Append-Only theo QT-13). Không cho phép UPDATE hoặc DELETE dữ liệu giao dịch đã ghi sổ.
  - Phân loại rõ ràng:
    - **`NHAP`**: Giao dịch bổ sung kho từ nhà cung cấp. Yêu cầu `ticket_part_id IS NULL`, có thể kèm số chứng từ nhập trong `reference`.
    - **`XUAT`**: Giao dịch xuất sử dụng cho sửa chữa. Ràng buộc toàn vẹn bắt buộc `ticket_part_id IS NOT NULL`, liên kết 1-1 chặt chẽ với bản ghi `ticket_part`.

---

## 3. Quy ước ký hiệu Crow's Foot trong sơ đồ

1. **`service_center ||--o{ employee`**: Một trung tâm bảo hành có thể có 0 hoặc nhiều nhân viên; một nhân viên bắt buộc thuộc về đúng một trung tâm.
2. **`service_center ||--o{ part_stock`** và **`part ||--o{ part_stock`**: Mỗi dòng tồn kho là một cặp duy nhất giữa một trung tâm và một linh kiện.
3. **`service_center ||--o{ ticket_ref`**: Phiếu bảo hành luôn được phân bổ về một trung tâm cụ thể để kiểm tra tính hợp lệ vùng kho (QT-14).
4. **`ticket_ref ||--o{ ticket_part`**: Một phiếu sửa chữa có thể yêu cầu 0 hoặc nhiều linh kiện thay thế.
5. **`ticket_part |o--o| part_transaction`**: Quan hệ 1-1 đối với giao dịch loại `XUAT`. Một dòng yêu cầu linh kiện xuất xưởng ứng với đúng một giao dịch ghi nhận trừ kho trong sổ cái.

---

## 4. Tối ưu hóa chỉ mục (Indexing Strategy)

Sơ đồ ERD đi kèm thiết kế các chỉ mục chuyên biệt đảm bảo hiệu năng truy vấn dưới 200ms:
- `idx_part_stock_alert (center_id, quantity, min_threshold)`: Tối ưu hóa lọc nhanh các mã linh kiện chạm ngưỡng cảnh báo phục vụ Dashboard quản lý kho.
- `idx_part_transaction_history (center_id, part_id, occurred_at DESC)`: Tối ưu hóa xuất sao kê lịch sử biến động kho theo dòng thời gian.
- `idx_part_transaction_ticket_part (ticket_part_id) WHERE ticket_part_id IS NOT NULL`: Tối ưu hóa tra cứu nguồn gốc xuất kho theo phiếu sửa chữa.
