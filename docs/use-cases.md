# Đặc tả Use Case cho luồng L5

Sơ đồ tác nhân và Use Case được lưu tại [`diagrams/usecase.drawio`](diagrams/usecase.drawio). Mã Use Case trong tài liệu này theo SRS: UC1–UC8 thuộc phạm vi cốt lõi; UC9 là chức năng COULD.

## Danh mục Use Case

| Mã | Tên | Tác nhân chính | Story / FR |
|---|---|---|---|
| UC1 | Tra cứu tồn kho linh kiện | KTV, QLTT | US1 / FR1 |
| UC2 | Ghi nhận xuất kho cho phiếu bảo hành | KTV; hệ thống phiếu hỗ trợ | US2 / FR2–FR4, FR9 |
| UC3 | Ghi nhận nhập kho linh kiện | QLTT | US3 / FR5, FR9 |
| UC4 | Xác định cảnh báo tồn dưới ngưỡng | Hệ thống | US4 / FR6 |
| UC5 | Xem danh sách cảnh báo | QLTT | US4 / FR7 |
| UC6 | Thiết lập ngưỡng cảnh báo | QLTT | US5 / FR8 |
| UC7 | Xem lịch sử giao dịch kho | QLTT | US6 / FR10 |
| UC8 | Xem linh kiện đã xuất cho phiếu | KTV | US7 / FR11 |
| UC9 | Xem danh sách phiếu chờ linh kiện | QLTT | US8 / COULD, ngoài phạm vi hiện thực chính |

## UC2 — Ghi nhận xuất kho cho phiếu bảo hành

**Mục tiêu:** Ghi nhận lượng linh kiện sử dụng cho phiếu hợp lệ và cập nhật tồn kho.

**Tiền điều kiện:** KTV đã xác thực, được phép thao tác tại trung tâm; linh kiện có trong danh mục.

**Hậu điều kiện thành công:** Một giao dịch `XUAT` được lưu, tồn giảm đúng lượng và liên kết phiếu/linh kiện được ghi nhận nhất quán.

**Hậu điều kiện thất bại:** Tồn kho và lịch sử không thay đổi.

### Luồng chính

1. KTV chọn trung tâm và linh kiện.
2. Hệ thống hiển thị số lượng tồn; nếu chưa có dòng tồn, hiển thị 0.
3. KTV nhập mã phiếu và số lượng nguyên dương.
4. Hệ thống kiểm tra quyền và gửi yêu cầu xác minh phiếu, trung tâm, trạng thái đến hệ thống phiếu bảo hành.
5. Hệ thống kiểm tra tồn và bảo đảm lượng xuất không vượt tồn hiện tại.
6. Hệ thống thực hiện thao tác ghi nguyên tử: ghi giao dịch, cập nhật tồn và liên kết phiếu/linh kiện.
7. Hệ thống trả kết quả cùng số lượng tồn sau giao dịch.

### Luồng thay thế và ngoại lệ

| Nhánh | Kết quả |
|---|---|
| Số lượng rỗng, không nguyên hoặc không dương | Trả lỗi kiểm tra dữ liệu; không ghi thay đổi. |
| Không tìm thấy phiếu | Từ chối; tồn và lịch sử giữ nguyên. |
| Phiếu thuộc trung tâm khác | Từ chối; tồn và lịch sử giữ nguyên. |
| Trạng thái phiếu không cho phép xuất | Từ chối. Tập trạng thái phải được chủ hệ thống phiếu xác nhận. |
| Không đủ tồn tại thời điểm xử lý | Từ chối và hiển thị tồn hiện tại; không ghi giao dịch. |
| Hai yêu cầu đồng thời tranh chấp tồn | Kiểm tra lại tồn trong thao tác nguyên tử; chỉ chấp nhận yêu cầu còn đủ tồn. |
| Lỗi CSDL hoặc dịch vụ phiếu | Không để lại thay đổi tồn/lịch sử một phần; trả lỗi phù hợp. |

## UC3 — Ghi nhận nhập kho linh kiện

**Tác nhân:** QLTT.

**Tiền điều kiện:** QLTT được cấp quyền tại trung tâm; linh kiện tồn tại.

**Luồng chính:** QLTT chọn trung tâm/linh kiện, nhập số lượng nguyên dương và xác nhận. Hệ thống kiểm tra quyền, tạo dòng tồn nếu cần, tăng tồn và ghi một giao dịch `NHAP` trong cùng transaction. Hệ thống trả mã giao dịch và tồn mới.

**Ngoại lệ:** Dữ liệu sai trả lỗi validation; không có quyền trả lỗi phân quyền; linh kiện/trung tâm không tồn tại trả lỗi tài nguyên; lỗi ghi dữ liệu phải rollback toàn bộ. Trong mọi trường hợp thất bại, không đổi một phần tồn hoặc lịch sử.

## Các Use Case còn lại

### UC1 — Tra cứu tồn kho linh kiện

KTV hoặc QLTT chọn trung tâm nằm trong phạm vi được cấp, có thể tìm theo mã/tên và xem thông tin linh kiện, tồn, ngưỡng cùng trạng thái cảnh báo. Dòng tồn chưa được tạo hiển thị số lượng 0. Không trả dữ liệu của trung tâm ngoài quyền.

### UC4 — Xác định cảnh báo tồn dưới ngưỡng

Hệ thống xác định trạng thái từ `quantity < min_threshold`. Khi tồn bằng hoặc cao hơn ngưỡng thì không cảnh báo. Nếu ngưỡng chưa được cấu hình, cách xử lý cần theo quyết định dữ liệu cuối cùng; không tự suy ra ngưỡng mặc định.

### UC5 — Xem danh sách cảnh báo

QLTT xem các linh kiện đang dưới ngưỡng trong trung tâm được cấp, gồm mã/tên linh kiện, số lượng và ngưỡng. Có thể lọc và phân trang theo thiết kế giao diện/API.

### UC6 — Thiết lập ngưỡng cảnh báo

QLTT đặt ngưỡng nguyên không âm cho một cặp trung tâm/linh kiện. Hệ thống kiểm tra quyền và dữ liệu, lưu ngưỡng, sau đó trạng thái cảnh báo được tính lại. Giá trị rỗng trước khi cấu hình cần được thống nhất với ERD.

### UC7 — Xem lịch sử giao dịch kho

QLTT lọc lịch sử theo trung tâm, linh kiện, loại giao dịch và khoảng ngày. Kết quả được sắp xếp theo thời gian và phân trang. Giao dịch đã ghi chỉ được đọc; không xóa hoặc sửa vật lý.

### UC8 — Xem linh kiện đã xuất cho phiếu

KTV nhập mã phiếu và xem các dòng linh kiện đã xuất trong phạm vi trung tâm được cấp. Chỉ trả các giao dịch `XUAT` liên quan; không thay đổi trạng thái phiếu.

### UC9 — Xem danh sách phiếu chờ linh kiện (COULD)

Chức năng này nằm ngoài phạm vi hiện thực chính của BT1. Quy tắc xác định phiếu chờ và cách lấy dữ liệu phụ thuộc hệ thống phiếu, cần được làm rõ trước khi triển khai.

## Các quyết định còn mở

- Tập trạng thái phiếu cho phép xuất và API xác minh phiếu.
- Cơ chế xác thực, quyền theo trung tâm và cách lưu người thực hiện giao dịch.
- Cấu trúc liên kết `ticket_ref`/`ticket_part` với giao dịch xuất.
- Quy tắc ngưỡng khi chưa được cấu hình.
- Bộ màn hình chính thức: sơ đồ wireframe Draw.io hiện có gộp nhập/xuất vào M2 và dành M3 cho lịch sử; báo cáo Word mô tả M2 là nhập, M3 là xuất. Cần chọn một cách đánh số trước khi nộp để mã màn hình không gây hiểu nhầm.
