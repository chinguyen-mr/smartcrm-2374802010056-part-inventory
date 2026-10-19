# Nhật ký thay đổi thiết kế – Luồng L5 Kho linh kiện thay thế

Tài liệu này ghi nhận toàn bộ các quyết định điều chỉnh kỹ thuật giữa bản thiết kế BT1 và quá trình hiện thực BT2 theo yêu cầu của học phần Chuyên đề Tốt nghiệp 1 (Buổi 7 – Slide 23, Tiêu chí 5).

---

## Bảng tổng hợp các thay đổi kỹ thuật

| STT | Vấn đề / Phản hồi nguồn | Quyết định Giữ / Sửa | Lý do kỹ thuật | Ảnh hưởng | Trạng thái kiểm chứng |
|:---:|:---|:---:|:---|:---|:---:|
| **1** | Bảng `ticket_ref` trong BT1 chỉ có `(ticket_id, center_id, ticket_code)`, thiếu thông tin trạng thái phiếu để xác minh nghiệp vụ xuất kho. | **Sửa** (Bổ sung cột `status`) | Yêu cầu nghiệp vụ FR4 & UC2 quy định chỉ xuất kho khi phiếu ở trạng thái cho phép. Module L5 xem hệ thống phiếu là bên ngoài và sử dụng `ticket_ref` làm bảng tham chiếu mô phỏng cho `TicketAdapter`. Cột `status` là cần thiết để adapter kiểm tra allowlist. | Thêm cột `status VARCHAR(30) NOT NULL DEFAULT 'DANG_XU_LY'` vào bảng `ticket_ref` trong `db/sql-ddl.sql` và migration. | **ĐÃ KIỂM CHỨNG**: Migration và seed 7.805 phiếu thành công. |
| **2** | Ràng buộc `min_threshold` không thống nhất giữa các bản nháp BT1 (chỗ cho phép NULL, chỗ DEFAULT 0). | **Sửa / Chốt** (`NOT NULL DEFAULT 0`) | Thống nhất quy tắc QT-09: chỉ cảnh báo khi `quantity < min_threshold` và `min_threshold > 0`. Giá trị `0` biểu thị trạng thái mặc định chưa cấu hình ngưỡng (không cảnh báo). Tránh giá trị NULL gây phức tạp câu lệnh truy vấn SQL. | Bảng `part_stock` có cột `min_threshold INTEGER NOT NULL DEFAULT 0 CHECK (min_threshold >= 0)`. | **ĐÃ KIỂM CHỨNG**: Toàn bộ 717 dòng seed có `min_threshold >= 0`. Không có lỗi CHECK. |
| **3** | Khóa ngoại vòng giữa `ticket_part.transaction_id` và `part_transaction.ticket_part_id`. | **Giữ thiết kế DDL**, xử lý trong Seed & Service | Thiết kế BT1 định nghĩa quan hệ 1-1 giữa liên kết phiếu-linh kiện và giao dịch xuất. Nếu nạp đồng thời sẽ vi phạm ràng buộc Foreign Key. | Quy trình ghi dữ liệu: (1) Chèn `ticket_part` với `transaction_id = NULL`; (2) Chèn `part_transaction`; (3) Cập nhật `ticket_part.transaction_id`. | **ĐÃ KIỂM CHỨNG**: Nạp 4.063 giao dịch xuất lịch sử thành công 100%, 0 vi phạm FK. |
| **4** | Tách 3 màn hình giao diện (Wireframe vs Báo cáo). | **Chốt theo chỉ đạo** | Báo cáo và wireframe cũ có sự khác biệt giữa gộp hay tách form nhập/xuất. Quyết định chốt: M1 (Tra cứu tồn kho & cảnh báo), M2 (Nhập kho), M3 (Xuất kho cho phiếu bảo hành). | Frontend React xây dựng 3 màn hình riêng biệt, độc lập, gọi API qua client layer. | **ĐÃ KIỂM CHỨNG**: Đã hiện thực 3 màn hình `StockLookupScreen` (M1), `StockReceiptScreen` (M2), `StockIssueScreen` (M3) trong React 19 + Vite, gọi API thật qua `client.js`, build thành công. |
| **5** | Đề xuất allowlist trạng thái phiếu cho phép xuất kho. | **Đề xuất kỹ thuật (Prototype)** | Cần tiêu chí rõ ràng để `TicketAdapter` từ chối các phiếu không hợp lệ. Đề xuất: `DA_PHAN_CONG`, `DANG_XU_LY`, `CHO_LINH_KIEN`. | Giao dịch xuất kiểm tra điều kiện này; các phiếu `MOI`, `HOAN_TAT`, `DA_DONG`, `DA_HUY` bị từ chối `409 TICKET_STATUS_NOT_ELIGIBLE`. Lưu ý 4.063 phiếu lịch sử trong CSV có trạng thái `DA_DONG` vì là dữ liệu snapshot quá khứ. | **ĐÃ KIỂM CHỨNG**: Đã tạo các phiếu mẫu (active & invalid) trong seed script. |

---

## Chi tiết các quyết định

### 1. Bảng `ticket_ref` và ranh giới tích hợp
- **Bản chất:** `ticket_ref` là bảng mô phỏng dữ liệu tham chiếu nội bộ trong prototype của L5, không phải schema chính thức đã chốt của hệ thống phiếu bảo hành bên ngoài.
- **Ranh giới:** Module L5 không tạo phiếu, không sửa phiếu và không cập nhật trạng thái phiếu bảo hành.

### 2. Tính Idempotent của Migration và Seed
- Script `npm run migrate` thực hiện dọn dẹp và tái tạo cấu trúc DDL sạch từ `db/sql-ddl.sql`.
- Script `npm run seed` sử dụng mệnh đề `ON CONFLICT DO NOTHING`, cho phép người chấm hoặc lập trình viên chạy lại nhiều lần mà không gặp lỗi và không làm nhân đôi số lượng bản ghi (đáp ứng tiêu chí cốt lõi C5).
