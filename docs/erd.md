# Mô hình dữ liệu cho luồng L5

Tài liệu này giải thích mô hình dữ liệu của BT1 và đối chiếu với sơ đồ [`diagrams/erd.drawio`](diagrams/erd.drawio). Mô hình là thiết kế đề xuất; cần giải quyết các khác biệt được nêu ở cuối tài liệu trước khi chốt DDL hoặc migration.

## Thực thể trong sơ đồ ERD

| Bảng | Khóa | Thuộc tính chính | Vai trò |
|---|---|---|---|
| `service_center` | `center_id` (PK) | `center_code` (duy nhất), `center_name` | Danh mục trung tâm bảo hành. |
| `part` | `part_id` (PK) | `part_code` (duy nhất), `part_name`, `unit_price` | Danh mục linh kiện thay thế. |
| `part_stock` | (`center_id`, `part_id`) (PK ghép, FK) | `quantity >= 0`, `min_threshold`, `updated_at` | Số dư hiện tại cho một cặp trung tâm/linh kiện; mỗi cặp tối đa một dòng. |
| `ticket_ref` | `ticket_id` (PK) | `center_id` (FK), `ticket_code` (duy nhất) | Tham chiếu phiếu bảo hành theo thiết kế trong sơ đồ. Cần xác nhận dữ liệu có thực sự lưu nội bộ hay do hệ thống ngoài quản lý. |
| `part_transaction` | `transaction_id` (PK) | `center_id`, `part_id`, `ticket_id` có thể rỗng, `type`, `quantity > 0`, `occurred_at`, `reference` | Sổ lịch sử nhập/xuất; `type` là `NHAP` hoặc `XUAT`. |
| `ticket_part` | `ticket_part_id` (PK) | `ticket_id` (FK), `part_id` (FK), `transaction_id` (FK) | Liên kết phiếu, linh kiện và giao dịch xuất tương ứng. |

Quan hệ chính: một trung tâm và một linh kiện có thể xuất hiện trong nhiều dòng tồn/giao dịch; một phiếu có thể liên quan đến nhiều giao dịch/linh kiện. Chi tiết bội số và tính duy nhất cần được chốt cùng quy tắc chống ghi trùng giao dịch.

## Đối chiếu với bộ dữ liệu L5

Kiểm tra chỉ đọc các tệp `parts.csv`, `service_centers.csv`, `part_stock.csv`, `part_transactions.csv` và `tickets_history.csv` trong bộ dữ liệu tham chiếu cho thấy:

- Có 180 linh kiện và 6 trung tâm, tương đương 1.080 tổ hợp trung tâm/linh kiện có thể có; `part_stock.csv` có 717 dòng và không có cặp trùng.
- Có 4.954 giao dịch: 891 `NHAP` và 4.063 `XUAT`. Mọi `part_id`/`center_id` trong giao dịch khớp danh mục; mọi mã phiếu của dòng `XUAT` khớp `tickets_history.csv`.
- Các khóa `part_id`, `part_code`, `center_id`, `center_code`, `transaction_id`, `ticket_id` và `ticket_code` không bị trùng trong các tệp tương ứng. Số lượng giao dịch đều là số nguyên dương; đơn giá không âm; ngày giao dịch đọc được.
- Không có số lượng tồn hoặc ngưỡng âm trong các dòng tồn quan sát được. Các ngưỡng hiện có đều được điền (từ 3 đến 8), nên mẫu dữ liệu không quyết định chính sách cho ngưỡng chưa cấu hình.
- Theo tổng hợp toàn bộ các giao dịch trong bộ mẫu, số tồn từng cặp khớp tổng `NHAP` trừ `XUAT`. Đây chỉ là tính nhất quán số học của bộ mẫu; `part_stock.csv` không cung cấp ngày snapshot để xác định dữ liệu là tồn tại thời điểm nào.

Các tệp CSV là dữ liệu tham chiếu, không phải bằng chứng rằng schema Draw.io hoặc DDL hiện tại đã chạy trên cơ sở dữ liệu thật.

## Quy tắc dữ liệu

- Số lượng tồn không âm; lượng của mỗi giao dịch là số nguyên dương.
- `part_code` là duy nhất; đơn giá không âm.
- Giao dịch nhập không cần phiếu; giao dịch xuất phải gắn với phiếu hợp lệ và đúng trung tâm.
- Giao dịch đã ghi là lịch sử, không sửa hoặc xóa vật lý theo QT-13.
- Cảnh báo được tính khi `quantity < min_threshold`; bằng ngưỡng thì không cảnh báo.
- Nếu chưa có dòng tồn, nghiệp vụ tra cứu hiển thị số lượng 0. Cách tạo dòng tồn và trạng thái ngưỡng chưa cấu hình cần được thống nhất.

## Khác biệt cần giải quyết trước khi chốt mô hình

| Chủ đề | Báo cáo BT1 / tài liệu mô tả | ERD Draw.io | Việc cần quyết định |
|---|---|---|---|
| Nhân viên thực hiện | Phần DDL trong báo cáo có bảng `employee` và `employee_id` trong `part_transaction`; phần mô tả cũng ghi nhận nguồn định danh chưa xác nhận. | Không có bảng `employee` và không có thuộc tính người thực hiện trên giao dịch. | Xác nhận yêu cầu lưu người thực hiện và nguồn định danh. Không thêm/bỏ FK trước khi chốt. |
| Tham chiếu phiếu | Một số phần của báo cáo dùng `ticket_ref`/`ticket_id`; DDL ở cuối lại dùng `ticket_code` trong giao dịch và `ticket_part`, không tạo `ticket_ref`. | Có `ticket_ref.ticket_id`; `part_transaction.ticket_id` và `ticket_part.ticket_id`. | Xác nhận phiếu là dữ liệu nội bộ hay chỉ được xác minh từ hệ thống ngoài, rồi chọn một kiểu liên kết thống nhất. |
| `ticket_part` | Phần mô tả bảng nêu `ticket_part_id`, `ticket_id`, `part_id`, `transaction_id`; DDL trong báo cáo lại dùng khóa ghép `(ticket_code, center_id, part_id)` và không có `transaction_id`. | Dùng khóa thay thế `ticket_part_id` và FK tới `transaction_id`. | Chọn một cấu trúc duy nhất, bảo đảm một giao dịch xuất liên kết đúng phiếu và linh kiện. |
| Ngưỡng cảnh báo | DDL báo cáo cho phép `min_threshold` rỗng; phần mô tả thuộc tính ghi `NOT NULL`. | Sơ đồ ghi `min_threshold >= 0`, không làm rõ có thể rỗng hay không. | Chốt cách biểu diễn ngưỡng chưa được cấu hình và quy tắc cảnh báo tương ứng. |
| Tên/kiểu bảng | Báo cáo có đề xuất `service_center`, `ticket_ref` và một số kiểu khóa cần xác nhận. | ERD dùng `ticket_id BIGINT`; bảng phiếu là tham chiếu nội bộ trong hình. | Đối chiếu schema Smart CRM và hợp đồng tích hợp trước khi thiết kế migration. |

## Kiểm tra ERD theo yêu cầu Buổi 6

- Bảng tồn tại độc lập với sổ giao dịch để tra cứu nhanh; lịch sử nhập/xuất được lưu riêng ở `part_transaction`.
- Không lưu cờ cảnh báo trùng lặp nếu có thể suy ra từ số lượng và ngưỡng.
- Các khóa chính kỹ thuật được dùng cho các thực thể chính; `part_stock` dùng khóa ghép theo cặp trung tâm/linh kiện.
- Các index cần dựa trên truy vấn thực tế, tối thiểu xem xét truy vấn lịch sử theo trung tâm, linh kiện, thời gian và theo phiếu.
- Sơ đồ hiện không thể hiện nhân viên; cần đánh giá lại yêu cầu lưu người thực hiện trước khi kết luận rằng toàn bộ thực thể cần thiết đã có.

Không tuyên bố DDL đã chạy hoặc ERD đã được chốt. Cần kiểm tra khóa ngoại ghép, ràng buộc duy nhất, cập nhật tồn đồng thời và tính nhất quán giữa `part_transaction` với `ticket_part` khi thống nhất mô hình.
