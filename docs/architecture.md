# Kiến trúc đề xuất cho luồng L5

Kiến trúc L5 được mô tả theo bốn lớp: trình bày, nghiệp vụ, truy cập dữ liệu và lưu trữ. Sơ đồ nguồn là [`diagrams/architecture.drawio`](diagrams/architecture.drawio). Đây là phương án thiết kế cho BT1; không khẳng định toàn bộ các lớp, dịch vụ hay tích hợp đã có trong mã nguồn.

## Lớp và trách nhiệm

| Lớp | Thành phần đề xuất | Trách nhiệm |
|---|---|---|
| Trình bày | Màn hình tra cứu tồn; nhập kho; xuất kho theo phiếu; cảnh báo và lịch sử | Nhận thao tác, hiển thị dữ liệu và lỗi. Giao diện không tự quyết định một giao dịch là hợp lệ. |
| Nghiệp vụ | `StockQueryService`, `ReceiptService`, `IssueService`, `ThresholdService` | Áp dụng quy tắc L5, kiểm tra quyền và đầu vào, điều phối đọc/ghi tồn và lịch sử. Xuất kho xác minh phiếu qua ranh giới tích hợp bên ngoài. |
| Truy cập dữ liệu | `CatalogRepository`, `StockRepository`, `TransactionRepository` | Đóng gói truy vấn danh mục/trung tâm, số dư kho và sổ giao dịch. |
| Lưu trữ | PostgreSQL theo thiết kế | Lưu danh mục, tồn, giao dịch và dữ liệu tham chiếu phiếu theo mô hình được chốt. |

Sơ đồ hiện tại liệt kê `ticket_ref` như một thành phần dữ liệu trong PostgreSQL. Báo cáo BT1 lại mô tả đây có thể chỉ là tham chiếu đến hệ thống phiếu bên ngoài. Cần xác nhận ranh giới lưu trữ này trước khi xem `ticket_ref` là bảng vật lý.

## Luồng xử lý

### Tra cứu tồn kho

1. Người dùng yêu cầu danh sách tại một trung tâm.
2. API kiểm tra quyền truy cập trung tâm và chuyển yêu cầu đến `StockQueryService`.
3. Service lấy thông tin linh kiện và tồn từ repository, áp dụng bộ lọc/tìm kiếm.
4. Nếu chưa có dòng tồn cho cặp trung tâm/linh kiện, số lượng hiển thị theo yêu cầu nghiệp vụ là 0. Trạng thái cảnh báo được xác định từ số lượng và ngưỡng đã cấu hình.

### Nhập kho

1. QLTT gửi trung tâm, linh kiện, số lượng nguyên dương và tham chiếu tùy chọn.
2. `ReceiptService` kiểm tra quyền và dữ liệu, sau đó trong cùng transaction cập nhật/tạo dòng tồn và ghi một giao dịch `NHAP`.
3. Nếu có lỗi ở bất kỳ bước ghi nào, transaction được rollback để không lưu một phần.

### Xuất kho

1. KTV gửi trung tâm, linh kiện, phiếu và số lượng nguyên dương.
2. `IssueService` xác minh phiếu, trung tâm và trạng thái qua hệ thống phiếu bên ngoài.
3. Service khóa hoặc cập nhật nguyên tử dòng tồn, kiểm tra lại số lượng, ghi giao dịch `XUAT` và liên kết phiếu-linh kiện.
4. Nếu xác minh phiếu, kiểm tra tồn hoặc ghi CSDL thất bại, không được cập nhật một phần tồn hay lịch sử.

Giao thức xác minh phiếu và cơ chế khóa cụ thể là quyết định cần chốt khi triển khai. Chỉ kiểm tra tồn ở trình duyệt không đáp ứng yêu cầu xử lý đồng thời.

## Lập luận thiết kế gắn với NFR

| NFR | Lựa chọn đề xuất | Đánh đổi và cách xác minh |
|---|---|---|
| NFR1 — hiệu năng tra cứu | Lọc truy vấn theo trung tâm/linh kiện và cân nhắc index cho các trường lọc, sắp xếp. | Index tăng chi phí lưu trữ và ghi. Đo P95 theo quy mô dữ liệu/đồng thời đã nêu trong SRS; chưa có kết quả đo. |
| NFR2 — chính xác tồn | Cập nhật tồn và ghi giao dịch trong một transaction CSDL. | Cần rollback và xử lý lỗi. Đối chiếu số dư với tổng nhập trừ tổng xuất sau kiểm thử. |
| NFR3 — xuất đồng thời | Kiểm tra và cập nhật nguyên tử tại service/CSDL, khóa hoặc dùng phép cập nhật có điều kiện. | Có thể phát sinh chờ khi tranh chấp. Chạy kịch bản hai yêu cầu cùng xuất phần tồn cuối theo tiêu chí SRS. |

Các ngưỡng NFR là mục tiêu đề xuất trong báo cáo, không phải kết quả đã đạt. Trách nhiệm xác thực người dùng cũng phụ thuộc dịch vụ Identity hiện hữu; sơ đồ kiến trúc hiện tại chưa thể hiện rõ ranh giới này.

## Phạm vi ngoài L5

Quản lý khách hàng/đơn hàng, nhà cung cấp/đặt mua, tồn sản phẩm bán lẻ và dự báo AI nằm ngoài luồng L5 theo sơ đồ. Chức năng xem danh sách phiếu chờ linh kiện được SRS phân loại COULD, không thuộc phạm vi hiện thực cốt lõi.

## Điểm cần đồng bộ

- Xác định `ticket_ref` là bảng nội bộ, bản sao tham chiếu hay chỉ là adapter đến hệ thống phiếu.
- Chốt nguồn xác thực và cách truyền `employee_id`, vai trò, danh sách trung tâm được phép.
- Đồng bộ các bảng và luồng giao dịch với ERD; hiện sơ đồ ERD, DDL trong báo cáo và mô hình mô tả chưa thống nhất.
- Đối chiếu tên màn hình của sơ đồ kiến trúc với wireframe hiện tại: kiến trúc mô tả cả cảnh báo/lịch sử, trong khi wireframe chia ba màn hình theo một bố cục khác.
