# Ghi chú đọc sơ đồ ERD L5

Sơ đồ gốc: [`diagrams/erd.drawio`](diagrams/erd.drawio). Tệp Draw.io được giữ nguyên; trang này giải thích nội dung sơ đồ và các điểm cần xác nhận.

## Các thực thể được vẽ

| Thực thể | Khóa/thuộc tính thấy trên sơ đồ | Quan hệ chính |
|---|---|---|
| `service_center` | `center_id` (PK), `center_code` (UQ), `center_name` | Nối với `part_stock`, `ticket_ref` và `part_transaction`. |
| `part` | `part_id` (PK), `part_code` (UQ), `part_name`, `unit_price` | Nối với `part_stock`, `part_transaction` và `ticket_part`. |
| `part_stock` | PK ghép (`center_id`, `part_id`), `quantity`, `min_threshold`, `updated_at` | Mỗi dòng là số dư của một linh kiện tại một trung tâm. |
| `ticket_ref` | `ticket_id` (PK), `center_id` (FK), `ticket_code` (UQ) | Đại diện tham chiếu phiếu bảo hành. |
| `part_transaction` | `transaction_id` (PK), `center_id`, `part_id`, `ticket_id` nullable, `type`, `quantity`, `occurred_at`, `reference` | Lưu giao dịch `NHAP`/`XUAT`; `ticket_id` không bắt buộc cho nhập. |
| `ticket_part` | `ticket_part_id` (PK), `ticket_id`, `part_id`, `transaction_id` | Nối phiếu và linh kiện với giao dịch liên quan. |

Sơ đồ có ký hiệu PK, FK, UQ và bội số quan hệ. Tên/khóa được ghi theo nội dung hình; đây không tự động là schema đã xác nhận của hệ thống.

## Đối chiếu với các tài liệu BT1

Sơ đồ ERD khác một số phần trong báo cáo BT1: báo cáo có đoạn DDL bổ sung `employee` và `employee_id`, trong khi hình không có; cấu trúc `ticket_part` trong hình dùng `ticket_part_id` và `transaction_id`, còn DDL trong báo cáo dùng khóa ghép theo `ticket_code`, trung tâm và linh kiện; cách xử lý `min_threshold` cũng chưa thống nhất. Báo cáo đồng thời lưu ý `ticket_ref` có thể chỉ là tham chiếu đến hệ thống phiếu bên ngoài.

Các khác biệt này cần được giải quyết trước khi dùng sơ đồ làm căn cứ triển khai. Bảng đối chiếu chi tiết nằm trong [`erd.md`](erd.md). Sơ đồ nguồn không được chỉnh sửa trong lần cập nhật tài liệu này.
